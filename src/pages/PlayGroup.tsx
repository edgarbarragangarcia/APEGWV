import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Navigation, Loader2, User } from 'lucide-react';
import PageHero from '../components/PageHero';

interface GroupParticipant {
    id: string;
    full_name: string;
    avatar_url: string | null;
    handicap: number | null;
}

const PlayGroup: React.FC = () => {
    const { groupSlug, tournamentId, groupId } = useParams<{ groupSlug?: string; tournamentId?: string; groupId?: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const [groupName, setGroupName] = useState('');
    const [resolvedGroupId, setResolvedGroupId] = useState('');
    const [startHole, setStartHole] = useState<number>(1);
    const [participants, setParticipants] = useState<GroupParticipant[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (groupSlug) {
            fetchGroupBySlug(groupSlug);
        } else if (tournamentId && groupId) {
            fetchGroupByIds(tournamentId, groupId);
        }
    }, [groupSlug, tournamentId, groupId]);

    const processGroupData = (tournament: any, group: any) => {
        setTournamentName(tournament.name);
        setGroupName(group.name);
        setResolvedGroupId(group.id);
        setStartHole(group.start_hole || 1);
        return { tournament, group };
    };

    const fetchGroupBySlug = async (slug: string) => {
        setLoading(true);
        try {
            const { data: tournaments, error: tError } = await (supabase
                .from('tournaments') as any)
                .select('id, name, guests, groups');

            if (tError) throw tError;

            let foundTournament: any = null;
            let foundGroup: any = null;

            for (const t of (tournaments || [])) {
                if (t.groups && Array.isArray(t.groups)) {
                    const g = t.groups.find((gr: any) => gr.slug === slug);
                    if (g) {
                        foundTournament = t;
                        foundGroup = g;
                        break;
                    }
                }
            }

            if (!foundTournament || !foundGroup) {
                throw new Error('Grupo no encontrado');
            }

            processGroupData(foundTournament, foundGroup);
            await fetchParticipants(foundTournament, foundGroup);
        } catch (err: any) {
            console.error('Error fetching group by slug:', err);
            setError(err.message || 'Error al cargar el grupo');
        } finally {
            setLoading(false);
        }
    };

    const fetchGroupByIds = async (tId: string, gId: string) => {
        setLoading(true);
        try {
            const { data: tournament, error: tError } = await (supabase
                .from('tournaments') as any)
                .select('id, name, guests, groups')
                .eq('id', tId)
                .single();

            if (tError) throw tError;

            const group = tournament.groups?.find((g: any) => g.id === gId);
            if (!group) {
                throw new Error('Grupo no encontrado');
            }

            processGroupData(tournament, group);
            await fetchParticipants(tournament, group);
        } catch (err: any) {
            console.error('Error fetching group by IDs:', err);
            setError(err.message || 'Error al cargar el grupo');
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async (tournament: any, group: any) => {
        const { data: registrations, error: regError } = await (supabase
            .from('tournament_registrations') as any)
            .select(`
                *,
                profiles (
                    id,
                    full_name,
                    avatar_url,
                    handicap
                )
            `)
            .eq('tournament_id', tournament.id);

        if (regError) throw regError;

        const manualGuestEntries = tournament.guests ? tournament.guests.split('\n').filter(Boolean).map((g: string) => {
            const [name, code] = g.split('|');
            return { name: name?.trim() || '', code: code?.trim() || '' };
        }) : [];

        const groupParticipantsData: GroupParticipant[] = [];

        registrations?.forEach((reg: any) => {
            if (group.participants.includes(reg.id)) {
                const profile = reg.profiles || null;
                const nameMatch = reg.player_name || profile?.full_name || 'Invitado';
                groupParticipantsData.push({
                    id: reg.id,
                    full_name: nameMatch,
                    avatar_url: profile?.avatar_url,
                    handicap: reg.player_handicap ?? profile?.handicap
                });
            }
        });

        group.participants.forEach((pid: string) => {
            if (pid.startsWith('manual-guest-')) {
                const index = parseInt(pid.replace('manual-guest-', ''));
                const guest = manualGuestEntries[index];
                if (guest) {
                    groupParticipantsData.push({
                        id: pid,
                        full_name: guest.name,
                        avatar_url: null,
                        handicap: null
                    });
                }
            }
        });

        setParticipants(groupParticipantsData);
    };

    const handleSelectPlayer = (participant: GroupParticipant) => {
        localStorage.setItem('play_group_selected_participant', participant.id);
        localStorage.setItem('play_group_selected_name', participant.full_name);

        // Configuration for the round
        localStorage.setItem('round_course', JSON.stringify({ id: 'club-militar', club: 'Club Militar de Golf', name: 'Club Militar de Golf', city: 'Sopó', lat: 4.8897, lon: -73.9483 }));
        localStorage.setItem('round_current_hole', startHole.toString());
        localStorage.setItem('round_group_id', resolvedGroupId);

        navigate('/round', { 
            state: { 
                course: { id: 'club-militar', club: 'Club Militar de Golf', name: 'Club Militar de Golf', city: 'Sopó', lat: 4.8897, lon: -73.9483 }, 
                groupId: resolvedGroupId 
            } 
        });
    };

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: 'calc(env(safe-area-inset-top) + 20px) 20px 40px',
            position: 'relative'
        }}>
            <PageHero />
            
            <div style={{ width: '100%', maxWidth: '400px', zIndex: 1, marginTop: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>
                        {tournamentName}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <span style={{ padding: '4px 12px', background: 'rgba(163, 230, 53, 0.2)', color: 'var(--secondary)', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                            {groupName}
                        </span>
                        <span style={{ padding: '4px 12px', background: 'rgba(255, 255, 255, 0.1)', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                            Hoyo Inicio: {startHole}
                        </span>
                    </div>
                </div>

                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                        <Loader2 className="animate-spin" size={32} color="var(--secondary)" />
                    </div>
                ) : error ? (
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', color: '#ef4444', textAlign: 'center' }}>
                        {error}
                    </div>
                ) : (
                    <div className="glass" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '20px', textAlign: 'center' }}>
                            Selecciona tu nombre para jugar
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {participants.length === 0 ? (
                                <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>
                                    No hay jugadores en este grupo.
                                </p>
                            ) : (
                                participants.map((p) => (
                                    <motion.button
                                        key={p.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleSelectPlayer(p)}
                                        style={{
                                            background: 'rgba(255,255,255,0.05)',
                                            border: '1px solid rgba(255,255,255,0.1)',
                                            borderRadius: '16px',
                                            padding: '16px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            cursor: 'pointer',
                                            width: '100%',
                                            textAlign: 'left',
                                            color: 'white'
                                        }}
                                    >
                                        {p.avatar_url ? (
                                            <img src={p.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '12px', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--secondary)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <User size={20} />
                                            </div>
                                        )}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '4px' }}>
                                                {p.full_name}
                                            </div>
                                            {p.handicap !== null && (
                                                <div style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '600' }}>
                                                    HCP {p.handicap}
                                                </div>
                                            )}
                                        </div>
                                        <Navigation size={20} color="var(--text-dim)" />
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlayGroup;
