import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryHero from '../components/CategoryHero';
import PremiumProductCard from '../components/PremiumProductCard';
import { useFeaturedProducts } from '../hooks/useHomeData';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import FilterBar from '../components/FilterBar';


const ClothingPage: React.FC = () => {
    const navigate = useNavigate();
    const { data: featuredProducts = [], isLoading } = useFeaturedProducts(100);
    const { addToCart } = useCart();

    const [selectedType, setSelectedType] = useState('Todos');
    const [selectedBrand, setSelectedBrand] = useState('Todos');
    const [selectedSize, setSelectedSize] = useState('Todos');

    const clothingTypes = ['Todos', 'Camisa', 'Camiseta', 'Pantalón', 'Short', 'Buso / Chaqueta', 'Gorra', 'Otro'];

    // Filter products for Ropa category
    const baseClothingProducts = featuredProducts.filter((product: any) =>
        (product.category || '').toLowerCase() === 'ropa'
    );

    // Dynamic filters options
    const brands = ['Todos', ...new Set(baseClothingProducts.map((p: any) => p.brand).filter(Boolean))] as string[];
    const sizes = ['Todos', ...new Set(baseClothingProducts.flatMap((p: any) =>
        (p.sizes_inventory || []).map((s: any) => s.size)
    ).filter(Boolean))] as string[];

    const filteredProducts = baseClothingProducts.filter((p: any) => {
        const matchesType = selectedType === 'Todos' || (p as any).clothing_type === selectedType;
        const matchesBrand = selectedBrand === 'Todos' || p.brand === selectedBrand;
        const matchesSize = selectedSize === 'Todos' || (p.sizes_inventory || []).some((s: any) => s.size === selectedSize);
        return matchesType && matchesBrand && matchesSize;
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
                title="Ropa"
                subtitle="Estilo y rendimiento en el campo con nuestra colección exclusiva de prendas técnicas."
                image="/heros/golf_apparel_hero_1770415189416.png"
            />

            {/* Filtros */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 90px)', // Movido arriba
                left: 0,
                right: 0,
                zIndex: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                background: 'transparent'
            }}>
                <FilterBar
                    label="Tipo"
                    options={clothingTypes}
                    selectedValue={selectedType}
                    onSelect={setSelectedType}
                />

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
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 260px)', // Ajustado para los filtros
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
                        <p style={{ fontSize: '14px', marginBottom: '10px' }}>
                            No hay productos que coincidan con los filtros seleccionados
                        </p>
                        <button
                            onClick={() => {
                                setSelectedType('Todos');
                                setSelectedBrand('Todos');
                                setSelectedSize('Todos');
                            }}
                            style={{
                                color: 'var(--secondary)',
                                fontSize: '13px',
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
