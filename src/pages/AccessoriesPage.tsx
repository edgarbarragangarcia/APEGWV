import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const AccessoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [] } = useFeaturedProducts(50);
    const { addToCart } = useCart();

    // Filter products for Accesorios category
    const accessoriesProducts = featuredProducts.filter(product =>
        (product.category || '').toLowerCase() === 'accesorios'
    );

    const handleAddToCart = (product: any) => {
        addToCart(product);
    };

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            background: 'var(--primary)',
            overflow: 'hidden'
        }}>
            {/* Fixed Header */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                zIndex: 900,
                background: 'var(--primary)',
                paddingBottom: '5px'
            }}>
                <PageHeader
                    noMargin
                    showBack={true}
                    title="Accesorios de Golf"
                    subtitle="Complementa tu equipamiento"
                />
            </div>

            {/* Scrollable Content */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 100px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 5px)',
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                overflowX: 'hidden'
            }}>
                {/* Products Grid */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    paddingBottom: '20px'
                }}>
                    {!accessoriesProducts || accessoriesProducts.length === 0 ? (
                        // Skeleton Cards
                        Array.from({ length: 6 }).map((_, index) => {
                            const groupIndex = index % 3;
                            const isBig = groupIndex === 0;

                            return (
                                <div
                                    key={`skeleton-${index}`}
                                    style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        borderRadius: '20px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        gridRow: isBig ? 'span 2' : 'span 1',
                                        gridColumn: isBig ? '1' : '2',
                                        height: '100%',
                                        minHeight: isBig ? '220px' : '110px'
                                    }}
                                >
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: '-100%',
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                            animation: 'shimmer 1.5s infinite'
                                        }}
                                    />
                                    <div style={{
                                        height: isBig ? '100%' : '110px',
                                        background: 'rgba(255,255,255,0.02)'
                                    }} />
                                </div>
                            );
                        })
                    ) : accessoriesProducts.length > 0 ? (
                        accessoriesProducts.map((product, index) => {
                            const groupIndex = index % 3;
                            const isBig = groupIndex === 0;

                            return (
                                <motion.div
                                    key={product.id}
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                    style={{
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: '28px',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation',
                                        gridRow: isBig ? 'span 2' : 'span 1',
                                        gridColumn: isBig ? '1' : '2',
                                        height: isBig ? '100%' : '110px',
                                        minHeight: isBig ? '220px' : '110px'
                                    }}
                                >
                                    {/* Product Image */}
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        height: isBig ? '100%' : '110px',
                                        overflow: 'hidden',
                                        borderRadius: '28px'
                                    }}>
                                        <img
                                            src={product.image_url || 'https://via.placeholder.com/300x200?text=Producto'}
                                            alt={product.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                        />

                                        {/* Favorite Icon */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                            }}
                                            style={{
                                                position: 'absolute',
                                                top: '10px',
                                                right: '10px',
                                                background: 'rgba(0,0,0,0.4)',
                                                backdropFilter: 'blur(10px)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '32px',
                                                height: '32px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                zIndex: 10
                                            }}
                                        >
                                            <Heart size={16} color="white" />
                                        </button>

                                        {/* Add to Cart Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleAddToCart(product);
                                            }}
                                            style={{
                                                position: 'absolute',
                                                bottom: '10px',
                                                right: '10px',
                                                background: 'var(--secondary)',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(163, 230, 53, 0.4)',
                                                zIndex: 10
                                            }}
                                        >
                                            <ShoppingCart size={18} color="var(--primary)" />
                                        </button>
                                    </div>

                                    {/* Product Info - Only for big cards */}
                                    {isBig && (
                                        <div style={{
                                            padding: '12px 14px',
                                            background: 'rgba(0,0,0,0.2)',
                                            backdropFilter: 'blur(10px)'
                                        }}>
                                            <h3 style={{
                                                fontSize: '13px',
                                                fontWeight: '700',
                                                color: 'white',
                                                margin: '0 0 4px 0',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap'
                                            }}>
                                                {product.name}
                                            </h3>
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{
                                                    fontSize: '15px',
                                                    fontWeight: '900',
                                                    color: 'var(--secondary)'
                                                }}>
                                                    ${product.price}
                                                </span>
                                                <span style={{
                                                    fontSize: '10px',
                                                    color: 'var(--text-dim)',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    padding: '3px 8px',
                                                    borderRadius: '8px'
                                                }}>
                                                    {product.category}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })
                    ) : (
                        <div style={{
                            gridColumn: '1 / -1',
                            textAlign: 'center',
                            padding: '40px 20px',
                            color: 'var(--text-dim)'
                        }}>
                            <p>No hay productos disponibles en esta categoría</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AccessoriesPage;
