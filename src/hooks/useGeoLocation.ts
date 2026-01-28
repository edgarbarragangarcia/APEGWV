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

    const startWatching = () => {
        if (!navigator.geolocation || watcherRef.current !== null) return;

        const handleSuccess = (position: GeolocationPosition) => {
            console.log('GPS Updated:', position.coords.latitude, position.coords.longitude);
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
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
            enableHighAccuracy: true, // Cambiado a true para mayor precisión en el campo
            timeout: 15000,
            maximumAge: 10000 // Cache de 10s máximo
        });
    };

    const getInitialLocation = (retryCount = 0) => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                console.log('Got Initial Location:', pos.coords.latitude, pos.coords.longitude);
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
                setPermissionStatus('granted');
                startWatching();
            },
            (err) => {
                console.error('Initial GPS fetch failed:', err);
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                    localStorage.setItem('perm_gps', 'denied');
                } else if (retryCount < 2) {
                    // Reintentar si es error de timeout o posición no disponible
                    console.log('Retrying GPS fetch...');
                    setTimeout(() => getInitialLocation(retryCount + 1), 2000);
                }
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
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
                        if (result.state === 'granted') getInitialLocation();
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

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
                setPermissionStatus('granted');
                setIsRequesting(false);
                startWatching();
            },
            (err) => {
                console.error('Manual request failed:', err);
                setError(err.message);
                setIsRequesting(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                    localStorage.setItem('perm_gps', 'denied');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
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
