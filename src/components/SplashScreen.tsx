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
                        transition: { duration: 0.8, ease: "easeInOut" }
                    }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #0e2f1f 0%, #051a11 100%)',
                        color: '#A3E635'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: [0.8, 1.1, 1],
                            opacity: 1
                        }}
                        transition={{
                            duration: 1.2,
                            ease: "easeOut",
                            times: [0, 0.6, 1]
                        }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '20px'
                        }}
                    >
                        <div style={{
                            width: '120px',
                            height: '120px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            borderRadius: '30px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(163, 230, 53, 0.2)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <motion.div
                                animate={{
                                    rotate: [0, 360],
                                }}
                                transition={{
                                    duration: 20,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                                style={{
                                    position: 'absolute',
                                    width: '200%',
                                    height: '200%',
                                    background: 'conic-gradient(from 0deg, transparent, rgba(163, 230, 53, 0.1), transparent)',
                                }}
                            />
                            <img
                                src="/images/briceno18.png"
                                alt="Logo"
                                style={{
                                    width: '80px',
                                    height: '80px',
                                    objectFit: 'contain',
                                    zIndex: 1
                                }}
                                onError={(e) => {
                                    // Fallback if image fails
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.8 }}
                                style={{
                                    fontSize: '32px',
                                    fontWeight: '800',
                                    letterSpacing: '4px',
                                    margin: 0,
                                    textShadow: '0 4px 10px rgba(0,0,0,0.5)',
                                    color: '#fff'
                                }}
                            >
                                APEG<span style={{ color: '#A3E635' }}>WEB</span>
                            </motion.h1>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 1, duration: 1 }}
                                style={{
                                    fontSize: '12px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '2px',
                                    marginTop: '8px',
                                    color: '#A3E635'
                                }}
                            >
                                Premium Golf Experience
                            </motion.p>
                        </div>
                    </motion.div>

                    <motion.div
                        style={{
                            position: 'absolute',
                            bottom: '50px',
                            width: '40px',
                            height: '4px',
                            background: 'rgba(163, 230, 53, 0.2)',
                            borderRadius: '2px',
                            overflow: 'hidden'
                        }}
                    >
                        <motion.div
                            animate={{
                                x: [-40, 40]
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            style={{
                                width: '100%',
                                height: '100%',
                                background: '#A3E635'
                            }}
                        />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SplashScreen;
