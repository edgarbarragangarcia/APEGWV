import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { User, Trophy, Users, Search, CheckCircle2, Clock, Mail, CheckSquare, Square, Download, Trash2 } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import PageHero from '../components/PageHero';
import PageHeader from '../components/PageHeader';

interface Participant {
    id: string; // registration_id
    user_id: string | null;
    full_name: string | null;
    avatar_url: string | null;
    handicap: number | null;
    email: string | null;
    phone: string | null;
    total_rounds: number | null;
    average_score: number | null;
    registration_status: string | null;
    federation_code: string | null;
    payment_date: string | null;
    is_guest?: boolean;
    is_companion?: boolean;
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
    const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'registered' | 'guests' | 'companions'>('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: tournament, error: tournamentError } = await supabase
                .from('tournaments')
                .select('name, guests')
                .eq('id', id || '')
                .single();

            if (tournamentError) throw tournamentError;
            setTournamentName(tournament.name);

            // 1. Fetch Registrations
            const { data: registrations, error: regError } = await (supabase
                .from('tournament_registrations') as any)
                .select('*')
                .eq('tournament_id', id || '');

            if (regError) throw regError;

            // 2. Fetch Profiles for the registered users
            const userIds = (registrations || [])
                .map((r: any) => r.user_id)
                .filter(Boolean);

            let profilesMap: Record<string, any> = {};
            if (userIds.length > 0) {
                const { data: profilesData } = await (supabase
                    .from('profiles') as any)
                    .select('id, full_name, avatar_url, handicap, email, phone, total_rounds, average_score, federation_code')
                    .in('id', userIds);
                
                if (profilesData) {
                    profilesData.forEach((p: any) => {
                        profilesMap[p.id] = p;
                    });
                }
            }

            const manualGuestEntries = tournament.guests ? tournament.guests.split('\n').filter(Boolean).map(g => {
                const [name, code] = g.split('|');
                return { name: name?.trim() || '', code: code?.trim() || '' };
            }) : [];

            const registeredParticipants = (registrations || []).map((reg: any) => {
                const profile = reg.user_id ? profilesMap[reg.user_id] : null;
                const nameMatch = reg.player_name || profile?.full_name || 'Invitado';

                const matchingGuest = manualGuestEntries.find(g =>
                    g.name.toLowerCase() === nameMatch.trim().toLowerCase()
                );
                const isSpecialGuest = !!matchingGuest;
                const isCompanion = !reg.player_handicap && !reg.player_federation_code && !isSpecialGuest;
                const finalIsGuest = isSpecialGuest;

                return {
                    id: reg.id,
                    user_id: reg.user_id,
                    registration_status: reg.registration_status,
                    full_name: nameMatch,
                    email: reg.player_email || profile?.email,
                    phone: reg.player_phone || profile?.phone,
                    handicap: reg.player_handicap ?? profile?.handicap,
                    avatar_url: profile?.avatar_url,
                    total_rounds: profile?.total_rounds,
                    average_score: profile?.average_score,
                    federation_code: reg.player_federation_code || profile?.federation_code || matchingGuest?.code,
                    payment_date: reg.payment_date,
                    is_guest: finalIsGuest,
                    is_companion: isCompanion
                };
            });

            const manualGuestParticipants = manualGuestEntries
                .filter((g: any) => !registeredParticipants.some((p: any) => p.full_name?.trim().toLowerCase() === g.name.toLowerCase()))
                .map((g: any, index: number) => ({
                    id: `manual-guest-${index}`,
                    user_id: null,
                    registration_status: 'Invitado',
                    full_name: g.name,
                    email: null,
                    phone: null,
                    handicap: null,
                    avatar_url: null,
                    total_rounds: null,
                    average_score: null,
                    federation_code: g.code,
                    payment_date: null,
                    is_guest: true
                }));

            setParticipants([...registeredParticipants, ...manualGuestParticipants]);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const togglePaymentStatus = async (participantId: string, currentStatus: string | null) => {
        if (participantId.startsWith('manual-guest-')) return;

        const newStatus = currentStatus === 'paid' ? 'registered' : 'paid';
        const now = new Date().toISOString();

        try {
            const { error } = await supabase
                .from('tournament_registrations')
                .update({
                    registration_status: newStatus,
                    payment_date: newStatus === 'paid' ? now : null
                })
                .eq('id', participantId);

            if (error) throw error;

            setParticipants(prev => prev.map(p =>
                p.id === participantId ? { ...p, registration_status: newStatus, payment_date: newStatus === 'paid' ? now : null } : p
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
            (statusFilter === 'registered' && p.registration_status !== 'paid' && p.registration_status !== 'Confirmado' && !p.is_guest && !p.is_companion) ||
            (statusFilter === 'guests' && p.is_guest) ||
            (statusFilter === 'companions' && p.is_companion);

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
            const newSelected = Array.from(new Set([...selectedIds, ...filteredParticipants.map(p => p.id)]));
            setSelectedIds(newSelected);
        }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteSelected = async () => {
        if (selectedIds.length === 0) return;
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        setIsDeleting(true);
        try {
            // Verify user is authenticated
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes estar autenticado para eliminar participantes.');
                return;
            }

            const manualIds = selectedIds.filter(id => id.startsWith('manual-guest-'));
            const registeredIds = selectedIds.filter(id => !id.startsWith('manual-guest-'));

            // 1. Delete Registered Participants
            if (registeredIds.length > 0) {
                console.log('[DELETE] User:', user.id, 'Attempting to delete IDs:', registeredIds);

                const { error, count, status, statusText } = await (supabase
                    .from('tournament_registrations') as any)
                    .delete({ count: 'exact' })
                    .in('id', registeredIds);

                console.log('[DELETE] Result:', { error, count, status, statusText });

                if (error) {
                    console.error('[DELETE] Error:', error);
                    alert(`Error de base de datos: ${error.message}\nCódigo: ${error.code}\nDetalles: ${error.details || 'ninguno'}`);
                    throw error;
                }

                if (count === 0) {
                    alert('⚠️ No se eliminó ningún registro.\n\nPosibles causas:\n1. Políticas de seguridad (RLS) bloquean la eliminación.\n2. Los registros ya no existen.\n\nSolución: Agregar una política DELETE en Supabase para tournament_registrations.');
                    setShowDeleteConfirm(false);
                    setIsDeleting(false);
                    return;
                }

                console.log(`[DELETE] ✅ Eliminados ${count} registros exitosamente`);
            }

            // 2. Delete Manual Guests from Tournament table
            if (manualIds.length > 0) {
                const namesToDelete = participants
                    .filter(p => manualIds.includes(p.id))
                    .map(p => p.full_name?.toLowerCase().trim());

                const { data: tournament } = await supabase
                    .from('tournaments')
                    .select('guests')
                    .eq('id', id || '')
                    .single();

                if (tournament?.guests) {
                    const remainingGuests = tournament.guests
                        .split('\n')
                        .filter((g: string) => {
                            const [name] = g.split('|');
                            return !namesToDelete.includes(name?.toLowerCase().trim());
                        })
                        .join('\n');

                    await supabase
                        .from('tournaments')
                        .update({ guests: remainingGuests })
                        .eq('id', id || '');
                }
            }

            setParticipants(prev => prev.filter(p => !selectedIds.includes(p.id)));
            setSelectedIds([]);
            setShowDeleteConfirm(false);
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } catch (err: any) {
            console.error('Error deleting participants:', err);
            alert(`No se pudo eliminar: ${err.message || 'Error desconocido'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const sendBulkEmail = () => {
        const selectedParticipants = participants.filter(p => selectedIds.includes(p.id));
        const emails = selectedParticipants.map(p => p.email).filter(Boolean).join(',');

        if (!emails) {
            alert('No hay correos electrónicos disponibles para los participantes seleccionados.');
            return;
        }

        try {
            navigator.clipboard.writeText(emails);
            setCopiedEmails(true);
            setTimeout(() => setCopiedEmails(false), 3000);
        } catch (err) {
            console.error('Error copying to clipboard:', err);
        }

        const mailtoUrl = `mailto:?bcc=${emails}&subject=Información Torneo: ${tournamentName}`;
        const link = document.createElement('a');
        link.href = mailtoUrl;
        link.target = '_self';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const downloadExcel = () => {
        const targetParticipants = selectedIds.length > 0 
            ? participants.filter(p => selectedIds.includes(p.id))
            : participants;

        if (targetParticipants.length === 0) {
            alert('No hay participantes para descargar');
            return;
        }

        const headers = ['Nombre', 'Email', 'Teléfono', 'Handicap', 'Federación', 'Estado', 'Fecha Pago', 'Invitado'];
        const csvContent = [
            "\ufeff" + headers.join(','), // Add BOM for Excel UTF-8 support
            ...targetParticipants.map(p => [
                `"${(p.full_name || '').replace(/"/g, '""')}"`,
                `"${(p.email || '').replace(/"/g, '""')}"`,
                `"${(p.phone || '').replace(/"/g, '""')}"`,
                p.handicap ?? '',
                `"${(p.federation_code || '').replace(/"/g, '""')}"`,
                `"${(p.registration_status || '').replace(/"/g, '""')}"`,
                p.payment_date ? `"${new Date(p.payment_date).toLocaleDateString()}"` : '',
                p.is_guest ? 'SI' : 'NO'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `participantes_${tournamentName.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const isAllFilteredSelected = filteredParticipants.length > 0 && filteredParticipants.every(p => selectedIds.includes(p.id));

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            zIndex: 3000,
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
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            style={{
                                background: 'linear-gradient(135deg, #123B2A 0%, #062e24 100%)',
                                padding: '35px 25px',
                                borderRadius: '35px',
                                width: '100%',
                                maxWidth: '350px',
                                textAlign: 'center',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                            }}
                        >
                            <div style={{
                                width: '70px', height: '70px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                border: '1px solid rgba(239, 68, 68, 0.2)'
                            }}>
                                <Trash2 size={32} color="#ef4444" />
                            </div>
                            <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '12px' }}>¿Confirmar Eliminación?</h2>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', lineHeight: '1.5', marginBottom: '30px' }}>
                                Estás por eliminar <strong>{selectedIds.length}</strong> participante(s). Esta acción no se puede deshacer.
                            </p>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        borderRadius: '18px',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer'
                                    }}
                                >
                                    CANCELAR
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    disabled={isDeleting}
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        borderRadius: '18px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '12px',
                                        fontWeight: '900',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    {isDeleting ? '...' : 'ELIMINAR'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {!selectedParticipant && <PageHero opacity={0.75} />}

            <div style={styles.headerArea}>
                <PageHeader
                    noMargin
                    title={tournamentName || 'Participantes'}
                    onBack={() => navigate('/my-events', { state: { restoreTournamentId: id } })}
                    rightElement={
                        <button
                            onClick={downloadExcel}
                            style={{
                                background: 'rgba(163, 230, 53, 0.1)',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                color: 'var(--secondary)',
                                padding: '8px 12px',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                fontSize: '11px',
                                fontWeight: '900',
                                cursor: 'pointer'
                            }}
                        >
                            <Download size={14} /> EXCEL
                        </button>
                    }
                />
            </div>

            <div style={styles.contentContainer}>
                {!selectedParticipant && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            <Search
                                style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)', opacity: 0.8 }}
                                size={18}
                                strokeWidth={2.5}
                            />
                            <input
                                type="text"
                                placeholder="Buscar jugador..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    paddingLeft: '48px',
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '16px',
                                    height: '50px',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    boxSizing: 'border-box',
                                    outline: 'none',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                            />
                        </div>

                        <div style={{
                            display: 'flex',
                            gap: '8px',
                            overflowX: 'auto',
                            paddingBottom: '5px',
                            msOverflowStyle: 'none',
                            scrollbarWidth: 'none'
                        }}>
                            {[
                                { id: 'all', label: 'Todos', icon: <Users size={14} /> },
                                { id: 'paid', label: 'Pagos', icon: <CheckCircle2 size={14} /> },
                                { id: 'registered', label: 'Pendientes', icon: <Clock size={14} /> },
                                { id: 'guests', label: 'Invitados', icon: <User size={14} /> },
                                { id: 'companions', label: 'Acompañantes', icon: <Users size={14} /> }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id as any)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        padding: '10px 18px',
                                        borderRadius: '16px',
                                        background: statusFilter === filter.id ? 'var(--secondary)' : 'rgba(255,255,255,0.04)',
                                        color: statusFilter === filter.id ? 'var(--primary)' : 'rgba(255,255,255,0.6)',
                                        border: '1px solid ' + (statusFilter === filter.id ? 'var(--secondary)' : 'rgba(255,255,255,0.08)'),
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        whiteSpace: 'nowrap',
                                        transition: 'all 0.3s ease',
                                        cursor: 'pointer',
                                        boxShadow: statusFilter === filter.id ? '0 4px 12px rgba(163, 230, 53, 0.2)' : 'none'
                                    }}
                                >
                                    {filter.icon} {filter.label}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={() => handleSelectAll(isAllFilteredSelected)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                padding: '12px',
                                borderRadius: '16px',
                                background: isAllFilteredSelected ? 'rgba(163, 230, 53, 0.08)' : 'rgba(255,255,255,0.02)',
                                color: isAllFilteredSelected ? 'var(--secondary)' : 'rgba(255,255,255,0.4)',
                                border: '1px solid ' + (isAllFilteredSelected ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.06)'),
                                fontSize: '12px',
                                fontWeight: '900',
                                cursor: 'pointer',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                transition: 'all 0.2s'
                            }}
                        >
                            {isAllFilteredSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                            {isAllFilteredSelected ? 'Deseleccionar Todos' : 'Seleccionar Todos'}
                        </button>
                    </div>
                )}

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {[1, 2, 3, 4].map(i => <Skeleton key={i} height="80px" borderRadius="24px" />)}
                        </div>
                    ) : selectedParticipant ? (
                        <div className="animate-fade-in" style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '20px' }}>
                            {/* Detail View remains similar but we ensure it matches premium style */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', textAlign: 'left' }}>
                                <div style={{ width: '85px', height: '85px', borderRadius: '25px', overflow: 'hidden', border: '3px solid var(--secondary)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)', flexShrink: 0 }}>
                                    <img
                                        src={selectedParticipant.avatar_url || `https://ui-avatars.com/api/?name=${selectedParticipant.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt={selectedParticipant.full_name || 'User'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ fontSize: '22px', fontWeight: '950', color: 'white', marginBottom: '6px', lineHeight: 1.1 }}>{selectedParticipant.full_name}</h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(163, 230, 53, 0.1)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginRight: '5px', fontWeight: '700' }}>HCP:</span>
                                            <span style={{ color: 'var(--secondary)', fontWeight: '900', fontSize: '12px' }}>{selectedParticipant.handicap ?? '--'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginRight: '5px', fontWeight: '700' }}>FED:</span>
                                            <span style={{ color: 'white', fontWeight: '900', fontSize: '12px' }}>{selectedParticipant.federation_code ?? '--'}</span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginRight: '5px', fontWeight: '700' }}>AVG:</span>
                                            <span style={{ color: '#38bdf8', fontWeight: '900', fontSize: '12px' }}>{selectedParticipant.average_score ?? '--'}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '4px 10px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginRight: '5px', fontWeight: '700' }}>RONDAS:</span>
                                            <span style={{ color: 'white', fontWeight: '900', fontSize: '12px' }}>{selectedParticipant.total_rounds ?? 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass" style={{ padding: '20px', borderRadius: '24px', marginBottom: '15px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'rgba(255,255,255,0.3)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información de Contacto</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Mail size={16} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '1px', fontWeight: '700' }}>EMAIL</p>
                                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{selectedParticipant.email || 'No disponible'}</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginBottom: '1px', fontWeight: '700' }}>TELÉFONO</p>
                                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{selectedParticipant.phone || 'No disponible'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(selectedParticipant.registration_status === 'paid' || selectedParticipant.registration_status === 'Confirmado') && selectedParticipant.payment_date && (
                                <div className="glass" style={{ padding: '20px', borderRadius: '24px', marginBottom: '15px', background: 'rgba(163, 230, 53, 0.03)', border: '1px solid rgba(163, 230, 53, 0.1)' }}>
                                    <h4 style={{ fontSize: '11px', fontWeight: '900', color: 'var(--secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información de Pago</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(163, 230, 53, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Clock size={16} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '10px', color: 'rgba(163, 230, 53, 0.5)', marginBottom: '1px', fontWeight: '700' }}>FECHA DE CONFIRMACIÓN</p>
                                            <p style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                                                {new Date(selectedParticipant.payment_date).toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : participants.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.2)', minHeight: '300px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '30px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <Users size={32} strokeWidth={1} style={{ opacity: 0.3 }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '950', color: 'white', marginBottom: '8px', letterSpacing: '-0.3px' }}>Sin participantes</h3>
                            <p style={{ fontSize: '13px', textAlign: 'center', maxWidth: '250px', fontWeight: '500' }}>Aún no hay jugadores inscritos en este torneo.</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {selectedIds.length > 0 && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={sendBulkEmail}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '14px', borderRadius: '18px', background: 'rgba(163, 230, 53, 0.1)', color: 'var(--secondary)',
                                            border: '1px solid rgba(163, 230, 53, 0.2)', fontSize: '11px', fontWeight: '900', cursor: 'pointer'
                                        }}
                                    >
                                        <Mail size={16} /> {copiedEmails ? '¡LISTO!' : `Correo (${selectedIds.length})`}
                                    </motion.button>
                                    <motion.button
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        onClick={handleDeleteSelected}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                            padding: '14px', borderRadius: '18px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.2)', fontSize: '11px', fontWeight: '900', cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={16} /> Borrar ({selectedIds.length})
                                    </motion.button>
                                </div>
                            )}

                            {filteredParticipants.map(p => (
                                <motion.div
                                    key={p.id}
                                    layout
                                    onClick={() => setSelectedParticipant(p)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '14px',
                                        padding: '16px', background: 'rgba(10, 31, 25, 0.8)',
                                        borderRadius: '26px', border: '1px solid rgba(255,255,255,0.04)',
                                        cursor: 'pointer', position: 'relative', backdropFilter: 'blur(20px)',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.2)'
                                    }}
                                >
                                    <div
                                        onClick={(e) => handleSelectParticipant(p.id, e)}
                                        style={{
                                            width: '24px', height: '24px', borderRadius: '8px',
                                            border: '2px solid ' + (selectedIds.includes(p.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.1)'),
                                            background: selectedIds.includes(p.id) ? 'var(--secondary)' : 'rgba(255,255,255,0.02)',
                                            color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.3s ease', flexShrink: 0
                                        }}
                                    >
                                        <CheckCircle2 size={14} strokeWidth={3} style={{ opacity: selectedIds.includes(p.id) ? 1 : 0 }} />
                                    </div>

                                    <div style={{ width: '50px', height: '50px', borderRadius: '16px', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                                        <img
                                            src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt=""
                                        />
                                    </div>

                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: '900', color: 'white', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {p.full_name}
                                            </h4>
                                            {p.is_guest && (
                                                <span style={{ fontSize: '8px', background: 'rgba(163, 230, 53, 0.15)', color: 'var(--secondary)', padding: '2px 6px', borderRadius: '6px', fontWeight: '900', textTransform: 'uppercase' }}>
                                                    INVITADO
                                                </span>
                                            )}
                                            {p.is_companion && (
                                                <span style={{ fontSize: '8px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '6px', fontWeight: '900', textTransform: 'uppercase' }}>
                                                    ACOMPAÑANTE
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {!p.is_companion && (
                                                <>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>HCP: <span style={{ color: 'var(--secondary)' }}>{p.handicap ?? '--'}</span></span>
                                                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>ID: <span style={{ color: 'white' }}>{p.federation_code ?? '--'}</span></span>
                                                </>
                                            )}
                                            {p.is_companion && (
                                                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>Acompañante de Jugador</span>
                                            )}
                                        </div>
                                        {(p.registration_status === 'paid' || p.registration_status === 'Confirmado') && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <div style={{ background: 'var(--secondary)', color: 'var(--primary)', fontSize: '8px', fontWeight: '950', padding: '1px 6px', borderRadius: '5px', textTransform: 'uppercase' }}>PAGADO</div>
                                                {p.payment_date && (
                                                    <span style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', fontWeight: '800' }}>
                                                        {new Date(p.payment_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {!p.is_guest && (
                                        <motion.div
                                            whileTap={{ scale: 0.9 }}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                togglePaymentStatus(p.id, p.registration_status);
                                            }}
                                            style={{
                                                width: '46px', height: '46px', borderRadius: '16px',
                                                background: (p.registration_status === 'paid' || p.registration_status === 'Confirmado') ? 'var(--secondary)' : 'rgba(255,255,255,0.03)',
                                                color: (p.registration_status === 'paid' || p.registration_status === 'Confirmado') ? 'var(--primary)' : 'rgba(255,255,255,0.2)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                border: (p.registration_status === 'paid' || p.registration_status === 'Confirmado') ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <Trophy size={20} strokeWidth={2.5} />
                                        </motion.div>
                                    )}
                                </motion.div>
                            ))}

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 10px 40px', opacity: 0.5 }}>
                                <p style={{ fontSize: '11px', fontWeight: '800', color: 'white' }}>
                                    {filteredParticipants.length} en esta lista
                                </p>
                                {participants.filter(pt => pt.is_guest).length > 0 && (
                                    <p style={{ fontSize: '11px', fontWeight: '800', color: 'var(--secondary)' }}>
                                        {participants.filter(pt => pt.is_guest).length} Invitados
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const styles = {
    pageContainer: {
        position: 'fixed' as 'fixed', inset: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', zIndex: 900
    },
    headerArea: {
        flexShrink: 0,
        position: 'relative' as 'relative',
        zIndex: 10,
        background: 'transparent',
        padding: '0 20px',
        paddingTop: 'var(--header-offset-top)'
    },
    contentContainer: {
        flex: 1,
        position: 'relative' as 'relative',
        zIndex: 10,
        display: 'flex', flexDirection: 'column' as 'column',
        padding: '0 20px',
        overflow: 'hidden'
    }
};

export default TournamentParticipants;
