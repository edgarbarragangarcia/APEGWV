import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { Calendar, User, CheckCircle2, Loader2, Info, Handshake, Trash2 } from 'lucide-react';
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
    product: { id: string; name: string; image_url: string | null; price: number } | null;
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ marginBottom: '16px', position: 'relative', fontFamily: 'var(--font-main)' }}
        >
            <div style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
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
                    gap: '10px',
                    paddingRight: '10px',
                    zIndex: 1
                }}>
                    {offer.status === 'pending' && (
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => { e.stopPropagation(); onCounterClick(offer); closeActions(); }}
                            style={{
                                color: 'white',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                width: '40px',
                                height: '40px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                            }}
                        >
                            <Handshake size={18} strokeWidth={2.5} />
                        </motion.button>
                    )}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onDelete(offer.id); closeActions(); }}
                        style={{
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Draggable Content Layer */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -90, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '24px',
                        background: 'rgba(6, 46, 36, 0.98)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '32px',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => { if (isOpen) closeActions(); }}
                >
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '20px' }}>
                        <span style={{
                            padding: '6px 14px',
                            borderRadius: '14px',
                            fontSize: '10px',
                            fontWeight: '950',
                            background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.1)' :
                                offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: offer.status === 'pending' ? '#f59e0b' :
                                offer.status === 'accepted' ? '#10b981' : '#ef4444',
                            border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.2)' :
                                offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase'
                        }}>
                            {offer.status === 'pending' ? 'PENDIENTE' :
                                offer.status === 'accepted' ? 'ACEPTADA' :
                                    offer.status === 'countered' ? 'CONTRAOFERTA' : 'RECHAZADA'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '18px', marginBottom: '22px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '74px',
                                height: '74px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
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
                            <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #062e24', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                <Handshake size={12} color="white" strokeWidth={3} />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h4 style={{ fontSize: '15px', fontWeight: '900', marginBottom: '4px', color: 'white', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{offer.product?.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <p style={{ fontSize: '18px', color: 'var(--secondary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount || 0)}
                                </p>
                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', textDecoration: 'line-through', fontWeight: '800' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <User size={14} color="var(--secondary)" strokeWidth={3} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>{offer.buyer?.full_name || 'Comprador APEG'}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '800', marginTop: '2px' }}>
                                    <Calendar size={10} strokeWidth={3} />
                                    {offer.created_at ? new Date(offer.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
                                </div>
                            </div>
                        </div>

                        {offer.message && (
                            <div style={{ padding: '0 0 0 12px', borderLeft: '2px solid var(--secondary)', marginTop: '10px' }}>
                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', lineHeight: '1.5', margin: 0 }}>
                                    "{offer.message}"
                                </p>
                            </div>
                        )}
                    </div>

                    {offer.status === 'pending' && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onAction(offer.id, 'rejected')}
                                disabled={updatingOffer === offer.id}
                                style={{
                                    flex: 1,
                                    background: 'rgba(239, 68, 68, 0.05)',
                                    border: '1px solid rgba(239, 68, 68, 0.1)',
                                    color: '#f87171',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    fontWeight: '900',
                                    fontSize: '10px',
                                    textTransform: 'uppercase'
                                }}
                            >
                                RECHAZAR
                            </motion.button>
                            <motion.button
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAction(offer.id, 'accepted')}
                                disabled={updatingOffer === offer.id}
                                style={{
                                    flex: 2,
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    fontWeight: '950',
                                    fontSize: '11px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    textTransform: 'uppercase',
                                    border: 'none',
                                    boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                                }}
                            >
                                {updatingOffer === offer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} strokeWidth={3} />}
                                ACEPTAR
                            </motion.button>
                        </div>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

export default OfferCard;
