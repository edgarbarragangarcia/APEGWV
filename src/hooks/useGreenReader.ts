import { useState, useEffect } from 'react';

export const useGreenReader = () => {
    const [beta, setBeta] = useState(0); // Inclinación adelante/atrás (Slope)
    const [gamma, setGamma] = useState(0); // Inclinación izquierda/derecha (Break)
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [hasData, setHasData] = useState(false); // Track if we are actually receiving events

    // Calibración
    const [calibratedBeta, setCalibratedBeta] = useState(0);
    const [calibratedGamma, setCalibratedGamma] = useState(0);

    const handleOrientation = (event: DeviceOrientationEvent) => {
        setBeta(event.beta || 0);
        setGamma(event.gamma || 0);
        setHasData(true);
    };

    const requestAccess = async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation);
                    return true;
                } else {
                    alert('Permiso denegado para sensores');
                    return false;
                }
            } catch (e) {
                console.error(e);
                return false;
            }
        } else {
            // Non-iOS or older devices
            setPermissionGranted(true);
            window.addEventListener('deviceorientation', handleOrientation);
            return true;
        }
    };

    useEffect(() => {
        // Try auto-connect for Android/Desktop
        if (typeof (DeviceOrientationEvent as any).requestPermission !== 'function') {
            window.addEventListener('deviceorientation', handleOrientation);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    const calibrate = () => {
        setCalibratedBeta(beta);
        setCalibratedGamma(gamma);
    };

    return {
        beta: beta - calibratedBeta,
        gamma: gamma - calibratedGamma,
        rawBeta: beta,
        rawGamma: gamma,
        permissionGranted,
        hasData,
        calibrate,
        requestAccess
    };
};
