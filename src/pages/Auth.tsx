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
            padding: '20px 15px',
            background: 'linear-gradient(135deg, #0e2f1f 0%, #1a4d35 100%)',
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            overflow: 'hidden'
        }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-dark"
                style={{
                    width: '100%',
                    maxWidth: '430px',
                    padding: '30px 20px',
                    borderRadius: '30px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <div className="flex-center" style={{
                        width: '60px',
                        height: '60px',
                        background: 'var(--secondary)',
                        borderRadius: '18px',
                        margin: '0 auto 20px',
                        color: 'var(--primary)',
                        boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                    }}>
                        <User size={30} />
                    </div>
                    <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>
                        {isLogin ? '¡Bienvenido!' : 'Crea tu Cuenta'}
                    </h2>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                        {isLogin ? 'Accede a tu cuenta de APEG' : 'Únete a la comunidad de golf más exclusiva'}
                    </p>
                </div>

                <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <AnimatePresence mode="wait">
                        {!isLogin && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                            >
                                <div className="glass" style={{
                                    padding: '12px 15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                }}>
                                    <User size={18} color="var(--text-dim)" />
                                    <input
                                        type="text"
                                        placeholder="Nombre Completo"
                                        required
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none' }}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="glass" style={{
                        padding: '12px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <Mail size={18} color="var(--text-dim)" />
                        <input
                            type="email"
                            placeholder="Email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                fontSize: '16px' // Prevent iOS zoom
                            }}
                        />
                    </div>

                    <div className="glass" style={{
                        padding: '12px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                    }}>
                        <Lock size={18} color="var(--text-dim)" />
                        <input
                            type="password"
                            placeholder="Contraseña"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'white',
                                width: '100%',
                                outline: 'none',
                                fontSize: '16px' // Prevent iOS zoom
                            }}
                        />
                    </div>

                    {error && (
                        <div style={{
                            fontSize: '13px',
                            color: error.includes('exitoso') ? 'var(--secondary)' : '#ff4444',
                            textAlign: 'center',
                            background: 'rgba(255, 68, 68, 0.1)',
                            padding: '10px',
                            borderRadius: '10px'
                        }}>
                            {error}
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '15px',
                            borderRadius: '15px',
                            fontWeight: '700',
                            fontSize: '16px',
                            marginTop: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                            <>
                                {isLogin ? 'Iniciar Sesión' : 'Registrarse'}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </motion.button>
                </form>

                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                        {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                color: 'var(--secondary)',
                                fontWeight: '600',
                                marginLeft: '8px',
                                textDecoration: 'underline'
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
