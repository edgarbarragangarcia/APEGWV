import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation, CheckCircle2, AlertCircle, ShieldCheck, Camera as CameraIcon } from 'lucide-react';
import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import PageHeader from '../components/PageHeader';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt'>(
        'prompt'
    );
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>(
        'prompt'
    );
    const [isRequesting, setIsRequesting] = useState<string | null>(null);

    useEffect(() => {
        checkPermissions();
    }, []);

    const checkPermissions = async () => {
        // Check GPS permission
        try {
            const gpsPermission = await Geolocation.checkPermissions();
            console.log('GPS Permission:', gpsPermission);

            if (gpsPermission.location === 'granted' || gpsPermission.coarseLocation === 'granted') {
                setGpsStatus('granted');
            } else if (gpsPermission.location === 'denied') {
                setGpsStatus('denied');
            } else {
                setGpsStatus('prompt');
            }
        } catch (e) {
            console.error('Error checking GPS permission:', e);
            setGpsStatus('prompt');
        }

        // Check Camera permission
        try {
            const cameraPermission = await Camera.checkPermissions();
            console.log('Camera Permission:', cameraPermission);

            if (cameraPermission.camera === 'granted') {
                setCameraStatus('granted');
            } else if (cameraPermission.camera === 'denied') {
                setCameraStatus('denied');
            } else {
                setCameraStatus('prompt');
            }
        } catch (e) {
            console.error('Error checking camera permission:', e);
            setCameraStatus('prompt');
        }
    };

    const handleRequestGps = async () => {
        setIsRequesting('gps');
        try {
            const permission = await Geolocation.requestPermissions();
            console.log('GPS Permission Requested:', permission);

            if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                setGpsStatus('granted');
            } else if (permission.location === 'denied') {
                setGpsStatus('denied');
            } else {
                setGpsStatus('prompt');
            }
        } catch (err) {
            console.error('Error requesting GPS permission:', err);
            setGpsStatus('denied');
        } finally {
            setIsRequesting(null);
        }
    };

    const handleRequestCamera = async () => {
        setIsRequesting('camera');
        try {
            const permission = await Camera.requestPermissions();
            console.log('Camera Permission Requested:', permission);

            if (permission.camera === 'granted') {
                setCameraStatus('granted');
            } else if (permission.camera === 'denied') {
                setCameraStatus('denied');
            } else {
                setCameraStatus('prompt');
            }
        } catch (err) {
            console.error('Error requesting camera permission:', err);
            setCameraStatus('denied');
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
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default Settings;
