import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SplashScreenProps {
    isVisible: boolean;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{
                        opacity: 0,
                        transition: { duration: 1, ease: [0.43, 0.13, 0.23, 0.96] }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#04150d', // Fondo ultra oscuro
                        overflow: 'hidden'
                    }}
                >
                    {/* Elementos Dinámicos de Fondo (Blobs) */}
                    <motion.div
                        animate={{
                            x: [0, 50, 0],
                            y: [0, -30, 0],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            top: '-10%',
                            right: '-10%',
                            width: '400px',
                            height: '400px',
                            background: 'radial-gradient(circle, rgba(163, 230, 53, 0.1) 0%, transparent 70%)',
                            filter: 'blur(60px)',
                            borderRadius: '50%'
                        }}
                    />
                    <motion.div
                        animate={{
                            x: [0, -40, 0],
                            y: [0, 60, 0],
                            scale: [1, 1.3, 1],
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: 'absolute',
                            bottom: '-15%',
                            left: '-10%',
                            width: '500px',
                            height: '500px',
                            background: 'radial-gradient(circle, rgba(163, 230, 53, 0.08) 0%, transparent 70%)',
                            filter: 'blur(80px)',
                            borderRadius: '50%'
                        }}
                    />

                    {/* Contenedor Principal con Glassmorphism */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '30px',
                            padding: '60px',
                            borderRadius: '40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            zIndex: 10
                        }}
                    >
                        {/* Logo con Animación de Giro y Pulso */}
                        <div style={{ position: 'relative' }}>
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                style={{
                                    position: 'absolute',
                                    inset: '-10px',
                                    border: '2px dashed rgba(163, 230, 53, 0.3)',
                                    borderRadius: '50%',
                                }}
                            />
                            <motion.div
                                whileHover={{ scale: 1.05 }}
                                style={{
                                    width: '140px',
                                    height: '140px',
                                    background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(26, 77, 53, 0.4) 100%)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(163, 230, 53, 0.4)',
                                    boxShadow: '0 0 30px rgba(163, 230, 53, 0.15)',
                                    overflow: 'hidden'
                                }}
                            >
                                <motion.img
                                    src="/images/briceno18.png"
                                    alt="Logo"
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ delay: 0.3, duration: 1, type: "spring", stiffness: 100 }}
                                    style={{
                                        width: '90px',
                                        height: '90px',
                                        objectFit: 'contain'
                                    }}
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </motion.div>
                        </div>

                        {/* Texto con Efecto de Revelado Moderno */}
                        <div style={{ textAlign: 'center' }}>
                            <motion.div
                                initial={{ clipPath: 'inset(0 100% 0 0)' }}
                                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                                transition={{ delay: 0.8, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                            >
                                <h1 style={{
                                    fontSize: '42px',
                                    fontWeight: '900',
                                    letterSpacing: '8px',
                                    margin: 0,
                                    background: 'linear-gradient(to bottom, #fff 0%, #A3E635 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    textTransform: 'uppercase'
                                }}>
                                    APEG<span style={{ opacity: 0.8 }}>WEB</span>
                                </h1>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.5, duration: 1 }}
                                style={{
                                    marginTop: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                            >
                                <div style={{ height: '1px', width: '20px', background: 'rgba(163, 230, 53, 0.3)' }} />
                                <span style={{
                                    fontSize: '11px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '4px',
                                    color: 'rgba(163, 230, 53, 0.8)',
                                    fontWeight: '500'
                                }}>
                                    The Golf Standard
                                </span>
                                <div style={{ height: '1px', width: '20px', background: 'rgba(163, 230, 53, 0.3)' }} />
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* Indicador de Carga Minimalista y Elegante */}
                    <div style={{
                        position: 'absolute',
                        bottom: '60px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '15px'
                    }}>
                        <div style={{
                            width: '200px',
                            height: '2px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <motion.div
                                initial={{ x: '-100%' }}
                                animate={{ x: '100%' }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(90deg, transparent, #A3E635, transparent)'
                                }}
                            />
                        </div>
                        <motion.span
                            animate={{ opacity: [0.3, 0.6, 0.3] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                fontSize: '10px',
                                color: 'rgba(255, 255, 255, 0.3)',
                                letterSpacing: '2px',
                                textTransform: 'uppercase'
                            }}
                        >
                            Syncing Experience...
                        </motion.span>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
