import React from 'react';
import { X, DollarSign, Send, Handshake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px 16px 16px 45px',
        color: 'white',
        fontSize: '18px',
        fontWeight: '800',
        fontFamily: 'var(--font-main)',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: '900',
        color: 'var(--secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        paddingLeft: '4px',
        fontFamily: 'var(--font-main)'
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1100,
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

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: '420px',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                            backdropFilter: 'blur(30px)',
                            WebkitBackdropFilter: 'blur(30px)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '35px',
                            boxShadow: '0 40px 100px rgba(0,0,0,0.6)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid rgba(163, 230, 53, 0.2)'
                                }}>
                                    <Handshake size={20} color="var(--secondary)" />
                                </div>
                                <div>
                                    <h3 style={{
                                        fontSize: '18px',
                                        fontWeight: '900',
                                        color: 'white',
                                        fontFamily: 'var(--font-main)',
                                        letterSpacing: '-0.02em',
                                        lineHeight: 1.1
                                    }}>Contraoferta</h3>
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginTop: '2px', fontWeight: '700' }}>{productName}</p>
                                </div>
                            </div>
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={onClose}
                                style={{
                                    color: 'rgba(255,255,255,0.4)',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <X size={18} />
                            </motion.button>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={labelStyle}>Monto de la Contraoferta</label>
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
                                        style={inputStyle}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={labelStyle}>Mensaje (Opcional)</label>
                                <textarea
                                    value={counterMessage}
                                    onChange={e => onCounterMessageChange(e.target.value)}
                                    placeholder="Ej: Te lo dejo en este precio porque está impecable..."
                                    style={{
                                        ...inputStyle,
                                        padding: '16px',
                                        minHeight: '100px',
                                        resize: 'none',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                />
                            </div>

                            <button
                                onClick={onSubmit}
                                disabled={updating || !counterAmount}
                                className="btn-primary"
                                style={{
                                    height: '56px',
                                    opacity: (!counterAmount || updating) ? 0.5 : 1
                                }}
                            >
                                {updating ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                        <span>ENVIANDO...</span>
                                    </div>
                                ) : (
                                    <>
                                        <Send size={18} />
                                        <span>ENVIAR CONTRAOFERTA</span>
                                    </>
                                )}
                            </button>

                            <div style={{
                                background: 'rgba(255,255,255,0.03)',
                                padding: '15px',
                                borderRadius: '16px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: '1.4', fontWeight: '600' }}>
                                    Al enviar esta contraoferta, el producto quedará reservado por 1 hora para este comprador.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CounterOfferModal;
