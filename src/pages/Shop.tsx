import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, ShoppingBag,
    ArrowLeft, ShoppingCart, ChevronRight, Plus, CheckCircle2,
    Loader2, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';

import { supabase, optimizeImage } from '../services/SupabaseManager';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];
type Order = Database['public']['Tables']['orders']['Row'] & {
    product: Product | null;
    seller: Database['public']['Tables']['profiles']['Row'] | null;
};
type Offer = Database['public']['Tables']['offers']['Row'] & {
    product: Product | null;
};

const Shop: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [viewTab, setViewTab] = useState<'marketplace' | 'myorders' | 'mystore'>('marketplace');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [buying, setBuying] = useState(false);
    const [myOrders, setMyOrders] = useState<Order[]>([]);
    const [myOffers, setMyOffers] = useState<Offer[]>([]);
    const { user } = useAuth();
    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [sendingOffer, setSendingOffer] = useState(false);
    const [offerSuccess, setOfferSuccess] = useState(false);
    const { addToCart, totalItems } = useCart();
    const [addingToCart, setAddingToCart] = useState<string | null>(null);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState<string | null>(null);
    const [productsLoading, setProductsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchMyOrders(user.id);
            fetchMyOffers(user.id);
        }
    }, [user]);

    const fetchMyOffers = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('offers')
                .select('*, product:products(*)')
                .eq('buyer_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data) setMyOffers(data);
        } catch (err: any) {
            console.error('Error fetching offers:', err);
        }
    };

    const fetchMyOrders = async (userId: string) => {
        setOrdersLoading(true);
        setOrdersError(null);
        console.log('Fetching orders for userId:', userId);
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('*, product:products!product_id(*), seller:profiles!seller_id(*)')
                .eq('buyer_id', userId)
                .order('created_at', { ascending: false });

            console.log('Orders fetch result:', { data, error });

            if (error) throw error;
            if (data) setMyOrders(data);
        } catch (err: any) {
            console.error('Error fetching orders:', err);
            setOrdersError(err.message);
        } finally {
            setOrdersLoading(false);
        }
    };

    useEffect(() => {
        const fetchProducts = async () => {
            setProductsLoading(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'active')
                    .order('created_at', { ascending: false });

                if (error) throw error;

                const mappedProducts = (data || []).map(p => ({
                    ...p,
                    price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
                }));

                setProducts(mappedProducts as Product[]);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setProductsLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const categories = ['Todo', 'Bolas', 'Ropa', 'Accesorios', 'Zapatos', 'Otros'];

    const categoryMapping: Record<string, string> = {
        'Todo': 'Todo',
        'Bolas': 'bolas',
        'Ropa': 'ropa',
        'Accesorios': 'accesorios',
        'Zapatos': 'zapatos',
        'Otros': 'otros'
    };

    const filteredProducts = products.filter(product => {
        const normalize = (val: string) => val.toLowerCase().trim();
        const prodCategoryNorm = normalize(product.category || '');

        const matchesCategory = activeTab === 'Todo' ||
            prodCategoryNorm === normalize(categoryMapping[activeTab] || '');

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prodCategoryNorm.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });



    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            zIndex: 500
        }} className="animate-fade">

            {/* Header Fijo - Marketplace */}
            <div style={{
                position: 'fixed',
                top: 'calc(env(safe-area-inset-top) + 82px)',
                left: '0',
                right: '0',
                width: '100%',
                maxWidth: 'var(--app-max-width)',
                margin: '0 auto',
                zIndex: 900,
                background: 'var(--primary)',
                paddingTop: '10px',
                paddingBottom: '20px',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '15px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '5px' }}>Marketplace</h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Equipamiento premium de la comunidad</p>
                    </div>
                    {totalItems > 0 && (
                        <motion.button
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/cart')}
                            style={{
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)'
                            }}
                        >
                            <ShoppingCart size={20} />
                            <span style={{ fontWeight: '900', fontSize: '14px' }}>{totalItems}</span>
                        </motion.button>
                    )}
                </div>

                {/* Tab Bar Principal */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '16px',
                    marginBottom: '15px',
                    gap: '4px'
                }}>
                    <button
                        onClick={() => setViewTab('marketplace')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: viewTab === 'marketplace' ? 'var(--secondary)' : 'transparent',
                            color: viewTab === 'marketplace' ? 'var(--primary)' : 'var(--text-dim)',
                            fontWeight: '700',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <ShoppingBag size={14} /> Marketplace
                    </button>
                    <button
                        onClick={() => setViewTab('myorders')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: viewTab === 'myorders' ? 'var(--secondary)' : 'transparent',
                            color: viewTab === 'myorders' ? 'var(--primary)' : 'var(--text-dim)',
                            fontWeight: '700',
                            fontSize: '11px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            position: 'relative',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <ShoppingCart size={14} /> Compras
                        {myOffers.length > 0 && (
                            <span style={{
                                position: 'absolute',
                                top: '2px',
                                right: '2px',
                                background: '#ef4444',
                                color: 'white',
                                fontSize: '8px',
                                padding: '1px 4px',
                                borderRadius: '10px',
                                fontWeight: '900'
                            }}>
                                {myOffers.length}
                            </span>
                        )}
                    </button>
                </div>

                {viewTab === 'marketplace' && (
                    <>
                        {/* Search Bar */}
                        <div className="glass" style={{
                            marginBottom: '10px',
                            padding: '10px 15px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <Search size={18} color="var(--text-dim)" />
                            <input
                                type="text"
                                placeholder="¿Qué estás buscando?"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    width: '100%',
                                    outline: 'none',
                                    fontSize: '14px'
                                }}
                            />
                        </div>

                        {/* Category Filters */}
                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '5px',
                            scrollbarWidth: 'none',
                            width: '100%'
                        }}>
                            {categories.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '20px',
                                        background: activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                        color: activeTab === tab ? 'var(--primary)' : 'white',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        border: '1px solid ' + (activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Área de Scroll */}
            <div style={{
                position: 'absolute',
                top: viewTab === 'marketplace' ? 'calc(env(safe-area-inset-top) + 352px)' : 'calc(env(safe-area-inset-top) + 232px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 20px 20px',
                transition: 'top 0.3s ease'
            }}>
                {viewTab === 'marketplace' ? (
                    <div style={{ paddingBottom: '20px' }}>
                        {/* Product Grid */}
                        {productsLoading ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="glass" style={{ padding: '10px', borderRadius: '24px' }}>
                                        <Skeleton height="160px" borderRadius="18px" style={{ marginBottom: '12px' }} />
                                        <Skeleton width="70%" height="15px" style={{ marginBottom: '8px', marginLeft: '8px' }} />
                                        <Skeleton width="40%" height="18px" style={{ marginBottom: '10px', marginLeft: '8px' }} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '15px'
                            }}>
                                {filteredProducts.map(product => (
                                    <Card
                                        key={product.id}
                                        onClick={() => setSelectedProduct(product)}
                                        style={{
                                            overflow: 'hidden',
                                            padding: '12px 0 16px 0',
                                            height: '100%',
                                            marginBottom: 0,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            width: '100%',
                                            marginBottom: '10px'
                                        }}>
                                            <div style={{ position: 'relative', width: '90%' }}>
                                                <img
                                                    src={optimizeImage(product.image_url, { width: 400, height: 400 })}
                                                    alt={product.name}
                                                    loading="lazy"
                                                    style={{
                                                        width: '100%',
                                                        aspectRatio: '1/1',
                                                        objectFit: 'cover',
                                                        borderRadius: '20px',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                                    }}
                                                />
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    background: 'rgba(0,0,0,0.4)',
                                                    backdropFilter: 'blur(10px)',
                                                    padding: '8px',
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    <ChevronRight size={16} color="white" />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            padding: '0 14px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            flex: 1,
                                            minHeight: '100px'
                                        }}>
                                            <h4 style={{
                                                fontSize: '18px',
                                                fontWeight: '800',
                                                marginBottom: '4px',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%',
                                                lineHeight: '1.2',
                                                color: 'white'
                                            }}>
                                                {product.name}
                                            </h4>

                                            <div style={{ marginBottom: '10px' }}>
                                                <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '15px' }}>
                                                    $ {new Intl.NumberFormat('es-CO').format(product.price)}
                                                </span>
                                            </div>

                                            <div style={{ marginTop: 'auto' }}>
                                                <p style={{
                                                    fontSize: '11px',
                                                    color: 'var(--text-dim)',
                                                    fontWeight: '600',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.02em'
                                                }}>
                                                    {product.category}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-fade" style={{ paddingBottom: '20px' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '15px' }}>Mis Compras</h2>
                        {ordersLoading ? (
                            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <Loader2 className="animate-spin" size={32} color="var(--secondary)" style={{ margin: '0 auto 15px' }} />
                                <p style={{ color: 'var(--text-dim)' }}>Cargando pedidos...</p>
                            </div>
                        ) : ordersError ? (
                            <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <AlertCircle size={40} color="#ef4444" style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p style={{ color: '#ef4444', fontWeight: '700' }}>Error al cargar pedidos</p>
                                <p style={{ color: 'var(--text-dim)', fontSize: '13px', marginTop: '5px' }}>{ordersError}</p>
                                <button onClick={() => user && fetchMyOrders(user.id)} style={{ color: 'var(--secondary)', marginTop: '15px', fontWeight: '700' }}>Reintentar</button>
                            </div>
                        ) : myOrders.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <ShoppingBag size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.2 }} />
                                <p style={{ color: 'var(--text-dim)' }}>Aún no has realizado compras.</p>
                                <button onClick={() => setViewTab('marketplace')} style={{ color: 'var(--secondary)', marginTop: '10px', fontWeight: '700' }}>Explorar Marketplace</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {myOrders.map((order: Order) => (
                                    <Card key={order.id} style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{
                                                background: (order.status === 'Pendiente' || order.status === 'Pagado') ? '#f59e0b' : '#10b981',
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: 'white'
                                            }}>
                                                {order.status?.toUpperCase() || 'PENDIENTE'}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{order.created_at ? new Date(order.created_at).toLocaleDateString() : '---'}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                            <img
                                                src={order.product?.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200'}
                                                style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }}
                                                alt=""
                                            />
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{order.product?.name || 'Pedido sin información'}</h4>
                                                <p style={{ color: 'var(--secondary)', fontWeight: '800' }}>$ {new Intl.NumberFormat('es-CO').format(order.total_amount || 0)}</p>
                                            </div>
                                        </div>

                                        {/* Tracking Timeline */}
                                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px', marginTop: '15px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '15px', textTransform: 'uppercase' }}>Seguimiento del pedido</p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                                        <div style={{ width: '1px', flex: 1, background: 'var(--secondary)', minHeight: '15px' }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '12px' }}>
                                                        <p style={{ fontWeight: '700' }}>Orden confirmada</p>
                                                        <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{order.created_at ? new Date(order.created_at).toLocaleString() : '---'}</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: (order.status === 'Preparando' || order.status === 'Enviado') ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                                        <div style={{ width: '1px', flex: 1, background: order.status === 'Enviado' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', minHeight: '15px' }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '12px' }}>
                                                        <p style={{ fontWeight: '700', color: (order.status === 'Preparando' || order.status === 'Enviado') ? 'white' : 'var(--text-dim)' }}>En preparación</p>
                                                        <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>El vendedor está alistando tu pedido</p>
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                                    <div style={{ width: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: order.status === 'Enviado' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)' }}></div>
                                                    </div>
                                                    <div style={{ fontSize: '12px' }}>
                                                        <p style={{ fontWeight: '700', color: order.status === 'Enviado' ? 'white' : 'var(--text-dim)' }}>Pedido enviado</p>
                                                        {order.tracking_number && <p style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '600', marginTop: '4px' }}>Guía: {order.shipping_provider} - {order.tracking_number}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            {/* Content based on viewTab */}


            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'var(--primary)',
                            zIndex: 3000,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* High Impact Image Section */}
                        <div style={{ position: 'relative', height: '40vh', width: '100%', overflow: 'hidden' }}>
                            <img src={selectedProduct.image_url || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: '100px',
                                background: 'linear-gradient(to bottom, rgba(0,0,0,0.4), transparent)',
                                zIndex: 1
                            }} />
                            <button
                                onClick={() => setSelectedProduct(null)}
                                style={{
                                    position: 'absolute',
                                    top: 'calc(var(--safe-top) + 15px)',
                                    left: '20px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    border: 'none',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    zIndex: 10,
                                    cursor: 'pointer',
                                    boxShadow: '0 8px 25px rgba(163, 230, 53, 0.4)'
                                }}
                            >
                                <ArrowLeft size={24} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Product Info Section - One Page Layout */}
                        <div style={{
                            flex: 1,
                            background: 'var(--primary)',
                            borderTopLeftRadius: '30px',
                            borderTopRightRadius: '30px',
                            marginTop: '-30px',
                            position: 'relative',
                            zIndex: 2,
                            padding: '25px',
                            display: 'flex',
                            flexDirection: 'column',
                            overflowY: 'auto',
                            paddingBottom: '100px'
                        }}>
                            <div style={{ marginBottom: '25px' }}>
                                <span style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    color: 'var(--secondary)',
                                    padding: '6px 14px',
                                    borderRadius: '30px',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {selectedProduct.category}
                                </span>
                                <h2 style={{ fontSize: '32px', fontWeight: '900', marginTop: '12px', lineHeight: '1.1', color: 'white' }}>
                                    {selectedProduct.name}
                                </h2>
                                <div style={{ marginTop: '12px' }}>
                                    <p style={{ fontSize: '24px', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>
                                        $ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Resumen</h4>
                                    {selectedProduct.is_negotiable && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--secondary)' }}>
                                            <span style={{ fontSize: '16px', fontWeight: '900' }}>🤝</span>
                                            <span style={{ fontSize: '11px', fontWeight: '800' }}>NEGOCIABLE</span>
                                        </div>
                                    )}
                                </div>
                                <p style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    lineHeight: '1.5',
                                    fontSize: '15px'
                                }}>
                                    {selectedProduct.description || 'Este producto premium está verificado y listo para ser enviado a tu campo de golf.'}
                                </p>
                            </div>

                            {/* Bottom Fixed Action Bar */}
                            <div style={{
                                marginTop: 'auto',
                                paddingTop: '20px',
                                paddingBottom: 'calc(var(--safe-bottom) + 15px)',
                                display: 'flex',
                                gap: '15px'
                            }}>
                                {selectedProduct.is_negotiable && selectedProduct.seller_id !== user?.id && (
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            if (!user) return navigate('/auth');
                                            setShowOfferModal(true);
                                            setOfferAmount(selectedProduct.price.toString());
                                            setOfferMessage('');
                                        }}
                                        style={{
                                            flex: 1,
                                            background: 'rgba(163, 230, 53, 0.05)',
                                            color: 'var(--secondary)',
                                            height: '50px',
                                            borderRadius: '16px',
                                            fontWeight: '700',
                                            fontSize: '11px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '6px',
                                            border: '1px solid rgba(163, 230, 53, 0.3)',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.02em'
                                        }}
                                    >
                                        <span style={{ fontSize: '16px' }}>🤝</span>
                                        OFERTAR
                                    </motion.button>
                                )}

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        setAddingToCart(selectedProduct.id);
                                        await addToCart(selectedProduct as any);
                                        setTimeout(() => setAddingToCart(null), 1500);
                                        if (navigator.vibrate) navigator.vibrate(50);
                                    }}
                                    disabled={selectedProduct.seller_id === user?.id}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        height: '50px',
                                        borderRadius: '16px',
                                        fontWeight: '700',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    {addingToCart === selectedProduct.id ? <CheckCircle2 size={16} color="var(--secondary)" /> : <Plus size={16} />}
                                    {addingToCart === selectedProduct.id ? 'VISTO' : 'CARRITO'}
                                </motion.button>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={async () => {
                                        if (!user) {
                                            navigate('/auth');
                                            return;
                                        }

                                        setBuying(true);
                                        try {
                                            // Add to cart and redirect to checkout
                                            await addToCart(selectedProduct as any);
                                            setSelectedProduct(null);
                                            navigate('/checkout');
                                        } catch (err) {
                                            console.error(err);
                                        } finally {
                                            setBuying(false);
                                        }
                                    }}
                                    disabled={buying || (selectedProduct?.seller_id === user?.id)}
                                    style={{
                                        flex: 1.5,
                                        background: (selectedProduct?.seller_id === user?.id) ? 'rgba(255,255,255,0.1)' : 'var(--secondary)',
                                        color: (selectedProduct?.seller_id === user?.id) ? 'var(--text-dim)' : 'var(--primary)',
                                        height: '50px',
                                        borderRadius: '16px',
                                        fontWeight: '800',
                                        fontSize: '11px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '6px',
                                        boxShadow: (selectedProduct?.seller_id === user?.id) ? 'none' : '0 4px 15px rgba(163, 230, 53, 0.2)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.02em'
                                    }}
                                >
                                    <ShoppingCart size={18} />
                                    {(selectedProduct?.seller_id === user?.id) ? 'MI PRODUCTO' : (buying ? '...' : 'COMPRAR YA')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Offer Modal */}
            <AnimatePresence>
                {showOfferModal && selectedProduct && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            background: 'rgba(0,0,0,0.85)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="glass"
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '30px',
                                textAlign: 'center'
                            }}
                        >
                            {!offerSuccess ? (
                                <>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        color: 'var(--secondary)'
                                    }}>
                                        <span style={{ fontSize: '32px' }}>🤝</span>
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>Hacer una Oferta</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '25px' }}>
                                        Ingresa el monto que deseas ofrecer por <strong>{selectedProduct.name}</strong>
                                    </p>

                                    <div style={{ position: 'relative', marginBottom: '15px' }}>
                                        <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: 'var(--secondary)' }}>$</span>
                                        <input
                                            type="number"
                                            value={offerAmount}
                                            onChange={(e) => setOfferAmount(e.target.value)}
                                            placeholder="Monto de la oferta"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '2px solid var(--secondary)',
                                                borderRadius: '15px',
                                                padding: '15px 15px 15px 35px',
                                                color: 'white',
                                                fontSize: '24px',
                                                fontWeight: '900',
                                                textAlign: 'center',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ marginBottom: '25px' }}>
                                        <textarea
                                            value={offerMessage}
                                            onChange={(e) => setOfferMessage(e.target.value)}
                                            placeholder="Escribe un mensaje al vendedor (opcional)"
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                padding: '12px',
                                                color: 'white',
                                                fontSize: '14px',
                                                minHeight: '80px',
                                                resize: 'none',
                                                outline: 'none'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <button
                                            onClick={() => setShowOfferModal(false)}
                                            style={{ flex: 1, padding: '15px', borderRadius: '15px', background: 'rgba(255,255,255,0.05)', fontWeight: '700', fontSize: '14px' }}
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            disabled={sendingOffer || !offerAmount}
                                            onClick={async () => {
                                                if (!user || !selectedProduct) {
                                                    alert('Debes iniciar sesión para enviar una oferta');
                                                    return;
                                                }
                                                setSendingOffer(true);
                                                try {
                                                    const { error } = await supabase
                                                        .from('offers')
                                                        .insert([{
                                                            product_id: selectedProduct.id,
                                                            buyer_id: user.id,
                                                            seller_id: selectedProduct.seller_id,
                                                            offer_amount: parseFloat(offerAmount),
                                                            message: offerMessage,
                                                            status: 'pending'
                                                        }]);

                                                    if (error) throw error;
                                                    setOfferSuccess(true);
                                                    setTimeout(() => {
                                                        setOfferSuccess(false);
                                                        setShowOfferModal(false);
                                                        setSelectedProduct(null);
                                                        setOfferAmount('');
                                                        setOfferMessage('');
                                                    }, 2000);
                                                } catch (err) {
                                                    console.error(err);
                                                    alert('Error al enviar la oferta');
                                                } finally {
                                                    setSendingOffer(false);
                                                }
                                            }}
                                            style={{
                                                flex: 2,
                                                padding: '15px',
                                                borderRadius: '15px',
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                fontWeight: '800',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            {sendingOffer ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                            {sendingOffer ? 'ENVIANDO...' : 'ENVIAR OFERTA'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="animate-fade">
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(163, 230, 53, 0.2)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        margin: '0 auto 20px',
                                        color: 'var(--secondary)'
                                    }}>
                                        <CheckCircle2 size={40} />
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '10px' }}>¡Oferta Enviada!</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                                        El vendedor ha sido notificado y te responderá pronto.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shop;
