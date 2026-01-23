import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
    X,
    ChevronRight,
    CheckCircle2,
    Sparkles,
    MousePointer2
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

interface Step {
    title: string;
    description: string;
    targetId?: string;
    path: string;
    position: 'center' | 'bottom';
    color: string;
}

const steps: Step[] = [
    {
        title: "¡Bienvenido a APEG!",
        description: "Estamos muy emocionados de tenerte en la comunidad. Permítenos guiarte por las funciones principales de tu nueva app de golf.",
        path: "/",
        position: 'center',
        color: "#a3e635"
    },
    {
        title: "Tu Dashboard",
        description: "Aquí encontrarás tus estadísticas, hándicap y la actividad más reciente de otros golfistas. ¡Mantente conectado!",
        targetId: 'nav-inicio',
        path: "/",
        position: 'bottom',
        color: "#3b82f6"
    },
    {
        title: "¡A Jugar!",
        description: "Este es el corazón de la app. Desde aquí podrás iniciar tus rondas, registrar cada golpe y seguir tu progreso en tiempo real.",
        targetId: 'nav-jugar',
        path: "/select-course",
        position: 'bottom',
        color: "#a3e635"
    },
    {
        title: "Green Fees",
        description: "¿Planeando tu próxima salida? Reserva tus turnos en los mejores campos del país de forma rápida y segura.",
        targetId: 'nav-green-fee',
        path: "/green-fee",
        position: 'bottom',
        color: "#10b981"
    },
    {
        title: "Marketplace",
        description: "Encuentra el mejor equipamiento o vende lo que ya no usas. ¡Incluso puedes negociar precios con otros usuarios!",
        targetId: 'nav-marketplace',
        path: "/shop",
        position: 'bottom',
        color: "#ec4899"
    },
    {
        title: "Eventos y Torneos",
        description: "No te pierdas ninguna competencia. Inscríbete a los próximos torneos y consulta los resultados oficiales.",
        targetId: 'nav-eventos',
        path: "/tournaments",
        position: 'bottom',
        color: "#f59e0b"
    },
    {
        title: "Tu Perfil",
        description: "Personaliza tu información de golfista, vincula tu código de federación y revisa tus estadísticas personales.",
        targetId: 'nav-profile',
        path: "/profile",
        position: 'bottom',
        color: "#a3e635"
    },
    {
        title: "Configuración",
        description: "Administra los ajustes de tu cuenta, notificaciones y preferencias de seguridad para una mejor experiencia.",
        targetId: 'btn-settings',
        path: "/profile",
        position: 'bottom',
        color: "#94a3b8"
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
                        overflow: 'hidden'
                    }}
                >
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
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        style={{
                            width: '100%',
                            maxWidth: '380px',
                            background: 'rgba(15, 45, 30, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.15)',
                            borderRadius: '32px',
                            padding: '28px',
                            textAlign: 'center',
                            zIndex: 10001,
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)'
                        }}
                    >
                        {/* Skip */}
                        <button
                            onClick={handleComplete}
                            style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.3)',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '50%'
                            }}
                        >
                            <X size={16} />
                        </button>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                            <div style={{
                                width: '64px',
                                height: '64px',
                                borderRadius: '20px',
                                background: `linear-gradient(135deg, ${step.color}22 0%, ${step.color}44 100%)`,
                                border: `1px solid ${step.color}55`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: step.color
                            }}>
                                {currentStep === 0 ? <Sparkles size={32} /> : <MousePointer2 size={32} />}
                            </div>

                            <div>
                                <h3 style={{
                                    fontSize: '22px',
                                    fontWeight: '800',
                                    marginBottom: '10px',
                                    color: 'white',
                                    letterSpacing: '-0.5px'
                                }}>
                                    {step.title}
                                </h3>
                                <p style={{
                                    color: 'rgba(255, 255, 255, 0.65)',
                                    fontSize: '15px',
                                    lineHeight: '1.6',
                                    fontWeight: '400'
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
                                        background: 'none',
                                        border: 'none',
                                        color: 'rgba(255, 255, 255, 0.4)',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    Anterior
                                </button>

                                <div style={{ display: 'flex', gap: '6px' }}>
                                    {steps.map((_, i) => (
                                        <div
                                            key={i}
                                            style={{
                                                width: i === currentStep ? '12px' : '6px',
                                                height: '6px',
                                                borderRadius: '3px',
                                                background: i === currentStep ? step.color : 'rgba(255, 255, 255, 0.15)',
                                                transition: 'all 0.3s ease'
                                            }}
                                        />
                                    ))}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleNext}
                                    style={{
                                        background: step.color,
                                        color: '#0f3923',
                                        padding: '10px 20px',
                                        borderRadius: '14px',
                                        border: 'none',
                                        fontWeight: '800',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px'
                                    }}
                                >
                                    {currentStep === steps.length - 1 ? '¡Empezar!' : 'Siguiente'}
                                    {currentStep === steps.length - 1 ? <CheckCircle2 size={16} /> : <ChevronRight size={16} />}
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
