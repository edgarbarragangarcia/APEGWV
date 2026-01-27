import React from 'react';
import { Star, MapPin, CheckCircle, MessageCircle } from 'lucide-react';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import { useNavigate } from 'react-router-dom';

const caddies = [
    { id: 1, name: 'Juan Manuel G.', rating: 4.9, reviews: 124, price: 50, experience: '12 años', location: 'La Moraleja / El Saler', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400', special: 'Especialista en Green-reading' },
    { id: 2, name: 'Carlos Ruiz', rating: 4.7, reviews: 89, price: 40, experience: '5 años', location: 'Puerta de Hierro', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400', special: 'Conocimiento de vientos locales' },
    { id: 3, name: 'Elena Martínez', rating: 5.0, reviews: 45, price: 60, experience: '15 años', location: 'Santander / RACE', image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400', special: 'Certificación PGA' },
];

const Caddies: React.FC = () => {
    const navigate = useNavigate();
    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            background: 'var(--primary)'
        }}>
            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'var(--primary)',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    title="Caddies Profesionales"
                    subtitle="Eleva tu juego con la ayuda de expertos"
                    onBack={() => navigate(-1)}
                />
            </div>

            {/* Área de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {caddies.map((caddie) => (
                        <Card key={caddie.id} style={{ display: 'flex', gap: '20px', padding: '15px' }}>
                            <div style={{ position: 'relative' }}>
                                <img
                                    src={caddie.image}
                                    alt={caddie.name}
                                    style={{ width: '100px', height: '120px', objectFit: 'cover', borderRadius: '15px' }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-10px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    padding: '2px 8px',
                                    borderRadius: '10px',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                }}>
                                    PRO LEVEL
                                </div>
                            </div>

                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <h3 style={{ fontSize: '18px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            {caddie.name} <CheckCircle size={16} color="var(--secondary)" fill="var(--primary)" />
                                        </h3>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-dim)', marginTop: '2px' }}>
                                            <MapPin size={14} /> {caddie.location}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ffcc00' }}>
                                            <Star size={14} fill="#ffcc00" /> <span style={{ fontWeight: '600' }}>{caddie.rating}</span>
                                        </div>
                                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>({caddie.reviews} reseñas)</span>
                                    </div>
                                </div>

                                <div style={{ marginTop: '12px', display: 'flex', gap: '15px' }}>
                                    <div style={{ fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Exp:</span> {caddie.experience}
                                    </div>
                                    <div style={{ fontSize: '13px' }}>
                                        <span style={{ color: 'var(--text-dim)' }}>Especialidad:</span> {caddie.special}
                                    </div>
                                </div>

                                <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--secondary)' }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(caddie.price)}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}> / ronda</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button className="glass" style={{ padding: '8px', borderRadius: '10px' }}>
                                            <MessageCircle size={18} />
                                        </button>
                                        <button style={{
                                            background: 'var(--secondary)',
                                            color: 'var(--primary)',
                                            padding: '8px 20px',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '14px'
                                        }}>
                                            Reservar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
                {/* Final del Área de Scroll */}
            </div>
        </div>
    );
};

export default Caddies;
