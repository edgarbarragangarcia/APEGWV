import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Save, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

interface Round {
    id: string;
    course_name: string;
    course_location: string | null;
    date_played: string;
    total_score: number | null;
    first_nine_score: number | null;
    second_nine_score: number | null;
}

const EditRound: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [round, setRound] = useState<Round | null>(null);

    useEffect(() => {
        const fetchRound = async () => {
            if (!id) return;
            try {
                const { data: roundData, error: roundError } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (roundError) throw roundError;
                setRound(roundData as Round);
            } catch (err) {
                console.error('Error fetching round:', err);
                navigate('/rounds');
            } finally {
                setLoading(false);
            }
        };

        fetchRound();
    }, [id, navigate]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!round) return;

        setSaving(true);
        try {
            const { error } = await supabase
                .from('rounds')
                .update({
                    course_name: round.course_name,
                    course_location: round.course_location,
                    date_played: round.date_played,
                    total_score: round.total_score,
                    first_nine_score: round.first_nine_score,
                    second_nine_score: round.second_nine_score
                })
                .eq('id', round.id);

            if (error) throw error;
            navigate('/rounds');
        } catch (err) {
            console.error('Error updating round:', err);
            alert('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    if (!round) return null;

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)'
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
                    title="Editar Ronda"
                    onBack={() => navigate('/rounds')}
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

                <form onSubmit={handleSave}>
                    <Card>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>NOMBRE DEL CAMPO</label>
                                <input
                                    type="text"
                                    value={round.course_name}
                                    onChange={(e) => setRound({ ...round, course_name: e.target.value })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,b255,b255,0.05)',
                                        border: '1px solid rgba(255,b255,b255,0.1)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>UBICACIÓN</label>
                                <input
                                    type="text"
                                    value={round.course_location || ''}
                                    onChange={(e) => setRound({ ...round, course_location: e.target.value || null })}
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255,b255,b255,0.05)',
                                        border: '1px solid rgba(255,b255,b255,0.1)',
                                        borderRadius: '10px',
                                        padding: '12px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>FECHA</label>
                                    <input
                                        type="date"
                                        value={round.date_played.split('T')[0]}
                                        onChange={(e) => setRound({ ...round, date_played: e.target.value })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,b255,b255,0.05)',
                                            border: '1px solid rgba(255,b255,b255,0.1)',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>SCORE TOTAL</label>
                                    <input
                                        type="number"
                                        value={round.total_score || ''}
                                        onChange={(e) => setRound({ ...round, total_score: parseInt(e.target.value) || null })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,b255,b255,0.05)',
                                            border: '1px solid rgba(255,b255,b255,0.1)',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>FRONT 9</label>
                                    <input
                                        type="number"
                                        value={round.first_nine_score || ''}
                                        onChange={(e) => setRound({ ...round, first_nine_score: parseInt(e.target.value) || null })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,b255,b255,0.05)',
                                            border: '1px solid rgba(255,b255,b255,0.1)',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-dim)', marginBottom: '8px' }}>BACK 9</label>
                                    <input
                                        type="number"
                                        value={round.second_nine_score || ''}
                                        onChange={(e) => setRound({ ...round, second_nine_score: parseInt(e.target.value) || null })}
                                        style={{
                                            width: '100%',
                                            background: 'rgba(255,b255,b255,0.05)',
                                            border: '1px solid rgba(255,b255,b255,0.1)',
                                            borderRadius: '10px',
                                            padding: '12px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <button
                        type="submit"
                        disabled={saving}
                        style={{
                            width: '100%',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '16px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '10px'
                        }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EditRound;
