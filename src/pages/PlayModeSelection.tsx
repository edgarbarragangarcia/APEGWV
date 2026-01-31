import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronRight, Play, Trash2, Clock } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { motion } from 'framer-motion';

const PlayModeSelection: React.FC = () => {
    const navigate = useNavigate();
    const [hasActiveRound, setHasActiveRound] = React.useState(false);
    const [roundInfo, setRoundInfo] = React.useState<{
        course: any;
        recorrido?: string;
        currentHole: number;
        groupId?: string;
    } | null>(null);

    React.useEffect(() => {
        const roundId = localStorage.getItem('round_id');
        const savedCourse = localStorage.getItem('round_course');
        const savedRecorrido = localStorage.getItem('round_recorrido');
        const savedHole = localStorage.getItem('round_current_hole');
        const savedGroupId = localStorage.getItem('round_group_id');

        if (roundId && savedCourse) {
            setHasActiveRound(true);
            setRoundInfo({
                course: JSON.parse(savedCourse),
                recorrido: savedRecorrido || undefined,
                currentHole: parseInt(savedHole || '1'),
                groupId: savedGroupId || undefined
            });
        }
    }, []);

    const handleResumeRound = () => {
        if (roundInfo) {
            navigate('/round', {
                state: {
                    course: roundInfo.course,
                    recorrido: roundInfo.recorrido,
                    groupId: roundInfo.groupId
                }
            });
        }
    };

    const handleDiscardRound = () => {
        if (confirm('¿Estás seguro de que quieres descartar la ronda en curso? Se perderá todo el progreso.')) {
            localStorage.removeItem('round_current_hole');
            localStorage.removeItem('round_strokes');
            localStorage.removeItem('round_id');
            localStorage.removeItem('round_course');
            localStorage.removeItem('round_recorrido');
            localStorage.removeItem('round_group_id');
            setHasActiveRound(false);
            setRoundInfo(null);
        }
    };

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
                {hasActiveRound && roundInfo ? (
                    // UI para ronda activa
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        style={{
                            background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.15) 0%, rgba(163, 230, 53, 0.05) 100%)',
                            borderRadius: '30px',
                            padding: '30px',
                            border: '2px solid rgba(163, 230, 53, 0.3)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Glow Effect */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-20%',
                            width: '60%',
                            height: '100%',
                            background: 'var(--secondary)',
                            filter: 'blur(80px)',
                            opacity: 0.15,
                            zIndex: 0
                        }} />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            {/* Icon */}
                            <div style={{
                                width: '70px',
                                height: '70px',
                                borderRadius: '22px',
                                background: 'rgba(163, 230, 53, 0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '20px'
                            }}>
                                <Clock size={36} color="var(--secondary)" />
                            </div>

                            {/* Title */}
                            <h2 style={{
                                fontSize: '28px',
                                fontWeight: '900',
                                color: 'white',
                                marginBottom: '8px'
                            }}>
                                Ronda en Curso
                            </h2>

                            {/* Info */}
                            <div style={{
                                background: 'rgba(0,0,0,0.3)',
                                borderRadius: '18px',
                                padding: '16px',
                                marginBottom: '20px'
                            }}>
                                <div style={{ marginBottom: '10px' }}>
                                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Campo</p>
                                    <p style={{ fontSize: '15px', color: 'white', fontWeight: '800' }}>
                                        {roundInfo.course?.name || 'Campo desconocido'}
                                        {roundInfo.recorrido && ` - ${roundInfo.recorrido}`}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: '20px' }}>
                                    <div>
                                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Hoyo Actual</p>
                                        <p style={{ fontSize: '18px', color: 'var(--secondary)', fontWeight: '900' }}>
                                            {roundInfo.currentHole}/18
                                        </p>
                                    </div>
                                    {roundInfo.groupId && (
                                        <div>
                                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '700' }}>Modo</p>
                                            <p style={{ fontSize: '15px', color: 'white', fontWeight: '800' }}>En Grupo</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={handleResumeRound}
                                    style={{
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        borderRadius: '18px',
                                        padding: '18px',
                                        fontSize: '16px',
                                        fontWeight: '900',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)'
                                    }}
                                >
                                    <Play size={20} fill="var(--primary)" />
                                    REANUDAR RONDA
                                </button>
                                <button
                                    onClick={handleDiscardRound}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.15)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '18px',
                                        padding: '14px',
                                        fontSize: '14px',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <Trash2 size={18} />
                                    Descartar Ronda
                                </button>
                            </div>
                        </div>
                    </motion.div>
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
