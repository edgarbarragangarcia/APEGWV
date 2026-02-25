import React from 'react';
import { motion } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const AccessoriesPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts();
    const { addToCart } = useCart();

    // Filter products for Accesorios category
    const filteredProducts = featuredProducts.filter((product: any) =>
        (product.category || '').toLowerCase() === 'accesorios'
    );

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
                title="Accesorios"
                subtitle="Los detalles que marcan la diferencia. Todo lo que necesitas para complementar tu equipo."
                image="/heros/golf_accessories_hero_1770415216840.png"
                hasFilters={false}
            />


            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 120px)',
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
                            padding: '40px 20px',
                            color: 'var(--text-dim)',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '32px',
                            border: '1px dashed rgba(255,255,255,0.1)'
                        }}
                    >
                        <p style={{ fontSize: '14px', marginBottom: '20px' }}>No hay productos disponibles en esta categoría</p>
                        <button
                            onClick={() => navigate('/')}
                            style={{
                                color: 'var(--secondary)',
                                fontSize: '14px',
                                fontWeight: '700',
                                textDecoration: 'underline'
                            }}
                        >
                            Volver al inicio
                        </button>
                    </motion.div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                    }}>
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{ height: '100%' }}
                            >
                                <PremiumProductCard
                                    product={product}
                                    onAddToCart={handleAddToCart}
                                    onClick={() => navigate(`/product/${product.id}`)}
                                />
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AccessoriesPage;
