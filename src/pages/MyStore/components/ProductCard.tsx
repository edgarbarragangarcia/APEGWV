import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Pencil, Trash2 } from 'lucide-react';
import { optimizeImage } from '../../../services/SupabaseManager';
import { supabase } from '../../../services/SupabaseManager';

import type { Product } from '../hooks/useStoreData';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (product: Product) => void;
    onStatusUpdate: (productId: string, newStatus: string) => void;
    onSuccess: (title: string, message: string, type: 'success' | 'error') => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
    product,
    onEdit,
    onDelete,
    onStatusUpdate,
    onSuccess
}) => {
    const formatPrice = (val: string | number) => {
        const numeric = val.toString().replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
    };

    const handlePublishNow = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            const confirmed = confirm('¿Pagar 120,000 COP para publicar este producto?');
            if (confirmed) {
                const { error } = await supabase
                    .from('products')
                    .update({ status: 'active' })
                    .eq('id', product.id);
                if (error) throw error;

                onStatusUpdate(product.id, 'active');
                onSuccess('¡Publicado!', 'Tu producto ya está activo en el marketplace.', 'success');
            }
        } catch (err) {
            console.error(err);
            onSuccess('Error', 'No se pudo procesar el pago o activar el producto.', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '15px' }}
        >
            <div
                style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    borderRadius: '30px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)'
                }}
            >
                <div style={{ padding: '20px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* Image Section */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                        }}>
                            <img
                                src={optimizeImage(product.image_url, { width: 300, height: 300 })}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={product.name}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                }}
                            />
                        </div>
                        {/* Status Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            background: product.status === 'active' ? 'var(--secondary)' : '#f59e0b',
                            padding: '4px 8px',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            zIndex: 2,
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {product.status === 'active' ? (
                                <CheckCircle2 size={10} color="var(--primary)" strokeWidth={3} />
                            ) : (
                                <Package size={10} color="white" strokeWidth={3} />
                            )}
                            <span style={{
                                fontSize: '8px',
                                fontWeight: '900',
                                color: product.status === 'active' ? 'var(--primary)' : 'white',
                                textTransform: 'uppercase'
                            }}>
                                {product.status === 'active' ? 'Activo' : 'Borrador'}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '700',
                            marginBottom: '4px',
                            color: 'white',
                            letterSpacing: '-0.01em',
                            lineHeight: 1.2,
                            fontFamily: 'var(--font-main)'
                        }}>{product.name}</h3>

                        <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', marginBottom: '10px' }}>
                            <span style={{
                                color: 'var(--secondary)',
                                fontWeight: '700',
                                fontSize: '20px',
                                letterSpacing: '-0.02em',
                                fontFamily: 'var(--font-main)'
                            }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                            </span>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                opacity: 0.8
                            }}>
                                <Truck size={11} color="#38bdf8" />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '600',
                                    color: '#38bdf8',
                                    fontFamily: 'var(--font-main)'
                                }}>
                                    + {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.shipping_cost || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Stock & Info Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.05)',
                                padding: '5px 12px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                color: 'white',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: '1px solid rgba(255,255,255,0.08)'
                            }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: '9px' }}>STOCK</span>
                                <span style={{ color: (product as any).stock_quantity > 0 ? 'var(--secondary)' : '#ff6b6b' }}>
                                    {(product as any).stock_quantity || 0}
                                </span>
                            </div>

                            {/* Sizes Pill Container */}
                            {Array.isArray((product as any).sizes_inventory) && (product as any).sizes_inventory.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '6px',
                                    padding: '5px 8px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    {(product as any).sizes_inventory.slice(0, 3).map((inv: { size: string; quantity: number }, i: number) => (
                                        <span key={i} style={{
                                            fontSize: '9px',
                                            color: inv.quantity > 0 ? 'white' : 'rgba(255,255,255,0.2)',
                                            fontWeight: '800'
                                        }}>
                                            {inv.size}
                                        </span>
                                    ))}
                                    {(product as any).sizes_inventory.length > 3 && (
                                        <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>...</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Pillar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(product); }}
                            style={{
                                color: 'white',
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Pencil size={20} strokeWidth={2.5} />
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(product); }}
                            style={{
                                color: '#ff6b6b',
                                background: 'rgba(255, 107, 107, 0.08)',
                                border: '1px solid rgba(255, 107, 107, 0.15)',
                                borderRadius: '16px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <Trash2 size={20} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </div>

                {product.status === 'pending_payment' && (
                    <div style={{ padding: '0 20px 20px' }}>
                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handlePublishNow}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                color: 'var(--primary)',
                                padding: '16px',
                                borderRadius: '20px',
                                fontWeight: '950',
                                fontSize: '13px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 10px 20px rgba(163, 230, 53, 0.3)',
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                        >
                            <CheckCircle2 size={18} strokeWidth={3} />
                            PUBLICAR AHORA ($120.000)
                        </motion.button>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default ProductCard;
