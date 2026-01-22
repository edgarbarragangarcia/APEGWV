import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { ArrowRight, Heart } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

const Home: React.FC = () => {
    const navigate = useNavigate();

    const [profile, setProfile] = useState<any>(null);
    const [roundCount, setRoundCount] = useState<number>(0);
    const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
    const [tournaments, setTournaments] = useState<any[]>([]);

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

                // Fetch Real Tournaments
                const { data: tournamentsData } = await supabase
                    .from('tournaments')
                    .select('*')
                    .order('date', { ascending: true })
                    .limit(3);

                if (tournamentsData) {
                    setTournaments(tournamentsData);
                }
            } catch (err) {
                console.error('Error fetching home data:', err);
            }
        };

        fetchHomeData();

        const handleProfileUpdate = () => {
            fetchHomeData();
        };

        window.addEventListener('profile-updated', handleProfileUpdate);

        return () => {
            window.removeEventListener('profile-updated', handleProfileUpdate);
        };
    }, []);



    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden'
        }}>
            {/* Header y Stats Fijos */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 82px)',
                left: '20px',
                right: '20px',
                zIndex: 900,
                background: 'var(--primary)',
                paddingBottom: '10px'
            }}>
                <header style={{ marginBottom: '20px' }}>
                    <h1 style={{ fontSize: '26px', marginBottom: '2px' }}>
                        Hola, <span className="gradient-text">{profile?.full_name?.split(' ')[0] || 'golfista'}</span>
                    </h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Listo para tu próxima victoria en el campo?</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Card style={{
                        marginBottom: 0,
                        padding: '10px 15px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                        boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Hándicap</span>
                            <div style={{ fontSize: '22px', fontWeight: '800', margin: '0', color: '#fff' }}>{profile?.handicap !== null && profile?.handicap !== undefined ? profile.handicap : '--'}</div>
                            <div style={{ fontSize: '8px', color: 'rgba(255, 255, 255, 0.9)' }}>Actualizado</div>
                        </div>
                    </Card>
                    <Card
                        style={{
                            marginBottom: 0,
                            padding: '10px 15px',
                            cursor: 'pointer',
                            background: 'linear-gradient(135deg, #a855f7 0%, #9333ea 50%, #7e22ce 100%)',
                            boxShadow: '0 8px 20px rgba(168, 85, 247, 0.3)',
                            animation: 'float 3s ease-in-out infinite 0.5s'
                        }}
                        onClick={() => navigate('/rounds')}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '9px', color: 'rgba(255, 255, 255, 0.8)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '800' }}>Rondas</span>
                            <div style={{ fontSize: '22px', fontWeight: '800', margin: '0', color: '#fff' }}>{roundCount}</div>
                            <div style={{ fontSize: '8px', color: '#a3e635' }}>Ver Historial →</div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Area de Scroll para el resto del contenido */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 295px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 10px)',
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                overflowX: 'hidden'
            }}>

                {/* Market Categories */}
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', paddingRight: '5px' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Marketplace</h3>
                            <div style={{ width: '30px', height: '3px', background: 'var(--secondary)', borderRadius: '2px', marginTop: '4px' }}></div>
                        </div>
                        <button
                            onClick={() => navigate('/shop')}
                            style={{ background: 'rgba(163, 230, 53, 0.1)', border: 'none', color: 'var(--secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '10px', fontWeight: '700' }}
                        >
                            Ver todo <ArrowRight size={12} />
                        </button>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '15px',
                        overflowX: 'auto',
                        margin: '0 -20px',
                        padding: '0 20px 10px 20px',
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


                {/* Featured Caddies / Tournaments */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                    <div style={{ marginBottom: '5px' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Torneos</h3>
                        <div style={{ width: '30px', height: '3px', background: 'var(--secondary)', borderRadius: '2px', marginTop: '4px' }}></div>
                    </div>
                    <Card style={{ marginTop: '5px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Próximos Torneos</div>
                            <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>Inscríbete antes del cierre</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {tournaments.length > 0 ? (
                                tournaments.map(tournament => (
                                    <div
                                        key={tournament.id}
                                        onClick={() => navigate('/tournaments')}
                                        style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', cursor: 'pointer' }}
                                    >
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            background: 'var(--primary-light)',
                                            borderRadius: '10px',
                                            backgroundImage: tournament.image_url ? `url(${tournament.image_url})` : 'none',
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center'
                                        }} />
                                        <div>
                                            <div style={{ fontWeight: '500', fontSize: '14px' }}>{tournament.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                                {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} • {tournament.club || tournament.location}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ fontSize: '14px', color: 'var(--text-dim)', textAlign: 'center', padding: '20px' }}>
                                    No hay torneos programados próximamente.
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};


export default Home;
