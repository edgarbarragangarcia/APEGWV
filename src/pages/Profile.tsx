import { Settings, LogOut, Shield, ShoppingBag, CreditCard, ChevronRight } from 'lucide-react';

const Profile: React.FC = () => {
    const menuItems = [
        { icon: Shield, label: 'Datos de la Federación', extra: 'MD24001293' },
        { icon: ShoppingBag, label: 'Mis Ventas', extra: '3 activos' },
        { icon: CreditCard, label: 'Métodos de Pago', extra: 'Visa •• 42' },
        { icon: Settings, label: 'Configuración', extra: '' },
    ];

    return (
        <div className="animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '3px solid var(--secondary)',
                        padding: '4px',
                        marginBottom: '15px'
                    }}>
                        <img
                            src="https://ui-avatars.com/api/?name=Alvaro+Garcia&background=0E2F1F&color=A3E635&size=120"
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
                        />
                    </div>
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        right: 0,
                        background: 'var(--accent)',
                        color: 'var(--primary)',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: '800',
                        textTransform: 'uppercase'
                    }}>
                        PREMIUM
                    </div>
                </div>
                <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>Álvaro García</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Hándicap 12.4 • Madrid, ES</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>72</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Avg Score</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>29.5</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Putts Avg</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>65%</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fairways</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {menuItems.map((item, i) => (
                    <button key={i} className="glass" style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <item.icon size={20} color="var(--secondary)" />
                            <span style={{ fontWeight: '500' }}>{item.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{item.extra}</span>
                            <ChevronRight size={18} color="var(--text-dim)" />
                        </div>
                    </button>
                ))}

                <button style={{
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    color: '#ef4444',
                    marginTop: '10px'
                }}>
                    <LogOut size={20} />
                    <span style={{ fontWeight: '600' }}>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
