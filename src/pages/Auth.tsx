import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, Loader2 } from 'lucide-react';
import logoApeg from '../assets/apeg_logo_v2.png';

const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        fullName: ''
    });

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email: formData.email,
                    password: formData.password,
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.fullName,
                        }
                    }
                });
                if (error) throw error;
                setError('¡Registro exitoso! Por favor revisa tu correo para confirmar.');
            }
        } catch (err: any) {
            setError(err.message || 'Ocurrió un error inesperado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100vw',
            background: 'linear-gradient(135deg, #1a4d33 0%, #0b2e1e 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Outfit", sans-serif' // Ensuring modern font
        }}>
            {/* Background Blobs (Organic Shapes) */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-20%',
                width: '60%',
                height: '40%',
                background: '#2d6a4f',
                borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
                opacity: 0.4,
                filter: 'blur(60px)',
                zIndex: 0
            }} />
            <div style={{
                position: 'absolute',
                bottom: '-10%',
                right: '-10%',
                width: '70%',
                height: '50%',
                background: '#40916c',
                borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                opacity: 0.3,
                filter: 'blur(50px)',
                zIndex: 0
            }} />

            {/* "Sun" Glow behind logo */}
            <div style={{
                position: 'absolute',
                top: '15%',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '280px',
                height: '280px',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '50%',
                zIndex: 1
            }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    zIndex: 10,
                    width: '100%',
                    maxWidth: '380px',
                    padding: '0 30px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                }}
            >
                {/* Logo Section */}
                <div style={{
                    marginBottom: '30px',
                    position: 'relative'
                }}>
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <img
                            src={logoApeg}
                            alt="APEG Logo"
                            style={{
                                width: '140px',
                                height: '140px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))'
                            }}
                        />
                    </motion.div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '32px',
                        fontWeight: '700',
                        marginBottom: '8px',
                        letterSpacing: '1px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        APEG GOLF
                    </h1>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '15px' }}>
                        {isLogin ? 'Bienvenido de nuevo' : 'Únete a la comunidad'}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleAuth} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="register-name"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div style={{ position: 'relative' }}>
                                    <User size={20} color="#1a4d33" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                                    <input
                                        type="text"
                                        placeholder="Nombre Completo"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        style={{
                                            width: '100%',
                                            padding: '16px 20px 16px 55px',
                                            borderRadius: '50px', // Pill shape
                                            border: 'none',
                                            background: 'white',
                                            color: '#1a4d33',
                                            fontSize: '15px',
                                            fontWeight: '500',
                                            outline: 'none',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div style={{ position: 'relative' }}>
                        <Mail size={20} color="#1a4d33" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                        <input
                            type="email"
                            name="email"
                            autoComplete="username"
                            placeholder="Tu Correo Electrónico"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 55px',
                                borderRadius: '50px', // Pill shape
                                border: 'none',
                                background: 'white',
                                color: '#1a4d33',
                                fontSize: '15px',
                                fontWeight: '500',
                                outline: 'none',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>

                    <div style={{ position: 'relative' }}>
                        <Lock size={20} color="#1a4d33" style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', zIndex: 10 }} />
                        <input
                            type="password"
                            name="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            placeholder="Tu Contraseña"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '16px 20px 16px 55px',
                                borderRadius: '50px', // Pill shape
                                border: 'none',
                                background: 'white',
                                color: '#1a4d33',
                                fontSize: '15px',
                                fontWeight: '500',
                                outline: 'none',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                fontSize: '13px',
                                color: 'white',
                                textAlign: 'center',
                                background: error.includes('exitoso') ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.4)',
                                padding: '10px 20px',
                                borderRadius: '20px',
                                backdropFilter: 'blur(5px)'
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            background: '#dcfce7', // Very light green
                            color: '#14532d', // Dark green text
                            borderRadius: '50px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: '700',
                            marginTop: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            boxShadow: '0 5px 20px rgba(0,0,0,0.2)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            isLogin ? 'INICIAR SESIÓN' : 'REGISTRARME'
                        )}
                    </motion.button>
                </form>

                {/* Social Login */}
                <div style={{ width: '100%', marginTop: '30px' }}>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={true} // Disabled as requested
                        style={{
                            width: '100%',
                            padding: '14px',
                            background: 'rgba(255, 255, 255, 0.15)',
                            color: 'white',
                            borderRadius: '50px',
                            border: '1px solid rgba(255, 255, 255, 0.3)',
                            fontSize: '14px',
                            fontWeight: '600',
                            cursor: 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            opacity: 0.7,
                            backdropFilter: 'blur(5px)'
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                fill="white"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="white"
                                fillOpacity="0.8"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="white"
                                fillOpacity="0.8"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="white"
                                fillOpacity="0.8"
                            />
                        </svg>
                        Continuar con Google
                    </motion.button>
                </div>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '500',
                            textDecoration: 'underline',
                            opacity: 0.9,
                            cursor: 'pointer'
                        }}
                    >
                        {isLogin ? '¿No tienes cuenta? Registrate aquí' : '¿Ya tienes cuenta? Ingresa aquí'}
                    </button>
                    <div style={{ marginTop: '15px' }}>
                        <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                            Continuar como invitado
                        </button>
                    </div>
                </div>

            </motion.div>
        </div>
    );
};

export default Auth;
