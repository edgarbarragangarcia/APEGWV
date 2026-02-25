import React from 'react';
import { X, Truck, User, Phone, MapPin, DollarSign, QrCode } from 'lucide-react';
import Card from '../../../components/Card';

interface OrderEditFormData {
    order_number: string;
    status: string;
    tracking_number: string;
    shipping_provider: string;
    buyer_name: string;
    buyer_phone: string;
    shipping_address: string;
    seller_net_amount: string;
}

interface OrderEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (e: React.FormEvent) => void;
    formData: OrderEditFormData;
    onChange: (data: OrderEditFormData) => void;
    updating: boolean;
    onOpenScanner: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onChange,
    updating,
    onOpenScanner
}) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
        }} className="animate-fade">
            <Card style={{
                width: '100%',
                maxWidth: '500px',
                background: '#1a1a1a',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '28px',
                maxHeight: '90vh',
                overflowY: 'auto'
            }}>
                <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 1 }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>Editar Pedido</h3>
                    <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={onSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}># de Pedido</label>
                            <input
                                value={formData.order_number}
                                onChange={e => onChange({ ...formData, order_number: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Estado</label>
                            <select
                                value={formData.status}
                                onChange={e => onChange({ ...formData, status: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px', color: 'white' }}
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Enviado">Enviado</option>
                                <option value="Completado">Completado</option>
                                <option value="Cancelado">Cancelado</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(163, 230, 53, 0.03)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(163, 230, 53, 0.1)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Truck size={16} color="var(--secondary)" />
                                <span style={{ fontSize: '14px', fontWeight: '800', color: 'white' }}>Información de Envío</span>
                            </div>
                            <button
                                type="button"
                                onClick={onOpenScanner}
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--secondary)', color: 'var(--primary)', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: '800' }}
                            >
                                <QrCode size={14} /> SCANEAR GUÍA
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <input
                                placeholder="Transportadora (Servientrega, Envía...)"
                                value={formData.shipping_provider}
                                onChange={e => onChange({ ...formData, shipping_provider: e.target.value })}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '13px' }}
                            />
                            <input
                                placeholder="Número de Guía"
                                value={formData.tracking_number}
                                onChange={e => onChange({ ...formData, tracking_number: e.target.value })}
                                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '10px', color: 'white', fontSize: '13px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <User size={16} color="var(--text-dim)" />
                            <input
                                placeholder="Nombre del Comprador"
                                value={formData.buyer_name}
                                onChange={e => onChange({ ...formData, buyer_name: e.target.value })}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: 'none', padding: '5px', color: 'white', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone size={16} color="var(--text-dim)" />
                            <input
                                placeholder="Teléfono"
                                value={formData.buyer_phone}
                                onChange={e => onChange({ ...formData, buyer_phone: e.target.value })}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: 'none', padding: '5px', color: 'white', fontSize: '14px' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'start', gap: '8px' }}>
                            <MapPin size={16} color="var(--text-dim)" style={{ marginTop: '5px' }} />
                            <textarea
                                placeholder="Dirección de Envío"
                                value={formData.shipping_address}
                                onChange={e => onChange({ ...formData, shipping_address: e.target.value })}
                                style={{ flex: 1, background: 'rgba(255,255,255,0.03)', border: 'none', padding: '5px', color: 'white', fontSize: '14px', minHeight: '60px', resize: 'none' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Monto Neto Vendedor</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }}>
                                <DollarSign size={16} />
                            </div>
                            <input
                                type="number"
                                value={formData.seller_net_amount}
                                onChange={e => onChange({ ...formData, seller_net_amount: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '12px 12px 12px 35px', color: 'white', fontWeight: '800' }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={updating}
                        style={{
                            width: '100%',
                            background: 'white',
                            color: 'black',
                            padding: '16px',
                            borderRadius: '16px',
                            fontWeight: '900',
                            fontSize: '15px',
                            marginTop: '10px'
                        }}
                    >
                        {updating ? 'ACTUALIZANDO...' : 'GUARDAR CAMBIOS'}
                    </button>
                </form>
            </Card>
        </div>
    );
};

export default OrderEditModal;
