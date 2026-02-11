import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ChevronRight, Star, Filter, LayoutGrid, Ticket, ExternalLink, X } from 'lucide-react';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import MyReservations from './MyReservations';
import { supabase } from '../services/SupabaseManager';



const GreenFee: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedCity, setSelectedCity] = useState('Todas');
    const [navOptions, setNavOptions] = useState<{ name: string, location: string } | null>(null);
    const [activeTab, setActiveTab] = useState<'courses' | 'reservations'>('courses');
    const [dbCourses, setDbCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('golf_courses')
                    .select('*')
                    .order('name');

                if (data && !error) {
                    const mappedCourses = data.map(course => {
                        // Determinar si hoy es fin de semana (Sábado=6, Domingo=0)
                        const today = new Date().getDay();
                        const isWeekend = today === 0 || today === 6;
                        const displayPrice = isWeekend ? course.price_weekend : course.price_weekday;

                        return {
                            id: course.id,
                            name: course.name,
                            city: course.location ? course.location.split(',')[0].trim() : 'Colombia',
                            location: course.address || course.location,
                            image: course.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop',
                            rating: course.rating || 4.5,
                            price: displayPrice ? new Intl.NumberFormat('es-CO', {
                                style: 'currency',
                                currency: 'COP',
                                maximumFractionDigits: 0
                            }).format(displayPrice) : 'Próximamente',
                            available: course.status === 'active'
                        };
                    });
                    setDbCourses(mappedCourses);
                }
            } catch (err) {
                console.error('Error fetching courses:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    useEffect(() => {
        if (location.state && location.state.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    const filteredCourses = selectedCity === 'Todas'
        ? dbCourses
        : dbCourses.filter(course => course.city === selectedCity);

    const availableCities = ['Todas', ...new Set(dbCourses.map(c => c.city))];

    return (
        <div style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            zIndex: 500
        }} className="animate-fade">
            <PageHero />

            {/* Header Fijo - Green Fees */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'transparent',
                paddingBottom: '0px',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    showBack={false}
                    title="Green Fee"
                    subtitle="Reserva tu salida en los mejores campos"
                />

                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '3px',
                    borderRadius: '16px',
                    marginBottom: '0px'
                }}>
                    <button
                        onClick={() => setActiveTab('courses')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === 'courses' ? 'var(--secondary)' : 'transparent',
                            color: activeTab === 'courses' ? 'var(--primary)' : 'var(--text-dim)',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <LayoutGrid size={16} /> Campos
                    </button>
                    <button
                        onClick={() => setActiveTab('reservations')}
                        style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '12px',
                            border: 'none',
                            background: activeTab === 'reservations' ? 'var(--secondary)' : 'transparent',
                            color: activeTab === 'reservations' ? 'var(--primary)' : 'var(--text-dim)',
                            fontWeight: '700',
                            fontSize: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <Ticket size={16} /> Mis Reservas
                    </button>
                </div>

                {/* City Filters - Solo se muestran si estamos en la pestaña de campos */}
                {activeTab === 'courses' && (
                    <div style={{
                        display: 'flex',
                        gap: '10px',
                        overflowX: 'auto',
                        paddingTop: '6px',
                        paddingBottom: '0px',
                        marginBottom: '0px',
                        scrollbarWidth: 'none'
                    }}>
                        {availableCities.map(city => (
                            <button
                                key={city}
                                onClick={() => setSelectedCity(city)}
                                style={{
                                    padding: '6px 14px',
                                    borderRadius: '20px',
                                    background: selectedCity === city ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                    color: selectedCity === city ? 'var(--primary)' : 'var(--text-main)',
                                    border: selectedCity === city ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {city}
                            </button>
                        ))}
                    </div>
                )}

            </div>

            {/* Área de Scroll */}
            <div style={{
                position: 'absolute',
                top: activeTab === 'courses' ? 'calc(var(--header-offset-top) + 144px)' : 'calc(var(--header-offset-top) + 104px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '5px 20px 20px 20px'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                        <div className="spinner" style={{ borderTopColor: 'var(--secondary)' }}></div>
                    </div>
                ) : activeTab === 'courses' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <Card
                                    key={course.id}
                                    onClick={() => course.available && navigate(`/green-fee/${course.id}`)}
                                    style={{ padding: 0, overflow: 'hidden', border: 'none', position: 'relative' }}
                                >
                                    <div style={{ height: '140px', position: 'relative' }}>
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)'
                                        }} />
                                        <div style={{
                                            position: 'absolute',
                                            top: '15px',
                                            right: '15px',
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '5px 10px',
                                            borderRadius: '12px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}>
                                            <Star size={12} fill="#FACC15" color="#FACC15" />
                                            <span>{course.rating}</span>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '15px', left: '20px', right: '20px' }}>
                                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'white', lineHeight: '1.1' }}>{course.name}</h3>
                                        </div>
                                        {!course.available && (
                                            <div style={{
                                                position: 'absolute',
                                                inset: 0,
                                                background: 'rgba(0,0,0,0.4)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backdropFilter: 'grayscale(100%)'
                                            }}>
                                                <span style={{
                                                    padding: '8px 16px',
                                                    background: 'var(--bg-dark)',
                                                    borderRadius: '20px',
                                                    fontSize: '12px',
                                                    fontWeight: '600'
                                                }}>
                                                    Próximamente
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ padding: '16px 20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>
                                                <MapPin size={14} color="var(--secondary)" />
                                                <span>{course.city} • {course.location}</span>
                                            </div>

                                            {course.available && (
                                                <span style={{
                                                    fontSize: '12px',
                                                    fontWeight: '800',
                                                    color: 'var(--secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    Reservar <ChevronRight size={14} />
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-dim)' }}>
                                <Filter size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                                <p>No hay campos disponibles en {selectedCity} por el momento.</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <MyReservations onRequestSwitchTab={() => setActiveTab('courses')} />
                )}
            </div>

            {/* Navigation Modal */}
            <AnimatePresence>
                {navOptions && (
                    <div
                        onClick={() => setNavOptions(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            style={{
                                width: '90%',
                                maxWidth: '400px',
                                background: 'rgba(15, 30, 15, 0.98)',
                                borderRadius: '32px',
                                padding: '30px 24px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>¿Cómo quieres <span style={{ color: 'var(--secondary)' }}>llegar</span>?</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{navOptions.name}</p>
                                </div>
                                <button onClick={() => setNavOptions(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white', cursor: 'pointer' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button
                                    onClick={() => {
                                        const mapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(navOptions.location)}`;
                                        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navOptions.location)}`;

                                        if (window.iOSNative?.openExternalURL) {
                                            // Try Apple Maps first on iOS
                                            window.iOSNative.openExternalURL(mapsUrl);
                                        } else {
                                            // Fallback to Google Maps web
                                            window.open(googleMapsUrl, '_blank');
                                        }
                                        setNavOptions(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '18px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282020%29.svg" style={{ width: '24px' }} alt="Google Maps" />
                                        </div>
                                        Google Maps
                                    </div>
                                    <ExternalLink size={18} opacity={0.5} />
                                </button>

                                <button
                                    onClick={() => {
                                        const wazeUrl = `waze://?q=${encodeURIComponent(navOptions.location)}`;
                                        const wazeWebUrl = `https://waze.com/ul?q=${encodeURIComponent(navOptions.location)}`;

                                        if (window.iOSNative?.openExternalURL) {
                                            // Open Waze app on iOS
                                            window.iOSNative.openExternalURL(wazeUrl);
                                        } else {
                                            // Fallback to Waze web
                                            window.open(wazeWebUrl, '_blank');
                                        }
                                        setNavOptions(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '18px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="/images/waze.png" style={{ width: '24px' }} alt="Waze" />
                                        </div>
                                        Waze
                                    </div>
                                    <ExternalLink size={18} opacity={0.5} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>

    );
};

export default GreenFee;
