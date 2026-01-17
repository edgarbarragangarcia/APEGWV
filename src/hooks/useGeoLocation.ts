import { useState, useEffect, useRef } from 'react';

interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useGeoLocation = () => {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unknown'>('unknown');
    const [isRequesting, setIsRequesting] = useState(false);
    const watcherRef = useRef<number | null>(null);

    const startWatching = () => {
        if (!navigator.geolocation || watcherRef.current !== null) return;

        const handleSuccess = (position: GeolocationPosition) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
            setError(null);
            setPermissionStatus('granted');
            setIsRequesting(false);
        };

        const handleError = (error: GeolocationPositionError) => {
            console.error('GPS Error:', error);
            setError(error.message);
            setIsRequesting(false);
            if (error.code === error.PERMISSION_DENIED) {
                setPermissionStatus('denied');
            }
        };

        watcherRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
        });
    };

    useEffect(() => {
        // Only check permission status on mount, don't trigger anything
        if (navigator.permissions && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' as any }).then((result) => {
                setPermissionStatus(result.state);
                if (result.state === 'granted') {
                    startWatching();
                }
                result.onchange = () => {
                    setPermissionStatus(result.state);
                    if (result.state === 'granted') startWatching();
                };
            }).catch(() => {
                // Fallback for browsers with permissions API but issues
                setPermissionStatus('unknown');
            });
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

        // Force a query with a direct call - this is what triggers the system prompt
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setLocation({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude
                });
                setPermissionStatus('granted');
                startWatching(); // Once granted, start watching
            },
            (err) => {
                console.error('Manual request failed:', err);
                setError(err.message);
                setIsRequesting(false);
                if (err.code === err.PERMISSION_DENIED) {
                    setPermissionStatus('denied');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    return { location, error, calculateDistance, permissionStatus, requestPermission, isRequesting };
};
