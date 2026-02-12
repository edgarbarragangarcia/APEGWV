import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const ClothingPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts(100);
    const { addToCart } = useCart();

    const [selectedType, setSelectedType] = useState('Todos');

    const clothingTypes = ['Todos', 'Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'];

    // Filter products for Ropa category and by clothing_type if selected
    const baseClothingProducts = featuredProducts.filter(product =>
        (product.category || '').toLowerCase() === 'ropa'
    );

    const filteredProducts = selectedType === 'Todos'
        ? baseClothingProducts
        : baseClothingProducts.filter(p => (p as any).clothing_type === selectedType);

    const handleAddToCart = (product: any) => {
        addToCart(product);
    };

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <CategoryHero
                title="Ropa"
                subtitle="Estilo y rendimiento en el campo con nuestra colección exclusiva de prendas técnicas."
                image="/heros/golf_apparel_hero_1770415189416.png"
            />

            {/* Selector de Tipo de Prenda */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 115px)',
                left: 0,
                right: 0,
                zIndex: 20,
                padding: '12px 0',
                background: 'transparent'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    paddingBottom: '8px',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    scrollbarWidth: 'none',
                    width: '100%',
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                    WebkitOverflowScrolling: 'touch'
                }} className="no-scrollbar">
                    {clothingTypes.map((tab) => (
                        <motion.button
                            key={tab}
                            onClick={() => setSelectedType(tab)}
                            whileTap={{ scale: 0.95 }}
                            style={{
                                padding: '6px 14px',
                                borderRadius: '20px',
                                background: selectedType === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                color: selectedType === tab ? 'var(--primary)' : 'white',
                                fontSize: '11px',
                                fontWeight: '600',
                                border: '1px solid ' + (selectedType === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                whiteSpace: 'nowrap',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {tab === 'Todos' ? 'Todo' : tab}
                        </motion.button>
                    ))}
                </div>
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 180px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px calc(var(--nav-height) + 40px) 20px',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                zIndex: 10
            }}>
                {isLoading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '260px', borderRadius: '32px' }} />
                        ))}
                    </div>
                ) : filteredProducts.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            textAlign: 'center',
                            padding: '60px 20px',
                            color: 'var(--text-dim)',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '32px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}
                    >
                        <p style={{ fontSize: '16px', marginBottom: '10px' }}>
                            {selectedType === 'Todos'
                                ? 'No hay productos disponibles en esta categoría'
                                : `No hay ${selectedType.toLowerCase()} disponibles actualmente`
                            }
                        </p>
                        <button
                            onClick={() => {
                                if (selectedType !== 'Todos') setSelectedType('Todos');
                                else navigate('/');
                            }}
                            style={{
                                color: 'var(--secondary)',
                                fontSize: '14px',
                                fontWeight: '700',
                                textDecoration: 'underline'
                            }}
                        >
                            {selectedType !== 'Todos' ? 'Ver todas las prendas' : 'Volver al inicio'}
                        </button>
                    </motion.div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                    }}>
                        <AnimatePresence mode="popLayout">
                            {filteredProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                >
                                    <PremiumProductCard
                                        product={product}
                                        onAddToCart={handleAddToCart}
                                        onClick={() => navigate(`/product/${product.id}`)}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClothingPage;
