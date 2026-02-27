import React, { useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { CheckCircle2, Package, Truck, Pencil, Trash2, ChevronLeft } from 'lucide-react';
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

    const actionsCount = 2; // Edit and Delete
    const dragDistance = -(actionsCount * 64) - 16;

    const onDragEnd = (_: any, info: any) => {
        // If dragged to the left enough, open actions
        if (info.offset.x < -30) {
            controls.start({ x: dragDistance });
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

    const ActionBtn = ({ hexColor, icon, onClick, label }: any) => (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
                width: '56px',
                height: '80px',
                borderRadius: '18px',
                background: `color-mix(in srgb, ${hexColor} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${hexColor} 30%, transparent)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: hexColor,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                cursor: 'pointer'
            }}
        >
            {icon}
            <span style={{ fontSize: '8px', fontWeight: '950', textTransform: 'uppercase' }}>{label}</span>
        </motion.button>
    );

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
                    borderRadius: '32px',
                    overflow: 'hidden',
                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                }}
            >
                {/* Actions Layer (Behind) */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    bottom: 0,
                    width: Math.abs(dragDistance) + 'px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    gap: '8px',
                    paddingRight: '16px',
                    zIndex: 1
                }}>
                    <ActionBtn
                        hexColor="#a3e635"
                        icon={<Pencil size={20} />}
                        onClick={() => { onEdit(product); closeActions(); }}
                        label="EDITAR"
                    />
                    <ActionBtn
                        hexColor="#ef4444"
                        icon={<Trash2 size={20} />}
                        onClick={() => { onDelete(product); closeActions(); }}
                        label="BORRAR"
                    />
                </div>

                {/* Draggable Content Layer */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: dragDistance, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        background: 'rgba(6, 46, 36, 0.98)', // Even Darker Emerald Green
                        borderRadius: '32px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => {
                        if (isOpen) {
                            closeActions();
                        } else {
                            controls.start({ x: dragDistance });
                            setIsOpen(true);
                        }
                    }}
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

                    </div>

                    {/* Swipe Hint Indicator */}
                    {!isOpen && (
                        <motion.div
                            initial={{ opacity: 0.4 }}
                            animate={{ opacity: [0.4, 1, 0.4], x: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)' }}
                        >
                            <ChevronLeft size={16} />
                        </motion.div>
                    )}

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
