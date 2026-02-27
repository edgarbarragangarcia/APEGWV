import React from 'react';
import { Handshake, Search } from 'lucide-react';
import OfferCard from '../components/OfferCard';

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

interface OffersTabProps {
    offers: Offer[];
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onAccept: (offerId: string) => void;
    onReject: (offerId: string) => void;
    onCounter: (offer: Offer) => void;
    onDelete: (offerId: string) => void;
    updatingOffer: string | null;
}

const OffersTab: React.FC<OffersTabProps> = ({
    offers,
    searchTerm,
    onSearchChange,
    onAccept,
    onReject,
    onCounter,
    onDelete,
    updatingOffer
}) => {
    const filteredOffers = offers.filter(o =>
        (o.buyer?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.8 }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por comprador o producto..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '20px',
                            padding: '18px 20px 18px 52px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>
            </div>

            {offers.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Handshake size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-dim)' }}>Aún no has recibido ofertas.</p>
                </div>
            ) : filteredOffers.length === 0 && searchTerm ? (
                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                    <Handshake size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron ofertas que coincidan con tu búsqueda.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredOffers.map((offer, index) => (
                        <OfferCard
                            key={offer.id || `offer-${index}`}
                            offer={offer}
                            updatingOffer={updatingOffer}
                            onDelete={onDelete}
                            onAction={(id, action) => action === 'accepted' ? onAccept(id) : onReject(id)}
                            onCounterClick={onCounter}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OffersTab;
