import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';
import { Calendar, Clock, MapPin } from 'lucide-react';

interface Reservation {
    id: string;
    club_id: string | null;
    date: string;
    time: string;
    players_count: number;
    price: number;
    status: string | null;
    created_at: string | null;
}


interface MyReservationsProps {
    onRequestSwitchTab?: () => void;
}

const MyReservations: React.FC<MyReservationsProps> = ({ onRequestSwitchTab }) => {
    const navigate = useNavigate();
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReservations = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                const { data, error } = await supabase
                    .from('reservations')
                    .select('*, golf_courses(*)')
                    .eq('user_id', session.user.id)
                    .order('date', { ascending: false });

                if (error) throw error;
                setReservations((data as any) || []);
            } catch (err) {
                console.error('Error fetching reservations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <div className="spinner" style={{ borderTopColor: 'var(--secondary)' }}></div>
            </div>
        );
    }

    return (
        <div style={{ paddingBottom: '20px' }}>
            {reservations.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-dim)' }}>
                    <Calendar size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <p>No tienes reservas activas.</p>
                    <button
                        onClick={onRequestSwitchTab || (() => navigate('/green-fee'))}
                        style={{
                            marginTop: '20px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            padding: '10px 20px',
                            borderRadius: '10px',
                            border: 'none',
                            fontWeight: '600'
                        }}
                    >
                        Reservar Green Fee
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {reservations.map((res) => (
                        <Card key={res.id} style={{ padding: 0, overflow: 'hidden', border: 'none' }}>
                            <div style={{
                                position: 'relative',
                                height: '120px',
                                background: 'linear-gradient(45deg, var(--primary), #1a2e23)'
                            }}>
                                <img
                                    src={(res as any).golf_courses?.image_url || '/images/briceno18.png'}
                                    alt={(res as any).golf_courses?.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
                                />
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'flex-end',
                                    background: 'linear-gradient(to top, var(--primary), transparent)'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        top: '15px',
                                        right: '15px',
                                        background: 'rgba(163, 230, 53, 0.2)',
                                        color: 'var(--secondary)',
                                        padding: '5px 12px',
                                        borderRadius: '10px',
                                        fontSize: '11px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        backdropFilter: 'blur(4px)'
                                    }}>
                                        {res.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                                    </div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '2px' }}>
                                        {(res as any).golf_courses?.name || 'Reserva de Green Fee'}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'rgba(255,255,255,0.7)' }}>
                                        <MapPin size={12} />
                                        <span>{(res as any).golf_courses?.location || 'Bogotá, COL'}</span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 1fr',
                                    gap: '15px',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Calendar size={18} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>Fecha</div>
                                            <div style={{ fontSize: '14px', fontWeight: '700' }}>
                                                {(() => {
                                                    const [y, m, d] = res.date.split('-').map(Number);
                                                    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                                                })()}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <Clock size={18} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>Hora</div>
                                            <div style={{ fontSize: '14px', fontWeight: '700' }}>{res.time}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid rgba(255,255,255,0.05)',
                                    paddingTop: '15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                                        1 Jugador
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--secondary)' }}>
                                        {new Intl.NumberFormat('es-CO', {
                                            style: 'currency',
                                            currency: 'COP',
                                            maximumFractionDigits: 0
                                        }).format(res.price || 0)}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyReservations;
