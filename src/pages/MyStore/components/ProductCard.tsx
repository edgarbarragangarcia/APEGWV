import React from 'react';
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
        <div className="animate-fade-up">
            <div
                style={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '26px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
            >
                <div style={{ padding: '15px', display: 'flex', gap: '18px', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '90px',
                            height: '90px',
                            borderRadius: '20px',
                            overflow: 'hidden',
                            background: 'var(--primary-light)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            <img
                                src={optimizeImage(product.image_url, { width: 200, height: 200 })}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                alt={product.name}
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                                }}
                            />
                        </div>
                        <div style={{
                            position: 'absolute',
                            bottom: '-6px',
                            right: '-6px',
                            background: product.status === 'active' ? 'var(--secondary)' : '#f59e0b',
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid #062216',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.4)'
                        }}>
                            {product.status === 'active' ? <CheckCircle2 size={14} color="var(--primary)" /> : <Package size={14} color="white" />}
                        </div>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: '900',
                            marginBottom: '5px',
                            color: 'white',
                            letterSpacing: '-0.3px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>{product.name}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '22px', letterSpacing: '-0.5px' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                </span>
                            </div>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: parseFloat(product.shipping_cost?.toString() || '0') > 0 ? 'rgba(56, 189, 248, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                                padding: '4px 10px',
                                borderRadius: '8px',
                                border: '1px solid ' + (parseFloat(product.shipping_cost?.toString() || '0') > 0 ? 'rgba(56, 189, 248, 0.15)' : 'rgba(34, 197, 94, 0.15)'),
                                width: 'fit-content'
                            }}>
                                <Truck size={12} color={parseFloat(product.shipping_cost?.toString() || '0') > 0 ? "#38bdf8" : "#22c55e"} />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '800',
                                    color: parseFloat(product.shipping_cost?.toString() || '0') > 0 ? "#38bdf8" : "#22c55e",
                                    letterSpacing: '0.02em'
                                }}>
                                    {parseFloat(product.shipping_cost?.toString() || '0') > 0
                                        ? `+ $${formatPrice(product.shipping_cost?.toString() || '0')} ENVÍO`
                                        : 'ENVÍO GRATIS'}
                                </span>
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.04)',
                                padding: '6px 12px',
                                borderRadius: '10px',
                                fontSize: '11px',
                                color: 'white',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                border: '1px solid rgba(255,255,255,0.06)'
                            }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: '9px', fontWeight: '800' }}>STOCK:</span>
                                <span style={{ color: (product as any).stock_quantity > 0 ? 'var(--secondary)' : '#ef4444' }}>
                                    {(product as any).stock_quantity || 0}
                                </span>
                            </div>

                            {/* Size Inventory Breakdown */}
                            {Array.isArray((product as any).sizes_inventory) && (product as any).sizes_inventory.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                    {(product as any).sizes_inventory.map((inv: { size: string; quantity: number }, i: number) => (
                                        <span key={i} style={{
                                            background: inv.quantity > 0 ? 'rgba(163, 230, 53, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                                            padding: '2px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            color: inv.quantity > 0 ? 'var(--secondary)' : 'rgba(255,255,255,0.2)',
                                            fontWeight: '900',
                                            border: '1px solid ' + (inv.quantity > 0 ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)')
                                        }}>
                                            {inv.size}: {inv.quantity}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Individual Shoe Size Columns (Fallback) */}
                            {(!Array.isArray((product as any).sizes_inventory) || (product as any).sizes_inventory.length === 0) && (product as any).size_shoes_col && (
                                <span style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    color: 'var(--secondary)',
                                    fontWeight: '900',
                                    border: '1px solid rgba(163, 230, 53, 0.2)'
                                }}>
                                    TALLA COL: {(product as any).size_shoes_col}
                                </span>
                            )}
                            {(!Array.isArray((product as any).sizes_inventory) || (product as any).sizes_inventory.length === 0) && (product as any).size_clothing && (
                                <span style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    padding: '4px 10px',
                                    borderRadius: '8px',
                                    fontSize: '10px',
                                    color: 'var(--secondary)',
                                    fontWeight: '900',
                                    border: '1px solid rgba(163, 230, 53, 0.2)'
                                }}>
                                    TALLA: {(product as any).size_clothing}
                                </span>
                            )}
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingLeft: '5px' }}>
                        <button
                            onClick={(e) => { e.stopPropagation(); onEdit(product); }}
                            style={{
                                color: 'white',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                width: '42px',
                                height: '42px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="hover-scale"
                        >
                            <Pencil size={18} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); onDelete(product); }}
                            style={{
                                color: '#ff6b6b',
                                background: 'rgba(255, 107, 107, 0.05)',
                                border: '1px solid rgba(255, 107, 107, 0.1)',
                                borderRadius: '12px',
                                width: '42px',
                                height: '42px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                            className="hover-scale"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>

                {product.status === 'pending_payment' && (
                    <div style={{ padding: '0 15px 15px' }}>
                        <button
                            onClick={handlePublishNow}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                color: 'var(--primary)',
                                padding: '14px',
                                borderRadius: '15px',
                                fontWeight: '900',
                                fontSize: '13px',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 8px 15px rgba(163, 230, 53, 0.2)',
                                textAlign: 'center'
                            }}
                        >
                            <CheckCircle2 size={18} />
                            PUBLICAR AHORA ($120.000)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCard;
