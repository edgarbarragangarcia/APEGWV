import React from 'react';
import { Percent, Pencil, Trash2 } from 'lucide-react';
import Card from '../../../components/Card';

import type { Coupon } from '../hooks/useStoreData';

interface CouponCardProps {
    coupon: Coupon;
    onEdit: (coupon: Coupon) => void;
    onDelete: (couponId: string, code: string) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onEdit, onDelete }) => {
    const isActive = coupon.active;
    const value = coupon.value;

    return (
        <Card style={{ padding: '18px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '45px', height: '45px', borderRadius: '12px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--secondary)' }}>
                        <Percent size={20} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '900', fontSize: '16px', letterSpacing: '0.05em' }}>{coupon.code}</span>
                            <span style={{
                                fontSize: '10px',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                background: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: isActive ? '#10b981' : '#ef4444',
                                fontWeight: '800'
                            }}>
                                {isActive ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
                            {coupon.discount_type === 'percentage' ? `${value}% de descuento` : `$${value?.toLocaleString()} de descuento`}
                        </p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => onEdit(coupon)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>
                        <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(coupon.id, coupon.code)} style={{ padding: '10px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
            <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                <span>USOS: {coupon.used_count || 0} / {coupon.usage_limit || '∞'}</span>
                <span>MÍNIMO: ${coupon.min_purchase_amount?.toLocaleString() || 0}</span>
            </div>
        </Card>
    );
};

export default CouponCard;
