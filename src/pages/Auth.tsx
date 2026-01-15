import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';

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
        <div className="flex-center" style={{
            minHeight: '100dvh',
            width: '100vw',
            background: '#0e2f1f',
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            overflow: 'hidden'
        }}>
            {/* Animated Background Blobs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    top: '-10%',
                    right: '-10%',
                    width: '300px',
                    height: '300px',
                    background: 'var(--secondary)',
                    borderRadius: '50%',
                    filter: 'blur(80px)',
                    opacity: 0.15,
                }}
            />
            <motion.div
                animate={{
                    scale: [1, 1.3, 1],
                    x: [0, -40, 0],
                    y: [0, -50, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                style={{
                    position: 'absolute',
                    bottom: '-5%',
                    left: '-5%',
                    width: '250px',
                    height: '250px',
                    background: 'var(--secondary)',
                    borderRadius: '50%',
                    filter: 'blur(60px)',
                    opacity: 0.1,
                }}
            />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="glass-dark"
                style={{
                    width: '90%',
                    maxWidth: '430px',
                    padding: '40px 25px',
                    borderRadius: '35px',
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(30px) saturate(150%)',
                }}
            >
                {/* Decorative Icon */}
                <div style={{ textAlign: 'center', marginBottom: '35px' }}>
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                        style={{
                            width: '70px',
                            height: '70px',
                            background: 'linear-gradient(135deg, var(--secondary), #7cc42b)',
                            borderRadius: '22px',
                            margin: '0 auto 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 15px 30px rgba(163, 230, 53, 0.3)',
                            color: 'var(--primary)'
                        }}
                    >
                        <User size={35} strokeWidth={1.5} />
                    </motion.div>

                    <h2 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
                        {isLogin ? '¡Hola de nuevo!' : 'Únete a APEG'}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '15px', fontWeight: '400' }}>
                        {isLogin ? 'Accede a tu cuenta de golf' : 'Forma parte de la comunidad exclusiva'}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                key="register-name"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="glass" style={{
                                    padding: '14px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <User size={18} color="var(--text-dim)" />
                                    <input
                                        type="text"
                                        placeholder="Nombre Completo"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '16px'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="glass" style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <Mail size={18} color="var(--text-dim)" />
                        <input
                            type="email"
                            placeholder="Tu email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    <div className="glass" style={{
                        padding: '14px 18px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.05)',
                        borderRadius: '18px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <Lock size={18} color="var(--text-dim)" />
                        <input
                            type="password"
                            placeholder="Tu contraseña"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                fontSize: '16px'
                            }}
                        />
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                fontSize: '13px',
                                color: error.includes('exitoso') ? 'var(--secondary)' : '#ff5f5f',
                                textAlign: 'center',
                                background: error.includes('exitoso') ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255, 95, 95, 0.1)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: `1px solid ${error.includes('exitoso') ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255, 95, 95, 0.2)'}`
                            }}
                        >
                            {error}
                        </motion.div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02, boxShadow: '0 20px 35px rgba(163, 230, 53, 0.2)' }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '16px',
                            borderRadius: '18px',
                            fontWeight: '700',
                            fontSize: '17px',
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 20px rgba(163, 230, 53, 0.1)'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={22} /> : (
                            <>
                                {isLogin ? 'Entrar' : 'Registrarme'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '35px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>
                        {isLogin ? '¿Aún no tienes cuenta?' : '¿Ya eres miembro?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                color: 'var(--secondary)',
                                fontWeight: '600',
                                marginLeft: '8px',
                                transition: 'opacity 0.2s'
                            }}
                        >
                            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
                        </button>
                    </p>
                </div>
            </motion.div>
        </div>
    );
};

export default Auth;
