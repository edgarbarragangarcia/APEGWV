import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { Play, ArrowRight, Heart } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

const Home: React.FC = () => {
    const navigate = useNavigate();

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
                    .maybeSingle();
                setProfile(profileData || null);

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
                        price: typeof p.price === 'string' ? parseFloat(p.price) : p.price
                    })));
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            }
        };

        fetchHomeData();
    }, []);



    return (
        <div className="animate-fade" style={{
            paddingBottom: 'calc(var(--nav-height) + 20px)',
            width: '100%',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <header style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', marginBottom: '5px' }}>
                    Hola, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'golfista'}</span>
                </h1>
                <p style={{ color: 'var(--text-dim)' }}>Listo para tu próxima victoria en el campo?</p>
            </header>

            {/* Stats Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                <Card style={{
                    marginBottom: 0,
                    padding: '15px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                    boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                    animation: 'float 3s ease-in-out infinite'
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>Hándicap</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0', color: '#fff' }}>{profile?.handicap !== null && profile?.handicap !== undefined ? profile.handicap : '--'}</div>
                        <div style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.9)' }}>Actualizado</div>
                    </div>
                </Card>
                <Card
                    style={{
                        marginBottom: 0,
                        padding: '15px',
                        cursor: 'pointer',
                        background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)',
                        boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
                        animation: 'float 3s ease-in-out infinite 0.5s'
                    }}
                    onClick={() => navigate('/rounds')}
                >
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px' }}>Rondas</span>
                        <div style={{ fontSize: '24px', fontWeight: '800', margin: '2px 0', color: '#fff' }}>{roundCount}</div>
                        <div style={{ fontSize: '9px', color: '#a3e635' }}>Ver Historial →</div>
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
                <div style={{
                    display: 'flex',
                    gap: '15px',
                    overflowX: 'auto',
                    margin: '0 -20px',
                    padding: '20px',
                    scrollSnapType: 'x mandatory',
                    scrollbarWidth: 'none',
                    WebkitOverflowScrolling: 'touch'
                }}>
                    {featuredProducts.length > 0 ? (
                        featuredProducts.map((product) => (
                            <Card
                                key={product.id}
                                style={{
                                    minWidth: '185px',
                                    width: '185px',
                                    padding: '12px 0 15px 0',
                                    scrollSnapAlign: 'start',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    marginBottom: 0
                                }}
                                onClick={() => navigate('/shop')}
                            >
                                <div style={{
                                    position: 'relative',
                                    marginBottom: '10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    width: '100%'
                                }}>
                                    <div style={{ position: 'relative', width: '90%' }}>
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            style={{
                                                width: '100%',
                                                aspectRatio: '1/1',
                                                objectFit: 'cover',
                                                borderRadius: '20px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '8px',
                                            right: '8px',
                                            background: 'rgba(0,0,0,0.4)',
                                            backdropFilter: 'blur(8px)',
                                            borderRadius: '50%',
                                            padding: '6px',
                                            display: 'flex',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            <Heart size={14} color="white" />
                                        </div>
                                        {product.condition && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '8px',
                                                left: '8px',
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                fontSize: '9px',
                                                fontWeight: '900',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                boxShadow: '0 2px 8px rgba(163, 230, 53, 0.2)'
                                            }}>
                                                {product.condition}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column' }}>
                                    <h4 style={{
                                        fontSize: '17px',
                                        fontWeight: '800',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        width: '100%',
                                        color: 'white'
                                    }}>
                                        {product.name}
                                    </h4>

                                    <div style={{ marginBottom: '8px' }}>
                                        <div style={{
                                            color: 'var(--secondary)',
                                            fontSize: '14px',
                                            fontWeight: '900',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '600', textTransform: 'uppercase' }}>{product.category}</span>
                                    </div>
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
