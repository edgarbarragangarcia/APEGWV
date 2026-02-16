import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, Loader2, ArrowRight, Phone, Award, Hash, Trophy, Activity, Zap, Users } from 'lucide-react';


const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: '',
        handicap: '',
        federationCode: '',
        phone: ''
    });

    const features = [
        { icon: Trophy, label: 'Torneos' },
        { icon: Activity, label: 'Hándicap' },
        { icon: Zap, label: 'Resultados' },
        { icon: Users, label: 'Comunidad' }
    ];

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // --- SOLUCIÓN RADICAL: Si es LOCALHOST, usar FETCH PROXY de inmediato ---
        if (import.meta.env.DEV && isLogin) {
            console.log('--- MODO DE RESILIENCIA ACTIVADO: Usando bypass de red ---');
            try {
                const { manualLogin } = await import('../services/SupabaseManager');
                const authData = await manualLogin(formData.email, formData.password);

                if (authData.access_token) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: authData.access_token,
                        refresh_token: authData.refresh_token
                    });
                    if (sessionError) throw sessionError;
                    return; // ÉXITO TOTAL
                }
            } catch (err: any) {
                console.error('Fallo en Bypass:', err);
                setError('Error crítico de red en tu sistema. Supabase no responde.');
            } finally {
                setLoading(false);
            }
            return;
        }

        // Si no es dev o es registro, usar flujo normal (con timeout)
        const authPromise = isLogin
            ? supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password,
            })
            : supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        handicap: formData.handicap,
                        federation_code: formData.federationCode,
                        phone: formData.phone
                    }
                }
            });

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('La conexión está tardando demasiado. Revisa tu conexión o extensiones del navegador.')), 10000)
        );

        try {
            const { error }: any = await Promise.race([authPromise, timeoutPromise]);
            if (error) throw error;
            if (!isLogin && !error) {
                setError('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
            }
        } catch (err: any) {
            console.error('Auth Error:', err);

            // BYPASS LOGIC: Si es un timeout o error de conexión, intentar login directo
            if (isLogin && (err.message.includes('tardando') || err.message.includes('timeout') || err.message.includes('bloqueadas'))) {
                console.log('--- INICIANDO BYPASS DE SEGURIDAD (DIRECT FETCH) ---');
                try {
                    const { manualLogin } = await import('../services/SupabaseManager');
                    const authData = await manualLogin(formData.email, formData.password);

                    if (authData.access_token) {
                        console.log('--- BYPASS EXITOSO ---');
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: authData.access_token,
                            refresh_token: authData.refresh_token
                        });
                        if (sessionError) throw sessionError;
                        return; // Éxito, el AuthProvider detectará el cambio
                    }
                } catch (bypassErr: any) {
                    console.error('Bypass failed:', bypassErr);
                    setError(`Error crítico: ${bypassErr.message}. Tu navegador bloquea toda conexión a la base de datos.`);
                }
            } else {
                setError(err.message || 'Error de conexión. Las peticiones están siendo bloqueadas por tu navegador.');
            }
        } finally {
            setLoading(false);
        }
    };

    const [connStatus, setConnStatus] = useState<'testing' | 'ok' | 'fail'>('testing');

    React.useEffect(() => {
        const test = async () => {
            try {
                const res = await fetch('/supabase-proxy/auth/v1/health');
                setConnStatus(res.ok || res.status === 401 ? 'ok' : 'fail');
            } catch {
                setConnStatus('fail');
            }
        };
        test();
    }, []);

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 0',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden'
        }}>
            {/* Status Indicator */}
            <div style={{
                position: 'fixed',
                top: 20,
                right: 20,
                zIndex: 100,
                padding: '8px 12px',
                borderRadius: '20px',
                background: 'rgba(0,0,0,0.8)',
                color: 'white',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: connStatus === 'ok' ? '#4ade80' : connStatus === 'fail' ? '#ef4444' : '#f59e0b'
                }} />
                {connStatus === 'ok' ? 'Servidor Conectado' : connStatus === 'fail' ? 'Error de Red Local' : 'Verificando red...'}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    width: '92%',
                    maxWidth: 'var(--app-max-width)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}
            >
                {/* Glass Card Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '24px',
                    padding: '18px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>

                    {/* App Description */}
                    <div style={{ textAlign: 'center', marginBottom: '24px', marginTop: '10px' }}>
                        <h2 style={{
                            fontSize: '22px',
                            fontWeight: '800',
                            background: 'linear-gradient(135deg, #fff 0%, #ccc 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '8px',
                            letterSpacing: '0.5px'
                        }}>APEG GOLF</h2>

                        <p style={{
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.8)',
                            maxWidth: '280px',
                            margin: '0 auto 16px auto',
                            lineHeight: '1.5',
                            fontWeight: '400'
                        }}>
                            La plataforma definitiva para gestionar tu vida como golfista profesional y amateur.
                        </p>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            flexWrap: 'wrap',
                            marginBottom: '4px'
                        }}>
                            {features.map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    background: 'rgba(163, 230, 53, 0.08)',
                                    border: '1px solid rgba(163, 230, 53, 0.15)',
                                    borderRadius: '16px',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <item.icon size={12} color="#A3E635" strokeWidth={2.5} />
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        color: '#A3E635',
                                        letterSpacing: '0.3px'
                                    }}>
                                        {item.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: '700',
                            letterSpacing: '-0.5px',
                            marginBottom: '2px'
                        }}>
                            {isLogin ? 'Bienvenido de nuevo' : 'Crea tu perfil'}
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '12px' }}>
                            {isLogin ? 'Accede a tu cuenta de golf' : 'Forma parte de la comunidad apeg'}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div style={{ minHeight: isLogin ? '200px' : '320px', display: 'flex', flexDirection: 'column', transition: 'min-height 0.3s ease' }}>
                        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                            <AnimatePresence mode="popLayout">
                                {!isLogin && (
                                    <motion.div
                                        key="register-fields"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <User size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="text"
                                                placeholder="Nombre Completo"
                                                required={!isLogin}
                                                value={formData.fullName}
                                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                                style={inputStyle}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                            />
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Award size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="number"
                                                    placeholder="Hándicap"
                                                    required={!isLogin}
                                                    value={formData.handicap}
                                                    onChange={(e) => setFormData({ ...formData, handicap: e.target.value })}
                                                    style={inputStyle}
                                                    onFocus={handleFocus}
                                                    onBlur={handleBlur}
                                                />
                                            </div>
                                            <div style={{ position: 'relative' }}>
                                                <Hash size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    type="text"
                                                    placeholder="Código Fed."
                                                    required={!isLogin}
                                                    value={formData.federationCode}
                                                    onChange={(e) => setFormData({ ...formData, federationCode: e.target.value })}
                                                    style={inputStyle}
                                                    onFocus={handleFocus}
                                                    onBlur={handleBlur}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ position: 'relative' }}>
                                            <Phone size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                type="tel"
                                                placeholder="Teléfono Celular"
                                                required={!isLogin}
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                style={inputStyle}
                                                onFocus={handleFocus}
                                                onBlur={handleBlur}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div style={{ position: 'relative' }}>
                                <Mail size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="email"
                                    name="email"
                                    autoComplete="username"
                                    placeholder="Correo Electrónico"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>

                            <div style={{ position: 'relative' }}>
                                <Lock size={16} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    type="password"
                                    name="password"
                                    autoComplete={isLogin ? "current-password" : "new-password"}
                                    placeholder="Contraseña"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    style={inputStyle}
                                    onFocus={handleFocus}
                                    onBlur={handleBlur}
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{
                                        fontSize: '11px',
                                        color: error.includes('exitoso') ? '#4ade80' : '#f87171',
                                        textAlign: 'center',
                                        background: 'rgba(0,0,0,0.2)',
                                        padding: '5px',
                                        borderRadius: '8px'
                                    }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div style={{ marginTop: '5px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading}
                                    className="btn-primary"
                                    style={{
                                        color: '#0f3923', // Keep the dark text color for this specific button as it was part of the original design on top of the gradient? Or should I strictly follow the new class which has primary text color? 
                                        // The new class has `color: var(--primary)` which is dark green #0E2F1F.
                                        // The original design had `#0f3923`. It's very similar.
                                        // The new class is: color: var(--primary);
                                        // Let's use the class fully.
                                        // However, motion.button might need explicit styled props if I want to override or just className.
                                        // Since I'm using className, I should remove the style prop EXCEPT for what's not in the class.
                                        // But wait, the previous style had specific shadows.
                                        // The class has shadows.
                                        // I will remove the entire style prop and rely on the class.
                                        // EXCEPT, wait. motion components accept style.
                                    }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={18} /> : (
                                        <>
                                            {isLogin ? 'ENTRAR' : 'REGISTRARME'}
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>

                    {/* Footer Interactions */}
                    <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '12px',
                                cursor: 'pointer'
                            }}
                        >
                            {isLogin ? (
                                <span>¿Nuevo en APEG? <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Crea tu cuenta</span></span>
                            ) : (
                                <span>¿Ya eres socio? <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Inicia sesión</span></span>
                            )}
                        </button>

                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '8px' }}>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                disabled={true}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '12px',
                                    fontWeight: '500',
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: 0.6
                                }}
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" />
                                </svg>
                                Google Login
                            </motion.button>

                            <button
                                onClick={() => {
                                    localStorage.clear();
                                    sessionStorage.clear();
                                    window.location.reload();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '8px',
                                    background: 'none',
                                    color: 'rgba(255,255,255,0.3)',
                                    borderRadius: '10px',
                                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    marginTop: '8px'
                                }}
                            >
                                RECOBRAR Y REFRESCAR APP
                            </button>
                        </div>
                    </div>
                </div>

                <p style={{
                    marginTop: '12px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '9px',
                    textAlign: 'center',
                    letterSpacing: '1px'
                }}>
                    © 2024 APEG GOLF ASSOCIATION
                </p>
            </motion.div>
        </div>
    );
};

// Extracted styles and handlers
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    fontSize: '13px',
    fontWeight: '400',
    outline: 'none',
    transition: 'all 0.3s ease'
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--secondary)';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)';
};

export default Auth;

