import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';

const GreenFee: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<number | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isReserved, setIsReserved] = useState(false);

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

    if (isReserved) {
        return (
            <div className="page-transition flex-center" style={{ height: '70vh', flexDirection: 'column', textAlign: 'center' }}>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 12 }}
                >
                    <CheckCircle2 size={80} color="var(--secondary)" />
                </motion.div>
                <h2 style={{ marginTop: '20px', fontSize: '24px' }}>¡Reserva Confirmada!</h2>
                <p style={{ color: 'var(--text-dim)', marginTop: '10px', maxWidth: '300px' }}>
                    Tu salida en Briceño 18 ha sido agendada para el día {selectedDate} a las {selectedTime}.
                </p>
                <button
                    onClick={() => setIsReserved(false)}
                    className="btn-primary"
                    style={{ marginTop: '30px', width: '200px' }}
                >
                    Volver
                </button>
            </div>
        );
    }

    return (
        <div className="page-transition">
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
                    <h1 style={{ fontSize: '28px', color: 'white', fontWeight: '800' }}>Briceño 18</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                        <MapPin size={14} />
                        <span>Km 18 Autopista Norte, Briceño</span>
                    </div>
                </div>
            </div>

            {/* Date Selection */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '600' }}>Seleccionar Fecha</h3>
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
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px' }}>Horarios Disponibles</h3>
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

            {/* Footer Action */}
            <AnimatePresence>
                {selectedDate && selectedTime && (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        exit={{ y: 100 }}
                        style={{
                            position: 'fixed',
                            bottom: '100px',
                            left: '20px',
                            right: '20px',
                            zIndex: 900
                        }}
                    >
                        <button
                            className="btn-primary"
                            style={{
                                width: '100%',
                                height: '60px',
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
        </div>
    );
};

export default GreenFee;
