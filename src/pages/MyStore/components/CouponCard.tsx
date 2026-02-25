import React from 'react';
import { Percent, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
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
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2, scale: 1.01 }}
            transition={{ type: 'spring', damping: 20 }}
            style={{
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)',
                border: '1px solid var(--glass-border)',
                borderRadius: '24px',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                fontFamily: 'var(--font-main)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'rgba(163, 230, 53, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--secondary)',
                        border: '1px solid rgba(163, 230, 53, 0.2)',
                        flexShrink: 0
                    }}>
                        <Percent size={24} strokeWidth={2.5} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{
                                fontWeight: '900',
                                fontSize: '18px',
                                letterSpacing: '0.05em',
                                color: 'white'
                            }}>
                                {coupon.code}
                            </span>
                            <span style={{
                                fontSize: '10px',
                                padding: '3px 8px',
                                borderRadius: '8px',
                                background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: isActive ? '#10b981' : '#ef4444',
                                fontWeight: '800',
                                letterSpacing: '0.05em'
                            }}>
                                {isActive ? 'ACTIVO' : 'INACTIVO'}
                            </span>
                        </div>
                        <p style={{
                            fontSize: '13px',
                            color: 'rgba(255,255,255,0.6)',
                            fontWeight: '600'
                        }}>
                            {coupon.discount_type === 'percentage' ? `${value}% de descuento` : `$${value?.toLocaleString()} de descuento`}
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEdit(coupon)}
                        style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Pencil size={18} />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(coupon.id, coupon.code)}
                        style={{
                            padding: '10px',
                            borderRadius: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ff6b6b',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Trash2 size={18} />
                    </motion.button>
                </div>
            </div>

            <div style={{
                marginTop: '18px',
                paddingTop: '18px',
                borderTop: '1px solid var(--glass-border)',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: 'rgba(255,255,255,0.5)',
                fontWeight: '700',
                letterSpacing: '0.05em'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>USOS:</span>
                    <span style={{ color: 'white' }}>{coupon.used_count || 0} / {coupon.usage_limit || '∞'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>MÍNIMO:</span>
                    <span style={{ color: 'white' }}>${coupon.min_purchase_amount?.toLocaleString() || 0}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default CouponCard;
