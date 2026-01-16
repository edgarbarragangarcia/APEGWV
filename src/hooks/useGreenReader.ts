import { useState, useEffect } from 'react';

export const useGreenReader = () => {
    const [beta, setBeta] = useState(0); // Inclinación adelante/atrás (Slope)
    const [gamma, setGamma] = useState(0); // Inclinación izquierda/derecha (Break)
    const [permissionGranted, setPermissionGranted] = useState(false);

    // Calibración
    const [calibratedBeta, setCalibratedBeta] = useState(0);
    const [calibratedGamma, setCalibratedGamma] = useState(0);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            setBeta(event.beta || 0);
            setGamma(event.gamma || 0);
        };

        const requestAccess = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const response = await (DeviceOrientationEvent as any).requestPermission();
                    if (response === 'granted') {
                        setPermissionGranted(true);
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                setPermissionGranted(true);
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        requestAccess();

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
        calibrate
    };
};
