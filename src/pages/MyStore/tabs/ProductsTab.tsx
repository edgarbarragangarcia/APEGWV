import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Package, Search, Plus } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import type { Product } from '../hooks/useStoreData';

interface ProductsTabProps {
    products: Product[];
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onToggleStatus: (productId: string, newStatus: string) => void;
    onAddClick: () => void;
    onSuccess: (title: string, message: string, type: 'success' | 'error') => void;
}

const ProductsTab: React.FC<ProductsTabProps> = ({
    products,
    searchTerm,
    onSearchChange,
    onEdit,
    onDelete,
    onToggleStatus,
    onAddClick,
    onSuccess
}) => {
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [selectedStatus, setSelectedStatus] = useState('Todos');

    // Default categories if products is empty, or dynamic from products
    const categories = useMemo(() => {
        const base = ['Todos', 'Ropa', 'Accesorios', 'Bolas', 'Zapatos', 'Palos', 'Guantes', 'Gorras', 'Otros'];
        const unique = new Set<string>(base);
        products.forEach(p => { if (p.category) unique.add(p.category); });
        return Array.from(unique);
    }, [products]);

    const filteredProducts = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'Todos' || p.category === selectedCategory;
        const matchesStatus = selectedStatus === 'Todos' ||
            (selectedStatus === 'Activos' && p.status === 'active') ||
            (selectedStatus === 'Borradores' && p.status === 'draft');
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.8 }} size={16} />
                    <input
                        type="text"
                        placeholder="Buscar en mis productos..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '16px',
                            padding: '12px 16px 12px 42px',
                            color: 'white',
                            fontSize: '14px',
                            fontWeight: '600',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>

                {/* Category Filter */}
                <div style={{
                    display: 'flex',
                    gap: '8px',
                    overflowX: 'auto',
                    padding: '2px 0 8px',
                    margin: '0 -16px',
                    paddingLeft: '16px',
                    paddingRight: '16px'
                }} className="hide-scrollbar">
                    {categories.map(cat => (
                        <motion.button
                            key={cat}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedCategory(cat)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '12px',
                                background: selectedCategory === cat ? 'rgba(163, 230, 53, 0.15)' : 'rgba(255,255,255,0.03)',
                                color: selectedCategory === cat ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                border: '1px solid ' + (selectedCategory === cat ? 'rgba(163, 230, 53, 0.3)' : 'rgba(255,255,255,0.06)'),
                                fontSize: '11px',
                                fontWeight: '800',
                                whiteSpace: 'nowrap',
                                cursor: 'pointer',
                                transition: '0.3s all cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            {cat}
                        </motion.button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                    <div style={{ display: 'flex', gap: '3px', background: 'rgba(255,255,255,0.03)', padding: '3px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        {['Todos', 'Activos', 'Borradores'].map(status => (
                            <motion.button
                                key={status}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedStatus(status)}
                                style={{
                                    padding: '5px 10px',
                                    borderRadius: '7px',
                                    background: selectedStatus === status ? 'rgba(255,255,255,0.08)' : 'transparent',
                                    color: selectedStatus === status ? 'white' : 'rgba(255,255,255,0.4)',
                                    border: 'none',
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {status}
                            </motion.button>
                        ))}
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddClick}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '10px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            fontFamily: 'var(--font-main)'
                        }}
                    >
                        <Plus size={14} strokeWidth={3} /> Publicar
                    </motion.button>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '30px' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                        <Package size={32} color="var(--text-dim)" style={{ opacity: 0.5 }} />
                    </div>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Tu tienda está vacía</h3>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>¡Sube tu primer producto y comienza a vender!</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                    <Package size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron productos con estos filtros.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredProducts.map((product, index) => (
                        <ProductCard
                            key={product.id || `product-${index}`}
                            product={product}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onStatusUpdate={onToggleStatus}
                            onSuccess={onSuccess}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsTab;
