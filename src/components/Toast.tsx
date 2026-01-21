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
        success: <CheckCircle2 size={20} />,
        error: <XCircle size={20} />,
        warning: <AlertCircle size={20} />,
        info: <Info size={20} />
    };

    const colorMap = {
        success: {
            bg: 'rgba(16, 185, 129, 0.1)',
            border: '#10b981',
            text: '#10b981',
            icon: '#10b981'
        },
        error: {
            bg: 'rgba(239, 68, 68, 0.1)',
            border: '#ef4444',
            text: '#f87171',
            icon: '#ef4444'
        },
        warning: {
            bg: 'rgba(245, 158, 11, 0.1)',
            border: '#f59e0b',
            text: '#fbbf24',
            icon: '#f59e0b'
        },
        info: {
            bg: 'rgba(59, 130, 246, 0.1)',
            border: '#3b82f6',
            text: '#60a5fa',
            icon: '#3b82f6'
        }
    };

    const colors = colorMap[type];

    return (
        <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px 20px',
                borderRadius: '16px',
                background: colors.bg,
                border: `1px solid ${colors.border}`,
                boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(10px)',
                minWidth: '280px',
                maxWidth: '400px',
                color: 'white',
                position: 'relative'
            }}
        >
            <div style={{ color: colors.icon, flexShrink: 0 }}>
                {iconMap[type]}
            </div>
            <p style={{
                flex: 1,
                fontSize: '14px',
                fontWeight: '600',
                lineHeight: '1.4',
                margin: 0
            }}>
                {message}
            </p>
            <button
                onClick={() => onClose(id)}
                style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    padding: '4px',
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
