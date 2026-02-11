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
}

const CardInput: React.FC<CardInputProps> = ({ onComplete }) => {
    const [card, setCard] = useState<CardData>({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });



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

        const cleanNumber = newCard.number.replace(/\s/g, '');
        const isNumberValid = cleanNumber.length >= 15 && cleanNumber.length <= 16;
        const isExpiryValid = newCard.expiry.length === 5;
        const isCvvValid = newCard.cvv.length >= 3;
        const isNameValid = newCard.name.trim().length >= 2;

        if (isNumberValid && isExpiryValid && isCvvValid && isNameValid) {
            onComplete(newCard);
        } else {
            // Send null if incomplete to prevent old valid data from persisting
            onComplete(null as any);
        }
    };

    const getCardType = (number: string) => {
        const cleanNumber = number.replace(/\s/g, '');
        if (cleanNumber.startsWith('4')) return 'Visa';
        if (cleanNumber.startsWith('5')) return 'MasterCard';
        if (cleanNumber.startsWith('2')) return 'MasterCard'; // Newer MasterCard range
        if (cleanNumber.startsWith('34') || cleanNumber.startsWith('37')) return 'Amex';
        return 'Card';
    };

    const getCardLogo = (type: string) => {
        switch (type) {
            case 'Visa':
                return "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg";
            case 'MasterCard':
                return "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg";
            case 'Amex':
                return "https://upload.wikimedia.org/wikipedia/commons/b/b3/American_Express_logo_%282018%29.svg";
            default:
                return null;
        }
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
                            <div style={{
                                width: '45px',
                                height: '28px',
                                background: 'linear-gradient(135deg, #ffd700, #b8860b)',
                                borderRadius: '4px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                                position: 'relative',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'rgba(0,0,0,0.1)' }} />
                                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: 'rgba(0,0,0,0.1)' }} />
                            </div>

                            {getCardLogo(getCardType(card.number)) ? (
                                <img
                                    src={getCardLogo(getCardType(card.number))!}
                                    alt={getCardType(card.number)}
                                    style={{ height: '24px', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
                                />
                            ) : (
                                <span style={{ fontSize: '18px', fontWeight: '900', color: 'rgba(255,255,255,0.8)' }}>{getCardType(card.number)}</span>
                            )}
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
