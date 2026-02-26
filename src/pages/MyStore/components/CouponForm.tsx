import React from 'react';

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
    onChange: (data: CouponFormData) => void;
    onSubmit: (e: React.FormEvent) => void;
}

const CouponForm: React.FC<CouponFormProps> = ({
    formData,
    editingId,
    saving,
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
        <div style={{ position: 'relative', zIndex: 10 }}>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px', fontFamily: 'var(--font-main)' }}>

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
                            <select
                                value={formData.discount_type}
                                onChange={e => onChange({ ...formData, discount_type: e.target.value as any })}
                                style={inputStyle}
                            >
                                <option value="percentage" style={{ background: 'var(--primary)', color: 'white' }}>Porcentaje (%)</option>
                                <option value="fixed" style={{ background: 'var(--primary)', color: 'white' }}>Valor Fijo ($)</option>
                            </select>
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

                <div style={{ marginTop: '10px', paddingBottom: '40px' }}>
                    <button
                        type="submit"
                        disabled={saving}
                        className={saving ? 'btn-disabled' : 'btn-primary'}
                        style={{ height: '64px', width: '100%', borderRadius: '18px', fontSize: '16px', fontWeight: '950' }}
                    >
                        {saving ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                <span>GUARDANDO...</span>
                            </div>
                        ) : (
                            editingId ? 'GUARDAR CAMBIOS' : 'CREAR CUPÓN'
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CouponForm;
