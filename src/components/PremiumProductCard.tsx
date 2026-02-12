import React from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Star, Heart } from 'lucide-react';
import { useLikes } from '../hooks/useLikes';
import type { Product } from '../services/SupabaseManager';
import { optimizeImage } from '../services/SupabaseManager';

interface PremiumProductCardProps {
    product: Product;
    onAddToCart: (product: Product) => void;
    onClick: () => void;
}

const PremiumProductCard: React.FC<PremiumProductCardProps> = ({ product, onAddToCart, onClick }) => {
    const { likedProducts, toggleLike } = useLikes();
    const isLiked = likedProducts.has(product.id);
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
                WebkitTapHighlightColor: 'transparent',
                height: '100%'
            }}
        >
            {/* Image Container */}
            <div style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
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
                {/* Brand & Category & Rating */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                }}>
                    {product.brand && (
                        <span style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                        }}>
                            {product.brand}
                        </span>
                    )}
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
                            {product.category} {(product as any).clothing_type ? `• ${(product as any).clothing_type}` : ''}
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
