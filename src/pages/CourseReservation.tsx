import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, ChevronRight, CheckCircle2, Loader2, ExternalLink, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

const CourseReservation: React.FC = () => {
    const navigate = useNavigate();
    const { courseId } = useParams<{ courseId: string }>();
    const [course, setCourse] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [availableDates, setAvailableDates] = useState<any[]>([]);
    const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string | null>(null);
    const [isReserved, setIsReserved] = useState(false);
    const [priceOverrides, setPriceOverrides] = useState<any[]>([]);
    const [navOptions, setNavOptions] = useState<{ name: string, location: string } | null>(null);

    React.useEffect(() => {
        const fetchCourse = async () => {
            if (!courseId) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('golf_courses')
                    .select('*')
                    .eq('id', courseId)
                    .single();

                if (data && !error) {
                    setCourse(data);
                }

                // Fetch price overrides
                const { data: overrides } = await supabase
                    .from('course_price_overrides')
                    .select('*')
                    .eq('course_id', courseId);

                if (overrides) {
                    setPriceOverrides(overrides);
                }
            } catch (err) {
                console.error("Error fetching course:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();

        // Generar fechas dinámicamente
        const generateDates = () => {
            const dates = [];
            const now = new Date();
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

            for (let i = 0; i < 90; i++) {
                const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                const fullDate = `${year}-${month}-${day}`;

                dates.push({
                    day: days[d.getDay()],
                    num: d.getDate(),
                    fullDate: fullDate,
                    monthName: d.toLocaleString('es-ES', { month: 'long' }),
                    year: year
                });
            }
            return dates;
        };

        const dates = generateDates();
        setAvailableDates(dates);
        if (dates.length > 0) {
            setSelectedDateStr(dates[0].fullDate);
            setSelectedMonth(dates[0].monthName);
        }
    }, [courseId]);

    const timeSlots = [
        '06:00 AM', '06:30 AM', '07:00 AM', '07:30 AM',
        '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
        '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
        '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
        '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
    ];

    const getFilteredTimeSlots = () => {
        if (!selectedDateStr) return [];

        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        if (selectedDateStr !== todayStr) return timeSlots;

        const now = new Date();
        const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000);

        return timeSlots.filter(slot => {
            const [time, period] = slot.split(' ');
            let [hours, minutes] = time.split(':').map(Number);

            if (period === 'PM' && hours < 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            const slotDate = new Date();
            slotDate.setHours(hours, minutes, 0, 0);

            return slotDate > minTime;
        });
    };

    const filteredTimeSlots = getFilteredTimeSlots();

    const getCurrentPrice = () => {
        if (!selectedDateStr || !course) return 0;

        // Check for overrides first (First image: course_price_overrides)
        const override = priceOverrides.find(ov => {
            const start = ov.start_date;
            const end = ov.end_date;
            return selectedDateStr >= start && selectedDateStr <= end;
        });

        if (override) {
            return override.price;
        }

        // Fallback to base prices (Second image: golf_courses)
        const [y, m, d] = selectedDateStr.split('-').map(Number);
        const dayOfWeek = new Date(y, m - 1, d).getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        return isWeekend ? (course.price_weekend || 0) : (course.price_weekday || 0);
    };

    const currentPrice = getCurrentPrice();

    const handleReserve = () => {
        if (selectedDateStr && selectedTime) {
            setIsReserved(true);
        }
    };

    const uniqueMonths = Array.from(new Set(availableDates.map(d => d.monthName)));

    const handlePayment = async () => {
        if (!selectedDateStr || !selectedTime || !course) {
            alert("Por favor selecciona una fecha y hora.");
            return;
        }

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                alert("Debes iniciar sesión para reservar.");
                return;
            }

            navigate('/checkout', {
                state: {
                    reservation: {
                        course: course,
                        reservation_date: selectedDateStr,
                        time: selectedTime,
                        price: currentPrice,
                        players_count: 1
                    }
                }
            });
        } catch (error) {
            console.error("Error al obtener la sesión:", error);
            alert("Hubo un error al verificar tu sesión. Intenta nuevamente.");
        }
    };

    return (
        <div className="animate-fade" style={{
            overflow: 'hidden',
            background: 'var(--primary)',
            zIndex: 900,
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
                zIndex: 900,
                background: 'transparent',
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
                top: 'calc(var(--header-offset-top) + 52px)',
                left: '0',
                right: '0',
                bottom: 0,
                overflowY: 'auto',
                padding: '0 20px 120px 20px',
                overflowX: 'hidden'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
                        <div className="spinner" style={{ borderTopColor: 'var(--secondary)' }}></div>
                    </div>
                ) : course ? (
                    <>
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
                                src={course.image_url || '/images/briceno18.png'}
                                alt={course.name}
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
                                    {course.name.split(' ')[0]} <span style={{ color: 'var(--secondary)' }}>{course.name.split(' ').slice(1).join(' ')}</span>
                                </h1>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <MapPin size={14} />
                                        <span>{course.address || course.location}</span>
                                    </div>
                                    <button
                                        onClick={() => setNavOptions({ name: course.name, location: course.address || course.location })}
                                        style={{
                                            padding: '8px 12px',
                                            borderRadius: '10px',
                                            background: 'rgba(255,255,255,0.95)',
                                            backdropFilter: 'blur(8px)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: '#000',
                                            fontSize: '12px',
                                            fontWeight: '700',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Waze_logo.svg" style={{ width: '16px', height: '16px' }} alt="Waze" /> CÓMO LLEGAR
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                                    Seleccionar <span style={{ color: 'var(--secondary)' }}>Fecha</span>
                                </h3>
                            </div>

                            {/* Month Selection Buttons */}
                            <div style={{
                                display: 'flex',
                                gap: '10px',
                                overflowX: 'auto',
                                paddingBottom: '15px',
                                scrollbarWidth: 'none'
                            }}>
                                {uniqueMonths.map(month => (
                                    <button
                                        key={month}
                                        onClick={() => {
                                            setSelectedMonth(month);
                                            const firstDayOfMonth = availableDates.find(d => d.monthName === month);
                                            if (firstDayOfMonth) {
                                                setSelectedDateStr(firstDayOfMonth.fullDate);
                                                setSelectedTime(null);
                                            }
                                        }}
                                        style={{
                                            padding: '8px 16px',
                                            borderRadius: '20px',
                                            background: selectedMonth === month ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                            color: selectedMonth === month ? 'var(--bg-dark)' : 'white',
                                            border: 'none',
                                            fontSize: '13px',
                                            fontWeight: '700',
                                            textTransform: 'capitalize',
                                            whiteSpace: 'nowrap',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease'
                                        }}
                                    >
                                        {month}
                                    </button>
                                ))}
                            </div>

                            {/* Days Selection Carrusel (filtered by month) */}
                            <div style={{
                                display: 'flex',
                                gap: '12px',
                                overflowX: 'auto',
                                paddingBottom: '10px',
                                scrollbarWidth: 'none'
                            }}>
                                {availableDates
                                    .filter(d => d.monthName === selectedMonth)
                                    .map((date) => (
                                        <motion.button
                                            key={date.fullDate}
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => {
                                                setSelectedDateStr(date.fullDate);
                                                setSelectedTime(null);
                                            }}
                                            style={{
                                                minWidth: '60px',
                                                height: '80px',
                                                borderRadius: '15px',
                                                background: selectedDateStr === date.fullDate ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                color: selectedDateStr === date.fullDate ? 'var(--bg-dark)' : 'var(--text-main)',
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
                                {filteredTimeSlots.length > 0 ? (
                                    filteredTimeSlots.map((time) => (
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
                                    ))
                                ) : (
                                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: 'var(--text-dim)' }}>
                                        No hay horarios disponibles para el tiempo restante de hoy (+2h).
                                    </div>
                                )}
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
                                            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700' }}>Campo</div>
                                            <div style={{ fontWeight: '700', marginBottom: '10px', fontSize: '16px' }}>{course.name}</div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700' }}>Fecha</div>
                                                    <div style={{ fontWeight: '700' }}>
                                                        {(() => {
                                                            if (!selectedDateStr) return '';
                                                            const [y, m, d] = selectedDateStr.split('-').map(Number);
                                                            return new Date(y, m - 1, d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
                                                        })()}
                                                    </div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', textTransform: 'uppercase', fontWeight: '700' }}>Hora</div>
                                                    <div style={{ fontWeight: '700' }}>{selectedTime}</div>
                                                </div>
                                            </div>

                                            <div style={{
                                                borderTop: '1px solid rgba(255,255,255,0.1)',
                                                paddingTop: '15px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <div style={{ fontSize: '12px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '700' }}>Precio Total</div>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--secondary)' }}>
                                                    {new Intl.NumberFormat('es-CO', {
                                                        style: 'currency',
                                                        currency: 'COP',
                                                        maximumFractionDigits: 0
                                                    }).format(currentPrice)}
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
                                                    boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                                                }}
                                            >
                                                Pagar Ahora
                                            </button>
                                        </div>
                                    </motion.div>
                                </div>
                            )}
                        </AnimatePresence>


                        {/* Final del Área de Scroll */}
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '100px 20px', color: 'var(--text-dim)' }}>
                        <Loader2 className="animate-spin" size={48} style={{ opacity: 0.3, marginBottom: '15px' }} />
                        <p>No se pudo cargar la información del campo. ID: {courseId}</p>
                        <button
                            onClick={() => navigate(-1)}
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                background: 'var(--secondary)',
                                color: 'var(--primary)',
                                borderRadius: '10px',
                                border: 'none',
                                fontWeight: '700'
                            }}
                        >
                            Volver
                        </button>
                    </div>
                )}
            </div>

            {/* Floating Reserve Button */}
            <AnimatePresence>
                {!isReserved && selectedDateStr && selectedTime && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        style={{
                            position: 'absolute',
                            bottom: '110px',
                            left: '20px',
                            right: '20px',
                            zIndex: 1000,
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleReserve}
                            style={{
                                width: '100%',
                                height: '70px',
                                background: '#A3E635', // Primary lime green from image
                                color: 'var(--primary)',
                                borderRadius: '35px',
                                fontWeight: '900',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '0 30px',
                                border: 'none',
                                cursor: 'pointer',
                                pointerEvents: 'auto',
                                boxShadow: '0 15px 30px rgba(163, 230, 53, 0.4), 0 0 20px rgba(163, 230, 53, 0.2)',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            <span style={{ flex: 1, textAlign: 'center' }}>
                                Reservar Salida • {new Intl.NumberFormat('es-CO', {
                                    style: 'currency',
                                    currency: 'COP',
                                    maximumFractionDigits: 0
                                }).format(currentPrice)}
                            </span>
                            <ChevronRight size={28} />
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Final del Área de Scroll */}

            {/* Navigation Modal */}
            <AnimatePresence>
                {navOptions && (
                    <div
                        onClick={() => setNavOptions(null)}
                        style={{ position: 'fixed', inset: 0, zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
                    >
                        <motion.div
                            initial={{ y: 300 }}
                            animate={{ y: 0 }}
                            exit={{ y: 300 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                maxWidth: '450px',
                                background: 'rgba(15, 30, 15, 0.98)',
                                borderTopLeftRadius: '32px',
                                borderTopRightRadius: '32px',
                                padding: '30px 24px 50px',
                                borderTop: '1px solid rgba(255,b255,b255,0.1)',
                                boxShadow: '0 -20px 40px rgba(0,0,0,0.4)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                                <div>
                                    <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white' }}>¿Cómo quieres <span style={{ color: 'var(--secondary)' }}>llegar</span>?</h3>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>{navOptions.name}</p>
                                </div>
                                <button onClick={() => setNavOptions(null)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', padding: '8px', color: 'white' }}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <button
                                    onClick={() => {
                                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(navOptions.location)}`, '_blank');
                                        setNavOptions(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '18px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/3/39/Google_Maps_icon_%282020%29.svg" style={{ width: '24px' }} alt="Google Maps" />
                                        </div>
                                        Google Maps
                                    </div>
                                    <ExternalLink size={18} opacity={0.5} />
                                </button>

                                <button
                                    onClick={() => {
                                        window.open(`https://waze.com/ul?q=${encodeURIComponent(navOptions.location)}`, '_blank');
                                        setNavOptions(null);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '18px 24px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        color: 'white',
                                        fontWeight: '700',
                                        fontSize: '15px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/6/66/Waze_logo.svg" style={{ width: '24px' }} alt="Waze" />
                                        </div>
                                        Waze
                                    </div>
                                    <ExternalLink size={18} opacity={0.5} />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CourseReservation;
