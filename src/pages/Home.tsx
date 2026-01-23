import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { ArrowRight, Heart, Users } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';
import ActivityCard from '../components/ActivityCard';
import type { ActivityType } from '../components/ActivityCard';
import { useProfile } from '../hooks/useProfile';
import { useFeaturedProducts, useUpcomingTournaments, useUserRoundCount } from '../hooks/useHomeData';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

interface ActivityItem {
    id: string;
    type: ActivityType;
    userName: string;
    userImage?: string;
    description: string;
    itemName?: string;
    itemImage?: string;
    created_at: string | null;
}

const Home: React.FC = () => {
    const navigate = useNavigate();
    const activitiesRef = React.useRef<HTMLDivElement>(null);
    const marketplaceRef = React.useRef<HTMLDivElement>(null);
    const { user } = useAuth();
    const { data: profile } = useProfile();
    const { data: roundCount = 0 } = useUserRoundCount(user?.id);
    const { data: featuredProducts = [] } = useFeaturedProducts(4);
    const { data: tournaments = [] } = useUpcomingTournaments(3);

    // Fetch Activities with React Query
    const { data: activities = [], refetch: refetchActivities } = useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
            const { data: registrations } = await supabase
                .from('tournament_registrations')
                .select('*, profiles(full_name, id_photo_url), tournaments(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: newProducts } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            const combinedActivities: ActivityItem[] = [
                ...(registrations?.map(r => ({
                    id: r.id,
                    type: 'registration' as ActivityType,
                    userName: r.profiles?.full_name || 'Alguien',
                    userImage: r.profiles?.id_photo_url || undefined,
                    description: `Se inscribió al torneo`,
                    itemName: r.tournaments?.name,
                    created_at: r.created_at
                })) || []),
                ...(newProducts?.map(p => ({
                    id: p.id,
                    type: 'product' as ActivityType,
                    userName: 'Comunidad APEG',
                    description: `Nuevo artículo disponible`,
                    itemName: p.name,
                    itemImage: p.image_url || undefined,
                    created_at: p.created_at
                })) || [])
            ].sort((a, b) => {
                const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
                const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
                return dateB - dateA;
            }).slice(0, 10);

            return combinedActivities;
        },
        staleTime: 1000 * 60 * 5,
    });

    useEffect(() => {
        // Real-time subscription for tournament registrations
        const channel = supabase
            .channel('public:tournament_registrations')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tournament_registrations' }, () => {
                refetchActivities();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [refetchActivities]);

    // Auto-scroll logic for activities carousel
    useEffect(() => {
        if (!activitiesRef.current || activities.length === 0) return;

        const interval = setInterval(() => {
            if (activitiesRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = activitiesRef.current;
                const maxScroll = scrollWidth - clientWidth;

                if (scrollLeft >= maxScroll - 10) {
                    activitiesRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    activitiesRef.current.scrollBy({ left: 292, behavior: 'smooth' }); // Item width (280) + gap (12)
                }
            }
        }, 3500);

        return () => clearInterval(interval);
    }, [activities.length]);

    // Auto-scroll logic for marketplace carousel
    useEffect(() => {
        if (!marketplaceRef.current || featuredProducts.length === 0) return;

        const interval = setInterval(() => {
            if (marketplaceRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = marketplaceRef.current;
                const maxScroll = scrollWidth - clientWidth;

                if (scrollLeft >= maxScroll - 10) {
                    marketplaceRef.current.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    marketplaceRef.current.scrollBy({ left: 200, behavior: 'smooth' }); // Item width (185) + gap (15)
                }
            }
        }, 4000);

        return () => clearInterval(interval);
    }, [featuredProducts.length]);



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
                paddingBottom: '5px'
            }}>
                <header style={{ marginBottom: '8px' }}>
                    <h1 style={{ fontSize: '26px', fontWeight: '900', marginBottom: '2px', color: 'white' }}>
                        Hola, <span style={{ color: 'var(--secondary)' }}>{profile?.full_name?.split(' ')[0] || 'Golfista'}</span>
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

                {/* Translucent fade effect at the bottom of the fixed section */}
                <div style={{
                    position: 'absolute',
                    bottom: '-35px',
                    left: '-20px',
                    right: '-20px',
                    height: '35px',
                    background: 'linear-gradient(to bottom, var(--primary), transparent)',
                    pointerEvents: 'none',
                    zIndex: 901
                }} />
            </div>

            {/* Area de Scroll para el resto del contenido */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 270px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 5px)',
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                overflowX: 'hidden'
            }}>

                {/* Activity Feed Section */}
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', paddingRight: '5px' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '8px', color: 'white' }}>
                                Actividad <span style={{ color: 'var(--secondary)' }}>Comunidad</span>
                            </h3>
                            <div style={{ width: '30px', height: '3px', background: 'var(--secondary)', borderRadius: '2px', marginTop: '4px' }}></div>
                        </div>
                    </div>

                    <div
                        ref={activitiesRef}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            overflowX: 'auto',
                            margin: '0 -20px',
                            padding: '0 20px 10px 20px',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {activities.length > 0 ? (
                            activities.map((activity, index) => (
                                <div key={activity.id + index} style={{ minWidth: '280px', width: '280px', scrollSnapAlign: 'start' }}>
                                    <ActivityCard
                                        type={activity.type}
                                        userName={activity.userName}
                                        userImage={activity.userImage}
                                        description={activity.description}
                                        time={activity.created_at ? new Date(activity.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                        itemName={activity.itemName}
                                        itemImage={activity.itemImage}
                                        onClick={() => {
                                            if (activity.type === 'registration') navigate('/tournaments');
                                            if (activity.type === 'product') navigate('/shop');
                                        }}
                                    />
                                </div>
                            ))
                        ) : (
                            <div style={{
                                padding: '30px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '20px',
                                border: '1px dashed rgba(255,255,255,0.1)'
                            }}>
                                <Users size={24} color="var(--text-dim)" style={{ marginBottom: '10px', opacity: 0.5 }} />
                                <p style={{ fontSize: '13px', color: 'var(--text-dim)' }}>No hay actividad reciente aún.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Marketplace Section */}
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '18px', paddingRight: '5px' }}>
                        <div>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: 'white' }}>Marketplace</h3>
                            <div style={{ width: '30px', height: '3px', background: 'var(--secondary)', borderRadius: '2px', marginTop: '4px' }}></div>
                        </div>
                        <button
                            onClick={() => navigate('/shop')}
                            style={{ background: 'rgba(163, 230, 53, 0.1)', border: 'none', color: 'var(--secondary)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '10px', fontWeight: '700' }}
                        >
                            Ver todo <ArrowRight size={12} />
                        </button>
                    </div>
                    <div
                        ref={marketplaceRef}
                        style={{
                            display: 'flex',
                            gap: '15px',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            margin: '0 -20px',
                            padding: '0 20px 10px 20px',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            touchAction: 'pan-x'
                        }}
                    >
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
                                                src={product.image_url || undefined}
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
                                            {(product as any).condition && (
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
                                                    {(product as any).condition}
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
                        <h3 style={{ fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: 'white' }}>Torneos</h3>
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

                {/* Translucent fade effect at the bottom of the fixed section */}
                <div style={{
                    position: 'absolute',
                    bottom: '-35px',
                    left: '-20px',
                    right: '-20px',
                    height: '35px',
                    background: 'linear-gradient(to bottom, var(--primary), transparent)',
                    pointerEvents: 'none',
                    zIndex: 901
                }} />
            </div>
        </div>
    );
};


export default Home;
