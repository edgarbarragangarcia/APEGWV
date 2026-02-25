import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Loader2, Package, ChevronRight, Tag, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/SupabaseManager';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import Card from '../components/Card';
import { useToast } from '../context/ToastContext';

const MyPurchases: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { warning } = useToast();
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [myOffers, setMyOffers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeSegment, setActiveSegment] = useState<'orders' | 'offers'>('orders');

    const [selectedOffer, setSelectedOffer] = useState<any>(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [acceptingCounter, setAcceptingCounter] = useState(false);

    useEffect(() => {
        if (user) {
            fetchOrdersAndOffers();

            // Handle offer_id from URL
            const params = new URLSearchParams(window.location.search);
            const offerId = params.get('offer_id');
            if (offerId) {
                fetchSingleOffer(offerId);
                setActiveSegment('offers');
            }
        }
    }, [user]);

    const fetchSingleOffer = async (id: string) => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select('*, product:products(*)')
                .eq('id', id)
                .single();
            if (error) throw error;
            if (data) setSelectedOffer(data);
        } catch (err) {
            console.error('Error fetching single offer:', err);
        }
    };

    const fetchOrdersAndOffers = async () => {
        setLoading(true);
        try {
            const [ordersRes, offersRes] = await Promise.all([
                supabase
                    .from('orders')
                    .select(`
                        *,
                        order_items (
                            *,
                            product:products (*)
                        )
                    `)
                    .eq('buyer_id', user!.id)
                    .order('created_at', { ascending: false }),
                supabase
                    .from('offers')
                    .select('*, product:products(*) ')
                    .eq('buyer_id', user!.id)
                    .order('created_at', { ascending: false })
            ]);

            if (ordersRes.data) {
                setMyOrders(ordersRes.data.map((order: any) => ({
                    ...order,
                    product: order.order_items?.[0]?.product
                })));
            }
            if (offersRes.data) setMyOffers(offersRes.data);
        } catch (err) {
            console.error('Error fetching orders/offers:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <PageHero />

            <div style={{
                flexShrink: 0,
                position: 'relative',
                zIndex: 10,
                padding: '0 20px',
                paddingTop: 'var(--header-offset-top)'
            }}>
                <PageHeader
                    title="Mis Compras"
                    subtitle="Seguimiento de tus pedidos y ofertas"
                    onBack={() => navigate('/profile')}
                />

                {/* Segmented Control */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '16px',
                    marginBottom: '20px',
                    marginTop: '10px'
                }}>
                    <button
                        onClick={() => setActiveSegment('orders')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeSegment === 'orders' ? 'var(--secondary)' : 'transparent',
                            color: activeSegment === 'orders' ? 'var(--primary)' : 'white',
                            fontSize: '13px',
                            fontWeight: '800',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Pedidos ({myOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveSegment('offers')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeSegment === 'offers' ? 'var(--secondary)' : 'transparent',
                            color: activeSegment === 'offers' ? 'var(--primary)' : 'white',
                            fontSize: '13px',
                            fontWeight: '800',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        Ofertas ({myOffers.length})
                    </button>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px calc(var(--nav-height) + 20px) 20px',
                position: 'relative',
                zIndex: 10
            }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '200px', gap: '15px' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--secondary)" />
                        <span style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Cargando registros...</span>
                    </div>
                ) : (
                    <AnimatePresence mode="wait">
                        {activeSegment === 'orders' ? (
                            <motion.div
                                key="orders"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                                {myOrders.length > 0 ? (
                                    myOrders.map((order, idx) => (
                                        <Card key={order.id || idx} style={{
                                            padding: '16px',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            borderRadius: '24px'
                                        }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{
                                                    background: order.status === 'shipped' ? '#10b981' : '#f59e0b',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    color: 'white',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {order.status || 'Pagado'}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                                                    {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                                    <img
                                                        src={order.product?.image_url}
                                                        alt=""
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>{order.product?.name}</h4>
                                                    <div style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)' }}>
                                                        ${order.total_amount?.toLocaleString()}
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                                        <Package size={40} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                        <p style={{ fontSize: '14px' }}>No tienes pedidos realizados aún.</p>
                                    </div>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="offers"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
                            >
                                {myOffers.length > 0 ? (
                                    myOffers.map((offer, idx) => (
                                        <Card
                                            key={offer.id || idx}
                                            onClick={() => setSelectedOffer(offer)}
                                            style={{
                                                padding: '16px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.05)',
                                                borderRadius: '24px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                                <span style={{
                                                    background: offer.status === 'accepted' ? '#10b981' : (offer.status === 'rejected' ? '#ef4444' : (offer.status === 'countered' ? '#8b5cf6' : '#f59e0b')),
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '10px',
                                                    fontWeight: '900',
                                                    color: 'white',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {offer.status === 'countered' ? 'Contraoferta' : offer.status}
                                                </span>
                                                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                                                    {new Date(offer.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                <div style={{ width: '50px', height: '50px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                                    <img
                                                        src={offer.product?.image_url}
                                                        alt=""
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ fontSize: '15px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>{offer.product?.name}</h4>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '600' }}>Tu oferta: <span style={{ color: 'var(--secondary)' }}>${(offer.amount || offer.offer_amount)?.toLocaleString()}</span></span>
                                                        {offer.status === 'countered' && offer.counter_amount && (
                                                            <span style={{ fontSize: '13px', color: '#8b5cf6', fontWeight: '800' }}>Contraoferta: ${offer.counter_amount.toLocaleString()}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                                            </div>
                                        </Card>
                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                                        <Tag size={40} style={{ marginBottom: '15px', opacity: 0.2 }} />
                                        <p style={{ fontSize: '14px' }}>No has realizado ofertas aún.</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                )}
            </div>

            {/* Offer Detail Modal */}
            <AnimatePresence>
                {selectedOffer && (
                    <div key="offer-detail" style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 110000,
                        display: 'flex',
                        alignItems: 'flex-end',
                        justifyContent: 'center'
                    }}>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedOffer(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.6)',
                                backdropFilter: 'blur(10px)'
                            }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            style={{
                                width: '100%',
                                maxWidth: 'var(--app-max-width)',
                                background: '#121212',
                                borderTopLeftRadius: '28px',
                                borderTopRightRadius: '28px',
                                position: 'relative',
                                boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'flex',
                                flexDirection: 'column',
                                maxHeight: '92vh',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Fixed Header */}
                            <div style={{ padding: '20px 20px 15px 20px', flexShrink: 0, position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                <button
                                    onClick={() => setSelectedOffer(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '20px',
                                        background: 'rgba(255,255,255,0.08)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '32px',
                                        height: '32px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        zIndex: 10
                                    }}
                                >
                                    <X size={18} />
                                </button>

                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', flexShrink: 0 }}>
                                        <img
                                            src={selectedOffer.product?.image_url || ''}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt=""
                                        />
                                    </div>
                                    <div style={{ overflow: 'hidden' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0, lineHeight: 1.2 }}>Detalle de la Oferta</h3>
                                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedOffer.product?.name}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div style={{
                                flex: 1,
                                overflowY: 'auto',
                                minHeight: 0,
                                padding: '20px 20px calc(40px + env(safe-area-inset-bottom)) 20px',
                                WebkitOverflowScrolling: 'touch',
                                display: 'flex',
                                flexDirection: 'column'
                            }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '2px' }}>Tu Oferta Original</div>
                                        <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>${(selectedOffer.amount || selectedOffer.offer_amount)?.toLocaleString()}</div>
                                    </div>

                                    {selectedOffer.status === 'countered' && (
                                        <div>
                                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '10px', fontWeight: '900', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '2px' }}>Contraoferta del Vendedor</div>
                                                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>${selectedOffer.counter_amount?.toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ background: '#8b5cf6', padding: '3px 8px', borderRadius: '6px', fontSize: '9px', fontWeight: '900', color: 'white' }}>
                                                        REVISAR
                                                    </div>
                                                </div>

                                                {selectedOffer.counter_message && (
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px', marginTop: '6px' }}>
                                                        <div style={{ fontSize: '10px', fontWeight: '800', color: '#a78bfa', marginBottom: '2px' }}>Respuesta del vendedor:</div>
                                                        <p style={{ fontSize: '13px', color: 'white', fontStyle: 'italic', margin: 0 }}>"{selectedOffer.counter_message}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                disabled={acceptingCounter}
                                                onClick={async () => {
                                                    setAcceptingCounter(true);
                                                    try {
                                                        const { error } = await supabase
                                                            .from('offers')
                                                            .update({
                                                                status: 'accepted',
                                                                offer_amount: selectedOffer.counter_amount
                                                            })
                                                            .eq('id', selectedOffer.id);

                                                        if (error) throw error;

                                                        // Notify seller
                                                        await supabase
                                                            .from('notifications')
                                                            .insert([{
                                                                user_id: selectedOffer.seller_id,
                                                                title: '¡Contraoferta aceptada!',
                                                                message: `El comprador ha aceptado tu contraoferta de $${(selectedOffer.counter_amount || 0).toLocaleString()} por ${selectedOffer.product?.name || 'su producto'}`,
                                                                type: 'offer',
                                                                link: '/my-store?tab=offers',
                                                                read: false
                                                            }]);

                                                        warning('¡Felicidades! Has aceptado la contraoferta.');
                                                        fetchOrdersAndOffers(); // Refresh the list
                                                        setSelectedOffer(null);
                                                        navigate('/checkout', { state: { offer: selectedOffer } });
                                                    } catch (err) {
                                                        console.error(err);
                                                    } finally {
                                                        setAcceptingCounter(false);
                                                    }
                                                }}
                                                style={{
                                                    marginTop: '12px',
                                                    width: '100%',
                                                    height: '48px',
                                                    borderRadius: '14px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    border: 'none',
                                                    fontWeight: '900',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                {acceptingCounter ? 'PROCESANDO...' : `ACEPTAR Y COMPRAR POR $${selectedOffer.counter_amount?.toLocaleString()}`}
                                            </motion.button>
                                        </div>
                                    )}

                                    {selectedOffer.status === 'accepted' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <div style={{ fontSize: '10px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', marginBottom: '2px' }}>Estado</div>
                                                <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>¡Oferta Aceptada!</div>
                                                <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>El vendedor ha aceptado tu oferta. Tienes 1 hora para completar el pago.</p>
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedOffer(null);
                                                    navigate('/checkout', { state: { offer: selectedOffer } });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '48px',
                                                    borderRadius: '14px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    border: 'none',
                                                    fontWeight: '900',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                COMPRAR AHORA POR ${(selectedOffer.offer_amount || selectedOffer.amount)?.toLocaleString()}
                                            </motion.button>
                                        </div>
                                    )}

                                    {selectedOffer.status === 'rejected' && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <div style={{ fontSize: '10px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: '2px' }}>Estado</div>
                                            <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>Oferta Rechazada</div>
                                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '6px' }}>Lo sentimos, el vendedor no ha aceptado tu propuesta en este momento.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Enviar Mensaje al Vendedor */}
                                {selectedOffer.status !== 'rejected' && (
                                    <div style={{ marginTop: '8px' }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '8px' }}>Responder al Vendedor</label>
                                        <textarea
                                            placeholder="Escribe un mensaje aquí..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '16px',
                                                padding: '12px',
                                                color: 'white',
                                                fontSize: '13px',
                                                fontWeight: '500',
                                                outline: 'none',
                                                minHeight: '80px',
                                                resize: 'none',
                                                marginBottom: '12px'
                                            }}
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            disabled={sendingReply || !replyMessage}
                                            onClick={async () => {
                                                setSendingReply(true);
                                                try {
                                                    const { error } = await supabase
                                                        .from('notifications')
                                                        .insert([{
                                                            user_id: selectedOffer.seller_id,
                                                            title: 'Nuevo mensaje sobre oferta',
                                                            message: `El comprador de ${selectedOffer.product?.name} dice: ${replyMessage}`,
                                                            type: 'offer',
                                                            link: '/my-store?tab=offers',
                                                            read: false
                                                        }]);

                                                    if (error) throw error;

                                                    warning('¡Mensaje enviado al vendedor!');
                                                    setReplyMessage('');
                                                    setSelectedOffer(null);
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setSendingReply(false);
                                                }
                                            }}
                                            className="btn-primary"
                                            style={{ width: '100%', height: '48px', fontSize: '14px' }}
                                        >
                                            {sendingReply ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                                        </motion.button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyPurchases;
