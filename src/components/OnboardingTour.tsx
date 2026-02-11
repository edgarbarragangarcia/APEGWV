import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    X,
    ChevronRight,
    CheckCircle2,
    Sparkles,
    LayoutDashboard,
    Flag,
    Calendar,
    Trophy,
    User,
    Settings
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

interface Step {
    title: string;
    description: string;
    icon: React.ReactNode;
    targetId?: string;
    path: string;
    position: 'center' | 'bottom';
    color: string;
    gradient: string;
}

const steps: Step[] = [
    {
        title: "¡Bienvenido a APEG!",
        description: "Estamos muy emocionados de tenerte en la comunidad. Permítenos guiarte por las funciones principales de tu nueva app de golf.",
        icon: <Sparkles size={32} />,
        path: "/",
        position: 'center',
        color: "#a3e635",
        gradient: "linear-gradient(135deg, #a3e635 0%, #65a30d 100%)"
    },
    {
        title: "Tu Dashboard",
        description: "Aquí encontrarás tus estadísticas, hándicap y la actividad más reciente de otros golfistas. ¡Mantente conectado!",
        icon: <LayoutDashboard size={32} />,
        targetId: 'nav-inicio',
        path: "/",
        position: 'bottom',
        color: "#3b82f6",
        gradient: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)"
    },
    {
        title: "¡A Jugar!",
        description: "Este es el corazón de la app. Desde aquí podrás iniciar tus rondas, registrar cada golpe y seguir tu progreso en tiempo real.",
        icon: <Flag size={32} />,
        targetId: 'nav-jugar',
        path: "/select-course",
        position: 'bottom',
        color: "#a3e635",
        gradient: "linear-gradient(135deg, #a3e635 0%, #65a30d 100%)"
    },
    {
        title: "Green Fee",
        description: "¿Planeando tu próxima salida? Reserva tus turnos en los mejores campos del país de forma rápida y segura.",
        icon: <Calendar size={32} />,
        targetId: 'nav-green-fee',
        path: "/green-fee",
        position: 'bottom',
        color: "#10b981",
        gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)"
    },
    {
        title: "Eventos y Torneos",
        description: "No te pierdas ninguna competencia. Inscríbete a los próximos torneos y consulta los resultados oficiales.",
        icon: <Trophy size={32} />,
        targetId: 'nav-eventos',
        path: "/tournaments",
        position: 'bottom',
        color: "#f59e0b",
        gradient: "linear-gradient(135deg, #f59e0b 0%, #b45309 100%)"
    },
    {
        title: "Tu Perfil",
        description: "Personaliza tu información de golfista, vincula tu código de federación y revisa tus estadísticas personales.",
        icon: <User size={32} />,
        targetId: 'nav-profile',
        path: "/profile",
        position: 'bottom',
        color: "#8b5cf6",
        gradient: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
    },
    {
        title: "Configuración",
        description: "Administra los ajustes de tu cuenta, notificaciones y preferencias de seguridad para una mejor experiencia.",
        icon: <Settings size={32} />,
        targetId: 'btn-settings',
        path: "/profile",
        position: 'bottom',
        color: "#94a3b8",
        gradient: "linear-gradient(135deg, #94a3b8 0%, #475569 100%)"
    }
];

interface OnboardingTourProps {
    userId: string;
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userId, onComplete }) => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isClosing, setIsClosing] = useState(false);
    const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const step = steps[currentStep];
        if (step.targetId) {
            // Give a small timeout to ensure DOM is ready and layout has settled
            const timer = setTimeout(() => {
                const element = document.getElementById(step.targetId!);
                if (element) {
                    setHighlightRect(element.getBoundingClientRect());
                }
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setHighlightRect(null);
        }
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            const nextStep = currentStep + 1;
            setCurrentStep(nextStep);
            navigate(steps[nextStep].path);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            const prevStep = currentStep - 1;
            setCurrentStep(prevStep);
            navigate(steps[prevStep].path);
        }
    };

    const handleComplete = async () => {
        setIsClosing(true);
        try {
            await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('id', userId);

            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (err) {
            console.error('Error updating onboarding status:', err);
            onComplete();
        }
    };

    const step = steps[currentStep];

    return (
        <AnimatePresence>
            {!isClosing && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(6, 26, 17, 0.4)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: step.position === 'center' ? 'center' : 'flex-end',
                        padding: '20px',
                        paddingBottom: step.position === 'bottom' ? '120px' : '20px',
                        overflow: 'hidden',
                        perspective: '1000px'
                    }}
                >
                    <style>{`
                        @keyframes borderBeam {
                            0% { offset-distance: 0%; }
                            100% { offset-distance: 100%; }
                        }
                        .border-beam {
                            position: absolute;
                            inset: 0;
                            border: 2px solid transparent;
                            border-radius: 35px;
                            mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                            mask-composite: exclude;
                            pointer-events: none;
                        }
                        .border-beam::after {
                            content: "";
                            position: absolute;
                            aspect-ratio: 1;
                            width: 150px;
                            background: linear-gradient(to right, transparent, var(--beam-color), transparent);
                            offset-path: rect(0 auto auto 0 round 35px);
                            animation: borderBeam 4s linear infinite;
                        }
                        .grain {
                            position: absolute;
                            inset: 0;
                            opacity: 0.03;
                            pointer-events: none;
                            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                        }
                    `}</style>
                    {/* Spotlight effect */}
                    {highlightRect && (
                        <motion.div
                            initial={false}
                            animate={{
                                top: highlightRect.top - 8,
                                left: highlightRect.left - 8,
                                width: highlightRect.width + 16,
                                height: highlightRect.height + 16,
                            }}
                            style={{
                                position: 'fixed',
                                background: 'transparent',
                                border: `2px solid ${step.color}`,
                                boxShadow: `0 0 0 9999px rgba(6, 26, 17, 0.4)`,
                                borderRadius: '16px',
                                pointerEvents: 'none',
                                zIndex: 10000
                            }}
                        />
                    )}

                    {/* Instruction Card */}
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, scale: 0.8, y: 40, rotateX: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 40, rotateX: -15 }}
                        transition={{
                            type: "spring",
                            damping: 20,
                            stiffness: 100
                        }}
                        style={{
                            width: '100%',
                            maxWidth: '280px',
                            background: 'rgba(10, 25, 20, 0.98)',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            borderRadius: '24px',
                            padding: '20px 24px',
                            textAlign: 'center',
                            zIndex: 10001,
                            boxShadow: `0 20px 50px rgba(0, 0, 0, 0.9), 0 0 20px ${step.color}05`,
                            position: 'relative',
                            overflow: 'visible', // Changed to visible for the arrow
                            transformStyle: 'preserve-3d',
                            '--beam-color': step.color
                        } as any}
                    >
                        {/* bubble arrow/tail */}
                        {step.position === 'bottom' && (
                            <div style={{
                                position: 'absolute',
                                bottom: '-10px',
                                left: '50%',
                                transform: 'translateX(-50%) rotate(45deg)',
                                width: '20px',
                                height: '20px',
                                background: 'rgba(10, 25, 20, 0.98)',
                                borderRight: '1px solid rgba(255, 255, 255, 0.12)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
                                zIndex: -1
                            }} />
                        )}
                        {/* Grain Texture */}
                        <div className="grain" />

                        {/* Border Beam Light */}
                        <div className="border-beam" />
                        {/* Background Glow */}
                        <div style={{
                            position: 'absolute',
                            top: '-50%',
                            left: '-50%',
                            width: '200%',
                            height: '200%',
                            background: `radial-gradient(circle at center, ${step.color}15 0%, transparent 50%)`,
                            pointerEvents: 'none',
                        }} />

                        {/* Skip */}
                        <button
                            onClick={handleComplete}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: 'white',
                                opacity: 0.5,
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%',
                                zIndex: 10
                            }}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                            <motion.div
                                key={`icon-box-${currentStep}`}
                                initial={{ scale: 0.5, opacity: 0, rotate: -30 }}
                                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                                transition={{ type: "spring", bounce: 0.5 }}
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '22px',
                                    background: step.gradient,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    boxShadow: `0 15px 30px -10px ${step.color}aa, inset 0 0 15px rgba(255,255,255,0.3)`,
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                {/* Icon Inner Glow */}
                                <div style={{
                                    position: 'absolute',
                                    top: '-10%',
                                    left: '-10%',
                                    width: '120%',
                                    height: '120%',
                                    background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.4) 0%, transparent 70%)',
                                    pointerEvents: 'none'
                                }} />
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    {step.icon}
                                </div>
                            </motion.div>

                            <div>
                                <motion.h3
                                    key={`title-${currentStep}`}
                                    initial={{ y: 10, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    style={{
                                        fontSize: '20px',
                                        fontWeight: '900',
                                        marginBottom: '8px',
                                        color: 'white',
                                        letterSpacing: '-0.5px'
                                    }}
                                >
                                    {step.title}
                                </motion.h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.8)',
                                    fontSize: '12.5px',
                                    lineHeight: '1.4',
                                    fontWeight: '400',
                                    padding: '0'
                                }}>
                                    {step.description}
                                </p>
                            </div>

                            {/* Nav */}
                            <div style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginTop: '10px'
                            }}>
                                <button
                                    onClick={handleBack}
                                    style={{
                                        visibility: currentStep === 0 ? 'hidden' : 'visible',
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        color: 'rgba(255,255,255,0.6)',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Anterior
                                </button>

                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: i === currentStep ? '12px' : '4px',
                                                height: '4px',
                                                borderRadius: '2px',
                                                background: i === currentStep ? step.color : 'rgba(255, 255, 255, 0.12)',
                                                transition: 'all 0.4s cubic-bezier(0.23, 1, 0.32, 1)'
                                            }}
                                        />
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05, boxShadow: `0 4px 10px ${step.color}22` }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleNext}
                                    style={{
                                        background: step.gradient,
                                        color: 'white',
                                        padding: '6px 14px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        fontWeight: '800',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        boxShadow: `0 4px 12px -3px ${step.color}44`
                                    }}
                                >
                                    {currentStep === steps.length - 1 ? 'Listo' : 'Siguiente'}
                                    {currentStep === steps.length - 1 ? <CheckCircle2 size={13} /> : <ChevronRight size={13} />}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
