import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CreditCard, Plus,
    Trash2, ShieldCheck, Camera,
    CheckCircle2, Loader2, Star
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';
import CardInput from '../components/CardInput';
import PageHero from '../components/PageHero';
import { encrypt } from '../services/EncryptionService';



interface PaymentMethod {
    id: string;
    card_holder: string;
    last_four: string;
    expiry: string;
    card_type: string;
    is_default: boolean | null;
    encrypted_number?: string;
    encrypted_cvv?: string;
}

const PaymentMethodsPage: React.FC = () => {
    const navigate = useNavigate();
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [scannedCard, setScannedCard] = useState<any>(null);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                fetchMethods(session.user.id);
            } else {
                navigate('/auth');
            }
        };
        checkUser();
    }, [navigate]);

    const fetchMethods = async (userId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('payment_methods')
                .select('id, last_four, card_type, is_default, card_holder, expiry')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setMethods((data as unknown as PaymentMethod[]) || []);
        } catch (err) {
            console.error('Error fetching payment methods:', err);
        } finally {
            setLoading(false);
        }
    };

    // Handlers
    const handleScan = async () => {
        console.log("Attempting to start OCR scan...");
        if (window.iOSNative && window.iOSNative.startOCR) {
            try {
                console.log("Calling window.iOSNative.startOCR()");
                const data = await window.iOSNative.startOCR();
                console.log("Scanned data received:", data);
                if (data) {
                    setScannedCard({
                        number: data.number || '',
                        expiry: data.expiry || '',
                        name: data.name || ''
                    });
                    if (navigator.vibrate) navigator.vibrate(50);
                } else {
                    console.warn("OCR returned no data");
                }
            } catch (err) {
                console.error("OCR Error in Web:", err);
                alert("Error al escanear: " + err);
            }
        } else {
            console.error("window.iOSNative.startOCR is not available");
            alert("El escáner solo está disponible en la app nativa (iOS 16+). Si estás en la app, por favor reporta este error.");
        }
    };

    const handleAddCard = async (cardData: any) => {
        setIsSaving(true);
        try {
            const lastFour = cardData.number.replace(/\s/g, '').slice(-4);
            const getCardType = (num: string) => {
                if (num.startsWith('4')) return 'Visa';
                if (num.startsWith('5')) return 'MasterCard';
                if (num.startsWith('3')) return 'Amex';
                return 'Card';
            };
            const cardType = getCardType(cardData.number);

            // Encrypt sensitive data
            const encryptedNumber = await encrypt(cardData.number.replace(/\s/g, ''), user.id);
            const encryptedCVV = await encrypt(cardData.cvv, user.id);

            const { data, error } = await supabase
                .from('payment_methods')
                .insert([{
                    user_id: user.id,
                    last_four: lastFour,
                    card_type: cardType,
                    card_holder: cardData.name,
                    expiry: cardData.expiry,
                    encrypted_number: encryptedNumber,
                    encrypted_cvv: encryptedCVV,
                    is_default: methods.length === 0 // First card is default
                }] as any)
                .select()
                .single();

            if (error) throw error;

            setMethods([data as unknown as PaymentMethod, ...methods]);
            setShowAddForm(false);
            setScannedCard(null); // Reset scanned data
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err: any) {
            console.error('Error saving card:', err);
            const isColumnError = err.code === 'PGRST204' || err.code === '42703' || err.message?.includes('column');

            if (isColumnError) {
                try {
                    console.warn('Falling back to basic card save...');
                    const lastFour = cardData.number.replace(/\s/g, '').slice(-4);
                    const getCardType = (num: string) => {
                        if (num.startsWith('4')) return 'Visa';
                        if (num.startsWith('5')) return 'MasterCard';
                        if (num.startsWith('3')) return 'Amex';
                        return 'Card';
                    };

                    const { data, error } = await supabase
                        .from('payment_methods')
                        .insert([{
                            user_id: user.id,
                            last_four: lastFour,
                            card_type: getCardType(cardData.number),
                            card_holder: cardData.name || 'Sin nombre',
                            expiry: cardData.expiry || '00/00',
                            is_default: methods.length === 0
                        }] as any)
                        .select()
                        .single();

                    if (!error && data) {
                        setMethods([data as unknown as PaymentMethod, ...methods]);
                        setShowAddForm(false);
                        setScannedCard(null);
                        alert('Tarjeta guardada (sin cifrado debido a que la DB no está actualizada).');
                        return;
                    }
                } catch (fallbackErr) {
                    console.error('Fallback save failed:', fallbackErr);
                }
                alert('La base de datos no está actualizada. Por favor ejecuta el script SQL en Supabase para habilitar el guardado de tarjetas cifradas.');
            } else {
                alert('Error al guardar la tarjeta: ' + (err.message || 'Error desconocido'));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from('payment_methods')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setMethods(methods.filter(m => m.id !== id));
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error deleting method:', err);
        }
    };

    const setDefault = async (id: string) => {
        try {
            // Unset current default
            await supabase
                .from('payment_methods')
                .update({ is_default: false })
                .eq('user_id', user.id);

            // Set new default
            const { error } = await supabase
                .from('payment_methods')
                .update({ is_default: true })
                .eq('id', id);

            if (error) throw error;
            setMethods(methods.map(m => ({ ...m, is_default: m.id === id })));
        } catch (err) {
            console.error('Error setting default:', err);
        }
    };

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)',
            position: 'fixed',
            inset: 0
        }}>
            <PageHero image="https://images.unsplash.com/photo-1596733430284-f7437764b1a9?q=80&w=2070&auto=format&fit=crop" />

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
                    title="Métodos de Pago"
                    onBack={() => showAddForm ? setShowAddForm(false) : navigate(-1)}
                />
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                {!showAddForm ? (
                    <>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                            {loading ? (
                                <div className="flex-center" style={{ padding: '40px' }}>
                                    <Loader2 className="animate-spin" color="var(--secondary)" />
                                </div>
                            ) : methods.length === 0 ? (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '60px 20px',
                                    opacity: 0.5
                                }}>
                                    <CreditCard size={48} strokeWidth={1} style={{ marginBottom: '15px' }} />
                                    <p>No tienes tarjetas guardadas</p>
                                </div>
                            ) : (
                                methods.map((method) => (
                                    <Card key={method.id} style={{ padding: '20px', border: !!method.is_default ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                            <div style={{
                                                width: '50px',
                                                height: '35px',
                                                background: 'rgba(255,255,255,0.05)',
                                                borderRadius: '6px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                color: 'var(--secondary)'
                                            }}>
                                                {method.card_type.toUpperCase()}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <p style={{ fontWeight: '700' }}>•••• {method.last_four}</p>
                                                    {!!method.is_default && (
                                                        <span style={{ fontSize: '9px', background: 'var(--secondary)', color: 'var(--primary)', padding: '2px 6px', borderRadius: '4px', fontWeight: '900' }}>PREDETERMINADA</span>
                                                    )}
                                                </div>
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Expira: {method.expiry}</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                {!method.is_default && (
                                                    <button
                                                        onClick={() => setDefault(method.id)}
                                                        style={{ border: 'none', background: 'none', color: 'var(--text-dim)', padding: '5px' }}
                                                    >
                                                        <Star size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(method.id)}
                                                    style={{ border: 'none', background: 'none', color: '#ff6b6b', padding: '5px' }}
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>

                        <button
                            onClick={() => setShowAddForm(true)}
                            style={{
                                width: '100%',
                                background: 'white',
                                color: 'black',
                                padding: '18px',
                                borderRadius: '16px',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                border: 'none',
                                boxShadow: '0 8px 25px rgba(255,255,255,0.1)'
                            }}
                        >
                            <Plus size={20} />
                            AÑADIR NUEVA TARJETA
                        </button>
                    </>
                ) : (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800' }}>Nueva Tarjeta</h3>
                            <button
                                onClick={handleScan}
                                style={{
                                    color: 'var(--secondary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '12px',
                                    fontWeight: '700',
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                    padding: '6px 12px',
                                    borderRadius: '8px'
                                }}
                            >
                                <Camera size={16} /> ESCANEAR TARJETA
                            </button>
                        </div>

                        <CardInput onComplete={handleAddCard} data={scannedCard} />

                        <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.5 }}>
                                <ShieldCheck size={18} color="var(--secondary)" />
                                <p style={{ fontSize: '12px' }}>Tus datos se guardan de forma segura y cifrada.</p>
                            </div>

                            {isSaving && (
                                <div className="flex-center" style={{ gap: '10px', color: 'var(--secondary)' }}>
                                    <Loader2 className="animate-spin" size={20} />
                                    <span style={{ fontWeight: '700' }}>Guardando herramienta de pago...</span>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                <div style={{ padding: '40px 0', textAlign: 'center', opacity: 0.3 }}>
                    <CheckCircle2 size={32} style={{ margin: '0 auto 10px' }} />
                    <p style={{ fontSize: '11px', fontWeight: '700' }}>APEG SECURE PLATFORM</p>
                </div>
            </div>
        </div>
    );
};

export default PaymentMethodsPage;
