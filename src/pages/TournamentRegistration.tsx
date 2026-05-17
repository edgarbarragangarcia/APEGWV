import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, MapPin, Trophy, ShieldCheck, HeartHandshake, 
    CheckCircle2, Loader2, Plus, X, Mail, BookOpen, 
    Star, Users, Flag, Copy, Check
} from 'lucide-react';
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
    const { idOrSlug } = useParams<{ idOrSlug: string }>();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState<Tournament | null>(null);
    const [registering, setRegistering] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isRegistered, setIsRegistered] = useState(false);
    const [addGuest, setAddGuest] = useState(false);
    const [activeTab, setActiveTab] = useState<'rules' | 'notes' | 'info'>('info');
    const [isFlipped, setIsFlipped] = useState(false);
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

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
        if (!idOrSlug) return;
        setLoading(true);
        try {
            // Check if idOrSlug is a valid UUID
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
            
            let query = supabase
                .from('tournaments')
                .select(`
                    *,
                    registrations: tournament_registrations(count)
                `);

            if (isUUID) {
                query = query.eq('id', idOrSlug);
            } else {
                query = query.eq('slug', idOrSlug);
            }

            const { data: tData, error: tError } = await query.single();

            if (tError) throw tError;
            setTournament(tData);

            const tourneyId = tData.id;

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
                    .eq('tournament_id', tourneyId)
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
    }, [idOrSlug, user]);

    const paymentMethods = (() => {
        if (!tournament?.notes) return [];
        const jsonMatch = tournament.notes.match(/---PAYMENTS_JSON---\n([\s\S]*?)(?:\n\n|$)/);
        if (jsonMatch) {
            try { 
                const parsed = JSON.parse(jsonMatch[1]);
                return parsed.map((p: any) => {
                    let label = p.method === 'Llave BreB' ? 'LLAVE BREB' : 
                                p.method === 'Nequi' ? 'CELULAR NEQUI' : 
                                (p.method === 'Daviplata' || p.method === 'DaviPlata') ? 'CELULAR DAVIPLATA' : 
                                p.method === 'Bancolombia' ? 'CUENTA BANCARIA BANCOLOMBIA' :
                                p.method === 'Cuenta de Ahorros' ? 'CUENTA DE AHORROS' :
                                p.method === 'Cuenta Corriente' ? 'CUENTA CORRIENTE' :
                                p.method === 'Cuenta Bancaria' ? 'CUENTA BANCARIA' : 'CUENTA';
                    
                    if (p.bankName) label = `${label} ${p.bankName}`.toUpperCase();
                    if (p.accountType) label = `${label} (${p.accountType})`.toUpperCase();

                    return {
                        method: p.method,
                        account: p.account,
                        label
                    };
                });
            } catch(e) { console.error("JSON parse error", e); }
        }
        // Fallback to legacy
        const matchMethod = tournament.notes.match(/METHOD:(.*?)(?:\n|$)/);
        const matchPhone = tournament.notes.match(/PHONE:(.*?)(?:\n|$)/);
        const matchKey = tournament.notes.match(/KEY:(.*?)(?:\n|$)/);
        if (!matchMethod && !matchPhone && !matchKey) return [];
        const method = matchMethod ? matchMethod[1].trim() : 'Nequi';
        const account = (matchPhone ? matchPhone[1].trim() : '') || (matchKey ? matchKey[1].trim() : '');
        return [{
            method,
            account,
            label: method === 'Llave BreB' ? 'LLAVE BREB' : method === 'Nequi' ? 'CELULAR NEQUI' : 'CUENTA'
        }];
    })();

    const handleRegister = async () => {
        if (isRegistered || !tournament) return;
        const validatePlayer = (player: typeof player1, roleLabel: string, isCompanion: boolean = false) => {
            // 1. Name & Surname check
            const name = player.name.trim();
            if (!name) {
                return `El nombre del ${roleLabel} es obligatorio.`;
            }
            const nameParts = name.split(/\s+/).filter(Boolean);
            if (nameParts.length < 2) {
                return `El nombre del ${roleLabel} debe incluir al menos Nombre y Apellido (ej. Edgar Barragan).`;
            }
            if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(name)) {
                return `El nombre del ${roleLabel} solo debe contener letras y espacios.`;
            }

            // 2. Email check
            const email = player.email.trim();
            if (!email) {
                return `El correo electrónico del ${roleLabel} es obligatorio.`;
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return `El correo electrónico del ${roleLabel} no es válido. Debe contener '@' y un dominio válido (ej. usuario@dominio.com).`;
            }

            // 3. Phone check (Exactly 10 digits)
            const phone = player.phone.trim();
            if (!phone) {
                return `El teléfono del ${roleLabel} es obligatorio.`;
            }
            if (!/^\d{10}$/.test(phone)) {
                return `El teléfono del ${roleLabel} debe tener exactamente 10 dígitos numéricos en Colombia (ej. 3123456789).`;
            }

            // 4. Golf-specific fields (Federation Code & Handicap) - skip if companion
            if (!isCompanion) {
                const handicap = player.handicap.trim();
                if (!handicap) {
                    return `El hándicap del ${roleLabel} es obligatorio.`;
                }
                const sanitizedHandicap = handicap.replace(',', '.');
                if (isNaN(Number(sanitizedHandicap))) {
                    return `El hándicap del ${roleLabel} debe ser un valor numérico (ej. 11 o 11.5).`;
                }

                const federationCode = player.federationCode.trim();
                if (!federationCode) {
                    return `El ID de federación del ${roleLabel} es obligatorio.`;
                }
                if (!/^\d+$/.test(federationCode)) {
                    return `El ID de federación del ${roleLabel} debe contener únicamente números.`;
                }
            }

            return null;
        };

        // Validate player 1 (Primary Player)
        const error1 = validatePlayer(player1, "Jugador Principal", false);
        if (error1) {
            alert(error1);
            return;
        }

        // Validate player 2 (Guest, if added)
        if (addGuest) {
            const isCompanion = player2.type === 'companion';
            const error2 = validatePlayer(
                player2 as any, 
                isCompanion ? "Invitado (Acompañante)" : "Invitado (Jugador)", 
                isCompanion
            );
            if (error2) {
                alert(error2);
                return;
            }
        }

        setRegistering(true);
        try {
            const registrations = [
                {
                    tournament_id: tournament.id,
                    user_id: user?.id || null, 
                    registration_status: 'registered',
                    player_name: player1.name.trim(),
                    player_email: player1.email.trim(),
                    player_phone: player1.phone.trim(),
                    player_federation_code: player1.federationCode.trim(),
                    player_handicap: player1.handicap ? parseFloat(player1.handicap.trim().replace(',', '.')) : null
                }
            ];

            if (addGuest && player2.name) {
                const isCompanion = player2.type === 'companion';
                registrations.push({
                    tournament_id: tournament.id,
                    user_id: user?.id || null,
                    registration_status: 'registered',
                    player_name: player2.name.trim(),
                    player_email: player2.email.trim(),
                    player_phone: player2.phone.trim(),
                    player_federation_code: isCompanion ? `ACOMP:${player1.name.trim()}` : player2.federationCode.trim(),
                    player_handicap: isCompanion ? null : (player2.handicap ? parseFloat(player2.handicap.trim().replace(',', '.')) : null)
                });
            }

            const { error } = await supabase
                .from('tournament_registrations')
                .insert(registrations);

            if (error) throw error;
            setIsRegistered(true);
            setShowSuccess(true);
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } catch (err: any) {
            console.error('Error registering:', err);
            const msg = err.message || 'Error desconocido';
            alert(`Hubo un error al procesar tu inscripción: ${msg}`);
        } finally {
            setRegistering(false);
        }
    };

    if (loading || !tournament) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--primary)', padding: '20px' }}>
                <Skeleton width="100%" height="240px" borderRadius="30px" style={{ marginBottom: '25px' }} />
                <Skeleton width="60%" height="40px" style={{ marginBottom: '15px' }} />
                <Skeleton width="40%" height="20px" style={{ marginBottom: '40px' }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <Skeleton height="100px" borderRadius="20px" />
                    <Skeleton height="100px" borderRadius="20px" />
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'var(--primary)',
            color: 'white',
            maxWidth: '1200px',
            margin: '0 auto',
            minHeight: '100vh',
            position: 'relative'
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
                            zIndex: 1000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px',
                            background: 'rgba(0,0,0,0.9)',
                            backdropFilter: 'blur(15px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.8, y: 50, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            style={{
                                background: 'linear-gradient(135deg, #152c1e, #0a0f0d)',
                                padding: '50px 30px',
                                borderRadius: '40px',
                                border: '1px solid rgba(163, 230, 53, 0.3)',
                                textAlign: 'center',
                                maxWidth: '450px',
                                width: '100%',
                                boxShadow: '0 25px 50px rgba(0,0,0,0.5), 0 0 30px rgba(163, 230, 53, 0.1)'
                            }}
                        >
                            <div style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                background: 'rgba(163, 230, 53, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 30px',
                                color: 'var(--secondary)',
                                border: '2px solid rgba(163, 230, 53, 0.2)'
                            }}>
                                <Trophy size={50} />
                            </div>
                            <h2 style={{ fontSize: '32px', fontWeight: '950', color: 'white', marginBottom: '15px', letterSpacing: '-1px' }}>¡FELICIDADES!</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.7', marginBottom: '40px', fontSize: '16px' }}>
                                Has quedado inscrito oficialmente en el <strong>{tournament.name}</strong>. ¡Nos vemos en el campo!
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <button
                                    onClick={() => {
                                        // Reset fields
                                        setPlayer1({
                                            name: '',
                                            email: '',
                                            phone: '',
                                            federationCode: '',
                                            handicap: ''
                                        });
                                        setPlayer2({
                                            name: '',
                                            email: '',
                                            phone: '',
                                            federationCode: '',
                                            handicap: '',
                                            type: 'player'
                                        });
                                        setAddGuest(false);
                                        setIsFlipped(false);
                                        setIsRegistered(false);
                                        setShowSuccess(false);
                                        
                                        // Fetch profile data again to re-populate the main logged-in player
                                        fetchData();

                                        // Scroll to top of the page/form
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className="btn-primary"
                                    style={{ width: '100%', padding: '18px', borderRadius: '25px', fontWeight: '950', fontSize: '15px', letterSpacing: '1px' }}
                                >
                                    NUEVO REGISTRO
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Page Flip Wrapper on Mobile */}
            <div style={{ perspective: isMobile ? '1500px' : 'none' }}>
                <motion.div
                    animate={isMobile ? { rotateY: isFlipped ? 180 : 0 } : {}}
                    transition={{ duration: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
                    style={{ 
                        position: 'relative', 
                        transformStyle: isMobile ? 'preserve-3d' : 'flat',
                        WebkitTransformStyle: isMobile ? 'preserve-3d' : 'flat'
                    }}
                >
                    {/* FRONT SIDE (Entire Page) */}
                    <div style={{ 
                        backfaceVisibility: 'hidden',
                        WebkitBackfaceVisibility: 'hidden',
                        position: (isMobile && isFlipped) ? 'absolute' : 'relative',
                        top: 0, left: 0, width: '100%',
                        zIndex: (isMobile && isFlipped) ? 0 : 2,
                        pointerEvents: (isMobile && isFlipped) ? 'none' : 'auto',
                        background: 'var(--primary)'
                    }}>
                        {/* Hero Image Container */}
                        <div style={{ 
                            position: 'relative', 
                            height: isMobile ? 'auto' : '40vh', 
                            minHeight: isMobile ? 'auto' : '400px',
                            paddingTop: isMobile ? '50px' : '0',
                            paddingBottom: isMobile ? '35px' : '0',
                            overflow: isMobile ? 'visible' : 'hidden'
                        }}>
                        <img
                            src={tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=2000'}
                            style={{ 
                                position: isMobile ? 'absolute' : 'static',
                                top: 0, left: 0,
                                width: '100%', height: '100%', 
                                objectFit: 'cover',
                                zIndex: 1
                            }}
                            alt=""
                        />
                        <div style={{ 
                            position: 'absolute', 
                            bottom: 0, left: 0, right: 0, top: 0,
                            background: isMobile 
                                ? 'linear-gradient(to bottom, rgba(14,47,31,0.5) 0%, var(--primary) 90%)'
                                : 'linear-gradient(to top, var(--primary) 0%, rgba(14,47,31,0.8) 40%, transparent 100%)',
                            zIndex: 2
                        }} />
                        
                        {/* Float elements for depth */}


                        <div style={{ 
                            position: isMobile ? 'relative' : 'absolute', 
                            bottom: isMobile ? 'auto' : '50px', 
                            left: '0', 
                            width: '100%', 
                            padding: isMobile ? '0 20px' : '0 30px',
                            zIndex: 3
                        }}>
                            <div style={{ opacity: 1 }}>
                                <h1 style={{ 
                                    fontSize: isMobile ? '26px' : '42px', 
                                    fontWeight: '950', 
                                    margin: '0 0 12px 0', 
                                    color: 'white', 
                                    letterSpacing: isMobile ? '-0.5px' : '-1.5px',
                                    lineHeight: '1.2',
                                    textShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                    textAlign: isMobile ? 'center' : 'left'
                                }}>
                                    {tournament.name}
                                </h1>
                                <div style={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap', 
                                    justifyContent: isMobile ? 'center' : 'flex-start',
                                    alignItems: 'center', 
                                    gap: '20px', 
                                    color: 'rgba(255,255,255,0.8)' 
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: isMobile ? 'center' : 'flex-start',
                                        gap: '8px', 
                                        fontSize: isMobile ? '16px' : '18px', 
                                        fontWeight: '600',
                                        width: isMobile ? '100%' : 'auto'
                                    }}>
                                        <MapPin size={20} color="var(--secondary)" /> {tournament.club}
                                    </div>
                                    {!isMobile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                                            <Users size={18} color="var(--secondary)" /> {tournament.current_participants || 0} / {tournament.participants_limit || '∞'} JUGADORES
                                        </div>
                                    )}
                                </div>

                                {isMobile && (
                                    <div style={{ 
                                        margin: '25px auto 0 auto', 
                                        padding: '20px', 
                                        borderRadius: '25px', 
                                        background: 'rgba(255,255,255,0.05)', 
                                        border: '1px solid rgba(255,255,255,0.1)', 
                                        backdropFilter: 'blur(10px)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        width: 'fit-content',
                                        minWidth: '350px',
                                        textAlign: 'center'
                                    }}>
                                        <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', letterSpacing: '1px' }}>VALOR INSCRIPCIÓN</div>
                                        <div style={{ fontSize: '24px', fontWeight: '950', color: 'white' }}>
                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                        </div>
                                        {paymentMethods.length > 0 && (
                                            <div style={{ 
                                                marginTop: '10px', 
                                                paddingTop: '10px', 
                                                borderTop: '1px solid rgba(255,255,255,0.05)',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '12px',
                                                width: '100%',
                                                alignItems: 'center'
                                            }}>
                                                {paymentMethods.map((pm: any, i: number) => {
                                                    const isCopied = copiedId === pm.account;
                                                    return (
                                                        <div 
                                                            key={i} 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopy(pm.account, pm.account);
                                                            }}
                                                            style={{ 
                                                                display: 'flex', 
                                                                flexDirection: 'column', 
                                                                alignItems: 'center', 
                                                                width: '100%',
                                                                cursor: 'pointer',
                                                                padding: '10px 12px',
                                                                borderRadius: '15px',
                                                                background: 'rgba(255, 255, 255, 0.02)',
                                                                border: '1px dashed rgba(255, 255, 255, 0.1)',
                                                                transition: 'all 0.2s ease',
                                                                userSelect: 'none'
                                                            }}
                                                        >
                                                            <div style={{ fontSize: '10px', fontWeight: '950', color: 'rgba(255,255,255,0.5)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                                                {pm.label}
                                                            </div>
                                                            <div style={{ 
                                                                display: 'flex', 
                                                                alignItems: 'center', 
                                                                justifyContent: 'center',
                                                                gap: '8px', 
                                                                marginTop: '2px',
                                                                width: '100%'
                                                            }}>
                                                                <span style={{ fontSize: pm.account.length > 15 ? '12px' : '14px', fontWeight: '900', color: 'white', wordBreak: 'break-all' }}>
                                                                    {pm.account}
                                                                </span>
                                                                {isCopied ? (
                                                                    <Check size={14} color="var(--secondary)" style={{ flexShrink: 0 }} />
                                                                ) : (
                                                                    <Copy size={13} color="rgba(255,255,255,0.4)" style={{ flexShrink: 0 }} />
                                                                )}
                                                            </div>
                                                            
                                                            <AnimatePresence mode="wait">
                                                                {isCopied ? (
                                                                    <motion.div 
                                                                        key="copied"
                                                                        initial={{ opacity: 0, y: 3, scale: 0.95 }}
                                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                        exit={{ opacity: 0, y: -3, scale: 0.95 }}
                                                                        style={{ 
                                                                            fontSize: '9px', 
                                                                            fontWeight: '900', 
                                                                            color: 'var(--secondary)', 
                                                                            marginTop: '4px',
                                                                            letterSpacing: '0.5px' 
                                                                        }}
                                                                    >
                                                                        ¡COPIADO CON ÉXITO!
                                                                    </motion.div>
                                                                ) : (
                                                                    <motion.div 
                                                                        key="copy"
                                                                        initial={{ opacity: 0 }}
                                                                        animate={{ opacity: 1 }}
                                                                        exit={{ opacity: 0 }}
                                                                        style={{ 
                                                                            fontSize: '9px', 
                                                                            fontWeight: '800', 
                                                                            color: 'rgba(255,255,255,0.3)', 
                                                                            marginTop: '4px', 
                                                                            letterSpacing: '0.5px' 
                                                                        }}
                                                                    >
                                                                        TOCA PARA COPIAR
                                                                    </motion.div>
                                                                )}
                                                            </AnimatePresence>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Registration Button - Floating over the edge */}
                        {isMobile && !isFlipped && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8, x: '-50%' }}
                                animate={{ opacity: 1, scale: 1, x: '-50%' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsFlipped(true);
                                }}
                                style={{
                                    position: 'absolute',
                                    bottom: '-25px', // Floating over the edge
                                    left: '50%',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    border: 'none',
                                    padding: '18px 45px',
                                    borderRadius: '25px',
                                    fontWeight: '950',
                                    fontSize: '14px',
                                    letterSpacing: '1px',
                                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 20px rgba(163, 230, 53, 0.2)',
                                    zIndex: 100,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '12px',
                                    width: '80%',
                                    maxWidth: '300px'
                                }}
                            >
                                INSCRIPCIÓN <Trophy size={20} />
                            </motion.button>
                        )}
                    </div> {/* End of Hero Image Container */}


                    <div style={{ padding: isMobile ? '0 30px' : '0 30px', marginTop: isMobile ? '55px' : '-20px', position: 'relative', zIndex: 20 }}>
                        {/* Quick Info Grid */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr', 
                            gap: isMobile ? '15px' : '15px', 
                            marginBottom: isMobile ? '10px' : '40px' 
                        }}>
                            {[
                                { icon: <Calendar />, label: 'FECHA', value: new Date(tournament.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) },
                                { icon: <Flag />, label: 'MODO JUEGO', value: tournament.game_mode || 'Stableford' }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    className="glass"
                                    whileHover={{ 
                                        y: -5, 
                                        boxShadow: '0 20px 45px rgba(0, 0, 0, 0.45), 0 0 20px rgba(163, 230, 53, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.15), inset 0 0 0 1.5px rgba(163, 230, 53, 0.5)',
                                        borderColor: 'rgba(163, 230, 53, 0.6)'
                                    }}
                                    whileTap={{ scale: 0.97 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                                    style={{ 
                                        padding: isMobile ? '24px 20px' : '25px', 
                                        borderRadius: isMobile ? '25px' : '25px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '10px', 
                                        background: 'rgba(255,255,255,0.03)',
                                        border: '1px solid rgba(163, 230, 53, 0.15)',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 12px 35px rgba(0, 0, 0, 0.35), inset 0 1px 1px rgba(255, 255, 255, 0.1), inset 0 0 0 1px rgba(163, 230, 53, 0.05)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div style={{ color: 'var(--secondary)', opacity: 0.9, transform: isMobile ? 'scale(0.9)' : 'none', transformOrigin: 'left center' }}>{item.icon}</div>
                                    <div>
                                        <div style={{ fontSize: isMobile ? '9px' : '9px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>{item.label}</div>
                                        <div style={{ fontSize: isMobile ? '13px' : '14px', fontWeight: '900', color: (item as any).color || 'white', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div style={{ padding: isMobile ? '0px 30px 20px 30px' : '20px 30px', position: 'relative', zIndex: 20 }}>
                        <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '40px' }}>
                            {/* Content Column */}
                            <div style={{ flex: 1.5 }}>
                                {/* Tabs for detailed info */}
                                <div style={{ display: 'flex', gap: '25px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '30px' }}>
                                    {['info', 'rules'].map((tab) => (
                                        <button
                                            key={tab}
                                            onClick={() => setActiveTab(tab as any)}
                                            style={{
                                                padding: '15px 5px',
                                                fontSize: '13px',
                                                fontWeight: '900',
                                                letterSpacing: '1px',
                                                color: activeTab === tab ? 'var(--secondary)' : 'rgba(255,255,255,0.4)',
                                                borderBottom: `3px solid ${activeTab === tab ? 'var(--secondary)' : 'transparent'}`,
                                                transition: 'all 0.3s ease',
                                                textTransform: 'uppercase'
                                            }}
                                        >
                                            {tab === 'info' ? 'DETALLES' : 'REGLAS'}
                                        </button>
                                    ))}
                                </div>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeTab}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 10 }}
                                        transition={{ duration: 0.3 }}
                                        style={{ minHeight: '200px' }}
                                    >
                                        {activeTab === 'info' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                                                <div>
                                                    <p style={{ fontSize: '16px', lineHeight: '1.8', color: 'rgba(255,255,255,0.7)', fontWeight: '400', whiteSpace: 'pre-line' }}>
                                                        {tournament.description || "Únete a este prestigioso torneo donde la competitividad y la camaradería se encuentran en el campo. Una jornada diseñada para los amantes del golf que buscan excelencia en cada golpe."}
                                                    </p>
                                                </div>

                                            </div>
                                        )}

                                        {activeTab === 'rules' && (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                {tournament.rules && tournament.rules.length > 0 ? (
                                                    tournament.rules.map((rule, idx) => (
                                                        <div key={idx} style={{ 
                                                            padding: '18px 25px', borderRadius: '20px', background: 'rgba(255,255,255,0.03)',
                                                            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '15px', alignItems: 'flex-start'
                                                        }}>
                                                            <div style={{ color: 'var(--secondary)', marginTop: '3px' }}><CheckCircle2 size={16} /></div>
                                                            <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '500', whiteSpace: 'pre-line' }}>{rule}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div style={{ padding: '40px', textAlign: 'center', opacity: 0.5 }}>
                                                        <BookOpen size={40} style={{ marginBottom: '15px' }} />
                                                        <p>Reglas locales estándar de la federación.</p>
                                                    </div>
                                                )}
                                                {tournament.custom_rules && (
                                                    <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(163, 230, 53, 0.05)', borderRadius: '20px', border: '1px dashed rgba(163, 230, 53, 0.3)' }}>
                                                        <h5 style={{ color: 'var(--secondary)', marginBottom: '10px', fontSize: '12px' }}>REGLAS ADICIONALES</h5>
                                                        <p style={{ fontSize: '13px', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{tournament.custom_rules}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </motion.div>
                                </AnimatePresence>

                                {/* Sponsors Section */}
                                <div style={{ marginTop: '60px', padding: '40px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                                        <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: '3px' }}>PATROCINADORES OFICIALES</h4>
                                        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.05)' }} />
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '40px', opacity: 0.6 }}>
                                        {[1, 2, 3, 4].map(i => (
                                            <div key={i} style={{ width: '100px', height: '50px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trophy size={20} color="white" style={{ opacity: 0.3 }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Registration Form Column (Desktop Only) */}
                            {!isMobile && (
                                <div style={{ flex: 1.2 }}>
                                    <div style={{ position: 'sticky', top: '30px' }}>
                                        <motion.div
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="glass"
                                            style={{ 
                                                padding: '35px', 
                                                borderRadius: '40px', 
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
                                            }}
                                        >
                                            <div style={{ marginBottom: '30px' }}>
                                                <h3 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '5px' }}>Inscripción</h3>
                                                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Completa tus datos para participar</p>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                {/* Input Fields */}
                                                {[
                                                    { icon: <Users />, label: 'NOMBRE COMPLETO', value: player1.name, field: 'name' },
                                                    { icon: <Mail />, label: 'CORREO ELECTRÓNICO', value: player1.email, field: 'email' },
                                                    { icon: <ShieldCheck />, label: 'HÁNDICAP', value: player1.handicap, field: 'handicap', half: true },
                                                    { icon: <Star />, label: 'ID FEDERACIÓN', value: player1.federationCode, field: 'federationCode', half: true },
                                                    { icon: <HeartHandshake />, label: 'TELÉFONO', value: player1.phone, field: 'phone' }
                                                ].map((input, i) => (
                                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        <label style={{ fontSize: isMobile ? '8px' : '9px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' }}>{input.label}</label>
                                                        <div className="glass" style={{ 
                                                            padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px',
                                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
                                                            transition: 'all 0.3s ease'
                                                        }}>
                                                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>{input.icon}</div>
                                                            <input
                                                                type="text"
                                                                value={input.value}
                                                                onChange={(e) => setPlayer1({ ...player1, [input.field]: e.target.value })}
                                                                placeholder={`Ingresa tu ${input.label.toLowerCase()}`}
                                                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '13px' : '15px', fontWeight: '600' }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}

                                                {/* Add Companion Toggle */}
                                                <div 
                                                    onClick={() => setAddGuest(!addGuest)}
                                                    style={{ 
                                                        marginTop: '10px', padding: '20px', borderRadius: '25px', 
                                                        border: `1px dashed ${addGuest ? 'var(--secondary)' : 'rgba(255,255,255,0.2)'}`,
                                                        textAlign: 'center', cursor: 'pointer', background: addGuest ? 'rgba(163, 230, 53, 0.05)' : 'transparent',
                                                        transition: 'all 0.3s ease'
                                                    }}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: addGuest ? 'var(--secondary)' : 'white' }}>
                                                        {addGuest ? <X size={18} /> : <Plus size={18} />}
                                                        <span style={{ fontSize: '13px', fontWeight: '900' }}>{addGuest ? 'CANCELAR INVITADO' : 'AGREGAR JUGADOR / ACOMPAÑANTE'}</span>
                                                    </div>
                                                </div>

                                                {/* Companion Form */}
                                                <AnimatePresence>
                                                    {addGuest && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            style={{ overflow: 'hidden' }}
                                                        >
                                                            <div style={{ paddingTop: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                                    {['player', 'companion'].map(type => (
                                                                        <button
                                                                            key={type}
                                                                            onClick={() => setPlayer2({ ...player2, type: type as any })}
                                                                            style={{ 
                                                                                flex: 1, padding: '12px', borderRadius: '15px', 
                                                                                background: player2.type === type ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                                color: player2.type === type ? 'var(--primary)' : 'white',
                                                                                fontSize: '11px', fontWeight: '900', textTransform: 'uppercase'
                                                                            }}
                                                                        >
                                                                            {type === 'player' ? 'Jugador' : 'Acompañante'}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                 <div className="glass" style={{ padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Nombre completo"
                                                                        value={player2.name}
                                                                        onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                <div className="glass" style={{ padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="email"
                                                                        placeholder="Correo electrónico"
                                                                        value={player2.email}
                                                                        onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                <div className="glass" style={{ padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Teléfono"
                                                                        value={player2.phone}
                                                                        onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                {player2.type === 'player' && (
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px' : '15px' }}>
                                                                        <div className="glass" style={{ padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.05)' }}>
                                                                            <input type="text" placeholder="Hándicap" value={player2.handicap} onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '11px' : '13px' }} />
                                                                        </div>
                                                                        <div className="glass" style={{ padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.05)' }}>
                                                                            <input type="text" placeholder="Federación" value={player2.federationCode} onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '11px' : '13px' }} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {/* Submit Button */}
                                                <button
                                                    onClick={handleRegister}
                                                    disabled={registering || (isRegistered && !showSuccess)}
                                                    className="btn-primary"
                                                    style={{ 
                                                        width: '100%', padding: '20px', borderRadius: '25px', 
                                                        fontWeight: '950', fontSize: '16px', marginTop: '20px',
                                                        boxShadow: '0 15px 40px rgba(163, 230, 53, 0.3)',
                                                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                                                        color: isRegistered ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                                                        border: isRegistered ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                                    }}
                                                >
                                                    {registering ? <Loader2 className="animate-spin" size={24} /> :
                                                        isRegistered ? 'YA ESTÁS INSCRITO' : 'INSCRIBIRME AHORA'}
                                                </button>
                                            </div>
                                        </motion.div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>
                    </div> {/* End of FRONT SIDE */}

                    {/* BACK SIDE (Mobile Form) */}
                    {isMobile && (
                    <div style={{ 
                        backfaceVisibility: 'hidden', 
                        WebkitBackfaceVisibility: 'hidden',
                        transform: 'rotateY(180deg)', 
                        position: (isMobile && isFlipped) ? 'relative' : 'absolute', 
                        top: 0, left: 0,
                        width: '100%',
                        minHeight: '100vh',
                        background: 'linear-gradient(135deg, #152c1e, #0a0f0d)',
                        display: 'flex',
                        flexDirection: 'column',
                        zIndex: isFlipped ? 2 : 0,
                        pointerEvents: isFlipped ? 'auto' : 'none'
                    }}>
                        <div style={{ 
                            padding: '20px 30px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(0,0,0,0.4)'
                        }}>
                            <div>
                                <h3 style={{ fontSize: '18px', fontWeight: '950', margin: 0, color: 'white' }}>INSCRIPCIÓN</h3>
                                <p style={{ fontSize: '10px', color: 'var(--secondary)', fontWeight: '700', margin: 0 }}>{tournament.name}</p>
                            </div>
                            <button 
                                onClick={() => setIsFlipped(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    padding: '8px 15px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '900'
                                }}
                            >
                                VOLVER
                            </button>
                        </div>
                        <div style={{ 
                            flexGrow: 1, 
                            padding: '30px',
                            background: 'transparent'
                        }}>
                            {/* Reusing form fields structure for back side */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {[
                                    { icon: <Users />, label: 'NOMBRE COMPLETO', value: player1.name, field: 'name' },
                                    { icon: <Mail />, label: 'CORREO ELECTRÓNICO', value: player1.email, field: 'email' },
                                    { icon: <ShieldCheck />, label: 'HÁNDICAP', value: player1.handicap, field: 'handicap' },
                                    { icon: <Star />, label: 'ID FEDERACIÓN', value: player1.federationCode, field: 'federationCode' },
                                    { icon: <HeartHandshake />, label: 'TELÉFONO', value: player1.phone, field: 'phone' }
                                ].map((input, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: isMobile ? '8px' : '9px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' }}>{input.label}</label>
                                        <div style={{ 
                                            padding: isMobile ? '12px 16px' : '15px 20px', borderRadius: isMobile ? '16px' : '20px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px',
                                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            <div style={{ color: 'rgba(255,255,255,0.3)' }}>{React.cloneElement(input.icon as any, { size: 18 })}</div>
                                            <input
                                                type="text"
                                                value={input.value}
                                                onChange={(e) => setPlayer1({ ...player1, [input.field]: e.target.value })}
                                                placeholder={`Tu ${input.label.toLowerCase()}`}
                                                style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '13px' : '15px', fontWeight: '600' }}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {/* Add Companion Toggle */}
                                <div 
                                    onClick={() => setAddGuest(!addGuest)}
                                    style={{ 
                                        marginTop: '10px', padding: '18px', borderRadius: '20px', 
                                        border: `1px dashed ${addGuest ? 'var(--secondary)' : 'rgba(255,255,255,0.2)'}`,
                                        textAlign: 'center', cursor: 'pointer', background: addGuest ? 'rgba(163, 230, 53, 0.05)' : 'transparent',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: addGuest ? 'var(--secondary)' : 'white' }}>
                                        {addGuest ? <X size={16} /> : <Plus size={16} />}
                                        <span style={{ fontSize: '11px', fontWeight: '900' }}>{addGuest ? 'CANCELAR INVITADO' : 'AGREGAR JUGADOR / ACOMPAÑANTE'}</span>
                                    </div>
                                </div>

                                {/* Companion Form */}
                                <AnimatePresence>
                                    {addGuest && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            style={{ overflow: 'hidden' }}
                                        >
                                            <div style={{ padding: '15px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    {['player', 'companion'].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setPlayer2({ ...player2, type: type as any })}
                                                            style={{ 
                                                                flex: 1, padding: '10px', borderRadius: '12px', 
                                                                background: player2.type === type ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                                                color: player2.type === type ? 'var(--primary)' : 'white',
                                                                fontSize: '10px', fontWeight: '900', textTransform: 'uppercase'
                                                            }}
                                                        >
                                                            {type === 'player' ? 'Jugador' : 'Acompañante'}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Nombre del invitado"
                                                        value={player2.name}
                                                        onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '12px' }}
                                                    />
                                                </div>
                                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <input
                                                        type="email"
                                                        placeholder="Correo del invitado"
                                                        value={player2.email}
                                                        onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '12px' }}
                                                    />
                                                </div>
                                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Teléfono del invitado"
                                                        value={player2.phone}
                                                        onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '12px' }}
                                                    />
                                                </div>
                                                {player2.type === 'player' && (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                                        <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <input type="text" placeholder="Hándicap" value={player2.handicap} onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '11px' }} />
                                                        </div>
                                                        <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                            <input type="text" placeholder="Federación" value={player2.federationCode} onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '11px' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button
                                    onClick={handleRegister}
                                    disabled={registering || (isRegistered && !showSuccess)}
                                    className="btn-primary"
                                    style={{ 
                                        width: '100%', padding: '20px', borderRadius: '25px', 
                                        fontWeight: '950', fontSize: '16px', marginTop: '10px',
                                        boxShadow: '0 15px 40px rgba(163, 230, 53, 0.3)',
                                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                                        color: isRegistered ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                                    }}
                                >
                                    {registering ? <Loader2 className="animate-spin" size={24} /> :
                                        isRegistered ? 'YA ESTÁS INSCRITO' : 'INSCRIBIRME AHORA'}
                                </button>
                                
                                <p style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255,255,255,0.4)', paddingBottom: '40px' }}>
                                    Al inscribirte aceptas los términos y condiciones del torneo.
                                </p>
                            </div>
                        </div>
                    </div>
                
                    )}
                </motion.div>
            </div>
        </div>
    );
};

export default TournamentRegistration;
