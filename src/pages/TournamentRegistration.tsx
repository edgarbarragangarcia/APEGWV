import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, Trophy, ShieldCheck, HeartHandshake, CheckCircle2, Loader2, Phone, Mail, User, Hash, Target, Plus, X } from 'lucide-react';
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

            // Check if user is already registered
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
        if (!user) {
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/auth');
            return;
        }

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
                    user_id: user.id,
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
                    user_id: user.id,
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

            {!showRegisterForm && (
                <div style={{ position: 'relative', height: '30vh', flexShrink: 0, overflow: 'hidden' }}>
                    <img
                        src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt={tournament.name}
                    />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom, transparent 40%, var(--primary) 100%)'
                    }} />
                </div>
            )}

            <div style={{
                padding: showRegisterForm ? '30px 25px 20px 25px' : '0 25px 20px 25px',
                marginTop: showRegisterForm ? '0' : '-40px',
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
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <User size={20} color="var(--secondary)" />
                                Datos del Jugador
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <User size={18} color="rgba(255,255,255,0.4)" />
                                    <input
                                        type="text"
                                        placeholder="Nombre y Apellidos"
                                        value={player1.name}
                                        onChange={(e) => setPlayer1({ ...player1, name: e.target.value })}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Mail size={18} color="rgba(255,255,255,0.4)" />
                                    <input
                                        type="email"
                                        placeholder="Correo Electrónico"
                                        value={player1.email}
                                        onChange={(e) => setPlayer1({ ...player1, email: e.target.value })}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <Phone size={18} color="rgba(255,255,255,0.4)" />
                                    <input
                                        type="tel"
                                        placeholder="Teléfono"
                                        value={player1.phone}
                                        onChange={(e) => setPlayer1({ ...player1, phone: e.target.value })}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Hash size={18} color="rgba(255,255,255,0.4)" />
                                        <input
                                            type="text"
                                            placeholder="Cód. Fed"
                                            value={player1.federationCode}
                                            onChange={(e) => setPlayer1({ ...player1, federationCode: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                        />
                                    </div>
                                    <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Target size={18} color="rgba(255,255,255,0.4)" />
                                        <input
                                            type="number"
                                            placeholder="Handicap"
                                            value={player1.handicap}
                                            onChange={(e) => setPlayer1({ ...player1, handicap: e.target.value })}
                                            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setAddGuest(!addGuest)}
                                style={{
                                    marginTop: '25px',
                                    padding: '15px',
                                    borderRadius: '15px',
                                    border: '1px dashed rgba(163, 230, 53, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    color: 'var(--secondary)',
                                    cursor: 'pointer',
                                    background: addGuest ? 'rgba(163, 230, 53, 0.05)' : 'transparent'
                                }}
                            >
                                {addGuest ? <X size={18} /> : <Plus size={18} />}
                                <span style={{ fontSize: '14px', fontWeight: '700' }}>
                                    {addGuest ? 'Quitar invitado' : 'Inscribir a otra persona'}
                                </span>
                            </div>

                            <AnimatePresence>
                                {addGuest && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflow: 'hidden' }}
                                    >
                                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <Users size={20} color="var(--secondary)" />
                                            Datos del Invitado
                                        </h2>

                                        <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <User size={18} color="rgba(255,255,255,0.4)" />
                                            <input
                                                type="text"
                                                placeholder="Nombre y Apellidos"
                                                value={player2.name}
                                                onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Mail size={18} color="rgba(255,255,255,0.4)" />
                                            <input
                                                type="email"
                                                placeholder="Correo Electrónico"
                                                value={player2.email}
                                                onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Phone size={18} color="rgba(255,255,255,0.4)" />
                                            <input
                                                type="tel"
                                                placeholder="Teléfono"
                                                value={player2.phone}
                                                onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                            <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Hash size={18} color="rgba(255,255,255,0.4)" />
                                                <input
                                                    type="text"
                                                    placeholder="Cód. Fed"
                                                    value={player2.federationCode}
                                                    onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
                                                />
                                            </div>
                                            <div className="glass" style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <Target size={18} color="rgba(255,255,255,0.4)" />
                                                <input
                                                    type="number"
                                                    placeholder="Handicap"
                                                    value={player2.handicap}
                                                    onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })}
                                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '14px', width: '100%', outline: 'none' }}
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
                                gap: '10px',
                                marginBottom: '25px'
                            }}>
                                <div className="glass" style={{ padding: '12px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>FECHA</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '12px', fontWeight: '900' }}>
                                        <Calendar size={12} color="var(--secondary)" />
                                        {new Date(tournament.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                                <div className="glass" style={{ padding: '12px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>VALOR</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '950' }}>
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                    </div>
                                </div>
                                <div className="glass" style={{ padding: '12px', borderRadius: '15px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>MODO</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'white', fontSize: '12px', fontWeight: '900' }}>
                                        <Trophy size={12} color="var(--secondary)" />
                                        {tournament.game_mode}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginBottom: '30px' }}>
                                <h3 style={{ fontSize: '16px', fontWeight: '900', color: 'white', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '28px', height: '28px', background: 'rgba(163, 230, 53, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ShieldCheck size={16} color="var(--secondary)" />
                                    </div>
                                    Información del Evento
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.6' }}>
                                    {tournament.description || 'Sin descripción disponible.'}
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
                            isRegistered ? 'YA ESTÁS INSCRITO' :
                                showRegisterForm ? 'CONFIRMAR INSCRIPCIÓN' : 'INSCRIBIRME AHORA'}
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
                    {!user && (
                        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '10px', fontWeight: '600' }}>
                            Requiere inicio de sesión para completar la inscripción
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentRegistration;
