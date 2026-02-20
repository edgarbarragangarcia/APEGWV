import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Calendar, TrendingUp, ChevronRight, Trash2, Pencil } from 'lucide-react';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
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
    status: string | null;
}

const RoundHistory: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [rounds, setRounds] = useState<Round[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; roundId: string | null; courseName: string }>({
        isOpen: false,
        roundId: null,
        courseName: ''
    });

    // Note: The provided snippet for `fetchRounds` seems to be mixing logic for 'rounds' and 'tournaments'
    // and introduces undefined variables like `editingId`, `setTournaments`, `tournaments` into this component.
    // To maintain syntactic correctness and avoid new build errors, I'm applying only the `setRounds` part
    // that aligns with the existing component's purpose of fetching rounds.
    // If the intention was to add tournament-related functionality, that would require more extensive changes
    // including state management for tournaments and a separate fetch function.
    useEffect(() => {
        const fetchRounds = async () => {
            if (!user) return;
            try {
                const { data, error } = await supabase
                    .from('rounds')
                    .select('id, course_name, course_location, date_played, total_score, first_nine_score, second_nine_score, status')
                    .eq('user_id', user.id)
                    .order('date_played', { ascending: false });

                if (error) throw error;
                setRounds((data as any[]) || []);
                // The following lines from the user's instruction are commented out
                // because they introduce undefined variables (editingId, setTournaments, tournaments)
                // and logic unrelated to fetching 'rounds' in the 'RoundHistory' component,
                // which would cause build errors.
                // if (editingId) {
                //     setTournaments(tournaments.map(t => t.id === editingId ? data as unknown as Tournament : t));
                // } else {
                //     setTournaments([data as unknown as Tournament, ...tournaments]);
                // }
            } catch (err) {
                console.error('Error fetching rounds:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRounds();
    }, [user]);

    const handleDelete = async () => {
        if (!deleteModal.roundId) return;

        try {
            const { error } = await supabase
                .from('rounds')
                .delete()
                .eq('id', deleteModal.roundId);

            if (error) throw error;

            setRounds(rounds.filter(r => r.id !== deleteModal.roundId));
            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteModal({ isOpen: false, roundId: null, courseName: '' });
        } catch (err) {
            console.error(err);
            alert('Error al eliminar');
        }
    };

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)'
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
                    title="Historial de Rondas"
                    onBack={() => navigate('/')}
                />
            </div>

            {/* Área de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 100px 20px',
                overflowX: 'hidden'
            }}>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="glass" style={{ padding: '20px', borderRadius: '20px' }}>
                                <Skeleton width="60%" height="18px" style={{ marginBottom: '8px' }} />
                                <Skeleton width="40%" height="14px" style={{ marginBottom: '15px' }} />
                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <Skeleton width="25%" height="14px" />
                                    <Skeleton width="25%" height="14px" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : rounds.length === 0 ? (
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
                                            setDeleteModal({
                                                isOpen: true,
                                                roundId: round.id,
                                                courseName: round.course_name
                                            });
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
                                    dragSnapToOrigin={false}
                                    style={{
                                        position: 'relative',
                                        zIndex: 1,
                                        x: 0,
                                        background: '#0d2b1d',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.08)'
                                    }}
                                    whileTap={{ cursor: 'grabbing' }}
                                >
                                    <Card
                                        style={{
                                            cursor: 'pointer',
                                            marginBottom: 0,
                                            background: 'rgba(255,b255,b255,0.02)',
                                            backdropFilter: 'none',
                                            border: 'none',
                                            borderRadius: '20px'
                                        }}
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
                            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '700' }}>¿Eliminar ronda?</h2>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar la ronda de <strong>{deleteModal.courseName}</strong>? Esta acción es permanente.
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
                                    onClick={handleDelete}
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
        </div>
    );
};

export default RoundHistory;
