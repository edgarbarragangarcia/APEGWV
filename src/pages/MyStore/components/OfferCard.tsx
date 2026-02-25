import { motion } from 'framer-motion';
import { Calendar, Trash2, Handshake, Loader2, CheckCircle2, Info, User } from 'lucide-react';
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
    const discountPercent = offer.product ? Math.round((1 - (offer.offer_amount || 0) / (offer.product.price || 1)) * 100) : 0;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '32px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
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
                        offer.status === 'accepted' ? 'ACEPTADA' : 'RECHAZADA'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '800' }}>
                        <Calendar size={14} strokeWidth={2.5} />
                        {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '---'}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onDelete(offer.id)}
                        style={{
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            color: '#ef4444',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px'
                        }}
                    >
                        <Trash2 size={16} strokeWidth={2.5} />
                    </motion.button>
                </div>
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
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #060e20', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        <Handshake size={14} color="white" strokeWidth={2.5} />
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '6px', color: 'white', letterSpacing: '-0.3px' }}>{offer.product?.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <p style={{ fontSize: '22px', color: 'var(--secondary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount || 0)}
                        </p>
                        <p style={{ fontSize: '13px', color: 'var(--text-dim)', textDecoration: 'line-through', fontWeight: '800' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                        </p>
                        <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', padding: '3px 8px', borderRadius: '8px', fontWeight: '950', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                            -{discountPercent}%
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '18px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: offer.message ? '14px' : '0' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <User size={14} color="var(--secondary)" strokeWidth={2.5} />
                    </div>
                    <span style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>{offer.buyer?.full_name || 'Comprador APEG'}</span>
                </div>

                {offer.message && (
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', borderLeft: '3px solid var(--secondary)', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)' }}>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontStyle: 'italic', lineHeight: '1.5', margin: 0 }}>
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
                            minWidth: '100px',
                            background: 'rgba(239, 68, 68, 0.05)',
                            border: '1px solid rgba(239, 68, 68, 0.1)',
                            color: '#f87171',
                            padding: '14px',
                            borderRadius: '18px',
                            fontWeight: '900',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        RECHAZAR
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onCounterClick(offer)}
                        disabled={updatingOffer === offer.id}
                        style={{
                            flex: 1,
                            minWidth: '100px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            color: 'white',
                            padding: '14px',
                            borderRadius: '18px',
                            fontWeight: '900',
                            fontSize: '11px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}
                    >
                        CONTRAOFERTA
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onAction(offer.id, 'accepted')}
                        disabled={updatingOffer === offer.id}
                        style={{
                            flex: 2,
                            minWidth: '180px',
                            background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                            color: 'var(--primary)',
                            padding: '14px',
                            borderRadius: '18px',
                            fontWeight: '950',
                            fontSize: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            border: 'none',
                            boxShadow: '0 10px 25px rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        {updatingOffer === offer.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} strokeWidth={2.5} />}
                        ACEPTAR OFERTA
                    </motion.button>
                </div>
            )}

            {offer.status === 'countered' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '18px', borderRadius: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '950', textTransform: 'uppercase', letterSpacing: '1px' }}>Tu Contraoferta</span>
                            <span style={{ fontSize: '20px', fontWeight: '950', color: 'var(--secondary)' }}>${offer.counter_amount?.toLocaleString()}</span>
                        </div>
                        {offer.counter_message && (
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                                "{offer.counter_message}"
                            </p>
                        )}
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.15)', padding: '14px', borderRadius: '16px', color: '#60a5fa', textAlign: 'center', fontWeight: '900', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                        <Info size={16} strokeWidth={2.5} />
                        RESERVADO • Esperando respuesta del comprador
                    </div>
                </div>
            )}

            {offer.status === 'accepted' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.15)', padding: '18px', borderRadius: '20px', color: '#10b981', textAlign: 'center', fontWeight: '950', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <CheckCircle2 size={20} strokeWidth={2.5} />
                    OFERTA ACEPTADA • Esperando pago
                </div>
            )}
        </motion.div>
    );
};

export default OfferCard;
