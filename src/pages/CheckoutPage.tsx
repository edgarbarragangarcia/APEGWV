import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    MapPin, CreditCard,
    ShieldCheck, Loader2,
    CheckCircle2, Sparkles, Plus, X, AlertCircle, User, Phone, Edit3
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/SupabaseManager';
import CardInput from '../components/CardInput';
import PageHero from '../components/PageHero';

import { encrypt } from '../services/EncryptionService';

interface PaymentMethod {
    id: string;
    last_four: string;
    card_type: string;
    is_default: boolean | null;
    user_id: string | null;
    encrypted_number?: string;
    encrypted_cvv?: string;
    card_holder?: string;
    expiry?: string;
}

const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems, totalAmount: cartTotal, clearCart } = useCart();

    const reservationData = location.state?.reservation;
    const isReservation = !!reservationData;
    const totalAmount = isReservation ? reservationData.price : cartTotal;

    const [step, setStep] = useState<1 | 2>(isReservation ? 2 : 1);

    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [statusMessage, setStatusMessage] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });

    // Payment Methods State
    const [savedMethods, setSavedMethods] = useState<PaymentMethod[]>([]);
    // Initialize as null to indicate "not decided yet"
    const [selectedMethodId, setSelectedMethodId] = useState<string | 'new' | null>(null);
    const [newCard, setNewCard] = useState<any>(null);
    const [loadingMethods, setLoadingMethods] = useState(true);

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

                // Check for Mercado Pago return params
                const params = new URLSearchParams(location.search);
                const mpStatus = params.get('status');
                if (mpStatus === 'success') {
                    setIsSuccess(true);
                    clearCart();
                    // Optional: You could update order status here if not using Webhooks
                    // But usually Webhooks follow up. For simple test, we show success.
                } else if (mpStatus === 'failure') {
                    setStatusMessage({
                        title: 'Pago Fallido',
                        message: 'Hubo un error al procesar tu pago con Mercado Pago. Por favor intenta de nuevo.',
                        type: 'error'
                    });
                    setShowStatusModal(true);
                }

                // Fetch full profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profile) {
                    setShipping({
                        name: profile.full_name || '',
                        phone: profile.phone || '',
                        address: profile.address || '',
                        city: '' // City is now part of the address string or managed in profile
                    });
                } else {
                    // Fallback to metadata if profile fetch fails
                    setShipping(prev => ({
                        ...prev,
                        name: session.user.user_metadata?.full_name || '',
                        phone: session.user.user_metadata?.phone || ''
                    }));
                }
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
            const { data } = await supabase
                .from('payment_methods')
                .select('id, last_four, card_type, is_default, card_holder, expiry, user_id')
                .eq('user_id', userId);
            setSavedMethods(data || []);

            const defaultMethod = data?.find(m => m.is_default);
            if (defaultMethod) {
                setSelectedMethodId(defaultMethod.id);
            } else if (data && data.length > 0) {
                setSelectedMethodId(data[0].id);
            } else {
                setSelectedMethodId('new');
            }
        } catch (err) {
            console.error('Error fetching methods:', err);
            setSelectedMethodId('new');
        } finally {
            setLoadingMethods(false);
        }
    };

    const handlePlaceOrder = async () => {
        // Input validation - Only for actual orders, reservations use profile info or don't need shipping
        if (!isReservation) {
            if (!shipping.name || shipping.name.trim().length < 3) {
                setStatusMessage({ title: 'Datos de Envío', message: 'Por favor ingresa un nombre válido (mínimo 3 caracteres)', type: 'error' });
                setShowStatusModal(true);
                return;
            }
            if (!shipping.phone || !/^\d{7,10}$/.test(shipping.phone.replace(/\s/g, ''))) {
                setStatusMessage({ title: 'Datos de Envío', message: 'Por favor ingresa un número de teléfono válido (7-10 dígitos)', type: 'error' });
                setShowStatusModal(true);
                return;
            }
            if (!shipping.address || shipping.address.trim().length < 10) {
                setStatusMessage({ title: 'Datos de Envío', message: 'Por favor ingresa una dirección completa (mínimo 10 caracteres)', type: 'error' });
                setShowStatusModal(true);
                return;
            }
        }

        // Validate payment method selection
        if (!selectedMethodId) {
            setStatusMessage({ title: 'Atención', message: 'Por favor selecciona un método de pago', type: 'error' });
            setShowStatusModal(true);
            return;
        }

        if (selectedMethodId === 'new' && !newCard) {
            setStatusMessage({ title: 'Datos Incompletos', message: 'Por favor completa todos los campos de la tarjeta para continuar.', type: 'error' });
            setShowStatusModal(true);
            return;
        }

        setIsProcessing(true);
        try {
            // 1. Save New Payment Method if needed
            if (selectedMethodId === 'new' && newCard) {
                const lastFour = newCard.number.replace(/\s/g, '').slice(-4);
                const cardType = newCard.number.startsWith('4') ? 'Visa' :
                    newCard.number.startsWith('5') ? 'MasterCard' :
                        newCard.number.startsWith('3') ? 'Amex' : 'Card';

                // Encrypt sensitive data
                const encryptedNumber = await encrypt(newCard.number.replace(/\s/g, ''), user.id);
                const encryptedCVV = await encrypt(newCard.cvv, user.id);

                const { error: methodError } = await supabase
                    .from('payment_methods')
                    .insert({
                        user_id: user.id,
                        last_four: lastFour,
                        card_type: cardType,
                        card_holder: newCard.name,
                        expiry: newCard.expiry,
                        encrypted_number: encryptedNumber,
                        encrypted_cvv: encryptedCVV,
                        is_default: savedMethods.length === 0
                    } as any);

                if (methodError) {
                    console.error('Error saving payment method (full):', methodError);
                    // PGRST204 or 42703 (undefined_column) means columns are missing in DB
                    const isColumnError = methodError.code === 'PGRST204' || methodError.code === '42703' || methodError.message?.includes('column');

                    if (isColumnError) {
                        console.warn('Falling back to basic payment method save (no encryption columns)...');
                        // Try saving with card_holder & expiry (NOT NULL columns)
                        const { error: fallbackError } = await supabase
                            .from('payment_methods')
                            .insert({
                                user_id: user.id,
                                last_four: lastFour,
                                card_type: cardType,
                                card_holder: newCard.name || 'Sin nombre',
                                expiry: newCard.expiry || '00/00',
                                is_default: savedMethods.length === 0
                            } as any);

                        if (fallbackError) {
                            console.error('Fallback save also failed:', fallbackError);
                        }
                    } else {
                        throw methodError;
                    }
                }
            }

            // Handle Reservation Payment
            if (isReservation) {
                const { error } = await supabase.from('reservations').insert({
                    user_id: user.id,
                    course_id: reservationData.course.id,
                    time: reservationData.time,
                    status: 'confirmed',
                    players_count: reservationData.players_count,
                    price: reservationData.price,
                    reservation_date: reservationData.reservation_date
                } as any);

                if (error) throw error;

                setIsSuccess(true);
                setTimeout(() => {
                    navigate('/green-fee', { state: { tab: 'reservations' } });
                }, 3000);
                return;
            }

            // Group items by seller
            const ordersBySeller: Record<string, typeof cartItems> = {};
            cartItems.forEach(item => {
                const sellerId = item.seller_id || 'admin';
                if (!ordersBySeller[sellerId]) ordersBySeller[sellerId] = [];
                ordersBySeller[sellerId].push(item);
            });

            let firstOrderId = '';
            const allItemsForMp: any[] = [];

            // Create orders by seller
            for (const [sellerId, items] of Object.entries(ordersBySeller)) {
                const sellerTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

                // Address logic
                const fullAddress = shipping.city && !shipping.address.toLowerCase().includes(shipping.city.toLowerCase())
                    ? `${shipping.address}, ${shipping.city} `
                    : shipping.address;

                const { data: orderData, error: orderError } = await supabase.from('orders').insert({
                    user_id: user.id,
                    buyer_id: user.id,
                    seller_id: sellerId === 'admin' ? null : sellerId,
                    total_amount: sellerTotal,
                    status: 'Pendiente de Pago',
                    shipping_address: fullAddress,
                    buyer_name: shipping.name,
                    buyer_phone: shipping.phone,
                } as any).select().single();

                if (orderError) throw orderError;
                if (!orderData) throw new Error('Failed to create order');

                const newOrderId = (orderData as any).id;
                if (!firstOrderId) firstOrderId = newOrderId;

                // Create order items
                for (const item of items) {
                    const { error: itemError } = await supabase.from('order_items').insert({
                        order_id: newOrderId,
                        product_id: item.id,
                        quantity: item.quantity,
                        price_at_purchase: item.price
                    });
                    if (itemError) throw itemError;

                    allItemsForMp.push({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    });
                }
            }

            // 2. Call Mercado Pago Edge Function
            const { data: mpData, error: mpError } = await supabase.functions.invoke('mercadopago-preference', {
                body: {
                    items: allItemsForMp,
                    buyer_email: user.email,
                    order_id: firstOrderId
                }
            });

            if (mpError) throw mpError;
            if (mpData?.init_point) {
                // Redirect to Mercado Pago
                window.location.href = mpData.init_point;
            } else {
                throw new Error('No se pudo generar el link de pago');
            }

        } catch (err: any) {
            console.error('Order error:', err);

            let errorMessage = err.message || 'Error al procesar el pedido. Por favor intenta de nuevo.';

            // Try to extract more details from Supabase FunctionsHttpError
            try {
                if (err.context) {
                    const errorBody = await err.context.json();
                    console.error('Edge Function Error Details:', errorBody);

                    if (errorBody.error) errorMessage = `Error: ${errorBody.error}`;
                    if (errorBody.details) errorMessage += `\n\nDetalles: ${errorBody.details}`;
                    if (errorBody.raw) {
                        console.error('Mercado Pago Raw Response:', errorBody.raw);
                        errorMessage += `\n\nRespuesta de MP: ${JSON.stringify(errorBody.raw, null, 2)}`;
                    }
                }
            } catch (jsonErr) {
                console.warn('Could not parse error body:', jsonErr);
            }

            if (err.code === '42501') {
                setStatusMessage({ title: 'Permisos', message: 'Error de permisos en la base de datos. Por favor ejecuta el script SQL para habilitar la creación de pedidos.', type: 'error' });
            } else {
                setStatusMessage({ title: 'Error de Pago', message: errorMessage, type: 'error' });
            }
            setShowStatusModal(true);
        } finally {
            setIsProcessing(false);
        }

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
                    {isReservation ? '¡RESERVA CONFIRMADA!' : '¡GRACIAS POR TU COMPRA!'}
                </motion.h1>

                <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ color: 'var(--text-dim)', marginBottom: '50px', maxWidth: '300px', lineHeight: '1.6' }}
                >
                    {isReservation
                        ? 'Tu reserva ha sido procesada con éxito. Te hemos enviado un correo con los detalles.'
                        : 'Tu pedido ha sido procesado con éxito. El vendedor ya recibió tu notificación y está preparando el envío.'}
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
                            if (isReservation) {
                                navigate('/green-fee', { state: { tab: 'reservations' } });
                            } else {
                                navigate('/?tab=myorders');
                            }
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
                            navigate('/');
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
            overflow: 'hidden',
            background: 'var(--primary)',
            position: 'fixed',
            inset: 0
        }}>
            <PageHero />

            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'transparent',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    title={isReservation ? "Confirmar Reserva" : "Finalizar Compra"}
                    onBack={() => step === 1 ? navigate(-1) : isReservation ? navigate(-1) : setStep(1)}
                />
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 50px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                {/* Error Banner */}
                {/* Added explicit error display */}
                {/* Note: I will inject the error state definition and usage in the next step properly at the top of the component and here */}
                {/* For now, let's just make sure the state is defined. Wait, I should do this in a multi_replace to handle both state definition and render. */}

                {/* ABORTING single replace to switch to multi_replace for cleaner state insertion */}

                {/* Re-rendering original content to restart with multi_replace */}
                {!isReservation && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                        <div style={{ flex: 1, height: '4px', background: 'var(--secondary)', borderRadius: '2px' }} />
                        <div style={{ flex: 1, height: '4px', background: step === 2 ? 'var(--secondary)' : 'rgba(255,255,255,0.1)', borderRadius: '2px', transition: '0.3s' }} />
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {step === 1 ? (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MapPin size={20} color="var(--secondary)" /> Datos de Envío
                                </h3>
                                <button
                                    onClick={() => navigate('/profile/edit')}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'var(--secondary)',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}
                                >
                                    <Edit3 size={14} /> EDITAR
                                </button>
                            </div>

                            <div className="glass" style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {shipping.address ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <User size={20} color="var(--text-dim)" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', marginBottom: '2px' }}>NOMBRE</p>
                                                <p style={{ fontSize: '15px', color: 'white', fontWeight: '600' }}>{shipping.name}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <Phone size={20} color="var(--text-dim)" />
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', marginBottom: '2px' }}>TELÉFONO</p>
                                                <p style={{ fontSize: '15px', color: 'white', fontWeight: '600' }}>{shipping.phone}</p>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                <MapPin size={20} color="var(--text-dim)" />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', marginBottom: '2px' }}>DIRECCIÓN DE ENTREGA</p>
                                                <p style={{ fontSize: '15px', color: 'white', fontWeight: '600', lineHeight: '1.4' }}>{shipping.address}</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                        <AlertCircle size={32} color="var(--secondary)" style={{ marginBottom: '10px', opacity: 0.8 }} />
                                        <h4 style={{ fontWeight: '700', marginBottom: '5px' }}>Faltan datos de envío</h4>
                                        <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '20px' }}>Necesitamos tu dirección para poder entregarte el pedido.</p>
                                        <button
                                            onClick={() => navigate('/profile/edit')}
                                            className="btn-secondary"
                                            style={{ width: 'auto', display: 'inline-flex', padding: '10px 20px' }}
                                        >
                                            Completar mi Perfil
                                        </button>
                                    </div>
                                )}
                            </div>

                            {shipping.address && (
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
                                    CONFIRMAR Y CONTINUAR
                                </button>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <CreditCard size={20} color="var(--secondary)" /> Pago Seguro
                                </h3>

                            </div>

                            {/* Loading Skeleton */}
                            {loadingMethods && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    {[...Array(2)].map((_, i) => (
                                        <div key={i} className="animate-pulse" style={{
                                            height: '60px',
                                            background: 'rgba(255,255,255,0.05)',
                                            borderRadius: '16px'
                                        }} />
                                    ))}
                                </div>
                            )}

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
                                                background: 'white',
                                                borderRadius: '4px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                padding: '3px'
                                            }}>
                                                {method.card_type.toLowerCase() === 'visa' ? (
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : method.card_type.toLowerCase() === 'mastercard' ? (
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="MasterCard" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : method.card_type.toLowerCase() === 'amex' ? (
                                                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b3/American_Express_logo_%282018%29.svg" alt="Amex" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                                ) : (
                                                    <span style={{ fontSize: '7px', fontWeight: '900', color: 'var(--primary)' }}>{method.card_type.toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ fontWeight: '700', fontSize: '14px' }}>•••• {method.last_four}</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{method.card_type}</p>
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

                            {!loadingMethods && selectedMethodId === 'new' && (
                                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                                    <CardInput onComplete={(data) => setNewCard(data)} />
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



                <div style={{ padding: '30px 0', display: 'flex', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.4 }}>
                        <ShieldCheck size={16} />
                        <span style={{ fontSize: '11px', fontWeight: '700' }}>PAGO SEGURO CIFRADO</span>
                    </div>
                </div>
                {/* Standardized Status Modal */}
                <AnimatePresence>
                    {showStatusModal && (
                        <div
                            onClick={() => setShowStatusModal(false)}
                            style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
                        >
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                    background: 'rgba(20, 35, 20, 0.95)',
                                    borderRadius: '30px',
                                    padding: '40px 30px',
                                    textAlign: 'center',
                                    maxWidth: '85%',
                                    width: '320px',
                                    border: `1px solid ${statusMessage.type === 'success' ? 'rgba(163, 230, 53, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                    boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
                                }}
                            >
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    borderRadius: '50%',
                                    background: statusMessage.type === 'success' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    color: statusMessage.type === 'success' ? 'var(--secondary)' : '#ef4444'
                                }}>
                                    {statusMessage.type === 'success' ? <CheckCircle2 size={40} /> : <X size={40} />}
                                </div>
                                <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
                                    {statusMessage.title}
                                </h2>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4', marginBottom: '25px' }}>
                                    {statusMessage.message}
                                </p>
                                <button
                                    onClick={() => setShowStatusModal(false)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        background: statusMessage.type === 'success' ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                        color: statusMessage.type === 'success' ? 'var(--primary)' : 'white',
                                        border: 'none',
                                        fontWeight: '900',
                                        fontSize: '14px'
                                    }}
                                >
                                    ENTENDIDO
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
};

export default CheckoutPage;
