import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import Card from '../../../components/Card';

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
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '20px'
        }} className="animate-fade">
            <Card style={{
                width: '100%',
                maxWidth: '350px',
                padding: '30px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                textAlign: 'center',
                position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', right: '15px', top: '15px', background: 'none', border: 'none', color: 'var(--text-dim)' }}>
                    <X size={18} />
                </button>

                <div style={{
                    width: '60px',
                    height: '60px',
                    background: type === 'success' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    {type === 'success' ? (
                        <CheckCircle2 color="var(--secondary)" size={30} />
                    ) : (
                        <AlertCircle color="#ef4444" size={30} />
                    )}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>{title}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', lineHeight: '1.4' }}>{message}</p>
            </Card>
        </div>
    );
};

export default SuccessModal;
