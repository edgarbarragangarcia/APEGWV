import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineOverlayProps {
    isOnline: boolean;
}

const OfflineOverlay: React.FC<OfflineOverlayProps> = ({ isOnline }) => {
    return (
        <AnimatePresence>
            {!isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(10, 10, 10, 0.8)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                        textAlign: 'center'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="glass-dark"
                        style={{
                            padding: '40px 30px',
                            borderRadius: '30px',
                            maxWidth: '320px',
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
                        }}
                    >
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '25px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '25px',
                            color: '#ef4444',
                            boxShadow: '0 0 30px rgba(239, 68, 68, 0.2)'
                        }}>
                            <WifiOff size={40} strokeWidth={1.5} />
                        </div>

                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '900',
                            color: 'white',
                            marginBottom: '12px',
                            letterSpacing: '-0.5px'
                        }}> Sin Conexión</h2>

                        <p style={{
                            fontSize: '15px',
                            color: 'var(--text-dim)',
                            lineHeight: '1.6',
                            marginBottom: '30px'
                        }}>
                            Parece que has perdido la conexión a internet. Por favor, verifica tu red.
                        </p>

                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => window.location.reload()}
                            className="btn-primary"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: 'white',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: 'none'
                            }}
                        >
                            <RefreshCw size={18} />
                            Reintentar
                        </motion.button>
                    </motion.div>

                    <p style={{
                        position: 'absolute',
                        bottom: '40px',
                        fontSize: '12px',
                        color: 'rgba(255, 255, 255, 0.3)',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        APEG Premium Experience
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineOverlay;
