import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Package, Truck, Pencil, Trash2 } from 'lucide-react';
import { optimizeImage } from '../../../services/SupabaseManager';
import { supabase } from '../../../services/SupabaseManager';
import ConfirmationModal from '../../../components/ConfirmationModal';

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
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    const handlePublishNow = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPublishModalOpen(true);
    };

    const confirmPublish = async () => {
        setIsPublishing(true);
        try {
            const { error } = await supabase
                .from('products')
                .update({ status: 'active' })
                .eq('id', product.id);
            if (error) throw error;

            onStatusUpdate(product.id, 'active');
            onSuccess('¡Publicado!', 'Tu producto ya está activo en el marketplace.', 'success');
            setIsPublishModalOpen(false);
        } catch (err) {
            console.error(err);
            onSuccess('Error', 'No se pudo procesar el pago o activar el producto.', 'error');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '20px', fontFamily: 'var(--font-main)' }}
        >
            <div
                style={{
                    position: 'relative',
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    borderRadius: '32px',
                    border: '1px solid rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)'
                }}
            >
                <div style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'center' }}>
                    {/* Image Section */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{
                            width: '100px',
                            height: '100px',
                            borderRadius: '24px',
                            overflow: 'hidden',
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--glass-border)',
                            boxShadow: '0 8px 25px rgba(0,0,0,0.4)',
                            position: 'relative'
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
                            {/* Inner Shadow Mesh */}
                            <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)', pointerEvents: 'none' }} />
                        </div>
                        {/* Status Badge */}
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '-8px',
                            background: product.status === 'active' ? 'var(--secondary)' : 'rgba(255,166,0,0.9)',
                            backdropFilter: 'blur(5px)',
                            padding: '6px 14px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            boxShadow: '0 8px 15px rgba(0,0,0,0.3)',
                            zIndex: 2,
                            border: '1px solid rgba(255,255,255,0.2)'
                        }}>
                            {product.status === 'active' ? (
                                <CheckCircle2 size={12} color="var(--primary)" strokeWidth={3} />
                            ) : (
                                <Package size={12} color="white" strokeWidth={3} />
                            )}
                            <span style={{
                                fontSize: '10px',
                                fontWeight: '950',
                                color: product.status === 'active' ? 'var(--primary)' : 'white',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em'
                            }}>
                                {product.status === 'active' ? 'Activo' : 'Borrador'}
                            </span>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontSize: '17px',
                            fontWeight: '950',
                            marginBottom: '6px',
                            color: 'white',
                            letterSpacing: '-0.3px',
                            lineHeight: 1.1
                        }}>{product.name}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '14px' }}>
                            <span style={{
                                color: 'var(--secondary)',
                                fontWeight: '950',
                                fontSize: '22px',
                                letterSpacing: '-0.5px',
                                lineHeight: 1
                            }}>
                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                            </span>
                            <div style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                background: 'rgba(56, 189, 248, 0.1)',
                                padding: '4px 8px',
                                borderRadius: '10px',
                                width: 'fit-content',
                                border: '1px solid rgba(56, 189, 248, 0.2)'
                            }}>
                                <Truck size={12} color="#38bdf8" />
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    color: '#38bdf8',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Envío: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.shipping_cost || 0)}
                                </span>
                            </div>
                        </div>

                        {/* Stock & Info Pills */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{
                                background: 'rgba(255,255,255,0.06)',
                                padding: '6px 14px',
                                borderRadius: '14px',
                                fontSize: '11px',
                                color: 'white',
                                fontWeight: '900',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Disponibles</span>
                                <span style={{ color: (product as any).stock_quantity > 0 ? 'var(--secondary)' : '#ff6b6b' }}>
                                    {(product as any).stock_quantity || 0}
                                </span>
                            </div>

                            {/* Sizes Pill Container */}
                            {Array.isArray((product as any).sizes_inventory) && (product as any).sizes_inventory.length > 0 && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    padding: '6px 14px',
                                    background: 'rgba(255,255,255,0.04)',
                                    borderRadius: '14px',
                                    border: '1px solid var(--glass-border)'
                                }}>
                                    {(product as any).sizes_inventory.slice(0, 3).map((inv: { size: string; quantity: number }, i: number) => (
                                        <span key={i} style={{
                                            fontSize: '11px',
                                            color: inv.quantity > 0 ? 'white' : 'rgba(255,255,255,0.2)',
                                            fontWeight: '900'
                                        }}>
                                            {inv.size}
                                        </span>
                                    ))}
                                    {(product as any).sizes_inventory.length > 3 && (
                                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '900' }}>+{(product as any).sizes_inventory.length - 3}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Actions Pillar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', justifyContent: 'center' }}>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onEdit(product); }}
                            style={{
                                color: 'white',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '16px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <Pencil size={18} strokeWidth={2.5} />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05, backgroundColor: 'rgba(239, 68, 68, 0.15)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDelete(product); }}
                            style={{
                                color: '#ef4444',
                                background: 'rgba(239, 68, 68, 0.08)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '16px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                        >
                            <Trash2 size={18} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </div>

                {product.status === 'pending_payment' && (
                    <div style={{ padding: '0 24px 24px' }}>
                        <button
                            onClick={handlePublishNow}
                            className="btn-primary"
                            style={{
                                height: '56px',
                                fontSize: '14px',
                                letterSpacing: '0.05em',
                                background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                borderRadius: '20px'
                            }}
                        >
                            <CheckCircle2 size={20} strokeWidth={3} />
                            PUBLICAR AHORA ($120.000)
                        </button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                onConfirm={confirmPublish}
                title="¿Publicar Producto?"
                message={`Estás por publicar "${product.name}". Esto activará el producto en el marketplace para que todos puedan verlo.`}
                confirmText={isPublishing ? "Publicando..." : "Sí, publicar ahora"}
                type="info"
                isLoading={isPublishing}
            />
        </motion.div>
    );
};

export default ProductCard;
