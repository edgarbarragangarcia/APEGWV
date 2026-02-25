import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Heart, ChevronRight, ShoppingCart, Loader2, CheckCircle2, ArrowLeft, DollarSign, Handshake, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase, optimizeImage } from '../services/SupabaseManager';
import { useProfile } from '../hooks/useProfile';
import { useFeaturedProducts, useUpcomingTournaments, useCategories } from '../hooks/useHomeData';
import { useLikes } from '../hooks/useLikes';
import PageHeader from '../components/PageHeader';
import { useCart } from '../context/CartContext';
import PageHero from '../components/PageHero';
import { useToast } from '../context/ToastContext';
import { useInteractions } from '../hooks/useInteractions';
import PremiumProductCard from '../components/PremiumProductCard';

const Home: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { warning } = useToast();
    const { id: productId } = useParams();
    const { data: profile } = useProfile();
    const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts(); // No limit to fetch all
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
    const [selectedSize, setSelectedSize] = React.useState<string | null>(null);
    const [myOffers, setMyOffers] = React.useState<any[]>([]);
    const [selectedOffer, setSelectedOffer] = React.useState<any>(null);
    const [replyMessage, setReplyMessage] = React.useState('');
    const [sendingReply, setSendingReply] = React.useState(false);
    const [acceptingCounter, setAcceptingCounter] = React.useState(false);
    const { likedProducts, toggleLike } = useLikes();
    const [currentImageIndex, setCurrentImageIndex] = React.useState(0);

    // Interaction Tracking
    const { logView, logDuration } = useInteractions();
    const productStartTime = React.useRef<number | null>(null);

    // Track duration for selected product
    useEffect(() => {
        if (selectedProduct) {
            productStartTime.current = Date.now();
        } else {
            if (productStartTime.current && productId) {
                const duration = (Date.now() - productStartTime.current) / 1000;
                if (duration > 1) { // Only log if viewed for more than 1 second
                    logDuration('product', productId, duration);
                }
            }
            productStartTime.current = null;
        }
    }, [selectedProduct, productId, logDuration]);

    const productImages = React.useMemo(() => {
        if (!selectedProduct) return [];
        const imgs = [];
        if (selectedProduct.image_url) imgs.push(selectedProduct.image_url);
        if (selectedProduct.images && Array.isArray(selectedProduct.images)) {
            const additionalImgs = selectedProduct.images.filter((img: string) => img !== selectedProduct.image_url);
            imgs.push(...additionalImgs);
        }
        return imgs;
    }, [selectedProduct]);

    // Reset index when product changes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [selectedProduct]);


    // Fetch profile and initial data
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get('tab');
        if (tab === 'myorders') {
            setViewTab('myorders');
        }

        const offerId = params.get('offer_id');
        if (offerId && user) {
            const fetchOffer = async () => {
                try {
                    const { data } = await supabase
                        .from('offers')
                        .select('*, product:products(*)')
                        .eq('id', offerId)
                        .single();
                    if (data) setSelectedOffer(data);
                } catch (err) {
                    console.error('Error fetching offer from URL:', err);
                }
            };
            fetchOffer();
        }
    }, [location.search, user]);

    // Handle initial product from URL
    useEffect(() => {
        if (productId) {
            if (featuredProducts.length > 0) {
                const product = featuredProducts.find(p => p.id === productId);
                if (product) {
                    setSelectedProduct(product);
                } else {
                    const fetchProduct = async () => {
                        try {
                            const { data } = await supabase.from('products').select('*').eq('id', productId).single();
                            if (data) setSelectedProduct(data);
                        } catch (err) {
                            console.error(err);
                        }
                    };
                    fetchProduct();
                }
            } else if (!featuredLoading) {
                const fetchProduct = async () => {
                    try {
                        const { data } = await supabase.from('products').select('*').eq('id', productId).single();
                        if (data) setSelectedProduct(data);
                    } catch (err) {
                        console.error(err);
                    }
                };
                fetchProduct();
            }
        } else {
            setSelectedProduct(null);
        }
    }, [productId, featuredProducts, featuredLoading]);

    const handleProductSelect = (product: any) => {
        setSelectedProduct(product);
        setSelectedSize(null);
        navigate(`/product/${product.id}`, { replace: false });
    };

    const handleCloseProduct = () => {
        setSelectedProduct(null);
        navigate('/', { replace: true });
    };

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
            const fetchOrdersAndOffers = async () => {
                setOrdersLoading(true);
                try {
                    const [ordersRes, offersRes] = await Promise.all([
                        supabase
                            .from('orders')
                            .select(`
                                *,
                                order_items (
                                    *,
                                    product:products (*)
                                )
                            `)
                            .eq('buyer_id', user.id)
                            .order('created_at', { ascending: false }),
                        supabase
                            .from('offers')
                            .select('*, product:products(*)')
                            .eq('buyer_id', user.id)
                            .order('created_at', { ascending: false })
                    ]);

                    if (ordersRes.data) {
                        setMyOrders(ordersRes.data.map((order: any) => ({
                            ...order,
                            product: order.order_items?.[0]?.product
                        })));
                    }
                    if (offersRes.data) setMyOffers(offersRes.data);
                } catch (err) {
                    console.error('Error fetching orders/offers:', err);
                } finally {
                    setOrdersLoading(false);
                }
            };
            fetchOrdersAndOffers();
        }
    }, [user, viewTab]);



    const { data: categories = ['Todo'] } = useCategories(user?.id);

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







    const isDeepLink = !!productId;
    const isWaitingForProduct = isDeepLink && !selectedProduct;

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            overflow: 'hidden',
            background: 'var(--primary)'
        }}>
            {/* Si estamos esperando un producto por deep link, mostramos loader plano para evitar el glitch del home */}
            {isWaitingForProduct && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 110000,
                    background: 'var(--primary)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px'
                }}>
                    <Loader2 className="animate-spin" size={40} color="var(--secondary)" />
                    <span style={{ color: 'white', fontSize: '14px', fontWeight: '600', opacity: 0.6 }}>Cargando producto...</span>
                </div>
            )}

            {/* Contenido del Home - Solo visible si no estamos esperando un producto o si el producto ya está cargado */}
            <div style={{
                opacity: isWaitingForProduct ? 0 : 1,
                transition: 'opacity 0.3s ease',
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <PageHero />

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
                            {categories.map((tab, idx) => (
                                <button
                                    key={tab || `tab-${idx}`}
                                    onClick={() => {
                                        if (tab === 'Todo') {
                                            setActiveTab(tab);
                                        } else {
                                            logView('category', tab);
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


                    {/* Content Area */}

                    <div
                        style={{
                            width: '100%',
                            paddingBottom: '20px'
                        }}
                    >
                        {viewTab === 'marketplace' ? (
                            // Show skeleton loaders while loading
                            !featuredProducts || featuredProducts.length === 0 || featuredLoading ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gridAutoRows: '260px',
                                    gap: '12px',
                                    paddingBottom: '20px',
                                    justifyContent: 'center'
                                }}>
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <div
                                            key={`skeleton-${index}`}
                                            className="skeleton"
                                            style={{
                                                height: '100%',
                                                minWidth: 0,
                                                overflow: 'hidden',
                                                borderRadius: '32px',
                                                background: 'rgba(255, 255, 255, 0.03)',
                                                border: '1px solid rgba(255, 255, 255, 0.05)'
                                            }}
                                        />
                                    ))}
                                </div>
                            ) : filteredProducts.length > 0 ? (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: "repeat(2, 1fr)",
                                    gridAutoRows: '260px',
                                    gap: '12px',
                                    paddingBottom: '20px',
                                    justifyContent: 'center'
                                }}>
                                    {filteredProducts.map((product, index) => (
                                        <motion.div
                                            key={product.id || `product-${index}`}
                                            initial={{ opacity: 0, y: 15 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true, margin: "0px 0px -50px 0px" }}
                                            style={{ height: '100%', minWidth: 0, overflow: 'hidden' }}
                                        >
                                            <PremiumProductCard
                                                product={product}
                                                onAddToCart={addToCart}
                                                onClick={() => handleProductSelect(product)}
                                            />
                                        </motion.div>
                                    ))}
                                </div>
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
                                                {myOffers.map((offer, index) => (
                                                    <motion.div
                                                        key={offer.id || `offer-${index}`}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setSelectedOffer(offer)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '16px',
                                                            borderRadius: '24px',
                                                            background: 'rgba(255, 255, 255, 0.03)',
                                                            border: '1px solid rgba(255, 255, 255, 0.05)',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            gap: '8px',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{
                                                                background: offer.status === 'accepted' ? '#10b981' : (offer.status === 'rejected' ? '#ef4444' : (offer.status === 'countered' ? '#8b5cf6' : '#f59e0b')),
                                                                padding: '4px 8px',
                                                                borderRadius: '6px',
                                                                fontSize: '10px',
                                                                fontWeight: '900',
                                                                color: 'white'
                                                            }}>
                                                                {offer.status === 'countered' ? 'CONTRAOFERTA' : offer.status?.toUpperCase()}
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
                                                                    Tu oferta: ${offer.amount?.toLocaleString() || offer.offer_amount?.toLocaleString()}
                                                                </div>
                                                                {offer.status === 'countered' && offer.counter_amount && (
                                                                    <div style={{ fontSize: '12px', fontWeight: '900', color: '#8b5cf6', marginTop: '2px' }}>
                                                                        Contraoferta: ${offer.counter_amount.toLocaleString()}
                                                                    </div>
                                                                )}
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
                                            myOrders.map((order, index) => (
                                                <motion.div
                                                    key={order.id || `order-${index}`}
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
                        )
                        }
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
                                tournaments.map((tournament, index) => (
                                    <motion.div
                                        key={tournament.id || `tournament-${index}`}
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

            {/* Modals moved to the end of the component to ensure top stacking */}
            <AnimatePresence>
                {
                    selectedProduct && (
                        <motion.div
                            key="product-modal"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                zIndex: 100000, // Very high z-index to stay above BottomNav
                                background: 'var(--primary)',
                                pointerEvents: 'auto'
                            }}
                        >
                            <PageHero opacity={0.6} />
                            <div style={{
                                position: 'relative',
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden'
                            }}>
                                {/* Header: Title & Back Button */}
                                <div style={{
                                    padding: 'calc(var(--header-height) + 15px) 20px 15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    zIndex: 100,
                                    position: 'relative'
                                }}>
                                    <div>
                                        <h1 style={{
                                            fontSize: '32px',
                                            fontWeight: '950',
                                            color: 'white',
                                            textTransform: 'uppercase',
                                            margin: 0,
                                            lineHeight: '1',
                                            letterSpacing: '-1px'
                                        }}>
                                            {selectedProduct.name}
                                        </h1>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                                            <span style={{
                                                color: 'var(--secondary)',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>
                                                {selectedProduct.category}
                                            </span>
                                            {selectedProduct.brand && (
                                                <span style={{
                                                    color: 'rgba(255,255,255,0.4)',
                                                    fontSize: '11px',
                                                    fontWeight: '700',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    • {selectedProduct.brand}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.9 }}
                                        onClick={handleCloseProduct}
                                        style={{
                                            width: '44px',
                                            height: '44px',
                                            borderRadius: '12px',
                                            background: 'rgba(255,255,255,0.05)',
                                            backdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ArrowLeft size={24} />
                                    </motion.button>
                                </div>

                                <div style={{
                                    position: 'relative',
                                    height: '45vh',
                                    width: '100%',
                                    flexShrink: 0,
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '0 12px 30px 12px',
                                    overflow: 'hidden'
                                }}>
                                    {/* Ambient Glow Background */}
                                    <div style={{
                                        position: 'absolute',
                                        width: '150%',
                                        height: '150%',
                                        background: 'radial-gradient(circle at center, rgba(163, 230, 53, 0.05) 0%, transparent 60%)',
                                        zIndex: 0,
                                        filter: 'blur(40px)'
                                    }} />

                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        style={{
                                            position: 'relative',
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '32px',
                                            overflow: 'hidden',
                                            boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            zIndex: 5,
                                            background: 'var(--primary-light)'
                                        }}
                                    >
                                        <AnimatePresence initial={false} mode="wait">
                                            {currentImageIndex < productImages.length ? (
                                                <motion.img
                                                    key={`img-${currentImageIndex}`}
                                                    src={optimizeImage(productImages[currentImageIndex], { width: 800, height: 1000 })}
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0.2}
                                                    onDragEnd={(_, info) => {
                                                        const threshold = 30; // More sensitive threshold
                                                        if (info.offset.x < -threshold && currentImageIndex < productImages.length) {
                                                            setCurrentImageIndex(prev => prev + 1);
                                                        } else if (info.offset.x > threshold && currentImageIndex > 0) {
                                                            setCurrentImageIndex(prev => prev - 1);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        objectFit: 'cover',
                                                        touchAction: 'none'
                                                    }}
                                                    alt={`${selectedProduct.name} - ${currentImageIndex + 1}`}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=800';
                                                    }}
                                                />
                                            ) : (
                                                <motion.div
                                                    key="description-slide"
                                                    initial={{ opacity: 0, x: 20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    transition={{ duration: 0.3 }}
                                                    drag="x"
                                                    dragConstraints={{ left: 0, right: 0 }}
                                                    dragElastic={0.2}
                                                    onDragEnd={(_, info) => {
                                                        const threshold = 30; // More sensitive threshold
                                                        if (info.offset.x > threshold && currentImageIndex > 0) {
                                                            setCurrentImageIndex(prev => prev - 1);
                                                        }
                                                    }}
                                                    style={{
                                                        width: '100%',
                                                        height: '100%',
                                                        padding: '60px 25px 40px',
                                                        display: 'flex',
                                                        flexDirection: 'column',
                                                        background: 'rgba(0,0,0,0.6)',
                                                        backdropFilter: 'blur(20px)',
                                                        touchAction: 'none',
                                                        overflowY: 'auto'
                                                    }}
                                                >
                                                    <h3 style={{
                                                        fontSize: '11px',
                                                        fontWeight: '900',
                                                        color: 'var(--secondary)',
                                                        marginBottom: '15px',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '1px'
                                                    }}>
                                                        Descripción Completa
                                                    </h3>
                                                    <p style={{
                                                        color: 'rgba(255,255,255,0.9)',
                                                        lineHeight: '1.6',
                                                        fontSize: '15px',
                                                        margin: 0,
                                                        whiteSpace: 'pre-wrap',
                                                        wordBreak: 'break-word'
                                                    }}>
                                                        {selectedProduct.description || 'Sin descripción.'}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Pagination Dots (Included Description Slide) */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '15px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            display: 'flex',
                                            gap: '6px',
                                            zIndex: 10,
                                            padding: '6px 10px',
                                            borderRadius: '20px',
                                            background: 'rgba(0,0,0,0.2)',
                                            backdropFilter: 'blur(5px)'
                                        }}>
                                            {[...Array(productImages.length + 1)].map((_, idx) => (
                                                <div
                                                    key={idx}
                                                    style={{
                                                        width: idx === currentImageIndex ? '16px' : '6px',
                                                        height: '6px',
                                                        borderRadius: '3px',
                                                        background: idx === currentImageIndex ? 'var(--secondary)' : 'rgba(255,255,255,0.4)',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                />
                                            ))}
                                        </div>

                                        {/* Dynamic Gradient Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            inset: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)',
                                            zIndex: 2,
                                            pointerEvents: 'none'
                                        }} />

                                        {/* Heart Button Overlay */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '20px',
                                            right: '20px',
                                            zIndex: 10
                                        }}>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => toggleLike(selectedProduct.id)}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    background: 'rgba(0,0,0,0.3)',
                                                    backdropFilter: 'blur(10px)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: likedProducts.has(selectedProduct.id) ? '#ef4444' : 'white'
                                                }}
                                            >
                                                <Heart
                                                    size={20}
                                                    fill={likedProducts.has(selectedProduct.id) ? '#ef4444' : 'none'}
                                                />
                                            </motion.button>
                                        </div>

                                        {/* Condition Overlay */}
                                        {selectedProduct.condition && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: '20px',
                                                right: '20px',
                                                zIndex: 10,
                                                background: 'rgba(0,0,0,0.3)',
                                                backdropFilter: 'blur(10px)',
                                                padding: '4px 10px',
                                                borderRadius: '8px',
                                                border: '1px solid rgba(255,255,255,0.1)'
                                            }}>
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.9)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                    {selectedProduct.condition}
                                                </span>
                                            </div>
                                        )}
                                    </motion.div>

                                </div>

                                <div style={{
                                    position: 'relative',
                                    flex: 1,
                                    background: 'var(--primary)',
                                    borderTopLeftRadius: '24px',
                                    borderTopRightRadius: '24px',
                                    marginTop: '-24px', // Reduced negative margin overlap
                                    padding: '20px 20px 30px', // Reduced padding
                                    zIndex: 5,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden', // Disable global scrolling
                                }}>
                                    {/* Drag Handle */}
                                    <div style={{
                                        width: '32px',
                                        height: '3px',
                                        background: 'rgba(255,255,255,0.2)',
                                        borderRadius: '2px',
                                        margin: '0 auto 15px'
                                    }} />

                                    {/* Price & Actions Row */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ fontSize: '24px', fontWeight: '900', color: 'var(--secondary)' }}>
                                                    ${new Intl.NumberFormat('es-CO').format(selectedProduct.price)}
                                                </div>
                                                {selectedProduct.is_negotiable && (
                                                    <div style={{
                                                        fontSize: '10px',
                                                        background: 'rgba(163, 230, 53, 0.1)',
                                                        color: 'var(--secondary)',
                                                        padding: '3px 8px',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(163, 230, 53, 0.2)',
                                                        fontWeight: '800',
                                                        textTransform: 'uppercase',
                                                        letterSpacing: '0.05em'
                                                    }}>
                                                        Negociable
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px', fontWeight: '600' }}>
                                                {Number(selectedProduct.shipping_cost) > 0 ? (
                                                    <>+ $ {new Intl.NumberFormat('es-CO').format(selectedProduct.shipping_cost)} envío</>
                                                ) : (
                                                    <span style={{ color: 'var(--secondary)' }}>Envío GRATIS</span>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            {/* Offer/Negotiate Icon */}
                                            {selectedProduct.is_negotiable && selectedProduct.seller_id !== user?.id && (
                                                <motion.button
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (!user) return navigate('/auth');
                                                        setShowOfferModal(true);
                                                        setOfferAmount(selectedProduct.price.toString());
                                                    }}
                                                    style={{
                                                        width: '38px',
                                                        height: '38px',
                                                        borderRadius: '10px',
                                                        background: 'rgba(255,255,255,0.05)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        color: 'white',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <Handshake size={18} />
                                                </motion.button>
                                            )}

                                            {/* Cart Icon */}
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (selectedProduct.sizes_inventory && selectedProduct.sizes_inventory.length > 0 && !selectedSize) {
                                                        warning('Falta seleccionar la talla');
                                                        return;
                                                    }
                                                    try {
                                                        setAddingToCart(selectedProduct.id);
                                                        await addToCart({ ...selectedProduct } as any, selectedSize);
                                                        setTimeout(() => setAddingToCart(null), 1500);
                                                    } catch (err) {
                                                        setAddingToCart(null);
                                                    }
                                                }}
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '10px',
                                                    background: 'rgba(163, 230, 53, 0.1)',
                                                    color: 'var(--secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {addingToCart === selectedProduct.id ? <CheckCircle2 size={18} /> : <ShoppingCart size={18} />}
                                            </motion.button>

                                            {/* Buy Now Icon */}
                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    if (!user) return navigate('/auth');
                                                    if (selectedProduct.sizes_inventory && selectedProduct.sizes_inventory.length > 0 && !selectedSize) {
                                                        warning('Falta seleccionar la talla');
                                                        return;
                                                    }
                                                    try {
                                                        setBuying(true);
                                                        await addToCart({ ...selectedProduct } as any, selectedSize);
                                                        setSelectedProduct(null);
                                                        navigate('/checkout');
                                                    } catch (err) {
                                                        setBuying(false);
                                                    }
                                                }}
                                                disabled={buying}
                                                style={{
                                                    width: '38px',
                                                    height: '38px',
                                                    borderRadius: '10px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: 'none',
                                                    cursor: buying ? 'not-allowed' : 'pointer',
                                                    opacity: buying ? 0.5 : 1
                                                }}
                                            >
                                                {buying ? <Loader2 className="animate-spin" size={18} /> : <DollarSign size={18} />}
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Sizes Inventory Selection */}
                                    {selectedProduct.sizes_inventory && selectedProduct.sizes_inventory.length > 0 && (
                                        <div style={{ marginBottom: '15px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <h4 style={{ color: 'rgba(255,255,255,0.8)', fontSize: '11px', fontWeight: '800', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Talla</h4>
                                                {selectedSize && (
                                                    <span style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '700' }}>
                                                        {selectedProduct.sizes_inventory?.find((s: { size: string; quantity: number }) => s.size === selectedSize)?.quantity} disponibles
                                                    </span>
                                                )}
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                                {selectedProduct.sizes_inventory.map((s: { size: string; quantity: number }, idx: number) => (
                                                    <button
                                                        key={s.size || `size-${idx}`}
                                                        disabled={s.quantity <= 0}
                                                        onClick={() => setSelectedSize(s.size)}
                                                        style={{
                                                            minWidth: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            border: '1px solid ' + (selectedSize === s.size ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                                            background: selectedSize === s.size ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                            color: selectedSize === s.size ? 'var(--primary)' : (s.quantity <= 0 ? 'rgba(255,255,255,0.2)' : 'white'),
                                                            fontSize: '11px',
                                                            fontWeight: '800',
                                                            padding: '0 8px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            transition: 'all 0.2s ease',
                                                            opacity: s.quantity <= 0 ? 0.5 : 1,
                                                            cursor: s.quantity <= 0 ? 'not-allowed' : 'pointer'
                                                        }}
                                                    >
                                                        {s.size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}




                                </div>

                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            <AnimatePresence>
                {showOfferModal && selectedProduct && (
                    <div key="offer-modal" style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 110000, // Higher than ProductModal
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
                                                    const { data: insertedOffer, error } = await supabase
                                                        .from('offers')
                                                        .insert([{
                                                            product_id: selectedProduct.id,
                                                            buyer_id: user?.id,
                                                            seller_id: selectedProduct.seller_id,
                                                            offer_amount: parseFloat(offerAmount),
                                                            status: 'pending'
                                                        }]).select().single();
                                                    if (error) throw error;

                                                    // Send notification to seller
                                                    await supabase
                                                        .from('notifications')
                                                        .insert([{
                                                            user_id: selectedProduct.seller_id,
                                                            title: 'Nueva oferta recibida',
                                                            message: `Has recibido una oferta de $${new Intl.NumberFormat('es-CO').format(parseInt(offerAmount))} por tu producto ${selectedProduct.name}`,
                                                            type: 'offer',
                                                            link: `/mystore?tab=offers&offer_id=${insertedOffer.id}`,
                                                            read: false
                                                        }]);

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

                {/* Detalle de Oferta (Para el comprador) */}
                <AnimatePresence>
                    {selectedOffer && (
                        <div key="offer-detail" style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 110000,
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center'
                        }}>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setSelectedOffer(null)}
                                style={{
                                    position: 'fixed',
                                    inset: 0,
                                    background: 'rgba(0,0,0,0.6)',
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
                                    background: '#121212',
                                    borderTopLeftRadius: '32px',
                                    borderTopRightRadius: '32px',
                                    padding: '30px 25px calc(110px + env(safe-area-inset-bottom)) 25px',
                                    position: 'relative',
                                    boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    overflowY: 'auto'
                                }}
                            >
                                <button
                                    onClick={() => setSelectedOffer(null)}
                                    style={{
                                        position: 'absolute',
                                        top: '20px',
                                        right: '25px',
                                        background: 'rgba(255,255,255,0.05)',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '36px',
                                        height: '36px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white'
                                    }}
                                >
                                    <X size={20} />
                                </button>

                                <div style={{ display: 'flex', gap: '20px', marginBottom: '25px', alignItems: 'center' }}>
                                    <img
                                        src={selectedOffer.product?.image_url || ''}
                                        style={{ width: '70px', height: '70px', borderRadius: '16px', objectFit: 'cover' }}
                                        alt=""
                                    />
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>Detalle de la Oferta</h3>
                                        <p style={{ fontSize: '14px', color: 'var(--text-dim)' }}>{selectedOffer.product?.name}</p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ fontSize: '11px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '4px' }}>Tu Oferta Original</div>
                                        <div style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>${(selectedOffer.amount || selectedOffer.offer_amount)?.toLocaleString()}</div>
                                    </div>

                                    {selectedOffer.status === 'countered' && (
                                        <div>
                                            <div style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <div style={{ fontSize: '11px', fontWeight: '900', color: '#a78bfa', textTransform: 'uppercase', marginBottom: '4px' }}>Contraoferta del Vendedor</div>
                                                        <div style={{ fontSize: '24px', fontWeight: '900', color: 'white' }}>${selectedOffer.counter_amount?.toLocaleString()}</div>
                                                    </div>
                                                    <div style={{ background: '#8b5cf6', padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: '900', color: 'white' }}>
                                                        REVISAR
                                                    </div>
                                                </div>

                                                {selectedOffer.counter_message && (
                                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '12px', marginTop: '8px' }}>
                                                        <div style={{ fontSize: '11px', fontWeight: '800', color: '#a78bfa', marginBottom: '4px' }}>Respuesta del vendedor:</div>
                                                        <p style={{ fontSize: '14px', color: 'white', fontStyle: 'italic', margin: 0 }}>"{selectedOffer.counter_message}"</p>
                                                    </div>
                                                )}
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                disabled={acceptingCounter}
                                                onClick={async () => {
                                                    setAcceptingCounter(true);
                                                    try {
                                                        const { error } = await supabase
                                                            .from('offers')
                                                            .update({
                                                                status: 'accepted',
                                                                offer_amount: selectedOffer.counter_amount
                                                            })
                                                            .eq('id', selectedOffer.id);

                                                        if (error) throw error;

                                                        // Notify seller
                                                        await supabase
                                                            .from('notifications')
                                                            .insert([{
                                                                user_id: selectedOffer.seller_id,
                                                                title: '¡Contraoferta aceptada!',
                                                                message: `El comprador ha aceptado tu contraoferta de $${(selectedOffer.counter_amount || 0).toLocaleString()} por ${selectedOffer.product?.name || 'su producto'}`,
                                                                type: 'offer',
                                                                link: '/mystore?tab=offers',
                                                                read: false
                                                            }]);

                                                        warning('¡Felicidades! Has aceptado la contraoferta.');
                                                        setSelectedOffer(null);
                                                        navigate('/checkout', { state: { offer: selectedOffer } });

                                                        // Refresh offers
                                                        const { data } = await supabase
                                                            .from('offers')
                                                            .select('*, product:products(*)')
                                                            .eq('buyer_id', user?.id || '')
                                                            .order('created_at', { ascending: false });
                                                        if (data) setMyOffers(data);
                                                    } catch (err) {
                                                        console.error(err);
                                                    } finally {
                                                        setAcceptingCounter(false);
                                                    }
                                                }}
                                                style={{
                                                    marginTop: '16px',
                                                    width: '100%',
                                                    height: '56px',
                                                    borderRadius: '16px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    border: 'none',
                                                    fontWeight: '900',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                {acceptingCounter ? 'PROCESANDO...' : `ACEPTAR Y COMPRAR POR $${selectedOffer.counter_amount?.toLocaleString()}`}
                                            </motion.button>
                                        </div>
                                    )}

                                    {selectedOffer.status === 'accepted' && (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                                                <div style={{ fontSize: '11px', fontWeight: '900', color: '#10b981', textTransform: 'uppercase', marginBottom: '4px' }}>Estado</div>
                                                <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>¡Oferta Aceptada!</div>
                                                <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginTop: '8px' }}>El vendedor ha aceptado tu oferta. Tienes 1 hora para completar el pago.</p>
                                            </div>

                                            <motion.button
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setSelectedOffer(null);
                                                    navigate('/checkout', { state: { offer: selectedOffer } });
                                                }}
                                                style={{
                                                    width: '100%',
                                                    height: '56px',
                                                    borderRadius: '16px',
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    border: 'none',
                                                    fontWeight: '900',
                                                    fontSize: '16px'
                                                }}
                                            >
                                                COMPRAR AHORA POR ${(selectedOffer.offer_amount || selectedOffer.amount)?.toLocaleString()}
                                            </motion.button>
                                        </div>
                                    )}

                                    {selectedOffer.status === 'rejected' && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '20px', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                            <div style={{ fontSize: '11px', fontWeight: '900', color: '#ef4444', textTransform: 'uppercase', marginBottom: '4px' }}>Estado</div>
                                            <div style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>Oferta Rechazada</div>
                                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginTop: '8px' }}>Lo sentimos, el vendedor no ha aceptado tu propuesta en este momento.</p>
                                        </div>
                                    )}
                                </div>

                                {/* Enviar Mensaje al Vendedor */}
                                {selectedOffer.status !== 'rejected' && (
                                    <div style={{ marginTop: '10px' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '900', color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: '10px' }}>Responder al Vendedor</label>
                                        <textarea
                                            placeholder="Escribe un mensaje aquí..."
                                            value={replyMessage}
                                            onChange={(e) => setReplyMessage(e.target.value)}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '20px',
                                                padding: '16px',
                                                color: 'white',
                                                fontSize: '14px',
                                                fontWeight: '500',
                                                outline: 'none',
                                                minHeight: '100px',
                                                resize: 'none',
                                                marginBottom: '16px'
                                            }}
                                        />
                                        <motion.button
                                            whileTap={{ scale: 0.95 }}
                                            disabled={sendingReply || !replyMessage}
                                            onClick={async () => {
                                                setSendingReply(true);
                                                try {
                                                    const { error } = await supabase
                                                        .from('notifications')
                                                        .insert([{
                                                            user_id: selectedOffer.seller_id,
                                                            title: 'Nuevo mensaje sobre oferta',
                                                            message: `El comprador de ${selectedOffer.product?.name} dice: ${replyMessage}`,
                                                            type: 'offer',
                                                            link: '/mystore?tab=offers',
                                                            read: false
                                                        }]);

                                                    if (error) throw error;

                                                    warning('¡Mensaje enviado al vendedor!');
                                                    setReplyMessage('');
                                                    setSelectedOffer(null);
                                                } catch (err) {
                                                    console.error(err);
                                                } finally {
                                                    setSendingReply(false);
                                                }
                                            }}
                                            className="btn-primary"
                                            style={{ width: '100%', height: '54px' }}
                                        >
                                            {sendingReply ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                                        </motion.button>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </div>
    );
};


export default Home;
