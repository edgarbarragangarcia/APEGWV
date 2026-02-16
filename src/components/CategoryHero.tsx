import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryHeroProps {
    title: string;
    subtitle: string;
    image: string;
    onFilterClick?: () => void;
    hasFilters?: boolean;
}

const CategoryHero: React.FC<CategoryHeroProps> = ({ title, subtitle, image, onFilterClick, hasFilters }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '320px', // Reducido de 400px
            zIndex: 0,
            overflow: 'hidden',
        }}>
            {/* Background Image with Gradient Overlay */}
            <motion.div
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{
                    position: 'absolute',
                    inset: 0,
                    zIndex: 0
                }}
            >
                <img
                    src={image}
                    alt=""
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        filter: 'brightness(0.6)', // Un poco más oscuro
                        display: image ? 'block' : 'none'
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(14, 47, 31, 0.2) 0%, rgba(14, 47, 31, 0.7) 60%, var(--primary) 100%)',
                }} />
            </motion.div>

            {/* Top Buttons Bar */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 12px)',
                left: '20px',
                right: '20px',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'space-between',
                pointerEvents: 'none'
            }}>
                <div style={{ flex: 1 }} /> {/* Spacer */}

                <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto' }}>
                    {onFilterClick && hasFilters && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            onClick={onFilterClick}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(255, 255, 255, 0.1)',
                                backdropFilter: 'blur(10px)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                            }}
                        >
                            <SlidersHorizontal size={18} />
                        </motion.button>
                    )}

                    {/* Back Button */}
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => navigate('/')}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'rgba(255, 255, 255, 0.1)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}
                    >
                        <ArrowLeft size={18} />
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 15px)', // Más arriba
                left: '20px',
                right: '20px',
                zIndex: 5
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 style={{
                        fontSize: '40px', // Reducido de 48px
                        fontWeight: '900',
                        color: 'white',
                        lineHeight: '0.9',
                        marginBottom: '8px',
                        letterSpacing: '-1.5px'
                    }}>
                        {title}
                    </h1>
                    <p style={{
                        fontSize: '14px', // Reducido de 15px
                        color: 'rgba(255, 255, 255, 0.8)',
                        maxWidth: '90%',
                        fontWeight: '500',
                        lineHeight: '1.2'
                    }}>
                        {subtitle}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default CategoryHero;
