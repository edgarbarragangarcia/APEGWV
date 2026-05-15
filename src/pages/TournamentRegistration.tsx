import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Trophy, ShieldCheck, HeartHandshake, CheckCircle2, Loader2, Plus, X, Mail } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

interface Tournament {
    id: string;
    name: string;
    description: string | null;
    date: string;
    club: string;
    price: number;
    participants_limit: number | null;
    current_participants: number | null;
    status: string | null;
    image_url: string | null;
    game_mode: string | null;
    address: string | null;
    rules: string[] | null;
    custom_rules?: string | null;
    registrations?: { count: number }[];
    notes?: string | null;
    [key: string]: any;
}

const TournamentRegistration: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [registering, setRegistering] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [addGuest, setAddGuest] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    // Registration form states
    const [player1, setPlayer1] = useState({
        name: '',
        email: '',
        phone: '',
        federationCode: '',
        handicap: ''
    });
    const [player2, setPlayer2] = useState({
        name: '',
        email: '',
        phone: '',
        federationCode: '',
        handicap: '',
        type: 'player' as 'player' | 'companion'
    });

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const isMobile = windowWidth < 768;

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const { data: tData, error: tError } = await supabase
                .from('tournaments')
                .select(`
                    *,
                    registrations: tournament_registrations(count)
                `)
                .eq('id', id)
                .single();

            if (tError) throw tError;
            setTournament(tData);

            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setPlayer1({
                        name: profile.full_name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        federationCode: profile.federation_code || '',
                        handicap: profile.handicap?.toString() || ''
                    });
                }

                const { data: regData } = await supabase
                    .from('tournament_registrations')
                    .select('id')
                    .eq('tournament_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (regData) setIsRegistered(true);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, user]);

    const paymentInfo = (() => {
        if (!tournament?.notes) return null;
        const matchMethod = tournament.notes.match(/METHOD:(.*?)(?:\n|$)/);
        const matchPhone = tournament.notes.match(/PHONE:(.*?)(?:\n|$)/);
        if (!matchMethod && !matchPhone) return null;
        return {
            method: matchMethod ? matchMethod[1].trim() : 'Nequi',
            phone: matchPhone ? matchPhone[1].trim() : ''
        };
    })();

    const handleRegister = async () => {
        if (isRegistered || !tournament) return;
        if (!player1.name || !player1.email) {
            alert('Por favor completa los campos del jugador principal.');
            return;
        }

        setRegistering(true);
        try {
            const registrations = [
                {
                    tournament_id: tournament.id,
                    user_id: user?.id || null, 
                    registration_status: 'registered',
                    player_name: player1.name,
                    player_email: player1.email,
                    player_phone: player1.phone,
                    player_federation_code: player1.federationCode,
                    player_handicap: player1.handicap ? parseFloat(player1.handicap) : null
                }
            ];

            if (addGuest && player2.name) {
                const isCompanion = player2.type === 'companion';
                registrations.push({
                    tournament_id: tournament.id,
                    user_id: user?.id || null,
                    registration_status: 'registered',
                    player_name: player2.name,
                    player_email: player2.email,
                    player_phone: player2.phone,
                    player_federation_code: isCompanion ? `ACOMP:${player1.name}` : player2.federationCode,
                    player_handicap: isCompanion ? null : (player2.handicap ? parseFloat(player2.handicap) : null)
                });
            }

            const { error } = await supabase
                .from('tournament_registrations')
                .insert(registrations);

            if (error) throw error;
            setIsRegistered(true);
            setShowSuccess(true);
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } catch (err) {
            console.error('Error registering:', err);
            alert('Hubo un error al procesar tu inscripción.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading || !tournament) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--primary)', padding: '20px' }}>
                <Skeleton width="100%" height="200px" borderRadius="30px" style={{ marginBottom: '20px' }} />
                <Skeleton width="60%" height="30px" style={{ marginBottom: '10px' }} />
                <Skeleton width="40%" height="20px" />
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--primary)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '1200px',
            margin: '0 auto',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 0 50px rgba(0,0,0,0.3)'
        }}>
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass"
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 100,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            background: 'rgba(0,0,0,0.8)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, rgba(10,31,25,0.95), rgba(5,15,12,0.95))',
                                padding: '40px 30px',
                                borderRadius: '30px',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                textAlign: 'center',
                                maxWidth: '400px',
                                width: '100%'
                            }}
                        >
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(163, 230, 53, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 25px',
                                color: 'var(--secondary)'
                            }}>
                                <Trophy size={40} />
                            </div>
                            <h2 style={{ fontSize: '28px', fontWeight: '900', color: 'white', marginBottom: '15px' }}>¡INSCRIPCIÓN EXITOSA!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6', marginBottom: '30px' }}>
                                Tu solicitud ha sido procesada. En breve recibirás un correo con los detalles del evento.
                            </p>
                            <button
                                onClick={() => navigate('/my-events')}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', borderRadius: '20px', fontWeight: '900' }}
                            >
                                VER MIS EVENTOS
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div style={{ position: 'relative', height: '18vh', flexShrink: 0, overflow: 'hidden' }}>
                <img
                    src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000'}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }}
                    alt=""
                />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, var(--primary))' }} />
                <div style={{ position: 'absolute', bottom: '20px', left: '25px' }}>
                    <div className="glass" style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                        padding: '4px 10px', borderRadius: '8px', background: 'rgba(163, 230, 53, 0.1)',
                        border: '1px solid rgba(163, 230, 53, 0.2)', marginBottom: '8px'
                    }}>
                        <Trophy size={10} color="var(--secondary)" />
                        <span style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px' }}>TORNEO OFICIAL</span>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '950', margin: 0, color: 'white', letterSpacing: '-0.5px' }}>{tournament.name}</h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px', marginTop: '4px' }}>
                        <MapPin size={12} color="var(--secondary)" /> {tournament.club}
                    </div>
                </div>
            </div>

            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                overflowX: 'hidden',
                WebkitOverflowScrolling: 'touch',
                padding: '15px 25px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '30px' 
            }}>
                <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '30px', paddingBottom: '40px' }}>
                    
                    {/* Left: Info */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{ duration: 0.5 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: isMobile ? '100%' : '350px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <div style={{ width: '4px', height: '16px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>INFORMACIÓN DEL TORNEO</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="glass" style={{ padding: '12px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '85px', justifyContent: 'center' }}>
                                <Calendar size={16} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1.5px', display: 'block' }}>FECHA</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '950' }}>{new Date(tournament.date).toLocaleDateString('es-ES')}</div>
                                </div>
                            </div>
                            <div className="glass" style={{ padding: '12px', borderRadius: '20px', background: 'rgba(163, 230, 53, 0.03)', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '85px', justifyContent: 'center' }}>
                                <span style={{ color: 'var(--secondary)', fontWeight: '950', fontSize: '16px' }}>$</span>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1.5px', display: 'block' }}>VALOR</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '950' }}>{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}</div>
                                </div>
                            </div>
                        </div>

                        {paymentInfo && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="glass" 
                                style={{ 
                                    padding: '15px', 
                                    borderRadius: '20px', 
                                    background: 'rgba(163, 230, 53, 0.05)', 
                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px'
                                }}
                            >
                                <h4 style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <CheckCircle2 size={14} /> INFORMACIÓN DE PAGO
                                </h4>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block' }}>MÉTODO</span>
                                        <span style={{ color: 'white', fontSize: '13px', fontWeight: '800' }}>{paymentInfo.method}</span>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '800', display: 'block' }}>CELULAR / CUENTA</span>
                                        <span style={{ color: 'var(--secondary)', fontSize: '13px', fontWeight: '900' }}>{paymentInfo.phone}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Right: Registration Form */}
                    <motion.div 
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        style={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
                            <div style={{ width: '4px', height: '16px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>DATOS DE INSCRIPCIÓN</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Player 1 Information */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Nombre del Jugador</label>
                                <div className="glass" style={{ padding: '12px 18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                    <Trophy size={16} color="var(--secondary)" style={{ opacity: 0.7 }} />
                                    <input
                                        type="text"
                                        placeholder="Nombre completo"
                                        value={player1.name}
                                        onChange={(e) => setPlayer1({ ...player1, name: e.target.value })}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none', fontWeight: '600' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px' }}>HÁNDICAP</label>
                                    <div className="glass" style={{ padding: '12px 18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                        <ShieldCheck size={16} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="number"
                                            placeholder="0.0"
                                            value={player1.handicap}
                                            onChange={(e) => setPlayer1({ ...player1, handicap: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px' }}>FEDERACIÓN</label>
                                    <div className="glass" style={{ padding: '12px 18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                        <Calendar size={16} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="text"
                                            placeholder="ID"
                                            value={player1.federationCode}
                                            onChange={(e) => setPlayer1({ ...player1, federationCode: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr', gap: '15px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px' }}>CORREO ELECTRÓNICO</label>
                                    <div className="glass" style={{ padding: '12px 18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                        <Mail size={16} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="email"
                                            placeholder="email@ejemplo.com"
                                            value={player1.email}
                                            onChange={(e) => setPlayer1({ ...player1, email: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '13px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px' }}>CELULAR</label>
                                    <div className="glass" style={{ padding: '12px 18px', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                        <HeartHandshake size={16} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="tel"
                                            placeholder="300 000 0000"
                                            value={player1.phone}
                                            onChange={(e) => setPlayer1({ ...player1, phone: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Guest Toggle */}
                        <div
                            onClick={() => setAddGuest(!addGuest)}
                            style={{
                                marginTop: '20px',
                                padding: '12px',
                                borderRadius: '16px',
                                border: '1px dashed rgba(163, 230, 53, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                color: 'var(--secondary)',
                                cursor: 'pointer',
                                background: addGuest ? 'rgba(163, 230, 53, 0.03)' : 'transparent',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {addGuest ? <X size={14} /> : <Plus size={14} />}
                            <span style={{ fontSize: '12px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                {addGuest ? 'QUITAR INVITADO' : 'INSCRIBIR A OTRA PERSONA'}
                            </span>
                        </div>

                        <AnimatePresence>
                            {addGuest && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}
                                >
                                    <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '5px' }}>DATOS DEL INVITADO</h2>
                                    
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setPlayer2({ ...player2, type: 'player' })}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '15px',
                                                background: player2.type === 'player' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${player2.type === 'player' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                                                color: player2.type === 'player' ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                                fontSize: '12px',
                                                fontWeight: '800'
                                            }}
                                        >
                                            JUGADOR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlayer2({ ...player2, type: 'companion' })}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '15px',
                                                background: player2.type === 'companion' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.04)',
                                                border: `1px solid ${player2.type === 'companion' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                                                color: player2.type === 'companion' ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                                fontSize: '12px',
                                                fontWeight: '800'
                                            }}
                                        >
                                            ACOMPAÑANTE
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(10px)' }}>
                                            <Trophy size={18} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="text"
                                                placeholder={player2.type === 'player' ? "Nombre completo jugador invitado" : "Nombre completo acompañante"}
                                                value={player2.name}
                                                onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                            />
                                        </div>

                                        {player2.type === 'player' && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <ShieldCheck size={18} color="rgba(255,255,255,0.3)" />
                                                    <input
                                                        type="number"
                                                        placeholder="Hándicap"
                                                        value={player2.handicap}
                                                        onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                                    />
                                                </div>
                                                <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                                    <Calendar size={18} color="rgba(255,255,255,0.3)" />
                                                    <input
                                                        type="text"
                                                        placeholder="ID FED"
                                                        value={player2.federationCode}
                                                        onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                            <Mail size={18} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="email"
                                                placeholder="Correo invitado"
                                                value={player2.email}
                                                onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                            />
                                        </div>

                                        <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.02)' }}>
                                            <HeartHandshake size={18} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="tel"
                                                placeholder="Celular invitado"
                                                value={player2.phone}
                                                onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            <div style={{
                paddingTop: '5px',
                flexShrink: 0,
                padding: '0 25px 15px'
            }}>
                <button
                    onClick={handleRegister}
                    disabled={registering || (isRegistered && !showSuccess)}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '16px',
                        fontSize: '14px',
                        boxShadow: '0 10px 30px rgba(163, 230, 53, 0.15)',
                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                        color: isRegistered ? 'rgba(255,255,255,0.4)' : 'var(--primary)',
                        border: isRegistered ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        borderRadius: '20px',
                        fontWeight: '950',
                        letterSpacing: '1px'
                    }}
                >
                    {registering ? <Loader2 className="animate-spin" size={20} /> :
                        isRegistered ? 'INSCRIPCIÓN COMPLETADA' : 'INSCRIBIRME AHORA'}
                </button>
            </div> 
        </div>
    );
};

export default TournamentRegistration;
