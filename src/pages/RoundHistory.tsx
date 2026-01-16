import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { ArrowLeft, Calendar, TrendingUp, Loader2, ChevronRight, Trash2, Pencil } from 'lucide-react';
import Card from '../components/Card';

interface Round {
    id: string;
    course_name: string;
    course_location: string;
    date_played: string;
    total_score: number;
    first_nine_score?: number;
    second_nine_score?: number;
    status: string;
}

const RoundHistory: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [rounds, setRounds] = useState<Round[]>([]);

    useEffect(() => {
        const fetchRounds = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    navigate('/auth');
                    return;
                }

                const { data, error } = await supabase
                    .from('rounds')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('date_played', { ascending: false });

                if (error) throw error;
                setRounds(data || []);
            } catch (err) {
                console.error('Error fetching rounds:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRounds();
    }, [navigate]);

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--text)' }}>
                    <ArrowLeft size={24} />
                </button>
                <h1 style={{ fontSize: '24px', margin: 0 }}>Historial de Rondas</h1>
            </div>

            {rounds.length === 0 ? (
                <Card>
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <Calendar size={48} color="var(--text-dim)" style={{ margin: '0 auto 20px' }} />
                        <h3 style={{ marginBottom: '10px' }}>No hay rondas registradas</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>
                            Comienza a registrar tus rondas para ver tu progreso
                        </p>
                        <button
                            onClick={() => navigate('/select-course')}
                            style={{
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                padding: '14px 24px',
                                borderRadius: '12px',
                                fontWeight: '700',
                                fontSize: '14px',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Iniciar Nueva Ronda
                        </button>
                    </div>
                </Card>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '0 5px' }}>
                    {rounds.map((round) => (
                        <div key={round.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px', userSelect: 'none', touchAction: 'pan-y' }}>
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
                                        navigate(`/rounds/edit/${round.id}`);
                                    }}
                                    style={{
                                        flex: 1,
                                        background: '#3b82f6',
                                        border: 'none',
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
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        if (confirm(`¿Eliminar la ronda de ${round.course_name}?`)) {
                                            try {
                                                const { error } = await supabase
                                                    .from('rounds')
                                                    .delete()
                                                    .eq('id', round.id);
                                                if (error) throw error;
                                                setRounds(rounds.filter(r => r.id !== round.id));
                                                if (navigator.vibrate) navigator.vibrate(50);
                                            } catch (err) {
                                                console.error(err);
                                                alert('Error al eliminar');
                                            }
                                        }
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
                                dragElastic={0.05}
                                dragSnapToOrigin={false} // We want it to stay open or close based on distance
                                onDragEnd={() => {
                                    // If we dragged more than half the distance, stay open, else close
                                    // Actually, simple constraint is usually enough, but we want it to feel "snappy"
                                }}
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    x: 0
                                }}
                                whileTap={{ cursor: 'grabbing' }}
                            >
                                <Card
                                    style={{ cursor: 'pointer', marginBottom: 0 }}
                                    onClick={() => navigate(`/rounds/${round.id}`)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '16px', marginBottom: '5px' }}>{round.course_name}</h3>
                                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '10px' }}>
                                                {round.course_location} • {new Date(round.date_played).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                            <div style={{ display: 'flex', gap: '15px', fontSize: '13px' }}>
                                                <div>
                                                    <span style={{ color: 'var(--text-dim)' }}>Score: </span>
                                                    <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{round.total_score}</span>
                                                </div>
                                                {round.first_nine_score && round.second_nine_score && (
                                                    <div>
                                                        <span style={{ color: 'var(--text-dim)' }}>Vueltas: </span>
                                                        <span style={{ fontWeight: '600' }}>{round.first_nine_score} / {round.second_nine_score}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {round.status === 'completed' && (
                                                <div style={{
                                                    background: 'var(--primary-light)',
                                                    padding: '4px 8px',
                                                    borderRadius: '6px',
                                                    fontSize: '11px',
                                                    fontWeight: '600'
                                                }}>
                                                    Completada
                                                </div>
                                            )}
                                            <ChevronRight size={20} color="var(--text-dim)" />
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>
                    ))}
                </div>
            )}

            {rounds.length > 0 && (
                <div style={{ marginTop: '30px', textAlign: 'center' }}>
                    <button
                        onClick={() => navigate('/select-course')}
                        style={{
                            width: '100%',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '14px',
                            borderRadius: '12px',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        <TrendingUp size={18} />
                        Iniciar Nueva Ronda
                    </button>
                </div>
            )}
        </div>
    );
};

export default RoundHistory;
