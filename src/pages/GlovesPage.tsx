import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import FilterModal from '../components/FilterModal';

const GlovesPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts(50);
    const { addToCart } = useCart();

    const [selectedBrand, setSelectedBrand] = useState('Todos');
    const [selectedSize, setSelectedSize] = useState('Todos');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Filter products for Guantes category
    const gloveProducts = featuredProducts.filter((product: any) =>
        (product.category || '').toLowerCase() === 'guantes'
    );

    // Dynamic filters options
    const brands = ['Todos', ...new Set(gloveProducts.map((p: any) => p.brand || 'APEG'))] as string[];
    const sizes = ['Todos', ...new Set(gloveProducts.flatMap((p: any) =>
        (p.sizes_inventory || []).map((s: any) => s.size)
    ).filter(Boolean))] as string[];

    const filteredProducts = gloveProducts.filter((p: any) => {
        const brand = p.brand || 'APEG';
        const matchesBrand = selectedBrand === 'Todos' || brand === selectedBrand;
        const matchesSize = selectedSize === 'Todos' || (p.sizes_inventory || []).some((s: any) => s.size === selectedSize);
        return matchesBrand && matchesSize;
    });

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
                title="Guantes"
                subtitle="El contacto perfecto. Piel premium para una sensación y agarre inigualables."
                image="/heros/golf_gloves_hero_1770415231000.png"
                onFilterClick={() => setIsFilterModalOpen(true)}
                hasFilters={brands.length > 1 || sizes.length > 1}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onClear={() => {
                    setSelectedBrand('Todos');
                    setSelectedSize('Todos');
                }}
                resultsCount={filteredProducts.length}
            >
                {brands.length > 1 && (
                    <FilterBar
                        label="Marca"
                        options={brands}
                        selectedValue={selectedBrand}
                        onSelect={setSelectedBrand}
                    />
                )}
                {sizes.length > 1 && (
                    <FilterBar
                        label="Talla"
                        options={sizes}
                        selectedValue={selectedSize}
                        onSelect={setSelectedSize}
                    />
                )}
            </FilterModal>

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
                        <p style={{ fontSize: '14px', marginBottom: '20px' }}>No hay productos que coincidan con los filtros seleccionados</p>
                        <button
                            onClick={() => {
                                setSelectedBrand('Todos');
                                setSelectedSize('Todos');
                            }}
                            style={{
                                color: 'var(--secondary)',
                                fontSize: '14px',
                                fontWeight: '700',
                                textDecoration: 'underline'
                            }}
                        >
                            Limpiar filtros
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

export default GlovesPage;
