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

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [gpsStatus, setGpsStatus] = useState<'granted' | 'denied' | 'prompt'>(
        'prompt'
    );
    const [cameraStatus, setCameraStatus] = useState<'granted' | 'denied' | 'prompt'>(
        'prompt'
    );
    const [isRequesting, setIsRequesting] = useState<string | null>(null);
    const [debugInfo, setDebugInfo] = useState<string>('');

    useEffect(() => {
        checkPermissions();

        // Listen for when the app comes back to foreground (e.g., user returns from Settings)
        const appStateListener = App.addListener('appStateChange', ({ isActive }) => {
            if (isActive) {
                console.log('App resumed, re-checking permissions...');
                checkPermissions();
            }
        });

        return () => {
            appStateListener.then(listener => listener.remove());
        };
    }, []);

    const checkPermissions = async (forceRequest = false) => {
        console.log('--- Checking Permissions ---');
        let debug = `Timestamp: ${new Date().toLocaleTimeString()}\n`;

        // Check GPS permission
        try {
            let gpsPermission = await Geolocation.checkPermissions();
            debug += `GPS (init): ${JSON.stringify(gpsPermission)}\n`;

            // Si el estado es 'prompt' y el usuario forzó la actualización, 
            // intentamos un requestPermissions que suele sincronizar el estado nativo
            if (forceRequest && (gpsPermission.location === 'prompt' || gpsPermission.coarseLocation === 'prompt')) {
                gpsPermission = await Geolocation.requestPermissions();
                debug += `GPS (after sync): ${JSON.stringify(gpsPermission)}\n`;
            }

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
            debug += `GPS Err: ${e}\n`;
        }

        // Check Camera permission
        try {
            let cameraPermission = await Camera.checkPermissions();
            debug += `Cam (init): ${JSON.stringify(cameraPermission)}\n`;

            if (forceRequest && cameraPermission.camera === 'prompt') {
                cameraPermission = await Camera.requestPermissions();
                debug += `Cam (after sync): ${JSON.stringify(cameraPermission)}\n`;
            }

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
            debug += `Cam Err: ${e}\n`;
        }

        setDebugInfo(debug);
    };

    const handleRequestGps = async () => {
        if (gpsStatus === 'granted') return;
        setIsRequesting('gps');

        try {
            const permission = await Geolocation.requestPermissions();
            if (permission.location === 'granted' || permission.coarseLocation === 'granted') {
                setGpsStatus('granted');
            } else {
                setGpsStatus(permission.location === 'denied' ? 'denied' : 'prompt');
            }
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
            const permission = await Camera.requestPermissions();
            if (permission.camera === 'granted') {
                setCameraStatus('granted');
            } else {
                setCameraStatus(permission.camera === 'denied' ? 'denied' : 'prompt');
            }
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
                    <button
                        onClick={() => checkPermissions(true)}
                        className="glass"
                        style={{
                            padding: '10px',
                            fontSize: '12px',
                            color: 'var(--secondary)',
                            border: '1px solid var(--secondary)',
                            marginBottom: '10px',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 FORZAR SINCRONIZACIÓN CON EL SISTEMA
                    </button>

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
                                {gpsStatus !== 'granted' && (
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '8px', lineHeight: '1.4' }}>
                                            ⚠️ Si ya lo activaste en Ajustes y sigue aquí como PENDIENTE, toca el botón de arriba nuevamente para forzar la lectura.
                                        </p>
                                    </div>
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
                                {cameraStatus !== 'granted' && (
                                    <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: '#fbbf24', marginBottom: '8px', lineHeight: '1.4' }}>
                                            ⚠️ Si ya activaste la cámara en ajustes, intenta tocar el botón de arriba.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Debug Info expanded */}
                    <div style={{
                        marginTop: '20px',
                        padding: '15px',
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <p style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '8px' }}>DIAGNÓSTICO TÉCNICO:</p>
                        <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#fff', opacity: 0.8, whiteSpace: 'pre-wrap' }}>
                            {debugInfo || 'No hay datos de diagnóstico aún.'}
                        </div>
                        <p style={{ fontSize: '9px', marginTop: '10px', color: 'var(--text-dim)' }}>
                            ID Plataforma: {Capacitor.getPlatform()}<br />
                            Nativo: {Capacitor.isNativePlatform() ? 'SÍ' : 'NO'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
