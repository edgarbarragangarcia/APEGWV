import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { supabase } from '../services/SupabaseManager';
import { COLOMBIAN_COURSES } from '../data/courses';

const PlayModeSelection: React.FC = () => {
    const navigate = useNavigate();
    const [hasActiveRound, setHasActiveRound] = React.useState(false);

    React.useEffect(() => {
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
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // Find groups I belong to that are NOT completed
                // We fetch group_members joined with game_groups
                const { data: members, error } = await supabase
                    .from('group_members')
                    .select(`
                        group_id,
                        game_groups!inner(id, course_id, status)
                    `)
                    .eq('user_id', user.id);

                if (error) throw error;

                if (members && members.length > 0) {
                    // Filter for active games manually to be safe
                    // We consider 'pending' or 'in_progress' to be active. Only 'completed' is finished.
                    // Note: TS might complain about nested types, referencing as 'any' for safety inside logic
                    const activeMember = members.find((m: any) =>
                        m.game_groups && m.game_groups.status !== 'completed'
                    );

                    if (activeMember) {
                        const groupData = (activeMember as any).game_groups;
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

    }, [navigate]);

    // const handleResumeRound was here
    // const handleDiscardRound was here

    const modes = [
        {
            id: 'individual',
            title: 'Juego Individual',
            description: 'Juega una partida solo y registra tu propio puntaje y estadísticas.',
            icon: User,
            color: 'var(--secondary)',
            gradient: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(163, 230, 53, 0.05) 100%)',
            path: '/select-course'
        },
        {
            id: 'group',
            title: 'Juego en Grupo',
            description: 'Invita a tus amigos, compite en tiempo real y gestiona el grupo.',
            icon: Users,
            color: '#3b82f6',
            gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.05) 100%)',
            path: '/friend-selection'
        }
    ];

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
            background: 'var(--primary)',
            zIndex: 500
        }} className="animate-fade">

            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'var(--primary)',
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

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 80px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 40px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                {hasActiveRound ? (
                    // Redirecting...
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-dim)' }}>
                        <p>Reanudando partida...</p>
                    </div>
                ) : (
                    // UI normal de selección de modo
                    <>
                        {modes.map((mode) => (
                            <div
                                key={mode.id}
                                onClick={() => navigate(mode.path)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '30px',
                                    padding: '25px',
                                    border: '1px solid var(--glass-border)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}
                            >
                                {/* Background Glow */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-20%',
                                    right: '-10%',
                                    width: '40%',
                                    height: '60%',
                                    background: mode.color,
                                    filter: 'blur(60px)',
                                    opacity: 0.1,
                                    zIndex: 0
                                }} />

                                <div style={{
                                    width: '60px',
                                    height: '60px',
                                    borderRadius: '20px',
                                    background: mode.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '5px',
                                    position: 'relative',
                                    zIndex: 1
                                }}>
                                    <mode.icon size={32} color={mode.color} />
                                </div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h3 style={{
                                        fontSize: '24px',
                                        fontWeight: '900',
                                        color: 'white',
                                        marginBottom: '8px'
                                    }}>
                                        {mode.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'var(--text-dim)',
                                        lineHeight: '1.5',
                                        maxWidth: '85%'
                                    }}>
                                        {mode.description}
                                    </p>
                                </div>

                                <div style={{
                                    position: 'absolute',
                                    right: '30px',
                                    bottom: '30px',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '15px',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <ChevronRight size={20} />
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayModeSelection;
