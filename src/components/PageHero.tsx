import React from 'react';
import { motion } from 'framer-motion';

interface PageHeroProps {
    image?: string;
    height?: string;
    opacity?: number;
    overlayGradient?: string;
}

const PageHero: React.FC<PageHeroProps> = ({
    image = '/images/briceno18.png',
    height = '420px',
    opacity = 0.6,
    overlayGradient = 'linear-gradient(to bottom, rgba(14, 47, 31, 0.4) 0%, rgba(14, 47, 31, 0.8) 70%, var(--primary) 100%)'
}) => {
    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: height,
            zIndex: 0,
            overflow: 'hidden',
            pointerEvents: 'none',
            background: 'var(--primary)'
        }}>
            <motion.img
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: opacity }}
                transition={{ duration: 0.8 }}
                src={image}
                alt=""
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                }}
            />
            <div style={{
                position: 'absolute',
                inset: 0,
                background: overlayGradient
            }} />
        </div>
    );
};

export default PageHero;
