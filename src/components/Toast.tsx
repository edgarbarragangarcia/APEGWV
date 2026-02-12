import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
    onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ id, message, type, duration = 3000, onClose }) => {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => clearTimeout(timer);
    }, [id, duration, onClose]);

    const iconMap = {
        success: <CheckCircle2 size={24} />,
        error: <XCircle size={24} />,
        warning: <AlertCircle size={24} />,
        info: <Info size={24} />
    };

    const colorMap = {
        success: {
            bg: '#10b981', // Solid emerald
            text: 'white',
            icon: 'white'
        },
        error: {
            bg: '#ef4444', // Solid red
            text: 'white',
            icon: 'white'
        },
        warning: {
            bg: '#f59e0b', // Solid amber
            text: 'white',
            icon: 'white'
        },
        info: {
            bg: '#3b82f6', // Solid blue
            text: 'white',
            icon: 'white'
        }
    };

    const colors = colorMap[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 20px',
                borderRadius: '16px',
                background: colors.bg,
                boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                width: 'calc(100vw - 40px)',
                maxWidth: '400px',
                color: colors.text,
                position: 'relative',
                pointerEvents: 'auto'
            }}
        >
            <div style={{ color: colors.icon, flexShrink: 0 }}>
                {iconMap[type]}
            </div>
            <p style={{
                flex: 1,
                fontSize: '15px',
                fontWeight: '700',
                lineHeight: '1.4',
                margin: 0,
                textTransform: 'uppercase'
            }}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'rgba(255,255,255,0.2)',
                    border: 'none',
                    color: 'white',
                    cursor: 'pointer',
                    padding: '6px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                }}
            >
                <X size={16} />
            </button>
        </motion.div>
    );
};

export default Toast;
