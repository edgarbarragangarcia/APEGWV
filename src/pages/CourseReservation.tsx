import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, CheckCircle2 } from 'lucide-react';

const CourseReservation: React.FC = () => {
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


    {/* Modal de Confirmación */ }
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

                    <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>¡Reserva Lista!</h2>

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
                            onClick={() => alert('Integración de pagos próximamente...')}
                            style={{
                                flex: 1,
                                padding: '15px',
                                borderRadius: '15px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                fontWeight: '800',
                                fontSize: '14px'
                            }}
                        >
                            Pagar Ahora
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>

    {/* Footer Action */ }
    <AnimatePresence>
        {!isReserved && selectedDate && selectedTime && (
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
};

export default CourseReservation;
