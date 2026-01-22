import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin, ChevronRight, Star, Filter, LayoutGrid, Ticket } from 'lucide-react';
import Card from '../components/Card';
import MyReservations from './MyReservations';

const courses = [
    {
        id: 'briceno-18',
        name: 'Briceño 18',
        city: 'Bogotá',
        location: 'Km 18 Autopista Norte, Briceño',
        image: '/images/briceno18.png',
        rating: 4.8,
        price: '$250.000',
        available: true
    },
    {
        id: 'club-campestre',
        name: 'Club Campestre APEG',
        city: 'Bogotá',
        location: 'La Calera, Cundinamarca',
        image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop',
        rating: 4.9,
        price: 'Próximamente',
        available: false
    },
    {
        id: 'el-rodeo',
        name: 'Club El Rodeo',
        city: 'Medellín',
        location: 'Medellín, Antioquia',
        image: 'https://images.unsplash.com/photo-1600607686527-6fb886090705?q=80&w=2727&auto=format&fit=crop',
        rating: 4.7,
        price: '$300.000',
        available: false
    },
    {
        id: 'lagartos',
        name: 'Club Los Lagartos',
        city: 'Bogotá',
        location: 'Bogotá D.C.',
        image: 'https://images.unsplash.com/photo-1592919505780-303950717e80?q=80&w=2622&auto=format&fit=crop',
        rating: 4.9,
        price: '$450.000',
        available: false
    }
];

const cities = ['Todas', 'Bogotá', 'Medellín', 'Cali', 'Barranquilla'];

const GreenFee: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [selectedCity, setSelectedCity] = useState('Todas');
    const [activeTab, setActiveTab] = useState<'courses' | 'reservations'>('courses');

    useEffect(() => {
        if (location.state && location.state.tab) {
            setActiveTab(location.state.tab);
        }
    }, [location.state]);

    const filteredCourses = selectedCity === 'Todas'
        ? courses
        : courses.filter(course => course.city === selectedCity);

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

            {/* Header Fijo - Green Fees */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 75px)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary) 90%, transparent 100%)',
                paddingTop: '10px',
                paddingBottom: '10px',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <header style={{ marginBottom: '15px' }}>
                    <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '5px' }}>Green Fees</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                        Reserva tu salida en los mejores campos
                    </p>
                </header>

                {/* Tab Bar */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(255,255,255,0.05)',
                    padding: '4px',
                    borderRadius: '16px',
                    marginBottom: '15px'
                }}>
                    <button
                        onClick={() => setActiveTab('courses')}
                        style={{
                            flex: 1,
                            padding: '10px',
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
                            padding: '10px',
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
                        paddingBottom: '5px',
                        scrollbarWidth: 'none'
                    }}>
                        {cities.map(city => (
                            <button
                                key={city}
                                onClick={() => setSelectedCity(city)}
                                style={{
                                    padding: '8px 16px',
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
                top: activeTab === 'courses' ? 'calc(env(safe-area-inset-top) + 285px)' : 'calc(env(safe-area-inset-top) + 235px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 20px 20px'
            }}>
                {activeTab === 'courses' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                                <Card
                                    key={course.id}
                                    onClick={() => course.available && navigate(`/green-fee/${course.id}`)}
                                    style={{ padding: 0, overflow: 'hidden', border: 'none', position: 'relative' }}
                                >
                                    <div style={{ height: '200px', position: 'relative' }}>
                                        <img
                                            src={course.image}
                                            alt={course.name}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
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
                                            fontWeight: '600'
                                        }}>
                                            <Star size={12} fill="#FACC15" color="#FACC15" />
                                            <span>{course.rating}</span>
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

                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                                            <div>
                                                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{course.name}</h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-dim)', fontSize: '12px' }}>
                                                    <MapPin size={12} />
                                                    <span>{course.city} • {course.location}</span>
                                                </div>
                                            </div>
                                            {course.available && (
                                                <div style={{
                                                    background: 'rgba(163, 230, 53, 0.1)',
                                                    color: 'var(--secondary)',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '700'
                                                }}>
                                                    {course.price}
                                                </div>
                                            )}
                                        </div>

                                        {course.available && (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '15px' }}>
                                                <span style={{
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: 'var(--secondary)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    Ver Disponibilidad <ChevronRight size={16} />
                                                </span>
                                            </div>
                                        )}
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
        </div>

    );
};

export default GreenFee;
