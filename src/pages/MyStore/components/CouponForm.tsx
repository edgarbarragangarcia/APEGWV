import React from 'react';
import { X, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';

interface CouponFormData {
    code: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: string;
    usage_limit: string;
    min_purchase_amount: string;
    is_active: boolean;
}

interface CouponFormProps {
    formData: CouponFormData;
    editingId: string | null;
    saving: boolean;
    onClose: () => void;
    onChange: (data: CouponFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const CouponForm: React.FC<CouponFormProps> = ({
    formData,
    editingId,
    saving,
    onClose,
    onChange,
    onSubmit
}) => {
    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '16px 16px 16px 20px',
        color: 'white',
        fontSize: '15px',
        fontFamily: 'var(--font-main)',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box' as const
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '10px',
        fontSize: '11px',
        fontWeight: '900',
        color: 'var(--secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        paddingLeft: '4px',
        fontFamily: 'var(--font-main)'
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                padding: '30px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                border: '1px solid var(--glass-border)',
                borderRadius: '32px',
                boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
                position: 'relative'
            }}
        >
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: 'var(--font-main)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '14px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(163, 230, 53, 0.2)'
                        }}>
                            <Ticket size={22} color="var(--secondary)" />
                        </div>
                        <h3 style={{
                            fontSize: '22px',
                            fontWeight: '900',
                            color: 'white',
                            letterSpacing: '-0.3px',
                            lineHeight: 1.2
                        }}>
                            {editingId ? 'Editar Cupón' : 'Nuevo Cupón'}
                        </h3>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={onClose}
                        style={{
                            color: 'rgba(255,255,255,0.4)',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} />
                    </motion.button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={labelStyle}>Código del Cupón</label>
                        <input
                            required
                            placeholder="EJ: GOLF2024"
                            value={formData.code}
                            onChange={e => onChange({ ...formData, code: e.target.value.toUpperCase() })}
                            style={inputStyle}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={labelStyle}>Tipo</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={formData.discount_type}
                                    onChange={e => onChange({ ...formData, discount_type: e.target.value as any })}
                                    style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
                                >
                                    <option value="percentage" style={{ background: 'var(--primary)', color: 'white' }}>Porcentaje (%)</option>
                                    <option value="fixed" style={{ background: 'var(--primary)', color: 'white' }}>Valor Fijo ($)</option>
                                </select>
                                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M1 1L5 5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Valor</label>
                            <input
                                required
                                type="number"
                                placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                                value={formData.discount_value}
                                onChange={e => onChange({ ...formData, discount_value: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={labelStyle}>Límite de Usos</label>
                            <input
                                type="number"
                                placeholder="Sin límite"
                                value={formData.usage_limit}
                                onChange={e => onChange({ ...formData, usage_limit: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Mínimo de Compra</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={formData.min_purchase_amount}
                                onChange={e => onChange({ ...formData, min_purchase_amount: e.target.value })}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    <div
                        onClick={() => onChange({ ...formData, is_active: !formData.is_active })}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '16px 20px',
                            background: formData.is_active ? 'rgba(163, 230, 53, 0.08)' : 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid ' + (formData.is_active ? 'rgba(163, 230, 53, 0.2)' : 'var(--glass-border)'),
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            marginTop: '4px'
                        }}
                    >
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '8px',
                            background: formData.is_active ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}>
                            {formData.is_active && <svg width="14" height="10" viewBox="0 0 12 9" fill="none"><path d="M1 4.5L4.5 8L11 1.5" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span style={{
                            fontSize: '15px',
                            fontWeight: '800',
                            color: formData.is_active ? 'white' : 'rgba(255,255,255,0.5)',
                            fontFamily: 'var(--font-main)'
                        }}>
                            Cupón Activo
                        </span>
                    </div>
                </div>

                <div style={{ marginTop: '10px' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        className="btn-primary"
                        style={{ height: '60px', width: '100%', borderRadius: '20px', fontSize: '15px', fontWeight: '900', letterSpacing: '0.05em' }}
                    >
                        {saving ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                <span>GUARDANDO...</span>
                            </div>
                        ) : (
                            editingId ? 'GUARDAR CAMBIOS' : 'CREAR CUPÓN'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '13px',
                            fontWeight: '800',
                            marginTop: '16px',
                            cursor: 'pointer',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                        }}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default CouponForm;
