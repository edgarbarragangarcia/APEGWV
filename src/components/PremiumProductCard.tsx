import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useLikes } from '../hooks/useLikes';

import { optimizeImage } from '../services/SupabaseManager';

interface PremiumProductCardProps {
    product: any;
    onAddToCart: (product: any) => void;
    onClick: () => void;
}

const PremiumProductCard: React.FC<PremiumProductCardProps> = ({ product, onAddToCart, onClick }) => {
    const { likedProducts, toggleLike } = useLikes();
    const isLiked = likedProducts.has(product.id);
    // Generate a pseudo-random rating for aesthetics
    const rating = (4 + (Math.floor(Math.random() * 10) / 10)).toFixed(1);

    return (
        <motion.div
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '32px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
                height: '100%',
                width: '100%',
                minWidth: 0,
                boxSizing: 'border-box'
            }}
        >
            {/* Image Container - Fixed height for uniformity */}
            <div style={{
                position: 'relative',
                width: '100%',
                height: '150px', // Reduced from 180px
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1
            }}>
                <div style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={optimizeImage(product.image_url, { width: 400, height: 400 })}
                        alt={product.name}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transition: 'transform 0.5s ease'
                        }}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=400';
                        }}
                    />
                    {/* Negociable Ribbon */}
                    {product.is_negotiable && (
                        <div style={{
                            position: 'absolute',
                            top: '14px',
                            left: '-22px',
                            width: '90px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            fontSize: '8px',
                            fontWeight: '950',
                            textTransform: 'uppercase',
                            letterSpacing: '0.08em',
                            textAlign: 'center',
                            padding: '5px 0',
                            transform: 'rotate(-45deg)',
                            transformOrigin: 'center center',
                            boxShadow: '0 3px 10px rgba(163, 230, 53, 0.4)',
                            zIndex: 10,
                            pointerEvents: 'none'
                        }}>
                            NEGOCIABLE
                        </div>
                    )}
                </div>

                {/* Heart Icon Overlay */}
                <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    zIndex: 2
                }}>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleLike(product.id);
                        }}
                        style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(10px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: isLiked ? '#ef4444' : 'white'
                        }}
                    >
                        <Heart size={16} fill={isLiked ? '#ef4444' : 'none'} />
                    </button>
                </div>

                {/* Buy Button Overlay */}
                <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    zIndex: 2
                }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            if (product.sizes_inventory && product.sizes_inventory.length > 0) {
                                // Trigger product detail to select size
                                onClick();
                            } else {
                                onAddToCart(product);
                            }
                        }}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '14px',
                            background: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            color: 'var(--primary)',
                            boxShadow: '0 8px 15px rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        <ShoppingCart size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>

            {/* Info Section */}
            <div style={{
                padding: '0 12px 12px 12px', // Reduced padding
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
            }}>
                {/* Brand - Fixed height */}
                <div style={{
                    height: '14px',
                    marginBottom: '2px',
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <span style={{
                        fontSize: '9px',
                        fontWeight: '800',
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {product.brand || ''}
                    </span>
                </div>

                {/* Category & Rating - Fixed height */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    height: '18px',
                    marginBottom: '6px'
                }}>
                    <span style={{
                        fontSize: '9px',
                        fontWeight: '700',
                        color: 'var(--secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {product.category}
                    </span>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '1px 4px',
                        borderRadius: '4px'
                    }}>
                        <Star size={8} color="var(--accent)" fill="var(--accent)" />
                        <span style={{ fontSize: '9px', fontWeight: '600', color: 'white' }}>{rating}</span>
                    </div>
                </div>

                {/* Name - Fixed height with 2 lines */}
                <h3 style={{
                    fontSize: '13px',
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1.2',
                    margin: '0 0 8px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '32px',
                }}>
                    {product.name}
                </h3>

                {/* Price */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                        fontSize: '16px',
                        fontWeight: '900',
                        color: 'white'
                    }}>
                        ${Number(product.price).toLocaleString()}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default PremiumProductCard;
