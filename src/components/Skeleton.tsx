import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '20px',
    borderRadius = '8px',
    style,
    className = ''
}) => {
    return (
        <div
            className={`skeleton-shimmer ${className}`}
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.03) 75%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s infinite linear',
                ...style
            }}
        />
    );
};

export default Skeleton;
