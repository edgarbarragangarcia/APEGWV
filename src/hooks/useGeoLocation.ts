import { useState, useEffect } from 'react';

interface Coordinates {
    latitude: number;
    longitude: number;
}

export const useGeoLocation = () => {
    const [location, setLocation] = useState<Coordinates | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Geolocalización no soportada');
            return;
        }

        const handleSuccess = (position: GeolocationPosition) => {
            setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            });
        };

        const handleError = (error: GeolocationPositionError) => {
            setError(error.message);
        };

        const watcher = navigator.geolocation.watchPosition(handleSuccess, handleError, {
            enableHighAccuracy: true, // Importante para golf (mejora precisión a ~5m)
            timeout: 20000,
            maximumAge: 1000
        });

        return () => navigator.geolocation.clearWatch(watcher);
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

    return { location, error, calculateDistance };
};
