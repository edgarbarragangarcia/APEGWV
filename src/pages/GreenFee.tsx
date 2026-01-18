import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, ChevronRight, Star } from 'lucide-react';
import Card from '../components/Card';

const courses = [
    {
        id: 'briceno-18',
        name: 'Briceño 18',
        location: 'Km 18 Autopista Norte, Briceño',
        image: '/images/briceno18.png',
        rating: 4.8,
        price: '$250.000',
        available: true
    },
    {
        id: 'club-campestre',
        name: 'Club Campestre APEG',
        location: 'La Calera, Cundinamarca',
        image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2070&auto=format&fit=crop',
        rating: 4.9,
        price: 'Próximamente',
        available: false
    }
];

const GreenFee: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="page-transition" style={{ paddingBottom: '100px' }}>
            <div style={{ marginBottom: '25px', padding: '0 10px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800' }}>Green Fees</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                    Reserva tu salida en los mejores campos
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {courses.map((course) => (
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
                                        <span>{course.location}</span>
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
                ))}
            </div>
        </div>
    );
};

export default GreenFee;
