import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Trophy, ShieldCheck, HeartHandshake, CheckCircle2, Loader2, Plus, X, Mail, Users } from 'lucide-react';
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
        handicap: ''
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

            {/* Header Content AREA - Reduced size and more modern */}
            <div style={{ position: 'relative', height: '22vh', flexShrink: 0, overflow: 'hidden' }}>
                <img
                    src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000'}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        opacity: 0.6
                    }}
                    alt={tournament.name}
                />
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(14, 47, 31, 0.4) 0%, var(--primary) 100%)',
                    backdropFilter: 'blur(2px)'
                }} />

                <div style={{ position: 'absolute', bottom: '25px', left: '25px', right: '25px' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(163, 230, 53, 0.2)',
                        padding: '6px 12px',
                        borderRadius: '12px',
                        color: 'var(--secondary)',
                        fontSize: '12px',
                        fontWeight: '800',
                        marginBottom: '10px',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(163, 230, 53, 0.3)'
                    }}>
                        <Trophy size={14} /> TORNEO OFICIAL
                    </div>
                    <h1 style={{ fontSize: '30px', fontWeight: '950', color: 'white', letterSpacing: '-1.5px', marginBottom: '4px', lineHeight: '0.9' }}>
                        {tournament.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255,255,255,0.6)', fontWeight: '600', fontSize: '13px' }}>
                        <MapPin size={14} /> {tournament.club}
                    </div>
                </div>
            </div>

            <div style={{
                padding: '5px 25px 20px',
                position: 'relative',
                zIndex: 10,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto',
                background: 'transparent'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', paddingBottom: '30px' }}>

                    {/* TOURNAMENT INFORMATION SECTION - NOW AT THE TOP */}
                    <div className="animate-fade-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '4px', height: '20px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>INFORMACIÓN DEL TORNEO</h3>
                        </div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '12px',
                            marginBottom: '25px'
                        }}>
                            <div className="glass" style={{
                                padding: '15px 10px',
                                borderRadius: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Calendar size={14} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>FECHA</span>
                                    <div style={{ color: 'white', fontSize: '12px', fontWeight: '950' }}>
                                        {new Date(tournament.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{
                                padding: '15px 10px',
                                borderRadius: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(163, 230, 53, 0.05)',
                                border: '1px solid rgba(163, 230, 53, 0.1)'
                            }}>
                                <span style={{ color: 'var(--secondary)', fontWeight: '950', fontSize: '14px' }}>$</span>
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>VALOR</span>
                                    <div style={{ color: 'var(--secondary)', fontSize: '12px', fontWeight: '950' }}>
                                        {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{
                                padding: '15px 10px',
                                borderRadius: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Trophy size={14} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>MODO</span>
                                    <div style={{ color: 'white', fontSize: '11px', fontWeight: '950', textTransform: 'uppercase' }}>
                                        {tournament.game_mode?.split(' ')[0]}
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{
                                padding: '15px 10px',
                                borderRadius: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Users size={14} color="var(--secondary)" />
                                <div style={{ textAlign: 'center' }}>
                                    <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: '900', letterSpacing: '1px', display: 'block' }}>INSCRITOS</span>
                                    <div style={{ color: 'white', fontSize: '12px', fontWeight: '950' }}>
                                        {((tournament as any).registrations?.[0]?.count || 0)} PERSONAS
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '25px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '900', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <ShieldCheck size={16} color="var(--secondary)" /> DETALLES DEL EVENTO
                            </h4>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: '1.6', fontWeight: '500' }}>
                                {tournament.description || 'Disfruta de una jornada única de golf diseñada para los amantes del deporte y la comunidad APEG.'}
                            </p>
                        </div>

                        {tournament.custom_rules && (
                            <div style={{ padding: '0 5px' }}>
                                <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <HeartHandshake size={16} color="var(--secondary)" /> REGLAMENTO
                                </h4>
                                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                    {tournament.custom_rules}
                                </p>
                            </div>
                        )}
                    </div>

                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '10px 0' }} />

                    {/* INSCRIPCIÓN SECTION - NOW BELOW INFO */}
                    <div className="animate-fade-up">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                            <div style={{ width: '4px', height: '20px', background: 'var(--secondary)', borderRadius: '10px' }} />
                            <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'white', letterSpacing: '1px', margin: 0 }}>DATOS DE INSCRIPCIÓN</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                            {/* Player 1 Information */}
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

                        {/* Guest Toggle */}
                        <div
                            onClick={() => setAddGuest(!addGuest)}
                            style={{
                                marginTop: '30px',
                                padding: '18px',
                                borderRadius: '20px',
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
                                    style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '20px', overflow: 'hidden' }}
                                >
                                    <h2 style={{ fontSize: '16px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>DATOS DEL INVITADO</h2>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                        <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)' }}>
                                            <Trophy size={18} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="text"
                                                placeholder="Nombre completo invitado"
                                                value={player2.name}
                                                onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '15px', width: '100%', outline: 'none' }}
                                            />
                                        </div>
                                        <div className="glass" style={{ padding: '16px 20px', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.04)' }}>
                                            <Mail size={18} color="rgba(255,255,255,0.3)" />
                                            <input
                                                type="email"
                                                placeholder="Correo invitado"
                                                value={player2.email}
                                                onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
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
                paddingTop: '10px',
                backgroundColor: 'transparent',
                flexShrink: 0
            }}>
                <button
                    onClick={handleRegister}
                    disabled={registering || (isRegistered && !showSuccess)}
                    className="btn-primary"
                    style={{
                        width: '100%',
                        padding: '22px',
                        fontSize: '16px',
                        height: 'auto',
                        boxShadow: '0 15px 40px rgba(163, 230, 53, 0.2)',
                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                        color: isRegistered ? 'var(--text-dim)' : 'var(--primary)',
                        border: isRegistered ? '1px solid rgba(255,255,255,0.1)' : 'none',
                        borderRadius: '24px',
                        fontWeight: '950',
                        letterSpacing: '1px'
                    }}
                >
                    {registering ? <Loader2 className="animate-spin" size={24} /> :
                        isRegistered ? 'INSCRIPCIÓN COMPLETADA' : 'INSCRIBIRME AHORA'}
                </button>
            </div>
        </div>
    );
};

export default TournamentRegistration;
