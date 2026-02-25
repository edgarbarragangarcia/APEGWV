import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SuccessModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
    onClose: () => void;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
    isOpen,
    title,
    message,
    type,
    onClose
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 3000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px'
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.85)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)'
                        }}
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.92, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.92, y: 30 }}
                        style={{
                            width: '100%',
                            maxWidth: '360px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                            backdropFilter: 'blur(25px)',
                            WebkitBackdropFilter: 'blur(25px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '35px',
                            padding: '40px 24px 30px',
                            position: 'relative',
                            boxShadow: '0 30px 60px rgba(0, 0, 0, 0.6)',
                            textAlign: 'center',
                            fontFamily: 'var(--font-main)'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                right: '20px',
                                top: '20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: 'rgba(255,255,255,0.4)',
                                width: '30px',
                                height: '30px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={18} />
                        </button>

                        {/* Animated Icon */}
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.1, type: 'spring', damping: 10 }}
                            style={{
                                width: '64px',
                                height: '64px',
                                background: type === 'success' ? 'rgba(163, 230, 53, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                borderRadius: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 25px',
                                border: `1px solid ${type === 'success' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                            }}
                        >
                            {type === 'success' ? (
                                <CheckCircle2 color="var(--secondary)" size={32} strokeWidth={2.5} />
                            ) : (
                                <AlertCircle color="#ff6b6b" size={32} strokeWidth={2.5} />
                            )}
                        </motion.div>

                        <h3 style={{
                            fontSize: '22px',
                            fontWeight: '900',
                            color: 'white',
                            marginBottom: '12px',
                            letterSpacing: '-0.02em',
                            lineHeight: 1.1
                        }}>
                            {title}
                        </h3>

                        <p style={{
                            color: 'var(--text-dim)',
                            fontSize: '15px',
                            lineHeight: '1.5',
                            marginBottom: '30px',
                            fontWeight: '600'
                        }}>
                            {message}
                        </p>

                        <button
                            onClick={onClose}
                            className="btn-primary"
                            style={{ height: '54px', fontSize: '15px' }}
                        >
                            ENTENDIDO
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default SuccessModal;
