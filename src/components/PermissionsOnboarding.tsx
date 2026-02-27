import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import {
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    LocateFixed,
    Camera as CameraIcon,
    ChevronRight,
    Sparkles
} from 'lucide-react';

interface PermissionsOnboardingProps {
    onComplete: () => void;
}

const PermissionsOnboarding: React.FC<PermissionsOnboardingProps> = ({ onComplete }) => {
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>('prompt');
    const [isRequesting, setIsRequesting] = useState<string | null>(null);
    const [step, setStep] = useState(0); // 0 = intro, 1 = permissions, 2 = done

    const handleRequestGps = async () => {
        if (gpsStatus === 'granted') return;
        setIsRequesting('gps');

        try {
            if (Capacitor.getPlatform() === 'web') {
                await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
                });
            } else {
                const permission = await Geolocation.requestPermissions();
                if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
                    throw new Error('Permiso no concedido');
                }
            }
            setGpsStatus('granted');
            localStorage.setItem('gps_permission_granted', 'true');
        } catch (err) {
            console.error('Error requesting GPS permission:', err);
            setGpsStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const handleRequestCamera = async () => {
        if (cameraStatus === 'granted') return;
        setIsRequesting('camera');

        try {
            if (Capacitor.getPlatform() === 'web') {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                stream.getTracks().forEach(track => track.stop());
            } else {
                const permission = await Camera.requestPermissions();
                if (permission.camera !== 'granted') {
                    throw new Error('Permiso no concedido');
                }
            }
            setCameraStatus('granted');
            localStorage.setItem('camera_permission_granted', 'true');
        } catch (err) {
            console.error('Error requesting camera permission:', err);
            setCameraStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const handleFinish = () => {
        localStorage.setItem('permissions_onboarding_completed', 'true');
        onComplete();
    };

    const StatusBadge = ({ status }: { status: 'granted' | 'denied' | 'prompt' }) => {
        const config = {
            granted: { color: '#A3E635', text: 'ACTIVADO', icon: CheckCircle2 },
            denied: { color: '#ef4444', text: 'DENEGADO', icon: AlertCircle },
            prompt: { color: '#fbbf24', text: 'PENDIENTE', icon: AlertCircle },
        }[status];

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: config.color }}>
                <config.icon size={14} />
                <span>{config.text}</span>
            </div>
        );
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                background: 'rgba(4, 20, 14, 0.97)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '30px 24px',
                fontFamily: 'var(--font-main)',
            }}
        >
            {/* Background decorative elements */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                right: '-20%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(163, 230, 53, 0.06) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                left: '-20%',
                width: '300px',
                height: '300px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(163, 230, 53, 0.04) 0%, transparent 70%)',
                pointerEvents: 'none'
            }} />

            <AnimatePresence mode="wait">
                {step === 0 && (
                    <motion.div
                        key="intro"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            maxWidth: '340px',
                            gap: '24px',
                        }}
                    >
                        {/* Icon */}
                        <motion.div
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '30px',
                                background: 'rgba(163, 230, 53, 0.08)',
                                border: '1px solid rgba(163, 230, 53, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 20px 60px rgba(163, 230, 53, 0.1)',
                            }}
                        >
                            <ShieldCheck size={48} color="var(--secondary)" strokeWidth={1.5} />
                        </motion.div>

                        {/* Title */}
                        <div>
                            <h1 style={{
                                fontSize: '28px',
                                fontWeight: '900',
                                color: 'white',
                                letterSpacing: '-0.5px',
                                lineHeight: '1.2',
                                marginBottom: '12px',
                            }}>
                                ¡Bienvenido a{' '}
                                <span style={{ color: 'var(--secondary)' }}>APEG</span>!
                            </h1>
                            <p style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.5)',
                                lineHeight: '1.6',
                                fontWeight: '500',
                            }}>
                                Para brindarte la mejor experiencia, necesitamos configurar algunos permisos del sistema.
                            </p>
                        </div>

                        {/* Features preview */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            width: '100%',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px 18px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <LocateFixed size={20} color="var(--secondary)" />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'left' }}>
                                    Ubicación para medir distancias en el campo
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                padding: '14px 18px',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <CameraIcon size={20} color="var(--secondary)" />
                                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', textAlign: 'left' }}>
                                    Cámara para fotos de perfil y productos
                                </span>
                            </div>
                        </div>

                        {/* CTA Button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStep(1)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                borderRadius: '16px',
                                fontWeight: '900',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 30px rgba(163, 230, 53, 0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            CONFIGURAR PERMISOS
                            <ChevronRight size={18} strokeWidth={3} />
                        </motion.button>

                        <button
                            onClick={handleFinish}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.3)',
                                fontSize: '12px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '8px',
                            }}
                        >
                            Omitir por ahora
                        </button>
                    </motion.div>
                )}

                {step === 1 && (
                    <motion.div
                        key="permissions"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '100%',
                            maxWidth: '380px',
                            gap: '20px',
                        }}
                    >
                        {/* Header */}
                        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '12px' }}>
                                <ShieldCheck size={22} color="var(--secondary)" />
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                }}>
                                    Permisos <span style={{ color: 'var(--secondary)' }}>del Sistema</span>
                                </h2>
                            </div>
                            <p style={{
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.4)',
                                fontWeight: '500',
                            }}>
                                Activa los permisos para disfrutar de todas las funcionalidades
                            </p>
                        </div>

                        {/* GPS Permission Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 }}
                            style={{
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(163, 230, 53, 0.1)',
                                    }}>
                                        <LocateFixed size={24} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '4px', fontWeight: '800' }}>Ubicación (GPS)</h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '200px', lineHeight: '1.4' }}>
                                            Necesario para medir distancias al green y ordenar campos cercanos.
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={gpsStatus} />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleRequestGps}
                                disabled={isRequesting === 'gps' || gpsStatus === 'granted'}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: gpsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                    color: gpsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                    fontWeight: '800',
                                    borderRadius: '14px',
                                    opacity: isRequesting === 'gps' ? 0.7 : 1,
                                    border: gpsStatus === 'granted' ? '1px solid rgba(163, 230, 53, 0.2)' : 'none',
                                    cursor: gpsStatus === 'granted' ? 'default' : 'pointer',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {isRequesting === 'gps' ? 'SOLICITANDO...' : gpsStatus === 'granted' ? '✓ PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                            </motion.button>
                        </motion.div>

                        {/* Camera Permission Card */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                padding: '20px',
                                borderRadius: '24px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.08)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        padding: '12px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(163, 230, 53, 0.1)',
                                    }}>
                                        <CameraIcon size={24} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '4px', fontWeight: '800' }}>Cámara</h3>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', maxWidth: '200px', lineHeight: '1.4' }}>
                                            Para fotos de perfil y subir productos al Marketplace.
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={cameraStatus} />
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={handleRequestCamera}
                                disabled={isRequesting === 'camera' || cameraStatus === 'granted'}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: cameraStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                    color: cameraStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                    fontWeight: '800',
                                    borderRadius: '14px',
                                    opacity: isRequesting === 'camera' ? 0.7 : 1,
                                    border: cameraStatus === 'granted' ? '1px solid rgba(163, 230, 53, 0.2)' : 'none',
                                    cursor: cameraStatus === 'granted' ? 'default' : 'pointer',
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                    transition: 'all 0.3s ease',
                                }}
                            >
                                {isRequesting === 'camera' ? 'SOLICITANDO...' : cameraStatus === 'granted' ? '✓ PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                            </motion.button>
                        </motion.div>

                        {/* Continue Button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={() => setStep(2)}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: (gpsStatus === 'granted' && cameraStatus === 'granted')
                                    ? 'var(--secondary)'
                                    : 'rgba(255,255,255,0.06)',
                                color: (gpsStatus === 'granted' && cameraStatus === 'granted')
                                    ? 'var(--primary)'
                                    : 'rgba(255,255,255,0.5)',
                                borderRadius: '16px',
                                fontWeight: '900',
                                fontSize: '13px',
                                border: (gpsStatus === 'granted' && cameraStatus === 'granted')
                                    ? 'none'
                                    : '1px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '4px',
                                boxShadow: (gpsStatus === 'granted' && cameraStatus === 'granted')
                                    ? '0 8px 30px rgba(163, 230, 53, 0.2)'
                                    : 'none',
                                transition: 'all 0.3s ease',
                            }}
                        >
                            CONTINUAR
                            <ChevronRight size={18} strokeWidth={3} />
                        </motion.button>
                    </motion.div>
                )}

                {step === 2 && (
                    <motion.div
                        key="done"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.4 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            maxWidth: '340px',
                            gap: '24px',
                        }}
                    >
                        {/* Success Icon */}
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '30px',
                                background: 'rgba(163, 230, 53, 0.1)',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                boxShadow: '0 20px 60px rgba(163, 230, 53, 0.15)',
                            }}
                        >
                            <Sparkles size={48} color="var(--secondary)" strokeWidth={1.5} />
                        </motion.div>

                        <div>
                            <h1 style={{
                                fontSize: '26px',
                                fontWeight: '900',
                                color: 'white',
                                letterSpacing: '-0.5px',
                                lineHeight: '1.2',
                                marginBottom: '12px',
                            }}>
                                ¡Todo <span style={{ color: 'var(--secondary)' }}>Listo</span>!
                            </h1>
                            <p style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.5)',
                                lineHeight: '1.6',
                                fontWeight: '500',
                            }}>
                                Tu configuración ha sido guardada. Puedes cambiar estos permisos en cualquier momento desde Configuración.
                            </p>
                        </div>

                        {/* Summary */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            width: '100%',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 18px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <LocateFixed size={16} color="var(--secondary)" />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Ubicación</span>
                                </div>
                                <StatusBadge status={gpsStatus} />
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 18px',
                                borderRadius: '14px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CameraIcon size={16} color="var(--secondary)" />
                                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Cámara</span>
                                </div>
                                <StatusBadge status={cameraStatus} />
                            </div>
                        </div>

                        {/* Start Button */}
                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleFinish}
                            style={{
                                width: '100%',
                                padding: '16px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                borderRadius: '16px',
                                fontWeight: '900',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 30px rgba(163, 230, 53, 0.2)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            COMENZAR A JUGAR ⛳
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Step indicator */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                display: 'flex',
                gap: '8px',
            }}>
                {[0, 1, 2].map(i => (
                    <div key={i} style={{
                        width: step === i ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: step === i ? 'var(--secondary)' : 'rgba(255,255,255,0.15)',
                        transition: 'all 0.3s ease',
                    }} />
                ))}
            </div>
        </motion.div>
    );
};

export default PermissionsOnboarding;
