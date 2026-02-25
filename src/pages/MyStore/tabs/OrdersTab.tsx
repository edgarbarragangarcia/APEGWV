import React from 'react';
import { TrendingDown, Search } from 'lucide-react';
import OrderCard from '../components/OrderCard';

import type { Order } from '../hooks/useStoreData';

interface OrdersTabProps {
    orders: Order[];
    searchTerm: string;
    onSearchChange: (val: string) => void;
    onEditOrder: (order: Order) => void;
    onUpdateStatus: (orderId: string, newStatus: string) => void;
    updatingOrder: string | null;
    editingTrackingId: string | null;
    onTrackingUpdate: (orderId: string, trackingNum: string, provider: string) => void;
    onSetScanningOrderId: (orderId: string) => void;
    onShowScanner: (show: boolean) => void;
    onSetEditingTrackingId: (orderId: string | null) => void;
}

const OrdersTab: React.FC<OrdersTabProps> = ({
    orders,
    searchTerm,
    onSearchChange,
    onEditOrder,
    onUpdateStatus,
    updatingOrder,
    editingTrackingId,
    onTrackingUpdate,
    onSetScanningOrderId,
    onShowScanner,
    onSetEditingTrackingId
}) => {
    const filteredOrders = orders.filter(o =>
        (o.buyer_name || o.buyer?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.product?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.order_number || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '30px' }}>
                <div style={{ position: 'relative' }}>
                    <Search style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.8 }} size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por cliente o producto..."
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
            </div>

            {orders.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <TrendingDown size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-dim)' }}>Aún no tienes ventas registradas.</p>
                </div>
            ) : filteredOrders.length === 0 && searchTerm ? (
                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                    <TrendingDown size={32} color="var(--text-dim)" style={{ opacity: 0.3, marginBottom: '10px', margin: '0 auto' }} />
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No se encontraron ventas que coincidan con tu búsqueda.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {filteredOrders.map((order, index) => (
                        <OrderCard
                            key={order.id || `order-${index}`}
                            order={order}
                            onEditClick={onEditOrder}
                            onStatusUpdate={onUpdateStatus}
                            updatingOrder={updatingOrder}
                            editingTrackingId={editingTrackingId}
                            onTrackingUpdate={onTrackingUpdate}
                            onSetScanningOrderId={onSetScanningOrderId}
                            onShowScanner={onShowScanner}
                            onSetEditingTrackingId={onSetEditingTrackingId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrdersTab;
