import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import {
    ChevronLeft, Plus, Package, Trash2,
    Camera, Loader2, CheckCircle2,
    Info
} from 'lucide-react';
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

            const { data, error } = await supabase
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

            if (error) throw error;

            setProducts([data, ...products]);
            setShowForm(false);
            setFormData({ name: '', description: '', price: '', category: 'Accesorios', image_url: '' });
        } catch (err) {
            console.error('Error saving product:', err);
            alert('Error al guardar el producto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;
            setProducts(products.filter(p => p.id !== id));
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
            <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button onClick={() => navigate(-1)} className="glass" style={{ padding: '10px', borderRadius: '12px' }}>
                        <ChevronLeft size={20} />
                    </button>
                    <h1 style={{ fontSize: '24px' }}>Mi Tienda</h1>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        style={{ background: 'var(--secondary)', color: 'var(--primary)', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                        <Plus size={24} />
                    </button>
                )}
            </header>

            {showForm ? (
                <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Nuevo Producto</h2>
                        <button type="button" onClick={() => setShowForm(false)} style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Cancelar</button>
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
                            <div key={product.id} className="glass" style={{ padding: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <img
                                    src={product.image_url || ''}
                                    style={{ width: '70px', height: '70px', borderRadius: '12px', objectFit: 'cover' }}
                                    alt={product.name}
                                />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '2px' }}>{product.name}</h3>
                                    <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: 'var(--text-dim)' }}>
                                        <span>{product.category}</span>
                                        <span>•</span>
                                        <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={() => handleDelete(product.id)}
                                        style={{ padding: '8px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default MyStore;
