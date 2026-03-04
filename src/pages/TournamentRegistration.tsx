import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, MapPin, Trophy, ShieldCheck, HeartHandshake, CheckCircle2, Loader2 } from 'lucide-react';
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
    const [participantsCount, setParticipantsCount] = useState(0);

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
            setParticipantsCount(tData.registrations?.[0]?.count || 0);

            // Check if user is already registered
            if (user) {
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
            // Store redirect intended for after login
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname);
            navigate('/auth');
            return;
        }

        if (isRegistered || !tournament) return;

        setRegistering(true);
        try {
            const { error } = await supabase
                .from('tournament_registrations')
                .insert([{
                    tournament_id: tournament.id,
                    user_id: user.id,
                    registration_status: 'registered'
                }]);

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
        <div className="animate-fade" style={{
            background: 'var(--primary)',
            minHeight: '100dvh',
            display: 'flex',
            flexDirection: 'column',
            overflowX: 'hidden',
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

            <div style={{ position: 'relative', height: '300px', overflow: 'hidden' }}>
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

            <div style={{ padding: '0 25px 50px 25px', marginTop: '-40px', position: 'relative', zIndex: 10 }}>
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
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '12px',
                    marginBottom: '25px'
                }}>
                    <div className="glass" style={{ padding: '15px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>FECHA</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '13px', fontWeight: '900' }}>
                            <Calendar size={14} color="var(--secondary)" />
                            {new Date(tournament.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'long' })}
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '15px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>VALOR</span>
                        <div style={{ color: 'var(--secondary)', fontSize: '13px', fontWeight: '950' }}>
                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '15px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>MODO</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '13px', fontWeight: '900' }}>
                            <Trophy size={14} color="var(--secondary)" />
                            {tournament.game_mode}
                        </div>
                    </div>
                    <div className="glass" style={{ padding: '15px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '800' }}>CUPOS</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'white', fontSize: '13px', fontWeight: '900' }}>
                            <Users size={14} color="var(--secondary)" />
                            {participantsCount} / {tournament.participants_limit || '--'}
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

                <div style={{
                    position: 'sticky',
                    bottom: '20px',
                    marginTop: '40px'
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
                            isRegistered ? 'YA ESTÁS INSCRITO' : 'INSCRIBIRME AHORA'}
                    </button>
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
