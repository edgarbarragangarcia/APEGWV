import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import type { Product } from '../services/SupabaseManager';

interface PremiumProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onClick: () => void;
}

const PremiumProductCard: React.FC<PremiumProductCardProps> = ({ product, onAddToCart, onClick }) => {
    // Generate a pseudo-random rating for aesthetics
    const rating = 4 + (Math.floor(Math.random() * 10) / 10);
    const reviews = 10 + Math.floor(Math.random() * 50);

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
                WebkitTapHighlightColor: 'transparent'
            }}
        >
            {/* Image Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                overflow: 'hidden',
                background: 'rgba(255,255,255,0.02)'
            }}>
                <img
                    src={product.image_url || 'https://via.placeholder.com/400x400?text=Golf+Product'}
                    alt={product.name}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease'
                    }}
                />

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
                            color: 'white'
                        }}
                    >
                        <Heart size={18} />
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
                            onAddToCart(product);
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
                padding: '16px',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: '6px'
            }}>
                {/* Category & Rating */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{
                        fontSize: '10px',
                        fontWeight: '700',
                        color: 'var(--secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}>
                        {product.category}
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
                        <span style={{ fontSize: '10px', fontWeight: '500', color: 'rgba(255,255,255,0.4)', marginLeft: '2px' }}>({reviews})</span>
                    </div>
                </div>

                {/* Name */}
                <h3 style={{
                    fontSize: '15px',
                    fontWeight: '700',
                    color: 'white',
                    lineHeight: '1.3',
                    margin: 0,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    height: '40px'
                }}>
                    {product.name}
                </h3>

                {/* Price */}
                <div style={{
                    marginTop: 'auto',
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '4px'
                }}>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: '900',
                        color: 'white'
                    }}>
                        ${product.price}
                    </span>
                </div>
            </div>
        </motion.div>
    );
};

export default PremiumProductCard;
