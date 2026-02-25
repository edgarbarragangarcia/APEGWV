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
}

const ProductsTab: React.FC<ProductsTabProps> = ({
    products,
    searchTerm,
    onSearchChange,
    onEdit,
    onDelete,
    onToggleStatus,
    onAddClick
}) => {
    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.8 }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar en mis productos..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.06)',
                            borderRadius: '20px',
                            padding: '18px 20px 18px 52px',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: '600',
                            outline: 'none',
                            transition: 'all 0.3s ease',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
                        }}
                    />
                </div>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={onAddClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        alignSelf: 'flex-end',
                        padding: '6px 14px',
                        background: 'var(--secondary)',
                        color: 'var(--primary)',
                        borderRadius: '10px',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '11px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontFamily: 'var(--font-main)',
                        boxShadow: '0 4px 15px rgba(163, 230, 53, 0.2)'
                    }}
                >
                    <Plus size={14} strokeWidth={3} /> Publicar Producto
                </motion.button>
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
            ) : filteredProducts.length === 0 && searchTerm ? (
                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                    <Package size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron productos que coincidan con tu búsqueda.</p>
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
                            onSuccess={() => { }} // Success handling is now global in MyStore
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductsTab;
