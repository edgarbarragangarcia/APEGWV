import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Play, ArrowRight, Loader2, Heart } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [roundCount, setRoundCount] = useState<number>(0);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Fetch Profile
                const { data: profileData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();
                setProfile(profileData);

                // Fetch Stats
                // This was statsData, but we now use live round count

                // Fetch Live Round Count
                const { count, error: countError } = await supabase
                    .from('rounds')
                    .select('*', { count: 'exact', head: true })
                    .eq('user_id', session.user.id);

                if (!countError) {
                    setRoundCount(count || 0);
                }

                // Fetch Featured Products
                const { data: productsData } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(4);

                if (productsData) {
                    setFeaturedProducts(productsData.map(p => ({
                        ...p,
                        price: parseFloat(p.price)
                    })));
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchHomeData();
    }, []);

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '5px' }}>
                    Hola, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'golfista'}</span>
                </h1>
                <p style={{ color: 'var(--text-dim)' }}>Listo para tu próxima victoria en el campo?</p>
            </header>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <Card style={{ marginBottom: 0, padding: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hándicap</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0' }}>{profile?.handicap !== null && profile?.handicap !== undefined ? profile.handicap : '--'}</div>
                        <div style={{ fontSize: '9px', color: '#10b981' }}>Actualizado</div>
                    </div>
                </Card>
                <Card
                    style={{ marginBottom: 0, padding: '15px', cursor: 'pointer' }}
                    onClick={() => navigate('/rounds')}
                >
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rondas</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0' }}>{roundCount}</div>
                        <div style={{ fontSize: '9px', color: 'var(--secondary)' }}>Ver Historial →</div>
                    </div>
                </Card>
            </div>

            {/* Market Categories */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px' }}>Marketplace</h3>
                    <button
                        onClick={() => navigate('/shop')}
                        style={{ background: 'none', border: 'none', color: 'var(--secondary)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}
                    >
                        Ver todo <ArrowRight size={14} />
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '15px', overflowX: 'auto', padding: '20px 0 20px', scrollSnapType: 'x mandatory' }}>
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((product) => (
                            <Card
                                key={product.id}
                                style={{
                                    minWidth: '160px',
                                    width: '160px',
                                    padding: '20px',
                                    scrollSnapAlign: 'start',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    marginBottom: 0 // Override default margin
                                }}
                                onClick={() => navigate('/shop')} // Optional: navigate to shop or product details
                            >
                                <div style={{ position: 'relative', marginBottom: '10px' }}>
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        background: 'rgba(0,0,0,0.5)',
                                        borderRadius: '50%',
                                        padding: '5px',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        <Heart size={12} color="white" />
                                    </div>
                                    {product.condition && (
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '5px',
                                            left: '5px',
                                            background: 'var(--primary)',
                                            color: 'var(--bg-dark)',
                                            fontSize: '9px',
                                            fontWeight: '700',
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                            textTransform: 'uppercase'
                                        }}>
                                            {product.condition}
                                        </div>
                                    )}
                                </div>
                                <h4 style={{ fontSize: '13px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name}</h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{product.category}</span>
                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--secondary)' }}>
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                    </span>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div style={{ color: 'var(--text-dim)', fontSize: '14px', padding: '20px 0' }}>No hay productos destacados aún.</div>
                    )}
                </div>
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
                    <p style={{ fontSize: '14px', color: 'rgba(255,b255,b255,0.7)', marginBottom: '20px' }}>Club de Golf La Moraleja • Hoyo 4</p>
                    <button
                        onClick={() => navigate('/select-course')}
                        style={{
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '12px 25px',
                            borderRadius: '12px',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}
                    >
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
        </div >
    );
};

// Internal icon component for the background
const Compass = ({ size, color }: { size: number, color: string }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
);

export default Home;
