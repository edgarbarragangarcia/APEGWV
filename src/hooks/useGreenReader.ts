import { useState, useEffect } from 'react';

export const useGreenReader = () => {
    const [beta, setBeta] = useState(0); // Inclinación adelante/atrás (Slope)
    const [gamma, setGamma] = useState(0); // Inclinación izquierda/derecha (Break)
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [hasData, setHasData] = useState(false); // Track if we are actually receiving events

    // Calibración
    const [calibratedBeta, setCalibratedBeta] = useState(0);
    const [calibratedGamma, setCalibratedGamma] = useState(0);

    // Smoothing factor (Low-Pass Filter)
    const ALPHA = 0.15; // 0 to 1. Lower = smoother but slower.

    const [isManual, setIsManual] = useState(false);
    const [manualBeta, setManualBeta] = useState(0);
    const [manualGamma, setManualGamma] = useState(0);

    const handleOrientation = (event: DeviceOrientationEvent) => {
        if (isManual) return;
        const rawB = event.beta || 0;
        const rawG = event.gamma || 0;

        setBeta(prev => (ALPHA * rawB) + (1 - ALPHA) * prev);
        setGamma(prev => (ALPHA * rawG) + (1 - ALPHA) * prev);
        setHasData(true);
    };

    const requestAccess = async () => {
        try {
            // Check if we need to request permissions (iOS 13+)
            const needsMotionPermission = typeof (DeviceMotionEvent as any).requestPermission === 'function';
            const needsOrientationPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function';

            if (needsMotionPermission || needsOrientationPermission) {
                let motionGranted = true;
                let orientationGranted = true;

                // Request DeviceMotionEvent permission (accelerometer)
                if (needsMotionPermission) {
                    try {
                        const motionResponse = await (DeviceMotionEvent as any).requestPermission();
                        motionGranted = motionResponse === 'granted';
                        console.log('DeviceMotionEvent permission:', motionResponse);
                    } catch (error) {
                        console.error('Error requesting DeviceMotionEvent:', error);
                        motionGranted = false;
                    }
                }

                // Request DeviceOrientationEvent permission (gyroscope)
                if (needsOrientationPermission) {
                    try {
                        const orientationResponse = await (DeviceOrientationEvent as any).requestPermission();
                        orientationGranted = orientationResponse === 'granted';
                        console.log('DeviceOrientationEvent permission:', orientationResponse);
                    } catch (error) {
                        console.error('Error requesting DeviceOrientationEvent:', error);
                        orientationGranted = false;
                    }
                }

                // Both permissions must be granted
                if (motionGranted && orientationGranted) {
                    setPermissionGranted(true);
                    window.addEventListener('deviceorientation', handleOrientation);
                    return true;
                } else {
                    // Si falla el sensor, ofrecemos modo manual automáticamente
                    setIsManual(true);
                    setPermissionGranted(false);
                    return false;
                }
            } else {
                // Non-iOS or older devices - no permission needed
                setPermissionGranted(true);
                window.addEventListener('deviceorientation', handleOrientation);
                return true;
            }
        } catch (error) {
            console.error('Unexpected error requesting sensor access:', error);
            setIsManual(true);
            return false;
        }
    };

    useEffect(() => {
        // Try auto-connect for Android/Desktop (no permission needed)
        const needsMotionPermission = typeof (DeviceMotionEvent as any).requestPermission === 'function';
        const needsOrientationPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function';

        if (!needsMotionPermission && !needsOrientationPermission) {
            // Auto-enable for devices that don't require explicit permission
            window.addEventListener('deviceorientation', handleOrientation);
            setPermissionGranted(true);
        }

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [isManual]);

    const calibrate = () => {
        if (isManual) {
            setManualBeta(0);
            setManualGamma(0);
        } else {
            setCalibratedBeta(beta);
            setCalibratedGamma(gamma);
        }
    };

    const toggleManual = () => {
        setIsManual(!isManual);
        if (!isManual) {
            // Reset values when entering manual mode
            setManualBeta(0);
            setManualGamma(0);
        }
    };

    // Derived values
    const currentBeta = isManual ? manualBeta : (beta - calibratedBeta);
    const currentGamma = isManual ? manualGamma : (gamma - calibratedGamma);
    const isLevel = Math.abs(currentBeta) < 2 && Math.abs(currentGamma) < 2;

    return {
        beta: currentBeta,
        gamma: currentGamma,
        rawBeta: beta,
        rawGamma: gamma,
        permissionGranted,
        hasData,
        isLevel,
        calibrate,
        requestAccess,
        isManual,
        toggleManual,
        setManualBeta,
        setManualGamma
    };
};
