import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Trophy, ChevronLeft, Loader2, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';
import PageHero from '../components/PageHero';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    handicap: number | null;
    total_score: number;
    score_relative_to_par: number;
    holes_played: number;
    position: number;
    previous_position?: number;
    group_name: string;
}

const TournamentLeaderboard: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isRefreshing, setIsRefreshing] = useState(false);

    useEffect(() => {
        if (slug) {
            fetchTournamentData();
        }
    }, [slug]);

    const fetchTournamentData = async () => {
        setIsRefreshing(true);
        if (leaderboard.length === 0) setLoading(true);
        setError(null);

        try {
            // 1. Fetch tournament by slug
            const { data: tournaments, error: tError } = await (supabase
                .from('tournaments') as any)
                .select('id, name, groups, guests')
                .eq('slug', slug || '');

            if (tError) throw tError;

            const tournament = tournaments?.[0];
            if (!tournament) throw new Error('Torneo no encontrado');

            setTournamentName(tournament.name);

            const groupIds: string[] = [];
            const groupNames: Record<string, string> = {};
            const participantsMap: Record<string, string> = {}; // maps participant ID to group name

            if (tournament.groups && Array.isArray(tournament.groups)) {
                tournament.groups.forEach((g: any) => {
                    if (g.id) {
                        groupIds.push(g.id);
                        groupNames[g.id] = g.name;
                    }
                    if (g.participants && Array.isArray(g.participants)) {
                        g.participants.forEach((pid: string) => {
                            participantsMap[pid] = g.name;
                        });
                    }
                });
            }

            if (groupIds.length === 0) {
                setLeaderboard([]);
                setLoading(false);
                setIsRefreshing(false);
                return;
            }

            // 2. Fetch tournament registrations to get player names & handicap
            const { data: registrations, error: regError } = await supabase
                .from('tournament_registrations')
                .select(`
                    id,
                    user_id,
                    player_name,
                    player_handicap,
                    profiles (
                        id,
                        full_name,
                        avatar_url,
                        handicap
                    )
                `)
                .eq('tournament_id', tournament.id);

            if (regError) throw regError;

            // map reg.id -> name, avatar, handicap, group_name
            const usersMap: Record<string, any> = {};
            registrations?.forEach((reg: any) => {
                const profile = reg.profiles || null;
                const nameMatch = reg.player_name || profile?.full_name || 'Jugador';
                usersMap[reg.id] = {
                    reg_id: reg.id,
                    user_id: reg.user_id,
                    full_name: nameMatch,
                    avatar_url: profile?.avatar_url,
                    handicap: reg.player_handicap ?? profile?.handicap,
                    group_name: participantsMap[reg.id] || 'Sin Grupo'
                };
            });

            // 3. Fetch rounds and hole scores for these groups
            const { data: rounds, error: rError } = await supabase
                .from('rounds')
                .select('id, user_id, group_id, notes, round_holes(score, par, hole_number)')
                .in('group_id', groupIds);

            if (rError) throw rError;

            const entriesMap: Record<string, LeaderboardEntry> = {};

            // Initialize all registered users in the map
            Object.values(usersMap).forEach((user: any) => {
                entriesMap[user.reg_id] = {
                    user_id: user.reg_id, // Use reg_id as the unique key for the UI
                    full_name: user.full_name,
                    avatar_url: user.avatar_url,
                    handicap: user.handicap,
                    total_score: 0,
                    score_relative_to_par: 0,
                    holes_played: 0,
                    position: 0,
                    group_name: user.group_name
                };
            });

            // Parse manual guests
            const manualGuestEntries = tournament.guests ? tournament.guests.split('\n').filter(Boolean).map((g: string) => {
                const [name, code] = g.split('|');
                return { name: name?.trim() || '', code: code?.trim() || '' };
            }) : [];

            manualGuestEntries.forEach((g: any, index: number) => {
                const guestId = `manual-guest-${index}`;
                // Only add if they are not already in registered participants by name (similar to TournamentGroups logic)
                const isAlreadyRegistered = Object.values(usersMap).some((u: any) => u.full_name?.trim().toLowerCase() === g.name.toLowerCase());
                if (!isAlreadyRegistered) {
                    entriesMap[guestId] = {
                        user_id: guestId,
                        full_name: g.name,
                        avatar_url: null,
                        handicap: null,
                        total_score: 0,
                        score_relative_to_par: 0,
                        holes_played: 0,
                        position: 0,
                        group_name: participantsMap[guestId] || 'Sin Grupo'
                    };
                }
            });

            // 4. Calculate scores from rounds
            rounds?.forEach((round: any) => {
                let matchingRegId = null;

                // Priority 1: Check if notes contain the participant ID (used for caddie/admin scoring)
                if (round.notes && round.notes.startsWith('participant:')) {
                    matchingRegId = round.notes.split(':')[1];
                } 
                // Priority 2: Match by user_id
                else if (round.user_id) {
                    matchingRegId = Object.keys(usersMap).find(regId => usersMap[regId].user_id === round.user_id);
                }
                
                if (matchingRegId && entriesMap[matchingRegId]) {
                    const holes = round.round_holes || [];
                    let totalStrokes = 0;
                    let relativeToPar = 0;
                    let holesPlayed = 0;

                    holes.forEach((h: any) => {
                        if (h.score > 0) {
                            totalStrokes += h.score;
                            relativeToPar += (h.score - (h.par || 4));
                            holesPlayed++;
                        }
                    });

                    // Update the entry if they played holes (we only take the max holes played if there are multiple rounds for some reason)
                    if (holesPlayed > 0 && holesPlayed >= entriesMap[matchingRegId].holes_played) {
                        entriesMap[matchingRegId].total_score = totalStrokes;
                        entriesMap[matchingRegId].score_relative_to_par = relativeToPar;
                        entriesMap[matchingRegId].holes_played = holesPlayed;
                    }
                }
            });

            const entries = Object.values(entriesMap);


            // 5. Sort entries
            entries.sort((a, b) => {
                // First by relative score
                if (a.score_relative_to_par !== b.score_relative_to_par) {
                    return a.score_relative_to_par - b.score_relative_to_par;
                }
                // Then by holes played (more holes played = better if tied)
                if (a.holes_played !== b.holes_played) {
                    return b.holes_played - a.holes_played; // descending
                }
                return 0;
            });

            // 6. Assign positions with ties
            let currentPos = 1;
            for (let i = 0; i < entries.length; i++) {
                if (i > 0 && 
                    entries[i].score_relative_to_par === entries[i-1].score_relative_to_par && 
                    entries[i].holes_played === entries[i-1].holes_played) {
                    entries[i].position = entries[i-1].position;
                } else {
                    entries[i].position = currentPos;
                }
                currentPos++;
            }

            // Calculate previous positions to show arrows (we could store this in state and compare)
            setLeaderboard(prev => {
                const newEntries = entries.map(entry => {
                    const prevEntry = prev.find(p => p.user_id === entry.user_id);
                    return {
                        ...entry,
                        previous_position: prevEntry?.position
                    };
                });
                return newEntries;
            });
            
            setLastUpdate(new Date());

        } catch (err: any) {
            console.error('Error fetching leaderboard:', err);
            setError(err.message || 'Error al cargar el Leaderboard');
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    };

    // Real-time subscription to round_holes
    useEffect(() => {
        if (!slug || leaderboard.length === 0) return;

        // Debounce the refresh
        let timeoutId: ReturnType<typeof setTimeout>;

        const channel = supabase
            .channel(`leaderboard-scores-${slug}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'round_holes'
                },
                () => {
                    clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        fetchTournamentData();
                    }, 2000); // Wait 2s before fetching to batch updates
                }
            )
            .subscribe();

        return () => {
            clearTimeout(timeoutId);
            supabase.removeChannel(channel);
        };
    }, [slug, leaderboard.length > 0]); // Dependency trick to only subscribe once we have initial data

    const getScoreFormat = (relative: number, holesPlayed: number) => {
        if (holesPlayed === 0) return '-';
        if (relative === 0) return 'E';
        return relative > 0 ? `+${relative}` : `${relative}`;
    };

    const getScoreColor = (relative: number, holesPlayed: number) => {
        if (holesPlayed === 0) return 'white';
        if (relative < 0) return '#ef4444'; // Red for under par (golf standard)
        if (relative > 0) return 'rgba(255,255,255,0.6)'; // Dim for over par
        return 'var(--secondary)'; // Green for Even
    };

    return (
        <div style={{
            minHeight: '100dvh',
            width: '100%',
            backgroundColor: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative'
        }}>
            <PageHero />
            
            {/* Header Fijo */}
            <div style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                padding: 'calc(env(safe-area-inset-top) + 20px) 20px 20px',
                background: 'linear-gradient(to bottom, rgba(10,31,25,0.95) 60%, rgba(10,31,25,0))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => navigate('/')}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '12px',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                    >
                        <ChevronLeft size={24} />
                    </motion.button>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <h1 style={{ fontSize: '18px', fontWeight: '950', color: 'white', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
                            LEADERBOARD
                        </h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', opacity: 0.7 }}>
                            <span style={{ fontSize: '10px', color: 'var(--secondary)' }}>LIVE</span>
                            <div className="animate-pulse" style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--secondary)' }} />
                        </div>
                    </div>

                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fetchTournamentData()}
                        disabled={isRefreshing}
                        style={{
                            width: '40px', height: '40px',
                            borderRadius: '12px',
                            background: 'transparent',
                            border: 'none',
                            color: 'white',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: isRefreshing ? 0.5 : 1
                        }}
                    >
                        <RefreshCw size={20} className={isRefreshing ? "animate-spin" : ""} />
                    </motion.button>
                </div>

                <div style={{ textAlign: 'center' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'white', margin: '0 0 5px 0' }}>{tournamentName || 'Cargando Torneo...'}</h2>
                    {lastUpdate && (
                        <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', margin: 0 }}>
                            Actualizado: {lastUpdate.toLocaleTimeString()}
                        </p>
                    )}
                </div>
            </div>

            {/* Content */}
            <div style={{ flex: 1, padding: '0 20px 40px', position: 'relative', zIndex: 1 }}>
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '40vh', gap: '20px' }}>
                        <Loader2 className="animate-spin" size={40} color="var(--secondary)" />
                        <p style={{ color: 'var(--secondary)', fontWeight: '600', letterSpacing: '1px' }}>CALCULANDO SCORES...</p>
                    </div>
                ) : error ? (
                    <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', marginTop: '20px' }}>
                        <Trophy size={40} color="#ef4444" style={{ opacity: 0.5, marginBottom: '15px' }} />
                        <p style={{ color: '#ef4444', fontWeight: '600' }}>{error}</p>
                    </div>
                ) : leaderboard.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.1)', marginTop: '20px' }}>
                        <p style={{ color: 'var(--text-dim)' }}>No hay jugadores registrados o grupos asignados para este torneo aún.</p>
                    </div>
                ) : (
                    <div style={{ 
                        background: 'rgba(255,255,255,0.02)', 
                        borderRadius: '24px', 
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.05)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
                    }}>
                        {/* Table Header */}
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: '40px 1fr 50px 50px', 
                            padding: '16px 15px', 
                            background: 'rgba(255,255,255,0.04)',
                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                            fontSize: '10px',
                            fontWeight: '900',
                            color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase',
                            letterSpacing: '1px'
                        }}>
                            <div style={{ textAlign: 'center' }}>POS</div>
                            <div>JUGADOR</div>
                            <div style={{ textAlign: 'center' }}>SCORE</div>
                            <div style={{ textAlign: 'center' }}>THRU</div>
                        </div>

                        {/* Table Body */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <AnimatePresence>
                                {leaderboard.map((entry, index) => {
                                    const isLeader = entry.position === 1 && entry.holes_played > 0;
                                    
                                    // Determine arrow
                                    let arrow = null;
                                    if (entry.previous_position) {
                                        if (entry.position < entry.previous_position) {
                                            arrow = <ArrowUp size={10} color="var(--secondary)" />;
                                        } else if (entry.position > entry.previous_position) {
                                            arrow = <ArrowDown size={10} color="#ef4444" />;
                                        } else {
                                            arrow = <Minus size={10} color="rgba(255,255,255,0.2)" />;
                                        }
                                    }

                                    return (
                                        <motion.div
                                            key={entry.user_id}
                                            layout
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ 
                                                display: 'grid', 
                                                gridTemplateColumns: '40px 1fr 50px 50px', 
                                                padding: '16px 15px',
                                                borderBottom: index < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                                background: isLeader ? 'linear-gradient(90deg, rgba(163, 230, 53, 0.05) 0%, transparent 100%)' : 'transparent',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {/* POS */}
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                                <span style={{ 
                                                    fontSize: '15px', 
                                                    fontWeight: '900', 
                                                    color: isLeader ? 'var(--secondary)' : 'white' 
                                                }}>
                                                    {entry.position}
                                                </span>
                                                {arrow}
                                            </div>

                                            {/* PLAYER */}
                                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', paddingRight: '10px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ 
                                                        fontSize: '14px', 
                                                        fontWeight: '800', 
                                                        color: 'white',
                                                        whiteSpace: 'nowrap',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis'
                                                    }}>
                                                        {entry.full_name}
                                                    </span>
                                                    {entry.handicap !== null && (
                                                        <span style={{ fontSize: '9px', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px', color: 'rgba(255,255,255,0.6)', fontWeight: '700' }}>
                                                            {entry.handicap}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', fontWeight: '600', marginTop: '2px' }}>
                                                    {entry.group_name}
                                                </span>
                                            </div>

                                            {/* SCORE */}
                                            <div style={{ 
                                                textAlign: 'center', 
                                                fontSize: '15px', 
                                                fontWeight: '900',
                                                color: getScoreColor(entry.score_relative_to_par, entry.holes_played)
                                            }}>
                                                {getScoreFormat(entry.score_relative_to_par, entry.holes_played)}
                                            </div>

                                            {/* THRU */}
                                            <div style={{ 
                                                textAlign: 'center', 
                                                fontSize: '13px', 
                                                fontWeight: '700',
                                                color: entry.holes_played === 18 ? 'var(--secondary)' : 'white'
                                            }}>
                                                {entry.holes_played === 18 ? 'F' : (entry.holes_played || '-')}
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TournamentLeaderboard;
