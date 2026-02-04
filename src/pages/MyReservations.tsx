import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';
import { Calendar, Clock, MapPin, Loader2 } from 'lucide-react';


interface Reservation {
    id: string;
    club_id: string | null;
    date: string;
    time: string;
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
                    .select('*, golf_courses(name, location)')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

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
        return <div className="flex-center" style={{ height: '200px' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div style={{ paddingBottom: '20px' }}>
            {/* Header removed for tab view integration */}

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {reservations.map((res) => (
                        <Card key={res.id} style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '5px' }}>{(res as any).golf_courses?.name || 'Reserva de Green Fee'}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-dim)' }}>
                                        <MapPin size={12} />
                                        <span>{(res as any).golf_courses?.location || 'Confirmado'}</span>
                                    </div>
                                </div>
                                <div style={{
                                    background: 'rgba(163, 230, 53, 0.2)',
                                    color: 'var(--secondary)',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase'
                                }}>
                                    {res.status === 'confirmed' ? 'Confirmado' : 'Pendiente'}
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '10px',
                                background: 'rgba(255,255,255,0.03)',
                                padding: '15px',
                                borderRadius: '12px'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Calendar size={16} color="var(--secondary)" />
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Fecha</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>
                                            {new Date(res.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={16} color="var(--secondary)" />
                                    <div>
                                        <div style={{ fontSize: '10px', color: 'var(--text-dim)' }}>Hora</div>
                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{res.time}</div>
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
