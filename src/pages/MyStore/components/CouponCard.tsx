import React, { useState } from 'react';
import { Percent, Pencil, Trash2 } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import type { Coupon } from '../hooks/useStoreData';

interface CouponCardProps {
    coupon: Coupon;
    onEdit: (coupon: Coupon) => void;
    onDelete: (couponId: string, code: string) => void;
}

const CouponCard: React.FC<CouponCardProps> = ({ coupon, onEdit, onDelete }) => {
    const isActive = coupon.active;
    const value = coupon.value;
    const controls = useAnimation();
    const [isOpen, setIsOpen] = useState(false);

    const onDragEnd = (_: any, info: any) => {
        if (info.offset.x < -40) {
            controls.start({ x: -90 });
            setIsOpen(true);
        } else {
            controls.start({ x: 0 });
            setIsOpen(false);
        }
    };

    const closeActions = () => {
        controls.start({ x: 0 });
        setIsOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '12px', position: 'relative', fontFamily: 'var(--font-main)' }}
        >
            <div style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '20px',
                overflow: 'hidden',
            }}>
                {/* Actions Layer (Behind) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    paddingRight: '10px',
                    zIndex: 1
                }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onEdit(coupon); closeActions(); }}
                        style={{
                            padding: '8px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.1)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px'
                        }}
                    >
                        <Pencil size={16} />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onDelete(coupon.id, coupon.code); closeActions(); }}
                        style={{
                            padding: '8px',
                            borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ff6b6b',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '36px',
                            height: '36px'
                        }}
                    >
                        <Trash2 size={16} />
                    </motion.button>
                </div>

                {/* Draggable Content Layer */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -90, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => { if (isOpen) closeActions(); }}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '16px',
                        background: 'rgba(6, 46, 36, 0.98)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '20px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                background: 'rgba(163, 230, 53, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--secondary)',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                flexShrink: 0
                            }}>
                                <Percent size={18} strokeWidth={2.5} />
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span style={{ fontWeight: '800', fontSize: '15px', color: 'white' }}>
                                        {coupon.code}
                                    </span>
                                    <span style={{
                                        fontSize: '8px',
                                        padding: '2px 6px',
                                        borderRadius: '6px',
                                        background: isActive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                        color: isActive ? '#10b981' : '#ef4444',
                                        fontWeight: '800'
                                    }}>
                                        {isActive ? 'ACTIVO' : 'OFF'}
                                    </span>
                                </div>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', fontWeight: '600' }}>
                                    {coupon.discount_type === 'percentage' ? `${value}% desc.` : `$${value?.toLocaleString()} desc.`}
                                </p>
                            </div>
                        </div>

                        {/* Swipe Hint */}
                        <div style={{ opacity: isOpen ? 1 : 0.2, transition: '0.3s all' }}>
                            <motion.div animate={isOpen ? { x: 0, rotate: 180 } : { x: [0, -3, 0] }} transition={{ repeat: isOpen ? 0 : Infinity, duration: 2 }}>
                                {isOpen ? <Trash2 size={16} color="var(--secondary)" /> : <Trash2 size={12} />}
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default CouponCard;
