import React from 'react';
import { DollarSign, Send, Handshake } from 'lucide-react';

import PageHeader from '../../../components/PageHeader';
import PageHero from '../../../components/PageHero';

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

    if (!isOpen) return null;

    return (
        <div className="animate-fade" style={pageStyles.pageContainer}>
            <PageHero />
            <div style={pageStyles.headerArea}>
                <PageHeader noMargin title="Contraoferta" onBack={onClose} />
            </div>

            <div style={pageStyles.scrollArea}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255,255,255,0.03)',
                        padding: '16px',
                        borderRadius: '20px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginBottom: '10px'
                    }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '14px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(163, 230, 53, 0.2)'
                        }}>
                            <Handshake size={24} color="var(--secondary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <h3 style={{
                                fontSize: '14px',
                                fontWeight: '900',
                                color: 'white',
                                fontFamily: 'var(--font-main)',
                                letterSpacing: '-0.02em',
                                lineHeight: 1.1,
                                marginBottom: '4px'
                            }}>Producto a Negociar</h3>
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '700' }}>{productName}</p>
                        </div>
                    </div>

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
                                minHeight: '120px',
                                resize: 'none',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        />
                    </div>

                    <button
                        onClick={onSubmit}
                        disabled={updating || !counterAmount}
                        style={{
                            ...pageStyles.confirmButton,
                            opacity: (!counterAmount || updating) ? 0.5 : 1
                        }}
                    >
                        {updating ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center' }}>
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
                        background: 'rgba(255,255,255,0.02)',
                        padding: '16px',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        marginTop: '10px'
                    }}>
                        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: '1.5', fontWeight: '600' }}>
                            Al enviar esta contraoferta, el producto quedará reservado por 1 hora para este comprador.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const pageStyles = {
    pageContainer: {
        position: 'fixed' as 'fixed',
        inset: 0,
        width: '100%',
        maxWidth: 'var(--app-max-width)',
        margin: '0 auto',
        overflow: 'hidden',
        background: 'var(--primary)',
        zIndex: 2000,
    },
    headerArea: {
        position: 'absolute' as 'absolute',
        top: 'var(--header-offset-top)',
        left: '0',
        right: '0',
        width: '100%',
        zIndex: 900,
        background: 'transparent',
        paddingLeft: '20px',
        paddingRight: '20px',
        pointerEvents: 'auto' as 'auto',
    },
    scrollArea: {
        position: 'absolute' as 'absolute',
        top: 'calc(var(--header-offset-top) + 58px)',
        left: '0',
        right: '0',
        bottom: 0,
        overflowY: 'auto' as 'auto',
        padding: '20px 20px 120px 20px',
        overflowX: 'hidden' as 'hidden',
    },
    confirmButton: {
        marginTop: '15px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        padding: '16px',
        borderRadius: '14px',
        background: 'var(--secondary)',
        color: 'var(--primary)',
        border: 'none',
        fontWeight: '950',
        fontSize: '14px',
        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)',
        width: '100%',
        letterSpacing: '0.05em',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontFamily: 'var(--font-main)'
    }
};

export default CounterOfferModal;
