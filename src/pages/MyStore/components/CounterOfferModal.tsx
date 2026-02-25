import React from 'react';
import { X, DollarSign, Send, Loader2 } from 'lucide-react';
import Card from '../../../components/Card';

interface CounterOfferModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: () => void;
    counterAmount: string;
    onCounterAmountChange: (val: string) => void;
    counterMessage: string;
    onCounterMessageChange: (val: string) => void;
    updating: boolean;
    productName: string;
}

const CounterOfferModal: React.FC<CounterOfferModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    counterAmount,
    onCounterAmountChange,
    counterMessage,
    onCounterMessageChange,
    updating,
    productName
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
        }} className="animate-fade">
            <Card style={{
                width: '100%',
                maxWidth: '450px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '28px',
                overflow: 'hidden'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>Enviar Contraoferta</h3>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{productName}</p>
                    </div>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <X size={18} />
                    </button>
                </div>

                <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Monto de Contraoferta</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }}>
                                <DollarSign size={20} />
                            </div>
                            <input
                                autoFocus
                                type="number"
                                value={counterAmount}
                                onChange={e => onCounterAmountChange(e.target.value)}
                                placeholder="Ingresa el valor..."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    padding: '16px 16px 16px 45px',
                                    color: 'white',
                                    fontSize: '20px',
                                    fontWeight: '800'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Mensaje (Opcional)</label>
                        <textarea
                            value={counterMessage}
                            onChange={e => onCounterMessageChange(e.target.value)}
                            placeholder="Ej: Te lo dejo en este precio porque está como nuevo..."
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                padding: '16px',
                                color: 'white',
                                fontSize: '14px',
                                minHeight: '100px',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={updating || !counterAmount}
                        style={{
                            width: '100%',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '16px',
                            borderRadius: '16px',
                            fontWeight: '900',
                            fontSize: '15px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                            opacity: (!counterAmount || updating) ? 0.5 : 1
                        }}
                    >
                        {updating ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {updating ? 'ENVIANDO...' : 'ENVIAR CONTRAOFERTA'}
                    </button>

                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', padding: '0 10px' }}>
                        Al enviar la contraoferta, el producto quedará bloqueado para otros compradores por 1 hora mientras el comprador decide.
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default CounterOfferModal;
