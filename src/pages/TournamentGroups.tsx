import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Users, Plus, Trash2, Save, Download, GripVertical, UserPlus, X, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import PageHero from '../components/PageHero';
import PageHeader from '../components/PageHeader';

interface GroupParticipant {
    id: string;
    user_id: string | null;
    full_name: string | null;
    avatar_url: string | null;
    handicap: number | null;
    federation_code: string | null;
    registration_status: string | null;
    is_guest?: boolean;
    is_companion?: boolean;
}

interface TournamentGroup {
    id: string;
    name: string;
    tee_time: string;
    participants: string[]; // array of participant IDs
}

const TournamentGroups: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [tournamentName, setTournamentName] = useState('');
    const [participants, setParticipants] = useState<GroupParticipant[]>([]);
    const [groups, setGroups] = useState<TournamentGroup[]>([]);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
    const [draggedParticipant, setDraggedParticipant] = useState<string | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);
    const [showUnassigned, setShowUnassigned] = useState(true);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

    const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    useEffect(() => {
        if (id) fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: tournament, error: tournamentError } = await (supabase
                .from('tournaments') as any)
                .select('name, guests, groups')
                .eq('id', id || '')
                .single();

            if (tournamentError) throw tournamentError;
            setTournamentName(tournament.name);

            // Fetch participants
            const { data: registrations, error: regError } = await (supabase
                .from('tournament_registrations') as any)
                .select(`
                    *,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        handicap,
                        email,
                        phone,
                        federation_code
                    )
                `)
                .eq('tournament_id', id || '');

            if (regError) throw regError;

            const manualGuestEntries = tournament.guests ? tournament.guests.split('\n').filter(Boolean).map((g: string) => {
                const [name, code] = g.split('|');
                return { name: name?.trim() || '', code: code?.trim() || '' };
            }) : [];

            const registeredParticipants: GroupParticipant[] = (registrations || []).map((reg: any) => {
                const profile = reg.profiles || null;
                const nameMatch = reg.player_name || profile?.full_name || 'Invitado';
                const matchingGuest = manualGuestEntries.find((g: { name: string, code: string }) =>
                    g.name.toLowerCase() === nameMatch.trim().toLowerCase()
                );
                const isSpecialGuest = !!matchingGuest;
                const fedCode = reg.player_federation_code || '';
                const isCompanion = fedCode.startsWith('ACOMP:') || (!reg.player_handicap && !fedCode && !isSpecialGuest);

                return {
                    id: reg.id,
                    user_id: reg.user_id,
                    registration_status: reg.registration_status,
                    full_name: nameMatch,
                    handicap: reg.player_handicap ?? profile?.handicap,
                    avatar_url: profile?.avatar_url,
                    federation_code: isCompanion ? null : (reg.player_federation_code || profile?.federation_code || matchingGuest?.code),
                    is_guest: isSpecialGuest,
                    is_companion: isCompanion
                };
            });

            const manualGuestParticipants: GroupParticipant[] = manualGuestEntries
                .filter((g: any) => !registeredParticipants.some((p: any) => p.full_name?.trim().toLowerCase() === g.name.toLowerCase()))
                .map((g: any, index: number) => ({
                    id: `manual-guest-${index}`,
                    user_id: null,
                    registration_status: 'Invitado',
                    full_name: g.name,
                    handicap: null,
                    avatar_url: null,
                    federation_code: g.code,
                    is_guest: true,
                    is_companion: false
                }));

            const allParticipants = [...registeredParticipants, ...manualGuestParticipants];
            setParticipants(allParticipants);

            // Load saved groups
            if (tournament.groups && Array.isArray(tournament.groups) && tournament.groups.length > 0) {
                setGroups(tournament.groups);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            showToast('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getParticipantById = useCallback((pId: string): GroupParticipant | undefined => {
        return participants.find(p => p.id === pId);
    }, [participants]);

    const assignedParticipantIds = groups.flatMap(g => g.participants);
    const unassignedParticipants = participants.filter(p => !assignedParticipantIds.includes(p.id));

    const addGroup = () => {
        const newGroup: TournamentGroup = {
            id: `group-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            name: `Grupo ${groups.length + 1}`,
            tee_time: '',
            participants: []
        };
        setGroups(prev => [...prev, newGroup]);
    };

    const removeGroup = (groupId: string) => {
        setGroups(prev => prev.filter(g => g.id !== groupId));
    };

    const updateGroupName = (groupId: string, name: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, name } : g));
    };

    const updateGroupTeeTime = (groupId: string, teeTime: string) => {
        setGroups(prev => prev.map(g => g.id === groupId ? { ...g, tee_time: teeTime } : g));
    };

    const addParticipantToGroup = (groupId: string, participantId: string) => {
        // Remove from any other group first
        setGroups(prev => prev.map(g => ({
            ...g,
            participants: g.id === groupId
                ? [...g.participants.filter(pid => pid !== participantId), participantId]
                : g.participants.filter(pid => pid !== participantId)
        })));
    };

    const removeParticipantFromGroup = (groupId: string, participantId: string) => {
        setGroups(prev => prev.map(g =>
            g.id === groupId
                ? { ...g, participants: g.participants.filter(pid => pid !== participantId) }
                : g
        ));
    };

    const handleDragStart = (participantId: string) => {
        setDraggedParticipant(participantId);
    };

    const handleDragOver = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverTarget(targetId);
    };

    const handleDragLeave = () => {
        setDragOverTarget(null);
    };

    const handleDrop = (e: React.DragEvent, groupId: string) => {
        e.preventDefault();
        if (draggedParticipant) {
            addParticipantToGroup(groupId, draggedParticipant);
        }
        setDraggedParticipant(null);
        setDragOverTarget(null);
    };

    const handleDropUnassigned = (e: React.DragEvent) => {
        e.preventDefault();
        if (draggedParticipant) {
            // Remove from all groups
            setGroups(prev => prev.map(g => ({
                ...g,
                participants: g.participants.filter(pid => pid !== draggedParticipant)
            })));
        }
        setDraggedParticipant(null);
        setDragOverTarget(null);
    };

    const handleDragEnd = () => {
        setDraggedParticipant(null);
        setDragOverTarget(null);
    };

    const saveGroups = async () => {
        setSaving(true);
        try {
            const { error } = await (supabase
                .from('tournaments') as any)
                .update({ groups })
                .eq('id', id || '');

            if (error) throw error;
            showToast('Grupos guardados exitosamente', 'success');
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        } catch (err: any) {
            console.error('Error saving groups:', err);
            showToast(`Error al guardar: ${err.message || 'desconocido'}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const downloadGroupsExcel = () => {
        if (groups.length === 0) {
            showToast('No hay grupos para descargar', 'warning');
            return;
        }

        const headers = ['Grupo', 'Hora de Salida', 'Jugador', 'Handicap', 'Federación'];
        const csvContent = [
            "\ufeff" + headers.join(','),
            ...groups.flatMap(group =>
                group.participants.map(pId => {
                    const p = getParticipantById(pId);
                    return [
                        `"${group.name}"`,
                        `"${group.tee_time || ''}"`,
                        `"${(p?.full_name || '').replace(/"/g, '""')}"`,
                        p?.handicap ?? '',
                        `"${(p?.federation_code || '').replace(/"/g, '""')}"`
                    ].join(',');
                })
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `grupos_${tournamentName.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const toggleGroupCollapse = (groupId: string) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(groupId)) next.delete(groupId);
            else next.add(groupId);
            return next;
        });
    };

    const participantCard = (p: GroupParticipant, groupId?: string, isDragging?: boolean) => (
        <motion.div
            key={p.id}
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isDragging ? 0.5 : 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            draggable
            onDragStart={() => handleDragStart(p.id)}
            onDragEnd={handleDragEnd}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                background: draggedParticipant === p.id ? 'rgba(163, 230, 53, 0.08)' : 'rgba(255,255,255,0.02)',
                borderRadius: '16px',
                border: `1px solid ${draggedParticipant === p.id ? 'rgba(163, 230, 53, 0.3)' : 'rgba(255,255,255,0.04)'}`,
                cursor: 'grab',
                transition: 'all 0.2s ease',
                userSelect: 'none' as const,
                WebkitUserSelect: 'none' as const,
                touchAction: 'none' as const
            }}
        >
            <GripVertical size={14} color="rgba(255,255,255,0.2)" style={{ flexShrink: 0 }} />

            <div style={{
                width: '36px', height: '36px', borderRadius: '12px',
                overflow: 'hidden', background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0
            }}>
                <img
                    src={p.avatar_url || `https://ui-avatars.com/api/?name=${p.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    alt=""
                />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <p style={{
                        fontSize: '13px', fontWeight: '800', color: 'white',
                        margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                        {p.full_name}
                    </p>
                    {p.is_guest && (
                        <span style={{
                            fontSize: '7px', background: 'rgba(163, 230, 53, 0.15)',
                            color: 'var(--secondary)', padding: '1px 5px', borderRadius: '5px',
                            fontWeight: '900', textTransform: 'uppercase'
                        }}>INV</span>
                    )}
                    {p.is_companion && (
                        <span style={{
                            fontSize: '7px', background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8', padding: '1px 5px', borderRadius: '5px',
                            fontWeight: '900', textTransform: 'uppercase'
                        }}>ACOMP</span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '1px' }}>
                    <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                        HCP: <span style={{ color: 'var(--secondary)' }}>{p.handicap ?? '--'}</span>
                    </span>
                    {p.federation_code && (
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                            ID: <span style={{ color: 'white' }}>{p.federation_code}</span>
                        </span>
                    )}
                </div>
            </div>

            {groupId && (
                <motion.button
                    whileTap={{ scale: 0.85 }}
                    onClick={(e) => {
                        e.stopPropagation();
                        removeParticipantFromGroup(groupId, p.id);
                    }}
                    style={{
                        width: '28px', height: '28px', borderRadius: '9px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, color: '#ef4444'
                    }}
                >
                    <X size={12} strokeWidth={3} />
                </motion.button>
            )}
        </motion.div>
    );

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            {/* Toast Notification */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: -30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        onClick={() => setToast(null)}
                        style={{
                            position: 'fixed',
                            top: '20px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            zIndex: 4000,
                            padding: '14px 24px',
                            borderRadius: '18px',
                            background: toast.type === 'success' ? 'rgba(163, 230, 53, 0.15)'
                                : toast.type === 'error' ? 'rgba(239, 68, 68, 0.15)'
                                    : 'rgba(251, 191, 36, 0.15)',
                            border: `1px solid ${toast.type === 'success' ? 'rgba(163, 230, 53, 0.3)'
                                : toast.type === 'error' ? 'rgba(239, 68, 68, 0.3)'
                                    : 'rgba(251, 191, 36, 0.3)'}`,
                            color: toast.type === 'success' ? 'var(--secondary)'
                                : toast.type === 'error' ? '#ef4444'
                                    : '#fbbf24',
                            fontSize: '13px',
                            fontWeight: '800',
                            backdropFilter: 'blur(20px)',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            maxWidth: '90%',
                            textAlign: 'center' as const,
                            cursor: 'pointer'
                        }}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <PageHero opacity={0.75} />

            <div style={styles.headerArea}>
                <PageHeader
                    noMargin
                    title="Organizar Grupos"
                    onBack={() => navigate(`/my-events/${id}/participants`)}
                    rightElement={
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={downloadGroupsExcel}
                                style={{
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                    color: 'var(--secondary)',
                                    padding: '8px 10px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={13} />
                            </button>
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={saveGroups}
                                disabled={saving}
                                style={{
                                    background: saving ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                    border: 'none',
                                    color: 'var(--primary)',
                                    padding: '8px 14px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 12px rgba(163, 230, 53, 0.2)'
                                }}
                            >
                                <Save size={13} /> {saving ? '...' : 'GUARDAR'}
                            </motion.button>
                        </div>
                    }
                />
            </div>

            <div style={styles.contentContainer}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px 0' }}>
                        {[1, 2, 3].map(i => <Skeleton key={i} height="120px" borderRadius="24px" />)}
                    </div>
                ) : (
                    <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain', paddingBottom: '100px' }}>
                        {/* Stats Bar */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr 1fr',
                            gap: '8px',
                            marginBottom: '18px',
                            marginTop: '5px'
                        }}>
                            <div style={styles.statCard}>
                                <p style={styles.statLabel}>JUGADORES</p>
                                <p style={styles.statValue}>{participants.length}</p>
                            </div>
                            <div style={styles.statCard}>
                                <p style={styles.statLabel}>GRUPOS</p>
                                <p style={styles.statValue}>{groups.length}</p>
                            </div>
                            <div style={styles.statCard}>
                                <p style={styles.statLabel}>SIN GRUPO</p>
                                <p style={{ ...styles.statValue, color: unassignedParticipants.length > 0 ? '#fbbf24' : 'var(--secondary)' }}>
                                    {unassignedParticipants.length}
                                </p>
                            </div>
                        </div>

                        {/* Unassigned Participants */}
                        <div
                            onDragOver={(e) => handleDragOver(e, 'unassigned')}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDropUnassigned}
                            style={{
                                marginBottom: '18px',
                                background: dragOverTarget === 'unassigned' ? 'rgba(251, 191, 36, 0.05)' : 'transparent',
                                borderRadius: '24px',
                                border: dragOverTarget === 'unassigned' ? '2px dashed rgba(251, 191, 36, 0.3)' : '2px dashed transparent',
                                transition: 'all 0.2s ease',
                                padding: dragOverTarget === 'unassigned' ? '4px' : '0'
                            }}
                        >
                            <button
                                onClick={() => setShowUnassigned(!showUnassigned)}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '14px 16px',
                                    background: 'rgba(251, 191, 36, 0.06)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(251, 191, 36, 0.1)',
                                    cursor: 'pointer',
                                    color: '#fbbf24',
                                    marginBottom: showUnassigned ? '10px' : '0'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <UserPlus size={16} />
                                    <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Sin Asignar ({unassignedParticipants.length})
                                    </span>
                                </div>
                                {showUnassigned ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <AnimatePresence>
                                {showUnassigned && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: '6px' }}
                                    >
                                        {unassignedParticipants.length === 0 ? (
                                            <p style={{
                                                textAlign: 'center', color: 'rgba(255,255,255,0.2)',
                                                fontSize: '12px', fontWeight: '700', padding: '15px'
                                            }}>
                                                ✓ Todos los jugadores están asignados
                                            </p>
                                        ) : (
                                            unassignedParticipants.map(p => participantCard(p))
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Groups */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {groups.map((group, groupIndex) => (
                                <motion.div
                                    key={group.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: groupIndex * 0.05 }}
                                    onDragOver={(e) => handleDragOver(e, group.id)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, group.id)}
                                    style={{
                                        background: dragOverTarget === group.id
                                            ? 'rgba(163, 230, 53, 0.04)'
                                            : 'rgba(10, 31, 25, 0.6)',
                                        borderRadius: '24px',
                                        border: dragOverTarget === group.id
                                            ? '2px dashed rgba(163, 230, 53, 0.4)'
                                            : '1px solid rgba(255,255,255,0.04)',
                                        overflow: 'hidden',
                                        backdropFilter: 'blur(20px)',
                                        boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                                        transition: 'border 0.2s ease, background 0.2s ease'
                                    }}
                                >
                                    {/* Group Header */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        padding: '14px 16px',
                                        borderBottom: collapsedGroups.has(group.id) ? 'none' : '1px solid rgba(255,255,255,0.04)'
                                    }}>
                                        <div style={{
                                            width: '36px', height: '36px', borderRadius: '12px',
                                            background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.15) 0%, rgba(163, 230, 53, 0.05) 100%)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            border: '1px solid rgba(163, 230, 53, 0.2)',
                                            color: 'var(--secondary)', fontWeight: '950', fontSize: '14px',
                                            flexShrink: 0
                                        }}>
                                            {groupIndex + 1}
                                        </div>

                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <input
                                                type="text"
                                                value={group.name}
                                                onChange={(e) => updateGroupName(group.id, e.target.value)}
                                                style={{
                                                    background: 'transparent',
                                                    border: 'none',
                                                    color: 'white',
                                                    fontSize: '14px',
                                                    fontWeight: '900',
                                                    padding: 0, margin: 0,
                                                    width: '100%',
                                                    outline: 'none',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                                <Clock size={10} color="rgba(255,255,255,0.3)" />
                                                <input
                                                    type="time"
                                                    value={group.tee_time}
                                                    onChange={(e) => updateGroupTeeTime(group.id, e.target.value)}
                                                    placeholder="Hora"
                                                    style={{
                                                        background: 'transparent',
                                                        border: 'none',
                                                        color: 'rgba(255,255,255,0.5)',
                                                        fontSize: '11px',
                                                        fontWeight: '700',
                                                        padding: 0, margin: 0,
                                                        outline: 'none',
                                                        fontFamily: 'inherit',
                                                        colorScheme: 'dark'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <span style={{
                                            fontSize: '10px', fontWeight: '900',
                                            color: 'rgba(255,255,255,0.3)',
                                            background: 'rgba(255,255,255,0.03)',
                                            padding: '4px 8px',
                                            borderRadius: '8px',
                                            border: '1px solid rgba(255,255,255,0.05)'
                                        }}>
                                            {group.participants.length}
                                        </span>

                                        <button
                                            onClick={() => toggleGroupCollapse(group.id)}
                                            style={{
                                                background: 'rgba(255,255,255,0.03)',
                                                border: '1px solid rgba(255,255,255,0.06)',
                                                borderRadius: '9px',
                                                width: '28px', height: '28px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: 'rgba(255,255,255,0.4)'
                                            }}
                                        >
                                            {collapsedGroups.has(group.id) ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        </button>

                                        <motion.button
                                            whileTap={{ scale: 0.85 }}
                                            onClick={() => removeGroup(group.id)}
                                            style={{
                                                background: 'rgba(239, 68, 68, 0.08)',
                                                border: '1px solid rgba(239, 68, 68, 0.12)',
                                                borderRadius: '9px',
                                                width: '28px', height: '28px',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', color: '#ef4444'
                                            }}
                                        >
                                            <Trash2 size={12} />
                                        </motion.button>
                                    </div>

                                    {/* Group Body */}
                                    {!collapsedGroups.has(group.id) && (
                                        <div style={{ padding: '10px 14px 14px', display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '60px' }}>
                                            <AnimatePresence>
                                                {group.participants.length === 0 ? (
                                                    <motion.div
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            height: '60px',
                                                            borderRadius: '14px',
                                                            border: '1px dashed rgba(255,255,255,0.08)',
                                                            color: 'rgba(255,255,255,0.15)',
                                                            fontSize: '11px',
                                                            fontWeight: '700'
                                                        }}
                                                    >
                                                        Arrastra jugadores aquí
                                                    </motion.div>
                                                ) : (
                                                    group.participants.map(pId => {
                                                        const p = getParticipantById(pId);
                                                        if (!p) return null;
                                                        return participantCard(p, group.id, draggedParticipant === pId);
                                                    })
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))}

                            {/* Add Group Button */}
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                onClick={addGroup}
                                style={{
                                    width: '100%',
                                    padding: '18px',
                                    borderRadius: '22px',
                                    background: 'rgba(163, 230, 53, 0.04)',
                                    border: '2px dashed rgba(163, 230, 53, 0.15)',
                                    color: 'var(--secondary)',
                                    fontSize: '13px',
                                    fontWeight: '900',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                <Plus size={18} strokeWidth={3} /> Agregar Grupo
                            </motion.button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const styles: { [key: string]: React.CSSProperties } = {
    pageContainer: {
        position: 'fixed',
        inset: 0,
        background: 'var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 900
    },
    headerArea: {
        flexShrink: 0,
        position: 'relative',
        zIndex: 10,
        background: 'transparent',
        padding: '0 20px',
        paddingTop: 'var(--header-offset-top)'
    },
    contentContainer: {
        flex: 1,
        position: 'relative',
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        padding: '0 20px',
        overflow: 'hidden'
    },
    statCard: {
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '16px',
        padding: '12px',
        textAlign: 'center' as const,
        border: '1px solid rgba(255,255,255,0.04)'
    },
    statLabel: {
        fontSize: '9px',
        fontWeight: '900',
        color: 'rgba(255,255,255,0.3)',
        margin: 0,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        marginBottom: '4px'
    },
    statValue: {
        fontSize: '20px',
        fontWeight: '950',
        color: 'var(--secondary)',
        margin: 0
    }
};

export default TournamentGroups;
