import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddressModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAddress: string;
    onConfirm: (address: string) => void;
}

const AddressModal: React.FC<AddressModalProps> = ({ isOpen, onClose, currentAddress, onConfirm }) => {
    const [details, setDetails] = useState({
        street: '',
        city: '',
        dept: '',
        zip: ''
    });

    useEffect(() => {
        if (isOpen && currentAddress) {
            const parts = currentAddress.split(',').map(p => p.trim());
            setDetails({
                street: parts[0] || '',
                city: parts[1] || '',
                dept: parts[2] || '',
                zip: parts[3] || ''
            });
        }
    }, [isOpen, currentAddress]);

    const handleConfirm = () => {
        const fullAddress = [details.street, details.city, details.dept, details.zip]
            .filter(Boolean)
            .join(', ');
        onConfirm(fullAddress);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)',
                            zIndex: 2000
                        }}
                    />
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed', bottom: 0, left: 0, right: 0,
                            background: 'var(--primary)',
                            borderTop: '1px solid rgba(163, 230, 53, 0.3)',
                            borderRadius: '32px 32px 0 0',
                            padding: '30px',
                            paddingBottom: 'calc(env(safe-area-inset-bottom) + 30px)',
                            zIndex: 2001,
                            maxWidth: 'var(--app-max-width)',
                            margin: '0 auto'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>
                                Detalles <span style={{ color: 'var(--secondary)' }}>de</span> Dirección
                            </h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white' }}>
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <FormInput
                                label="Calle / Carrera / Apto"
                                value={details.street}
                                onChange={v => setDetails({ ...details, street: v })}
                                placeholder="Ej: Calle 100 #15-30 Apto 402"
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <FormInput
                                    label="Ciudad"
                                    value={details.city}
                                    onChange={v => setDetails({ ...details, city: v })}
                                    placeholder="Bogotá"
                                />
                                <FormInput
                                    label="Departamento"
                                    value={details.dept}
                                    onChange={v => setDetails({ ...details, dept: v })}
                                    placeholder="Cundinamarca"
                                />
                            </div>
                            <FormInput
                                label="Código Postal"
                                value={details.zip}
                                onChange={v => setDetails({ ...details, zip: v })}
                                placeholder="110111"
                            />

                            <button
                                onClick={handleConfirm}
                                style={{
                                    marginTop: '15px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '18px',
                                    borderRadius: '16px',
                                    fontWeight: '900',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    letterSpacing: '0.5px'
                                }}
                            >
                                <Check size={20} />
                                CONFIRMAR DIRECCIÓN
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const FormInput = ({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) => (
    <div className="form-group">
        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>{label}</label>
        <input
            type="text"
            className="glass"
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', color: 'white', background: 'rgba(255,255,255,0.05)', fontSize: '15px' }}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    </div>
);

export default AddressModal;
