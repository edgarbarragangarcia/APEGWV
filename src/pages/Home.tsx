import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, Users, ChevronRight } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';
import ActivityCard from '../components/ActivityCard';
import type { ActivityType } from '../components/ActivityCard';
import { useProfile } from '../hooks/useProfile';
import { useFeaturedProducts, useUpcomingTournaments } from '../hooks/useHomeData';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '../components/PageHeader';

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
    const { data: profile } = useProfile();
    const { data: featuredProducts = [] } = useFeaturedProducts(4);
    const { data: tournaments = [] } = useUpcomingTournaments(3);


    // Fetch Activities with React Query
    const { data: activities = [], refetch: refetchActivities } = useQuery({
        queryKey: ['activities'],
        queryFn: async () => {
            const { data: registrations } = await supabase
                .from('tournament_registrations')
                .select('*, tournament_id(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch profiles separately
            const userIds = registrations?.map(r => r.user_id).filter((id): id is string => id !== null) || [];
            const { data: profiles } = userIds.length > 0
                ? await supabase
                    .from('profiles')
                    .select('id, full_name, id_photo_url')
                    .in('id', userIds)
                : { data: [] };

            const profilesMap = new Map(profiles?.map(p => [p.id, p]) || []);

            const { data: newProducts } = await supabase
                .from('products')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5);

            const combinedActivities: ActivityItem[] = [
                ...(registrations?.map(r => ({
                    id: r.id,
                    type: 'registration' as ActivityType,
                    userName: (r.user_id ? profilesMap.get(r.user_id)?.full_name : null) || 'Alguien',
                    userImage: (r.user_id ? profilesMap.get(r.user_id)?.id_photo_url : null) || undefined,
                    description: `Se inscribió al torneo`,
                    itemName: r.tournament_id?.name,
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
                top: 'var(--header-offset-top)',
                left: '20px',
                right: '20px',
                zIndex: 900,
                background: 'var(--primary)',
                paddingBottom: '5px'
            }}>
                <PageHeader
                    noMargin
                    showBack={false}
                    title={`Hola, ${profile?.full_name?.split(' ')[0] || 'Golfista'}`}
                    subtitle="¿Listo para tu próxima victoria en el campo?"
                />

                {/* Stats cards removed as per user request */}

                {/* Translucent fade effect at the bottom of the fixed section */}

            </div>

            {/* Area de Scroll para el resto del contenido */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 65px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 5px)',
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                overflowX: 'hidden'
            }}>

                {/* Activity Feed Section */}
                <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingRight: '5px' }}>
                        <div>
                            <h3 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', color: 'white' }}>
                                Actividad <span style={{ color: 'var(--secondary)' }}>Comunidad</span>
                            </h3>
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
                <div style={{ marginBottom: '25px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '5px' }}>
                        <div>
                            <h3 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', color: 'white' }}>Marketplace</h3>
                        </div>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/shop')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'var(--secondary)',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                padding: '6px 14px',
                                borderRadius: '20px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                        >
                            Ver todo <ArrowRight size={14} strokeWidth={2.5} />
                        </motion.button>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            gap: '16px',
                            overflowX: 'auto',
                            overflowY: 'hidden',
                            paddingBottom: '20px',
                            scrollSnapType: 'x mandatory',
                            scrollbarWidth: 'none',
                            WebkitOverflowScrolling: 'touch',
                            margin: '0 -20px',
                            padding: '0 20px 20px 20px'
                        }}
                    >
                        {featuredProducts.length > 0 ? (
                            featuredProducts.map((product) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 15 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    whileTap={{
                                        scale: 0.95,
                                        opacity: 0.9,
                                        transition: { duration: 0.1 }
                                    }}
                                    viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                    style={{
                                        minWidth: '220px',
                                        width: '220px',
                                        scrollSnapAlign: 'start',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        borderRadius: '28px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                                        cursor: 'pointer',
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation'
                                    }}
                                    onClick={() => navigate('/shop')}
                                >
                                    <div style={{
                                        position: 'relative',
                                        width: '100%',
                                        aspectRatio: '4/5',
                                        overflow: 'hidden',
                                        background: 'rgba(0,0,0,0.2)'
                                    }}>
                                        <motion.img
                                            src={product.image_url || undefined}
                                            alt={product.name}
                                            whileHover={{ scale: 1.1 }}
                                            transition={{ type: 'tween', duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: '12px',
                                            right: '12px',
                                            background: 'rgba(0,0,0,0.3)',
                                            backdropFilter: 'blur(12px)',
                                            borderRadius: '50%',
                                            padding: '8px',
                                            display: 'flex',
                                            border: '1px solid rgba(255,255,255,0.15)',
                                            zIndex: 2
                                        }}>
                                            <Heart size={16} color="white" strokeWidth={2.5} />
                                        </div>

                                        {/* Bottom info overlay for category */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '12px',
                                            left: '12px',
                                            background: 'rgba(163, 230, 53, 0.85)',
                                            color: '#000',
                                            padding: '4px 10px',
                                            borderRadius: '10px',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            zIndex: 2
                                        }}>
                                            {product.category}
                                        </div>
                                    </div>

                                    <div style={{
                                        padding: '16px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px',
                                        background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.05))'
                                    }}>
                                        <h4 style={{
                                            fontSize: '17px',
                                            fontWeight: '700',
                                            letterSpacing: '-0.3px',
                                            margin: 0,
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            width: '100%',
                                            color: '#fff'
                                        }}>
                                            {product.name}
                                        </h4>

                                        <div style={{
                                            color: 'rgba(255,255,255,0.9)',
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            opacity: 0.9
                                        }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(product.price)}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{ color: 'var(--text-dim)', fontSize: '14px', padding: '20px 0', width: '100%', textAlign: 'center' }}>No hay productos destacados aún.</div>
                        )}
                    </div>
                </div>


                {/* Featured Caddies / Tournaments */}
                <div style={{ marginBottom: '40px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingRight: '5px' }}>
                        <h3 style={{ fontSize: '22px', fontWeight: '900', letterSpacing: '-0.8px', color: 'white' }}>Torneos <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: '500' }}>Populares</span></h3>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/tournaments')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.05)',
                                backdropFilter: 'blur(10px)',
                                WebkitBackdropFilter: 'blur(10px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontWeight: '800',
                                padding: '6px 14px',
                                borderRadius: '20px'
                            }}
                        >
                            Calendario <ChevronRight size={14} />
                        </motion.button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tournaments.length > 0 ? (
                            tournaments.map(tournament => (
                                <motion.div
                                    key={tournament.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => navigate('/tournaments')}
                                    style={{
                                        display: 'flex',
                                        gap: '16px',
                                        alignItems: 'center',
                                        padding: '12px',
                                        borderRadius: '24px',
                                        background: 'rgba(255,255,255,0.04)',
                                        backdropFilter: 'blur(12px)',
                                        WebkitBackdropFilter: 'blur(12px)',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        cursor: 'pointer',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '16px',
                                        backgroundImage: tournament.image_url ? `url(${tournament.image_url})` : 'none',
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)'
                                    }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: '900', fontSize: '16px', color: 'white', marginBottom: '2px', letterSpacing: '-0.3px' }}>{tournament.name}</div>
                                        <div style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                            {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                        </div>
                                    </div>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        background: 'rgba(255,255,255,0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'rgba(255,255,255,0.3)'
                                    }}>
                                        <ChevronRight size={18} />
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div style={{
                                padding: '30px',
                                textAlign: 'center',
                                background: 'rgba(255,255,255,0.02)',
                                borderRadius: '24px',
                                border: '1px dashed rgba(255,255,255,0.1)'
                            }}>
                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '500' }}>
                                    No hay torneos programados próximamente.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Home;
