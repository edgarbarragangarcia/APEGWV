import React from 'react';
import { Calendar, Trash2, Handshake, Loader2, CheckCircle2, Info } from 'lucide-react';
import Card from '../../../components/Card';
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
        <Card style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                <span style={{
                    padding: '6px 14px',
                    borderRadius: '12px',
                    fontSize: '10px',
                    fontWeight: '900',
                    background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' :
                        offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: offer.status === 'pending' ? '#f59e0b' :
                        offer.status === 'accepted' ? '#10b981' : '#ef4444',
                    border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' :
                        offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                    letterSpacing: '0.05em'
                }}>
                    {offer.status === 'pending' ? 'PENDIENTE' :
                        offer.status === 'accepted' ? 'ACEPTADA' : 'RECHAZADA'}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                        <Calendar size={12} />
                        {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '---'}
                    </div>
                    <button
                        onClick={() => onDelete(offer.id)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'rgba(239, 68, 68, 0.6)',
                            padding: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '8px'
                        }}
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={optimizeImage(offer.product?.image_url || null, { width: 150, height: 150 })}
                        style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        alt=""
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                        }}
                    />
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                        <Handshake size={10} color="white" />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>{offer.product?.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <p style={{ fontSize: '18px', color: 'var(--secondary)', fontWeight: '900' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount || 0)}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'line-through', fontWeight: '600' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                        </p>
                        <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                            -{discountPercent}%
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={14} color="var(--text-dim)" />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontWeight: '700' }}>{offer.buyer?.full_name || 'Comprador APEG'}</span>
                    </div>
                </div>

                {offer.message && (
                    <div style={{ position: 'relative', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--secondary)' }}>
                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: '1.4' }}>
                            "{offer.message}"
                        </p>
                    </div>
                )}
            </div>

            {offer.status === 'pending' && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                    <button
                        onClick={() => onAction(offer.id, 'rejected')}
                        disabled={updatingOffer === offer.id}
                        style={{
                            flex: 1,
                            minWidth: '100px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            color: '#f87171',
                            padding: '12px',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '11px'
                        }}
                    >
                        RECHAZAR
                    </button>
                    <button
                        onClick={() => onCounterClick(offer)}
                        disabled={updatingOffer === offer.id}
                        style={{
                            flex: 1,
                            minWidth: '100px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: 'white',
                            padding: '12px',
                            borderRadius: '14px',
                            fontWeight: '800',
                            fontSize: '11px'
                        }}
                    >
                        CONTRAOFERTA
                    </button>
                    <button
                        onClick={() => onAction(offer.id, 'accepted')}
                        disabled={updatingOffer === offer.id}
                        style={{
                            flex: 2,
                            minWidth: '180px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '12px',
                            borderRadius: '14px',
                            fontWeight: '900',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                        }}
                    >
                        {updatingOffer === offer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                        ACEPTAR OFERTA
                    </button>
                </div>
            )}

            {offer.status === 'countered' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu Contraoferta</span>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' }}>${offer.counter_amount?.toLocaleString()}</span>
                        </div>
                        {offer.counter_message && (
                            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                                "{offer.counter_message}"
                            </p>
                        )}
                    </div>
                    <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '14px', color: '#60a5fa', textAlign: 'center', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Info size={16} />
                        RESERVADO • El comprador tiene 1 hora para comprar
                    </div>
                </div>
            )}

            {offer.status === 'accepted' && (
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '16px', color: '#10b981', textAlign: 'center', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <CheckCircle2 size={18} />
                    OFERTA ACEPTADA • Esperando pago (1h)
                </div>
            )}
        </Card>
    );
};

// Add User icon if not already in lucide imports
import { User } from 'lucide-react';

export default OfferCard;
