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
                const { data: { user } } = await supabase.auth.getUser();
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

    }, [navigate]);

    // const handleResumeRound was here
    // const handleDiscardRound was here

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
                                    position: 'relative',
                                    borderRadius: '32px',
                                    padding: '2px', // This creates the "border width"
                                    overflow: 'hidden',
                                    background: 'rgba(255, 255, 255, 0.05)', // Fallback
                                    display: 'flex',
                                    alignItems: 'stretch',
                                    justifyContent: 'stretch',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                                className="active:scale-[0.97]"
                            >
                                {/* THE ANIMATED BORDER: A rotating gradient behind the card */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-50%',
                                    left: '-50%',
                                    width: '200%',
                                    height: '200%',
                                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 120deg, #e2e8f0 180deg, transparent 240deg, transparent 360deg)',
                                    animation: 'border-run 6s linear infinite',
                                    zIndex: 0
                                }} />

                                {/* THE CARD CONTENT: Sits inside the border */}
                                <div style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    width: '100%',
                                    background: 'rgba(10, 25, 15, 0.95)',
                                    borderRadius: '30px', // Slightly smaller than outer to fit inside
                                    padding: '30px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    backdropFilter: 'blur(20px)'
                                }}>
                                    {/* Static Silver Inner Border for extra sharpness */}
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        borderRadius: '30px',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        pointerEvents: 'none'
                                    }} />

                                    {/* Background Glows */}
                                    <div style={{
                                        position: 'absolute',
                                        top: '-40%',
                                        right: '-20%',
                                        width: '180px',
                                        height: '180px',
                                        background: mode.color,
                                        filter: 'blur(80px)',
                                        opacity: 0.1,
                                        zIndex: -1
                                    }} />

                                    <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '20px',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative',
                                        zIndex: 1
                                    }}>
                                        <mode.icon size={30} color={mode.color} strokeWidth={2} />
                                    </div>

                                    <div style={{ position: 'relative', zIndex: 1 }}>
                                        <h3 style={{
                                            fontSize: '24px',
                                            fontWeight: '900',
                                            color: 'white',
                                            marginBottom: '6px',
                                            letterSpacing: '-0.025em'
                                        }}>
                                            {mode.title}
                                        </h3>
                                        <p style={{
                                            fontSize: '15px',
                                            color: 'rgba(255,255,255,0.5)',
                                            lineHeight: '1.4',
                                            maxWidth: '90%',
                                            fontWeight: '400'
                                        }}>
                                            {mode.description}
                                        </p>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        marginTop: '8px',
                                        zIndex: 1
                                    }}>
                                        Explorar <ChevronRight size={16} strokeWidth={3} />
                                    </div>
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
