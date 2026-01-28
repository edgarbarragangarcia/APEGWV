import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

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
        const timeout = useHighAccuracy ? 10000 : 7000;
        console.log(`[useGeoLocation] Attempting fetch: highAccuracy=${useHighAccuracy}, attempt=${retryCount + 1}`);

        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: useHighAccuracy,
                timeout,
                maximumAge: retryCount > 0 ? 30000 : 0
            });

            console.log(`[useGeoLocation] ✅ Location obtained: ${position.coords.latitude}, ${position.coords.longitude}`);
            const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            };
            setLocation(newLocation);
            locationRef.current = newLocation;
            setPermissionStatus('granted');
            setError(null);
            await startWatching();
        } catch (err: any) {
            console.warn(`[useGeoLocation] ❌ Fetch failed (attempt ${retryCount + 1}):`, err.message);

            if (err.message?.toLowerCase().includes('denied') || err.code === 1) {
                setPermissionStatus('denied');
                setError('Permiso denegado por el usuario');
                return;
            }

            // Fallback strategy
            if (useHighAccuracy && retryCount === 0) {
                console.log('[useGeoLocation] 🔄 Retrying with low accuracy...');
                setTimeout(() => getInitialLocation(false, 0), 1000);
            } else if (retryCount < 2) {
                console.log(`[useGeoLocation] 🔄 Retrying in 3s... (Attempt ${retryCount + 2})`);
                setTimeout(() => getInitialLocation(false, retryCount + 1), 3000);
            } else {
                console.error('[useGeoLocation] ⚠️ All attempts failed');
                setError('No se pudo obtener una ubicación estable. Verifica que el GPS esté activo.');
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

        // Listen for app resume to re-check permissions automatically
        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('[useGeoLocation] App resumed, re-checking permissions...');
                checkPermissionsAndGetLocation();
            }
        });

        return () => {
            if (watcherRef.current !== null) {
                Geolocation.clearWatch({ id: watcherRef.current });
            }
            appStateListener.then(l => l.remove());
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
            // Soporte para modo WEB (navegador/WebView PWA)
            if (Capacitor.getPlatform() === 'web') {
                console.log('[useGeoLocation] Requesting location via browser API...');
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: true,
                        timeout: 10000
                    });
                });
                const newLocation = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                setLocation(newLocation);
                locationRef.current = newLocation;
                setPermissionStatus('granted');
                setIsRequesting(false);
                await startWatching();
                return;
            }

            // Modo NATIVO
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
