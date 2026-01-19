import React, { useEffect, useState } from 'react';
import {
    Search, Filter, Loader2, Store, ShoppingBag,
    ArrowLeft, ShoppingCart, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';
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
    const [activeTab, setActiveTab] = useState('Todo');
    const [searchQuery, setSearchQuery] = useState('');
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewTab, setViewTab] = useState<'marketplace' | 'mystore' | 'myorders'>('marketplace');
    const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
    const [buying, setBuying] = useState(false);
    const [myOrders, setMyOrders] = useState<any[]>([]);
    const [user, setUser] = useState<any>(null);

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
                    .select('*');

                if (error) throw error;

                const mappedProducts = (data || []).map(p => ({
                    ...p,
                    price: parseFloat(p.price)
                }));

                setProducts(mappedProducts);
            } catch (err) {
                console.error('Error fetching products:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const categories = ['Todo', 'Clubes', 'Bolas', 'Ropa', 'Accesorios', 'Zapatos', 'Otros'];

    const filteredProducts = products.filter(product => {
        const normalize = (val: string) => val.toLowerCase().trim();
        const activeTabNorm = normalize(activeTab);
        const prodCategoryNorm = normalize(product.category || '');

        const matchesCategory = activeTab === 'Todo' ||
            prodCategoryNorm === activeTabNorm ||
            (activeTab === 'Palos' && prodCategoryNorm === 'clubes') ||
            (activeTab === 'Balls' && prodCategoryNorm === 'bolas') ||
            (activeTab === 'Clothing' && prodCategoryNorm === 'ropa') ||
            (activeTab === 'Accessories' && prodCategoryNorm === 'accesorios');

        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            prodCategoryNorm.includes(searchQuery.toLowerCase());

        return matchesCategory && matchesSearch;
    });

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={{ paddingBottom: '100px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px' }}>Tienda</h1>
                <p style={{ color: 'var(--text-dim)' }}>Equipamiento premium de la comunidad</p>
            </header>

            {/* Tab Bar */}
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
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '20px'
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
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        {filteredProducts.map(product => (
                            <motion.div
                                key={product.id}
                                whileTap={{ scale: 0.96 }}
                                onClick={() => setSelectedProduct(product)}
                            >
                                <Card style={{ overflow: 'hidden', padding: 0, height: '100%', cursor: 'pointer' }}>
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{ width: '100%', height: '160px', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '50%' }}>
                                            <ChevronRight size={14} color="white" />
                                        </div>
                                    </div>
                                    <div style={{ padding: '12px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '750', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {product.name}
                                        </h4>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                                            <span style={{ color: 'var(--secondary)', fontWeight: '800', fontSize: '15px' }}>
                                                $ {new Intl.NumberFormat('es-CO').format(product.price)}
                                            </span>
                                        </div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>{product.category}</p>
                                    </div>
                                </Card>
                            </motion.div>
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
                            {myOrders.map(order => (
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

            {/* Product Detail Modal */}
            <AnimatePresence>
                {selectedProduct && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'var(--primary)',
                            zIndex: 2000,
                            overflowY: 'auto',
                            paddingBottom: '40px'
                        }}
                    >
                        <div style={{ position: 'relative' }}>
                            <img src={selectedProduct.image_url} style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover' }} alt="" />
                            <button
                                onClick={() => setSelectedProduct(null)}
                                style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(0,0,0,0.5)', border: 'none', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '25px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <span style={{ background: 'rgba(163, 230, 53, 0.1)', color: 'var(--secondary)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '800' }}>{selectedProduct.category}</span>
                                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '10px' }}>{selectedProduct.name}</h2>
                                </div>
                                <p style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary)' }}>$ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}</p>
                            </div>

                            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '20px' }}>
                                {selectedProduct.size_clothing && (
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Talla</p>
                                        <p style={{ fontWeight: '800' }}>{selectedProduct.size_clothing}</p>
                                    </div>
                                )}
                                {selectedProduct.size_shoes_col && (
                                    <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Talla COL</p>
                                        <p style={{ fontWeight: '800' }}>{selectedProduct.size_shoes_col}</p>
                                    </div>
                                )}
                                <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: '12px', borderRadius: '15px', textAlign: 'center' }}>
                                    <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>Estado</p>
                                    <p style={{ fontWeight: '800', color: 'var(--secondary)' }}>Excelente</p>
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <h4 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '10px' }}>Descripción</h4>
                                <p style={{ color: 'var(--text-dim)', lineHeight: '1.6', fontSize: '15px' }}>{selectedProduct.description || 'Sin descripción detallada disponible.'}</p>
                            </div>

                            <div className="glass" style={{ padding: '20px', marginBottom: '30px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Precio del producto</span>
                                    <span>$ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px' }}>
                                    <span style={{ color: 'var(--text-dim)' }}>Envío</span>
                                    <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>Garantizado por APEG</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '18px', fontWeight: '900' }}>
                                    <span>Total</span>
                                    <span style={{ color: 'var(--secondary)' }}>$ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}</span>
                                </div>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!user) return alert('Debes iniciar sesión para comprar');
                                    setBuying(true);
                                    try {
                                        const commission = selectedProduct.price * 0.05;
                                        const net = selectedProduct.price - commission;

                                        const { error } = await supabase.from('orders').insert([{
                                            product_id: selectedProduct.id,
                                            buyer_id: user.id,
                                            seller_id: selectedProduct.seller_id,
                                            total_price: selectedProduct.price,
                                            commission_fee: commission,
                                            seller_net_amount: net,
                                            status: 'Pendiente',
                                            shipping_address: 'Calle 100 #15-30, Bogotá', // Demo address
                                            buyer_name: user.email?.split('@')[0],
                                            buyer_phone: '310 123 4567'
                                        }]);

                                        if (error) throw error;

                                        alert('¡Compra realizada con éxito! Revisa la pestaña de Pedidos.');
                                        setSelectedProduct(null);
                                        setViewTab('myorders');
                                        fetchMyOrders(user.id);
                                    } catch (err) {
                                        console.error(err);
                                        alert('Error al procesar la compra');
                                    } finally {
                                        setBuying(false);
                                    }
                                }}
                                disabled={buying || selectedProduct.seller_id === user?.id}
                                style={{
                                    width: '100%',
                                    background: selectedProduct.seller_id === user?.id ? 'rgba(255,255,255,0.1)' : 'var(--secondary)',
                                    color: selectedProduct.seller_id === user?.id ? 'var(--text-dim)' : 'var(--primary)',
                                    padding: '18px',
                                    borderRadius: '18px',
                                    fontWeight: '900',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px'
                                }}
                            >
                                {buying ? <Loader2 size={24} className="animate-spin" /> : <ShoppingCart size={24} />}
                                {selectedProduct.seller_id === user?.id ? 'AÚN ES TU PRODUCTO' : (buying ? 'PROCESANDO...' : 'COMPRAR AHORA')}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Shop;
