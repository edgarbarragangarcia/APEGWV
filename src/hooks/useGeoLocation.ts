import { useState, useEffect, useRef } from 'react';

interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useGeoLocation = () => {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>(
        (localStorage.getItem('perm_gps') as any) || 'unknown'
    );
    const [isRequesting, setIsRequesting] = useState(false);
    const watcherRef = useRef<number | null>(null);
    const locationRef = useRef<Coordinates | null>(null);

    const startWatching = () => {
        if (!navigator.geolocation || watcherRef.current !== null) return;

        const handleSuccess = (position: GeolocationPosition) => {
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
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error('GPS Watch Error:', error);
            setError(error.message);
            setIsRequesting(false);
            if (error.code === error.PERMISSION_DENIED) {
                setPermissionStatus('denied');
                localStorage.setItem('perm_gps', 'denied');
            }
        };

        watcherRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: false, // Usar baja precisión para actualizaciones continuas
            timeout: 10000,
            maximumAge: 30000 // Cache de 30s para reducir consumo
        });
    };

    const getInitialLocation = (useHighAccuracy = true, retryCount = 0) => {
        if (!navigator.geolocation) return;

        const timeout = useHighAccuracy ? 8000 : 5000;
        console.log(`Attempting location fetch (high accuracy: ${useHighAccuracy}, attempt: ${retryCount + 1})`);

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log(`✅ Got location: ${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)} (accuracy: ${pos.coords.accuracy}m)`);
                const newLocation = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                setLocation(newLocation);
                locationRef.current = newLocation;
                setPermissionStatus('granted');
                startWatching();
            },
            (err) => {
                console.error(`❌ GPS fetch failed (code ${err.code}):`, err.message);

                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                    localStorage.setItem('perm_gps', 'denied');
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
            },
            {
                enableHighAccuracy: useHighAccuracy,
                timeout,
                maximumAge: 0
            }
        );
    };

    useEffect(() => {
        // Helper to handle sticky status
        const updateStickyStatus = (newStatus: PermissionState) => {
            const local = localStorage.getItem('perm_gps');
            if (local === 'granted' && (newStatus === 'prompt' || (newStatus as any) === 'unknown')) {
                return;
            }
            setPermissionStatus(newStatus);
            localStorage.setItem('perm_gps', newStatus);
        };

        // Intento directo de obtener ubicación y permisos
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' as any })
                .then((result) => {
                    updateStickyStatus(result.state);
                    if (result.state === 'granted') {
                        getInitialLocation();
                    }
                    result.onchange = () => {
                        updateStickyStatus(result.state);
                        // Solo intentar obtener ubicación si no la tenemos aún
                        if (result.state === 'granted' && !locationRef.current) {
                            getInitialLocation();
                        }
                    };
                })
                .catch(() => {
                    // Fallback para navegadores sin Permissions API robusto
                    getInitialLocation();
                });
        } else {
            // Fallback total (móviles antiguos/ciertos webviews)
            getInitialLocation();
        }

        return () => {
            if (watcherRef.current !== null) {
                navigator.geolocation.clearWatch(watcherRef.current);
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

    const requestPermission = () => {
        if (!navigator.geolocation) {
            setError('Geolocation not supported');
            return;
        }
        setIsRequesting(true);
        setError(null);

        // Intentar primero con alta precisión, luego con baja
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const newLocation = {
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                };
                setLocation(newLocation);
                locationRef.current = newLocation;
                setPermissionStatus('granted');
                setIsRequesting(false);
                startWatching();
            },
            (err) => {
                console.error('High accuracy refresh failed, trying low accuracy:', err);
                // Fallback a baja precisión
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        const newLocation = {
                            latitude: pos.coords.latitude,
                            longitude: pos.coords.longitude
                        };
                        setLocation(newLocation);
                        locationRef.current = newLocation;
                        setPermissionStatus('granted');
                        setIsRequesting(false);
                        startWatching();
                    },
                    (err2) => {
                        console.error('Manual request failed completely:', err2);
                        setError(err2.message);
                        setIsRequesting(false);
                        if (err2.code === err2.PERMISSION_DENIED) {
                            setPermissionStatus('denied');
                            localStorage.setItem('perm_gps', 'denied');
                        }
                    },
                    { enableHighAccuracy: false, timeout: 5000 }
                );
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
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
