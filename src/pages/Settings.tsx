import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Navigation, Smartphone, CheckCircle2, AlertCircle, ShieldCheck, Camera as CameraIcon } from 'lucide-react';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [sensorsStatus, setSensorsStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
    const [isRequesting, setIsRequesting] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        // Check GPS
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name: 'geolocation' as any });
                setGpsStatus(status.state);
                status.onchange = () => setGpsStatus(status.state);
            } catch (e) {
                console.error('Error checking GPS permission:', e);
            }
        }

        // Check Camera
        if ('permissions' in navigator) {
            try {
                const status = await navigator.permissions.query({ name: 'camera' as any });
                setCameraStatus(status.state);
                status.onchange = () => setCameraStatus(status.state);
            } catch (e) {
                console.error('Error checking Camera permission:', e);
            }
        }

        // Check Sensors (iOS 13+ requires explicit permission for both motion and orientation)
        const needsMotionPermission = typeof (DeviceMotionEvent as any).requestPermission === 'function';
        const needsOrientationPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function';

        if (needsMotionPermission || needsOrientationPermission) {
            // iOS requires explicit request, we can't easily "query" it like GPS
            // Set to prompt initially, will update after user requests
            setSensorsStatus('prompt');
        } else {
            // Android/Desktop usually don't require explicit permission or it's implicitly granted
            setSensorsStatus('granted');
        }
    };

    const handleRequestGps = () => {
        setIsRequesting('gps');
        navigator.geolocation.getCurrentPosition(
            () => {
                setGpsStatus('granted');
                setIsRequesting(null);
            },
            (err) => {
                console.error(err);
                // Handle timeout specifically to allow retry
                if (err.code === err.TIMEOUT) {
                    setGpsStatus('prompt');
                } else {
                    setGpsStatus('denied');
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
            // Close stream immediately after success
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error(err);
            setCameraStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const handleRequestSensors = async () => {
        setIsRequesting('sensors');

        try {
            // Check if we're on iOS 13+ which requires explicit permission
            const needsPermission = typeof (DeviceOrientationEvent as any).requestPermission === 'function' ||
                typeof (DeviceMotionEvent as any).requestPermission === 'function';

            if (needsPermission) {
                let motionGranted = true;
                let orientationGranted = true;

                // Request DeviceMotionEvent permission (accelerometer)
                if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                    try {
                        const motionResponse = await (DeviceMotionEvent as any).requestPermission();
                        motionGranted = motionResponse === 'granted';
                        console.log('DeviceMotionEvent permission:', motionResponse);
                    } catch (error) {
                        console.error('Error requesting DeviceMotionEvent permission:', error);
                        motionGranted = false;
                    }
                }

                // Request DeviceOrientationEvent permission (gyroscope)
                if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                    try {
                        const orientationResponse = await (DeviceOrientationEvent as any).requestPermission();
                        orientationGranted = orientationResponse === 'granted';
                        console.log('DeviceOrientationEvent permission:', orientationResponse);
                    } catch (error) {
                        console.error('Error requesting DeviceOrientationEvent permission:', error);
                        orientationGranted = false;
                    }
                }

                // Both permissions must be granted for full sensor access
                if (motionGranted && orientationGranted) {
                    setSensorsStatus('granted');
                } else {
                    setSensorsStatus('denied');
                }
            } else {
                // Android/Desktop - no explicit permission needed
                setSensorsStatus('granted');
            }
        } catch (error) {
            console.error('Unexpected error requesting sensor permissions:', error);
            setSensorsStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const StatusBadge = ({ status }: { status: 'granted' | 'denied' | 'prompt' | 'unknown' }) => {
        const statuses = {
            granted: { color: '#A3E635', text: 'ACTIVADO', icon: CheckCircle2 },
            denied: { color: '#ef4444', text: 'DENEGADO', icon: AlertCircle },
            prompt: { color: '#fbbf24', text: 'PENDIENTE', icon: AlertCircle },
            unknown: { color: 'var(--text-dim)', text: 'DESCONOCIDO', icon: AlertCircle },
        };
        const config = statuses[status];

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '800', color: config.color }}>
                <config.icon size={14} />
                <span>{config.text}</span>
            </div>
        );
    };

    return (
        <div className="animate-fade" style={{ paddingBottom: '40px' }}>
            <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate(-1)}
                    className="glass"
                    style={{ padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}
                >
                    <ChevronLeft size={20} />
                </button>
                <h1 style={{ fontSize: '24px' }}>Configuración</h1>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <section>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingLeft: '5px' }}>
                        <ShieldCheck size={20} color="var(--secondary)" />
                        <h2 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-dim)' }}>PERMISOS DEL SISTEMA</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {/* GPS Setting */}
                        <div className="glass" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                        <Navigation size={24} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Ubicación (GPS)</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                            Necesario para medir distancias al green y ordenar campos.
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
                                    width: '100%',
                                    padding: '12px',
                                    background: gpsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                    color: gpsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    opacity: (isRequesting === 'gps' || gpsStatus === 'granted') ? 0.7 : 1
                                }}
                            >
                                {isRequesting === 'gps' ? 'SOLICITANDO...' : gpsStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                            </button>

                            {gpsStatus === 'denied' && (
                                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
                                    ⚠️ Permiso bloqueado. Ve a Ajustes del Celular &gt; Safari/Chrome &gt; Ubicación y actívalo.
                                </p>
                            )}
                        </div>

                        {/* Camera Setting */}
                        <div className="glass" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                        <CameraIcon size={24} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Cámara</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                            Usado para cambiar tu foto de perfil y subir productos a tu tienda.
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
                                    width: '100%',
                                    padding: '12px',
                                    background: cameraStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                    color: cameraStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    opacity: (isRequesting === 'camera' || cameraStatus === 'granted') ? 0.7 : 1
                                }}
                            >
                                {isRequesting === 'camera' ? 'SOLICITANDO...' : cameraStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                            </button>

                            {cameraStatus === 'denied' && (
                                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
                                    ⚠️ No hay acceso a cámara. Ve a Ajustes &gt; Safari/Chrome &gt; Cámara y selecciona "Permitir".
                                </p>
                            )}
                        </div>

                        {/* Sensors Setting */}
                        <div className="glass" style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '10px', borderRadius: '12px' }}>
                                        <Smartphone size={24} color="var(--secondary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '16px', marginBottom: '2px' }}>Sensores de Movimiento</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', maxWidth: '200px' }}>
                                            Usado para el Green Reader y lectura de caída.
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
                                    width: '100%',
                                    padding: '12px',
                                    background: sensorsStatus === 'granted' ? 'rgba(163, 230, 53, 0.1)' : 'var(--secondary)',
                                    color: sensorsStatus === 'granted' ? 'var(--secondary)' : 'var(--primary)',
                                    fontWeight: '700',
                                    borderRadius: '12px',
                                    opacity: (isRequesting === 'sensors' || sensorsStatus === 'granted') ? 0.7 : 1
                                }}
                            >
                                {isRequesting === 'sensors' ? 'SOLICITANDO...' : sensorsStatus === 'granted' ? 'PERMISO CONCEDIDO' : 'SOLICITAR PERMISO'}
                            </button>

                            {sensorsStatus === 'denied' && (
                                <p style={{ fontSize: '11px', color: '#ef4444', marginTop: '10px', textAlign: 'center' }}>
                                    ⚠️ iOS requiere permiso. Si lo denegaste, debes recargar la página o habilitar "Acceso a movimiento y orientación" en Ajustes &gt; Safari.
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                <div className="glass" style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.02)', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                        Nota: Si un permiso aparece como "DENEGADO", deberás habilitarlo manualmente en los ajustes de tu navegador o sistema operativo para esta App.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Settings;
