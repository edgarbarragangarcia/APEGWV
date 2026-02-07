import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Heart, ChevronRight, ShoppingCart, Loader2, Plus, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/SupabaseManager';
import { useProfile } from '../hooks/useProfile';
import { useFeaturedProducts, useUpcomingTournaments } from '../hooks/useHomeData';
import PageHeader from '../components/PageHeader';
import { useCart } from '../context/CartContext';
import PageHero from '../components/PageHero';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { data: featuredProducts = [] } = useFeaturedProducts(10); // Fetch more for filtering
    const { data: tournaments = [] } = useUpcomingTournaments(3);

    const [viewTab, setViewTab] = React.useState<'marketplace' | 'myorders'>('marketplace');
    const [activeTab, setActiveTab] = React.useState('Todo');
    const { user } = useAuth();
    const { addToCart } = useCart();
    const carouselRef = React.useRef<HTMLDivElement>(null);
    const [myOrders, setMyOrders] = React.useState<any[]>([]);
    const [ordersLoading, setOrdersLoading] = React.useState(false);
    const [selectedProduct, setSelectedProduct] = React.useState<any>(null);
    const [showOfferModal, setShowOfferModal] = React.useState(false);
    const [offerAmount, setOfferAmount] = React.useState('');
    const [sendingOffer, setSendingOffer] = React.useState(false);
    const [offerSuccess, setOfferSuccess] = React.useState(false);
    const [addingToCart, setAddingToCart] = React.useState<string | null>(null);
    const [buying, setBuying] = React.useState(false);
    const [myOffers, setMyOffers] = React.useState<any[]>([]);


    // Fetch profile and initial data
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'myorders') {
            setViewTab('myorders');
        }
    }, []);

    // Auto-scroll for featured carousel
    useEffect(() => {
        const interval = setInterval(() => {
            if (carouselRef.current) {
                const container = carouselRef.current;
                const scrollAmount = container.clientWidth * 0.8; // Move 80% of width
                const maxScroll = container.scrollWidth - container.clientWidth;

                if (container.scrollLeft >= maxScroll - 10) {
                    container.scrollTo({ left: 0, behavior: 'smooth' });
                } else {
                    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
                }
            }
        }, 4000); // Every 4 seconds

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (user && viewTab === 'myorders') {
            const fetchOrders = async () => {
                setOrdersLoading(true);
                try {
                    const { data, error } = await supabase
                        .from('orders')
                        .select('*, product:products(*)')
                        .eq('buyer_id', user.id)
                        .order('created_at', { ascending: false })
                        .limit(5);

                    if (error) throw error;
                    setMyOrders(data || []);
                } catch (err) {
                    console.error('Error fetching orders:', err);
                } finally {
                    setOrdersLoading(false);
                }
            };

            const fetchOffers = async () => {
                try {
                    const { data, error } = await supabase
                        .from('offers')
                        .select('*, product:products(*)')
                        .eq('buyer_id', user.id)
                        .order('created_at', { ascending: false });

                    if (error) throw error;
                    setMyOffers(data || []);
                } catch (err) {
                    console.error('Error fetching offers:', err);
                }
            };

            fetchOrders();
            fetchOffers();
        }
    }, [user, viewTab]);

    const optimizeImage = (url: string | null | undefined, options: { width: number, height: number }) => {
        if (!url) return '';
        if (url.includes('supabase.co')) {
            return `${url}?width=${options.width}&height=${options.height}&resize=contain`;
        }
        return url;
    };

    const categories = ['Todo', 'Bolas', 'Palos', 'Ropa', 'Zapatos', 'Accesorios', 'Guantes', 'Gorras'];

    const filteredProducts = featuredProducts.filter(product => {
        const matchesCategory = activeTab === 'Todo' ||
            (product.category || '').toLowerCase() === activeTab.toLowerCase();

        return matchesCategory;
    });

    const promotions = [
        {
            badge: "🎉 Oferta Especial",
            title: "Hasta 30% OFF en equipamiento",
            subtitle: "Descubre las mejores ofertas del mes",
            image: "/images/promos/clubs.png",
            color: "rgba(163, 230, 53, 0.4)"
        },
        {
            badge: "⭐ Premium",
            title: "Colección Exclusiva",
            subtitle: "Acceso anticipado a productos elite",
            image: "/images/promos/apparel.png",
            color: "rgba(212, 175, 55, 0.4)"
        },
        {
            badge: "⚡ Flash Sale",
            title: "Bolas Titliest Pro V1",
            subtitle: "20% de descuento adicional hoy",
            image: "/images/promos/balls.png",
            color: "rgba(59, 130, 246, 0.4)"
        },
        {
            badge: "👟 Nuevo Ingreso",
            title: "Calzado Performance 2024",
            subtitle: "Tracción avanzada para tu juego",
            image: "/images/promos/shoes.png",
            color: "rgba(236, 72, 153, 0.4)"
        },
        {
            badge: "🎒 Accesorios Elite",
            title: "Bolsas de Cuero Hand-made",
            subtitle: "Estilo y funcionalidad premium",
            image: "/images/promos/bags.png",
            color: "rgba(139, 92, 246, 0.4)"
        },
        {
            badge: "⛳ Reservas VIP",
            title: "Campos Signature",
            subtitle: "Los mejores campos a tu alcance",
            image: "/images/promos/course.png",
            color: "rgba(16, 185, 129, 0.4)"
        },
        {
            badge: "🆕 Nueva Temporada",
            title: "Guantes de Piel Natural",
            subtitle: "Siente cada golpe con precisión",
            image: "/images/promos/clubs.png", // Reusing image for 7th
            color: "rgba(245, 158, 11, 0.4)"
        }
    ];







    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            overflow: 'hidden'
        }}>
            <PageHero image="/images/briceno18.png" />

            {/* Header y Stats Fijos */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                zIndex: 900,
                background: 'transparent',
                paddingBottom: '5px'
            }}>
                <div style={{ padding: '0 20px' }}>
                    <PageHeader
                        noMargin
                        showBack={false}
                        title={`Hola, ${profile?.full_name?.split(' ')[0] || 'Golfista'}`}
                        subtitle="¿Listo para tu próxima victoria en el campo?"
                    />
                </div>

                {/* Stats cards removed as per user request */}

                {/* Category Filters - Now Static */}
                <div style={{
                    marginTop: '12px',
                    marginBottom: '12px'
                }}>
                    {/* Category Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '8px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        paddingLeft: '20px',
                        paddingRight: '20px',
                        scrollbarWidth: 'none',
                        width: '100%',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                        maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
                    }}>
                        {categories.map(tab => (
                            <button
                                key={tab}
                                onClick={() => {
                                    if (tab === 'Todo') {
                                        setActiveTab(tab);
                                    } else {
                                        const route = tab.toLowerCase().replace(' ', '-');
                                        navigate(`/category/${route}`);
                                    }
                                }}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                    color: activeTab === tab ? 'var(--primary)' : 'white',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    border: '1px solid ' + (activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Featured Carousel */}
                <div
                    ref={carouselRef}
                    style={{
                        marginTop: '0px',
                        marginBottom: '0px',
                        overflowX: 'auto',
                        scrollSnapType: 'x mandatory',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitMaskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)',
                        maskImage: 'linear-gradient(to right, transparent, black 20px, black calc(100% - 20px), transparent)'
                    }}
                >
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        paddingBottom: '8px',
                        paddingLeft: '20px',
                        paddingRight: '20px'
                    }}>
                        {promotions.map((promo, idx) => (
                            <motion.div
                                key={idx}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    minWidth: '280px',
                                    height: '90px',
                                    borderRadius: '20px',
                                    background: `linear-gradient(135deg, ${promo.color} 0%, rgba(0,0,0,0.6) 100%)`,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    scrollSnapAlign: 'start',
                                    cursor: 'pointer'
                                }}
                            >
                                {/* Background Image */}
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    zIndex: 0,
                                    opacity: 0.5
                                }}>
                                    <img
                                        src={promo.image}
                                        alt=""
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: `linear-gradient(to right, ${promo.color.replace('0.4', '0.8')} 0%, transparent 70%)`,
                                    }} />
                                </div>

                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        fontSize: '9px',
                                        fontWeight: '900',
                                        color: 'white',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.1em',
                                        marginBottom: '4px',
                                        background: 'rgba(0,0,0,0.3)',
                                        alignSelf: 'flex-start',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        display: 'inline-block'
                                    }}>
                                        {promo.badge}
                                    </div>
                                    <h3 style={{
                                        fontSize: '15px',
                                        fontWeight: '900',
                                        color: 'white',
                                        margin: 0,
                                        marginBottom: '2px',
                                        lineHeight: 1.2,
                                        textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                                    }}>
                                        {promo.title}
                                    </h3>
                                    <p style={{
                                        fontSize: '10px',
                                        color: 'rgba(255,255,255,0.9)',
                                        margin: 0,
                                        lineHeight: 1.2,
                                        textShadow: '0 1px 2px rgba(0,0,0,0.5)'
                                    }}>
                                        {promo.subtitle}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

            </div>


            {/* Area de Scroll para el resto del contenido */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 210px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 5px)',
                overflowY: 'auto',
                padding: '10px 20px 20px 20px',
                overflowX: 'hidden'
            }}>


                {/* Content starts directly with the grid */}

                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: viewTab === "marketplace" ? "repeat(2, 1fr)" : "1fr",
                        gap: '10px',
                        paddingBottom: '20px'
                    }}
                >
                    {viewTab === 'marketplace' ? (
                        // Show skeleton loaders while loading
                        !featuredProducts || featuredProducts.length === 0 ? (
                            // Skeleton Cards
                            Array.from({ length: 6 }).map((_, index) => {
                                const groupIndex = index % 3;
                                const isBig = groupIndex === 0;

                                return (
                                    <div
                                        key={`skeleton-${index}`}
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            borderRadius: '20px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            gridRow: isBig ? 'span 2' : 'span 1',
                                            gridColumn: isBig ? '1' : '2',
                                            height: '100%',
                                            minHeight: isBig ? '220px' : '110px'
                                        }}
                                    >
                                        {/* Shimmer effect */}
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: '-100%',
                                                width: '100%',
                                                height: '100%',
                                                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
                                                animation: 'shimmer 1.5s infinite'
                                            }}
                                        />

                                        {/* Skeleton content */}
                                        <div style={{
                                            height: isBig ? '100%' : '110px',
                                            background: 'rgba(255,255,255,0.02)'
                                        }} />

                                        {!isBig && (
                                            <div style={{ padding: '8px 10px' }}>
                                                <div style={{
                                                    height: '12px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '4px',
                                                    marginBottom: '6px',
                                                    width: '70%'
                                                }} />
                                                <div style={{
                                                    height: '10px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    borderRadius: '4px',
                                                    width: '40%'
                                                }} />
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : filteredProducts.length > 0 ? (
                            filteredProducts.map((product, index) => {
                                const groupIndex = index % 3;
                                const isBig = groupIndex === 0;

                                return (
                                    <motion.div
                                        key={product.id}
                                        initial={{ opacity: 0, y: 15 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        whileTap={{
                                            scale: 0.98,
                                            opacity: 0.9,
                                            transition: { duration: 0.1 }
                                        }}
                                        viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                        style={{
                                            position: 'relative',
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: '20px',
                                            background: 'rgba(255, 255, 255, 0.03)',
                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                                            cursor: 'pointer',
                                            WebkitTapHighlightColor: 'transparent',
                                            touchAction: 'manipulation',
                                            gridRow: isBig ? 'span 2' : 'span 1',
                                            gridColumn: isBig ? '1' : '2',
                                            height: '100%'
                                        }}
                                        onClick={() => setSelectedProduct(product)}
                                    >
                                        <div style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: isBig ? '100%' : '110px',
                                            minHeight: isBig ? '220px' : '110px',
                                            overflow: 'hidden',
                                            background: 'rgba(0,0,0,0.2)',
                                        }}>
                                            <motion.img
                                                src={product.image_url || undefined}
                                                alt={product.name}
                                                whileHover={{ scale: 1.05 }}
                                                transition={{ type: 'tween', duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                }}
                                            />

                                            {/* Gradient overlay for better text readability and depth */}
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: isBig
                                                    ? 'linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.6) 100%)'
                                                    : 'linear-gradient(to bottom, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)',
                                                zIndex: 1
                                            }} />

                                            <div style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(0,0,0,0.3)',
                                                backdropFilter: 'blur(12px)',
                                                borderRadius: '50%',
                                                padding: '6px',
                                                display: 'flex',
                                                border: '1px solid rgba(255,255,255,0.15)',
                                                zIndex: 2
                                            }}>
                                                <Heart size={12} color="white" strokeWidth={2.5} />
                                            </div>

                                            {/* Floating Info for Big Cards */}
                                            {isBig && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '12px',
                                                    left: '12px',
                                                    right: '12px',
                                                    zIndex: 3
                                                }}>
                                                    <div style={{
                                                        fontSize: '8px',
                                                        color: 'var(--secondary)',
                                                        fontWeight: '900',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.1em',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {product.category}
                                                    </div>
                                                    <h4 style={{
                                                        fontSize: '14px',
                                                        fontWeight: '900',
                                                        color: '#fff',
                                                        margin: 0,
                                                        lineHeight: 1.1,
                                                        letterSpacing: '-0.3px',
                                                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                                    }}>
                                                        {product.name}
                                                    </h4>
                                                    <div style={{
                                                        color: 'white',
                                                        fontSize: '15px',
                                                        fontWeight: '900',
                                                        marginTop: '4px'
                                                    }}>
                                                        ${new Intl.NumberFormat('es-CO').format(product.price)}
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {!isBig && (
                                            <div style={{
                                                padding: '8px 10px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '1px'
                                            }}>
                                                <h4 style={{
                                                    fontSize: '12px',
                                                    fontWeight: '800',
                                                    letterSpacing: '-0.2px',
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
                                                    color: 'var(--secondary)',
                                                    fontSize: '13px',
                                                    fontWeight: '900',
                                                }}>
                                                    ${new Intl.NumberFormat('es-CO').format(product.price)}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div style={{ color: 'var(--text-dim)', fontSize: '14px', padding: '20px 0', width: '100%', textAlign: 'center' }}>No se encontraron productos.</div>
                        )
                    ) : (
                        ordersLoading ? (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '20px' }}>
                                <Loader2 className="animate-spin" size={24} color="var(--secondary)" />
                            </div>
                        ) : (
                            <div style={{ width: '100%' }}>
                                {/* Mis Ofertas */}
                                {myOffers.length > 0 && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '12px', paddingLeft: '4px' }}>Mis Ofertas</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
                                            {myOffers.map((offer) => (
                                                <motion.div
                                                    key={offer.id}
                                                    whileTap={{ scale: 0.98 }}
                                                    style={{
                                                        width: '100%',
                                                        padding: '16px',
                                                        borderRadius: '24px',
                                                        background: 'rgba(255, 255, 255, 0.03)',
                                                        border: '1px solid rgba(255, 255, 255, 0.05)',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        gap: '8px'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{
                                                            background: offer.status === 'accepted' ? '#10b981' : (offer.status === 'rejected' ? '#ef4444' : '#f59e0b'),
                                                            padding: '4px 8px',
                                                            borderRadius: '6px',
                                                            fontSize: '10px',
                                                            fontWeight: '900',
                                                            color: 'white'
                                                        }}>
                                                            {offer.status?.toUpperCase()}
                                                        </span>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(offer.created_at).toLocaleDateString()}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                        <img
                                                            src={offer.product?.image_url || ''}
                                                            style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                                                            alt=""
                                                        />
                                                        <div style={{ overflow: 'hidden' }}>
                                                            <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                {offer.product?.name}
                                                            </div>
                                                            <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>
                                                                Oferta: ${offer.amount?.toLocaleString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Mis Pedidos */}
                                <h4 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '12px', paddingLeft: '4px' }}>Mis Pedidos</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '10px' }}>
                                    {myOrders.length > 0 ? (
                                        myOrders.map((order) => (
                                            <motion.div
                                                key={order.id}
                                                whileTap={{ scale: 0.98 }}
                                                style={{
                                                    width: '100%',
                                                    padding: '16px',
                                                    borderRadius: '24px',
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px'
                                                }}
                                            >
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{
                                                        background: '#f59e0b',
                                                        padding: '4px 8px',
                                                        borderRadius: '6px',
                                                        fontSize: '10px',
                                                        fontWeight: '900',
                                                        color: 'white'
                                                    }}>
                                                        {order.status?.toUpperCase() || 'PAGADO'}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{new Date(order.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    <img
                                                        src={order.product?.image_url || ''}
                                                        style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }}
                                                        alt=""
                                                    />
                                                    <div style={{ overflow: 'hidden' }}>
                                                        <div style={{ fontSize: '14px', fontWeight: '800', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                            {order.product?.name}
                                                        </div>
                                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--secondary)' }}>
                                                            ${order.total_amount?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <div style={{ color: 'var(--text-dim)', fontSize: '14px', padding: '20px 0', width: '100%', textAlign: 'center' }}>No tienes pedidos aún.</div>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {/* Modals moved from Shop.tsx */}
                <AnimatePresence>
                    {selectedProduct && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 2000,
                                background: 'black'
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                <div style={{ position: 'relative', height: '60vh', width: '100%', flexShrink: 0 }}>
                                    <img
                                        src={optimizeImage(selectedProduct.image_url, { width: 600, height: 800 })}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt={selectedProduct.name}
                                    />
                                    <div style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, var(--primary) 100%)'
                                    }} />
                                </div>

                                <div style={{
                                    position: 'relative',
                                    flex: 1,
                                    background: 'var(--primary)',
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px',
                                    marginTop: '-50px',
                                    padding: '15px 18px calc(var(--nav-height) + 40px)',
                                    zIndex: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: '32px',
                                        height: '3px',
                                        background: 'rgba(255,255,255,0.1)',
                                        borderRadius: '2px',
                                        margin: '-6px auto 12px'
                                    }} />

                                    <button
                                        onClick={() => setSelectedProduct(null)}
                                        style={{
                                            background: 'rgba(255,255,255,0.08)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '50%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'white',
                                            cursor: 'pointer',
                                            marginBottom: '10px',
                                            marginLeft: 'auto',
                                            marginRight: 'auto'
                                        }}
                                    >
                                        <ArrowLeft size={18} strokeWidth={2.5} />
                                    </button>

                                    <div style={{ marginBottom: '10px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <span style={{
                                                background: 'rgba(163, 230, 53, 0.15)',
                                                color: 'var(--secondary)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase'
                                            }}>
                                                {selectedProduct.category}
                                            </span>
                                        </div>
                                        <h2 style={{ fontSize: '24px', fontWeight: '900', marginBottom: '4px', color: 'white' }}>
                                            {selectedProduct.name}
                                        </h2>
                                        <p style={{ fontSize: '28px', fontWeight: '900', color: 'var(--secondary)', margin: 0 }}>
                                            $ {new Intl.NumberFormat('es-CO').format(selectedProduct.price)}
                                        </p>
                                    </div>

                                    {selectedProduct.description && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <p style={{ color: 'rgba(255,255,255,0.7)', lineHeight: '1.5', fontSize: '15px' }}>
                                                {selectedProduct.description}
                                            </p>
                                        </div>
                                    )}

                                    <div style={{ display: 'flex', gap: '6px', marginTop: 'auto' }}>
                                        {selectedProduct.is_negotiable && selectedProduct.seller_id !== user?.id && (
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    if (!user) return navigate('/auth');
                                                    setShowOfferModal(true);
                                                    setOfferAmount(selectedProduct.price.toString());
                                                }}
                                                style={{
                                                    flex: 0.8,
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'white',
                                                    height: '56px',
                                                    borderRadius: '16px',
                                                    fontWeight: '900',
                                                    border: '1px solid rgba(255,255,255,0.1)'
                                                }}
                                            >
                                                🤝 OFERTA
                                            </motion.button>
                                        )}

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={async () => {
                                                setAddingToCart(selectedProduct.id);
                                                await addToCart({ ...selectedProduct } as any);
                                                setTimeout(() => setAddingToCart(null), 1500);
                                            }}
                                            disabled={selectedProduct.seller_id === user?.id}
                                            style={{
                                                width: '56px',
                                                height: '56px',
                                                background: 'rgba(255,255,255,0.05)',
                                                color: addingToCart === selectedProduct.id ? 'var(--secondary)' : 'white',
                                                borderRadius: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}
                                        >
                                            {addingToCart === selectedProduct.id ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                                        </motion.button>

                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            onClick={async () => {
                                                if (!user) return navigate('/auth');
                                                setBuying(true);
                                                await addToCart({ ...selectedProduct } as any);
                                                setSelectedProduct(null);
                                                navigate('/checkout');
                                            }}
                                            disabled={buying || selectedProduct?.seller_id === user?.id}
                                            className="btn-primary"
                                            style={{ flex: 2, width: 'auto' }}
                                        >
                                            <ShoppingCart size={20} />
                                            {buying ? '...' : 'COMPRAR'}
                                        </motion.button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showOfferModal && selectedProduct && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 3000,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center'
                        }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowOfferModal(false)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.4)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            />
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                style={{
                                    width: '100%',
                                    maxWidth: 'var(--app-max-width)',
                                    background: 'var(--primary)',
                                    borderTopLeftRadius: '32px',
                                    borderTopRightRadius: '32px',
                                    padding: '30px 25px calc(110px + env(safe-area-inset-bottom)) 25px',
                                    position: 'relative',
                                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                {!offerSuccess ? (
                                    <>
                                        <div style={{ display: 'flex', gap: '20px', marginBottom: '25px' }}>
                                            <img
                                                src={selectedProduct.image_url || ''}
                                                style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover' }}
                                                alt=""
                                            />
                                            <div>
                                                <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>Nueva Oferta</h3>
                                                <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>{selectedProduct.name}</p>
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>Tu propuesta</label>
                                            <div style={{ position: 'relative' }}>
                                                <span style={{ position: 'absolute', left: '20px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: 'var(--secondary)', fontSize: '20px' }}>$</span>
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={offerAmount ? new Intl.NumberFormat('es-CO').format(parseInt(offerAmount.replace(/\D/g, '') || '0')) : ''}
                                                    onChange={(e) => setOfferAmount(e.target.value.replace(/\D/g, ''))}
                                                    style={{
                                                        width: '100%',
                                                        background: 'rgba(255,255,255,0.03)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: '20px',
                                                        padding: '20px 20px 20px 45px',
                                                        color: 'white',
                                                        fontSize: '28px',
                                                        fontWeight: '900',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '15px' }}>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => setShowOfferModal(false)}
                                                style={{
                                                    flex: 1,
                                                    padding: '18px',
                                                    borderRadius: '20px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: 'white',
                                                    fontWeight: '800'
                                                }}
                                            >
                                                CANCELAR
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                disabled={sendingOffer || !offerAmount}
                                                onClick={async () => {
                                                    setSendingOffer(true);
                                                    try {
                                                        const { error } = await supabase
                                                            .from('offers')
                                                            .insert([{
                                                                product_id: selectedProduct.id,
                                                                buyer_id: user?.id,
                                                                seller_id: selectedProduct.seller_id,
                                                                amount: parseFloat(offerAmount),
                                                                status: 'pending'
                                                            }]);
                                                        if (error) throw error;
                                                        setOfferSuccess(true);
                                                        setTimeout(() => {
                                                            setOfferSuccess(false);
                                                            setShowOfferModal(false);
                                                            setSelectedProduct(null);
                                                        }, 2000);
                                                    } catch (err) {
                                                        console.error(err);
                                                    } finally {
                                                        setSendingOffer(false);
                                                    }
                                                }}
                                                className="btn-primary"
                                                style={{ flex: 2, width: 'auto' }}
                                            >
                                                {sendingOffer ? 'ENVIANDO...' : 'ENVIAR OFERTA'}
                                            </motion.button>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                                        <CheckCircle2 size={40} color="var(--secondary)" style={{ margin: '0 auto 25px' }} />
                                        <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>¡Propuesta Enviada!</h3>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>


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
