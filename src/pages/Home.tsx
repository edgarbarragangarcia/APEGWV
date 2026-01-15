import React from 'react';
import Card from '../components/Card';
import { Play, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '5px' }}>Hola, <span className="gradient-text">Álvaro</span></h1>
                <p style={{ color: 'var(--text-dim)' }}>Listo para tu próxima victoria en el campo?</p>
            </header>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <Card style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Hándicap</span>
                        <div style={{ fontSize: '32px', fontWeight: '800', margin: '5px 0' }}>12.4</div>
                        <div style={{ fontSize: '10px', color: '#10b981' }}>+0.2 vs semana pasada</div>
                    </div>
                </Card>
                <Card style={{ marginBottom: 0 }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Rondas</span>
                        <div style={{ fontSize: '32px', fontWeight: '800', margin: '5px 0' }}>48</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Total de temporada</div>
                    </div>
                </Card>
            </div>

            {/* Active Round CTA */}
            <Card
                style={{
                    background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Partida en curso</h2>
                    <p style={{ fontSize: '14px', color: 'rgba(255,b255,255,0.7)', marginBottom: '20px' }}>Club de Golf La Moraleja • Hoyo 4</p>
                    <button style={{
                        background: 'var(--secondary)',
                        color: 'var(--primary)',
                        padding: '12px 25px',
                        borderRadius: '12px',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <Play size={18} fill="currentColor" /> Reanudar GPS
                    </button>
                </div>
                <div style={{
                    position: 'absolute',
                    right: '-20px',
                    bottom: '-20px',
                    opacity: 0.2,
                    transform: 'rotate(-15deg)'
                }}>
                    <Compass size={120} color="white" />
                </div>
            </Card>

            {/* Market Categories */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px' }}>Marketplace</h3>
                    <button style={{ color: 'var(--secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        Ver todo <ArrowRight size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', paddingBottom: '10px' }}>
                    {['Palos', 'Bolas', 'Ropa', 'Accesorios'].map((cat) => (
                        <button key={cat} className="glass" style={{
                            padding: '12px 20px',
                            whiteSpace: 'nowrap',
                            borderRadius: '15px',
                            fontSize: '14px'
                        }}>
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Featured Caddies / Tournaments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                <Card title="Próximos Torneos" subtitle="Inscríbete antes del cierre">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2].map(i => (
                            <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                <div style={{ width: '50px', height: '50px', background: 'var(--primary-light)', borderRadius: '10px' }} />
                                <div>
                                    <div style={{ fontWeight: '500', fontSize: '14px' }}>Open de Madrid 2024</div>
                                    <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>25 May • Real Club Vereda</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// Internal icon component for the background
const Compass = ({ size, color }: { size: number, color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

export default Home;
