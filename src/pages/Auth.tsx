import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, Loader2, ArrowRight, Phone, Award, Hash, Eye, EyeOff } from 'lucide-react';


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
    const [showPassword, setShowPassword] = useState(false);

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

            // Manejo especial para usuario ya registrado
            if (!isLogin && err.message?.toLowerCase().includes('already registered')) {
                setError('Este correo ya tiene una cuenta. Cambiando a Inicio de Sesión...');
                setTimeout(() => {
                    setIsLogin(true);
                    setError(null);
                }, 2000);
                return;
            }

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


    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { currentTarget, clientX, clientY } = e;
        const { left, top } = currentTarget.getBoundingClientRect();
        currentTarget.style.setProperty('--mouse-x', `${clientX - left}px`);
        currentTarget.style.setProperty('--mouse-y', `${clientY - top}px`);
    };

    return (
        <>
            <div className="modern-auth-bg" />
            <div style={{
                minHeight: '100dvh',
                width: '100%',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                fontFamily: '"Outfit", sans-serif',
                overflow: 'hidden',
                zIndex: 1
            }}>
                {/* Elegant Background Grid & Orbs */}
                <div className="grid-overlay" />

            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{
                    width: '100%',
                    maxWidth: '420px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10
                }}
            >
                {/* Logo Area */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
                    style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                    <div style={{
                        width: '72px',
                        height: '72px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '4px solid #a3e635',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '16px',
                        boxShadow: '0 0 32px rgba(163, 230, 53, 0.6), inset 0 4px 8px rgba(0,0,0,0.05)'
                    }}>
                        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <ellipse cx="12" cy="18" rx="8" ry="3.5" fill="#0A364D" />
                            <ellipse cx="12" cy="18" rx="2.5" ry="1.2" fill="#ffffff" />
                            <rect x="11.2" y="5" width="1.6" height="13" fill="#0A364D" />
                            <path d="M12.8 5 L18 5.5 C19.5 5.7 19.5 9.3 18 9.5 L12.8 10 V5 Z" fill="#0A364D" />
                        </svg>
                    </div>
                    <h2 style={{
                        fontSize: '15px',
                        fontWeight: '500',
                        color: 'white',
                        letterSpacing: '6px',
                        textTransform: 'uppercase',
                        margin: 0
                    }}>APEG</h2>
                </motion.div>

                {/* Glass Card Container */}
                <div 
                    className="spotlight-card"
                    onMouseMove={handleMouseMove}
                    style={{
                        background: 'rgba(20, 20, 20, 0.4)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '32px',
                        padding: '40px 32px',
                        width: '100%',
                        boxShadow: '0 30px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                    }}
                >
                    <div className="noise-overlay" />
                    
                    <div className="spotlight-content">
                        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: '300',
                            letterSpacing: '-0.5px',
                            marginBottom: '8px'
                        }}>
                            {isLogin ? 'Bienvenido' : 'Crear perfil'}
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px', fontWeight: '300' }}>
                            {isLogin ? 'Accede a tu portal exclusivo' : 'Únete a la élite del golf'}
                        </p>
                    </div>

                    {/* Form Container */}
                    <div style={{ minHeight: isLogin ? '200px' : '360px', display: 'flex', flexDirection: 'column', transition: 'min-height 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }}>
                        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                            <AnimatePresence>
                                {!isLogin && (
                                    <motion.div
                                        key="register-fields"
                                        initial={{ opacity: 0, y: -10, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.98 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                                    >
                                        <div style={{ position: 'relative' }}>
                                            <User size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                id="full-name"
                                                name="name"
                                                autoComplete="name"
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

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div style={{ position: 'relative' }}>
                                                <Award size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                                <input
                                                    id="handicap"
                                                    name="handicap"
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
                                                <Hash size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                                            <Phone size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            <input
                                                id="phone"
                                                name="tel"
                                                autoComplete="tel"
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
                                <Mail size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    id="email"
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
                                <Lock size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
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
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255,255,255,0.4)',
                                        cursor: 'pointer',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    style={{
                                        fontSize: '12px',
                                        color: error.includes('exitoso') ? '#A3E635' : '#ef4444',
                                        textAlign: 'center',
                                        background: error.includes('exitoso') ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        border: error.includes('exitoso') ? '1px solid rgba(163, 230, 53, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                        padding: '10px',
                                        borderRadius: '12px',
                                        marginTop: '4px'
                                    }}
                                >
                                    {error}
                                </motion.div>
                            )}

                            <div style={{ marginTop: '16px' }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    disabled={loading}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                        color: '#0E2F1F',
                                        border: 'none',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        letterSpacing: '1px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '12px',
                                        cursor: loading ? 'default' : 'pointer',
                                        boxShadow: '0 12px 24px rgba(163, 230, 53, 0.25)',
                                        opacity: loading ? 0.8 : 1,
                                    }}
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                        <>
                                            {isLogin ? 'ENTRAR' : 'REGISTRARME'}
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </form>
                    </div>

                    {/* Footer Interactions */}
                    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '13px',
                                fontWeight: '300',
                                cursor: 'pointer'
                            }}
                        >
                            {isLogin ? (
                                <span>¿Nuevo en APEG? <span style={{ color: 'var(--secondary)', fontWeight: '500', marginLeft: '4px' }}>Crea tu cuenta</span></span>
                            ) : (
                                <span>¿Ya eres socio? <span style={{ color: 'var(--secondary)', fontWeight: '500', marginLeft: '4px' }}>Inicia sesión</span></span>
                            )}
                        </button>
                    </div>
                </div>
                </div>

                <p style={{
                    marginTop: '32px',
                    color: 'rgba(255,255,255,0.2)',
                    fontSize: '11px',
                    textAlign: 'center',
                    letterSpacing: '2px',
                    textTransform: 'uppercase'
                }}>
                    © 2026 APEG
                </p>
            </motion.div>
        </div>
        </>
    );
};

// Extracted styles and handlers
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 16px 16px 48px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '300',
    outline: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
};

const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(163, 230, 53, 0.4)';
    e.target.style.background = 'rgba(0, 0, 0, 0.4)';
    e.target.style.boxShadow = '0 0 0 4px rgba(163, 230, 53, 0.05), inset 0 2px 4px rgba(0,0,0,0.1)';
};

const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
    e.target.style.background = 'rgba(0, 0, 0, 0.2)';
    e.target.style.boxShadow = 'inset 0 2px 4px rgba(0,0,0,0.1)';
};

export default Auth;

