import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    ChevronRight,
    ChevronLeft,
    Home,
    ShoppingBag,
    Calendar,
    Trophy,
    CheckCircle2,
    Sparkles
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

interface Step {
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
}

const steps: Step[] = [
    {
        title: "¡Bienvenido a APEG!",
        description: "Estamos emocionados de tenerte aquí. Deja que te mostremos cómo aprovechar al máximo nuestra plataforma de golf.",
        icon: <Sparkles size={48} />,
        color: "var(--secondary)"
    },
    {
        title: "Tu Dashboard Personal",
        description: "En el inicio podrás ver tus estadísticas, hándicap y un resumen de tu actividad reciente.",
        icon: <Home size={48} />,
        color: "#3b82f6"
    },
    {
        title: "Marketplace Exclusivo",
        description: "Compra y vende equipamiento de golf. Negocia precios y encuentra las mejores ofertas de la comunidad.",
        icon: <ShoppingBag size={48} />,
        color: "#ec4899"
    },
    {
        title: "Reservas de Green Fees",
        description: "Reserva tus salidas en los mejores campos de forma rápida y sencilla.",
        icon: <Calendar size={48} />,
        color: "#10b981"
    },
    {
        title: "Torneos y Competencias",
        description: "Mantente al tanto de todos los torneos, inscríbete y sigue los resultados en tiempo real.",
        icon: <Trophy size={48} />,
        color: "#f59e0b"
    }
];

interface OnboardingTourProps {
    userId: string;
    onComplete: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ userId, onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleComplete = async () => {
        setIsClosing(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('id', userId);

            if (error) throw error;

            // Give time for animation
            setTimeout(() => {
                onComplete();
            }, 500);
        } catch (err) {
            console.error('Error updating onboarding status:', err);
            onComplete(); // Still complete even if DB update fails to not block the user
        }
    };

    const step = steps[currentStep];
    const progress = ((currentStep + 1) / steps.length) * 100;

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
                        background: 'rgba(6, 26, 17, 0.8)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px'
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '32px',
                            padding: '30px',
                            position: 'relative',
                            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                            color: 'white',
                            textAlign: 'center',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Progress Bar */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            height: '4px',
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.1)'
                        }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                style={{
                                    height: '100%',
                                    background: 'var(--secondary)',
                                    boxShadow: '0 0 10px var(--secondary)'
                                }}
                            />
                        </div>

                        {/* Skip Button */}
                        <button
                            onClick={handleComplete}
                            style={{
                                position: 'absolute',
                                top: '20px',
                                right: '20px',
                                background: 'none',
                                border: 'none',
                                color: 'rgba(255, 255, 255, 0.4)',
                                cursor: 'pointer',
                                padding: '5px'
                            }}
                        >
                            <X size={20} />
                        </button>

                        {/* Content */}
                        <div style={{ marginTop: '20px' }}>
                            <motion.div
                                key={currentStep}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '24px'
                                }}
                            >
                                <div style={{
                                    width: '100px',
                                    height: '100px',
                                    borderRadius: '30px',
                                    background: `linear-gradient(135deg, ${step.color}22 0%, ${step.color}44 100%)`,
                                    border: `1px solid ${step.color}55`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: step.color,
                                    boxShadow: `0 10px 30px -10px ${step.color}33`
                                }}>
                                    {step.icon}
                                </div>

                                <div>
                                    <h2 style={{
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        marginBottom: '12px',
                                        background: `linear-gradient(to right, #fff, ${step.color})`,
                                        WebkitBackgroundClip: 'text',
                                        WebkitTextFillColor: 'transparent'
                                    }}>
                                        {step.title}
                                    </h2>
                                    <p style={{
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        fontSize: '15px',
                                        lineHeight: '1.6',
                                        padding: '0 10px'
                                    }}>
                                        {step.description}
                                    </p>
                                </div>
                            </motion.div>
                        </div>

                        {/* Navigation */}
                        <div style={{
                            marginTop: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px'
                        }}>
                            <button
                                onClick={handleBack}
                                style={{
                                    visibility: currentStep === 0 ? 'hidden' : 'visible',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    color: 'white',
                                    padding: '12px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <ChevronLeft size={20} />
                            </button>

                            <div style={{ display: 'flex', gap: '6px' }}>
                                {steps.map((_, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            width: i === currentStep ? '20px' : '6px',
                                            height: '6px',
                                            borderRadius: '3px',
                                            background: i === currentStep ? 'var(--secondary)' : 'rgba(255, 255, 255, 0.2)',
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
                                    background: 'var(--secondary)',
                                    color: '#0f3923',
                                    padding: '12px 24px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    fontWeight: '700',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    boxShadow: '0 10px 20px -5px rgba(163, 230, 53, 0.3)'
                                }}
                            >
                                {currentStep === steps.length - 1 ? (
                                    <>
                                        ¡EMPEZAR!
                                        <CheckCircle2 size={18} />
                                    </>
                                ) : (
                                    <>
                                        SIGUIENTE
                                        <ChevronRight size={18} />
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
