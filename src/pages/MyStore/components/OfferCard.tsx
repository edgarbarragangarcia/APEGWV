import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Calendar, User, CheckCircle2, Loader2, Handshake, Trash2, X, ChevronLeft } from 'lucide-react';
import { optimizeImage } from '../../../services/SupabaseManager';

interface Offer {
    id: string;
    created_at: string | null;
    status: string | null;
    offer_amount: number;
    message?: string;
    buyer_id: string;
    counter_amount?: number;
    counter_message?: string;
    product: { id: string; name: string; image_url: string | null; price: number; is_negotiable?: boolean } | null;
    buyer: { id: string; full_name: string | null; id_photo_url: string | null } | null;
}

interface OfferCardProps {
    offer: Offer;
    updatingOffer: string | null;
    onDelete: (offerId: string) => void;
    onAction: (offerId: string, action: 'accepted' | 'rejected') => void;
    onCounterClick: (offer: Offer) => void;
}

const OfferCard: React.FC<OfferCardProps> = ({
    offer,
    updatingOffer,
    onDelete,
    onAction,
    onCounterClick
}) => {
    const controls = useAnimation();
    const [isOpen, setIsOpen] = useState(false);

    // Calculate drag distance based on available actions
    const actionsCount = offer.status === 'pending' ? (offer.product?.is_negotiable ? 4 : 3) : 1;
    const dragDistance = -(actionsCount * 64) - 16;

    const onDragEnd = (_: any, info: any) => {
        if (info.offset.x < -30) {
            controls.start({ x: dragDistance });
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

    const ActionBtn = ({ hexColor, icon, onClick, loading, label }: any) => (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
                width: '56px',
                height: '80px',
                borderRadius: '18px',
                background: `color-mix(in srgb, ${hexColor} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${hexColor} 30%, transparent)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: hexColor,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                cursor: 'pointer'
            }}
        >
            {loading ? <Loader2 size={20} className="animate-spin" /> : icon}
            <span style={{ fontSize: '8px', fontWeight: '950', textTransform: 'uppercase' }}>{label}</span>
        </motion.button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginBottom: '16px', position: 'relative', fontFamily: 'var(--font-main)' }}
        >
            {/* Background Actions Layer */}
            <div style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                right: 0,
                width: Math.abs(dragDistance) + 'px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '16px',
                gap: '8px',
                zIndex: 1
            }}>
                {offer.status === 'pending' && (
                    <>
                        <ActionBtn
                            hexColor="#ef4444"
                            icon={<X size={20} />}
                            onClick={() => { onAction(offer.id, 'rejected'); closeActions(); }}
                            loading={updatingOffer === offer.id}
                            label="RECHAZAR"
                        />
                        {offer.product?.is_negotiable && onCounterClick && (
                            <ActionBtn
                                hexColor="#fbbf24"
                                icon={<Handshake size={20} />}
                                onClick={() => { onCounterClick(offer); closeActions(); }}
                                label="CONTRA"
                            />
                        )}
                        <ActionBtn
                            hexColor="#a3e635"
                            icon={<CheckCircle2 size={20} />}
                            onClick={() => { onAction(offer.id, 'accepted'); closeActions(); }}
                            loading={updatingOffer === offer.id}
                            label="ACEPTAR"
                        />
                    </>
                )}
                <ActionBtn
                    hexColor="#ef4444"
                    icon={<Trash2 size={20} />}
                    onClick={() => { onDelete(offer.id); closeActions(); }}
                    label="BORRAR"
                />
            </div>

            <div style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
            }}>
                {/* Content Layer (Draggable) */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: dragDistance, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => {
                        if (isOpen) {
                            closeActions();
                        } else {
                            controls.start({ x: dragDistance });
                            setIsOpen(true);
                        }
                    }}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '16px 20px',
                        background: 'rgba(6, 46, 36, 1)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '32px',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                >
                    {/* Swipe Hint Indicator */}
                    {!isOpen && (
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 1, 0.4], x: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)' }}
                        >
                            <ChevronLeft size={16} />
                        </motion.div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: '950',
                            background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' :
                                offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: offer.status === 'pending' ? '#f59e0b' :
                                offer.status === 'accepted' ? '#10b981' : '#ef4444',
                            border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                                offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            {offer.status === 'pending' ? 'PENDIENTE' :
                                offer.status === 'accepted' ? 'ACEPTADA' :
                                    offer.status === 'countered' ? 'CONTRAOFERTA' : 'RECHAZADA'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', marginBottom: '14px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                <img
                                    src={optimizeImage(offer.product?.image_url || null, { width: 150, height: 150 })}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt=""
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                    }}
                                />
                            </div>
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: '#3b82f6', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #062e24', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                <Handshake size={10} color="white" strokeWidth={3} />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '2px', color: 'white', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer.product?.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <p style={{ fontSize: '16px', color: 'var(--secondary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount || 0)}
                                </p>
                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through', fontWeight: '800' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                                </p>
                            </div>

                            {/* Buyer Info under Prices */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <User size={10} color="var(--secondary)" strokeWidth={3} />
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                        {offer.buyer?.full_name?.split(' ')[0] || 'Comprador'}
                                    </span>
                                    <div style={{ height: '10px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '800' }}>
                                        <Calendar size={8} strokeWidth={3} />
                                        {offer.created_at ? new Date(offer.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' }) : '--/--'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {offer.message && (
                        <div style={{ padding: '0 0 0 10px', borderLeft: '2px solid var(--secondary)' }}>
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', fontStyle: 'italic', lineHeight: '1.4', margin: 0 }}>
                                "{offer.message}"
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default OfferCard;
