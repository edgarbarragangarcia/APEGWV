import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';

const PlayModeSelection: React.FC = () => {
    const navigate = useNavigate();

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
        <div className="animate-fade" style={{
            padding: '20px',
            paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
            minHeight: '100dvh',
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <PageHeader
                title="Modo de Juego"
                subtitle="¿Cómo deseas jugar hoy?"
                showBack={true}
                onBack={() => navigate('/')}
            />

            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                marginTop: '10px',
                flex: 1,
                justifyContent: 'flex-start',
                paddingTop: '20px'
            }}>
                {modes.map((mode, index) => (
                    <motion.div
                        key={mode.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => navigate(mode.path)}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderRadius: '30px',
                            padding: '30px',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}
                        whileHover={{ scale: 1.02, background: 'rgba(255, 255, 255, 0.05)' }}
                        whileTap={{ scale: 0.98 }}
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
                                maxWidth: '80%'
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
                    </motion.div>
                ))}
            </div>

            <div style={{
                textAlign: 'center',
                padding: '40px 0',
                opacity: 0.5
            }}>
                <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                    APEG Golf • Elige tu modalidad
                </p>
            </div>
        </div>
    );
};

export default PlayModeSelection;
