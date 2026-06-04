import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/SupabaseManager';
import { Trophy, ChevronLeft, Loader2, RefreshCw } from 'lucide-react';
import PageHero from '../components/PageHero';

interface LeaderboardEntry {
    user_id: string;
    full_name: string;
    avatar_url: string | null;
    handicap: number | null;
    total_score: number;
    score_relative_to_par: number;
    holes_played: number;
    position: number | string;
    previous_position?: number | string;
    group_name: string;
    hole_scores: Record<number, number>;
    hole_pars: Record<number, number>;
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
                .select('id, user_id, group_id, notes, status, round_holes(score, par, hole_number)')
                .in('group_id', groupIds)
                .neq('status', 'cancelled');

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
                    group_name: user.group_name,
                    hole_scores: {},
                    hole_pars: {}
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
                        group_name: participantsMap[guestId] || 'Sin Grupo',
                        hole_scores: {},
                        hole_pars: {}
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
                // Priority 2: Match by user_id to user_id in registration
                else if (round.user_id) {
                    matchingRegId = Object.keys(usersMap).find(regId => usersMap[regId].user_id === round.user_id);
                }
                
                // Priority 3: Match by round.user_id being the registration ID itself
                if (!matchingRegId && round.user_id && usersMap[round.user_id]) {
                    matchingRegId = round.user_id;
                }
                
                if (matchingRegId && entriesMap[matchingRegId]) {
                    const holes = round.round_holes || [];
                    let totalStrokes = 0;
                    let relativeToPar = 0;
                    let holesPlayed = 0;
                    const scoresMap: Record<number, number> = {};
                    const parsMap: Record<number, number> = {};

                    holes.forEach((h: any) => {
                        if (h.score > 0) {
                            totalStrokes += h.score;
                            relativeToPar += (h.score - (h.par || 4));
                            holesPlayed++;
                            scoresMap[h.hole_number] = h.score;
                            parsMap[h.hole_number] = h.par || 4;
                        }
                    });

                    // Update the entry if they played holes (we only take the max holes played if there are multiple rounds for some reason)
                    if (holesPlayed > 0 && holesPlayed >= entriesMap[matchingRegId].holes_played) {
                        entriesMap[matchingRegId].total_score = totalStrokes;
                        entriesMap[matchingRegId].score_relative_to_par = relativeToPar;
                        entriesMap[matchingRegId].holes_played = holesPlayed;
                        entriesMap[matchingRegId].hole_scores = scoresMap;
                        entriesMap[matchingRegId].hole_pars = parsMap;
                    }
                }
            });

            const entries = Object.values(entriesMap);


            // 5. Sort entries
            entries.sort((a, b) => {
                // Players who haven't started go to the bottom
                if (a.holes_played > 0 && b.holes_played === 0) return -1;
                if (b.holes_played > 0 && a.holes_played === 0) return 1;
                
                // If both haven't started, sort alphabetically
                if (a.holes_played === 0 && b.holes_played === 0) {
                    return a.full_name.localeCompare(b.full_name);
                }

                // First by relative score
                if (a.score_relative_to_par !== b.score_relative_to_par) {
                    return a.score_relative_to_par - b.score_relative_to_par;
                }
                // Then by holes played (more holes played = better if tied)
                if (a.holes_played !== b.holes_played) {
                    return b.holes_played - a.holes_played; // descending
                }
                
                // Finally alphabetically
                return a.full_name.localeCompare(b.full_name);
            });

            // 6. Assign positions with ties
            let currentPos = 1;
            for (let i = 0; i < entries.length; i++) {
                if (entries[i].holes_played === 0) {
                    entries[i].position = '-';
                } else if (i > 0 && 
                    entries[i].score_relative_to_par === entries[i-1].score_relative_to_par && 
                    entries[i].holes_played === entries[i-1].holes_played) {
                    entries[i].position = entries[i-1].position;
                    currentPos++;
                } else {
                    entries[i].position = currentPos;
                    currentPos++;
                }
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
                        background: '#0a1f19', // Solid classic dark green
                        borderRadius: '8px', 
                        overflow: 'hidden',
                        border: '2px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
                        fontFamily: '"Inter", "Roboto", sans-serif'
                    }}>
                        {/* Scrollable Container */}
                        <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
                            <div style={{ minWidth: '1100px', display: 'flex', flexDirection: 'column' }}>
                                {/* Table Header */}
                                <div style={{ 
                                    display: 'grid', 
                                    gridTemplateColumns: '50px 280px 60px 60px repeat(18, 40px)', 
                                    background: '#04100c',
                                    borderBottom: '2px solid rgba(255,255,255,0.2)',
                                    fontSize: '11px',
                                    fontWeight: '900',
                                    color: 'rgba(255,255,255,0.7)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '1px'
                                }}>
                                    <div style={{ padding: '12px 0', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'sticky', left: 0, background: '#04100c', zIndex: 10 }}>POS</div>
                                    <div style={{ padding: '12px 15px', borderRight: '1px solid rgba(255,255,255,0.1)', position: 'sticky', left: '50px', background: '#04100c', zIndex: 10 }}>JUGADOR</div>
                                    <div style={{ padding: '12px 0', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>SCORE</div>
                                    <div style={{ padding: '12px 0', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.1)' }}>THRU</div>
                                    {[...Array(18)].map((_, i) => (
                                        <div key={i} style={{ padding: '12px 0', textAlign: 'center', borderRight: i === 8 ? '1px dashed rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                                            {i + 1}
                                        </div>
                                    ))}
                                </div>

                        {/* Table Body */}
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <AnimatePresence>
                                {leaderboard.map((entry, index) => {
                                    const isLeader = entry.position === 1 && entry.holes_played > 0;
                                    const isEvenRow = index % 2 === 0;
                                    
                                    let rowBg = isEvenRow ? 'rgba(255,255,255,0.03)' : 'transparent';
                                    
                                    // Classic PGA style for the leader POS block
                                    let posBg = 'transparent';
                                    let posColor = 'white';
                                    if (isLeader) {
                                        posBg = '#FBBF24'; // Solid yellow
                                        posColor = '#000000'; // Black text
                                    }
                                     return (
                                        <React.Fragment key={entry.user_id}>
                                            <div
                                                style={{ 
                                                    display: 'grid',
                                                    gridTemplateColumns: '50px 280px 60px 60px repeat(18, 40px)', 
                                                    background: rowBg,
                                                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                                                    alignItems: 'stretch'
                                                }}
                                            >
                                                {/* POS */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center', 
                                                    background: isLeader ? posBg : '#04100c', // Match header background when sticky if not leader
                                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                                    position: 'sticky',
                                                    left: 0,
                                                    zIndex: 5
                                                }}>
                                                    <span style={{ 
                                                        fontSize: '16px', 
                                                        fontWeight: '900', 
                                                        color: posColor,
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {entry.position}
                                                    </span>
                                                </div>

                                                {/* PLAYER */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    padding: '12px 15px',
                                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                                    overflow: 'hidden',
                                                    position: 'sticky',
                                                    left: '50px',
                                                    background: '#04100c',
                                                    zIndex: 5
                                                }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                                        <span style={{ 
                                                            fontSize: '15px', 
                                                            fontWeight: '800', 
                                                            color: 'white',
                                                            whiteSpace: 'nowrap',
                                                            overflow: 'hidden',
                                                            textOverflow: 'ellipsis',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px'
                                                        }}>
                                                            {entry.full_name}
                                                        </span>
                                                        {entry.group_name !== 'Sin Grupo' && (
                                                            <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', marginTop: '2px', textTransform: 'uppercase' }}>
                                                                {entry.group_name} {entry.handicap !== null && `• HCP ${entry.handicap}`}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* SCORE */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    borderRight: '1px solid rgba(255,255,255,0.1)',
                                                    background: 'rgba(0,0,0,0.2)'
                                                }}>
                                                    <span style={{ 
                                                        fontSize: '18px', 
                                                        fontWeight: '900',
                                                        color: getScoreColor(entry.score_relative_to_par, entry.holes_played),
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {getScoreFormat(entry.score_relative_to_par, entry.holes_played)}
                                                    </span>
                                                </div>

                                                {/* THRU */}
                                                <div style={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    borderRight: '1px solid rgba(255,255,255,0.1)'
                                                }}>
                                                    <span style={{ 
                                                        color: entry.holes_played === 18 ? 'var(--secondary)' : 'white',
                                                        fontSize: '14px', 
                                                        fontWeight: '800',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {entry.holes_played === 18 ? 'F' : (entry.holes_played > 0 ? entry.holes_played : '-')}
                                                    </span>
                                                </div>

                                                {/* HOLES 1-18 */}
                                                {[...Array(18)].map((_, i) => {
                                                    const holeNum = i + 1;
                                                    const score = entry.hole_scores[holeNum];
                                                    const par = entry.hole_pars[holeNum] || 4;
                                                    let content = <span style={{ color: 'rgba(255,255,255,0.15)' }}>-</span>;
                                                    
                                                    if (score && score > 0) {
                                                        const diff = score - par;
                                                        if (diff < 0) {
                                                            content = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', border: '1.5px solid #ef4444', color: '#ef4444', fontWeight: '900', fontSize: '11px', margin: '0 auto' }}>{score}</div>;
                                                        } else if (diff > 0) {
                                                            content = <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', border: '1.5px solid #60a5fa', color: '#60a5fa', fontWeight: '900', fontSize: '11px', margin: '0 auto' }}>{score}</div>;
                                                        } else {
                                                            content = <span style={{ color: 'white', fontWeight: '800', fontSize: '13px' }}>{score}</span>;
                                                        }
                                                    }

                                                    return (
                                                        <div key={holeNum} style={{ 
                                                            display: 'flex', 
                                                            alignItems: 'center', 
                                                            justifyContent: 'center',
                                                            borderRight: holeNum === 9 ? '1px dashed rgba(255,255,255,0.3)' : '1px solid rgba(255,255,255,0.05)',
                                                            background: score ? 'transparent' : 'rgba(255,255,255,0.01)'
                                                        }}>
                                                            {content}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </React.Fragment>
                                    );
                                })}
                            </AnimatePresence>
                            </div>
                        </div>
                    </div>
                    </div>
                )}
            </div>
        </div>
    );
};


export default TournamentLeaderboard;
