import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, MapPin, CreditCard,
    ShieldCheck, Loader2, Camera, Scan,
    CheckCircle2, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/SupabaseManager';
import CardInput from '../components/CardInput';

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { cartItems, totalAmount, clearCart } = useCart();
    const [step, setStep] = useState<1 | 2>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const [shipping, setShipping] = useState({
        name: '',
        phone: '',
        address: '',
        city: 'Bogotá'
    });

    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                setShipping(prev => ({
                    ...prev,
                    name: session.user.user_metadata?.full_name || '',
                    phone: session.user.user_metadata?.phone || ''
                }));
            } else {
                navigate('/auth');
            }
        };
        checkUser();
    }, [navigate]);

    const handlePlaceOrder = async () => {
        setIsProcessing(true);
        try {
            // Group items by seller
            const ordersBySeller: Record<string, typeof cartItems> = {};
            cartItems.forEach(item => {
                const sellerId = item.seller_id || 'admin';
                if (!ordersBySeller[sellerId]) ordersBySeller[sellerId] = [];
                ordersBySeller[sellerId].push(item);
            });

            // Create orders
            for (const [sellerId, items] of Object.entries(ordersBySeller)) {
                const sellerTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const commission = sellerTotal * 0.05;
                const net = sellerTotal - commission;

                const { error: orderError } = await supabase.from('orders').insert([{
                    buyer_id: user.id,
                    seller_id: sellerId === 'admin' ? null : sellerId,
                    total_price: sellerTotal,
                    commission_fee: commission,
                    seller_net_amount: net,
                    status: 'Pagado',
                    shipping_address: `${shipping.address}, ${shipping.city}`,
                    buyer_name: shipping.name,
                    buyer_phone: shipping.phone
                }]);

                if (orderError) throw orderError;

                // Notify seller
                if (sellerId !== 'admin') {
                    await supabase.from('notifications').insert([{
                        user_id: sellerId,
                        title: '¡Venta realizada!',
                        message: `Has vendido artículos por $${new Intl.NumberFormat('es-CO').format(sellerTotal)}. Prepáralos para el envío.`,
                        type: 'order_new',
                        link: `/shop?tab=mystore`
                    }]);
                }
            }

            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                navigate('/shop');
            }, 3000);

        } catch (err) {
            console.error('Order error:', err);
            alert('Error al procesar el pedido. Por favor intenta de nuevo.');
        } finally {
            setIsProcessing(false);
        }
    };

    const runScanAnimation = () => {
        setShowScanner(true);
        setTimeout(() => {
            setShowScanner(false);
        }, 3500);
    };

    if (isSuccess) {
        return (
            <div className="flex-center" style={{ height: '100dvh', flexDirection: 'column', padding: '30px', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 10 }}
                    style={{
                        width: '100px',
                        height: '100px',
                        background: 'var(--secondary)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '30px'
                    }}
                >
                    <CheckCircle2 size={60} color="var(--primary)" />
                </motion.div>
                <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '10px' }}>¡Pago Exitoso!</h1>
                <p style={{ color: 'var(--text-dim)', marginBottom: '40px' }}>Tu pedido ha sido procesado y el vendedor ha sido notificado.</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                    <Sparkles size={18} />
                    <span style={{ fontWeight: '700' }}>Prepárate para jugar</span>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{
            padding: '20px',
            paddingBottom: '40px',
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
                    onClick={() => step === 1 ? navigate(-1) : setStep(1)}
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
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Finalizar Compra</h1>
            </header>

            {/* Steps Progress */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--secondary)', borderRadius: '2px' }} />
                <div style={{ flex: 1, height: '4px', background: step === 2 ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: '0.3s' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {step === 1 ? (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <MapPin size={20} color="var(--secondary)" /> Datos de Envío
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)' }}>Nombre completo</p>
                                <input
                                    type="text"
                                    value={shipping.name}
                                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                                    placeholder="¿Quién recibe?"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)' }}>Teléfono</p>
                                <input
                                    type="tel"
                                    value={shipping.phone}
                                    onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                                    placeholder="Tu número de contacto"
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)' }}>Dirección</p>
                                <input
                                    type="text"
                                    value={shipping.address}
                                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                                    placeholder="Calle, carrera, apartamento..."
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)' }}>Ciudad</p>
                                <select
                                    value={shipping.city}
                                    onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '15px', color: 'white' }}
                                >
                                    <option value="Bogotá">Bogotá</option>
                                    <option value="Medellín">Medellín</option>
                                    <option value="Cali">Cali</option>
                                    <option value="Barranquilla">Barranquilla</option>
                                </select>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            disabled={!shipping.address || !shipping.name}
                            style={{
                                width: '100%',
                                background: 'white',
                                color: 'black',
                                padding: '18px',
                                borderRadius: '16px',
                                fontWeight: '900',
                                marginTop: '30px',
                                border: 'none',
                                opacity: (!shipping.address || !shipping.name) ? 0.5 : 1
                            }}
                        >
                            CONTINUAR AL PAGO
                        </button>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <CreditCard size={20} color="var(--secondary)" /> Pago Seguro
                            </h3>
                            <button
                                onClick={runScanAnimation}
                                style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    border: '1px solid var(--secondary)',
                                    color: 'var(--secondary)',
                                    padding: '8px 12px',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Camera size={14} /> ESCANEAR
                            </button>
                        </div>

                        <CardInput onComplete={() => { }} />

                        <div style={{ marginTop: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ color: 'var(--text-dim)' }}>Subtotal</span>
                                <span>$ {new Intl.NumberFormat('es-CO').format(totalAmount)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '20px', fontWeight: '900' }}>
                                <span>Total</span>
                                <span style={{ color: 'var(--secondary)' }}>$ {new Intl.NumberFormat('es-CO').format(totalAmount)}</span>
                            </div>

                            <button
                                onClick={handlePlaceOrder}
                                disabled={isProcessing}
                                style={{
                                    width: '100%',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '20px',
                                    borderRadius: '18px',
                                    fontWeight: '900',
                                    fontSize: '16px',
                                    border: 'none',
                                    boxShadow: '0 8px 30px rgba(163, 230, 53, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px'
                                }}
                            >
                                {isProcessing ? (
                                    <Loader2 className="animate-spin" size={24} />
                                ) : (
                                    <>PAGAR AHORA</>
                                )}
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Card Scanner Overlay Simulation */}
            <AnimatePresence>
                {showScanner && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'black',
                            zIndex: 1000,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <div style={{
                            width: '80%',
                            aspectRatio: '1.6',
                            border: '2px solid var(--secondary)',
                            borderRadius: '20px',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: '0 0 50px rgba(163, 230, 53, 0.5)'
                        }}>
                            <motion.div
                                animate={{ top: ['0%', '100%', '0%'] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'var(--secondary)',
                                    boxShadow: '0 0 15px var(--secondary)'
                                }}
                            />
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(rgba(0,0,0,0), rgba(163, 230, 53, 0.1))' }} />
                        </div>
                        <p style={{ marginTop: '30px', fontWeight: '700', color: 'var(--secondary)', letterSpacing: '2px' }}>ESCANEANDO TARJETA...</p>
                        <Scan size={32} color="var(--secondary)" className="animate-pulse" style={{ marginTop: '20px' }} />
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ padding: '30px 0', display: 'flex', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                    <ShieldCheck size={16} />
                    <span style={{ fontSize: '11px', fontWeight: '700' }}>PAGO SEGURO CIFRADO</span>
                </div>
            </div>
        </div>
    );
};

export default CheckoutPage;
