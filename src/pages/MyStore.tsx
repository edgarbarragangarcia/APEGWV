import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import {
    Plus, Package, Trash2,
    Camera, Loader2, CheckCircle2,
    Info, Pencil
} from 'lucide-react';
import Card from '../components/Card';
import type { Database } from '../types/database.types';

type Product = Database['public']['Tables']['products']['Row'];

const MyStore: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; productId: string | null; productName: string }>({
        isOpen: false,
        productId: null,
        productName: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        category: 'Accesorios',
        image_url: ''
    });

    const categories = ['Clubes', 'Ropa', 'Accesorios', 'Bolas', 'Zapatos', 'Grips', 'Otros'];

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

            // Check Premium Status
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_premium) {
                setIsPremium(false);
                setLoading(false);
                return;
            }

            setIsPremium(true);

            // Fetch User Products
            const { data: userProducts, error } = await supabase
                .from('products')
                .select('*')
                .eq('seller_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProducts(userProducts || []);

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
        setFormData({ name: '', description: '', price: '', category: 'Accesorios', image_url: '' });
        setEditingId(null);
    };

    const handleEditClick = (product: Product) => {
        setFormData({
            name: product.name,
            description: product.description || '',
            price: product.price?.toString() || '',
            category: product.category || 'Accesorios',
            image_url: product.image_url || ''
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

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '80vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div className="animate-fade container" style={{ textAlign: 'center', paddingTop: '50px' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <Info size={48} color="var(--accent)" style={{ marginBottom: '20px' }} />
                    <h1 style={{ fontSize: '24px', marginBottom: '10px' }}>Opciones Premium</h1>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '25px', fontSize: '15px' }}>
                        Solo los miembros Premium pueden tener su propia tienda y vender productos a la comunidad.
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        className="glass"
                        style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '12px 25px', borderRadius: '15px', fontWeight: '800' }}
                    >
                        VOLVER AL PERFIL
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>Gestión de Productos</h2>

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
                                <input
                                    required
                                    type="number"
                                    value={formData.price}
                                    onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                    placeholder="0"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Descripción</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', minHeight: '80px', resize: 'none' }}
                                placeholder="Describe el estado de tu producto..."
                            />
                        </div>

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
                                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
                                                <span>{product.category}</span>
                                                <span>•</span>
                                                <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            </div>
                        ))
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
