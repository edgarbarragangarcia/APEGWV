import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen: React.FC = () => {
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--bg-dark)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    width: '120px',
                    height: '120px',
                    borderRadius: '30px',
                    overflow: 'hidden',
                    border: '4px solid var(--secondary)',
                    background: 'orange',
                    boxShadow: '0 0 30px rgba(163, 230, 53, 0.3)',
                    position: 'relative',
                    marginBottom: '20px'
                }}
            >
                <div style={{
                    position: 'absolute',
                    inset: '3px',
                    borderRadius: '25px',
                    overflow: 'hidden',
                    background: 'white'
                }}>
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        style={{
                            width: '150%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: 'scale(2.0)',
                            transformOrigin: '5% 48%'
                        }}
                    >
                        <source src="https://drqyvhwgnuvrcmwthwwn.supabase.co/storage/v1/object/public/video/watermarked-4f9c0c88-80ff-4880-9dd5-4ccce3509025.MP4" type="video/mp4" />
                    </video>
                </div>
            </motion.div>

            <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
            >
                <h2 style={{ fontSize: '16px', fontWeight: '600', letterSpacing: '2px', color: 'var(--secondary)' }}>
                    CARGANDO...
                </h2>
            </motion.div>
        </div>
    );
};

export default LoadingScreen;
