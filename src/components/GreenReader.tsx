
import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface GreenReaderProps {
    onClose: () => void;
}

const GreenReader: React.FC<GreenReaderProps> = ({ onClose }) => {
    const [permissionGranted, setPermissionGranted] = useState(false);
    const [beta, setBeta] = useState(0); // Inclinación adelante/atrás (Slope)
    const [gamma, setGamma] = useState(0); // Inclinación izquierda/derecha (Break)

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            setBeta(event.beta || 0);
            setGamma(event.gamma || 0);
        };

        // En iOS 13+ se requiere permiso explícito
        const requestAccess = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const response = await (DeviceOrientationEvent as any).requestPermission();
                    if (response === 'granted') {
                        setPermissionGranted(true);
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        alert('Permiso denegado para usar el acelerómetro');
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
                // Non-iOS 13+ devices
                setPermissionGranted(true);
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        requestAccess();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
        };
    }, []);

    // Calcular posición de la burbuja
    // Limitamos el movimiento a +/- 10 grados para que la burbuja no se salga
    const maxDegree = 10;
    const bubbleX = Math.max(-maxDegree, Math.min(maxDegree, gamma)) * (100 / maxDegree); // Scale to %
    const bubbleY = Math.max(-maxDegree, Math.min(maxDegree, beta)) * (100 / maxDegree);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.9)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            fontFamily: '"Outfit", sans-serif'
        }}>
            <button
                onClick={onClose}
                style={{ position: 'absolute', top: '20px', right: '20px', padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}
            >
                <X color="white" />
            </button>

            <h2 style={{ marginBottom: '30px', fontSize: '24px' }}>Lectura de Green</h2>

            <div style={{
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                border: '4px solid var(--secondary)',
                background: 'rgba(163, 230, 53, 0.1)',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                overflow: 'hidden'
            }}>
                {/* Crosshairs */}
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255,255,255,0.3)' }} />
                <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(255,255,255,0.3)' }} />

                {/* Center Target */}
                <div style={{ position: 'absolute', width: '20px', height: '20px', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)' }} />

                {/* Bubble */}
                <div style={{
                    position: 'absolute',
                    width: '40px',
                    height: '40px',
                    background: 'var(--secondary)',
                    borderRadius: '50%',
                    boxShadow: '0 0 15px var(--secondary)',
                    transform: `translate(${bubbleX}%, ${bubbleY}%)`,
                    transition: 'transform 0.1s ease-out'
                }} />
            </div>

            <div style={{ marginTop: '30px', textAlign: 'center' }}>
                <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                    {Math.abs(Math.round(beta))}° {beta < -1 ? 'Bajada' : beta > 1 ? 'Subida' : 'Plano'}
                </p>
                <p style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-dim)' }}>
                    {Math.abs(Math.round(gamma))}° {gamma < -1 ? 'Izquierda' : gamma > 1 ? 'Derecha' : 'Centro'}
                </p>
            </div>

            <div style={{ marginTop: '20px', maxWidth: '80%', fontSize: '12px', color: '#999', textAlign: 'center' }}>
                <Info size={14} style={{ display: 'inline', marginRight: '5px' }} />
                Pon el celular en el suelo del green para medir la caída.
            </div>
        </div>
    );
};

export default GreenReader;
