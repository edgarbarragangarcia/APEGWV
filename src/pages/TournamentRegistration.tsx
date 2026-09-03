import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    MapPin, Trophy, HeartHandshake, Calendar, Globe,
    CheckCircle2, Loader2, Plus, X, Mail, BookOpen,
    Users, Copy, Check, ChevronDown, AlertCircle,
    IdCard
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';

const isVideoUrl = (url: string) => /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url);

const BUENAVENTURA_INFO = {
    includes: [
        '3 noches de alojamiento en Buenaventura Golf and Beach Resort',
        'Alimentos y bebidas (incluidos durante toda la experiencia)',
        '2 rondas de golf en el campo Buenaventura Golf',
        'Torneo de golf femenino (competencia oficial)',
        'Golf cart en todas las rondas',
        'Kit de bienvenida',
        'Experiencias y actividades especiales',
        'Acompañamiento y logística durante todo el viaje',
        'Traslados aeropuerto – hotel – campos de golf – aeropuerto (2 horas aprox. desde el aeropuerto al hotel)',
    ],
    itinerary: [
        ['13 NOV', 'Llegada a Panamá · Traslado del aeropuerto al hotel Buenaventura · Bienvenida'],
        ['14 NOV', 'Desayuno · Torneo de golf · Actividades especiales'],
        ['15 NOV', 'Desayuno · Segunda ronda de golf · Premiación · Actividades especiales'],
        ['16 NOV', 'Desayuno · Check out · Traslado del hotel al aeropuerto · Regreso a casa'],
    ],
    excludes: ['Tiquetes aéreos', 'Gastos personales', 'Seguro de viaje'],
};

const NACIONALIDADES = [
    'Colombiana', 'Panameña', 'Estadounidense', 'Mexicana', 'Argentina', 'Chilena',
    'Peruana', 'Ecuatoriana', 'Venezolana', 'Costarricense', 'Guatemalteca', 'Hondureña',
    'Salvadoreña', 'Nicaragüense', 'Dominicana', 'Cubana', 'Boliviana', 'Paraguaya',
    'Uruguaya', 'Brasileña', 'Española', 'Canadiense', 'Portuguesa', 'Italiana',
    'Francesa', 'Alemana', 'Británica', 'Otra',
];

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
    const [mpRedirecting, setMpRedirecting] = useState(false);
    const [paymentResult, setPaymentResult] = useState<'success' | 'failure' | 'pending' | null>(null);

    // "Ya me inscribí" → consulta por cédula para ir a pagar
    const [lookupDoc, setLookupDoc] = useState('');
    const [lookupLoading, setLookupLoading] = useState(false);
    const [lookupDone, setLookupDone] = useState(false);
    const [lookupResults, setLookupResults] = useState<any[]>([]);
    const [payingLookup, setPayingLookup] = useState(false);
    const [selectedPackageId, setSelectedPackageId] = useState<string>('');

    useEffect(() => {
        const st = new URLSearchParams(window.location.search).get('status');
        if (st === 'success' || st === 'failure' || st === 'pending') {
            setPaymentResult(st);
        }
    }, []);

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
        handicap: '',
        document: '',
        birthdate: '',
        nationality: ''
    });
    const [player2, setPlayer2] = useState({
        name: '',
        email: '',
        phone: '',
        federationCode: '',
        handicap: '',
        document: '',
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
                        handicap: profile.handicap?.toString() || '',
                        document: '',
                        birthdate: '',
                        nationality: ''
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
                    let label = p.method === 'Llave BreB' ? 'LLAVE' : 
                                p.method === 'Nequi' ? 'NEQUI' : 
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
            label: method === 'Llave BreB' ? 'LLAVE' : method === 'Nequi' ? 'NEQUI' : 'CUENTA'
        }];
    })();

    const isBuenaventura = !!tournament && /buenaventura/i.test(tournament.name || '');

    // Paquetes configurados en el gestor; si el torneo es Buenaventura y aún no
    // tiene paquetes, se usan los del folleto (USD, se cobran en COP a la TRM).
    const DEFAULT_BUENAVENTURA_PACKAGES = [
        { id: 'single', name: 'Habitación Single', price: 2100, currency: 'USD' },
        { id: 'double', name: 'Habitación Doble', price: 1900, currency: 'USD' },
    ];
    const configuredPackages: { id: string; name: string; price: number; currency: string }[] =
        Array.isArray(tournament?.packages) ? tournament!.packages : [];
    const packages = configuredPackages.length > 0
        ? configuredPackages
        : (isBuenaventura ? DEFAULT_BUENAVENTURA_PACKAGES : []);

    // Cobro con Mercado Pago: habilitado si hay paquetes, o si es Buenaventura.
    const mpEnabled = !!tournament && (packages.length > 0 || isBuenaventura);

    const selectedPackage = packages.find((p) => p.id === selectedPackageId) || packages[0] || null;

    useEffect(() => {
        if (packages.length > 0 && !selectedPackageId) setSelectedPackageId(packages[0].id);
    }, [packages.length]);

    const fmtMoney = (amount: number, currency: string) => {
        try {
            return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'es-CO', {
                style: 'currency', currency, maximumFractionDigits: 0,
            }).format(amount);
        } catch {
            return `${currency} ${new Intl.NumberFormat('es-CO').format(amount)}`;
        }
    };

    const isPaidReg = (r: any) =>
        !!r.mp_payment_id || r.registration_status === 'paid' || r.registration_status === 'Confirmado';

    const startMercadoPago = async (registrationIds: string[], buyerEmail?: string, packageId?: string) => {
        if (!tournament || registrationIds.length === 0) return;
        const { data: mp, error } = await supabase.functions.invoke('mercadopago-preference', {
            body: {
                kind: 'tournament_registration',
                tournament_id: tournament.id,
                registration_ids: registrationIds,
                package_id: packageId,
                buyer_email: buyerEmail,
                return_path: `/tournament-register/${idOrSlug}`,
            },
        });
        if (error) throw error;
        const initPoint = mp?.init_point || mp?.sandbox_init_point;
        if (!initPoint) throw new Error(mp?.error || 'No se pudo generar el enlace de pago de Mercado Pago.');
        const iOSNative = (window as any).iOSNative;
        if (iOSNative?.openExternalURL) iOSNative.openExternalURL(initPoint);
        else window.location.href = initPoint;
    };

    const handleLookup = async () => {
        const doc = lookupDoc.trim();
        if (!doc || !tournament) return;
        setLookupLoading(true);
        setLookupDone(false);
        try {
            let data: any[] | null = null;
            let error: any = null;
            ({ data, error } = await supabase
                .from('tournament_registrations')
                .select('id, player_name, player_email, registration_status, mp_payment_id, payment_date')
                .eq('tournament_id', tournament.id)
                .eq('player_document', doc) as any);
            // Compatibilidad: si aún no se ha corrido la migración de columnas MP.
            if (error && (error.code === '42703' || /does not exist/i.test(error.message || ''))) {
                ({ data, error } = await supabase
                    .from('tournament_registrations')
                    .select('id, player_name, player_email, registration_status, payment_date')
                    .eq('tournament_id', tournament.id)
                    .eq('player_document', doc) as any);
            }
            if (error) throw error;
            setLookupResults(data || []);
            setLookupDone(true);
        } catch (err) {
            console.error('Lookup error:', err);
            alert('No se pudo consultar tu inscripción. Intenta de nuevo.');
        } finally {
            setLookupLoading(false);
        }
    };

    const handlePayLookup = async () => {
        const pending = lookupResults.filter((r) => !isPaidReg(r));
        if (pending.length === 0) return;
        setPayingLookup(true);
        try {
            await startMercadoPago(pending.map((r) => r.id), pending[0].player_email);
        } catch (err: any) {
            console.error('Pay lookup error:', err);
            alert(err.message || 'Error al generar el pago.');
            setPayingLookup(false);
        }
    };

    const renderExtraFields = () => {
        const labelStyle: React.CSSProperties = { fontSize: isMobile ? '8px' : '9px', fontWeight: 900, color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' };
        const wrapStyle: React.CSSProperties = {
            padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px',
            display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px',
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)',
        };
        const inputStyle: React.CSSProperties = { background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '13px' : '15px', fontWeight: 600, colorScheme: 'dark' };
        return (
            <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={labelStyle}>FECHA DE NACIMIENTO</label>
                    <div className="glass" style={wrapStyle}>
                        <div style={{ color: 'rgba(255,255,255,0.3)' }}><Calendar size={isMobile ? 18 : 20} /></div>
                        <input
                            type="date"
                            value={player1.birthdate}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={(e) => setPlayer1({ ...player1, birthdate: e.target.value })}
                            style={inputStyle}
                        />
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={labelStyle}>NACIONALIDAD</label>
                    <div className="glass" style={wrapStyle}>
                        <div style={{ color: 'rgba(255,255,255,0.3)' }}><Globe size={isMobile ? 18 : 20} /></div>
                        <select
                            value={player1.nationality}
                            onChange={(e) => setPlayer1({ ...player1, nationality: e.target.value })}
                            style={{ ...inputStyle, color: player1.nationality ? 'white' : 'rgba(255,255,255,0.4)' }}
                        >
                            <option value="" disabled style={{ color: '#000' }}>Selecciona tu nacionalidad</option>
                            {NACIONALIDADES.map((n) => <option key={n} value={n} style={{ color: '#000' }}>{n}</option>)}
                        </select>
                    </div>
                </div>
            </>
        );
    };

    const renderPackageSelector = () => {
        if (!mpEnabled || packages.length === 0) return null;
        return (
            <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '9px', fontWeight: 900, color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' }}>ELIGE TU PAQUETE</label>
                {packages.map((pkg) => {
                    const active = selectedPackage?.id === pkg.id;
                    return (
                        <div
                            key={pkg.id}
                            onClick={() => setSelectedPackageId(pkg.id)}
                            style={{
                                padding: '12px 14px', borderRadius: '14px', cursor: 'pointer',
                                background: active ? 'rgba(163,230,53,0.08)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${active ? 'var(--secondary)' : 'rgba(255,255,255,0.08)'}`,
                                display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.2s ease'
                            }}
                        >
                            <div style={{
                                width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                                border: `2px solid ${active ? 'var(--secondary)' : 'rgba(255,255,255,0.25)'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {active && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--secondary)' }} />}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: 800, color: 'white' }}>{pkg.name}</div>
                                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)' }}>por persona</div>
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: 950, color: 'var(--secondary)' }}>{fmtMoney(pkg.price, pkg.currency)}</div>
                        </div>
                    );
                })}
                {packages.some((p) => p.currency === 'USD') && (
                    <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginLeft: '10px', lineHeight: 1.5 }}>
                        El valor se cobra en pesos (COP) a la TRM oficial del día.
                    </p>
                )}
            </div>
        );
    };

    const renderBuenaventuraInfo = () => {
        if (!isBuenaventura) return null;
        const Section: React.FC<{ title: string; color: string; children: React.ReactNode }> = ({ title, color, children }) => (
            <div>
                <h4 style={{ fontSize: '11px', fontWeight: 900, color, letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '14px' }}>{title}</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>{children}</div>
            </div>
        );
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', marginTop: '8px' }}>
                <Section title="¿Qué incluye?" color="var(--secondary)">
                    {BUENAVENTURA_INFO.includes.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                            <CheckCircle2 size={15} color="var(--secondary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>{t}</span>
                        </div>
                    ))}
                </Section>
                <Section title="Itinerario" color="#38bdf8">
                    {BUENAVENTURA_INFO.itinerary.map(([day, desc], i) => (
                        <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                            <span style={{ fontSize: '11px', fontWeight: 900, color: '#38bdf8', minWidth: '52px', marginTop: '2px' }}>{day}</span>
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>{desc}</span>
                        </div>
                    ))}
                </Section>
                <Section title="No incluye" color="#f472b6">
                    {BUENAVENTURA_INFO.excludes.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <X size={15} color="#f472b6" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>{t}</span>
                        </div>
                    ))}
                </Section>
            </div>
        );
    };

    const renderPaymentLookup = () => {
        if (!mpEnabled) return null;
        const hasPending = lookupResults.some((r) => !isPaidReg(r));
        return (
            <div style={{
                marginTop: '20px', padding: '22px', borderRadius: '24px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)'
            }}>
                <h4 style={{ fontSize: '14px', fontWeight: 900, color: 'white', marginBottom: '6px' }}>¿Ya te inscribiste?</h4>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px', lineHeight: 1.5 }}>
                    Ingresa tu número de cédula para ver tu inscripción e ir a la zona de pago.
                </p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        value={lookupDoc}
                        onChange={(e) => setLookupDoc(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleLookup(); }}
                        placeholder="Número de cédula"
                        style={{
                            flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '14px', padding: '12px 14px', color: 'white', outline: 'none', fontSize: '14px', fontWeight: 600
                        }}
                    />
                    <button
                        onClick={handleLookup}
                        disabled={lookupLoading || !lookupDoc.trim()}
                        style={{
                            background: 'var(--secondary)', color: 'var(--primary)', border: 'none',
                            borderRadius: '14px', padding: '0 18px', fontWeight: 900, fontSize: '12px', letterSpacing: '0.5px'
                        }}
                    >
                        {lookupLoading ? '...' : 'BUSCAR'}
                    </button>
                </div>

                {lookupDone && (
                    <div style={{ marginTop: '14px' }}>
                        {lookupResults.length === 0 ? (
                            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                                No encontramos inscripciones con esa cédula en este torneo.
                            </p>
                        ) : (
                            <>
                                {lookupResults.map((r) => {
                                    const paid = isPaidReg(r);
                                    return (
                                        <div key={r.id} style={{
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                            padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '8px'
                                        }}>
                                            <span style={{ fontSize: '13px', color: 'white', fontWeight: 700 }}>{r.player_name}</span>
                                            <span style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px', color: paid ? 'var(--secondary)' : '#fbbf24' }}>
                                                {paid ? 'PAGADO ✓' : 'PENDIENTE DE PAGO'}
                                            </span>
                                        </div>
                                    );
                                })}
                                {hasPending && (
                                    <button
                                        onClick={handlePayLookup}
                                        disabled={payingLookup}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '16px', borderRadius: '18px', fontWeight: 950, fontSize: '14px', marginTop: '6px', letterSpacing: '0.5px' }}
                                    >
                                        {payingLookup ? <Loader2 className="animate-spin" size={20} /> : 'PAGAR CON MERCADO PAGO'}
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    const handleRegister = async () => {
        if (isRegistered || !tournament) return;
        const validatePlayer = (player: typeof player1, roleLabel: string) => {
            // 1. Name check
            const name = player.name.trim();
            if (!name) {
                return `El nombre del ${roleLabel} es obligatorio.`;
            }

            // 2. Email check
            const email = player.email.trim();
            if (!email) {
                return `El correo electrónico del ${roleLabel} es obligatorio.`;
            }

            // 3. Phone check
            const phone = player.phone.trim();
            if (!phone) {
                return `El teléfono del ${roleLabel} es obligatorio.`;
            }

            // 4. Document / ID check
            const document = player.document?.trim();
            if (!document) {
                return `La cédula o ID del ${roleLabel} es obligatoria.`;
            }

            if (!player.birthdate?.trim()) {
                return `La fecha de nacimiento del ${roleLabel} es obligatoria.`;
            }

            if (!player.nationality?.trim()) {
                return `La nacionalidad del ${roleLabel} es obligatoria.`;
            }


            return null;
        };

        // Validate player 1 (Primary Player)
        const error1 = validatePlayer(player1, "Jugador Principal");
        if (error1) {
            alert(error1);
            return;
        }

        // Validate player 2 (Guest, if added)
        if (addGuest) {
            const isCompanion = player2.type === 'companion';
            const error2 = validatePlayer(
                player2 as any,
                isCompanion ? "Invitado (Acompañante)" : "Invitado (Jugador)"
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
                    registration_status: mpEnabled ? 'Pendiente' : 'registered',
                    player_name: player1.name.trim(),
                    player_email: player1.email.trim(),
                    player_phone: player1.phone.trim(),
                    player_federation_code: player1.federationCode.trim(),
                    player_handicap: player1.handicap ? parseFloat(player1.handicap.trim().replace(',', '.')) : null,
                    player_document: player1.document.trim(),
                    player_birthdate: player1.birthdate || null,
                    player_nationality: player1.nationality || null
                }
            ];

            if (addGuest && player2.name) {
                const isCompanion = player2.type === 'companion';
                registrations.push({
                    tournament_id: tournament.id,
                    user_id: user?.id || null,
                    registration_status: mpEnabled ? 'Pendiente' : 'registered',
                    player_name: player2.name.trim(),
                    player_email: player2.email.trim(),
                    player_phone: player2.phone.trim(),
                    player_federation_code: isCompanion ? `ACOMP:${player1.name.trim()}` : player2.federationCode.trim(),
                    player_handicap: isCompanion ? null : (player2.handicap ? parseFloat(player2.handicap.trim().replace(',', '.')) : null),
                    player_document: player2.document.trim(),
                    player_birthdate: null,
                    player_nationality: null
                });
            }

            const { data: inserted, error } = await supabase
                .from('tournament_registrations')
                .insert(registrations)
                .select('id');

            if (error) throw error;

            const ids = (inserted || []).map((r: any) => r.id);

            // Guarda el paquete elegido (best-effort; no bloquea si falta la columna).
            if (mpEnabled && selectedPackage && ids.length > 0) {
                try {
                    await supabase
                        .from('tournament_registrations')
                        .update({ selected_package: selectedPackage.name } as any)
                        .in('id', ids);
                } catch { /* columna aún no migrada: se resuelve en el pago */ }
            }

            if (mpEnabled) {
                setMpRedirecting(true);
                await startMercadoPago(ids, player1.email.trim(), selectedPackage?.id);
                return;
            }

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
            {/* Mercado Pago return / payment result */}
            <AnimatePresence>
                {paymentResult && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed', inset: 0, zIndex: 1100, display: 'flex',
                            alignItems: 'center', justifyContent: 'center', padding: '20px',
                            background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(15px)'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.85, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
                            style={{
                                background: 'linear-gradient(135deg, #152c1e, #0a0f0d)', padding: '44px 28px',
                                borderRadius: '32px', border: '1px solid rgba(163, 230, 53, 0.25)',
                                textAlign: 'center', maxWidth: '420px', width: '100%'
                            }}
                        >
                            <div style={{
                                width: '84px', height: '84px', borderRadius: '50%', margin: '0 auto 24px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: paymentResult === 'failure' ? 'rgba(239,68,68,0.15)' : 'rgba(163,230,53,0.15)',
                                color: paymentResult === 'failure' ? '#ef4444' : 'var(--secondary)'
                            }}>
                                {paymentResult === 'failure' ? <X size={44} /> : paymentResult === 'pending' ? <Loader2 size={44} /> : <CheckCircle2 size={44} />}
                            </div>
                            <h2 style={{ fontSize: '26px', fontWeight: 950, color: 'white', marginBottom: '12px', letterSpacing: '-0.5px' }}>
                                {paymentResult === 'failure' ? 'PAGO NO COMPLETADO' : paymentResult === 'pending' ? 'PAGO EN PROCESO' : '¡PAGO RECIBIDO!'}
                            </h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: '32px', fontSize: '15px' }}>
                                {paymentResult === 'failure'
                                    ? 'No se pudo procesar el pago con Mercado Pago. Tu inscripción quedó pendiente; puedes intentar de nuevo o pagar por transferencia.'
                                    : paymentResult === 'pending'
                                        ? 'Mercado Pago está confirmando tu pago. Tu inscripción se activará automáticamente cuando se acredite.'
                                        : 'Estamos confirmando tu pago con Mercado Pago. Tu inscripción quedará confirmada en unos minutos.'}
                            </p>
                            <button
                                onClick={() => {
                                    setPaymentResult(null);
                                    window.history.replaceState(null, '', window.location.pathname);
                                }}
                                className="btn-primary"
                                style={{ width: '100%', padding: '16px', borderRadius: '22px', fontWeight: 950, fontSize: '14px', letterSpacing: '1px' }}
                            >
                                ENTENDIDO
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                            handicap: '',
                                            document: '',
                                            birthdate: '',
                                            nationality: ''
                                        });
                                        setPlayer2({
                                            name: '',
                                            email: '',
                                            phone: '',
                                            federationCode: '',
                                            handicap: '',
                                            document: '',
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
                            paddingTop: isMobile ? '10px' : '0',
                            paddingBottom: isMobile ? '50px' : '0',
                            overflow: isMobile ? 'visible' : 'hidden',
                            width: '100vw',
                            left: '50%',
                            right: '50%',
                            marginLeft: '-50vw',
                            marginRight: '-50vw'
                        }}>
                        {tournament.image_url && isVideoUrl(tournament.image_url) ? (
                            <video
                                src={tournament.image_url}
                                autoPlay
                                muted
                                loop
                                playsInline
                                style={{
                                    position: isMobile ? 'absolute' : 'static',
                                    top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    objectFit: 'cover',
                                    zIndex: 1
                                }}
                            />
                        ) : (
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
                        )}
                        <div style={{ 
                            position: 'absolute', 
                            bottom: 0, left: 0, right: 0, top: 0,
                            background: isMobile
                                ? 'linear-gradient(to bottom, rgba(14,47,31,0.2) 0%, var(--primary) 90%)'
                                : 'linear-gradient(to top, var(--primary) 0%, rgba(14,47,31,0.35) 25%, transparent 100%)',
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
                                    margin: '0 0 4px 0',
                                    color: 'white',
                                    letterSpacing: isMobile ? '-0.5px' : '-1.5px',
                                    lineHeight: '1.2',
                                    textShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                    textAlign: 'center'
                                }}>
                                    {tournament.name}
                                </h1>
                                <div style={{
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '20px',
                                    color: 'rgba(255,255,255,0.8)'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: isMobile ? '16px' : '18px', fontWeight: '600' }}>
                                        <MapPin size={20} color="var(--secondary)" /> {tournament.club}
                                    </div>
                                    {!isMobile && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '600' }}>
                                            <Users size={18} color="var(--secondary)" /> {tournament.current_participants || 0} / {tournament.participants_limit || '∞'} JUGADORES
                                        </div>
                                    )}
                                </div>
                                <div style={{
                                    textAlign: 'center',
                                    width: '100%',
                                    marginTop: '6px',
                                    fontSize: isMobile ? '13px' : '15px',
                                    fontWeight: '600',
                                    color: 'rgba(255,255,255,0.7)'
                                }}>
                                    {new Date(tournament.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}
                                </div>

                                {isMobile && (
                                    <div style={{ 
                                        margin: '5px auto 0 auto', 
                                        padding: '12px 20px', 
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
                                        <div style={{ fontSize: packages.length > 0 ? '15px' : '24px', fontWeight: '950', color: 'white' }}>
                                            {packages.length > 0
                                                ? packages.map((p) => `${p.name}: ${fmtMoney(p.price, p.currency)}`).join('  ·  ')
                                                : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tournament.price)}
                                        </div>
                                        {paymentMethods.length > 0 && (
                                            <div style={{ 
                                                marginTop: '5px', 
                                                paddingTop: '5px', 
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
                                                
                                                <div style={{ 
                                                    marginTop: '12px', 
                                                    padding: '12px 14px', 
                                                    background: 'rgba(239, 68, 68, 0.15)', 
                                                    border: '2px solid rgba(239, 68, 68, 0.5)', 
                                                    borderRadius: '20px', 
                                                    width: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    gap: '12px',
                                                    alignItems: 'center',
                                                    textAlign: 'center',
                                                    boxShadow: '0 10px 30px rgba(239, 68, 68, 0.15)'
                                                }}>
                                                    <AlertCircle size={28} color="#ef4444" style={{ flexShrink: 0, marginBottom: '5px' }} />
                                                    <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.95)', lineHeight: '1.6' }}>
                                                        <strong style={{ color: '#ef4444', fontSize: '16px', display: 'block', marginBottom: '8px', letterSpacing: '0.5px' }}>Confirmación de inscripción y pago 📩</strong>
                                                        Por favor enviar el comprobante de pago al correo:<br/>
                                                        <strong style={{ fontSize: '18px', display: 'block', marginTop: '10px', color: 'white', wordBreak: 'break-all', letterSpacing: '1px' }}>amorporelgolf@gmail.com</strong>
                                                    </p>
                                                </div>

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
                                animate={{ 
                                    opacity: 1, 
                                    scale: [1, 1.05, 1], 
                                    x: '-50%' 
                                }}
                                transition={{ 
                                    opacity: { duration: 0.3 },
                                    scale: { repeat: Infinity, duration: 1.5, ease: "easeInOut" }
                                }}
                                whileTap={{ scale: 0.95, x: '-50%' }}
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

                    {isMobile && !isFlipped && (
                        <motion.div
                            animate={{ y: [0, 10, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            style={{
                                display: 'flex',
                                justifyContent: 'center',
                                marginTop: '40px',
                                marginBottom: '-20px',
                                color: 'rgba(255,255,255,0.4)',
                                zIndex: 20,
                                position: 'relative'
                            }}
                        >
                            <ChevronDown size={28} />
                        </motion.div>
                    )}

                    {isMobile && !isFlipped && mpEnabled && (
                        <div style={{ padding: '0 30px', marginTop: '30px', position: 'relative', zIndex: 20 }}>
                            {renderPaymentLookup()}
                        </div>
                    )}

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
                                                {renderBuenaventuraInfo()}
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
                                                padding: '26px',
                                                borderRadius: '32px',
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                boxShadow: '0 40px 80px rgba(0,0,0,0.4)'
                                            }}
                                        >
                                            <div style={{ marginBottom: '16px' }}>
                                                <h3 style={{ fontSize: '20px', fontWeight: '950', marginBottom: '3px' }}>Inscripción</h3>
                                                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>Completa tus datos para participar</p>
                                            </div>

                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
                                                {/* Input Fields */}
                                                {[
                                                    { icon: <Users />, label: 'NOMBRE COMPLETO', value: player1.name, field: 'name' },
                                                    { icon: <Mail />, label: 'CORREO ELECTRÓNICO', value: player1.email, field: 'email' },
                                                    { icon: <IdCard />, label: 'CÉDULA / DOCUMENTO DE IDENTIDAD', value: player1.document, field: 'document' },
                                                    { icon: <HeartHandshake />, label: 'TELÉFONO', value: player1.phone, field: 'phone' }
                                                ].map((input, i) => (
                                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                        <label style={{ fontSize: isMobile ? '8px' : '9px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' }}>{input.label}</label>
                                                        <div className="glass" style={{ 
                                                            padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px',
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

                                                {renderExtraFields()}

                                                {/* Add Companion Toggle */}
                                                <div
                                                    onClick={() => setAddGuest(!addGuest)}
                                                    style={{
                                                        display: 'none',
                                                        marginTop: '4px', padding: '14px', borderRadius: '18px',
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
                                                            <div style={{ paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '11px' }}>
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
                                                                 <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Nombre completo"
                                                                        value={player2.name}
                                                                        onChange={(e) => setPlayer2({ ...player2, name: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="email"
                                                                        placeholder="Correo electrónico"
                                                                        value={player2.email}
                                                                        onChange={(e) => setPlayer2({ ...player2, email: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Teléfono"
                                                                        value={player2.phone}
                                                                        onChange={(e) => setPlayer2({ ...player2, phone: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Cédula o documento de identidad"
                                                                        value={player2.document}
                                                                        onChange={(e) => setPlayer2({ ...player2, document: e.target.value })}
                                                                        style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '12px' : '14px' }}
                                                                    />
                                                                </div>
                                                                {player2.type === 'player' && (
                                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? '10px' : '15px' }}>
                                                                        <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)' }}>
                                                                            <input type="text" placeholder="Hándicap" value={player2.handicap} onChange={(e) => setPlayer2({ ...player2, handicap: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '11px' : '13px' }} />
                                                                        </div>
                                                                        <div className="glass" style={{ padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', background: 'rgba(255,255,255,0.05)' }}>
                                                                            <input type="text" placeholder="Federación" value={player2.federationCode} onChange={(e) => setPlayer2({ ...player2, federationCode: e.target.value })} style={{ background: 'transparent', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: isMobile ? '11px' : '13px' }} />
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>

                                                {renderPackageSelector()}

                                                {/* Submit Button */}
                                                <button
                                                    onClick={handleRegister}
                                                    disabled={registering || (isRegistered && !showSuccess)}
                                                    className="btn-primary"
                                                    style={{ 
                                                        width: '100%', padding: '16px', borderRadius: '20px',
                                                        fontWeight: '950', fontSize: '15px', marginTop: '14px',
                                                        boxShadow: '0 15px 40px rgba(163, 230, 53, 0.3)',
                                                        background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                                                        color: isRegistered ? 'rgba(255,255,255,0.3)' : 'var(--primary)',
                                                        border: isRegistered ? '1px solid rgba(255,255,255,0.1)' : 'none',
                                                    }}
                                                >
                                                    {registering || mpRedirecting ? <Loader2 className="animate-spin" size={24} /> :
                                                        isRegistered ? 'YA ESTÁS INSCRITO' : mpEnabled ? 'INSCRIBIRME Y PAGAR' : 'INSCRIBIRME AHORA'}
                                                </button>
                                            </div>
                                        </motion.div>
                                        {renderPaymentLookup()}
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
                                    { icon: <IdCard />, label: 'CÉDULA / DOCUMENTO DE IDENTIDAD', value: player1.document, field: 'document' },
                                    { icon: <HeartHandshake />, label: 'TELÉFONO', value: player1.phone, field: 'phone' }
                                ].map((input, i) => (
                                    <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: isMobile ? '8px' : '9px', fontWeight: '900', color: 'var(--secondary)', marginLeft: '10px', letterSpacing: '1px' }}>{input.label}</label>
                                        <div style={{ 
                                            padding: isMobile ? '11px 14px' : '11px 16px', borderRadius: isMobile ? '14px' : '16px', display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '15px',
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

                                {renderExtraFields()}

                                {/* Add Companion Toggle */}
                                <div
                                    onClick={() => setAddGuest(!addGuest)}
                                    style={{
                                        display: 'none',
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
                                                <div style={{ padding: '10px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Cédula o ID del invitado"
                                                        value={player2.document}
                                                        onChange={(e) => setPlayer2({ ...player2, document: e.target.value })}
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

                                {renderPackageSelector()}

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
                                    {registering || mpRedirecting ? <Loader2 className="animate-spin" size={24} /> :
                                        isRegistered ? 'YA ESTÁS INSCRITO' : mpEnabled ? 'INSCRIBIRME Y PAGAR' : 'INSCRIBIRME AHORA'}
                                </button>

                                {renderPaymentLookup()}

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