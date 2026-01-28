import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, Smartphone, CheckCircle2, AlertCircle, ShieldCheck, Camera as CameraIcon } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>(
        (localStorage.getItem('perm_gps') as any) || 'unknown'
    );
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>(
        (localStorage.getItem('perm_camera') as any) || 'unknown'
    );
    const [sensorsStatus, setSensorsStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>(
        (localStorage.getItem('perm_sensors') as any) || 'unknown'
    );
    const [isRequesting, setIsRequesting] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        const updateStickyStatus = (key: string, newStatus: any, setter: any) => {
            const local = localStorage.getItem(key);
            if (local === 'granted' && (newStatus === 'prompt' || newStatus === 'unknown')) {
                return;
            }
            setter(newStatus);
            localStorage.setItem(key, newStatus);
        };

        // Check GPS
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name: 'geolocation' as any });
                updateStickyStatus('perm_gps', status.state, setGpsStatus);
                status.onchange = () => updateStickyStatus('perm_gps', status.state, setGpsStatus);
                // If it's already granted, trigger a fetch to confirm it's working
                if (status.state === 'granted') {
                    navigator.geolocation.getCurrentPosition(() => { }, () => { });
                }
            } catch (e) {
                console.error('Error checking GPS permission:', e);
            }
        }

        // Check Camera
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name: 'camera' as any });
                updateStickyStatus('perm_camera', status.state, setCameraStatus);
                status.onchange = () => updateStickyStatus('perm_camera', status.state, setCameraStatus);
            } catch (e) {
                console.warn('Camera permission query not supported');
            }
        }

        // Check Sensors
        const needsMotion = typeof (DeviceOrientationEvent as any).requestPermission === 'function' ||
            typeof (DeviceMotionEvent as any).requestPermission === 'function';

        if (needsMotion) {
            const local = localStorage.getItem('perm_sensors');
            if (!local || local === 'unknown' || local === 'prompt') {
                setSensorsStatus('prompt');
                localStorage.setItem('perm_sensors', 'prompt');
            } else if (local === 'granted') {
                setSensorsStatus('granted');
            }
        } else {
            setSensorsStatus('granted');
            localStorage.setItem('perm_sensors', 'granted');
        }
    };

    const handleRequestGps = () => {
        setIsRequesting('gps');
        navigator.geolocation.getCurrentPosition(
            () => {
                setGpsStatus('granted');
                localStorage.setItem('perm_gps', 'granted');
                setIsRequesting(null);
            },
            (err) => {
                console.error(err);
                if (err.code === err.TIMEOUT) {
                    setGpsStatus('prompt');
                } else {
                    setGpsStatus('denied');
                    localStorage.setItem('perm_gps', 'denied');
                }
                setIsRequesting(null);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleRequestCamera = async () => {
        setIsRequesting('camera');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraStatus('granted');
            localStorage.setItem('perm_camera', 'granted');
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error(err);
            setCameraStatus('denied');
            localStorage.setItem('perm_camera', 'denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const handleRequestSensors = async () => {
        setIsRequesting('sensors');
        try {
            const needsPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function' ||
                typeof (DeviceMotionEvent as any).requestPermission === 'function';

            if (needsPermission) {
                let motionGranted = true;
                let orientationGranted = true;

                if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                    const res = await (DeviceMotionEvent as any).requestPermission();
                    motionGranted = res === 'granted';
                }

                if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                    const res = await (DeviceOrientationEvent as any).requestPermission();
                    orientationGranted = res === 'granted';
                }

                if (motionGranted && orientationGranted) {
                    setSensorsStatus('granted');
                    localStorage.setItem('perm_sensors', 'granted');
                } else {
                    setSensorsStatus('denied');
                    localStorage.setItem('perm_sensors', 'denied');
                }
            } else {
                setSensorsStatus('granted');
                localStorage.setItem('perm_sensors', 'granted');
            }
        } catch (error) {
            console.error(error);
            setSensorsStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const StatusBadge = ({ status }: { status: 'granted' | 'denied' | 'prompt' | 'unknown' }) => {
        const config = {
            granted: { color: '#A3E635', text: 'ACTIVADO', icon: CheckCircle2 },
            denied: { color: '#ef4444', text: 'DENEGADO', icon: AlertCircle },
            prompt: { color: '#fbbf24', text: 'PENDIENTE', icon: AlertCircle },
            unknown: { color: 'var(--text-dim)', text: 'DESCONOCIDO', icon: AlertCircle },
        }[status || 'unknown'];

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
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'var(--primary)',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}>
                            <ShieldCheck size={20} color="var(--secondary)" />
                            <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>
                                PERMISOS <span style={{ color: 'var(--secondary)' }}>DEL</span> SISTEMA
                            </h2>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {/* GPS */}
                            <div className="glass" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                            <Navigation size={24} color="var(--secondary)" />
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
                                    disabled={isRequesting === 'gps' || gpsStatus === 'granted'}
                                    className="glass"
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: gpsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                        color: gpsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                        fontWeight: '700', borderRadius: '12px', opacity: (isRequesting === 'gps' || gpsStatus === 'granted') ? 0.7 : 1
                                    }}
                                >
                                    {isRequesting === 'gps' ? 'SOLICITANDO...' : gpsStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                                </button>
                                {gpsStatus === 'denied' && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
                                        ⚠️ Permiso bloqueado. Ve a Ajustes del Celular &gt; Safari/Chrome &gt; Ubicación.
                                    </p>
                                )}
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
                                    disabled={isRequesting === 'camera' || cameraStatus === 'granted'}
                                    className="glass"
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: cameraStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                        color: cameraStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                        fontWeight: '700', borderRadius: '12px', opacity: (isRequesting === 'camera' || cameraStatus === 'granted') ? 0.7 : 1
                                    }}
                                >
                                    {isRequesting === 'camera' ? 'SOLICITANDO...' : cameraStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                                </button>
                            </div>

                            {/* Sensors */}
                            <div className="glass" style={{ padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                            <Smartphone size={24} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Sensores de Movimiento</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                                Esencial para el Green Reader y lectura de caída.
                                            </p>
                                        </div>
                                    </div>
                                    <StatusBadge status={sensorsStatus} />
                                </div>
                                <button
                                    onClick={handleRequestSensors}
                                    disabled={isRequesting === 'sensors' || sensorsStatus === 'granted'}
                                    className="glass"
                                    style={{
                                        width: '100%', padding: '12px',
                                        background: sensorsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                        color: sensorsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                        fontWeight: '700', borderRadius: '12px', opacity: (isRequesting === 'sensors' || sensorsStatus === 'granted') ? 0.7 : 1
                                    }}
                                >
                                    {isRequesting === 'sensors' ? 'SOLICITANDO...' : sensorsStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                                </button>
                                {sensorsStatus === 'denied' && (
                                    <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
                                        ⚠️ iOS requiere habilitar "Acceso a movimiento y orientación" en Ajustes &gt; Safari.
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
