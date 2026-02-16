import React, { useState } from 'react';
import { motion } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';
import FilterModal from '../components/FilterModal';

const ClubsPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts(50);
    const { addToCart } = useCart();

    const [selectedBrand, setSelectedBrand] = useState('Todos');
    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

    // Filter products for Palos category
    const clubProducts = featuredProducts.filter((product: any) =>
        (product.category || '').toLowerCase() === 'palos'
    );

    // Dynamic filters options
    const brands = ['Todos', ...new Set(clubProducts.map((p: any) => p.brand || 'APEG'))] as string[];

    const filteredProducts = clubProducts.filter((p: any) => {
        const brand = p.brand || 'APEG';
        return selectedBrand === 'Todos' || brand === selectedBrand;
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
                title="Palos"
                subtitle="El corazón de tu juego. Tecnología de vanguardia para alcanzar tu máximo potencial."
                image="/heros/golf_clubs_hero_1770415175713.png"
                onFilterClick={() => setIsFilterModalOpen(true)}
                hasFilters={brands.length > 1}
            />

            <FilterModal
                isOpen={isFilterModalOpen}
                onClose={() => setIsFilterModalOpen(false)}
                onClear={() => setSelectedBrand('Todos')}
                resultsCount={filteredProducts.length}
            >
                <FilterBar
                    label="Marca"
                    options={brands}
                    selectedValue={selectedBrand}
                    onSelect={setSelectedBrand}
                />
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
                                if (selectedBrand !== 'Todos') setSelectedBrand('Todos');
                                else navigate('/');
                            }}
                            style={{
                                color: 'var(--secondary)',
                                fontSize: '14px',
                                fontWeight: '700',
                                textDecoration: 'underline'
                            }}
                        >
                            {selectedBrand !== 'Todos' ? 'Limpiar filtros' : 'Volver al inicio'}
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

export default ClubsPage;
