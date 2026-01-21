import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import {
    Plus, Package, Trash2,
    Camera, Loader2, CheckCircle2,
    Pencil, TrendingDown,
    Truck, User, Phone, MapPin
} from 'lucide-react';
import Card from '../components/Card';
import StoreOnboarding from '../components/StoreOnboarding';
import type { Database } from '../types/database.types';

type SellerProfile = Database['public']['Tables']['seller_profiles']['Row'];

type Product = Database['public']['Tables']['products']['Row'];

const MyStore: React.FC = () => {
    const navigate = useNavigate();
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
    const [orders, setOrders] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');
    const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);

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

    useEffect(() => {
        fetchStoreData();
    }, []);

    const fetchStoreData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/auth');
                return;
            }

            // Fetch Seller Profile
            const { data: profile } = await supabase
                .from('seller_profiles')
                .select('*')
                .eq('user_id', session.user.id)
                .single();

            setSellerProfile(profile);

            if (profile) {
                // Fetch User Products
                const { data: userProducts, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('seller_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setProducts(userProducts || []);

                // Fetch Orders
                const fetchOrders = async () => {
                    const { data: userOrders } = await supabase
                        .from('orders')
                        .select('*, product:products(*), buyer:profiles(*)')
                        .eq('seller_id', session.user.id)
                        .order('created_at', { ascending: false });
                    setOrders(userOrders || []);
                };

                fetchOrders();

                // Setup Realtime for Orders
                const channel = supabase
                    .channel('seller-orders')
                    .on(
                        'postgres_changes',
                        {
                            event: '*',
                            schema: 'public',
                            table: 'orders',
                            filter: `seller_id=eq.${session.user.id}`
                        },
                        () => {
                            fetchOrders();
                        }
                    )
                    .subscribe();

                return () => {
                    supabase.removeChannel(channel);
                };
            }

        } catch (err) {
            console.error('Error fetching store data:', err);
        } finally {
            setLoading(false);
        }
    };

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
        <div className="animate-fade">
            <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)' }}>
                <button
                    onClick={() => setActiveTab('products')}
                    style={{
                        padding: '10px 5px',
                        color: activeTab === 'products' ? 'var(--secondary)' : 'var(--text-dim)',
                        borderBottom: activeTab === 'products' ? '2px solid var(--secondary)' : 'none',
                        fontWeight: '700',
                        fontSize: '15px'
                    }}
                >
                    MIS PRODUCTOS
                </button>
                <button
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '10px 5px',
                        color: activeTab === 'orders' ? 'var(--secondary)' : 'var(--text-dim)',
                        borderBottom: activeTab === 'orders' ? '2px solid var(--secondary)' : 'none',
                        fontWeight: '700',
                        fontSize: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                    }}
                >
                    PEDIDOS {orders.filter(o => o.status === 'Pendiente').length > 0 && <span style={{ background: '#ef4444', color: 'white', fontSize: '10px', padding: '2px 6px', borderRadius: '10px' }}>{orders.filter(o => o.status === 'Pendiente').length}</span>}
                </button>
            </div>

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
                            {products.length === 0 ? (
                                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <Package size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                                    <p style={{ color: 'var(--text-dim)' }}>No tienes productos publicados.</p>
                                    <button
                                        onClick={() => setShowForm(true)}
                                        style={{ color: 'var(--secondary)', marginTop: '10px', fontWeight: '600' }}
                                    >
                                        Publicar mi primer producto
                                    </button>
                                </div>
                            ) : (
                                products.map(product => (
                                    <div key={product.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', userSelect: 'none', touchAction: 'pan-y' }}>
                                        {/* Actions Background Layer */}
                                        <div style={{
                                            position: 'absolute',
                                            right: 0,
                                            top: 0,
                                            bottom: 0,
                                            width: '140px',
                                            display: 'flex',
                                            alignItems: 'stretch',
                                            zIndex: 0
                                        }}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleEditClick(product);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    background: '#3b82f6',
                                                    border: 'none',
                                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Pencil size={24} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClick(product);
                                                }}
                                                style={{
                                                    flex: 1,
                                                    background: '#ef4444',
                                                    border: 'none',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Trash2 size={24} />
                                            </button>
                                        </div>

                                        {/* Main Card Layer */}
                                        <motion.div
                                            drag="x"
                                            dragConstraints={{ left: -140, right: 0 }}
                                            dragElastic={0.1}
                                            dragSnapToOrigin={false}
                                            style={{
                                                position: 'relative',
                                                zIndex: 1,
                                                x: 0,
                                                background: '#0d2b1d',
                                                borderRadius: '20px'
                                            }}
                                            whileTap={{ cursor: 'grabbing' }}
                                        >
                                            <Card style={{ marginBottom: 0, padding: '15px', display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                <img
                                                    src={product.image_url || ''}
                                                    style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
                                                    alt={product.name}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <h3 style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        marginBottom: '2px',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>{product.name}</h3>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                                        <span style={{ color: 'white' }}>{(product as any).clothing_type ? (product as any).clothing_type : product.category}</span>
                                                        {(product as any).size_clothing && <span>• Talla: {(product as any).size_clothing}</span>}
                                                        {(product as any).size_shoes_col && <span>• Talla: {(product as any).size_shoes_col} COL</span>}
                                                        {(product as any).size_shoes_cm && <span>({(product as any).size_shoes_cm} cm)</span>}
                                                        <span>•</span>
                                                        <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                                        </span>
                                                    </div>
                                                    {(product as any).status === 'pending_payment' && (
                                                        <div style={{ marginTop: '8px' }}>
                                                            <span style={{
                                                                background: '#f59e0b',
                                                                color: 'white',
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '10px',
                                                                fontWeight: '800',
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                Pendiente de Pago
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </Card>
                                        </motion.div>
                                        {(product as any).status === 'pending_payment' && (
                                            <button
                                                onClick={async () => {
                                                    try {
                                                        // Simulate payment or redirect to checkout
                                                        const confirmed = confirm('Pagar 120,000 COP para publicar este torneo?');
                                                        if (confirmed) {
                                                            const { error } = await supabase
                                                                .from('products')
                                                                .update({ status: 'active' })
                                                                .eq('id', product.id);
                                                            if (error) throw error;
                                                            setProducts(products.map(p => p.id === product.id ? { ...p, status: 'active' } : p));
                                                            alert('Torneo publicado exitosamente!');
                                                        }
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert('Error al procesar el pago');
                                                    }
                                                }}
                                                style={{
                                                    width: '100%',
                                                    marginTop: '10px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    fontWeight: '800',
                                                    fontSize: '13px',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                Pagar Publicación ($ 120,000)
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-fade">
                    <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>Ventas y Seguimiento</h2>
                    {orders.length === 0 ? (
                        <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                            <TrendingDown size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                            <p style={{ color: 'var(--text-dim)' }}>Aún no tienes ventas registradas.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {orders.map(order => (
                                <Card key={order.id} style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '8px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                                            color: 'white'
                                        }}>
                                            {order.status.toUpperCase()}
                                        </span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                                        <img src={order.product?.image_url} style={{ width: '50px', height: '50px', borderRadius: '10px', objectFit: 'cover' }} alt="" />
                                        <div>
                                            <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{order.product?.name}</h4>
                                            <p style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '800' }}>$ {new Intl.NumberFormat('es-CO').format(order.seller_net_amount)} netos</p>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '15px', padding: '15px', marginBottom: '15px' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>Información del Comprador</p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <User size={14} color="var(--text-dim)" />
                                                <span>{order.buyer_name || order.buyer?.full_name}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                                                <Phone size={14} color="var(--text-dim)" />
                                                <span>{order.buyer_phone || order.buyer?.phone}</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13px' }}>
                                                <MapPin size={14} color="var(--text-dim)" style={{ marginTop: '3px' }} />
                                                <span style={{ lineHeight: '1.4' }}>{order.shipping_address}</span>
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
                                                border: '1px solid #3b82f6',
                                                color: '#60a5fa',
                                                padding: '12px',
                                                borderRadius: '12px',
                                                fontWeight: '700',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Package size={18} />
                                            {updatingOrder === order.id ? 'Actualizando...' : 'LISTO PARA DESPACHO'}
                                        </button>
                                    )}

                                    {order.status === 'Preparando' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <p style={{ fontSize: '12px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>Actualizar Guía de Envío</p>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <input
                                                    id={`provider-${order.id}`}
                                                    placeholder="Transportadora"
                                                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: 'white' }}
                                                />
                                                <input
                                                    id={`tracking-${order.id}`}
                                                    placeholder="No. Guía"
                                                    style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '10px', fontSize: '13px', color: 'white' }}
                                                />
                                            </div>
                                            <button
                                                onClick={() => {
                                                    const prov = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                                                    const track = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                                                    updateTracking(order.id, track, prov);
                                                }}
                                                disabled={updatingOrder === order.id}
                                                style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '12px', borderRadius: '12px', fontWeight: '800', width: '100%', marginTop: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            >
                                                {updatingOrder === order.id ? <Loader2 size={16} className="animate-spin" /> : <Truck size={16} />}
                                                MARCAR COMO ENVIADO
                                            </button>
                                        </div>
                                    )}

                                    {order.status === 'Enviado' && (
                                        <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <CheckCircle2 size={18} color="#10b981" />
                                            <div style={{ fontSize: '12px' }}>
                                                <p style={{ fontWeight: '700', color: '#10b981' }}>Producto Enviado</p>
                                                <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{order.shipping_provider} - {order.tracking_number}</p>
                                            </div>
                                        </div>
                                    )}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {/* Custom Confirmation Modal */}
            {deleteModal.isOpen && (
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
            )}
        </div>
    );
};

export default MyStore;
