import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import {
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    LocateFixed,
    Camera as CameraIcon
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt'>(
        (localStorage.getItem('gps_permission_granted') === 'true') ? 'granted' : 'prompt'
    );
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>(
        (localStorage.getItem('camera_permission_granted') === 'true') ? 'granted' : 'prompt'
    );
    const [isRequesting, setIsRequesting] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();

        // Listen for when the app comes back to foreground (e.g., user returns from Settings)
        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                checkPermissions();
            }
        });

        return () => {
            appStateListener.then(listener => listener.remove());
        };
    }, []);

    const checkPermissions = async (forceRequest = false) => {
        // Check GPS permission
        try {
            let gpsPermission = await Geolocation.checkPermissions();

            if (forceRequest && (gpsPermission.location === 'prompt' || gpsPermission.coarseLocation === 'prompt')) {
                gpsPermission = await Geolocation.requestPermissions();
            }

            if (gpsPermission.location === 'granted' || gpsPermission.coarseLocation === 'granted') {
                setGpsStatus('granted');
                localStorage.setItem('gps_permission_granted', 'true');
            } else if (gpsPermission.location === 'denied') {
                setGpsStatus('denied');
                localStorage.removeItem('gps_permission_granted');
            } else {
                // Mantener el cache si estamos en web para evitar el flicker
                if (Capacitor.getPlatform() !== 'web') {
                    setGpsStatus('prompt');
                }
            }
        } catch (e) {
            console.error('Error checking GPS permission:', e);
            setGpsStatus('prompt');
        }

        // Check Camera permission
        try {
            let cameraPermission = await Camera.checkPermissions();

            if (forceRequest && cameraPermission.camera === 'prompt') {
                cameraPermission = await Camera.requestPermissions();
            }

            if (cameraPermission.camera === 'granted') {
                setCameraStatus('granted');
                localStorage.setItem('camera_permission_granted', 'true');
            } else if (cameraPermission.camera === 'denied') {
                setCameraStatus('denied');
                localStorage.removeItem('camera_permission_granted');
            } else {
                if (Capacitor.getPlatform() !== 'web') {
                    setCameraStatus('prompt');
                }
            }
        } catch (e) {
            console.error('Error checking camera permission:', e);
            setCameraStatus('prompt');
        }
    };

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
            await checkPermissions();
        } catch (err: any) {
            console.error('Error requesting GPS permission:', err);
            await checkPermissions();
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
            await checkPermissions();
        } catch (err: any) {
            console.error('Error requesting camera permission:', err);
            await checkPermissions();
        } finally {
            setIsRequesting(null);
        }
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
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            background: 'var(--primary)'
        }}>
            <PageHero image="https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=2070&auto=format&fit=crop" />
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'transparent',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader noMargin title="Configuración" onBack={() => navigate(-1)} />
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 58px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <section>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <ShieldCheck size={20} color="var(--secondary)" />
                            <h2 style={{ fontSize: '18px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Permisos <span style={{ color: 'var(--secondary)' }}>del Sistema</span>
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* GPS */}
                            <div className="glass" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                            <LocateFixed size={24} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Ubicación (GPS)</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                                Necesario para medir distancias al green y ordenar campos cercanos.
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={gpsStatus} />
                                </div>
                                <button
                                    onClick={handleRequestGps}
                                    className="glass"
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: gpsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                        color: gpsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                        fontWeight: '700', borderRadius: '12px', opacity: (isRequesting === 'gps') ? 0.7 : 1
                                    }}
                                >
                                    {isRequesting === 'gps' ? 'SOLICITANDO...' : gpsStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                                </button>
                            </div>

                            {/* Camera */}
                            <div className="glass" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                            <CameraIcon size={24} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Cámara</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                                Para fotos de perfil y subir productos al Marketplace.
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={cameraStatus} />
                                </div>
                                <button
                                    onClick={handleRequestCamera}
                                    className="glass"
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: cameraStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                        color: cameraStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                        fontWeight: '700', borderRadius: '12px', opacity: (isRequesting === 'camera') ? 0.7 : 1
                                    }}
                                >
                                    {isRequesting === 'camera' ? 'SOLICITANDO...' : cameraStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
