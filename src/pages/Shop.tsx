import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Filter, Store, ShoppingBag,
    ArrowLeft, ShoppingCart, ChevronRight, Plus, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';
import { useCart } from '../context/CartContext';
import MyStore from './MyStore';

interface Product {
    id: string;
    name: string;
    price: number;
    category: string;
    description?: string;
    image_url: string;
    condition?: string;
    seller_id?: string;
    size_clothing?: string;
    size_shoes_col?: string;
}

const Shop: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [viewTab, setViewTab] = useState<'marketplace' | 'mystore' | 'myorders'>('marketplace');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [buying, setBuying] = useState(false);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);
    const { addToCart, totalItems } = useCart();
    const [addingToCart, setAddingToCart] = useState<string | null>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setUser(session.user);
                fetchMyOrders(session.user.id);
            }
        };
        checkUser();
    }, []);

    const fetchMyOrders = async (userId: string) => {
        const { data } = await supabase
            .from('orders')
            .select('*, product:products(*), seller:profiles(*)')
            .eq('buyer_id', userId)
            .order('created_at', { ascending: false });
        if (data) setMyOrders(data);
    };

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('status', 'active');

                if (error) throw error;

                const mappedProducts = (data || []).map(p => ({
                    ...p,
                    price: parseFloat(p.price)
                }));

                setProducts(mappedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
            }
        };

        fetchProducts();
    }, []);

    const categories = ['Todo', 'Palos', 'Bolas', 'Ropa', 'Accesorios', 'Zapatos', 'Otros'];

    const categoryMapping: Record<string, string> = {
        'Todo': 'Todo',
        'Palos': 'clubes',
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
        <div className="animate-fade" style={{
            paddingBottom: 'calc(var(--nav-height) + 20px)',
            width: '100%',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <header style={{
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <h1 style={{ fontSize: '28px' }}>Tienda</h1>
                    <p style={{ color: 'var(--text-dim)' }}>Equipamiento premium de la comunidad</p>
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
                            position: 'relative',
                            boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        <ShoppingCart size={20} />
                        <span style={{ fontWeight: '900', fontSize: '14px' }}>{totalItems}</span>
                    </motion.button>
                )}
            </header>

            {/* Tab Bar Container */}
            <div>
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '16px',
                    marginBottom: '20px'
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
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <ShoppingBag size={16} /> Market
                    </button>
                    <button
                        onClick={() => setViewTab('mystore')}
                        style={{
                            flex: 1,
                            padding: '10px',
                            borderRadius: '12px',
                            border: 'none',
                            background: viewTab === 'mystore' ? 'var(--secondary)' : 'transparent',
                            color: viewTab === 'mystore' ? 'var(--primary)' : 'var(--text-dim)',
                            fontWeight: '700',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <Store size={16} /> Mi Tienda
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
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        <ShoppingCart size={16} /> Pedidos
                    </button>
                </div>

                {viewTab === 'marketplace' ? (
                    <>
                        {/* Search Bar */}
                        <div className="glass" style={{
                            margin: '0 0 20px 0',
                            padding: '12px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px'
                        }}>
                            <Search size={20} color="var(--text-dim)" />
                            <input
                                type="text"
                                placeholder="Buscar palos, bolas, caddies..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    width: '100%',
                                    outline: 'none',
                                    fontSize: '15px'
                                }}
                            />
                            <Filter size={20} color="var(--secondary)" />
                        </div>

                        {/* Filter Tabs */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            marginBottom: '25px',
                            overflowX: 'auto',
                            paddingBottom: '10px',
                            scrollbarWidth: 'none',
                            width: '100%'
                        }}>
                            {categories.map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '30px',
                                        background: activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                        color: activeTab === tab ? 'var(--primary)' : 'white',
                                        fontSize: '14px',
                                        fontWeight: activeTab === tab ? '700' : '500',
                                        border: '1px solid ' + (activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {/* Product Grid */}
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
                                        padding: 0,
                                        height: '100%',
                                        marginBottom: 0,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            background: 'rgba(0,0,0,0.4)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '6px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <ChevronRight size={14} color="white" />
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '14px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flex: 1,
                                        minHeight: '100px'
                                    }}>
                                        <h4 style={{
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            marginBottom: '10px',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100%',
                                            lineHeight: '1.4',
                                            color: 'white'
                                        }}>
                                            {product.name}
                                        </h4>

                                        <div style={{ marginTop: 'auto' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '16px' }}>
                                                    $ {new Intl.NumberFormat('es-CO').format(product.price)}
                                                </span>
                                            </div>
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
                    </>
                ) : viewTab === 'mystore' ? (
                    <MyStore />
                ) : (
                    <div className="animate-fade">
                        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '20px' }}>Mis Compras</h2>
                        {myOrders.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <ShoppingBag size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.2 }} />
                                <p style={{ color: 'var(--text-dim)' }}>Aún no has realizado compras.</p>
                                <button onClick={() => setViewTab('marketplace')} style={{ color: 'var(--secondary)', marginTop: '10px', fontWeight: '700' }}>Explorar Marketplace</button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {myOrders.map((order: any) => (
                                    <Card key={order.id} style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                            <span style={{
                                                background: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                                                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '800', color: 'white'
                                            }}>
                                                {order.status.toUpperCase()}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                                            <img src={order.product?.image_url} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} alt="" />
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800' }}>{order.product?.name}</h4>
                                                <p style={{ color: 'var(--secondary)', fontWeight: '800' }}>$ {new Intl.NumberFormat('es-CO').format(order.total_price)}</p>
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
                                                        <p style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(order.created_at).toLocaleString()}</p>
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
                {/* Content based on viewTab */}
            </div>

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
                            <img src={selectedProduct.image_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
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
                                    background: 'rgba(255,255,255,0.1)',
                                    backdropFilter: 'blur(10px)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    width: '44px',
                                    height: '44px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    zIndex: 2
                                }}
                            >
                                <ArrowLeft size={22} />
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
                            gap: '20px',
                            boxShadow: '0 -20px 40px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ flex: 1 }}>
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
                                    <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '12px', lineHeight: '1.2' }}>{selectedProduct.name}</h2>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>Precio Final</span>
                                    <p style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary)', marginTop: '2px' }}>
                                        $ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}
                                    </p>
                                </div>
                            </div>

                            {/* Attributes Grid */}
                            <div style={{ display: 'flex', gap: '10px' }}>
                                {(selectedProduct.size_clothing || selectedProduct.size_shoes_col) && (
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                        <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Talla</p>
                                        <p style={{ fontWeight: '800', fontSize: '16px' }}>{selectedProduct.size_clothing || selectedProduct.size_shoes_col}</p>
                                    </div>
                                )}
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Estado</p>
                                    <p style={{ fontWeight: '800', fontSize: '16px', color: 'var(--secondary)' }}>Mint</p>
                                </div>
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '15px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                                    <p style={{ fontSize: '10px', color: 'var(--text-dim)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Entrega</p>
                                    <p style={{ fontWeight: '800', fontSize: '16px' }}>24h</p>
                                </div>
                            </div>

                            {/* Description */}
                            <div style={{ flex: 1 }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '8px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Resumen</h4>
                                <p style={{
                                    color: 'rgba(255,255,255,0.7)',
                                    lineHeight: '1.5',
                                    fontSize: '15px',
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
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
                                        height: '56px',
                                        borderRadius: '18px',
                                        fontWeight: '700',
                                        fontSize: '12px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                >
                                    {addingToCart === selectedProduct.id ? <CheckCircle2 size={18} color="var(--secondary)" /> : <Plus size={18} />}
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
                                        height: '56px',
                                        borderRadius: '18px',
                                        fontWeight: '800',
                                        fontSize: '13px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: (selectedProduct?.seller_id === user?.id) ? 'none' : '0 8px 25px rgba(163, 230, 53, 0.25)',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                >
                                    <ShoppingCart size={20} />
                                    {(selectedProduct?.seller_id === user?.id) ? 'MI PRODUCTO' : (buying ? '...' : 'COMPRAR YA')}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Shop;
