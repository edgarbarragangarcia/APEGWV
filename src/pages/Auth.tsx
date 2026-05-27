import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, Loader2, Phone, Award, Hash, Trophy, Eye, EyeOff } from 'lucide-react';

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
    const [rememberMe, setRememberMe] = useState(false);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (import.meta.env.DEV && isLogin) {
            try {
                const { manualLogin } = await import('../services/SupabaseManager');
                const authData = await manualLogin(formData.email, formData.password);

                if (authData.access_token) {
                    const { error: sessionError } = await supabase.auth.setSession({
                        access_token: authData.access_token,
                        refresh_token: authData.refresh_token
                    });
                    if (sessionError) throw sessionError;
                    return; 
                }
            } catch (err: any) {
                console.error('Fallo en Bypass:', err);
                setError('Error crítico de red en tu sistema. Supabase no responde.');
            } finally {
                setLoading(false);
            }
            return;
        }

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
            setTimeout(() => reject(new Error('La conexión está tardando demasiado.')), 10000)
        );

        try {
            const { error }: any = await Promise.race([authPromise, timeoutPromise]);
            if (error) throw error;
            if (!isLogin && !error) {
                setError('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
            }
        } catch (err: any) {
            if (!isLogin && err.message?.toLowerCase().includes('already registered')) {
                setError('Este correo ya tiene una cuenta. Cambiando a Inicio de Sesión...');
                setTimeout(() => {
                    setIsLogin(true);
                    setError(null);
                }, 2000);
                return;
            }

            if (isLogin && (err.message.includes('tardando') || err.message.includes('timeout') || err.message.includes('bloqueadas'))) {
                try {
                    const { manualLogin } = await import('../services/SupabaseManager');
                    const authData = await manualLogin(formData.email, formData.password);

                    if (authData.access_token) {
                        const { error: sessionError } = await supabase.auth.setSession({
                            access_token: authData.access_token,
                            refresh_token: authData.refresh_token
                        });
                        if (sessionError) throw sessionError;
                        return; 
                    }
                } catch (bypassErr: any) {
                    setError(`Error crítico: ${bypassErr.message}. Tu navegador bloquea toda conexión a la base de datos.`);
                }
            } else {
                setError(err.message || 'Error de conexión.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FAFAFA',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden',
        }}>
            <svg width="100%" height="auto" viewBox="0 0 375 280" fill="none" xmlns="http://www.w3.org/2000/svg" style={{position: 'absolute', top: 0, left: 0, zIndex: 0, width: '100%', maxWidth: '500px'}}>
                <path d="M0 0H280C280 0 250 60 180 80C110 100 130 160 80 210C40 250 20 280 0 280V0Z" fill="url(#paint_wave)"/>
                <defs>
                    <linearGradient id="paint_wave" x1="0" y1="0" x2="200" y2="280" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#A3E635"/>
                        <stop offset="1" stopColor="#10b981"/>
                    </linearGradient>
                </defs>
            </svg>

            <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '30%',
                background: 'linear-gradient(to top, rgba(163, 230, 53, 0.15), transparent)',
                zIndex: 0,
                pointerEvents: 'none'
            }} />

            <div style={{
                position: 'relative',
                zIndex: 1,
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '40px 32px',
                width: '100%',
                maxWidth: '480px',
                margin: '0 auto'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
                    <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trophy size={32} color="#0E2F1F" />
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ marginBottom: '40px' }}
                >
                    <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0E2F1F', margin: 0, letterSpacing: '-1px' }}>
                        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
                    </h1>
                </motion.div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <AnimatePresence>
                        {!isLogin && (
                            <motion.div
                                key="register-fields"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
                            >
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <User size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="text" placeholder="Nombre Completo" required={!isLogin} value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} style={inputStyle} />
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Award size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input type="number" placeholder="Hándicap" required={!isLogin} value={formData.handicap} onChange={(e) => setFormData({ ...formData, handicap: e.target.value })} style={inputStyle} />
                                    </div>
                                    <div style={{ position: 'relative', flex: 1 }}>
                                        <Hash size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                                        <input type="text" placeholder="Cód. Fed." required={!isLogin} value={formData.federationCode} onChange={(e) => setFormData({ ...formData, federationCode: e.target.value })} style={inputStyle} />
                                    </div>
                                </div>
                                <div style={{ position: 'relative', marginBottom: '24px' }}>
                                    <Phone size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                                    <input type="tel" placeholder="Teléfono" required={!isLogin} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={inputStyle} />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <Mail size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type="email" placeholder="Correo Electrónico" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} />
                    </div>

                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                        <Lock size={18} color="#10b981" style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)' }} />
                        <input type={showPassword ? "text" : "password"} placeholder="Contraseña" required value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={inputStyle} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>

                    <AnimatePresence>
                        {isLogin && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ accentColor: '#10b981', width: '16px', height: '16px' }} />
                                    <span style={{ fontSize: '13px', color: '#666', fontWeight: '500' }}>Recordarme</span>
                                </label>
                                <button type="button" style={{ fontSize: '13px', color: '#666', fontWeight: '500', background: 'none', border: 'none', cursor: 'pointer' }}>¿Olvidaste tu contraseña?</button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {!isLogin && <div style={{ height: '32px' }} />}

                    {error && <div style={{ fontSize: '13px', color: error.includes('exitoso') ? '#10b981' : '#ef4444', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}

                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={loading} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#10b981', color: 'white', border: 'none', fontSize: '16px', fontWeight: '600', letterSpacing: '1px', cursor: loading ? 'default' : 'pointer', boxShadow: '0 8px 16px rgba(16, 185, 129, 0.25)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        {loading ? <Loader2 className="animate-spin" size={24} /> : (isLogin ? 'ENTRAR' : 'REGISTRARSE')}
                    </motion.button>
                </form>

                <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
                    <p style={{ fontSize: '14px', color: '#666', fontWeight: '500' }}>
                        {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'} {' '}
                        <button onClick={() => setIsLogin(!isLogin)} style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: '700', fontSize: '14px', cursor: 'pointer', padding: 0 }}>
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 12px 12px 32px',
    border: 'none',
    borderBottom: '1.5px solid rgba(16, 185, 129, 0.3)',
    background: 'transparent',
    color: '#0E2F1F',
    fontSize: '15px',
    fontWeight: '500',
    outline: 'none',
    transition: 'border-color 0.3s ease',
};

const AuthWithStyles = () => (
    <>
        <style>{`
            input::placeholder { color: rgba(14, 47, 31, 0.4); font-weight: 400; }
            input:focus { border-bottom-color: #10b981 !important; }
        `}</style>
        <Auth />
    </>
);

export default AuthWithStyles;
