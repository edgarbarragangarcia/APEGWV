import React from 'react';
import { Truck, User, Phone, MapPin, DollarSign, QrCode, CheckCircle2 } from 'lucide-react';
import PageHero from '../../../components/PageHero';
import PageHeader from '../../../components/PageHeader';

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
            inset: 0,
            background: 'var(--primary)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }} className="animate-fade">
            <PageHero opacity={0.4} />

            {/* Header Area - STATIC (Fixed) */}
            <div style={{
                flexShrink: 0,
                position: 'relative',
                zIndex: 20,
                padding: '0 24px',
                paddingTop: 'var(--header-offset-top)',
                paddingBottom: '15px',
                background: 'linear-gradient(to bottom, var(--primary) 80%, transparent)'
            }}>
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                    <PageHeader
                        title="Gestionar Pedido"
                        subtitle="Administra los detalles y el estado del envío"
                        onBack={onClose}
                        noMargin
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 24px',
                paddingBottom: '120px',
                position: 'relative',
                zIndex: 10
            }} className="hide-scrollbar">
                <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '10px' }}>
                    <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>

                        {/* Basic Info Row */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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

                        {/* Shipping Logistics Card */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                                        padding: '10px 16px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontSize: '11px',
                                        fontWeight: '950'
                                    }}
                                >
                                    <QrCode size={16} /> SCANEAR
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: '10px', color: 'var(--text-dim)' }}>Transportadora</label>
                                    <input
                                        placeholder="Ej: Servientrega, Envía, DHL..."
                                        value={formData.shipping_provider}
                                        onChange={e => onChange({ ...formData, shipping_provider: e.target.value })}
                                        style={inputStyle}
                                    />
                                </div>
                                <div>
                                    <label style={{ ...labelStyle, fontSize: '10px', color: 'var(--text-dim)' }}>Número de Guía</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            placeholder="Ingresa el código"
                                            value={formData.tracking_number}
                                            onChange={e => onChange({ ...formData, tracking_number: e.target.value })}
                                            style={{ ...inputStyle, paddingRight: '40px' }}
                                        />
                                        <QrCode size={18} color="var(--secondary)" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info Card */}
                        <div style={{
                            background: 'rgba(255,255,255,0.03)',
                            padding: '24px',
                            borderRadius: '24px',
                            border: '1px solid var(--glass-border)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '15px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} color="var(--secondary)" />
                                </div>
                                <span style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>Datos del Cliente</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ fontSize: '16px', fontWeight: '800', color: 'white' }}>{formData.buyer_name}</div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '13px' }}>
                                    <Phone size={14} /> {formData.buyer_phone}
                                </div>
                            </div>

                            <div style={{ paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '10px' }}>
                                <MapPin size={18} color="var(--secondary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.5' }}>
                                    {formData.shipping_address}
                                </div>
                            </div>
                        </div>

                        {/* Financial Section */}
                        <div style={{
                            padding: '24px',
                            background: 'rgba(163, 230, 53, 0.05)',
                            borderRadius: '24px',
                            border: '1px solid rgba(163, 230, 53, 0.15)'
                        }}>
                            <label style={labelStyle}>Monto Neto a Recibir (Vendedor)</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    readOnly
                                    value={`$ ${Number(formData.seller_net_amount).toLocaleString()}`}
                                    style={{
                                        ...inputStyle,
                                        fontSize: '24px',
                                        fontWeight: '950',
                                        color: 'var(--secondary)',
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '0'
                                    }}
                                />
                                <DollarSign size={20} color="var(--secondary)" style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)' }} />
                            </div>
                        </div>

                        {/* Submit Button - Integrated BUT Static height */}
                        <div style={{ marginTop: '10px' }}>
                            <button
                                type="submit"
                                disabled={updating}
                                className={updating ? 'btn-disabled' : 'btn-primary'}
                                style={{ height: '64px', fontSize: '16px', borderRadius: '18px' }}
                            >
                                {updating ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="spinner-small" style={{ borderColor: 'var(--primary)', borderTopColor: 'transparent' }} />
                                        <span>PROCESANDO...</span>
                                    </div>
                                ) : (
                                    <>
                                        <CheckCircle2 size={24} />
                                        <span>GUARDAR CAMBIOS</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OrderEditModal;
