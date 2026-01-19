import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Mail, Lock, User, Loader2, ArrowRight, Phone, Award, Hash } from 'lucide-react';
import logoApeg from '../assets/apeg_logo_v2.png';

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
                            handicap: formData.handicap,
                            federation_code: formData.federationCode,
                            phone: formData.phone
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
            width: '100%',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: '"Outfit", sans-serif',
            overflow: 'hidden'
        }}>
            {/* Background Image with Overlay */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url("https://images.unsplash.com/photo-1535131749006-b7f58c9f0363?q=80&w=2070&auto=format&fit=crop")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                zIndex: -2
            }} />
            <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(11, 46, 30, 0.85), rgba(6, 26, 17, 0.95))', // Stronger dark green gradient
                zIndex: -1,
                backdropFilter: 'blur(3px)'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                style={{
                    width: '90%',
                    maxWidth: '400px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    zIndex: 10,
                    margin: '40px 0' // Added margin for scrollability on small screens
                }}
            >
                {/* Glass Card Container */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '32px',
                    padding: '40px 30px',
                    width: '100%',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Logo Section */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            <img
                                src={logoApeg}
                                alt="APEG Logo"
                                style={{
                                    width: '100px',
                                    height: '100px',
                                    objectFit: 'contain',
                                    filter: 'drop-shadow(0 0 15px rgba(163, 230, 53, 0.3))' // Glow effect
                                }}
                            />
                        </motion.div>
                    </div>

                    {/* Title */}
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '28px',
                            fontWeight: '700',
                            letterSpacing: '-0.5px',
                            marginBottom: '5px'
                        }}>
                            {isLogin ? 'Bienvenido' : 'Crear Cuenta'}
                        </h1>
                        <p style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '14px' }}>
                            {isLogin ? 'Ingresa a tu cuenta para continuar' : 'Únete a la mejor comunidad de golf'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <AnimatePresence mode="popLayout">
                            {!isLogin && (
                                <motion.div
                                    key="register-fields"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
                                >
                                    {/* Nombre Completo */}
                                    <div style={{ position: 'relative' }}>
                                        <User size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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

                                    {/* Hándicap */}
                                    <div style={{ position: 'relative' }}>
                                        <Award size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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

                                    {/* Código Federación */}
                                    <div style={{ position: 'relative' }}>
                                        <Hash size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="text"
                                            placeholder="Código Federación"
                                            required={!isLogin}
                                            value={formData.federationCode}
                                            onChange={(e) => setFormData({ ...formData, federationCode: e.target.value })}
                                            style={inputStyle}
                                            onFocus={handleFocus}
                                            onBlur={handleBlur}
                                        />
                                    </div>

                                    {/* Teléfono Celular */}
                                    <div style={{ position: 'relative' }}>
                                        <Phone size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                            <Mail size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                            <Lock size={18} color="rgba(255,255,255,0.6)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
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
                                    fontSize: '12px',
                                    color: error.includes('exitoso') ? '#4ade80' : '#f87171',
                                    textAlign: 'center',
                                    background: 'rgba(0,0,0,0.2)',
                                    padding: '8px',
                                    borderRadius: '8px'
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
                                background: 'linear-gradient(135deg, var(--secondary) 0%, #65a30d 100%)', // Gradient Lime
                                color: '#0f3923', // Dark text contrast
                                borderRadius: '16px',
                                border: 'none',
                                fontSize: '15px',
                                fontWeight: '700',
                                marginTop: '10px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)'
                            }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                <>
                                    {isLogin ? 'Ingresar' : 'Registrarme'}
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </motion.button>
                    </form>

                    {/* Footer Interactions */}
                    <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                        <button
                            onClick={() => setIsLogin(!isLogin)}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                transition: 'color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--secondary)'}
                            onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                        >
                            {isLogin ? (
                                <span>¿Nuevo aquí? <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Crea una cuenta</span></span>
                            ) : (
                                <span>¿Ya tienes cuenta? <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Inicia sesión</span></span>
                            )}
                        </button>

                        <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.1)' }} />

                        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: '10px' }}>
                            {/* Social Login Button */}
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                disabled={true}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    color: 'white',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    fontSize: '13px',
                                    fontWeight: '500',
                                    cursor: 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    opacity: 0.6
                                }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="white" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="white" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="white" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="white" />
                                </svg>
                                Continuar con Google
                            </motion.button>

                            <button
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'rgba(255,255,255,0.4)',
                                    fontSize: '12px',
                                    marginTop: '5px',
                                    cursor: 'pointer'
                                }}
                            >
                                Continuar como invitado
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Text */}
                <p style={{
                    marginTop: '30px',
                    color: 'rgba(255,255,255,0.3)',
                    fontSize: '11px',
                    textAlign: 'center'
                }}>
                    © 2024 APEG GOLF. Todos los derechos reservados.
                </p>
            </motion.div>
        </div>
    );
};

// Extracted styles and handlers
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '16px 16px 16px 45px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: 'white',
    fontSize: '14px',
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

