import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Save, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';


const EditStats: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<{
        average_score: string;
        putts_avg: string;
        fairways_hit_rate: string;
    }>({
        average_score: '',
        putts_avg: '',
        fairways_hit_rate: ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('profiles')
                    .select('average_score, putts_avg, fairways_hit_rate')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (error) throw error;

                if (data) {
                    setFormData({
                        average_score: data.average_score?.toString() || '',
                        putts_avg: data.putts_avg?.toString() || '',
                        fairways_hit_rate: data.fairways_hit_rate?.toString() || ''
                    });
                }
            } catch (err) {
                console.error('Error fetching stats:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [navigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const updates = {
                id: session.user.id,
                average_score: formData.average_score ? parseFloat(formData.average_score) : 0,
                putts_avg: formData.putts_avg ? parseFloat(formData.putts_avg) : 0,
                fairways_hit_rate: formData.fairways_hit_rate ? parseFloat(formData.fairways_hit_rate) : 0,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            navigate('/profile');
        } catch (error) {
            console.error('Error updating stats:', error);
            alert('Error updating stats');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)',
            position: 'fixed',
            inset: 0
        }}>
            <PageHero image="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" />

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
                    title="Editar Estadísticas"
                    onBack={() => navigate('/profile')}
                />
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                            Promedio de Golpes (Avg Score)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="glass"
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                            value={formData.average_score}
                            onChange={e => setFormData({ ...formData, average_score: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                            Promedio de Putts
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            className="glass"
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                            value={formData.putts_avg}
                            onChange={e => setFormData({ ...formData, putts_avg: e.target.value })}
                        />
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-dim)' }}>
                            Fairways acertados (%)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            max="100"
                            className="glass"
                            style={{ width: '100%', padding: '15px', borderRadius: '12px', border: 'none', color: 'var(--text)' }}
                            value={formData.fairways_hit_rate}
                            onChange={e => setFormData({ ...formData, fairways_hit_rate: e.target.value })}
                        />
                    </div>

                    <button
                        type="submit"
                        className="primary-button"
                        disabled={saving}
                        style={{
                            marginTop: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px'
                        }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Guardando...' : 'Guardar Estadísticas'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditStats;
