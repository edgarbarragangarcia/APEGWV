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
    rules?: string[];
    custom_rules?: string | null;
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
    const [showRegisterForm, setShowRegisterForm] = useState(false);

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
        handicap: ''
    });
    const [addGuest, setAddGuest] = useState(false);

    const fetchData = async () => {
        if (!id) return;
        setLoading(true);
        try {
            // Fetch tournament details
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

            // Check if user is already registered (if logged in)
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
            console.error('Error fetching tournament:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [id, user]);

    const handleRegister = async () => {
        if (isRegistered || !tournament) return;
        if (!showRegisterForm) {
            setShowRegisterForm(true);
            return;
        }

        // Validation
        if (!player1.name || !player1.email) {
            alert('Por favor completa los campos del jugador principal.');
            return;
        }

        setRegistering(true);
        try {
            const registrations = [
                {
                    tournament_id: tournament.id,
                    user_id: user?.id || null, // Allow null for non-logged in users
                    registration_status: 'registered',
                    player_name: player1.name,
                    player_email: player1.email,
                    player_phone: player1.phone,
                    player_federation_code: player1.federationCode,
                    player_handicap: player1.handicap ? parseFloat(player1.handicap) : null
                }
            ];

            if (addGuest && player2.name) {
                registrations.push({
                    tournament_id: tournament.id,
                    user_id: user?.id || null,
                    registration_status: 'registered',
                    player_name: player2.name,
                    player_email: player2.email,
                    player_phone: player2.phone,
                    player_federation_code: player2.federationCode,
                    player_handicap: player2.handicap ? parseFloat(player2.handicap) : null
                });
            }

            const { error } = await supabase
                .from('tournament_registrations')
                .insert(registrations);

            if (error) throw error;

            setIsRegistered(true);
            setShowSuccess(true);
            setShowRegisterForm(false);
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } catch (err) {
            console.error('Error registering:', err);
            alert('Hubo un error al procesar tu inscripción. Por favor intenta de nuevo.');
        } finally {
            setRegistering(false);
        }
    };

    if (loading) {
        return (
            <div className="animate-fade" style={{ background: 'var(--primary)', minHeight: '100dvh', padding: '20px' }}>
                <Skeleton height="200px" borderRadius="30px" style={{ marginBottom: '20px' }} />
                <Skeleton width="60%" height="30px" style={{ marginBottom: '10px' }} />
                <Skeleton width="40%" height="20px" style={{ marginBottom: '20px' }} />
                <Skeleton height="100px" borderRadius="20px" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
                <h2>Torneo no encontrado</h2>
                <button onClick={() => navigate('/')} className="btn-primary" style={{ marginTop: '20px' }}>Ir al Inicio</button>
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{
            background: 'var(--primary)',
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '600px',
            margin: '0 auto',
            position: 'relative',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            boxShadow: '0 0 50px rgba(0,0,0,0.3)'
        }}>
            {/* Success Modal */}
            <AnimatePresence>
                {showSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 2000,
                            background: 'rgba(0,0,0,0.85)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            style={{
                                background: 'linear-gradient(135deg, #123B2A 0%, #062e24 100%)',
                                padding: '40px 30px',
                                borderRadius: '40px',
                                width: '100%',
                                maxWidth: '400px',
                                textAlign: 'center',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{
                                width: '100px', height: '100px',
                                background: 'rgba(163, 230, 53, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 25px',
                                border: '2px solid var(--secondary)'
                            }}>
                                <CheckCircle2 size={50} color="var(--secondary)" />
                            </div>
                            <h2 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '15px' }}>¡Inscripción Exitosa!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '15px', lineHeight: '1.6', marginBottom: '30px' }}>
                                Gracias por inscribirte en <strong>{tournament.name}</strong>. Te esperamos en el campo.
                            </p>
                            <button
                                onClick={() => setShowSuccess(false)}
                                className="btn-primary"
                                style={{ width: '100%' }}
                            >
                                CONTINUAR
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Content AREA */}
            <div style={{ position: 'relative', height: showRegisterForm ? '80px' : '38vh', flexShrink: 0, transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)', overflow: 'hidden' }}>
                <img
                    src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: showRegisterForm ? 0.2 : 0.8,
                        transform: showRegisterForm ? 'scale(1.1) translateY(-20px)' : 'scale(1)',
                        transition: 'all 0.6s ease'
                    }}
                    alt={tournament.name}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: showRegisterForm
                        ? 'linear-gradient(to bottom, #062e24 0%, #0E2F1F 100%)'
                        : 'linear-gradient(to bottom, transparent 30%, rgba(14, 47, 31, 0.7) 60%, var(--primary) 100%)'
                }} />

                <AnimatePresence>
                    {!showRegisterForm ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            style={{ position: 'absolute', bottom: '60px', left: '25px', right: '25px' }}
                        >
                            <h1 style={{ fontSize: '36px', fontWeight: '950', color: 'white', letterSpacing: '-1.5px', marginBottom: '8px', lineHeight: '0.9' }}>
                                {tournament.name}
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--secondary)', fontWeight: '800', fontSize: '15px' }}>
                                <div style={{ background: 'rgba(163, 230, 53, 0.2)', padding: '6px 12px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <MapPin size={16} />
                                    {tournament.club}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 25px', background: 'rgba(0,0,0,0.2)', backdropFilter: 'blur(5px)' }}>
                            <h2 style={{ fontSize: '20px', fontWeight: '950', color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '3px', height: '24px', background: 'var(--secondary)', borderRadius: '10px' }} />
                                INSCRIPCIÓN <span style={{ color: 'var(--secondary)', opacity: 0.8 }}>AL EVENTO</span>
                            </h2>
                        </div>
                    )}
                </AnimatePresence>
            </div>

            <div style={{
                padding: '0 25px 20px 25px',
                marginTop: showRegisterForm ? '25px' : '-35px',
                position: 'relative',
                zIndex: 10,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
            }}>
                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '15px', paddingRight: '5px' }}>
                    {showRegisterForm ? (
                        <div className="animate-fade-up">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '16px', letterSpacing: '2px', textTransform: 'uppercase' }}>Nombre del Jugador</label>
                                    <div className="glass" style={{
                                        padding: '18px 22px',
                                        borderRadius: '24px',
                                        border: '1px solid rgba(255,255,255,0.08)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        background: 'rgba(255,255,255,0.04)',
                                        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.2)'
                                    }}>
                                        <Trophy size={20} color="var(--secondary)" style={{ opacity: 0.7 }} />
                                        <input
                                            type="text"
                                            placeholder="Nombre completo"
                                            value={player1.name}
                                            onChange={(e) => setPlayer1({ ...player1, name: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginLeft: '16px', letterSpacing: '2px' }}>HÁNDICAP</label>
                                        <div className="glass" style={{ padding: '18px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)' }}>
                                            <ShieldCheck size={20} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="number"
                                                placeholder="0.0"
                                                value={player1.handicap}
                                                onChange={(e) => setPlayer1({ ...player1, handicap: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', fontWeight: '600' }}
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginLeft: '16px', letterSpacing: '2px' }}>FEDERACIÓN</label>
                                        <div className="glass" style={{ padding: '18px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)' }}>
                                            <Calendar size={20} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="text"
                                                placeholder="ID"
                                                value={player1.federationCode}
                                                onChange={(e) => setPlayer1({ ...player1, federationCode: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', fontWeight: '600' }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginLeft: '16px', letterSpacing: '2px' }}>CORREO ELECTRÓNICO</label>
                                    <div className="glass" style={{ padding: '18px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)' }}>
                                        <Mail size={20} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="email"
                                            placeholder="email@ejemplo.com"
                                            value={player1.email}
                                            onChange={(e) => setPlayer1({ ...player1, email: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <label style={{ fontSize: '10px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', marginLeft: '16px', letterSpacing: '2px' }}>CELULAR</label>
                                    <div className="glass" style={{ padding: '18px 22px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.04)' }}>
                                        <HeartHandshake size={20} color="rgba(255,255,255,0.3)" />
                                        <input
                                            type="tel"
                                            placeholder="300 000 0000"
                                            value={player1.phone}
                                            onChange={(e) => setPlayer1({ ...player1, phone: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '16px', width: '100%', outline: 'none', fontWeight: '600' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setAddGuest(!addGuest)}
                                style={{
                                    marginTop: '35px',
                                    padding: '18px',
                                    borderRadius: '18px',
                                    border: '1px dashed rgba(163, 230, 53, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    color: 'var(--secondary)',
                                    cursor: 'pointer',
                                    background: addGuest ? 'rgba(163, 230, 53, 0.05)' : 'transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {addGuest ? <X size={18} /> : <Plus size={18} />}
                                <span style={{ fontSize: '14px', fontWeight: '700', letterSpacing: '0.5px' }}>
                                    {addGuest ? 'QUITAR INVITADO' : 'INSCRIBIR A OTRA PERSONA'}
                                </span>
                            </div>

                            <AnimatePresence>
                                {addGuest && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '22px', overflow: 'hidden' }}
                                    >
                                        <h2 style={{ fontSize: '18px', fontWeight: '900', color: 'white', marginBottom: '5px', letterSpacing: '0.5px' }}>DATOS DEL INVITADO</h2>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginLeft: '4px', letterSpacing: '0.8px' }}>NOMBRE COMPLETO</label>
                                            <div className="glass" style={{ padding: '12px 16px', borderRadius: '18px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                                <Trophy size={18} color="rgba(255,255,255,0.3)" />
                                                <input
                                                    type="text"
                                                    placeholder="Nombre del invitado"
                                                    value={player2.name}
                                                    onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: '500' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginLeft: '4px', letterSpacing: '0.8px' }}>HÁNDICAP</label>
                                                <div className="glass" style={{ padding: '12px 16px', borderRadius: '18px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                                    <ShieldCheck size={18} color="rgba(255,255,255,0.3)" />
                                                    <input
                                                        type="number"
                                                        placeholder="0.0"
                                                        value={player2.handicap}
                                                        onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: '500' }}
                                                    />
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginLeft: '4px', letterSpacing: '0.8px' }}>FEDERACIÓN</label>
                                                <div className="glass" style={{ padding: '12px 16px', borderRadius: '18px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                                    <Calendar size={18} color="rgba(255,255,255,0.3)" />
                                                    <input
                                                        type="text"
                                                        placeholder="0000"
                                                        value={player2.federationCode}
                                                        onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: '500' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginLeft: '4px', letterSpacing: '0.8px' }}>CORREO ELECTRÓNICO</label>
                                            <div className="glass" style={{ padding: '12px 16px', borderRadius: '18px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                                <Plus size={18} color="rgba(255,255,255,0.3)" style={{ transform: 'rotate(45deg)' }} />
                                                <input
                                                    type="email"
                                                    placeholder="correo@invitado.com"
                                                    value={player2.email}
                                                    onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: '500' }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: '800', color: 'rgba(255,255,255,0.5)', marginLeft: '4px', letterSpacing: '0.8px' }}>TELÉFONO CELULAR</label>
                                            <div className="glass" style={{ padding: '12px 16px', borderRadius: '18px', border: '1px solid rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)' }}>
                                                <HeartHandshake size={18} color="rgba(255,255,255,0.3)" />
                                                <input
                                                    type="tel"
                                                    placeholder="300 000 0000"
                                                    value={player2.phone}
                                                    onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none', fontWeight: '500' }}
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div style={{ flex: 1 }}>
                                    <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'white', letterSpacing: '-0.5px', marginBottom: '8px' }}>
                                        {tournament.name}
                                    </h1>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontWeight: '700', fontSize: '14px' }}>
                                        <MapPin size={16} />
                                        {tournament.club}
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: '12px',
                                marginBottom: '35px'
                            }}>
                                <div className="glass" style={{
                                    padding: '18px 12px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={16} color="var(--secondary)" />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>FECHA</span>
                                        <div style={{ color: 'white', fontSize: '14px', fontWeight: '950' }}>
                                            {new Date(tournament.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <div className="glass" style={{
                                    padding: '18px 12px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.1) 0%, rgba(163, 230, 53, 0.02) 100%)',
                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span style={{ color: 'var(--primary)', fontWeight: '950', fontSize: '14px' }}>$</span>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>VALOR</span>
                                        <div style={{ color: 'var(--secondary)', fontSize: '13px', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                        </div>
                                    </div>
                                </div>
                                <div className="glass" style={{
                                    padding: '18px 12px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ width: '30px', height: '30px', borderRadius: '10px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Trophy size={16} color="var(--secondary)" />
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block', marginBottom: '4px' }}>MODO</span>
                                        <div style={{ color: 'white', fontSize: '12px', fontWeight: '950', textTransform: 'uppercase' }}>
                                            {tournament.game_mode?.split(' ')[0]}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass" style={{ padding: '25px', borderRadius: '30px', marginBottom: '30px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h3 style={{ fontSize: '15px', fontWeight: '900', color: 'white', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', background: 'rgba(163, 230, 53, 0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck size={18} color="var(--secondary)" />
                                    </div>
                                    INFORMACIÓN DEL EVENTO
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: '1.7', fontWeight: '500' }}>
                                    {tournament.description || 'Disfruta de una jornada única de golf diseñada para los amantes del deporte y la comunidad APEG.'}
                                </p>
                            </div>

                            {tournament.custom_rules && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '28px', height: '28px', background: 'rgba(163, 230, 53, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <HeartHandshake size={16} color="var(--secondary)" />
                                        </div>
                                        Reglamento
                                    </h3>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                                        {tournament.custom_rules}
                                    </p>
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div style={{
                    paddingBottom: '20px',
                    paddingTop: '10px',
                    backgroundColor: 'var(--primary)',
                    flexShrink: 0
                }}>
                    <button
                        onClick={handleRegister}
                        disabled={registering || (isRegistered && !showSuccess)}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '20px',
                            fontSize: '15px',
                            height: 'auto',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                            background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                            color: isRegistered ? 'var(--text-dim)' : 'var(--primary)',
                            border: isRegistered ? '1px solid rgba(255,255,255,0.1)' : 'none'
                        }}
                    >
                        {registering ? <Loader2 className="animate-spin" size={24} /> :
                            isRegistered ? 'INSCRIPCIÓN COMPLETADA' :
                                showRegisterForm ? 'CONFIRMAR Y FINALIZAR' : 'UNIRME AL TORNEO'}
                    </button>
                    {showRegisterForm && (
                        <button
                            onClick={() => setShowRegisterForm(false)}
                            style={{
                                width: '100%',
                                marginTop: '10px',
                                color: 'rgba(255,255,255,0.4)',
                                fontSize: '12px',
                                fontWeight: '600',
                                textDecoration: 'underline'
                            }}
                        >
                            VOLVER A INFORMACIÓN
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentRegistration;
