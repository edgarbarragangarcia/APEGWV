import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CategoryHeroProps {
    title: string;
    subtitle: string;
    image: string;
    productCount?: number;
}

const CategoryHero: React.FC<CategoryHeroProps> = ({ title, subtitle, image, productCount }) => {
    const navigate = useNavigate();

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
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
                        filter: 'brightness(0.7)',
                        display: image ? 'block' : 'none'
                    }}
                    onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                    }}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(14, 47, 31, 0.4) 0%, rgba(14, 47, 31, 0.8) 70%, var(--primary) 100%)',
                }} />
            </motion.div>

            {/* Back Button - Positioned to handle safe areas if needed, but simple for now */}
            <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate('/')}
                style={{
                    position: 'absolute',
                    top: 'calc(var(--header-offset-top) + 12px)',
                    right: '20px',
                    zIndex: 2000,
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

            {/* Content */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 85px)',
                left: '20px',
                right: '20px',
                zIndex: 5
            }}>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {productCount !== undefined && (
                        <span style={{
                            display: 'inline-block',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '4px 12px',
                            borderRadius: '100px',
                            fontSize: '10px',
                            fontWeight: '900',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '10px',
                            boxShadow: '0 4px 15px rgba(163, 230, 53, 0.4)'
                        }}>
                            {productCount} {productCount === 1 ? 'Producto' : 'Productos'}
                        </span>
                    )}
                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: '900',
                        color: 'white',
                        lineHeight: '0.9',
                        marginBottom: '10px',
                        letterSpacing: '-2px'
                    }}>
                        {title}
                    </h1>
                    <p style={{
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        maxWidth: '85%',
                        fontWeight: '500',
                        lineHeight: '1.3'
                    }}>
                        {subtitle}
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

export default CategoryHero;
