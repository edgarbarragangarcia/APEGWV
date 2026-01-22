import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger'
}) => {
    const getColors = () => {
        switch (type) {
            case 'danger':
                return {
                    primary: '#ff6b6b',
                    bg: 'rgba(239, 68, 68, 0.1)',
                    border: 'rgba(239, 68, 68, 0.2)'
                };
            case 'warning':
                return {
                    primary: '#fbbf24',
                    bg: 'rgba(251, 191, 36, 0.1)',
                    border: 'rgba(251, 191, 36, 0.2)'
                };
            default:
                return {
                    primary: 'var(--secondary)',
                    bg: 'rgba(163, 230, 53, 0.1)',
                    border: 'rgba(163, 230, 53, 0.2)'
                };
        }
    };

    const colors = getColors();

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }}>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(8px)',
                            WebkitBackdropFilter: 'blur(8px)'
                        }}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: '340px',
                            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '30px',
                            padding: '30px 24px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            textAlign: 'center'
                        }}
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute',
                                top: '15px',
                                right: '15px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
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

                        {/* Icon */}
                        <div style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '20px',
                            background: colors.bg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: colors.primary,
                            border: `1px solid ${colors.border}`
                        }}>
                            <AlertTriangle size={32} />
                        </div>

                        {/* Text */}
                        <h3 style={{
                            fontSize: '20px',
                            fontWeight: '900',
                            color: 'white',
                            marginBottom: '10px',
                            letterSpacing: '-0.5px'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            fontSize: '15px',
                            color: 'var(--text-dim)',
                            lineHeight: '1.5',
                            marginBottom: '30px'
                        }}>
                            {message}
                        </p>

                        {/* Buttons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: colors.primary,
                                    color: type === 'danger' ? 'white' : 'var(--primary)',
                                    fontWeight: '900',
                                    fontSize: '15px',
                                    cursor: 'pointer',
                                    boxShadow: `0 10px 20px ${colors.bg}`
                                }}
                            >
                                {confirmText}
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={onClose}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'transparent',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '15px',
                                    cursor: 'pointer'
                                }}
                            >
                                {cancelText}
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmationModal;
