import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronRight, BarChart3, X, History, Video, Shield, Trash2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import { supabase } from '../services/SupabaseManager';
import { COLOMBIAN_COURSES } from '../data/courses';
import PageHero from '../components/PageHero';

const PlayModeSelection: React.FC = () => {
    const navigate = useNavigate();
    const [hasActiveRound, setHasActiveRound] = React.useState(false);

    // Quick load from cache for "rapidisimo" feel
    const [stats, setStats] = React.useState<any>(() => {
        const saved = localStorage.getItem('cache_user_stats');
        return saved ? JSON.parse(saved) : null;
    });
    const [recentRounds, setRecentRounds] = React.useState<any[]>(() => {
        const saved = localStorage.getItem('cache_recent_rounds');
        return saved ? JSON.parse(saved) : [];
    });
    const [totalRoundsCount, setTotalRoundsCount] = React.useState<number>(() => {
        const saved = localStorage.getItem('cache_total_rounds_count');
        return saved ? parseInt(saved) : 0;
    });

    const [isLoadingStats, setIsLoadingStats] = React.useState(!stats);
    const [selectedRound, setSelectedRound] = React.useState<any>(null);
    const [deleteModal, setDeleteModal] = React.useState<{ isOpen: boolean; roundId: string | null; courseName: string }>({
        isOpen: false,
        roundId: null,
        courseName: ''
    });

    React.useEffect(() => {
        // Check if user just finished a game - if so, clear the flag and don't redirect
        // Use a ref to store the "just finished" status for the life of this mount
        const justFinished = sessionStorage.getItem('game_just_finished');
        if (justFinished === 'true') {
            // We only clear it when the component unmounts or after a long delay,
            // but for this mount, we consider the game as "just finished".
            sessionStorage.removeItem('game_just_finished');
            return;
        }

        const roundId = localStorage.getItem('round_id');
        const savedCourse = localStorage.getItem('round_course');
        const savedRecorrido = localStorage.getItem('round_recorrido');
        const savedGroupId = localStorage.getItem('round_group_id');

        if (roundId && savedCourse) {
            setHasActiveRound(true);
            const course = JSON.parse(savedCourse);
            // Automatic redirect to active round
            navigate('/round', {
                replace: true,
                state: {
                    course: course,
                    recorrido: savedRecorrido || undefined,
                    groupId: savedGroupId || undefined
                }
            });
            return;
        }

        // Check for active group invitations/memberships in Supabase
        const checkActiveGroup = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (!user) return;

                // Find groups I belong to that are NOT completed
                // We fetch group_members joined with game_groups
                const { data: members, error } = await supabase
                    .from('group_members')
                    .select(`
                        group_id,
                        status,
                        game_groups!inner(id, course_id, status)
                    `)
                    .eq('user_id', user.id);

                if (error) throw error;

                if (members && members.length > 0) {
                    // Filter for active games where I've ACCEPTED the invitation
                    // and the game is not yet completed.
                    const activeMember = members.find((m: any) =>
                        m.status === 'accepted' &&
                        m.game_groups &&
                        m.game_groups.status !== 'completed'
                    );

                    if (activeMember) {
                        const groupData = (activeMember as any).game_groups;

                        // Check if I have already completed my round explicitly
                        const { data: myRound } = await supabase
                            .from('rounds')
                            .select('status')
                            .eq('group_id', activeMember.group_id || '')
                            .eq('user_id', user.id)
                            .eq('status', 'completed')
                            .maybeSingle();

                        if (myRound) {
                            // I have finished my round, so I shouldn't be redirected back
                            return;
                        }

                        // If the group is in any status other than 'active', maybe don't redirect automatically
                        if (groupData.status !== 'active') {
                            return;
                        }

                        const course = COLOMBIAN_COURSES.find(c => c.id === groupData.course_id);

                        if (course) {
                            setHasActiveRound(true);
                            navigate('/round', {
                                replace: true,
                                state: {
                                    course: course,
                                    groupId: activeMember.group_id
                                }
                            });
                        }
                    }
                }
            } catch (err) {
                console.error('Error checking active groups:', err);
            }
        };

        checkActiveGroup();

        // Fetch user stats and recent rounds
        const fetchDashboardData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                const user = session?.user;
                if (!user) return;

                // Fetch Profile Stats
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setStats(profile);
                    localStorage.setItem('cache_user_stats', JSON.stringify(profile));
                }

                const { data: rounds } = await supabase
                    .from('rounds')
                    .select('id, course_name, total_score, date_played, status, round_holes(score)')
                    .eq('user_id', user.id)
                    .order('date_played', { ascending: false })
                    .limit(5);

                if (rounds) {
                    setRecentRounds(rounds);
                    localStorage.setItem('cache_recent_rounds', JSON.stringify(rounds));
                }

                // Fetch total rounds count directly from DB for accuracy
                const { count, error: countError } = await supabase
                    .from('rounds')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', user.id);

                if (!countError && count !== null) {
                    setTotalRoundsCount(count);
                    localStorage.setItem('cache_total_rounds_count', count.toString());
                }
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setIsLoadingStats(false);
            }
        };

        fetchDashboardData();

    }, [navigate]);

    const handleRoundClick = (round: any) => {
        setSelectedRound(round);
    };

    const handleDeleteRound = (e: React.MouseEvent, roundId: string, courseName: string) => {
        e.stopPropagation();
        setDeleteModal({
            isOpen: true,
            roundId,
            courseName
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.roundId) return;

        try {
            const { error } = await supabase
                .from('rounds')
                .delete()
                .eq('id', deleteModal.roundId);

            if (error) throw error;

            // Simple snappy updates
            const updatedRounds = recentRounds.filter(r => r.id !== deleteModal.roundId);
            setRecentRounds(updatedRounds);
            localStorage.setItem('cache_recent_rounds', JSON.stringify(updatedRounds));

            const newCount = Math.max(0, totalRoundsCount - 1);
            setTotalRoundsCount(newCount);
            localStorage.setItem('cache_total_rounds_count', newCount.toString());

            if (updatedRounds.length === 0) {
                setSelectedRound(null);
            }

            if (navigator.vibrate) navigator.vibrate(50);
            setDeleteModal({ isOpen: false, roundId: null, courseName: '' });
        } catch (err) {
            console.error('Error deleting round:', err);
            alert('Error al eliminar el registro.');
        }
    };

    const modes = [
        {
            id: 'individual',
            title: 'Juego Individual',
            description: 'Registra tu propio puntaje y estadísticas personales.',
            icon: User,
            color: 'var(--secondary)',
            accent: 'rgba(163, 230, 53, 0.5)',
            silver: 'linear-gradient(90deg, #e2e8f0 0%, #ffffff 50%, #e2e8f0 100%)',
            path: '/select-course'
        },
        {
            id: 'group',
            title: 'Juego en Grupo',
            description: 'Compite en tiempo real y gestiona el grupo con amigos.',
            icon: Users,
            color: '#60a5fa',
            accent: 'rgba(96, 165, 250, 0.5)',
            silver: 'linear-gradient(90deg, #cbd5e1 0%, #f8fafc 50%, #cbd5e1 100%)',
            path: '/friend-selection'
        }
    ];

    return (
        <div style={{
            position: 'absolute',
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
                    title="Modo de Juego"
                    subtitle="¿Cómo deseas jugar hoy?"
                    showBack={true}
                    onBack={() => navigate('/')}
                />
            </div>

            {/* Area de Contenido - Flexbox Vertical sin Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 160px)',
                left: '0',
                right: '0',
                bottom: 'calc(55px + var(--safe-bottom) + 10px)',
                overflow: 'hidden',
                padding: '6px 20px 10px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                zIndex: 1,
                pointerEvents: 'auto'
            }}>
                {/* User Stats Dashboard - Fixed position with Skeleton */}
                <div
                    style={{
                        flexShrink: 0,
                        background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                        borderRadius: '18px',
                        padding: '10px 14px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        minHeight: 'auto'
                    }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <BarChart3 size={14} color="var(--secondary)" />
                            <span style={{ fontSize: '11px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Dashboard Personal</span>
                        </div>
                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '2px 8px', borderRadius: '100px', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                            <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--secondary)' }}>
                                HCP: {isLoadingStats ? '...' : (stats?.handicap || 'N/A')}
                            </span>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '4px'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>
                                {isLoadingStats ? '--' : (stats?.best_score || '--')}
                            </div>
                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' }}>Mejor Score</div>
                        </div>
                        <div style={{ textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.05)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: '16px', fontWeight: '900', color: 'white' }}>
                                {isLoadingStats ? '--' : (stats?.average_score || '--')}
                            </div>
                            <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase' }}>Promedio</div>
                        </div>
                        <motion.div
                            whileTap={{ scale: 0.95 }}
                            onClick={() => recentRounds.length > 0 && handleRoundClick(recentRounds[0])}
                            style={{
                                textAlign: 'center',
                                cursor: recentRounds.length > 0 ? 'pointer' : 'default',
                                position: 'relative',
                                padding: '4px',
                                borderRadius: '12px',
                                background: recentRounds.length > 0 ? 'rgba(163, 230, 53, 0.05)' : 'transparent',
                                border: recentRounds.length > 0 ? '1px solid rgba(163, 230, 53, 0.1)' : '1px solid transparent',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <div style={{ fontSize: '16px', fontWeight: '900', color: recentRounds.length > 0 ? 'var(--secondary)' : 'white' }}>
                                {isLoadingStats ? '--' : (totalRoundsCount || '--')}
                            </div>
                            <div style={{ fontSize: '8px', color: recentRounds.length > 0 ? 'var(--secondary)' : 'rgba(255,255,255,0.4)', fontWeight: '600', textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                Rondas {recentRounds.length > 0 && (
                                    <motion.div
                                        animate={{ scale: [1, 1.2, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                    >
                                        <History size={8} />
                                    </motion.div>
                                )}
                            </div>
                            {recentRounds.length > 0 && (
                                <div style={{
                                    fontSize: '6px',
                                    color: 'rgba(163, 230, 53, 0.5)',
                                    fontWeight: '800',
                                    marginTop: '1px',
                                    letterSpacing: '0.5px'
                                }}>
                                    VER RECIENTES
                                </div>
                            )}
                        </motion.div>
                    </div>

                </div>

                {/* Mode Title Separator */}
                <div style={{ flexShrink: 0, fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', marginLeft: '4px' }}>Selecciona tu modo</div>

                {hasActiveRound ? (
                    // Redirecting...
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <p>Reanudando partida...</p>
                    </div>
                ) : (
                    <>
                        {/* UI normal de selección de modo con Grid Responsivo */}
                        <div className="play-mode-grid" style={{ pointerEvents: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {modes.map((mode) => (
                                <motion.div
                                    key={mode.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => {
                                        console.log('Navigating to:', mode.path);
                                        navigate(mode.path);
                                    }}
                                    style={{
                                        position: 'relative',
                                        borderRadius: '24px',
                                        padding: '2px',
                                        overflow: 'hidden',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        cursor: 'pointer',
                                        transition: 'background 0.3s ease',
                                        height: '90px',
                                    }}
                                >
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `conic-gradient(from 0deg at 50% 50%, transparent 0%, ${mode.accent} 25%, transparent 50%, ${mode.accent} 75%, transparent 100%)`,
                                        animation: 'border-run 6s linear infinite',
                                        opacity: 0.2,
                                        zIndex: 0
                                    }} />

                                    <div style={{
                                        position: 'relative',
                                        flex: 1,
                                        background: 'rgba(14, 47, 31, 0.98)',
                                        borderRadius: '22px',
                                        margin: '1px',
                                        zIndex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        padding: '10px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px'
                                        }}>
                                            <div style={{
                                                width: '32px',
                                                height: '32px',
                                                borderRadius: '10px',
                                                background: `rgba(255,255,255,0.05)`,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: mode.color,
                                                border: '1px solid rgba(255,255,255,0.08)'
                                            }}>
                                                <mode.icon size={16} />
                                            </div>
                                            <div>
                                                <h3 style={{ fontSize: '13px', fontWeight: '900', color: '#fff', marginBottom: '2px' }}>{mode.title}</h3>
                                                <p style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '600', lineHeight: 1 }}>{mode.id === 'individual' ? 'Juega solo' : 'Con amigos'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* New Hub Sections */}
                        <div style={{ flexShrink: 0, fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', marginLeft: '4px', marginTop: '2px' }}>Herramientas de Golf</div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <HubListButton
                                icon={Video}
                                title="Swing IA"
                                subtitle="Análisis técnico"
                                onClick={() => navigate('/swing-analysis')}
                            />
                            <HubListButton
                                icon={Shield}
                                title="Mi Talega"
                                subtitle="Palos y distancias"
                                onClick={() => navigate('/my-bag')}
                            />
                        </div>


                    </>
                )}
            </div>

            {/* Round Details Overlay */}
            <AnimatePresence>
                {selectedRound && (
                    <>
                        <motion.div key="round-details" 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedRound(null)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                background: 'rgba(0,0,0,0.8)',
                                backdropFilter: 'blur(20px)',
                                zIndex: 2000
                            }}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'fixed',
                                left: 0,
                                right: 0,
                                bottom: 0,
                                width: '100%',
                                maxWidth: 'var(--app-max-width)',
                                margin: '0 auto',
                                background: 'linear-gradient(180deg, #1A4D35 0%, #0E2F1F 100%)',
                                borderTopLeftRadius: '32px',
                                borderTopRightRadius: '32px',
                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                padding: '30px 24px calc(40px + env(safe-area-inset-bottom)) 24px',
                                zIndex: 2001,
                                boxShadow: '0 -20px 40px rgba(0,0,0,0.5)',
                                top: 'calc(var(--header-offset-top) + 75px)', // Raised to reach near navbar
                                overflowY: 'auto'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <History size={20} color="var(--secondary)" />
                                    </div>
                                    <h2 style={{ fontSize: '20px', fontWeight: '800', color: 'white' }}>Últimos Juegos</h2>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setSelectedRound(null)}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {recentRounds.map((round) => (
                                    <motion.div
                                        key={round.id}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate(`/rounds/${round.id}`)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '16px 20px',
                                            background: 'rgba(255,255,255,0.03)',
                                            borderRadius: '24px',
                                            border: '1px solid rgba(255,255,255,0.05)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '800', color: 'white' }}>{round.course_name || 'Campo desconocido'}</span>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>{new Date(round.date_played).toLocaleDateString()}</span>
                                                {round.status === 'completed' && (
                                                    <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '2px 6px', borderRadius: '4px', fontWeight: '700' }}>FINALIZADO</span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'var(--secondary)' }}>
                                                    {round.status === 'completed'
                                                        ? round.total_score
                                                        : (round.round_holes?.reduce((acc: number, h: any) => acc + (h.score || 0), 0) || 0)
                                                    }
                                                </div>
                                                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '700', textTransform: 'uppercase' }}>Score</div>
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.8 }}
                                                onClick={(e) => handleDeleteRound(e, round.id, round.course_name || 'este juego')}
                                                style={{
                                                    width: '32px',
                                                    height: '32px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.1)',
                                                    marginLeft: '4px'
                                                }}
                                            >
                                                <Trash2 size={14} />
                                            </motion.button>

                                            <ChevronRight size={18} color="rgba(255,255,255,0.2)" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Custom Confirmation Modal */}
            <AnimatePresence>
                {deleteModal.isOpen && (
                    <div key="delete-modal"  style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0,0,0,0.85)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 11000,
                        padding: '20px',
                        backdropFilter: 'blur(8px)'
                    }}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
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
                                border: '1px solid rgba(255,255,255,0.1)',
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
                            <h2 style={{ fontSize: '20px', marginBottom: '10px', fontWeight: '800', color: 'white' }}>¿Eliminar registro?</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '30px', lineHeight: '1.5' }}>
                                ¿Estás seguro que deseas eliminar el registro de <strong>{deleteModal.courseName}</strong>? Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                                    style={{
                                        flex: 1,
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontWeight: '700',
                                        fontSize: '14px'
                                    }}
                                >
                                    No
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    style={{
                                        flex: 1,
                                        background: '#ef4444',
                                        color: 'white',
                                        padding: '14px',
                                        borderRadius: '16px',
                                        border: 'none',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
                                    }}
                                >
                                    Eliminar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};


const HubListButton = ({ icon: Icon, title, subtitle, onClick, badge }: any) => (
    <motion.div
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        style={{
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            padding: '8px 14px',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            cursor: 'pointer'
        }}
    >
        <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
            <Icon size={16} color="rgba(255,255,255,0.6)" />
        </div>
        <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', margin: 0 }}>{title}</h4>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>{subtitle}</p>
        </div>
        {badge && (
            <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', background: 'rgba(163, 230, 53, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                {badge}
            </span>
        )}
        <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
    </motion.div>
);

export default PlayModeSelection;
