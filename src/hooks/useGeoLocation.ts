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
                    enableHighAccuracy: false,
                    timeout: 10000,
                    maximumAge: 30000
                },
                (position, err) => {
                    if (err) {
                        setError(err.message);
                        setIsRequesting(false);
                        return;
                    }

                    if (position) {
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
            setError(err.message);
        }
    };

    const getInitialLocation = async (useHighAccuracy = true, retryCount = 0) => {
        const timeout = useHighAccuracy ? 10000 : 7000;

        try {
            const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: useHighAccuracy,
                timeout,
                maximumAge: retryCount > 0 ? 30000 : 0
            });

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
            if (err.message?.toLowerCase().includes('denied') || err.code === 1) {
                setPermissionStatus('denied');
                setError('Permiso denegado por el usuario');
                return;
            }

            // Fallback strategy
            if (useHighAccuracy && retryCount === 0) {
                setTimeout(() => getInitialLocation(false, 0), 1000);
            } else if (retryCount < 2) {
                setTimeout(() => getInitialLocation(false, retryCount + 1), 3000);
            } else {
                setError('No se pudo obtener una ubicación estable. Verifica que el GPS esté activo.');
            }
        }
    };

    useEffect(() => {
        const checkPermissionsAndGetLocation = async () => {
            try {
                const permission = await Geolocation.checkPermissions();

                if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                    setPermissionStatus('granted');
                    getInitialLocation();
                } else if (permission.location === 'denied') {
                    setPermissionStatus('denied');
                } else {
                    setPermissionStatus('prompt');
                }
            } catch (err) {
                setPermissionStatus('prompt');
            }
        };

        checkPermissionsAndGetLocation();

        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
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

    const calculateDistance = (targetLat: number, targetLon: number): number | null => {
        if (!location) return null;

        const R = 6371e3;
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
        if (permissionStatus === 'granted') {
            await getInitialLocation();
            return;
        }

        setIsRequesting(true);
        setError(null);

        try {
            if (Capacitor.getPlatform() === 'web') {
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

            const permission = await Geolocation.requestPermissions();
            if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                setPermissionStatus('granted');
                await getInitialLocation();
            } else {
                setPermissionStatus('denied');
            }
        } catch (err: any) {
            setError(err.message);
            if (err.message?.includes('denied')) {
                setPermissionStatus('denied');
            }
        } finally {
            setIsRequesting(false);
        }
    };

    return {
        location,
        error,
        calculateDistance,
        permissionStatus,
        requestPermission,
        refreshLocation: requestPermission,
        isRequesting
    };
};
