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
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 5000 // Aceptamos hasta 5 segundos de antigüedad para rapidez
        });
    };

    const getInitialLocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (pos) => {
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
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    useEffect(() => {
        // Intento directo de obtener ubicación y permisos
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' as any })
                .then((result) => {
                    setPermissionStatus(result.state);
                    if (result.state === 'granted') {
                        getInitialLocation();
                    }
                    result.onchange = () => {
                        setPermissionStatus(result.state);
                        localStorage.setItem('perm_gps', result.state);
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
            { enableHighAccuracy: true, timeout: 15000 }
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
