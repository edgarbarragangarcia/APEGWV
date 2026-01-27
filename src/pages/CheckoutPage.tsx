import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, CreditCard,
    ShieldCheck, Loader2, Camera, Scan,
    CheckCircle2, Sparkles, Plus, X, AlertCircle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/SupabaseManager';
import CardInput from '../components/CardInput';

interface PaymentMethod {
    id: string;
    card_holder: string;
    last_four: string;
    expiry: string;
    card_type: string;
    is_default: boolean | null;
}

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { cartItems, totalAmount, clearCart } = useCart();
    const [step, setStep] = useState<1 | 2>(1);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showScanner, setShowScanner] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Payment Methods State
    const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
    const [selectedMethodId, setSelectedMethodId] = useState<string | 'new'>('new');
    const [loadingMethods, setLoadingMethods] = useState(false);

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
                fetchSavedMethods(session.user.id);
            } else {
                navigate('/auth');
            }
        };
        checkUser();
    }, [navigate]);

    const fetchSavedMethods = async (userId: string) => {
        setLoadingMethods(true);
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('*')
                .eq('user_id', userId);

            if (error) throw error;
            setSavedMethods(data || []);

            const defaultMethod = data?.find(m => m.is_default);
            if (defaultMethod) {
                setSelectedMethodId(defaultMethod.id);
            } else if (data && data.length > 0) {
                setSelectedMethodId(data[0].id);
            }
        } catch (err) {
            console.error('Error fetching methods:', err);
        } finally {
            setLoadingMethods(false);
        }
    };

    const handlePlaceOrder = async () => {
        // Input validation
        if (!shipping.name || shipping.name.trim().length < 3) {
            setError('Por favor ingresa un nombre válido (mínimo 3 caracteres)');
            return;
        }
        if (!shipping.phone || !/^\d{7,10}$/.test(shipping.phone.replace(/\s/g, ''))) {
            setError('Por favor ingresa un número de teléfono válido (7-10 dígitos)');
            return;
        }
        if (!shipping.address || shipping.address.trim().length < 10) {
            setError('Por favor ingresa una dirección completa (mínimo 10 caracteres)');
            return;
        }

        setIsProcessing(true);
        setError(null);
        try {
            // Group items by seller
            const ordersBySeller: Record<string, typeof cartItems> = {};
            cartItems.forEach(item => {
                const sellerId = item.seller_id || 'admin';
                if (!ordersBySeller[sellerId]) ordersBySeller[sellerId] = [];
                ordersBySeller[sellerId].push(item);
            });

            // Create orders
            for (const item of cartItems) {
                const sellerId = item.seller_id || 'admin';
                const fullAddress = `${shipping.address}, ${shipping.city}`;

                const { error: orderError } = await supabase.from('orders').insert({
                    user_id: user.id,
                    buyer_id: user.id,
                    seller_id: sellerId === 'admin' ? null : sellerId,
                    product_id: item.id,
                    total_amount: item.price * item.quantity,
                    // commission_amount and seller_net_amount are calculated automatically by database trigger
                    status: 'Pagado',
                    shipping_address: fullAddress,
                    buyer_name: shipping.name,
                    buyer_phone: shipping.phone,
                    items: JSON.stringify([item])
                });

                if (orderError) throw orderError;

                // Update product status to sold/inactive
                await supabase
                    .from('products')
                    .update({
                        status: 'sold',
                        negotiating_buyer_id: null,
                        negotiation_expires_at: null
                    })
                    .eq('id', item.id);

                // Mark active offer as completed if exists
                await supabase
                    .from('offers')
                    .update({ status: 'completed' })
                    .eq('product_id', item.id)
                    .eq('buyer_id', user.id)
                    .in('status', ['accepted', 'countered']);

                // Notify seller
                if (sellerId !== 'admin') {
                    await supabase.from('notifications').insert([{
                        user_id: sellerId,
                        title: '¡Venta realizada!',
                        message: `Has vendido ${item.name} por $${new Intl.NumberFormat('es-CO').format(item.price * item.quantity)}. Prepáralo para el envío.`,
                        type: 'order_new',
                        link: '/my-store?tab=orders'
                    }]);
                }
            }

            // Notify buyer
            await supabase.from('notifications').insert([{
                user_id: user.id,
                title: '¡Compra exitosa!',
                message: `Tu pedido por $${new Intl.NumberFormat('es-CO').format(totalAmount)} ha sido confirmado.`,
                type: 'order_new',
                link: '/shop?tab=myorders'
            }]);

            setIsSuccess(true);
            setTimeout(() => {
                clearCart();
                navigate('/shop');
            }, 3000);

        } catch (err: any) {
            console.error('Order error:', err);
            if (err.code === '42501') {
                setError('Error de permisos en la base de datos. Por favor ejecuta el script SQL para habilitar la creación de pedidos.');
            } else {
                setError(err.message || 'Error al procesar el pedido. Por favor intenta de nuevo.');
            }
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex-center"
                style={{
                    height: '100dvh',
                    flexDirection: 'column',
                    padding: '30px',
                    textAlign: 'center',
                    background: 'radial-gradient(circle at center, #0e2f1f 0%, #05150d 100%)',
                    position: 'fixed',
                    inset: 0,
                    zIndex: 5000
                }}
            >
                {/* Floating Confetti-like Sparkles */}
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{
                            y: [0, -100, -200],
                            x: [0, (i % 2 === 0 ? 50 : -50), (i % 2 === 0 ? 100 : -100)],
                            opacity: [0, 1, 0],
                            scale: [0, 1, 0.5]
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: "easeOut"
                        }}
                        style={{
                            position: 'absolute',
                            color: 'var(--secondary)'
                        }}
                    >
                        <Sparkles size={24} />
                    </motion.div>
                ))}

                <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 12, stiffness: 200 }}
                    style={{
                        width: '120px',
                        height: '120px',
                        background: 'var(--secondary)',
                        borderRadius: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '40px',
                        boxShadow: '0 20px 50px rgba(163, 230, 53, 0.4)'
                    }}
                >
                    <CheckCircle2 size={70} color="var(--primary)" />
                </motion.div>

                <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ fontSize: '32px', fontWeight: '900', marginBottom: '15px', color: 'white' }}
                >
                    ¡GRACIAS POR TU COMPRA!
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ color: 'var(--text-dim)', marginBottom: '50px', maxWidth: '300px', lineHeight: '1.6' }}
                >
                    Tu pedido ha sido procesado con éxito. El vendedor ya recibió tu notificación y está preparando el envío.
                </motion.p>

                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: '15px', width: '100%', maxWidth: '280px' }}
                >
                    <button
                        onClick={() => {
                            clearCart();
                            navigate('/shop?tab=myorders');
                        }}
                        style={{
                            background: 'white',
                            color: 'black',
                            padding: '18px',
                            borderRadius: '16px',
                            fontWeight: '900',
                            border: 'none',
                            fontSize: '14px',
                            letterSpacing: '0.05em'
                        }}
                    >
                        VER MIS PEDIDOS
                    </button>

                    <button
                        onClick={() => {
                            clearCart();
                            navigate('/shop');
                        }}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            color: 'white',
                            padding: '18px',
                            borderRadius: '16px',
                            fontWeight: '700',
                            border: '1px solid rgba(255,b255,b255,0.1)',
                            fontSize: '14px'
                        }}
                    >
                        VOLVER AL MARKETPLACE
                    </button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="animate-fade" style={{
            padding: '20px',
            paddingBottom: '40px',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto'
        }}>
            {/* Error Message Overlay */}
            <AnimatePresence>
                {/* Replaced native alert with UI error */}
            </AnimatePresence>
            {isProcessing && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(0,0,0,0.8)',
                    zIndex: 9999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '15px'
                }}>
                    <Loader2 className="animate-spin" size={40} color="var(--secondary)" />
                    <span style={{ color: 'white', fontWeight: '700' }}>Procesando pedido...</span>
                </div>
            )}

            <PageHeader
                noMargin
                title="Finalizar Compra"
                onBack={() => step === 1 ? navigate(-1) : setStep(1)}
            />

            {/* Error Banner */}
            {/* Added explicit error display */}
            {/* Note: I will inject the error state definition and usage in the next step properly at the top of the component and here */}
            {/* For now, let's just make sure the state is defined. Wait, I should do this in a multi_replace to handle both state definition and render. */}

            {/* ABORTING single replace to switch to multi_replace for cleaner state insertion */}

            {/* Re-rendering original content to restart with multi_replace */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '30px' }}>
                <div style={{ flex: 1, height: '4px', background: 'var(--secondary)', borderRadius: '2px' }} />
                <div style={{ flex: 1, height: '4px', background: step === 2 ? 'var(--secondary)' : 'rgba(255,b255,b255,0.1)', borderRadius: '2px', transition: '0.3s' }} />
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
                            {selectedMethodId === 'new' && (
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
                            )}
                        </div>

                        {/* Saved Methods List */}
                        {!loadingMethods && savedMethods.length > 0 && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '25px' }}>
                                <p style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '5px' }}>Tus tarjetas guardadas</p>
                                {savedMethods.map((method) => (
                                    <div
                                        key={method.id}
                                        onClick={() => setSelectedMethodId(method.id)}
                                        style={{
                                            padding: '15px 20px',
                                            borderRadius: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            cursor: 'pointer',
                                            background: selectedMethodId === method.id ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)',
                                            border: selectedMethodId === method.id ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)',
                                            transition: '0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '40px',
                                            height: '28px',
                                            background: 'rgba(255,255,255,0.1)',
                                            borderRadius: '4px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '8px',
                                            fontWeight: '900'
                                        }}>
                                            {method.card_type.toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontWeight: '700', fontSize: '14px' }}>•••• {method.last_four}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Exp: {method.expiry}</p>
                                        </div>
                                        <div style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: '2px solid',
                                            borderColor: selectedMethodId === method.id ? 'var(--secondary)' : 'rgba(255,255,255,0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '3px'
                                        }}>
                                            {selectedMethodId === method.id && <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--secondary)' }} />}
                                        </div>
                                    </div>
                                ))}

                                <div
                                    onClick={() => setSelectedMethodId('new')}
                                    style={{
                                        padding: '15px 20px',
                                        borderRadius: '16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        cursor: 'pointer',
                                        background: selectedMethodId === 'new' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)',
                                        border: selectedMethodId === 'new' ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)',
                                        transition: '0.2s'
                                    }}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '28px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Plus size={16} />
                                    </div>
                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>Usar otra tarjeta</span>
                                </div>
                            </div>
                        )}

                        {selectedMethodId === 'new' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <CardInput onComplete={() => { }} />
                            </motion.div>
                        )}

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
            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '20px',
                            right: '20px',
                            zIndex: 10000,
                            background: '#ef4444',
                            color: 'white',
                            padding: '15px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 10px 30px rgba(239, 68, 68, 0.3)'
                        }}
                    >
                        <AlertCircle size={24} />
                        <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: '700', fontSize: '14px' }}>Error</p>
                            <p style={{ fontSize: '12px' }}>{error}</p>
                        </div>
                        <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white' }}>
                            <X size={20} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default CheckoutPage;
