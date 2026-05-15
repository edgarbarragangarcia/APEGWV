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
                const isCompanion = player2.type === 'companion';
                registrations.push({
                    tournament_id: tournament.id,
                    user_id: user?.id || null, // Same user_id to link companion to player
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
        <div className="animate-fade golf-premium-bg" style={{
            height: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            width: '100%',
            maxWidth: '1200px',
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

            {/* Header Content AREA - Reduced for Single Page Feel */}
            <div style={{ position: 'relative', height: '15vh', flexShrink: 0, overflow: 'hidden' }}>
                <img
                    src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.5
                    }}
                    alt={tournament.name}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(14, 47, 31, 0.3) 0%, var(--primary) 100%)',
                    backdropFilter: 'blur(1px)'
                }} />

                <div style={{ position: 'absolute', bottom: '15px', left: '25px', right: '25px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(163, 230, 53, 0.15)',
                        padding: '4px 10px',
                        borderRadius: '10px',
                        color: 'var(--secondary)',
                        fontSize: '10px',
                        fontWeight: '800',
                        marginBottom: '8px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(163, 230, 53, 0.2)'
                    }}>
                        <Trophy size={12} /> TORNEO OFICIAL
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: '950', color: 'white', letterSpacing: '-1px', marginBottom: '2px', lineHeight: '1' }}>
                        {tournament.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>
                        <MapPin size={12} color="var(--secondary)" />
                        {tournament.club}
                    </div>
                </div>
            </div>

            <div style={{
                flex: 1,
                overflowY: addGuest ? 'auto' : 'hidden', // Only scroll if adding guest
                padding: '15px 25px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px'
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '30px' }}>
                    <div className="animate-fade-right">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <div style={{ width: '4px', height: '16px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>INFORMACIÓN DEL TORNEO</h3>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                            <div className="glass" style={{
                                padding: '10px',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Calendar size={12} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>FECHA</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '11px', fontWeight: '950' }}>
                                        {(() => {
                                            const d = new Date(tournament.date);
                                            d.setMinutes(d.getMinutes() + d.getTimezoneOffset());
                                            return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                        })()}
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{
                                padding: '10px',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(163, 230, 53, 0.03)',
                                border: '1px solid rgba(163, 230, 53, 0.1)'
                            }}>
                                <span style={{ color: 'var(--secondary)', fontWeight: '950', fontSize: '12px' }}>$</span>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>VALOR</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '11px', fontWeight: '950' }}>
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{
                                padding: '10px',
                                borderRadius: '16px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                gridColumn: 'span 2'
                            }}>
                                <Trophy size={12} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>MODO DE JUEGO</span>
                                    <div style={{ color: 'white', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase' }}>
                                        {tournament.game_mode || 'Individual Medal Play'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '12px 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'white', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <ShieldCheck size={14} color="var(--secondary)" /> DETALLES DEL EVENTO
                            </h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px', lineHeight: '1.4', fontWeight: '500' }}>
                                {tournament.description || 'Disfruta de una jornada única de golf diseñada para los amantes del deporte y la comunidad APEG.'}
                            </p>
                        </div>
                        
                        {/* REGLAMENTO SECTION - Compact */}
                        {(tournament.rules?.length || tournament.custom_rules) && (
                            <div className="glass" style={{ padding: '12px 15px', borderRadius: '20px', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'white', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <ShieldCheck size={14} color="var(--secondary)" /> REGLAMENTO Y CONDICIONES
                                </h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {tournament.rules?.slice(0, 3).map((rule: string, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', color: 'rgba(255,255,255,0.5)', fontSize: '10px', lineHeight: '1.3' }}>
                                            <CheckCircle2 size={12} color="var(--secondary)" style={{ marginTop: '1px', flexShrink: 0 }} />
                                            {rule}
                                        </div>
                                    ))}
                                    {tournament.custom_rules && (
                                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '10px', lineHeight: '1.4', whiteSpace: 'pre-wrap' }}>
                                            {tournament.custom_rules}
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* SPONSORS SECTION - More compact */}
                        {tournament.sponsors && (
                            <div style={{ marginBottom: '15px' }}>
                                <h4 style={{ fontSize: '8px', fontWeight: '900', color: 'rgba(255,255,255,0.2)', marginBottom: '8px', textAlign: 'center', letterSpacing: '1.5px' }}>
                                    PATROCINADO POR
                                </h4>
                                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', opacity: 0.5 }}>
                                    {tournament.sponsors.split('\n').filter(Boolean).map((sponsor: string, idx: number) => (
                                        <span key={idx} style={{ color: 'white', fontSize: '11px', fontWeight: '950', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                            {sponsor}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* INSCRIPCIÓN SECTION - Now BELOW INFO */}
                    <div className="animate-fade-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <div style={{ width: '4px', height: '16px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '12px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>DATOS DE INSCRIPCIÓN</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* Player 1 Information */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '8px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '12px', letterSpacing: '1.5px', textTransform: 'uppercase' }}>Nombre del Jugador</label>
                                <div className="glass" style={{
                                    padding: '12px 18px',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    background: 'rgba(255,255,255,0.04)',
                                    backdropFilter: 'blur(10px)'
                                }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
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

                            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: '15px' }}>
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

                        {/* Guest Toggle - More compact */}
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
                                    style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}
                                >
                                    <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '5px' }}>DATOS DEL INVITADO</h2>
                                    
                                    {/* Selector de Tipo de Invitado */}
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setPlayer2({ ...player2, type: 'player' })}
                                            style={{
                                                flex: 1,
                                                padding: '12px',
                                                borderRadius: '15px',
                                                background: player2.type === 'player' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.02)',
                                                border: `1px solid ${player2.type === 'player' ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'}`,
                                                color: player2.type === 'player' ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                                fontSize: '12px',
                                                fontWeight: '800',
                                                transition: 'all 0.3s ease'
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
                                                fontWeight: '800',
                                                transition: 'all 0.3s ease'
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
                    </div>
                </div>
            </div>

            <div style={{
                paddingTop: '5px',
                backgroundColor: 'transparent',
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
                        height: 'auto',
                        boxShadow: '0 10px 30px rgba(163, 230, 53, 0.15)',
                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                        color: isRegistered ? 'var(--text-dim)' : 'var(--primary)',
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
