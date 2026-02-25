import React from 'react';
import { X, Truck, User, Phone, MapPin, DollarSign, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

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

    const inputStyle = {
        width: '100%',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid var(--glass-border)',
        borderRadius: '16px',
        padding: '14px',
        color: 'white',
        fontSize: '15px',
        fontFamily: 'var(--font-main)',
        outline: 'none',
        transition: 'all 0.2s ease'
    };

    const labelStyle = {
        display: 'block',
        marginBottom: '8px',
        fontSize: '11px',
        fontWeight: '900',
        color: 'var(--secondary)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        paddingLeft: '4px'
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(15px)',
            display: 'flex',
            alignItems: 'end',
            justifyContent: 'center',
            zIndex: 1100,
        }} className="animate-fade">
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    width: '100%',
                    maxWidth: 'var(--app-max-width)',
                    background: 'var(--primary)',
                    borderTopLeftRadius: '32px',
                    borderTopRightRadius: '32px',
                    borderTop: '1px solid var(--glass-border)',
                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                    height: '92vh',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '25px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    flexShrink: 0
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>Gestión de Ventas</span>
                        <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', letterSpacing: '-0.02em', margin: 0 }}>Editar Pedido</h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>

                {/* Form Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '25px', paddingBottom: '120px' }}>
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '15px' }}>
                            <div>
                                <label style={labelStyle}># Pedido</label>
                                <input
                                    readOnly
                                    value={formData.order_number}
                                    style={{ ...inputStyle, opacity: 0.6, background: 'rgba(255,255,255,0.02)' }}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Estado Actual</label>
                                <div style={{ position: 'relative' }}>
                                    <select
                                        value={formData.status}
                                        onChange={e => onChange({ ...formData, status: e.target.value })}
                                        style={inputStyle}
                                    >
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Enviado">Enviado</option>
                                        <option value="Completado">Completado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Info Card */}
                        <div className="glass" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(163, 230, 53, 0.15)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Truck size={18} color="var(--secondary)" />
                                    </div>
                                    <span style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>Envío y Logística</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={onOpenScanner}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '8px 14px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '11px',
                                        fontWeight: '950'
                                    }}
                                >
                                    <QrCode size={16} /> SCANEAR GUÍA
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ ...labelStyle, color: 'var(--text-dim)', fontSize: '10px' }}>Transportadora</label>
                                    <input
                                        placeholder="Ej: Servientrega, Envía, DHL..."
                                        value={formData.shipping_provider}
                                        onChange={e => onChange({ ...formData, shipping_provider: e.target.value })}
                                        style={{ ...inputStyle, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, color: 'var(--text-dim)', fontSize: '10px' }}>Número de Guía / Tracking</label>
                                    <input
                                        placeholder="Ingresa el código de seguimiento"
                                        value={formData.tracking_number}
                                        onChange={e => onChange({ ...formData, tracking_number: e.target.value })}
                                        style={{ ...inputStyle, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Buyer Info Section */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>Datos del Cliente</label>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <User size={20} color="var(--secondary)" opacity={0.6} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{formData.buyer_name}</span>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Phone size={12} color="var(--text-dim)" />
                                                <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{formData.buyer_phone}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={labelStyle}>Dirección de Entrega</label>
                                <div style={{ display: 'flex', alignItems: 'start', gap: '15px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <MapPin size={20} color="var(--secondary)" opacity={0.6} style={{ marginTop: '2px' }} />
                                    <span style={{ fontSize: '14px', color: 'white', lineHeight: '1.5', fontWeight: '500' }}>{formData.shipping_address}</span>
                                </div>
                            </div>
                        </div>

                        {/* Financial Section */}
                        <div style={{ marginTop: '10px' }}>
                            <label style={labelStyle}>Monto Neto a Recibir (Vendedor)</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }}>
                                    <DollarSign size={20} strokeWidth={3} />
                                </div>
                                <input
                                    type="number"
                                    readOnly
                                    value={formData.seller_net_amount}
                                    style={{
                                        ...inputStyle,
                                        paddingLeft: '45px',
                                        fontSize: '22px',
                                        fontWeight: '900',
                                        color: 'var(--secondary)',
                                        background: 'rgba(163, 230, 53, 0.05)',
                                        border: '1px solid rgba(163, 230, 53, 0.2)'
                                    }}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Action */}
                <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '25px',
                    background: 'linear-gradient(to top, var(--primary) 70%, transparent)',
                    zIndex: 2,
                    pointerEvents: 'auto'
                }}>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={updating}
                        className={updating ? 'btn-disabled' : 'btn-primary'}
                        style={{ height: '60px', fontSize: '16px' }}
                    >
                        {updating ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div className="spinner-small" />
                                ACTUALIZANDO...
                            </div>
                        ) : 'GUARDAR CAMBIOS'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderEditModal;
