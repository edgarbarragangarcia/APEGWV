import React from 'react';
import { Ticket, Plus, Search } from 'lucide-react';
import CouponCard from '../components/CouponCard';

import type { Coupon } from '../hooks/useStoreData';

interface CouponsTabProps {
    coupons: Coupon[];
    onAdd: () => void;
    onEdit: (coupon: Coupon) => void;
    onDelete: (id: string, code: string) => void;
}

const CouponsTab: React.FC<CouponsTabProps> = ({ coupons, onAdd, onEdit, onDelete }) => {
    const [searchTerm, setSearchTerm] = React.useState('');

    const filteredCoupons = coupons.filter(c =>
        c.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="animate-fade">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cupón..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                padding: '15px 15px 15px 45px',
                                color: 'white',
                                fontSize: '14px',
                                fontWeight: '600'
                            }}
                        />
                    </div>
                    <button
                        onClick={onAdd}
                        style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '0 20px',
                            borderRadius: '16px',
                            border: 'none',
                            fontWeight: '900',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 15px rgba(163, 230, 53, 0.2)'
                        }}
                    >
                        <Plus size={18} /> <span className="hide-mobile">NUEVO</span>
                    </button>
                </div>
            </div>

            {coupons.length === 0 ? (
                <div className="glass" style={{ padding: '60px 20px', textAlign: 'center' }}>
                    <Ticket size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3 }} />
                    <p style={{ color: 'var(--text-dim)', marginBottom: '20px' }}>No has creado cupones de descuento aún.</p>
                    <button
                        onClick={onAdd}
                        style={{
                            background: 'rgba(163, 230, 53, 0.1)',
                            color: 'var(--secondary)',
                            padding: '12px 25px',
                            borderRadius: '14px',
                            border: '1px solid var(--secondary)',
                            fontWeight: '800',
                            fontSize: '14px'
                        }}
                    >
                        Crear Mi Primer Cupón
                    </button>
                </div>
            ) : filteredCoupons.length === 0 ? (
                <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-dim)' }}>No se encontraron cupones.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {filteredCoupons.map((coupon) => (
                        <CouponCard
                            key={coupon.id}
                            coupon={coupon as any}
                            onEdit={onEdit as any}
                            onDelete={onDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default CouponsTab;
