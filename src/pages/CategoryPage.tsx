import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';

interface CategoryConfig {
    title: string;
    subtitle: string;
    image: string;
    dbCategory: string;
}

const CATEGORY_MAP: Record<string, CategoryConfig> = {
    'bolas': {
        title: 'Bolas',
        subtitle: 'Encuentra la bola perfecta para tu nivel de juego y maximiza tu distancia.',
        image: '/heros/golf_balls_hero_177041563307.png',
        dbCategory: 'bolas'
    },
    'ropa': {
        title: 'Ropa',
        subtitle: 'Estilo y rendimiento en el campo con nuestra colección exclusiva de prendas técnicas.',
        image: '/heros/golf_apparel_hero_1770415189416.png',
        dbCategory: 'ropa'
    },
    'accesorios': {
        title: 'Accesorios',
        subtitle: 'Los detalles que marcan la diferencia. Todo lo que necesitas para complementar tu equipo.',
        image: '/heros/golf_accessories_hero_1770415216840.png',
        dbCategory: 'accesorios'
    },
    'zapatos': {
        title: 'Zapatos',
        subtitle: 'Comodidad y estabilidad superior para que camines con confianza cada hoyo.',
        image: '/heros/golf_shoes_hero_1770415202682.png',
        dbCategory: 'zapatos'
    },
    'palos': {
        title: 'Palos',
        subtitle: 'El corazón de tu juego. Tecnología de vanguardia para alcanzar tu máximo potencial.',
        image: '/heros/golf_clubs_hero_1770415175713.png',
        dbCategory: 'palos'
    },
    'guantes': {
        title: 'Guantes',
        subtitle: 'El contacto perfecto. Piel premium para una sensación y agarre inigualables.',
        image: '/heros/golf_gloves_hero_1770415231000.png',
        dbCategory: 'guantes'
    },
    'gorras': {
        title: 'Gorras',
        subtitle: 'El toque final de tu outfit. Estilo clásico y moderno para protegerte con elegancia.',
        image: '/heros/golf_accessories_hero_1770415216840.png',
        dbCategory: 'gorras'
    },
    'otros': {
        title: 'Otros',
        subtitle: 'Descubre accesorios y complementos únicos para perfeccionar cada detalle de tu experiencia.',
        image: '/heros/golf_accessories_hero_1770415216840.png',
        dbCategory: 'otros'
    }
};

const CategoryPage: React.FC = () => {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts();
    const { addToCart } = useCart();

    const config = categoryId ? CATEGORY_MAP[categoryId.toLowerCase()] : null;

    if (!config) {
        return (
            <div style={{ padding: '100px 20px', textAlign: 'center', color: 'white' }}>
                <h2>Categoría no encontrada</h2>
                <button onClick={() => navigate('/')} style={{ color: 'var(--secondary)', marginTop: '10px' }}>Volver al inicio</button>
            </div>
        );
    }

    // Filter products for category
    const filteredProducts = featuredProducts.filter((product: any) =>
        (product.category || '').toLowerCase() === config.dbCategory
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
                title={config.title}
                subtitle={config.subtitle}
                image={config.image}
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
                padding: '10px 20px 120px 20px',
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                zIndex: 10
            }}>
                {isLoading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gridAutoRows: '260px',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div key={i} className="skeleton" style={{ height: '100%', borderRadius: '32px' }} />
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
                        gridAutoRows: '260px',
                        gap: '12px',
                        justifyContent: 'center'
                    }}>
                        {filteredProducts.map((product, index) => (
                            <motion.div
                                key={product.id || `product-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                style={{ height: '100%', minWidth: 0, overflow: 'hidden' }}
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

export default CategoryPage;
