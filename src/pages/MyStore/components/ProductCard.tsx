import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CheckCircle2, Package, Truck, Pencil, Trash2, ArrowLeft } from 'lucide-react';
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
    const controls = useAnimation();
    const [isOpen, setIsOpen] = useState(false);

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

    const onDragEnd = (event: any, info: any) => {
        // If dragged more than 40px to the left, snap to open position
        if (info.offset.x < -40) {
            controls.start({ x: -90 });
            setIsOpen(true);
        } else {
            controls.start({ x: 0 });
            setIsOpen(false);
        }
    };

    const closeActions = () => {
        controls.start({ x: 0 });
        setIsOpen(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginBottom: '16px', fontFamily: 'var(--font-main)', position: 'relative' }}
        >
            <div
                style={{
                    position: 'relative',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '24px',
                    overflow: 'hidden',
                }}
            >
                {/* Actions Layer (Behind) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: '90px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    paddingRight: '10px',
                    zIndex: 1
                }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onEdit(product); closeActions(); }}
                        style={{
                            color: 'white',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Pencil size={18} strokeWidth={2.5} />
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => { e.stopPropagation(); onDelete(product); closeActions(); }}
                        style={{
                            color: '#ef4444',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                        }}
                    >
                        <Trash2 size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>

                {/* Draggable Content Layer */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: -90, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        background: 'rgba(6, 46, 36, 0.98)', // Even Darker Emerald Green
                        borderRadius: '24px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => { if (isOpen) closeActions(); }}
                >
                    <div style={{ padding: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {/* Image Section */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '20px',
                                overflow: 'hidden',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                position: 'relative'
                            }}>
                                <img
                                    src={optimizeImage(product.image_url, { width: 250, height: 250 })}
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
                                top: '-6px',
                                left: '-6px',
                                background: product.status === 'active' ? 'var(--secondary)' : '#f59e0b',
                                padding: '4px 10px',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                                zIndex: 3,
                                border: '1px solid rgba(255,255,255,0.2)'
                            }}>
                                {product.status === 'active' ? (
                                    <CheckCircle2 size={10} color="var(--primary)" strokeWidth={3} />
                                ) : (
                                    <Package size={10} color="white" strokeWidth={3} />
                                )}
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '900',
                                    color: product.status === 'active' ? 'var(--primary)' : 'white',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}>
                                    {product.status === 'active' ? 'Activo' : 'Borrador'}
                                </span>
                            </div>
                        </div>

                        {/* Content Section */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <h3 style={{
                                fontSize: '15px',
                                fontWeight: '800',
                                marginBottom: '4px',
                                color: 'white',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}>{product.name}</h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
                                <span style={{
                                    color: 'var(--secondary)',
                                    fontWeight: '900',
                                    fontSize: '18px',
                                    lineHeight: 1
                                }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price || 0)}
                                </span>
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    background: 'rgba(163, 230, 53, 0.08)',
                                    padding: '3px 6px',
                                    borderRadius: '8px',
                                    width: 'fit-content',
                                    border: '1px solid rgba(163, 230, 53, 0.15)'
                                }}>
                                    <Truck size={10} color="var(--secondary)" />
                                    <span style={{
                                        fontSize: '9px',
                                        fontWeight: '800',
                                        color: 'var(--secondary)',
                                        textTransform: 'uppercase'
                                    }}>
                                        Envío: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.shipping_cost || 0)}
                                    </span>
                                </div>
                            </div>

                            {/* Stock & Info Pills */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.04)',
                                    padding: '4px 10px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    color: 'white',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '9px', textTransform: 'uppercase' }}>Stock</span>
                                    <span style={{ color: (product as any).stock_quantity > 0 ? 'var(--secondary)' : '#ff6b6b' }}>
                                        {(product as any).stock_quantity || 0}
                                    </span>
                                </div>

                                {Array.isArray((product as any).sizes_inventory) && (product as any).sizes_inventory.length > 0 && (
                                    <div style={{
                                        display: 'flex',
                                        gap: '6px',
                                        padding: '4px 10px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        {(product as any).sizes_inventory.slice(0, 3).map((inv: any, i: number) => (
                                            <span key={i} style={{
                                                fontSize: '10px',
                                                color: inv.quantity > 0 ? 'white' : 'rgba(255,255,255,0.2)',
                                                fontWeight: '700'
                                            }}>
                                                {inv.size}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Swipe Hint */}
                        <div style={{ opacity: isOpen ? 1 : 0.2, transition: '0.3s all' }}>
                            <motion.div animate={isOpen ? { x: 0, rotate: 180 } : { x: [0, -3, 0] }} transition={{ repeat: isOpen ? 0 : Infinity, duration: 2 }}>
                                {isOpen ? <ArrowLeft size={16} color="var(--secondary)" /> : <Trash2 size={12} />}
                            </motion.div>
                        </div>
                    </div>

                    {product.status === 'pending_payment' && (
                        <div style={{ padding: '0 16px 16px' }}>
                            <button
                                onClick={handlePublishNow}
                                style={{
                                    width: '100%',
                                    height: '44px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    border: 'none',
                                    borderRadius: '14px',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                <CheckCircle2 size={16} strokeWidth={3} />
                                PUBLICAR AHORA
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>

            <ConfirmationModal
                isOpen={isPublishModalOpen}
                onClose={() => setIsPublishModalOpen(false)}
                onConfirm={confirmPublish}
                title="¿Publicar Producto?"
                message={`Estás por publicar "${product.name}".`}
                confirmText={isPublishing ? "Publicando..." : "Sí, publicar ahora"}
                type="info"
                isLoading={isPublishing}
            />
        </motion.div>
    );
};

export default ProductCard;
