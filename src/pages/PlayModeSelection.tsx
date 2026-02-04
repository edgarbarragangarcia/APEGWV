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
            description: 'Juega una partida solo y registra tu propio puntaje y estadísticas.',
            icon: User,
            color: 'var(--secondary)',
            accent: 'rgba(163, 230, 53, 0.5)',
            gradient: 'linear-gradient(135deg, rgba(163, 230, 53, 0.2) 0%, rgba(163, 230, 53, 0.02) 100%)',
            path: '/select-course'
        },
        {
            id: 'group',
            title: 'Juego en Grupo',
            description: 'Invita a tus amigos, compite en tiempo real y gestiona el grupo.',
            icon: Users,
            color: '#60a5fa',
            accent: 'rgba(96, 165, 250, 0.5)',
            gradient: 'linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(96, 165, 250, 0.02) 100%)',
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
                                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
                                    borderRadius: '35px',
                                    padding: '30px',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '15px',
                                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                    backdropFilter: 'blur(20px)',
                                    WebkitBackdropFilter: 'blur(20px)'
                                }}
                                className="active:scale-[0.97]"
                            >
                                {/* Inner Border Glow */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    borderRadius: '35px',
                                    padding: '1px',
                                    background: `linear-gradient(135deg, ${mode.accent} 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.1) 100%)`,
                                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                    WebkitMaskComposite: 'xor',
                                    pointerEvents: 'none'
                                }} />

                                {/* Background Mesh / Glows */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-40%',
                                    right: '-20%',
                                    width: '180px',
                                    height: '180px',
                                    background: mode.color,
                                    filter: 'blur(70px)',
                                    opacity: 0.2,
                                    zIndex: 0
                                }} />

                                <div style={{
                                    position: 'absolute',
                                    bottom: '-20%',
                                    left: '-10%',
                                    width: '120px',
                                    height: '120px',
                                    background: mode.color,
                                    filter: 'blur(50px)',
                                    opacity: 0.1,
                                    zIndex: 0
                                }} />

                                <div style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '22px',
                                    background: mode.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '5px',
                                    position: 'relative',
                                    zIndex: 1,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: `0 10px 20px ${mode.accent.replace('0.5', '0.1')}`
                                }}>
                                    <mode.icon size={30} color={mode.color} strokeWidth={2.5} />
                                </div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <h3 style={{
                                        fontSize: '22px',
                                        fontWeight: '900',
                                        color: 'white',
                                        marginBottom: '6px',
                                        letterSpacing: '-0.5px'
                                    }}>
                                        {mode.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '14px',
                                        color: 'rgba(255,255,255,0.6)',
                                        lineHeight: '1.5',
                                        maxWidth: '90%',
                                        fontWeight: '500'
                                    }}>
                                        {mode.description}
                                    </p>
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    color: mode.color,
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px',
                                    marginTop: '10px',
                                    zIndex: 1
                                }}>
                                    Empezar ahora <ChevronRight size={16} />
                                </div>

                                {/* Subtle Texture Overlay */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    opacity: 0.03,
                                    pointerEvents: 'none',
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3BaseFilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/baseFilter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                                    filter: 'contrast(150%) brightness(100%)'
                                }} />
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default PlayModeSelection;
