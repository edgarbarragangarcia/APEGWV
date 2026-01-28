import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';

interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useGeoLocation = () => {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [isRequesting, setIsRequesting] = useState(false);
    const watcherRef = useRef<string | null>(null);
    const locationRef = useRef<Coordinates | null>(null);

    const startWatching = async () => {
        if (watcherRef.current !== null) return;

        try {
            const watchId = await Geolocation.watchPosition(
                {
                    enableHighAccuracy: false, // Usar baja precisión para actualizaciones continuas
                    timeout: 10000,
                    maximumAge: 30000 // Cache de 30s para reducir consumo
                },
                (position, err) => {
                    if (err) {
                        console.error('GPS Watch Error:', err);
                        setError(err.message);
                        setIsRequesting(false);
                        return;
                    }

                    if (position) {
                        console.log('GPS Updated:', position.coords.latitude, position.coords.longitude);
                        const newLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        setLocation(newLocation);
                        locationRef.current = newLocation;
                        setError(null);
                        setPermissionStatus('granted');
                        setIsRequesting(false);
                    }
                }
            );
            watcherRef.current = watchId;
        } catch (err: any) {
            console.error('Failed to start watching position:', err);
            setError(err.message);
        }
    };

    const getInitialLocation = async (useHighAccuracy = true, retryCount = 0) => {
        const timeout = useHighAccuracy ? 8000 : 5000;
        console.log(`Attempting location fetch (high accuracy: ${useHighAccuracy}, attempt: ${retryCount + 1})`);

        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: useHighAccuracy,
                timeout,
                maximumAge: 0
            });

            console.log(`✅ Got location: ${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)} (accuracy: ${position.coords.accuracy}m)`);
            const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            setLocation(newLocation);
            locationRef.current = newLocation;
            setPermissionStatus('granted');
            await startWatching();
        } catch (err: any) {
            console.error(`❌ GPS fetch failed:`, err);

            if (err.message?.includes('denied') || err.message?.includes('permission')) {
                setPermissionStatus('denied');
            } else if (useHighAccuracy && retryCount === 0) {
                // Fallback: intentar con baja precisión si alta precisión falla
                console.log('🔄 Falling back to low accuracy mode...');
                setTimeout(() => getInitialLocation(false, 0), 500);
            } else if (retryCount < 1) {
                // Un último intento
                console.log('🔄 Final retry...');
                setTimeout(() => getInitialLocation(false, retryCount + 1), 2000);
            } else {
                console.error('⚠️ All location attempts failed');
                setError('No se pudo obtener ubicación precisa');
            }
        }
    };

    useEffect(() => {
        const checkPermissionsAndGetLocation = async () => {
            try {
                const permission = await Geolocation.checkPermissions();
                console.log('Initial permission check:', permission);

                if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                    setPermissionStatus('granted');
                    getInitialLocation();
                } else if (permission.location === 'denied') {
                    setPermissionStatus('denied');
                } else {
                    setPermissionStatus('prompt');
                }
            } catch (err) {
                console.error('Error checking permissions:', err);
                setPermissionStatus('prompt');
            }
        };

        checkPermissionsAndGetLocation();

        return () => {
            if (watcherRef.current !== null) {
                Geolocation.clearWatch({ id: watcherRef.current });
            }
        };
    }, []);

    // Fórmula de Haversine para calcular distancia en metros
    const calculateDistance = (targetLat: number, targetLon: number): number | null => {
        if (!location) return null;

        const R = 6371e3; // Radio de la tierra en metros
        const φ1 = location.latitude * Math.PI / 180;
        const φ2 = targetLat * Math.PI / 180;
        const Δφ = (targetLat - location.latitude) * Math.PI / 180;
        const Δλ = (targetLon - location.longitude) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return Math.round(R * c);
    };

    const requestPermission = async () => {
        setIsRequesting(true);
        setError(null);

        try {
            // Primero solicitar permisos
            const permission = await Geolocation.requestPermissions();
            console.log('Permission requested:', permission);

            if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                setPermissionStatus('granted');

                // Intentar primero con alta precisión, luego con baja
                try {
                    const position = await Geolocation.getCurrentPosition({
                        enableHighAccuracy: true,
                        timeout: 8000
                    });

                    const newLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    };
                    setLocation(newLocation);
                    locationRef.current = newLocation;
                    setIsRequesting(false);
                    await startWatching();
                } catch (err: any) {
                    console.error('High accuracy refresh failed, trying low accuracy:', err);

                    // Fallback a baja precisión
                    try {
                        const position = await Geolocation.getCurrentPosition({
                            enableHighAccuracy: false,
                            timeout: 5000
                        });

                        const newLocation = {
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude
                        };
                        setLocation(newLocation);
                        locationRef.current = newLocation;
                        setIsRequesting(false);
                        await startWatching();
                    } catch (err2: any) {
                        console.error('Manual request failed completely:', err2);
                        setError(err2.message);
                        setIsRequesting(false);
                    }
                }
            } else {
                setPermissionStatus('denied');
                setIsRequesting(false);
            }
        } catch (err: any) {
            console.error('Permission request failed:', err);
            setError(err.message);
            setIsRequesting(false);
            if (err.message?.includes('denied')) {
                setPermissionStatus('denied');
            }
        }
    };

    return {
        location,
        error,
        calculateDistance,
        permissionStatus,
        requestPermission,
        refreshLocation: requestPermission, // Alias para claridad
        isRequesting
    };
};
