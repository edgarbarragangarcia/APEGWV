import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import PageHeader from '../components/PageHeader';

const CourseReservation: React.FC = () => {
    const navigate = useNavigate();
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isReserved, setIsReserved] = useState(false);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

    const dates = [
        { day: 'Lun', num: 19 },
        { day: 'Mar', num: 20 },
        { day: 'Mié', num: 21 },
        { day: 'Jue', num: 22 },
        { day: 'Vie', num: 23 },
        { day: 'Sáb', num: 24 },
        { day: 'Dom', num: 25 },
    ];

    const timeSlots = [
        '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
    ];

    const handleReserve = () => {
        if (selectedDate && selectedTime) {
            setIsReserved(true);
        }
    };

    const handlePayment = async () => {
        setIsPaymentProcessing(true);

        try {
            // Simulate payment processing time
            await new Promise(resolve => setTimeout(resolve, 2000));

            const { data: { session } } = await supabase.auth.getSession();

            if (session) {
                const { error } = await supabase.from('reservations').insert({
                    user_id: session.user.id,
                    course_id: 'briceno-18', // Hardcoded for now based on context
                    course_name: 'Briceño 18',
                    date: selectedDate?.toString() || '',
                    time: selectedTime || '',
                    status: 'confirmed',
                    payment_status: 'paid'
                });

                if (error) throw error;
            }

            // Redirect to My Reservations tab in Green Fee page
            navigate('/green-fee', { state: { tab: 'reservations' } });

        } catch (error) {
            console.error("Payment/Reservation error:", error);
            alert("Hubo un error al procesar la reserva. Intenta nuevamente.");
            setIsPaymentProcessing(false);
        }
    };


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
                    title="Reservar Campo"
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
                {/* Hero Section */}
                <div style={{
                    position: 'relative',
                    height: '250px',
                    borderRadius: '25px',
                    overflow: 'hidden',
                    marginBottom: '30px',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                }}>
                    <img
                        src="/images/briceno18.png"
                        alt="Briceño 18"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '30px 20px',
                        background: 'linear-gradient(transparent, rgba(14, 47, 31, 0.9))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '5px'
                    }}>
                        <h1 style={{ fontSize: '28px', color: 'white', fontWeight: '900' }}>
                            Briceño <span style={{ color: 'var(--secondary)' }}>18</span>
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                            <MapPin size={14} />
                            <span>Km 18 Autopista Norte, Briceño</span>
                        </div>
                    </div>
                </div>

                {/* Date Selection */}
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                            Seleccionar <span style={{ color: 'var(--secondary)' }}>Fecha</span>
                        </h3>
                        <span style={{ fontSize: '14px', color: 'var(--secondary)' }}>Enero 2026</span>
                    </div>
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        overflowX: 'auto',
                        paddingBottom: '10px',
                        scrollbarWidth: 'none'
                    }}>
                        {dates.map((date) => (
                            <motion.button
                                key={date.num}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setSelectedDate(date.num)}
                                style={{
                                    minWidth: '60px',
                                    height: '80px',
                                    borderRadius: '15px',
                                    background: selectedDate === date.num ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                    color: selectedDate === date.num ? 'var(--bg-dark)' : 'var(--text-main)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '5px',
                                    border: 'none',
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                <span style={{ fontSize: '12px', fontWeight: '500', opacity: 0.7 }}>{date.day}</span>
                                <span style={{ fontSize: '18px', fontWeight: '700' }}>{date.num}</span>
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Time Selection */}
                <div style={{ marginBottom: '100px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '15px' }}>
                        Horarios <span style={{ color: 'var(--secondary)' }}>Disponibles</span>
                    </h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px'
                    }}>
                        {timeSlots.map((time) => (
                            <motion.button
                                key={time}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedTime(time)}
                                style={{
                                    padding: '12px',
                                    borderRadius: '12px',
                                    background: selectedTime === time ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.05)',
                                    color: selectedTime === time ? 'var(--secondary)' : 'var(--text-main)',
                                    border: selectedTime === time ? '1px solid var(--secondary)' : '1px solid rgba(255,255,255,0.1)',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {time}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Modal de Confirmación */}
                <AnimatePresence>
                    {isReserved && (
                        <div style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            background: 'rgba(0,0,0,0.6)',
                            backdropFilter: 'blur(5px)'
                        }}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                                className="glass"
                                style={{
                                    width: '100%',
                                    maxWidth: '340px',
                                    padding: '30px',
                                    background: 'var(--primary)',
                                    borderRadius: '30px',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                                }}
                            >
                                <div style={{
                                    width: '70px',
                                    height: '70px',
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    margin: '0 auto 20px',
                                    color: 'var(--secondary)'
                                }}>
                                    <CheckCircle2 size={32} />
                                </div>

                                <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '10px' }}>
                                    ¡Reserva <span style={{ color: 'var(--secondary)' }}>Lista</span>!
                                </h2>

                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '20px',
                                    padding: '15px',
                                    marginBottom: '25px',
                                    textAlign: 'left'
                                }}>
                                    <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '5px' }}>Campo</div>
                                    <div style={{ fontWeight: '600', marginBottom: '10px' }}>Briceño 18</div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '5px' }}>Fecha</div>
                                            <div style={{ fontWeight: '600' }}>{selectedDate} Enero</div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '5px' }}>Hora</div>
                                            <div style={{ fontWeight: '600' }}>{selectedTime}</div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        onClick={() => setIsReserved(false)}
                                        style={{
                                            flex: 1,
                                            padding: '15px',
                                            borderRadius: '15px',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            fontWeight: '700',
                                            fontSize: '14px',
                                            border: '1px solid rgba(255,255,255,0.1)'
                                        }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        onClick={handlePayment}
                                        disabled={isPaymentProcessing}
                                        style={{
                                            flex: 1,
                                            padding: '15px',
                                            borderRadius: '15px',
                                            background: 'var(--secondary)',
                                            color: 'var(--primary)',
                                            fontWeight: '800',
                                            fontSize: '14px',
                                            display: 'flex',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            opacity: isPaymentProcessing ? 0.7 : 1
                                        }}
                                    >
                                        {isPaymentProcessing ? (
                                            <Loader2 className="animate-spin" size={20} />
                                        ) : (
                                            'Pagar Ahora'
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Footer Action */}
                <AnimatePresence>
                    {!isReserved && selectedDate && selectedTime && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{
                                marginTop: '40px',
                                marginBottom: '40px',
                                width: '100%'
                            }}
                        >
                            <button
                                className="btn-primary"
                                style={{
                                    width: '100%',
                                    height: '60px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    borderRadius: '20px',
                                    fontWeight: '800',
                                    fontSize: '18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px'
                                }}
                                onClick={handleReserve}
                            >
                                Reservar Salida <ChevronRight />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Final del Área de Scroll */}
            </div>
        </div>
    );

};

export default CourseReservation;
