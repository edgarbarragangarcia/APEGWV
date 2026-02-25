import React from 'react';
import { X, Loader2 } from 'lucide-react';
import Card from '../../../components/Card';

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
    return (
        <Card style={{ padding: '25px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px', marginBottom: '20px' }}>
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{editingId ? 'Editar Cupón' : 'Crear Nuevo Cupón'}</h3>
                    <button type="button" onClick={onClose} style={{ color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Código</label>
                        <input
                            required
                            placeholder="GOLF2024"
                            value={formData.code}
                            onChange={e => onChange({ ...formData, code: e.target.value.toUpperCase() })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Tipo</label>
                        <select
                            value={formData.discount_type}
                            onChange={e => onChange({ ...formData, discount_type: e.target.value as any })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        >
                            <option value="percentage">Porcentaje (%)</option>
                            <option value="fixed">Valor Fijo ($)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Valor Descuento</label>
                        <input
                            required
                            type="number"
                            placeholder={formData.discount_type === 'percentage' ? '10' : '50000'}
                            value={formData.discount_value}
                            onChange={e => onChange({ ...formData, discount_value: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Límite de Usos</label>
                        <input
                            type="number"
                            placeholder="Sin límite"
                            value={formData.usage_limit}
                            onChange={e => onChange({ ...formData, usage_limit: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>Mínimo de Compra</label>
                        <input
                            type="number"
                            placeholder="0"
                            value={formData.min_purchase_amount}
                            onChange={e => onChange({ ...formData, min_purchase_amount: e.target.value })}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', boxSizing: 'border-box' }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                            type="checkbox"
                            id="coupon-active"
                            checked={formData.is_active}
                            onChange={e => onChange({ ...formData, is_active: e.target.checked })}
                            style={{ width: '18px', height: '18px' }}
                        />
                        <label htmlFor="coupon-active" style={{ fontSize: '13px', fontWeight: '600' }}>Activo</label>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '15px', borderRadius: '16px', fontWeight: '900', marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'GUARDAR CAMBIOS' : 'CREAR CUPÓN')}
                </button>
            </form>
        </Card>
    );
};

export default CouponForm;
