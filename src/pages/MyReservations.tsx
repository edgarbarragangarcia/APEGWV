import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import Card from '../components/Card';
import { Calendar, Clock, MapPin, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { motion, AnimatePresence } from 'framer-motion';

interface Reservation {
    id: string;
    club_id: string | null;
    reservation_date: string;
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
    const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelled, setShowCancelled] = useState(false);

    const fetchReservations = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from('reservations')
                .select('*, golf_courses(*)')
                .eq('user_id', session.user.id)
                .order('reservation_date', { ascending: false });

            if (error) throw error;
            setReservations((data as any) || []);
        } catch (err) {
            console.error('Error fetching reservations:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReservations();
    }, []);

    const handleCancel = async () => {
        if (!selectedRes) return;

        setIsCancelling(true);
        try {
            const { error } = await supabase
                .from('reservations')
                .update({ status: 'cancelled' })
                .eq('id', selectedRes.id);

            if (error) throw error;

            setShowConfirmModal(false);
            setShowSuccessModal(true);

            // Refresh list
            await fetchReservations();

            // Auto hide success modal
            setTimeout(() => {
                setShowSuccessModal(false);
                setSelectedRes(null);
            }, 2500);
        } catch (err) {
            console.error('Error cancelling reservation:', err);
            // We could add an error modal here too
        } finally {
            setIsCancelling(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                <div className="spinner" style={{ borderTopColor: 'var(--secondary)' }}></div>
            </div>
        );
    }

    const isTab = !!onRequestSwitchTab;
    const activeReservations = reservations.filter(r => r.status !== 'cancelled');
    const cancelledReservations = reservations.filter(r => r.status === 'cancelled');

    const content = (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {activeReservations.length === 0 && cancelledReservations.length === 0 ? (
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
                <>
                    {/* Reservas Activas */}
                    {activeReservations.map((res) => (
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
                                                    const [y, m, d] = res.reservation_date.split('-').map(Number);
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
                                    marginTop: '15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '15px'
                                }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-dim)' }}>
                                        {res.players_count || 1} Jugador{res.players_count > 1 ? 'es' : ''}
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--secondary)' }}>
                                        {new Intl.NumberFormat('es-CO', {
                                            style: 'currency',
                                            currency: 'COP',
                                            maximumFractionDigits: 0
                                        }).format(res.price || 0)}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        setSelectedRes(res);
                                        setShowConfirmModal(true);
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'rgba(248, 113, 113, 0.1)',
                                        color: '#f87171',
                                        border: '1px solid rgba(248, 113, 113, 0.2)',
                                        fontSize: '13px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    Cancelar Reserva
                                </button>
                            </div>
                        </Card>
                    ))}

                    {/* Desplegable de Reservas Canceladas */}
                    {cancelledReservations.length > 0 && (
                        <div style={{ marginTop: '10px' }}>
                            <button
                                onClick={() => setShowCancelled(!showCancelled)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '15px 20px',
                                    borderRadius: '16px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        background: 'rgba(248, 113, 113, 0.15)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <AlertCircle size={16} color="#f87171" />
                                    </div>
                                    <span style={{ fontSize: '14px' }}>Historial de Cancelaciones ({cancelledReservations.length})</span>
                                </div>
                                <ChevronDown
                                    size={18}
                                    style={{
                                        transform: showCancelled ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                        color: 'var(--text-dim)'
                                    }}
                                />
                            </button>

                            <AnimatePresence>
                                {showCancelled && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                                        style={{ overflow: 'hidden' }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '15px', paddingBottom: '10px' }}>
                                            {cancelledReservations.map((res) => (
                                                <div key={res.id} style={{
                                                    padding: '15px',
                                                    background: 'rgba(255,255,255,0.02)',
                                                    borderRadius: '14px',
                                                    border: '1px solid rgba(255,255,255,0.03)',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '8px'
                                                }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>
                                                            {(res as any).golf_courses?.name || 'Green Fee'}
                                                        </h4>
                                                        <span style={{
                                                            fontSize: '9px',
                                                            padding: '2px 8px',
                                                            borderRadius: '5px',
                                                            background: 'rgba(248, 113, 113, 0.1)',
                                                            color: '#f87171',
                                                            fontWeight: '800',
                                                            textTransform: 'uppercase'
                                                        }}>Cancelada</span>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '15px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Calendar size={12} color="var(--text-dim)" />
                                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                                                {(() => {
                                                                    const [y, m, d] = res.reservation_date.split('-').map(Number);
                                                                    return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
                                                                })()}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                            <Clock size={12} color="var(--text-dim)" />
                                                            <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{res.time}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const modals = (
        <AnimatePresence>
            {showConfirmModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 2000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.85)',
                    backdropFilter: 'blur(8px)',
                    padding: '20px'
                }} onClick={() => setShowConfirmModal(false)}>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            maxWidth: '320px',
                            background: 'var(--primary)',
                            borderRadius: '24px',
                            padding: '30px 25px',
                            textAlign: 'center',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}
                    >

                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
                            ¿Cancelar Reserva?
                        </h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '25px', lineHeight: '1.5' }}>
                            Perderás tu cupo en esta salida. ¿Estás seguro de continuar?
                        </p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => setShowConfirmModal(false)}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '15px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontWeight: '700',
                                    border: 'none'
                                }}
                            >
                                Volver
                            </button>
                            <button
                                onClick={handleCancel}
                                disabled={isCancelling}
                                style={{
                                    flex: 1,
                                    padding: '12px',
                                    borderRadius: '15px',
                                    background: '#ef4444',
                                    color: 'white',
                                    fontWeight: '700',
                                    border: 'none'
                                }}
                            >
                                {isCancelling ? 'Cancelando...' : 'Cancelar Cupo'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {showSuccessModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        style={{
                            background: 'rgba(30, 45, 30, 0.95)',
                            borderRadius: '30px',
                            padding: '40px 30px',
                            textAlign: 'center',
                            maxWidth: '85%',
                            width: '320px',
                            border: '1px solid rgba(163, 230, 53, 0.3)'
                        }}
                    >
                        <div style={{
                            width: '70px',
                            height: '70px',
                            borderRadius: '50%',
                            background: 'rgba(163, 230, 53, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            color: 'var(--secondary)'
                        }}>
                            <CheckCircle2 size={40} />
                        </div>
                        <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
                            Reserva <span style={{ color: 'var(--secondary)' }}>Cancelada</span>
                        </h2>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: '1.4' }}>
                            Tu reserva ha sido cancelada exitosamente. El historial ha sido actualizado.
                        </p>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    if (isTab) {
        return (
            <div style={{ paddingBottom: '20px' }}>
                {content}
                {modals}
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)',
            position: 'fixed',
            inset: 0
        }}>
            <PageHero />

            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 1000,
                background: 'transparent',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    title="Mis Reservas"
                    onBack={() => navigate(-1)}
                />
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden',
                zIndex: 10
            }}>
                {content}
            </div>

            {modals}
        </div>
    );
};

export default MyReservations;
