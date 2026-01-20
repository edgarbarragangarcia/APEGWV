import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingBag, Trash2, ArrowLeft, Loader2,
    CreditCard, Package, ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';

const CartPage: React.FC = () => {
    const navigate = useNavigate();
    const { cartItems, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user || null);
        };
        checkUser();
    }, []);

    const handleCheckout = async () => {
        if (!user) {
            alert('Por favor, inicia sesión para realizar el pedido.');
            navigate('/auth');
            return;
        }

        if (cartItems.length === 0) return;

        setIsCheckingOut(true);
        try {
            // Group items by seller_id to create separate orders
            const ordersBySeller: Record<string, typeof cartItems> = {};
            cartItems.forEach(item => {
                const sellerId = item.seller_id || 'admin';
                if (!ordersBySeller[sellerId]) {
                    ordersBySeller[sellerId] = [];
                }
                ordersBySeller[sellerId].push(item);
            });

            // Create orders for each seller
            for (const [sellerId, items] of Object.entries(ordersBySeller)) {
                const sellerTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const commission = sellerTotal * 0.05;
                const net = sellerTotal - commission;

                // For now, following existing logic in Shop.tsx
                const { error: orderError } = await supabase.from('orders').insert([{
                    buyer_id: user.id,
                    seller_id: sellerId === 'admin' ? null : sellerId,
                    total_price: sellerTotal,
                    commission_fee: commission,
                    seller_net_amount: net,
                    status: 'Pendiente',
                    shipping_address: 'Calle 100 #15-30, Bogotá',
                    buyer_name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    buyer_phone: user.user_metadata?.phone || '310 123 4567'
                }]);

                if (orderError) throw orderError;

                // Add notification for seller
                if (sellerId !== 'admin') {
                    await supabase.from('notifications').insert([{
                        user_id: sellerId,
                        title: 'Nuevo Pedido!',
                        message: `Has recibido un nuevo pedido por $${new Intl.NumberFormat('es-CO').format(sellerTotal)}.`,
                        type: 'order_new',
                        link: `/shop?tab=mystore`
                    }]);
                }
            }

            alert('¡Gracias por tu compra! Tus pedidos han sido creados.');
            clearCart();
            navigate('/shop');
        } catch (err) {
            console.error('Checkout error:', err);
            alert('Hubo un error al procesar tu pedido. Por favor intenta de nuevo.');
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="animate-fade" style={{
            padding: '20px',
            paddingBottom: 'calc(var(--nav-height) + 40px)',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                marginBottom: '30px'
            }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Mi Carrito</h1>
            </header>

            {cartItems.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 20px',
                    textAlign: 'center',
                    opacity: 0.5
                }}>
                    <div style={{
                        width: '100px',
                        height: '100px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '20px'
                    }}>
                        <ShoppingBag size={48} strokeWidth={1} />
                    </div>
                    <p style={{ fontSize: '18px', fontWeight: '600' }}>El carrito está vacío</p>
                    <p style={{ fontSize: '14px', marginTop: '5px' }}>¿Qué tal si buscas algo nuevo?</p>
                    <button
                        onClick={() => navigate('/shop')}
                        style={{
                            marginTop: '25px',
                            color: 'var(--secondary)',
                            fontWeight: '700',
                            background: 'rgba(163, 230, 53, 0.1)',
                            padding: '12px 25px',
                            borderRadius: '12px',
                            border: '1px solid var(--secondary)'
                        }}
                    >
                        Ver Catálogo
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Items List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {cartItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <Card style={{ padding: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: '12px', overflow: 'hidden' }}>
                                            <img
                                                src={item.image_url}
                                                alt={item.name}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                        </div>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                            <div>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800', lineHeight: '1.2' }}>{item.name}</h4>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '4px' }}>{item.category}</p>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
                                                <p style={{ fontWeight: '900', color: 'var(--secondary)', fontSize: '16px' }}>
                                                    $ {new Intl.NumberFormat('es-CO').format(item.price)}
                                                </p>

                                                {/* Quantity Control */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '8px',
                                                    padding: '2px'
                                                }}>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'none',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            fontSize: '16px'
                                                        }}
                                                    >
                                                        -
                                                    </button>
                                                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '800', fontSize: '13px' }}>
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        style={{
                                                            border: 'none',
                                                            background: 'none',
                                                            color: 'white',
                                                            padding: '4px 8px',
                                                            fontSize: '16px'
                                                        }}
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            style={{
                                                border: 'none',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                color: '#ef4444',
                                                padding: '10px',
                                                borderRadius: '12px',
                                                alignSelf: 'flex-start'
                                            }}
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Summary Card */}
                    <Card style={{ padding: '25px', marginTop: '20px', background: 'rgba(255,255,255,0.02)' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px' }}>Resumen del canje</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span>Productos ({totalItems})</span>
                                <span style={{ color: 'white' }}>$ {new Intl.NumberFormat('es-CO').format(totalAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-dim)' }}>
                                <span>Gastos de envío</span>
                                <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>GRATIS</span>
                            </div>
                            <div style={{
                                height: '1px',
                                background: 'rgba(255,255,255,0.05)',
                                margin: '5px 0'
                            }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '19px', fontWeight: '900' }}>
                                <span>Total a pagar</span>
                                <span style={{ color: 'var(--secondary)' }}>$ {new Intl.NumberFormat('es-CO').format(totalAmount)}</span>
                            </div>
                        </div>

                        <div style={{
                            marginTop: '25px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <div className="glass" style={{ padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(163, 230, 53, 0.05)' }}>
                                <ShieldCheck size={20} color="var(--secondary)" />
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.3' }}>
                                    Tu pago está protegido por <strong>Garantía APEG</strong>. No liberamos fondos al vendedor hasta que recibas tu producto.
                                </p>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={isCheckingOut}
                                style={{
                                    width: '100%',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '18px',
                                    borderRadius: '18px',
                                    fontWeight: '900',
                                    fontSize: '16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    border: 'none',
                                    boxShadow: '0 8px 30px rgba(163, 230, 53, 0.3)',
                                    marginTop: '10px'
                                }}
                            >
                                {isCheckingOut ? (
                                    <Loader2 size={24} className="animate-spin" />
                                ) : (
                                    <>
                                        <CreditCard size={20} />
                                        FINALIZAR COMPRA
                                    </>
                                )}
                            </button>
                        </div>
                    </Card>

                    {/* Upsell or Policy area */}
                    <div style={{ padding: '20px 0', opacity: 0.6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <Package size={16} color="var(--secondary)" />
                            <span style={{ fontSize: '12px', fontWeight: '700' }}>POLÍTICA DE DEVOLUCIÓN</span>
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                            Aceptamos devoluciones en las primeras 48 horas tras la entrega si el producto no coincide con la descripción. El producto debe estar en el mismo estado en que se recibió.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage;
