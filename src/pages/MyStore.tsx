import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import {
    Plus, Package, Trash2,
    Camera, Loader2, CheckCircle2,
    Pencil, TrendingDown,
    Truck, User, Phone, MapPin,
    Settings, Landmark, Calendar,
    Store, Info, Handshake, X
} from 'lucide-react';
import Card from '../components/Card';
import StoreOnboarding from '../components/StoreOnboarding';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import type { Database } from '../types/database.types';

type SellerProfile = Database['public']['Tables']['seller_profiles']['Row'];
type Product = Database['public']['Tables']['products']['Row'];
type Order = Pick<Database['public']['Tables']['orders']['Row'], 'id' | 'created_at' | 'status' | 'total_amount' | 'seller_net_amount' | 'shipping_address' | 'tracking_number' | 'shipping_provider' | 'buyer_name' | 'buyer_phone'> & {
    product: { name: string; image_url: string | null } | null;
    buyer: { full_name: string | null; id_photo_url: string | null; phone: string | null } | null;
};
type Offer = Pick<Database['public']['Tables']['offers']['Row'], 'id' | 'created_at' | 'status' | 'offer_amount' | 'message' | 'buyer_id' | 'counter_amount' | 'counter_message'> & {
    product: { id: string; name: string; image_url: string | null; price: number } | null;
    buyer: { full_name: string | null } | null;
};


const MyStore: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
        isOpen: false,
        productId: null,
        productName: ''
    });
    const [orders, setOrders] = useState<Order[]>([]);
    const [offers, setOffers] = useState<Offer[]>([]);
    const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'offers' | 'profile'>('products');
    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [profileFormData, setProfileFormData] = useState<any>(null);
    const [updatingOffer, setUpdatingOffer] = useState<string | null>(null);
    const [showCounterModal, setShowCounterModal] = useState(false);
    const [selectedOfferForCounter, setSelectedOfferForCounter] = useState<Offer | null>(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [counterMessage, setCounterMessage] = useState('');


    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '', // Numeric string without formatting
        displayPrice: '', // String with thousand separators for UI
        category: 'Accesorios',
        image_url: '',
        size_clothing: '',
        clothing_type: 'Camiseta',
        size_shoes_us: '',
        size_shoes_eu: '',
        size_shoes_col: '',
        size_shoes_cm: '',
        is_negotiable: false
    });

    const convertShoeSizes = (colVal: string) => {
        const col = parseFloat(colVal);
        if (isNaN(col)) return { us: '', eu: '', cm: '' };

        // Accurate conversion based on Colombian standard for Golf/Sports
        return {
            us: (col - 31).toString(),
            eu: (col + 2).toString(),
            cm: (col - 13).toString()
        };
    };

    const formatPrice = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            price: numeric,
            displayPrice: formatPrice(numeric)
        }));
    };

    const categories = ['Ropa', 'Accesorios', 'Bolas', 'Zapatos', 'Grips', 'Otros'];

    const fetchOrders = async (userId: string) => {
        console.log('Fetching orders for seller:', userId);
        try {
            const { data: userOrders, error } = await supabase
                .from('orders')
                .select('id, created_at, status, total_amount, seller_net_amount, shipping_address, tracking_number, shipping_provider, buyer_name, buyer_phone, product:products!orders_product_id_fkey(name, image_url), buyer:profiles!orders_buyer_id_fkey(full_name, id_photo_url, phone)')
                .eq('seller_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching orders:', error);
                return;
            }

            if (userOrders && userOrders.length > 0) {
                // Normalize relations if they return as arrays
                const mappedOrders: Order[] = userOrders.map((o: any) => ({
                    ...o,
                    product: Array.isArray(o.product) ? o.product[0] : o.product,
                    buyer: Array.isArray(o.buyer) ? o.buyer[0] : o.buyer
                }));
                setOrders(mappedOrders);
            } else {
                setOrders([]);
            }
        } catch (err) {
            console.error('Unexpected error in fetchOrders:', err);
        }
    };

    const fetchOffers = async (userId: string) => {
        try {
            const { data: userOffers, error: offersError } = await supabase
                .from('offers')
                .select('id, created_at, status, offer_amount, message, buyer_id, counter_amount, counter_message, product:products(id, name, image_url, price)')

                .eq('seller_id', userId)
                .order('created_at', { ascending: false });

            if (offersError) {
                console.error('Error fetching offers:', offersError);
                return;
            }

            if (userOffers && userOffers.length > 0) {
                const buyerIds = [...new Set(userOffers.map((o: any) => o.buyer_id))];
                const { data: buyers } = await supabase
                    .from('profiles')
                    .select('id, full_name')
                    .in('id', buyerIds);

                const buyersMap = new Map(buyers?.map(b => [b.id, b]) || []);

                const enrichedOffers: Offer[] = userOffers.map((offer: any) => ({
                    ...offer,
                    product: Array.isArray(offer.product) ? offer.product[0] : offer.product,
                    buyer: buyersMap.get(offer.buyer_id) || null
                }));

                setOffers(enrichedOffers);
            } else {
                setOffers([]);
            }
        } catch (err) {
            console.error('Error in fetchOffers:', err);
        }
    };

    const fetchStoreData = async () => {
        if (!user) return;

        try {
            // Fetch Seller Profile
            const { data: profile } = await supabase
                .from('seller_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            setSellerProfile(profile);
            if (profile) {
                setProfileFormData({ ...profile });

                // Fetch User Products
                const { data: userProducts, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProducts((userProducts as Product[]) || []);

                // Fetch Orders and Offers initial data
                fetchOrders(user.id);
                fetchOffers(user.id);
            }
        } catch (err) {
            console.error('Error fetching store data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchStoreData();

            // Setup Realtime for Orders & Offers
            const channel = supabase
                .channel(`seller-updates-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'orders',
                        filter: `seller_id=eq.${user.id}`
                    },
                    () => fetchOrders(user.id)
                )
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'offers',
                        filter: `seller_id=eq.${user.id}`
                    },
                    () => fetchOffers(user.id)
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        } else {
            setLoading(false); // Done loading (to show auth redirect if needed)
        }
    }, [user]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Math.random()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('products')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('products')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, image_url: publicUrl }));
        } catch (err) {
            console.error('Error uploading image:', err);
            alert('Error al subir la imagen');
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Input validation
        if (formData.name.length > 100) {
            alert('El nombre del producto no puede exceder 100 caracteres');
            return;
        }
        if (formData.description && formData.description.length > 500) {
            alert('La descripción no puede exceder 500 caracteres');
            return;
        }
        if (parseFloat(formData.price) <= 0) {
            alert('El precio debe ser mayor a 0');
            return;
        }

        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let result;

            if (editingId) {
                // Update existing product
                result = await supabase
                    .from('products')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        image_url: formData.image_url,
                        size_clothing: formData.category === 'Ropa' ? formData.size_clothing : null,
                        size_shoes_us: formData.category === 'Zapatos' ? formData.size_shoes_us : null,
                        size_shoes_eu: formData.category === 'Zapatos' ? formData.size_shoes_eu : null,
                        size_shoes_col: formData.category === 'Zapatos' ? formData.size_shoes_col : null,
                        size_shoes_cm: formData.category === 'Zapatos' ? formData.size_shoes_cm : null,
                        clothing_type: formData.category === 'Ropa' ? formData.clothing_type : null,
                        is_negotiable: formData.is_negotiable,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId)
                    .select()
                    .single();
            } else {
                // Insert new product
                result = await supabase
                    .from('products')
                    .insert([{
                        name: formData.name,
                        description: formData.description,
                        price: parseFloat(formData.price),
                        category: formData.category,
                        image_url: formData.image_url,
                        size_clothing: formData.category === 'Ropa' ? formData.size_clothing : null,
                        size_shoes_us: formData.category === 'Zapatos' ? formData.size_shoes_us : null,
                        size_shoes_eu: formData.category === 'Zapatos' ? formData.size_shoes_eu : null,
                        size_shoes_col: formData.category === 'Zapatos' ? formData.size_shoes_col : null,
                        size_shoes_cm: formData.category === 'Zapatos' ? formData.size_shoes_cm : null,
                        clothing_type: formData.category === 'Ropa' ? formData.clothing_type : null,
                        is_negotiable: formData.is_negotiable,
                        seller_id: user.id,
                        stock_quantity: 1
                    }])
                    .select()
                    .single();
            }

            const { data, error } = result;

            if (error) throw error;

            if (editingId) {
                setProducts(products.map(p => p.id === editingId ? data : p));
            } else {
                setProducts([data, ...products]);
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Error al guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: '',
            displayPrice: '',
            category: 'Accesorios',
            image_url: '',
            size_clothing: '',
            clothing_type: 'Camiseta',
            size_shoes_us: '',
            size_shoes_eu: '',
            size_shoes_col: '',
            size_shoes_cm: '',
            is_negotiable: false
        });
        setEditingId(null);
    };

    const handleEditClick = (product: Product) => {
        const p = product.price?.toString() || '';
        setFormData({
            name: product.name,
            description: product.description || '',
            price: p,
            displayPrice: formatPrice(p),
            category: product.category || 'Accesorios',
            image_url: product.image_url || '',
            size_clothing: (product as any).size_clothing || '',
            clothing_type: (product as any).clothing_type || 'Camiseta',
            size_shoes_us: (product as any).size_shoes_us || '',
            size_shoes_eu: (product as any).size_shoes_eu || '',
            size_shoes_col: (product as any).size_shoes_col || '',
            size_shoes_cm: (product as any).size_shoes_cm || '',
            is_negotiable: (product as any).is_negotiable || false
        });
        setEditingId(product.id);
        setShowForm(true);
    };

    const handleDeleteClick = (product: Product) => {
        setDeleteModal({
            isOpen: true,
            productId: product.id,
            productName: product.name
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.productId) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteModal.productId);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== deleteModal.productId));
            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteModal({ isOpen: false, productId: null, productName: '' });
        } catch (err) {
            console.error('Error deleting product:', err);
            alert('Error al eliminar');
        }
    };

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    status: newStatus,
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            console.error('Error updating order status:', err);
            alert('Error al actualizar estado');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const updateTracking = async (orderId: string, trackingNum: string, provider: string) => {
        if (!trackingNum || !provider) return alert('Por favor ingresa transportadora y guía');
        setUpdatingOrder(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({
                    tracking_number: trackingNum,
                    shipping_provider: provider,
                    status: 'Enviado',
                    updated_at: new Date().toISOString()
                })
                .eq('id', orderId);

            if (error) throw error;
            setOrders(orders.map(o => o.id === orderId ? { ...o, tracking_number: trackingNum, shipping_provider: provider, status: 'Enviado' } : o));
        } catch (err) {
            console.error('Error updating tracking:', err);
            alert('Error al actualizar guía');
        } finally {
            setUpdatingOrder(null);
        }
    };

    const handleOfferAction = async (offerId: string, status: 'accepted' | 'rejected' | 'countered', extraData?: { counter_amount?: number; counter_message?: string }) => {
        setUpdatingOffer(offerId);
        try {
            const offer = offers.find(o => o.id === offerId);
            if (!offer) throw new Error('Oferta no encontrada');

            const updateData: any = {
                status,
                updated_at: new Date().toISOString()
            };

            if (status === 'countered' && extraData) {
                updateData.counter_amount = extraData.counter_amount;
                updateData.counter_message = extraData.counter_message;
            }

            const { error: offerError } = await supabase
                .from('offers')
                .update(updateData)
                .eq('id', offerId);

            if (offerError) throw offerError;

            // If accepted or countered, LOCK the product for 1 hour
            if ((status === 'accepted' || status === 'countered') && offer.product) {
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
                const { error: productError } = await supabase
                    .from('products')
                    .update({
                        status: 'negotiating',
                        negotiating_buyer_id: offer.buyer_id,
                        negotiation_expires_at: expiresAt
                    })
                    .eq('id', offer.product.id);

                if (productError) {
                    console.error('Error locking product:', productError);
                }
            }

            // Create notification for buyer
            if (offer.buyer_id) {
                let title = '';
                let message = '';

                if (status === 'accepted') {
                    title = '¡Oferta Aceptada!';
                    message = `El vendedor aceptó tu oferta por ${offer.product?.name}. Tienes 1 hora para completar el pago.`;
                } else if (status === 'countered') {
                    title = 'Nueva Contraoferta';
                    message = `El vendedor hizo una contraoferta de $${extraData?.counter_amount?.toLocaleString()} por ${offer.product?.name}.`;
                } else if (status === 'rejected') {
                    title = 'Oferta Rechazada';
                    message = `El vendedor rechazó tu oferta por ${offer.product?.name}.`;
                }

                if (title) {
                    await supabase.from('notifications').insert({
                        user_id: offer.buyer_id,
                        title,
                        message,
                        type: 'offer_update',
                        link: '/shop', // Link to shop or specific order/offer view
                    });
                }
            }

            setOffers(prev => prev.map(o => o.id === offerId ? { ...o, ...updateData } : o));

            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error updating offer:', err);
            alert('Error al actualizar la oferta');
        } finally {
            setUpdatingOffer(null);
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '80vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }



    if (!sellerProfile) {
        return <StoreOnboarding onComplete={() => fetchStoreData()} />;
    }

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

            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 82px)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary) 98%, transparent 100%)',
                padding: '20px 20px 10px 20px',
                pointerEvents: 'auto'
            }}>
                {/* Store Title Header */}
                <div style={{ padding: '20px 0', marginBottom: '10px', textAlign: 'center', position: 'relative' }}>
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, var(--secondary-light) 0%, transparent 70%)',
                        opacity: 0.1,
                        filter: 'blur(30px)',
                        zIndex: -1
                    }} />
                    <span style={{
                        fontSize: '11px',
                        fontWeight: '900',
                        color: 'var(--secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em',
                        opacity: 0.9,
                        display: 'block',
                        marginBottom: '8px'
                    }}>
                        Panel de Control
                    </span>
                    <h1 style={{
                        fontSize: '32px',
                        fontWeight: '900',
                        color: 'white',
                        margin: 0,
                        letterSpacing: '-1px',
                        textShadow: '0 10px 20px rgba(0,0,0,0.3)'
                    }}>
                        {(() => {
                            const words = sellerProfile.store_name?.split(' ') || [];
                            if (words.length <= 1) return <span style={{ color: 'white' }}>{sellerProfile.store_name}</span>;
                            return (
                                <>
                                    <span style={{ color: 'white' }}>{words[0]} </span>
                                    <span style={{ color: 'var(--secondary)' }}>{words[1]}</span>
                                    {words.length > 2 && <span style={{ color: 'white' }}> {words.slice(2).join(' ')}</span>}
                                </>
                            );
                        })()}
                    </h1>
                </div>

                {/* Dashboard Navigation */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '5px',
                    borderRadius: '20px',
                    marginBottom: '10px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    backdropFilter: 'blur(10px)'
                }}>
                    {[
                        { id: 'products', label: 'PRODUCTOS', icon: Package, count: 0 },
                        { id: 'orders', label: 'PEDIDOS', icon: Truck, count: orders.filter(o => o.status === 'Pendiente').length },
                        { id: 'offers', label: 'OFERTAS', icon: Handshake, count: offers.filter(o => o.status === 'pending').length },
                        { id: 'profile', label: 'AJUSTES', icon: Settings, count: 0 }
                    ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                style={{
                                    flex: 1,
                                    padding: '12px 10px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: isActive ? 'var(--secondary)' : 'transparent',
                                    color: isActive ? 'var(--primary)' : 'var(--text-dim)',
                                    fontWeight: '800',
                                    fontSize: '10px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative'
                                }}
                            >
                                <Icon size={18} strokeWidth={isActive ? 3 : 2} />
                                <span style={{ fontSize: '9px', letterSpacing: '0.05em' }}>{tab.label}</span>
                                {tab.count > 0 && (
                                    <span style={{
                                        position: 'absolute',
                                        top: '6px',
                                        right: '20%',
                                        background: isActive ? 'var(--primary)' : '#ef4444',
                                        color: isActive ? 'var(--secondary)' : 'white',
                                        fontSize: '9px',
                                        minWidth: '16px',
                                        height: '16px',
                                        borderRadius: '8px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontWeight: '900',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                    }}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 272px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                transition: 'top 0.3s ease'
            }}>
                {activeTab === 'products' ? (
                    <>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>Gestión de Inventario</h2>

                        {!showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                style={{
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '12px',
                                    borderRadius: '15px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    width: '100%',
                                    marginBottom: '20px'
                                }}
                            >
                                <Plus size={18} />
                                <span>Nuevo Producto</span>
                            </button>
                        )}

                        {showForm ? (
                            <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px', marginBottom: '30px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                                    <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editingId ? 'Editar Producto' : 'Nuevo Producto'}</h2>
                                    <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Cancelar</button>
                                </div>

                                {/* Image Upload Area */}
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Foto del Producto</label>
                                    <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', borderRadius: '15px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', border: '1px dashed var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        {formData.image_url ? (
                                            <img src={formData.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ textAlign: 'center' }}>
                                                <Camera size={32} color="var(--text-dim)" style={{ marginBottom: '8px' }} />
                                                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{uploading ? 'Subiendo...' : 'Toca para subir'}</p>
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre</label>
                                        <input
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                            placeholder="Ej: Sandwedge Titleist SM9"
                                        />
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Categoría</label>
                                            <select
                                                value={formData.category}
                                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                            >
                                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Precio (COP)</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    required
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={formData.displayPrice}
                                                    onChange={handlePriceChange}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                                    placeholder="0"
                                                />
                                                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '12px', pointerEvents: 'none' }}>
                                                    $
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conditional Size & Type Fields */}
                                    {formData.category === 'Ropa' && (
                                        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo de Prenda</label>
                                                <select
                                                    value={formData.clothing_type}
                                                    onChange={e => setFormData({ ...formData, clothing_type: e.target.value, size_clothing: '' })}
                                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                                >
                                                    {['Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'].map(t => <option key={t} value={t}>{t}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Talla</label>
                                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {(formData.clothing_type === 'Pantalón' || formData.clothing_type === 'Short' ? ['30', '32', '34', '36', '38', '40'] : ['S', 'M', 'L', 'XL', 'XXL']).map(size => (
                                                        <button
                                                            key={size}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, size_clothing: size })}
                                                            style={{
                                                                flex: 1,
                                                                minWidth: '50px',
                                                                padding: '10px',
                                                                borderRadius: '10px',
                                                                border: '1px solid var(--glass-border)',
                                                                background: formData.size_clothing === size ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                color: formData.size_clothing === size ? 'var(--primary)' : 'white',
                                                                fontWeight: '700',
                                                                fontSize: '13px'
                                                            }}
                                                        >
                                                            {size}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {formData.category === 'Zapatos' && (
                                        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '-5px', fontSize: '13px', color: 'var(--text-dim)' }}>Tallas de Calzado (Conversión automática)</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800' }}>COL</label>
                                                    <input
                                                        placeholder="Ej: 40"
                                                        value={formData.size_shoes_col}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const converted = convertShoeSizes(val);
                                                            setFormData({
                                                                ...formData,
                                                                size_shoes_col: val,
                                                                size_shoes_us: converted.us,
                                                                size_shoes_eu: converted.eu,
                                                                size_shoes_cm: converted.cm
                                                            });
                                                        }}
                                                        style={{ width: '100%', background: 'rgba(163, 230, 53, 0.1)', border: '1px solid var(--secondary)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px', fontWeight: '700' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>US</label>
                                                    <input
                                                        placeholder="Ej: 9.5"
                                                        value={formData.size_shoes_us}
                                                        onChange={e => setFormData({ ...formData, size_shoes_us: e.target.value })}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>EU</label>
                                                    <input
                                                        placeholder="Ej: 42"
                                                        value={formData.size_shoes_eu}
                                                        onChange={e => setFormData({ ...formData, size_shoes_eu: e.target.value })}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px' }}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px', color: 'var(--text-dim)' }}>CM</label>
                                                    <input
                                                        placeholder="Ej: 27"
                                                        value={formData.size_shoes_cm}
                                                        onChange={e => setFormData({ ...formData, size_shoes_cm: e.target.value })}
                                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '14px' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Descripción</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', minHeight: '80px', resize: 'none' }}
                                            placeholder="Describe el estado de tu producto..."
                                        />
                                    </div>

                                    {/* Negotiable Toggle */}
                                    <div
                                        onClick={() => setFormData({ ...formData, is_negotiable: !formData.is_negotiable })}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '15px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '15px',
                                            border: '1px solid var(--glass-border)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div>
                                            <p style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Precio Negociable</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Permitir que los compradores envíen ofertas</p>
                                        </div>
                                        <div style={{
                                            width: '44px',
                                            height: '24px',
                                            background: formData.is_negotiable ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                                            borderRadius: '20px',
                                            position: 'relative',
                                            transition: 'all 0.3s ease'
                                        }}>
                                            <div style={{
                                                width: '18px',
                                                height: '18px',
                                                background: formData.is_negotiable ? 'var(--primary)' : 'var(--text-dim)',
                                                borderRadius: '50%',
                                                position: 'absolute',
                                                top: '3px',
                                                left: formData.is_negotiable ? '23px' : '3px',
                                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                                            }} />
                                        </div>
                                    </div>

                                    {/* Commission Calculation */}
                                    {formData.price && (
                                        <div className="glass" style={{ padding: '15px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '15px', border: '1px solid rgba(163, 230, 53, 0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                                                <span style={{ color: 'var(--text-dim)' }}>Comisión APEG (5%)</span>
                                                <span style={{ color: '#ef4444', fontWeight: '600' }}>- {formatPrice((parseFloat(formData.price) * 0.05).toString())}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '800', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                                <span>Recibes en tu cuenta</span>
                                                <span style={{ color: 'var(--secondary)' }}>$ {formatPrice((parseFloat(formData.price) * 0.95).toString())}</span>
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={saving || !formData.image_url}
                                        style={{
                                            width: '100%',
                                            background: (saving || !formData.image_url) ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                            color: 'var(--primary)',
                                            padding: '15px',
                                            borderRadius: '15px',
                                            fontWeight: '800',
                                            marginTop: '10px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '10px'
                                        }}
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                        {saving ? 'GUARDANDO...' : 'PUBLICAR PRODUCTO'}
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {loading ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="glass" style={{ padding: '15px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                <Skeleton width="90px" height="90px" borderRadius="20px" />
                                                <div style={{ flex: 1 }}>
                                                    <Skeleton width="60%" height="18px" style={{ marginBottom: '8px' }} />
                                                    <Skeleton width="40%" height="22px" style={{ marginBottom: '10px' }} />
                                                    <div style={{ display: 'flex', gap: '6px' }}>
                                                        <Skeleton width="50px" height="18px" borderRadius="8px" />
                                                        <Skeleton width="40px" height="18px" borderRadius="8px" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : products.length === 0 ? (
                                    <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                        <div style={{
                                            width: '80px',
                                            height: '80px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            margin: '0 auto 20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <Package size={32} color="var(--text-dim)" style={{ opacity: 0.5 }} />
                                        </div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Tu tienda está vacía</h3>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '20px' }}>¡Sube tu primer producto y comienza a vender!</p>
                                        <button
                                            onClick={() => setShowForm(true)}
                                            style={{
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '12px 25px',
                                                borderRadius: '15px',
                                                fontWeight: '900',
                                                border: 'none',
                                                fontSize: '14px'
                                            }}
                                        >
                                            VENDER UN ARTÍCULO
                                        </button>
                                    </div>
                                ) : (
                                    products.map(product => (
                                        <div key={product.id} className="animate-fade-up">
                                            <div
                                                style={{
                                                    position: 'relative',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '26px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    overflow: 'hidden',
                                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                                }}
                                            >
                                                <div style={{ padding: '15px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                                                    <div style={{ position: 'relative', flexShrink: 0 }}>
                                                        <div style={{
                                                            width: '90px',
                                                            height: '90px',
                                                            borderRadius: '20px',
                                                            overflow: 'hidden',
                                                            background: 'var(--primary-light)',
                                                            border: '1px solid rgba(255,255,255,0.1)'
                                                        }}>
                                                            <img
                                                                src={optimizeImage(product.image_url, { width: 200, height: 200 }) || ''}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                alt={product.name}
                                                            />
                                                        </div>
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '-6px',
                                                            right: '-6px',
                                                            background: product.status === 'active' ? 'var(--secondary)' : '#f59e0b',
                                                            width: '28px',
                                                            height: '28px',
                                                            borderRadius: '50%',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: '3px solid #062216',
                                                            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                                                        }}>
                                                            {product.status === 'active' ? <CheckCircle2 size={14} color="var(--primary)" /> : <Package size={14} color="white" />}
                                                        </div>
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <h3 style={{
                                                            fontSize: '17px',
                                                            fontWeight: '900',
                                                            marginBottom: '5px',
                                                            color: 'white',
                                                            letterSpacing: '-0.3px',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            whiteSpace: 'nowrap'
                                                        }}>{product.name}</h3>

                                                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px', marginBottom: '10px' }}>
                                                            <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '20px' }}>
                                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                                            </span>
                                                        </div>

                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                            <span style={{
                                                                background: 'rgba(255,255,255,0.05)',
                                                                padding: '4px 10px',
                                                                borderRadius: '8px',
                                                                fontSize: '10px',
                                                                color: 'var(--text-dim)',
                                                                fontWeight: '800',
                                                                textTransform: 'uppercase',
                                                                border: '1px solid rgba(255,255,255,0.05)'
                                                            }}>
                                                                {(product as any).clothing_type || product.category}
                                                            </span>
                                                            {(product as any).size_clothing && (
                                                                <span style={{
                                                                    background: 'rgba(163, 230, 53, 0.1)',
                                                                    padding: '4px 10px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '10px',
                                                                    color: 'var(--secondary)',
                                                                    fontWeight: '900',
                                                                    border: '1px solid rgba(163, 230, 53, 0.2)'
                                                                }}>
                                                                    TALLA: {(product as any).size_clothing}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
                                                        <button onClick={(e) => { e.stopPropagation(); handleEditClick(product); }} style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', cursor: 'pointer', transition: 'all 0.2s' }}><Pencil size={18} /></button>
                                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(product); }} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '10px', cursor: 'pointer', transition: 'all 0.2s' }}><Trash2 size={18} /></button>
                                                    </div>
                                                </div>

                                                {product.status === 'pending_payment' && (
                                                    <div style={{ padding: '0 15px 15px' }}>
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                try {
                                                                    const confirmed = confirm('¿Pagar 120,000 COP para publicar este producto?');
                                                                    if (confirmed) {
                                                                        const { error } = await supabase
                                                                            .from('products')
                                                                            .update({ status: 'active' })
                                                                            .eq('id', product.id);
                                                                        if (error) throw error;
                                                                        setProducts(products.map(p => p.id === product.id ? { ...p, status: 'active' } : p));
                                                                        alert('Producto publicado exitosamente!');
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    alert('Error al procesar el pago');
                                                                }
                                                            }}
                                                            style={{
                                                                width: '100%',
                                                                background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                                                color: 'var(--primary)',
                                                                padding: '14px',
                                                                borderRadius: '15px',
                                                                fontWeight: '900',
                                                                fontSize: '13px',
                                                                border: 'none',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                gap: '10px',
                                                                boxShadow: '0 8px 15px rgba(163, 230, 53, 0.2)',
                                                                textAlign: 'center'
                                                            }}
                                                        >
                                                            <CheckCircle2 size={18} />
                                                            PUBLICAR AHORA ($120.000)
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </>
                ) : activeTab === 'orders' ? (
                    <div className="animate-fade">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                Ventas <span style={{ color: 'var(--secondary)' }}>Recientes</span>
                            </h2>
                            <div style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>{orders.length} pedidos</div>
                        </div>
                        {orders.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <TrendingDown size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-dim)' }}>Aún no tienes ventas registradas.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {orders.map(order => (
                                    <Card key={order.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '6px 14px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                background: order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                                                color: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                                                border: `1px solid ${order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                                                letterSpacing: '0.05em'
                                            }}>
                                                {order.status?.toUpperCase() || 'PENDIENTE'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                                                <Calendar size={12} />
                                                {order.created_at ? new Date(order.created_at).toLocaleDateString() : '---'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={optimizeImage(order.product?.image_url, { width: 150, height: 150 })} style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                                                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--secondary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                                                    <Package size={10} color="var(--primary)" />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{order.product?.name}</h4>
                                                <p style={{ fontSize: '16px', color: 'var(--secondary)', fontWeight: '900' }}>
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.seller_net_amount)}
                                                    <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '600', marginLeft: '5px' }}>NETOS</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <p style={{ fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <User size={12} /> Información del Comprador
                                            </p>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <User size={14} color="var(--text-dim)" />
                                                    </div>
                                                    <span style={{ fontWeight: '600' }}>{order.buyer_name || order.buyer?.full_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Phone size={14} color="var(--text-dim)" />
                                                    </div>
                                                    <span style={{ fontWeight: '600' }}>{order.buyer_phone || order.buyer?.phone}</span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                                                    <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                                                        <MapPin size={14} color="var(--text-dim)" />
                                                    </div>
                                                    <span style={{ lineHeight: '1.4', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>{order.shipping_address}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {order.status === 'Pendiente' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'Preparando')}
                                                disabled={updatingOrder === order.id}
                                                style={{
                                                    width: '100%',
                                                    background: 'rgba(59, 130, 246, 0.1)',
                                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                                    color: '#60a5fa',
                                                    padding: '14px',
                                                    borderRadius: '16px',
                                                    fontWeight: '800',
                                                    fontSize: '13px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                                                }}
                                            >
                                                {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                                                {updatingOrder === order.id ? 'ACTUALIZANDO...' : 'LISTO PARA DESPACHO'}
                                            </button>
                                        )}

                                        {order.status === 'Preparando' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                <p style={{ fontSize: '11px', fontWeight: '900', color: 'white', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actualizar Guía de Envío</p>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <input
                                                        id={`provider-${order.id}`}
                                                        placeholder="Transportadora"
                                                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                                                    />
                                                    <input
                                                        id={`tracking-${order.id}`}
                                                        placeholder="No. Guía"
                                                        style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const prov = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                                                        const track = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                                                        updateTracking(order.id, track, prov);
                                                    }}
                                                    disabled={updatingOrder === order.id}
                                                    style={{
                                                        background: 'var(--secondary)',
                                                        color: 'var(--primary)',
                                                        padding: '14px',
                                                        borderRadius: '16px',
                                                        fontWeight: '900',
                                                        width: '100%',
                                                        marginTop: '5px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '10px',
                                                        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                                                    }}
                                                >
                                                    {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                                                    MARCAR COMO ENVIADO
                                                </button>
                                            </div>
                                        )}

                                        {order.status === 'Enviado' && (
                                            <div style={{
                                                background: 'rgba(16, 185, 129, 0.08)',
                                                border: '1px solid rgba(16, 185, 129, 0.2)',
                                                padding: '16px',
                                                borderRadius: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px'
                                            }}>
                                                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckCircle2 size={20} color="#10b981" />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>Producto Enviado</p>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{order.shipping_provider} • {order.tracking_number}</p>
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : activeTab === 'offers' ? (
                    <div className="animate-fade">
                        <h2 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px', color: 'white' }}>
                            Ofertas <span style={{ color: 'var(--secondary)' }}>Recibidas</span>
                        </h2>
                        {offers.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                                <Handshake size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                <p style={{ color: 'var(--text-dim)' }}>No hay ofertas pendientes.</p>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {offers.map(offer => (
                                    <Card key={offer.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                                            <span style={{
                                                padding: '6px 14px',
                                                borderRadius: '12px',
                                                fontSize: '10px',
                                                fontWeight: '900',
                                                background: offer.status === 'pending' ? 'rgba(245, 158, 11, 0.15)' :
                                                    offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                                color: offer.status === 'pending' ? '#f59e0b' :
                                                    offer.status === 'accepted' ? '#10b981' : '#ef4444',
                                                border: `1px solid ${offer.status === 'pending' ? 'rgba(245, 158, 11, 0.3)' :
                                                    offer.status === 'accepted' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                                letterSpacing: '0.05em'
                                            }}>
                                                {offer.status === 'pending' ? 'PENDIENTE' :
                                                    offer.status === 'accepted' ? 'ACEPTADA' : 'RECHAZADA'}
                                            </span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                                                <Calendar size={12} />
                                                {offer.created_at ? new Date(offer.created_at).toLocaleDateString() : '---'}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <img src={optimizeImage(offer.product?.image_url, { width: 150, height: 150 }) || ''} style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} alt="" />
                                                <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: '#3b82f6', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                                                    <Handshake size={10} color="white" />
                                                </div>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '6px' }}>{offer.product?.name}</h4>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <p style={{ fontSize: '18px', color: 'var(--secondary)', fontWeight: '900' }}>
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.offer_amount)}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', textDecoration: 'line-through', fontWeight: '600' }}>
                                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(offer.product?.price || 0)}
                                                    </p>
                                                    <span style={{ fontSize: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>
                                                        -{Math.round((1 - offer.offer_amount / (offer.product?.price || 1)) * 100)}%
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '18px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', marginBottom: '10px' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <User size={14} color="var(--text-dim)" />
                                                </div>
                                                <span style={{ fontWeight: '700' }}>{offer.buyer?.full_name || 'Comprador APEG'}</span>
                                            </div>
                                            {offer.message && (
                                                <div style={{ position: 'relative', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--secondary)' }}>
                                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', lineHeight: '1.4' }}>
                                                        "{offer.message}"
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        {offer.status === 'pending' && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                                <button
                                                    onClick={() => handleOfferAction(offer.id, 'rejected')}
                                                    disabled={updatingOffer === offer.id}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: '100px',
                                                        background: 'rgba(239, 68, 68, 0.1)',
                                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                                        color: '#f87171',
                                                        padding: '12px',
                                                        borderRadius: '14px',
                                                        fontWeight: '800',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    RECHAZAR
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setSelectedOfferForCounter(offer);
                                                        setCounterAmount(offer.offer_amount.toString());
                                                        setCounterMessage('');
                                                        setShowCounterModal(true);
                                                    }}
                                                    disabled={updatingOffer === offer.id}
                                                    style={{
                                                        flex: 1,
                                                        minWidth: '100px',
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        color: 'white',
                                                        padding: '12px',
                                                        borderRadius: '14px',
                                                        fontWeight: '800',
                                                        fontSize: '11px'
                                                    }}
                                                >
                                                    CONTRAOFERTA
                                                </button>
                                                <button
                                                    onClick={() => handleOfferAction(offer.id, 'accepted')}
                                                    disabled={updatingOffer === offer.id}
                                                    style={{
                                                        flex: 2,
                                                        minWidth: '180px',
                                                        background: 'var(--secondary)',
                                                        color: 'var(--primary)',
                                                        padding: '12px',
                                                        borderRadius: '14px',
                                                        fontWeight: '900',
                                                        fontSize: '11px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        gap: '8px',
                                                        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                                                    }}
                                                >
                                                    {updatingOffer === offer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                                    ACEPTAR OFERTA
                                                </button>
                                            </div>
                                        )}

                                        {offer.status === 'countered' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)', padding: '16px', borderRadius: '16px' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tu Contraoferta</span>
                                                        <span style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' }}>${offer.counter_amount?.toLocaleString()}</span>
                                                    </div>
                                                    {offer.counter_message && (
                                                        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', margin: 0 }}>
                                                            "{offer.counter_message}"
                                                        </p>
                                                    )}
                                                </div>
                                                <div style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '12px', borderRadius: '14px', color: '#60a5fa', textAlign: 'center', fontWeight: '800', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                    <Info size={16} />
                                                    RESERVADO • El comprador tiene 1 hora para comprar
                                                </div>
                                            </div>
                                        )}

                                        {offer.status === 'accepted' && (
                                            <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '16px', color: '#10b981', textAlign: 'center', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <CheckCircle2 size={18} />
                                                OFERTA ACEPTADA • Esperando pago (1h)
                                            </div>
                                        )}

                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="animate-fade">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                Perfil <span style={{ color: 'var(--secondary)' }}>Marketplace</span>
                            </h2>
                            {isEditingProfile && (
                                <button
                                    onClick={() => {
                                        setIsEditingProfile(false);
                                        setProfileFormData({ ...sellerProfile });
                                    }}
                                    style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '600' }}
                                >
                                    Cancelar
                                </button>
                            )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {!isEditingProfile ? (
                                <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px' }}>
                                        <div style={{ background: 'linear-gradient(135deg, var(--secondary), #7cc42b)', borderRadius: '20px', padding: '18px', color: 'var(--primary)', boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)' }}>
                                            <Store size={36} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.02em' }}>{sellerProfile.store_name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                                <span style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'var(--secondary)',
                                                    fontSize: '10px',
                                                    textTransform: 'uppercase',
                                                    fontWeight: '900',
                                                    padding: '4px 10px',
                                                    borderRadius: '6px',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    {sellerProfile.entity_type === 'natural' ? 'Persona Natural' : 'Persona Jurídica'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '25px' }}>
                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                                <User size={14} /> Datos de Identidad
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                                                        {sellerProfile.entity_type === 'natural' ? 'Nombre Completo' : 'Razón Social'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile.entity_type === 'natural' ? sellerProfile.full_name : sellerProfile.company_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                                                        {sellerProfile.entity_type === 'natural' ? `Doc. (${sellerProfile.document_type})` : 'NIT'}
                                                    </span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile.entity_type === 'natural' ? sellerProfile.document_number : sellerProfile.nit}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{
                                            background: 'rgba(255,255,255,0.02)',
                                            borderRadius: '20px',
                                            padding: '20px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '900', marginBottom: '18px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.05em' }}>
                                                <Landmark size={14} /> Información Bancaria
                                            </h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Banco</span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{sellerProfile.bank_name}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Tipo de Cuenta</span>
                                                    <span style={{ fontWeight: '700', fontSize: '14px', textTransform: 'capitalize' }}>{sellerProfile.account_type}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>Número de Cuenta</span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                        <span style={{ fontWeight: '700', fontSize: '14px' }}>•••• {sellerProfile.account_number.slice(-4)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            setProfileFormData(sellerProfile);
                                            setIsEditingProfile(true);
                                        }}
                                        style={{
                                            marginTop: '30px',
                                            width: '100%',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            padding: '18px',
                                            borderRadius: '20px',
                                            fontSize: '14px',
                                            fontWeight: '800',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '12px',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        <Pencil size={18} />
                                        EDITAR MI Marketplace
                                    </button>
                                </Card>
                            ) : (
                                <Card style={{ padding: '30px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '28px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '10px', fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre del Marketplace</label>
                                            <div style={{ position: 'relative' }}>
                                                <input
                                                    value={profileFormData.store_name}
                                                    onChange={e => setProfileFormData({ ...profileFormData, store_name: e.target.value })}
                                                    style={{ width: '100%', padding: '16px 16px 16px 45px', borderRadius: '16px', background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: '15px' }}
                                                    placeholder="Ej: Mi Tienda Pro"
                                                />
                                                <Store size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Información de Identidad</h4>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {sellerProfile.entity_type === 'natural' ? (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre Completo</label>
                                                            <input
                                                                value={profileFormData.full_name || ''}
                                                                onChange={e => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Documento</label>
                                                            <input
                                                                value={profileFormData.document_number || ''}
                                                                onChange={e => setProfileFormData({ ...profileFormData, document_number: e.target.value })}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Razón Social</label>
                                                            <input
                                                                value={profileFormData.company_name || ''}
                                                                onChange={e => setProfileFormData({ ...profileFormData, company_name: e.target.value })}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                        <div>
                                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>NIT</label>
                                                            <input
                                                                value={profileFormData.nit || ''}
                                                                onChange={e => setProfileFormData({ ...profileFormData, nit: e.target.value })}
                                                                style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <h4 style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '900', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cuenta de Retiros</h4>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Número de Cuenta</label>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        value={profileFormData.account_number || ''}
                                                        onChange={e => setProfileFormData({ ...profileFormData, account_number: e.target.value })}
                                                        style={{ width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.05)', fontSize: '14px' }}
                                                        placeholder="Número de cuenta bancaria"
                                                    />
                                                    <Landmark size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                                                </div>
                                                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Info size={12} />
                                                    Solo puedes editar el nombre y número de identificación. Para cambios bancarios contacta a soporte.
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                if (saving) return;
                                                setSaving(true);
                                                try {
                                                    const { error } = await supabase
                                                        .from('seller_profiles')
                                                        .update({
                                                            store_name: profileFormData.store_name,
                                                            full_name: profileFormData.full_name,
                                                            company_name: profileFormData.company_name,
                                                            document_number: profileFormData.document_number,
                                                            nit: profileFormData.nit,
                                                            account_number: profileFormData.account_number,
                                                            updated_at: new Date().toISOString()
                                                        })
                                                        .eq('id', sellerProfile.id);

                                                    if (error) throw error;

                                                    setSellerProfile(profileFormData);
                                                    setIsEditingProfile(false);
                                                    alert('Perfil de tienda actualizado correctamente');
                                                } catch (err: any) {
                                                    alert('Error al actualizar: ' + err.message);
                                                } finally {
                                                    setSaving(false);
                                                }
                                            }}
                                            disabled={saving}
                                            style={{
                                                marginTop: '10px',
                                                width: '100%',
                                                background: saving ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '18px',
                                                borderRadius: '20px',
                                                fontSize: '15px',
                                                fontWeight: '900',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                boxShadow: '0 8px 25px rgba(163, 230, 53, 0.2)'
                                            }}
                                        >
                                            {saving ? <Loader2 size={20} className="animate-spin" /> : <CheckCircle2 size={20} />}
                                            {saving ? 'GUARDANDO CAMBIOS...' : 'GUARDAR CAMBIOS'}
                                        </button>
                                    </div>
                                </Card>
                            )}

                            <div className="glass" style={{ padding: '15px', display: 'flex', gap: '12px', alignItems: 'center', background: 'rgba(163, 230, 53, 0.05)' }}>
                                <Info size={20} color="var(--secondary)" />
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.4' }}>
                                    Mantén tus datos actualizados para asegurar que tus transferencias de ventas lleguen correctamente.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {/* Custom Confirmation Modal */}
            {
                deleteModal.isOpen && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        padding: '20px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass"
                            style={{
                                width: '100%',
                                maxWidth: '320px',
                                padding: '25px',
                                borderRadius: '24px',
                                textAlign: 'center',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'var(--primary)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                        >
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <Trash2 color="#ef4444" size={28} />
                            </div>
                            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '700' }}>¿Eliminar producto?</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar <strong>{deleteModal.productName}</strong>? Esta acción es permanente.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '600',
                                        fontSize: '14px'
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        flex: 1,
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Modal de Contraoferta */}
            {showCounterModal && selectedOfferForCounter && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(10px)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px'
                }}>
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        style={{
                            backgroundColor: '#1a1a1a',
                            borderRadius: '32px',
                            width: '100%',
                            maxWidth: '450px',
                            padding: '32px',
                            border: '1px solid rgba(255,255,255,0.1)',
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div>
                                <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '4px' }}>Enviar Contraoferta</h3>
                                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>Para {selectedOfferForCounter.product?.name}</p>
                            </div>
                            <button
                                onClick={() => setShowCounterModal(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    color: 'white'
                                }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', marginBottom: '24px', gap: '16px', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Oferta Actual</span>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>${selectedOfferForCounter.offer_amount.toLocaleString()}</div>
                            </div>
                            <div style={{ width: '1px', height: '30px', background: 'rgba(255,255,255,0.1)' }} />
                            <div style={{ flex: 1 }}>
                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Precio Orig.</span>
                                <div style={{ fontSize: '20px', fontWeight: '800', color: 'rgba(255,255,255,0.6)' }}>${selectedOfferForCounter.product?.price.toLocaleString()}</div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', marginLeft: '4px' }}>Nuevo Monto</label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontSize: '24px', fontWeight: '900', color: 'var(--secondary)' }}>$</span>
                                <input
                                    type="number"
                                    value={counterAmount}
                                    onChange={(e) => setCounterAmount(e.target.value)}
                                    placeholder="0"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '2px solid rgba(163, 230, 53, 0.2)',
                                        borderRadius: '20px',
                                        padding: '20px 20px 20px 45px',
                                        fontSize: '28px',
                                        fontWeight: '900',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'rgba(255,255,255,0.6)', marginBottom: '10px', marginLeft: '4px' }}>Mensaje (Opcional)</label>
                            <textarea
                                value={counterMessage}
                                onChange={(e) => setCounterMessage(e.target.value)}
                                placeholder="Ej: Podemos cerrar en este precio si lo compras hoy mismo."
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '20px',
                                    padding: '16px',
                                    fontSize: '15px',
                                    color: 'white',
                                    minHeight: '100px',
                                    outline: 'none',
                                    resize: 'none'
                                }}
                            />
                        </div>

                        <button
                            onClick={() => {
                                handleOfferAction(selectedOfferForCounter.id, 'countered', {
                                    counter_amount: parseFloat(counterAmount),
                                    counter_message: counterMessage
                                });
                                setShowCounterModal(false);
                            }}
                            disabled={!counterAmount || isNaN(parseFloat(counterAmount))}
                            style={{
                                width: '100%',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                padding: '20px',
                                borderRadius: '20px',
                                fontWeight: '900',
                                fontSize: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                boxShadow: '0 12px 24px rgba(163, 230, 53, 0.2)',
                                opacity: (!counterAmount || isNaN(parseFloat(counterAmount))) ? 0.5 : 1
                            }}
                        >
                            ENVIAR CONTRAOFERTA
                        </button>
                    </motion.div>
                </div>
            )}
        </div >

    );
};

export default MyStore;
