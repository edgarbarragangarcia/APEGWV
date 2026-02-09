import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface CardData {
    number: string;
    name: string;
    expiry: string;
    cvv: string;
}

interface CardInputProps {
    onComplete: (data: CardData) => void;
    data?: CardData;
}

const CardInput: React.FC<CardInputProps> = ({ onComplete, data }) => {
    const [card, setCard] = useState<CardData>(data || {
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });

    React.useEffect(() => {
        if (data) setCard(data);
    }, [data]);
    const [isFlipped, setIsFlipped] = useState(false);

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];
        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }
        if (parts.length > 0) return parts.join(' ');
        return value;
    };

    const formatExpiry = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        if (v.length >= 2) {
            return v.substring(0, 2) + '/' + v.substring(2, 4);
        }
        return v;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'number') formattedValue = formatCardNumber(value).substring(0, 19);
        if (name === 'expiry') formattedValue = formatExpiry(value).substring(0, 5);
        if (name === 'cvv') formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);

        const newCard = { ...card, [name]: formattedValue };
        setCard(newCard);

        if (newCard.number.length >= 19 && newCard.expiry.length === 5 && newCard.cvv.length >= 3 && newCard.name.length > 3) {
            onComplete(newCard);
        }
    };

    const getCardType = (number: string) => {
        if (number.startsWith('4')) return 'Visa';
        if (number.startsWith('5')) return 'MasterCard';
        if (number.startsWith('3')) return 'Amex';
        return 'Card';
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
            {/* Visual Card Representation */}
            <div style={{ perspective: '1000px', height: '180px', width: '100%', marginBottom: '10px' }}>
                <motion.div
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        transformStyle: 'preserve-3d'
                    }}
                >
                    {/* Front */}
                    <div className="glass" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '20px',
                        padding: '25px',
                        background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2), rgba(20, 83, 45, 0.4))',
                        border: '1px solid rgba(163, 230, 53, 0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ width: '45px', height: '35px', background: 'rgba(255,255,255,0.2)', borderRadius: '6px' }} />
                            <span style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(255,255,255,0.8)' }}>{getCardType(card.number)}</span>
                        </div>

                        <div style={{ fontSize: '20px', letterSpacing: '3px', fontWeight: '700', fontFamily: 'monospace', color: 'white' }}>
                            {card.number || '•••• •••• •••• ••••'}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '9px', opacity: 0.5, marginBottom: '2px', textTransform: 'uppercase' }}>Nombre</p>
                                <p style={{ fontSize: '13px', fontWeight: '700', textTransform: 'uppercase' }}>{card.name || 'TU NOMBRE AQUÍ'}</p>
                            </div>
                            <div style={{ width: '60px' }}>
                                <p style={{ fontSize: '9px', opacity: 0.5, marginBottom: '2px', textTransform: 'uppercase' }}>Expira</p>
                                <p style={{ fontSize: '13px', fontWeight: '700' }}>{card.expiry || 'MM/YY'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Back */}
                    <div className="glass" style={{
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        backfaceVisibility: 'hidden',
                        borderRadius: '20px',
                        padding: '0 0 25px 0',
                        background: 'linear-gradient(135deg, rgba(20, 83, 45, 0.6), rgba(0,0,0,0.8))',
                        border: '1px solid rgba(163, 230, 53, 0.2)',
                        transform: 'rotateY(180deg)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                    }}>
                        <div style={{ height: '40px', background: 'rgba(0,0,0,0.8)', width: '100%', marginBottom: '20px', marginTop: '10px' }} />
                        <div style={{ padding: '0 25px' }}>
                            <p style={{ fontSize: '9px', opacity: 0.5, marginBottom: '5px', textAlign: 'right' }}>CVV</p>
                            <div style={{ height: '35px', background: 'white', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 10px' }}>
                                <span style={{ color: 'black', fontFamily: 'monospace', fontWeight: '900', letterSpacing: '2px' }}>{card.cvv || '•••'}</span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Form Fields */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dim)' }}>Número de Tarjeta</p>
                    <input
                        type="tel"
                        name="number"
                        placeholder="0000 0000 0000 0000"
                        value={card.number}
                        onChange={handleChange}
                        onFocus={() => { setIsFlipped(false); }}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '15px',
                            fontSize: '16px',
                            color: 'white'
                        }}
                    />
                </div>

                <div style={{ position: 'relative' }}>
                    <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dim)' }}>Titular de la Tarjeta</p>
                    <input
                        type="text"
                        name="name"
                        placeholder="NOMBRE COMPLETO"
                        value={card.name}
                        onChange={handleChange}
                        onFocus={() => { setIsFlipped(false); }}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            padding: '15px',
                            fontSize: '16px',
                            color: 'white',
                            textTransform: 'uppercase'
                        }}
                    />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dim)' }}>Expiración</p>
                        <input
                            type="tel"
                            name="expiry"
                            placeholder="MM/YY"
                            value={card.expiry}
                            onChange={handleChange}
                            onFocus={() => { setIsFlipped(false); }}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '15px',
                                fontSize: '16px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div>
                        <p style={{ fontSize: '12px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-dim)' }}>CVV</p>
                        <input
                            type="tel"
                            name="cvv"
                            placeholder="• • •"
                            value={card.cvv}
                            onChange={handleChange}
                            onFocus={() => { setIsFlipped(true); }}
                            onBlur={() => setIsFlipped(false)}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '15px',
                                fontSize: '16px',
                                color: 'white'
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', opacity: 0.5 }}>
                <Lock size={14} />
                <p style={{ fontSize: '12px' }}>Tus datos están protegidos y cifrados.</p>
            </div>
        </div>
    );
};

export default CardInput;
