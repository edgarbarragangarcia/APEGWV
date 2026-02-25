import React from 'react';
import { Calendar, Settings, Package, User, Phone, MapPin, Loader2, Camera, Truck, CheckCircle2 } from 'lucide-react';
import { optimizeImage } from '../../../services/SupabaseManager';

import type { Order } from '../hooks/useStoreData';

interface OrderCardProps {
    order: Order;
    updatingOrder: string | null;
    editingTrackingId: string | null;
    onStatusUpdate: (orderId: string, newStatus: string) => void;
    onTrackingUpdate: (orderId: string, trackingNum: string, provider: string) => void;
    onEditClick: (order: Order) => void;
    onSetScanningOrderId: (orderId: string) => void;
    onShowScanner: (show: boolean) => void;
    onSetEditingTrackingId: (orderId: string | null) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
    order,
    updatingOrder,
    editingTrackingId,
    onStatusUpdate,
    onTrackingUpdate,
    onEditClick,
    onSetScanningOrderId,
    onShowScanner,
    onSetEditingTrackingId
}) => {
    return (
        <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        padding: '6px 14px',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: '900',
                        background: order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                        color: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                        letterSpacing: '0.05em'
                    }}>
                        {order.status?.toUpperCase() || 'PENDIENTE'}
                    </span>
                    {order.order_number && (
                        <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--secondary)' }}>
                            {order.order_number}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600' }}>
                        <Calendar size={12} />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '---'}
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(order);
                        }}
                        style={{
                            padding: '8px',
                            borderRadius: '12px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            border: '1px solid rgba(163, 230, 53, 0.2)',
                            color: 'var(--secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: '0.2s',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
                        }}
                    >
                        <Settings size={16} />
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <img
                        src={optimizeImage(order.product?.image_url || null, { width: 150, height: 150 })}
                        style={{ width: '65px', height: '65px', borderRadius: '16px', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }}
                        alt=""
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                        }}
                    />
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--secondary)', width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0e2f1f' }}>
                        <Package size={10} color="var(--primary)" />
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px' }}>{order.product?.name}</h4>
                    <p style={{ fontSize: '16px', color: 'var(--secondary)', fontWeight: '900' }}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.seller_net_amount || 0)}
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '600', marginLeft: '5px' }}>NETOS</span>
                    </p>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '18px', padding: '15px', marginBottom: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <User size={12} /> Información del Comprador
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={14} color="var(--text-dim)" />
                        </div>
                        <span style={{ fontWeight: '600' }}>{order.buyer_name || order.buyer?.full_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Phone size={14} color="var(--text-dim)" />
                        </div>
                        <span style={{ fontWeight: '600' }}>{order.buyer_phone || order.buyer?.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '2px' }}>
                            <MapPin size={14} color="var(--text-dim)" />
                        </div>
                        <span style={{ lineHeight: '1.4', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }}>{order.shipping_address}</span>
                    </div>
                </div>
            </div>

            {order.status === 'Pendiente' && (
                <button
                    onClick={() => onStatusUpdate(order.id, 'Preparando')}
                    disabled={updatingOrder === order.id}
                    style={{
                        width: '100%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        color: '#60a5fa',
                        padding: '14px',
                        borderRadius: '16px',
                        fontWeight: '800',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.1)'
                    }}
                >
                    {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} />}
                    {updatingOrder === order.id ? 'ACTUALIZANDO...' : 'LISTO PARA DESPACHO'}
                </button>
            )}

            {(order.status === 'Preparando' || order.status === 'Pagado' || editingTrackingId === order.id) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <p style={{ fontSize: '11px', fontWeight: '900', color: 'white', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {editingTrackingId === order.id ? 'Editar Datos de Envío' : 'Actualizar Guía de Envío'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                            id={`provider-${order.id}`}
                            placeholder="Transportadora (Servientrega, Coordinadora...)"
                            defaultValue={order.shipping_provider || ''}
                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                id={`tracking-${order.id}`}
                                placeholder="No. Guía"
                                defaultValue={order.tracking_number || ''}
                                style={{ flex: 1, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', fontSize: '13px', color: 'white', outline: 'none' }}
                            />
                            <button
                                onClick={() => {
                                    onSetScanningOrderId(order.id);
                                    onShowScanner(true);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    borderRadius: '12px',
                                    width: '46px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0
                                }}
                                title="Escanear Guía"
                            >
                                <Camera size={20} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {editingTrackingId === order.id && (
                            <button
                                onClick={() => onSetEditingTrackingId(null)}
                                className="glass"
                                style={{
                                    padding: '14px',
                                    borderRadius: '16px',
                                    cursor: 'pointer',
                                    color: 'var(--text-dim)',
                                    fontWeight: '700',
                                    fontSize: '13px'
                                }}
                            >
                                CANCELAR
                            </button>
                        )}

                        <button
                            onClick={() => {
                                const prov = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                                const track = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                                onTrackingUpdate(order.id, track, prov);
                            }}
                            disabled={updatingOrder === order.id}
                            style={{
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                padding: '14px',
                                borderRadius: '16px',
                                fontWeight: '900',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                boxShadow: '0 8px 20px rgba(163, 230, 53, 0.2)'
                            }}
                        >
                            {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
                            {editingTrackingId === order.id ? 'GUARDAR CAMBIOS' : 'MARCAR COMO ENVIADO'}
                        </button>
                    </div>
                </div>
            )}

            {order.status === 'Enviado' && editingTrackingId !== order.id && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '16px',
                    borderRadius: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckCircle2 size={20} color="#10b981" />
                        </div>
                        <div>
                            <p style={{ fontWeight: '800', color: '#10b981', fontSize: '14px' }}>Producto Enviado</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{order.shipping_provider} • {order.tracking_number}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => onEditClick(order)}
                        style={{
                            padding: '8px',
                            borderRadius: '8px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-dim)',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: '0.2s'
                        }}
                    >
                        <Pencil size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

// Add Pencil icon if not already in lucide imports
import { Pencil } from 'lucide-react';

export default OrderCard;
