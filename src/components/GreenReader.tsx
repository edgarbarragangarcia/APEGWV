
import React, { useState, useEffect } from 'react';
import { X, Info } from 'lucide-react';

interface GreenReaderProps {
    onClose: () => void;
}

const GreenReader: React.FC<GreenReaderProps> = ({ onClose }) => {
    const [beta, setBeta] = useState(0); // Inclinación adelante/atrás (Slope)
    const [gamma, setGamma] = useState(0); // Inclinación izquierda/derecha (Break)

    // Estados de calibración
    const [calibratedBeta, setCalibratedBeta] = useState(0);
    const [calibratedGamma, setCalibratedGamma] = useState(0);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            // Beta: -180 a 180 (x axis) - Front/Back
            // Gamma: -90 a 90 (y axis) - Left/Right
            setBeta(event.beta || 0);
            setGamma(event.gamma || 0);
        };

        const requestAccess = async () => {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const response = await (DeviceOrientationEvent as any).requestPermission();
                    if (response === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    } else {
                        alert('Se requiere acceso al giroscopio para leer el green.');
                    }
                } catch (e) {
                    console.error(e);
                }
            } else {
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

    // Valores ajustados con calibración
    const readBeta = beta - calibratedBeta;
    const readGamma = gamma - calibratedGamma;

    // Calcular posición de la burbuja visual
    const maxDegree = 10;
    const bubbleX = Math.max(-maxDegree, Math.min(maxDegree, readGamma)) * (100 / maxDegree);
    const bubbleY = Math.max(-maxDegree, Math.min(maxDegree, readBeta)) * (100 / maxDegree);

    // Calcular dirección de caída (Vector)
    // Usamos Math.atan2 para el ángulo de caída
    const angle = Math.atan2(readGamma, readBeta) * (180 / Math.PI);
    const magnitude = Math.sqrt(readGamma * readGamma + readBeta * readBeta);
    const hasSignificantBreak = magnitude > 0.5; // Umbral mínimo para mostrar flecha

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(0,0,0,0.95)',
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

            <h2 style={{ marginBottom: '10px', fontSize: '24px' }}>Lectura de Caída</h2>
            <p style={{ color: 'var(--text-dim)', marginBottom: '30px', fontSize: '14px' }}>Coloca el teléfono en el suelo</p>

            <div style={{
                width: '320px',
                height: '320px',
                borderRadius: '50%',
                border: '6px solid var(--glass-border)',
                background: 'radial-gradient(circle, rgba(163,230,53,0.05) 0%, rgba(0,0,0,0.3) 70%)',
                position: 'relative',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 50px rgba(0,0,0,0.5)'
            }}>
                {/* Crosshairs */}
                <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', width: '1px', height: '100%', background: 'rgba(255,255,255,0.1)' }} />

                {/* Anillos de grados */}
                <div style={{ position: 'absolute', width: '50%', height: '50%', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)' }} />
                <div style={{ position: 'absolute', width: '75%', height: '75%', borderRadius: '50%', border: '1px dashed rgba(255,255,255,0.1)' }} />

                {/* Center Target */}
                <div style={{ position: 'absolute', width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />

                {/* Arrow indicating Fall Line */}
                {hasSignificantBreak && (
                    <div style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        transform: `rotate(${angle + 90}deg)`, // +90 porque atan2(y,x) y nuestro 0 es arriba? No, check logic.
                        // Gamma es X (Left/Right), Beta es Y (Front/Back).
                        // Si inclino derecha (Gamma +), burbuja va left. Bola cae derecha.
                        // La flecha debe apuntar hacia donde cae la bola (direction of gravity).
                        // Si Gamma es positivo (tilt right), bola cae right. Arrow should point right (90deg).
                        transition: 'transform 0.2s ease-out'
                    }}>
                        <div style={{
                            width: '4px',
                            height: '140px', // Longitud de la flecha
                            background: 'linear-gradient(to top, var(--secondary), transparent)',
                            marginTop: '160px', // Offset from center
                            borderRadius: '2px',
                            boxShadow: '0 0 10px var(--secondary)'
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            width: '0',
                            height: '0',
                            borderLeft: '10px solid transparent',
                            borderRight: '10px solid transparent',
                            borderTop: '20px solid var(--secondary)',
                            transform: 'translateY(160px)'
                        }} />
                    </div>
                )}

                {/* Bubble Level */}
                <div style={{
                    position: 'absolute',
                    width: '50px',
                    height: '50px',
                    background: 'rgba(255, 255, 255, 0.9)', // Burbuja blanca estilo nivel real
                    borderRadius: '50%',
                    boxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2), 0 0 20px rgba(255,255,255,0.5)',
                    transform: `translate(${bubbleX}%, ${bubbleY}%)`,
                    // Nota: Si el suelo baja a la derecha (Gamma +), la burbuja física sube a la IZQUIERDA (Gamma visual -).
                    // La lógica burbuja es opuesta a la gravedad.
                    // Si gamma > 0 (derecha abajo), bola va derecha, burbuja va izquierda.
                    transition: 'transform 0.1s ease-out'
                }} />
            </div>

            <div style={{ marginTop: '40px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                    <div className="glass" style={{ padding: '15px', minWidth: '120px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Pendiente</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: Math.abs(readBeta) > 1 ? 'var(--secondary)' : 'white' }}>
                            {Math.abs(Math.round(readBeta))}°
                        </div>
                        <div style={{ fontSize: '12px', color: readBeta < -1 ? '#f87171' : readBeta > 1 ? '#4ade80' : 'gray' }}>
                            {readBeta < -1 ? 'BAJADA' : readBeta > 1 ? 'SUBIDA' : 'PLANO'}
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '15px', minWidth: '120px' }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Caída</div>
                        <div style={{ fontSize: '24px', fontWeight: '800', color: Math.abs(readGamma) > 1 ? 'var(--secondary)' : 'white' }}>
                            {Math.abs(Math.round(readGamma))}°
                        </div>
                        <div style={{ fontSize: '12px', color: readGamma < -1 ? 'var(--secondary)' : readGamma > 1 ? 'var(--secondary)' : 'gray' }}>
                            {readGamma < -1 ? 'IZQUIERDA' : readGamma > 1 ? 'DERECHA' : 'CENTRO'}
                        </div>
                    </div>
                </div>

                <button
                    onClick={calibrate}
                    style={{
                        padding: '12px 30px',
                        background: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        borderRadius: '25px',
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer'
                    }}
                >
                    CALIBRAR AQUÍ (0°)
                </button>
            </div>

            <div style={{ marginTop: '20px', maxWidth: '80%', fontSize: '12px', color: '#999', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Info size={14} />
                La flecha indica hacia dónde rodará la bola.
            </div>
        </div>
    );
};

export default GreenReader;
