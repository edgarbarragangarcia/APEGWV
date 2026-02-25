import { motion } from 'framer-motion';
import { Calendar, Settings, Package, User, Phone, MapPin, Loader2, Camera, Truck, CheckCircle2, Pencil } from 'lucide-react';
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
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
                padding: '24px',
                background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '32px',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                fontFamily: 'var(--font-main)'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                        padding: '6px 14px',
                        borderRadius: '14px',
                        fontSize: '10px',
                        fontWeight: '950',
                        background: order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        color: order.status === 'Pendiente' ? '#f59e0b' : '#10b981',
                        border: `1px solid ${order.status === 'Pendiente' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase'
                    }}>
                        {order.status || 'PENDIENTE'}
                    </span>
                    {order.order_number && (
                        <span style={{ fontSize: '12px', fontWeight: '900', color: 'var(--secondary)', opacity: 0.9 }}>
                            #{order.order_number}
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', fontWeight: '800' }}>
                        <Calendar size={14} strokeWidth={2.5} />
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : '---'}
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            onEditClick(order);
                        }}
                        style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '14px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: '0.2s'
                        }}
                    >
                        <Settings size={18} strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '18px', marginBottom: '22px', alignItems: 'center' }}>
                <div style={{ position: 'relative' }}>
                    <div style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 8px 20px rgba(0,0,0,0.3)'
                    }}>
                        <img
                            src={optimizeImage(order.product?.image_url || null, { width: 150, height: 150 })}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt=""
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200';
                            }}
                        />
                    </div>
                    <div style={{ position: 'absolute', bottom: '-5px', right: '-5px', background: 'var(--secondary)', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '3px solid #061c12', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                        <Package size={12} color="var(--primary)" strokeWidth={3} />
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ fontSize: '17px', fontWeight: '950', marginBottom: '6px', color: 'white', letterSpacing: '-0.3px' }}>{order.product?.name}</h4>
                    <p style={{ fontSize: '20px', color: 'var(--secondary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(order.seller_net_amount || 0)}
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '900', marginLeft: '6px', letterSpacing: '0.5px' }}>NETOS</span>
                    </p>
                </div>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '24px', padding: '18px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ fontSize: '10px', fontWeight: '950', color: 'var(--secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.8 }}>
                    <User size={12} strokeWidth={3} /> Cliente
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <User size={14} color="var(--secondary)" />
                        </div>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: 'white' }}>{order.buyer_name || order.buyer?.full_name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <Phone size={14} color="var(--secondary)" />
                        </div>
                        <span style={{ fontWeight: '700', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>{order.buyer_phone || order.buyer?.phone}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.06)', marginTop: '2px' }}>
                            <MapPin size={14} color="var(--secondary)" />
                        </div>
                        <span style={{ lineHeight: '1.5', fontWeight: '600', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>{order.shipping_address}</span>
                    </div>
                </div>
            </div>

            {order.status === 'Pendiente' && (
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onStatusUpdate(order.id, 'Preparando')}
                    disabled={updatingOrder === order.id}
                    style={{
                        width: '100%',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        color: '#60a5fa',
                        padding: '16px',
                        borderRadius: '20px',
                        fontWeight: '950',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '1px'
                    }}
                >
                    {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Package size={18} strokeWidth={2.5} />}
                    {updatingOrder === order.id ? 'ACTUALIZANDO...' : 'LISTO PARA DESPACHO'}
                </motion.button>
            )}

            {(order.status === 'Preparando' || order.status === 'Pagado' || editingTrackingId === order.id) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <p style={{ fontSize: '10px', fontWeight: '950', color: 'white', opacity: 0.7, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        {editingTrackingId === order.id ? 'Editar Datos de Envío' : 'Actualizar Guía de Envío'}
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <input
                            id={`provider-${order.id}`}
                            placeholder="Transportadora (Servientrega, Coordinadora...)"
                            defaultValue={order.shipping_provider || ''}
                            style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', fontSize: '14px', color: 'white', outline: 'none', transition: 'all 0.3s ease' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                id={`tracking-${order.id}`}
                                placeholder="No. Guía"
                                defaultValue={order.tracking_number || ''}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '14px', fontSize: '14px', color: 'white', outline: 'none' }}
                            />
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    onSetScanningOrderId(order.id);
                                    onShowScanner(true);
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    width: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    flexShrink: 0,
                                    cursor: 'pointer'
                                }}
                            >
                                <Camera size={20} />
                            </motion.button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                        {editingTrackingId === order.id && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onSetEditingTrackingId(null)}
                                style={{
                                    padding: '16px',
                                    borderRadius: '20px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    cursor: 'pointer',
                                    color: 'var(--text-dim)',
                                    fontWeight: '900',
                                    fontSize: '13px'
                                }}
                            >
                                CANCELAR
                            </motion.button>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                const prov = (document.getElementById(`provider-${order.id}`) as HTMLInputElement).value;
                                const track = (document.getElementById(`tracking-${order.id}`) as HTMLInputElement).value;
                                onTrackingUpdate(order.id, track, prov);
                            }}
                            disabled={updatingOrder === order.id}
                            style={{
                                background: 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                color: 'var(--primary)',
                                padding: '16px',
                                borderRadius: '20px',
                                fontWeight: '950',
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                border: 'none',
                                boxShadow: '0 10px 25px rgba(163, 230, 53, 0.3)'
                            }}
                        >
                            {updatingOrder === order.id ? <Loader2 size={18} className="animate-spin" /> : <Truck size={20} strokeWidth={2.5} />}
                            {editingTrackingId === order.id ? 'GUARDAR CAMBIOS' : 'MARCAR COMO ENVIADO'}
                        </motion.button>
                    </div>
                </div>
            )}

            {order.status === 'Enviado' && editingTrackingId !== order.id && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)',
                    padding: '20px',
                    borderRadius: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    marginTop: '10px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                            <CheckCircle2 size={24} color="#10b981" strokeWidth={2.5} />
                        </div>
                        <div>
                            <p style={{ fontWeight: '950', color: '#10b981', fontSize: '15px', margin: 0 }}>Producto Enviado</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600', margin: '2px 0 0' }}>{order.shipping_provider} • {order.tracking_number}</p>
                        </div>
                    </div>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => onEditClick(order)}
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '12px',
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
                        <Pencil size={16} strokeWidth={2.5} />
                    </motion.button>
                </div>
            )}
        </motion.div>
    );
};

export default OrderCard;
