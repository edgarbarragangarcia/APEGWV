import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';
import { Calendar, Clock, MapPin, ChevronLeft, Loader2 } from 'lucide-react';


interface Reservation {
    id: string;
    course_name: string;
    date: string;
    time: string;
    status: string;
    payment_status: string;
    created_at: string;
}

const MyReservations: React.FC = () => {
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
                    .select('*')
                    .eq('user_id', session.user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setReservations(data || []);
            } catch (err) {
                console.error('Error fetching reservations:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchReservations();
    }, []);

    if (loading) {
        return <div className="flex-center" style={{ height: '100vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="page-transition" style={{ paddingBottom: '100px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        marginRight: '15px',
                        cursor: 'pointer'
                    }}
                >
                    <ChevronLeft size={24} />
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: '800', margin: 0 }}>Mis Reservas</h1>
            </div>

            {reservations.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: '50px', color: 'var(--text-dim)' }}>
                    <Calendar size={48} style={{ marginBottom: '15px', opacity: 0.5 }} />
                    <p>No tienes reservas activas.</p>
                    <button
                        onClick={() => navigate('/green-fee')}
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
                                    <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '5px' }}>{res.course_name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: 'var(--text-dim)' }}>
                                        <MapPin size={12} />
                                        <span>Confirmado</span>
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
                                    {res.payment_status === 'paid' ? 'Pagado' : 'Pendiente'}
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
                                        <div style={{ fontSize: '14px', fontWeight: '600' }}>{res.date} Enero</div> {/* Assuming January based on mock data in context */}
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
