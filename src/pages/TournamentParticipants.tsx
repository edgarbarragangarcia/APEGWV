import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { User, Trophy, Users, ChevronLeft, Search, CheckCircle2, Clock, Mail, CheckSquare, Square } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import PageHero from '../components/PageHero';
import PageHeader from '../components/PageHeader';


interface Participant {
    id: string; // registration_id
    user_id: string | null;
    full_name: string | null;
    id_photo_url: string | null;
    handicap: number | null;
    email: string | null;
    phone: string | null;
    total_rounds: number | null;
    average_score: number | null;
    registration_status: string | null;
}

const TournamentParticipants: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedEmails, setCopiedEmails] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'registered'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch tournament details
            const { data: tournament, error: tournamentError } = await supabase
                .from('tournaments')
                .select('name')
                .eq('id', id || '')
                .single();

            if (tournamentError) throw tournamentError;
            setTournamentName(tournament.name);

            // Fetch participants registrations with profiles joined
            const { data: registrations, error: regError } = await supabase
                .from('tournament_registrations')
                .select(`
                    id,
                    registration_status,
                    user_id,
                    player_name,
                    player_email,
                    player_phone,
                    player_handicap,
                    profiles (
                        id, full_name, id_photo_url, handicap, email, phone, total_rounds, average_score
                    )
                `)
                .eq('tournament_id', id || '');

            if (regError) throw regError;

            const flattenedParticipants = registrations?.map((reg: any) => {
                const profile = reg.profiles;
                return {
                    id: reg.id,
                    user_id: reg.user_id,
                    registration_status: reg.registration_status,
                    full_name: profile?.full_name || reg.player_name || 'Invitado',
                    email: profile?.email || reg.player_email,
                    phone: profile?.phone || reg.player_phone,
                    handicap: profile?.handicap || reg.player_handicap,
                    id_photo_url: profile?.id_photo_url,
                    total_rounds: profile?.total_rounds,
                    average_score: profile?.average_score
                };
            }) || [];

            setParticipants(flattenedParticipants);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };
    const togglePaymentStatus = async (participantId: string, currentStatus: string | null) => {
        const newStatus = currentStatus === 'paid' ? 'registered' : 'paid';

        try {
            const { error } = await supabase
                .from('tournament_registrations')
                .update({ registration_status: newStatus })
                .eq('id', participantId);

            if (error) throw error;

            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, registration_status: newStatus } : p
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Error al actualizar el estado de pago');
        }
    };
    const filteredParticipants = participants.filter(p => {
        const matchesSearch =
            (p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
            (p.email?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'paid' && (p.registration_status === 'paid' || p.registration_status === 'Confirmado')) ||
            (statusFilter === 'registered' && p.registration_status !== 'paid' && p.registration_status !== 'Confirmado');

        return matchesSearch && matchesStatus;
    });

    const handleSelectParticipant = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleSelectAll = (deselect: boolean) => {
        if (deselect) {
            setSelectedIds(prev => prev.filter(id => !filteredParticipants.some(p => p.id === id)));
        } else {
            const newSelected = [...new Set([...selectedIds, ...filteredParticipants.map(p => p.id)])];
            setSelectedIds(newSelected);
        }
    };

    const sendBulkEmail = () => {
        const selectedParticipants = participants.filter(p => selectedIds.includes(p.id));
        const emails = selectedParticipants.map(p => p.email).filter(Boolean).join(',');

        if (!emails) {
            alert('No hay correos electrónicos disponibles para los participantes seleccionados.');
            return;
        }

        // Fallback: Copy to clipboard automatically since we are in a Webview
        try {
            navigator.clipboard.writeText(emails);
            setCopiedEmails(true);
            setTimeout(() => setCopiedEmails(false), 3000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }

        // Try to open mail app
        const mailtoUrl = `mailto:?bcc=${emails}&subject=Información Torneo: ${tournamentName}`;

        // Create a temporary link and click it (more compatible with some webviews)
        const link = document.createElement('a');
        link.href = mailtoUrl;
        link.target = '_self'; // Using self or blank depending on webview behavior
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isAllFilteredSelected = filteredParticipants.length > 0 && filteredParticipants.every(p => selectedIds.includes(p.id));

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <PageHero />
            {/* Header */}
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
                    title="Participantes"
                    subtitle={tournamentName || 'Cargando...'}
                    onBack={() => navigate('/my-events', { state: { restoreTournamentId: id } })}
                />

                <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Search Bar */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={18} color="rgba(255,255,255,0.4)" style={{ position: 'absolute', left: '15px' }} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Nombre o correo..."
                            style={{
                                width: '100%',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '15px',
                                padding: '12px 12px 12px 45px',
                                color: 'white',
                                fontSize: '14px',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Filter Chips */}
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '5px', scrollbarWidth: 'none' }}>
                        {[
                            { id: 'all', label: 'Todos', icon: <Users size={14} /> },
                            { id: 'paid', label: 'Pagos', icon: <CheckCircle2 size={14} /> },
                            { id: 'registered', label: 'Pendientes', icon: <Clock size={14} /> }
                        ].map(filter => (
                            <button
                                key={filter.id}
                                onClick={() => setStatusFilter(filter.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    fontSize: '13px',
                                    fontWeight: '700',
                                    whiteSpace: 'nowrap',
                                    border: 'none',
                                    background: statusFilter === filter.id ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                    color: statusFilter === filter.id ? 'var(--primary)' : 'var(--text-dim)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {filter.icon}
                                {filter.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                        <button
                            onClick={() => handleSelectAll(isAllFilteredSelected)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                borderRadius: '12px',
                                fontSize: '13px',
                                fontWeight: '700',
                                whiteSpace: 'nowrap',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: isAllFilteredSelected ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)',
                                color: isAllFilteredSelected ? 'var(--secondary)' : 'white',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isAllFilteredSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                            <span>Seleccionar Todo</span>
                            <span style={{ opacity: 0.5, fontSize: '11px' }}>({filteredParticipants.length})</span>
                        </button>
                    </div>
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 225px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height="70px" borderRadius="18px" />)}
                    </div>
                ) : selectedParticipant ? (
                    <div className="animate-fade-in" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <button
                            onClick={() => setSelectedParticipant(null)}
                            style={{ marginBottom: '12px', width: 'fit-content', color: 'var(--secondary)', background: 'none', border: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}
                        >
                            <ChevronLeft size={14} /> Volver a la lista
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div style={{
                                width: '90px',
                                height: '90px',
                                borderRadius: '30px',
                                margin: '0 auto 12px',
                                overflow: 'hidden',
                                border: '3px solid var(--secondary)',
                                boxShadow: '0 15px 30px rgba(0,0,0,0.3)'
                            }}>
                                <img
                                    src={selectedParticipant.id_photo_url || `https://ui-avatars.com/api/?name=${selectedParticipant.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={selectedParticipant.full_name || 'User'}
                                />
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '2px' }}>{selectedParticipant.full_name}</h3>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '20px', marginTop: '5px' }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: '11px', marginRight: '5px' }}>Hándicap Index:</span>
                                <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>{selectedParticipant.handicap ?? '--'}</span>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '18px', borderRadius: '20px', marginBottom: '15px' }}>
                            <h4 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información de Contacto</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={16} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '9px', color: 'var(--text-dim)', marginBottom: '1px', fontWeight: '600' }}>EMAIL</p>
                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{selectedParticipant.email || 'No disponible'}</p>
                                    </div>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={16} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '9px', color: 'var(--text-dim)', marginBottom: '1px', fontWeight: '600' }}>TELÉFONO</p>
                                        <p style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{selectedParticipant.phone || 'No disponible'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : participants.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', paddingBottom: '100px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Users size={32} style={{ opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Sin participantes</h3>
                        <p style={{ fontSize: '14px', textAlign: 'center', maxWidth: '250px' }}>Aún no hay jugadores inscritos en este torneo.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div />
                            {selectedIds.length > 0 && (
                                <motion.button
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    onClick={sendBulkEmail}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        padding: '10px 18px',
                                        borderRadius: '14px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        fontSize: '13px',
                                        fontWeight: '900',
                                        cursor: 'pointer',
                                        boxShadow: '0 10px 20px rgba(163, 230, 53, 0.2)'
                                    }}
                                >
                                    <Mail size={16} /> {copiedEmails ? '¡COPIADOS!' : `Copiar correos (${selectedIds.length})`}
                                </motion.button>
                            )}
                        </div>
                        {copiedEmails && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    color: 'var(--secondary)',
                                    padding: '8px 12px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700',
                                    textAlign: 'center',
                                    border: '1px solid rgba(163, 230, 53, 0.2)'
                                }}
                            >
                                Los correos se han copiado al portapapeles por si el correo no abre automáticamente.
                            </motion.div>
                        )}
                        {filteredParticipants.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '12px',
                                    background: (p.registration_status === 'paid' || p.registration_status === 'Confirmado')
                                        ? 'rgba(163, 230, 53, 0.15)'
                                        : 'rgba(255,255,255,0.03)',
                                    borderRadius: '18px',
                                    border: (p.registration_status === 'paid' || p.registration_status === 'Confirmado')
                                        ? '1px solid rgba(163, 230, 53, 0.3)'
                                        : '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                className="item-hover"
                            >
                                <div
                                    onClick={(e) => handleSelectParticipant(p.id, e)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '24px',
                                        height: '24px',
                                        borderRadius: '7px',
                                        background: selectedIds.includes(p.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                        color: selectedIds.includes(p.id) ? 'var(--primary)' : 'transparent',
                                        border: '1px solid ' + (selectedIds.includes(p.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                        transition: 'all 0.2s',
                                        flexShrink: 0
                                    }}
                                >
                                    <CheckCircle2 size={14} />
                                </div>
                                <div style={{ width: '50px', height: '50px', borderRadius: '15px', overflow: 'hidden', background: 'var(--primary-light)', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                                    <img
                                        src={p.id_photo_url || `https://ui-avatars.com/api/?name=${p.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt={p.full_name || 'User'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>{p.full_name || 'Golfista APEG'}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Hándicap: <span style={{ color: 'white', fontWeight: '600' }}>{p.handicap ?? '--'}</span></span>
                                        {(p.registration_status === 'paid' || p.registration_status === 'Confirmado') && (
                                            <span style={{
                                                fontSize: '10px',
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                fontWeight: '900',
                                                textTransform: 'uppercase'
                                            }}>{p.registration_status === 'Confirmado' ? 'CONFIRMADO' : 'PAGO'}</span>
                                        )}
                                    </div>
                                </div>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        togglePaymentStatus(p.id, p.registration_status);
                                    }}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '14px',
                                        background: (p.registration_status === 'paid' || p.registration_status === 'Confirmado') ? 'var(--secondary)' : 'rgba(163, 230, 53, 0.1)',
                                        color: (p.registration_status === 'paid' || p.registration_status === 'Confirmado') ? 'var(--primary)' : 'var(--secondary)',
                                        border: '1px solid rgba(163, 230, 53, 0.2)',
                                        transition: 'all 0.2s',
                                        position: 'relative',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {(p.registration_status !== 'paid' && p.registration_status !== 'Confirmado') && (
                                        <motion.div
                                            animate={{
                                                scale: [1, 1.25, 1],
                                                opacity: [0.4, 0, 0.4]
                                            }}
                                            transition={{
                                                duration: 2,
                                                repeat: Infinity,
                                                ease: "easeInOut"
                                            }}
                                            style={{
                                                position: 'absolute',
                                                inset: -4,
                                                borderRadius: '18px',
                                                border: '2px solid var(--secondary)',
                                                pointerEvents: 'none'
                                            }}
                                        />
                                    )}
                                    <Trophy size={18} />
                                </motion.div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default TournamentParticipants;
