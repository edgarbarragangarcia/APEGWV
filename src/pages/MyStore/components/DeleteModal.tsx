import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Card from '../../../components/Card';

interface DeleteModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    saving?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
    isOpen,
    title,
    message,
    onConfirm,
    onCancel,
    saving = false
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
            zIndex: 1000,
            padding: '20px'
        }} className="animate-fade">
            <Card style={{
                width: '100%',
                maxWidth: '400px',
                padding: '30px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '24px',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '60px',
                    height: '60px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px'
                }}>
                    <AlertTriangle color="#ef4444" size={30} />
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>{title}</h3>
                <p style={{ color: 'var(--text-dim)', fontSize: '15px', lineHeight: '1.5', marginBottom: '25px' }}>{message}</p>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={onCancel}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px',
                            color: 'white',
                            fontWeight: '700'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={saving}
                        style={{
                            flex: 1,
                            padding: '14px',
                            background: '#ef4444',
                            borderRadius: '16px',
                            color: 'white',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        {saving ? <Loader2 size={18} className="animate-spin" /> : 'Eliminar'}
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default DeleteModal;
