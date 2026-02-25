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
                height: '180px', // Fixed height for consistent image size
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
                    borderRadius: '24px',
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
                            width: '36px',
                            height: '36px',
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
                        <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
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
                            width: '44px',
                            height: '44px',
                            borderRadius: '16px',
                            background: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: 'none',
                            color: 'var(--primary)',
                            boxShadow: '0 8px 15px rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        <ShoppingCart size={20} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>

            {/* Info Section */}
            <div style={{
                padding: '0 16px 16px 16px', // Reduced top padding
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
                        fontSize: '10px',
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
                    marginBottom: '8px'
                }}>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'var(--secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {product.category} {product.clothing_type ? `• ${product.clothing_type}` : ''}
                    </span>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        background: 'rgba(255,255,255,0.05)',
                        padding: '2px 6px',
                        borderRadius: '6px'
                    }}>
                        <Star size={10} color="var(--accent)" fill="var(--accent)" />
                        <span style={{ fontSize: '10px', fontWeight: '600', color: 'white' }}>{rating}</span>
                    </div>
                </div>

                {/* Name - Fixed height with 2 lines */}
                <h3 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1.2',
                    margin: '0 0 12px 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '36px',
                }}>
                    {product.name}
                </h3>

                {/* Price - Bottom aligned */}
                <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: 'white'
                    }}>
                        ${Number(product.price).toLocaleString()}
                    </span>
                    {product.is_negotiable && (
                        <span style={{
                            fontSize: '9px',
                            fontWeight: '700',
                            color: 'var(--secondary)',
                            opacity: 0.8,
                            textTransform: 'uppercase'
                        }}>
                            Negociable
                        </span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PremiumProductCard;
