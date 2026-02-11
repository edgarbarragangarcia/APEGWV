import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Plus, Ticket, Trash2, Loader2, CheckCircle2, Copy } from 'lucide-react';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

interface Coupon {
    id: string;
    code: string;
    discount_type: 'percent' | 'fixed';
    value: number;
    valid_until: string | null;
    usage_limit: number | null;
    used_count: number;
    active: boolean;
}

const CouponManager: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        discount_type: 'percent',
        value: '',
        valid_until: '',
        usage_limit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    const fetchCoupons = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await (supabase
                .from('coupons' as any)
                .select('*')
                .eq('creator_id', user.id) // Assuming coupons are per-user/organizer
                .order('created_at', { ascending: false })) as any;

            if (error) {
                // If table doesn't exist, we might get an error. 
                // We'll just ignore and show empty for now, or log it.
                console.warn('Could not fetch coupons (table might be missing)', error);
            } else {
                setCoupons(data as unknown as Coupon[] || []);
            }
        } catch (err) {
            console.error('Error fetching coupons:', err);
        } finally {
            setLoading(false);
        }
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = '';
        for (let i = 0; i < 8; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setFormData(prev => ({ ...prev, code: result }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const newCoupon = {
                code: formData.code.toUpperCase(),
                discount_type: formData.discount_type,
                value: parseFloat(formData.value),
                valid_until: formData.valid_until || null,
                usage_limit: formData.usage_limit ? parseInt(formData.usage_limit) : null,
                creator_id: user.id,
                active: true,
                used_count: 0
            };

            const { data, error } = await (supabase
                .from('coupons' as any)
                .insert([newCoupon])
                .select()
                .single()) as any;

            if (error) throw error;

            setCoupons([data as unknown as Coupon, ...coupons]);
            setShowForm(false);
            setFormData({
                code: '',
                discount_type: 'percent',
                value: '',
                valid_until: '',
                usage_limit: ''
            });
        } catch (err) {
            console.error('Error creating coupon:', err);
            alert('Error al crear el cupón. Verifica que la tabla "coupons" exista.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Eliminar cupón?')) return;
        try {
            const { error } = await (supabase.from('coupons' as any).delete().eq('id', id));
            if (error) throw error;
            setCoupons(coupons.filter(c => c.id !== id));
        } catch (err) {
            console.error('Error deleting coupon:', err);
        }
    };

    const copyToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopySuccess(code);
        setTimeout(() => setCopySuccess(null), 2000);
    };

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <PageHero />
            <div style={{ flexShrink: 0, zIndex: 10, background: 'transparent', padding: '0 20px', paddingTop: 'var(--header-offset-top)' }}>
                <PageHeader title="Generar Cupones" onBack={() => navigate('/my-events')} />
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px calc(var(--nav-height) + 20px) 20px',
                display: 'flex',
                flexDirection: 'column',
                WebkitOverflowScrolling: 'touch',
                gap: '20px'
            }}>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="btn-primary"
                    >
                        <Plus size={18} />
                        <span>Crear Nuevo Cupón</span>
                    </button>
                )}

                {showForm ? (
                    <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white' }}>Nuevo Cupón</h3>
                            <button type="button" onClick={() => setShowForm(false)} style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Cancelar</button>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Código</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', textTransform: 'uppercase' }}
                                    placeholder="EJ: VERANO2024"
                                />
                                <button
                                    type="button"
                                    onClick={generateCode}
                                    style={{ background: 'rgba(255,255,255,0.1)', padding: '0 15px', borderRadius: '12px', color: 'white', fontSize: '13px', fontWeight: '600' }}
                                >
                                    Generar
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Tipo</label>
                                <select
                                    value={formData.discount_type}
                                    onChange={e => setFormData({ ...formData, discount_type: e.target.value as any })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', outline: 'none' }}
                                >
                                    <option value="percent">Porcentaje (%)</option>
                                    <option value="fixed">Monto Fijo ($)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Valor</label>
                                <input
                                    required
                                    type="number"
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                    placeholder="Ej: 10 or 50000"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Límite de Usos (Opcional)</label>
                            <input
                                type="number"
                                value={formData.usage_limit}
                                onChange={e => setFormData({ ...formData, usage_limit: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                placeholder="Sin límite"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            className={saving ? 'btn-disabled' : 'btn-primary'}
                            style={{ marginTop: '10px' }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            {saving ? 'Guardando...' : 'Crear Cupón'}
                        </button>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {loading ? (
                            [1, 2, 3].map(i => <Skeleton key={i} height="80px" borderRadius="18px" />)
                        ) : coupons.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                                <Ticket size={48} style={{ opacity: 0.3, marginBottom: '15px', marginInline: 'auto' }} />
                                <p>No has generado cupones aún.</p>
                            </div>
                        ) : (
                            coupons.map(coupon => (
                                <Card key={coupon.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '15px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '12px',
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--secondary)'
                                    }}>
                                        <Ticket size={24} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'white', letterSpacing: '1px' }}>{coupon.code}</h4>
                                            <button
                                                onClick={() => copyToClipboard(coupon.code)}
                                                style={{ color: copySuccess === coupon.code ? 'var(--secondary)' : 'var(--text-dim)', background: 'none', border: 'none', padding: '4px' }}
                                            >
                                                {copySuccess === coupon.code ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                                            </button>
                                        </div>
                                        <p style={{ color: 'var(--secondary)', fontWeight: '700', fontSize: '13px' }}>
                                            {coupon.discount_type === 'percent' ? `${coupon.value}% OFF` : `$${coupon.value.toLocaleString()} OFF`}
                                        </p>
                                        <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                            {coupon.usage_limit ? `${coupon.used_count}/${coupon.usage_limit} usados` : `${coupon.used_count} usados`}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(coupon.id)}
                                        style={{
                                            background: 'rgba(255, 107, 107, 0.1)',
                                            color: '#ff6b6b',
                                            border: 'none',
                                            borderRadius: '10px',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </Card>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CouponManager;
