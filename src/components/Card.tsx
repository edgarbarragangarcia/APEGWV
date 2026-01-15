import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
    style?: React.CSSProperties;
}

const Card: React.FC<CardProps> = ({ children, title, subtitle, className = '', style }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className={`glass ${className}`}
            style={{ padding: '20px', marginBottom: '20px', ...style }}
        >
            {(title || subtitle) && (
                <div style={{ marginBottom: '15px' }}>
                    {title && <h3 style={{ fontSize: '18px', fontWeight: '600' }}>{title}</h3>}
                    {subtitle && <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{subtitle}</p>}
                </div>
            )}
            {children}
        </motion.div>
    );
};

export default Card;
