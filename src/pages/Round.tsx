import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, History } from 'lucide-react';
import type { GolfCourse } from '../data/courses';
import { supabase } from '../services/SupabaseManager';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { fetchWeather, type WeatherData } from '../services/WeatherService';
import { Wind, Navigation, Trophy, Thermometer, Droplets, Sun, CloudRain } from 'lucide-react';
import { motion } from 'framer-motion';
import { COLOMBIAN_COURSES } from '../data/courses';
const getWindDirection = (degrees?: number) => {
    if (degrees === undefined) return 'Variable';
    const sectors = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return sectors[Math.round(degrees / 45) % 8];
};

const getClubRecommendation = (distance: number | null, windSpeed: number = 0, windDir: string = 'N') => {
    if (distance === null) return 'Localizando...';
    let adjDistance = distance;
    const isHeadwind = windDir.includes('N');
    const isTailwind = windDir.includes('S');

    if (windSpeed > 5) {
        if (isHeadwind) adjDistance += (windSpeed * 0.7);
        if (isTailwind) adjDistance -= (windSpeed * 0.4);
    }

    if (adjDistance > 230) return 'Driver';
    if (adjDistance > 200) return 'Madera 3';
    if (adjDistance > 185) return 'Híbrido';
    if (adjDistance > 170) return 'Hierro 4';
    if (adjDistance > 160) return 'Hierro 5';
    if (adjDistance > 150) return 'Hierro 6';
    if (adjDistance > 140) return 'Hierro 7';
    if (adjDistance > 130) return 'Hierro 8';
    if (adjDistance > 120) return 'Hierro 9';
    if (adjDistance > 100) return 'Pitching Wedge';
    if (adjDistance > 80) return 'Gap Wedge';
    if (adjDistance > 60) return 'Sand Wedge';
    return 'Lob Wedge / Putter';
};

const Round: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const searchParams = new URLSearchParams(location.search);
    const urlGroupId = searchParams.get('group_id');

    const {
        course: stateCourse,
        recorrido: stateRecorrido,
        groupId: stateGroupId
    } = (location.state as { course?: GolfCourse; recorrido?: string; groupId?: string }) || {};

    const [course, setCourse] = React.useState<GolfCourse | undefined>(() => {
        if (stateCourse) return stateCourse;
        const saved = localStorage.getItem('round_course');
        return saved ? JSON.parse(saved) : undefined;
    });
    const [recorrido] = React.useState<string | undefined>(() => {
        if (stateRecorrido) return stateRecorrido;
        const saved = localStorage.getItem('round_recorrido');
        return saved || undefined;
    });
    const groupId = stateGroupId || urlGroupId || localStorage.getItem('round_group_id') || undefined;

    const clubName = course?.club || 'Cargando campo...';
    const fieldName = recorrido ? `${course?.name} - ${recorrido}` : (course?.name || 'Localizando...');
    const [holeData, setHoleData] = React.useState<any[]>([]);

    // Hooks
    const { calculateDistance } = useGeoLocation();

    // GPS Logic
    const targetLat = course?.lat || 0;
    const targetLon = course?.lon || 0;
    const distanceToHole = calculateDistance(targetLat, targetLon);

    // Restauramos estados
    const [currentHole, setCurrentHole] = React.useState(() => {
        const saved = localStorage.getItem('round_current_hole');
        return saved ? parseInt(saved) : 1;
    });
    const [weather, setWeather] = React.useState<WeatherData | null>(null);
    const [strokes, setStrokes] = React.useState<Record<number, number>>(() => {
        const saved = localStorage.getItem('round_strokes');
        return saved ? JSON.parse(saved) : {};
    });
    const [isSaving, setIsSaving] = React.useState(false);
    const [roundId, setRoundId] = React.useState<string | null>(() => {
        const saved = localStorage.getItem('round_id');
        return saved || null;
    });
    const [groupMembers, setGroupMembers] = React.useState<any[]>([]);
    const [groupScores, setGroupScores] = React.useState<Record<string, number>>({});
    const [groupCurrentHoles, setGroupCurrentHoles] = React.useState<Record<string, number>>({});
    const [isLeaderboardOpen, setIsLeaderboardOpen] = React.useState(false);
    const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
    const hasNavigatedRef = React.useRef(false);
    const realtimeTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    // Guardar estado en localStorage cuando cambie
    React.useEffect(() => {
        if (roundId && !isSaving) {
            localStorage.setItem('round_current_hole', currentHole.toString());
            localStorage.setItem('round_strokes', JSON.stringify(strokes));
            localStorage.setItem('round_id', roundId);
            localStorage.setItem('round_course', JSON.stringify(course));
            localStorage.setItem('round_recorrido', recorrido || '');
            localStorage.setItem('round_group_id', groupId || '');
        }
    }, [currentHole, strokes, roundId, course, recorrido, groupId]);

    // Limpiar localStorage al finalizar la ronda
    const clearRoundState = () => {
        localStorage.removeItem('round_current_hole');
        localStorage.removeItem('round_strokes');
        localStorage.removeItem('round_id');
        localStorage.removeItem('round_course');
        localStorage.removeItem('round_recorrido');
        localStorage.removeItem('round_group_id');
    };

    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            setCurrentUserId(data.user?.id || null);
        });
    }, []);



    const currentStrokes = strokes[currentHole] || 0;

    // Datos del hoyo actual
    const currentHoleInfo = holeData.find(h => h.hole_number === currentHole) || { par: 4, handicap: currentHole };

    React.useEffect(() => {
        const fetchHoles = async () => {
            if (!course?.id) return;
            try {
                let query = supabase
                    .from('course_holes')
                    .select('*')
                    .eq('course_id', course.id);

                if (recorrido) {
                    query = query.eq('recorrido', recorrido);
                }

                const { data, error } = await query;

                if (error) {
                    console.error('Error fetching holes:', error);
                } else if (data && data.length > 0) {
                    setHoleData(data);
                } else {
                    const par72 = [4, 4, 3, 5, 4, 4, 3, 4, 5, 4, 4, 3, 5, 4, 4, 3, 4, 5];
                    setHoleData(par72.map((p, i) => ({
                        hole_number: i + 1,
                        par: p,
                        handicap: i + 1
                    })));
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchHoles();
    }, [course, recorrido]);

    React.useEffect(() => {
        const loadWeather = async () => {
            if (course?.lat && course?.lon) {
                const data = await fetchWeather(course.lat, course.lon);
                setWeather(data);
            }
        };
        loadWeather();
    }, [course]);

    // Live Leaderboard Fetching & Subscription
    React.useEffect(() => {
        if (!groupId) return;

        const fetchGroupData = async () => {
            try {
                // 1. Fetch group members with their profiles
                const { data: members, error: mErr } = await supabase
                    .from('group_members')
                    .select('user_id, profiles(full_name, id_photo_url)')
                    .eq('group_id', groupId);

                if (mErr) throw mErr;
                setGroupMembers(members || []);

                // 2. Initial fetch of scores for all members in this group
                const { data: rounds, error: rErr } = await supabase
                    .from('rounds')
                    .select('id, user_id, round_holes(score, hole_number)')
                    .eq('group_id', groupId);

                if (rErr) throw rErr;

                const scores: Record<string, number> = {};
                const currentHoles: Record<string, number> = {};

                rounds?.forEach(r => {
                    // Calculate total score
                    const total = r.round_holes?.reduce((acc: number, h: any) => acc + (h.score || 0), 0) || 0;
                    scores[r.user_id] = total;

                    // Calculate max hole played
                    if (r.round_holes && r.round_holes.length > 0) {
                        const playedHoles = r.round_holes.map((h: any) => h.hole_number);
                        currentHoles[r.user_id] = Math.max(...playedHoles);
                    } else {
                        currentHoles[r.user_id] = 1; // Default to hole 1
                    }
                });
                setGroupScores(scores);
                setGroupCurrentHoles(currentHoles);
            } catch (err) {
                console.error('Error fetching group leaderboard:', err);
            }
        };

        fetchGroupData();

        // 3. Realtime subscription for score updates
        const channel = supabase
            .channel(`group-scores-${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'round_holes'
                },
                async (payload) => {
                    // When any hole score changes, we re-sum the scores for that user
                    // For efficiency, we can find which round this hole belongs to
                    const newHole = payload.new as any;
                    if (!newHole?.round_id) return;

                    // Fetch the round to see if it belongs to our group
                    const { data: round } = await supabase
                        .from('rounds')
                        .select('user_id, group_id')
                        .eq('id', newHole.round_id)
                        .maybeSingle();

                    if (round?.group_id === groupId) {
                        // Re-fetch total for this specific round/user
                        fetchGroupData();
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    // 4. Realtime subscription for group status (to know when someone else finishes the game)
    React.useEffect(() => {
        if (!groupId) return;

        const channel = supabase
            .channel(`group-status-${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'game_groups',
                    filter: `id=eq.${groupId}`
                },
                async (payload) => {
                    const newStatus = (payload.new as any)?.status;
                    if (newStatus === 'completed' || newStatus === 'cancelled') {
                        // Fetch the user who ended the game
                        const createdBy = (payload.new as any)?.created_by;

                        // Get the user's profile to show their name
                        const { data: userProfile } = await supabase
                            .from('profiles')
                            .select('full_name, email')
                            .eq('id', createdBy)
                            .maybeSingle();

                        const userName = userProfile?.full_name || userProfile?.email || 'Un jugador';
                        const actionText = newStatus === 'cancelled' ? 'cancelado' : 'terminado';

                        // Show modal with user's name
                        setGameEndedMessage({ userName, action: actionText });

                        // Wait for user to see the message, then navigate
                        if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
                        realtimeTimeoutRef.current = setTimeout(() => {
                            if (hasNavigatedRef.current) return;
                            hasNavigatedRef.current = true;
                            sessionStorage.setItem('game_just_finished', 'true');
                            clearRoundState();
                            navigate('/play-mode', { replace: true });
                        }, 2500);
                    }
                }
            )
            .subscribe();

        return () => {
            if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
            supabase.removeChannel(channel);
        };
    }, [groupId, navigate]);

    // Fetch course details if missing (for invited members joining via notification)
    React.useEffect(() => {
        if (!course && groupId) {
            const fetchCourseFromGroup = async () => {
                const { data: group } = await supabase
                    .from('game_groups' as any)
                    .select('course_id, status')
                    .eq('id', groupId)
                    .maybeSingle();

                if (group && (group as any).status === 'completed') {
                    // Safety check: if group is already finished when we join/reload
                    sessionStorage.setItem('game_just_finished', 'true');
                    clearRoundState();
                    navigate('/play-mode', { replace: true });
                    return;
                }

                if (group && (group as any).course_id) {
                    const found = COLOMBIAN_COURSES.find((c: GolfCourse) => c.id === (group as any).course_id);
                    if (found) setCourse(found);
                }
            };
            fetchCourseFromGroup();
        }
    }, [course, groupId, navigate]);

    const handleStrokeChange = (change: number) => {
        const newScore = Math.max(0, (strokes[currentHole] || 0) + change);
        setStrokes(prev => ({
            ...prev,
            [currentHole]: newScore
        }));
        syncHoleScore(currentHole, newScore);
    };

    const handleHoleChange = (direction: 'next' | 'prev') => {
        if (direction === 'next' && currentHole < 18) {
            setCurrentHole(prev => prev + 1);
        } else if (direction === 'prev' && currentHole > 1) {
            setCurrentHole(prev => prev - 1);
        }
    };

    const relativeScore = Object.keys(strokes).reduce((acc, holeNum) => {
        const hNum = parseInt(holeNum);
        const hStrokes = strokes[hNum];
        const hPar = holeData.find(h => h.hole_number === hNum)?.par || 4;
        return acc + (hStrokes - hPar);
    }, 0);

    const getScoreTerm = (par: number, strokes: number) => {
        if (strokes === 0) return 'Inicio';
        if (strokes === 1) return 'Hoyo en Uno';
        const diff = strokes - par;
        if (diff === -4) return 'Cóndor';
        if (diff === -3) return 'Albatros';
        if (diff === -2) return 'Eagle';
        if (diff === -1) return 'Birdie';
        if (diff === 0) return 'Par';
        if (diff === 1) return 'Bogey';
        if (diff === 2) return 'Doble Bogey';
        if (diff === 3) return 'Triple Bogey';
        return `+${diff}`;
    };

    const syncHoleScore = async (holeNum: number, score: number) => {
        if (score === 0) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let currentRoundId = roundId;

            if (!currentRoundId) {
                const { data: newRound, error: rErr } = await supabase
                    .from('rounds')
                    .insert([{
                        user_id: user.id,
                        course_name: clubName,
                        course_location: course?.city || '',
                        status: 'in_progress',
                        date_played: new Date().toISOString(),
                        group_id: groupId
                    }])
                    .select()
                    .maybeSingle();

                if (rErr) throw rErr;
                if (!newRound) throw new Error("No se pudo crear la ronda");
                currentRoundId = newRound.id;
                setRoundId(currentRoundId);
            }

            const holePar = holeData.find(hd => hd.hole_number === holeNum)?.par || 4;

            // Verificamos si ya existe este hoyo para esta ronda para evitar duplicados
            const { data: existingHole } = await supabase
                .from('round_holes')
                .select('id')
                .eq('round_id', currentRoundId)
                .eq('hole_number', holeNum)
                .maybeSingle();

            if (existingHole) {
                await supabase
                    .from('round_holes')
                    .update({ score, par: holePar })
                    .eq('id', existingHole.id);
            } else {
                await supabase
                    .from('round_holes')
                    .insert([{
                        round_id: currentRoundId,
                        hole_number: holeNum,
                        par: holePar,
                        score: score
                    }]);
            }
        } catch (err) {
            console.error('Error syncing score:', err);
        }
    };

    const handleCancelGame = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            // 1. Mark the ENTIRE group game as cancelled
            if (groupId) {
                const { error: groupError } = await supabase
                    .from('game_groups' as any)
                    .update({ status: 'cancelled' })
                    .eq('id', groupId);

                if (groupError) {
                    console.error('Error cancelling game_groups:', groupError);
                    throw new Error(`No se pudo cancelar el juego: ${groupError.message}`);
                }

                // 2. Update ALL rounds in this group to cancelled
                const { error: roundsError } = await supabase
                    .from('rounds')
                    .update({ status: 'cancelled' })
                    .eq('group_id', groupId);

                if (roundsError) {
                    console.warn('Error updating rounds status:', roundsError);
                }

                console.log('✅ Juego cancelado exitosamente');
            }

            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

        } catch (error) {
            console.error('Error al cancelar juego:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'Error desconocido al cancelar el juego';
            alert(`Hubo un problema al cancelar el juego:\n\n${errorMessage}\n\nPor favor, intenta nuevamente.`);
        } finally {
            setIsSaving(false);
            setShowCancelModal(false);

            if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                // Set a flag to prevent auto-redirect in PlayModeSelection
                sessionStorage.setItem('game_just_finished', 'true');

                // Clear localStorage
                clearRoundState();

                // Navigate immediately
                navigate('/play-mode', { replace: true });
            }
        }
    };

    const handleFinishRound = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para finalizar la ronda');
                setIsSaving(false);
                return;
            }

            const holeNumbers = Object.keys(strokes).map(Number);
            const totalScore = holeNumbers.reduce((acc, h) => acc + (strokes[h] || 0), 0);
            const firstNine = holeNumbers.filter(h => h >= 1 && h <= 9).reduce((acc, h) => acc + (strokes[h] || 0), 0);
            const secondNine = holeNumbers.filter(h => h >= 10 && h <= 18).reduce((acc, h) => acc + (strokes[h] || 0), 0);

            if (roundId) {
                // Actualizamos la ronda existente
                const { error: updateError } = await supabase
                    .from('rounds')
                    .update({
                        total_score: totalScore,
                        first_nine_score: firstNine,
                        second_nine_score: secondNine,
                        status: 'completed'
                    })
                    .eq('id', roundId);

                if (updateError) throw updateError;
            } else {
                // Si por alguna razón no se creó en tiempo real, la creamos ahora
                const { data: round, error: roundError } = await supabase
                    .from('rounds')
                    .insert([{
                        user_id: user.id,
                        course_name: clubName,
                        course_location: course?.city || '',
                        date_played: new Date().toISOString(),
                        total_score: totalScore,
                        first_nine_score: firstNine,
                        second_nine_score: secondNine,
                        status: 'completed'
                    }])
                    .select()
                    .maybeSingle();

                if (roundError) throw roundError;
                if (!round) throw new Error("No se pudo crear la ronda");

                if (round && holeNumbers.length > 0) {
                    const holesToInsert = holeNumbers.map(h => ({
                        round_id: round.id,
                        hole_number: h,
                        par: holeData.find(hd => hd.hole_number === h)?.par || 4,
                        score: strokes[h]
                    }));
                    await supabase.from('round_holes').insert(holesToInsert);
                }
            }

            // 3. Mark the ENTIRE group game as completed
            if (groupId) {
                try {
                    // Update game_groups
                    const { error: groupError } = await supabase
                        .from('game_groups' as any)
                        .update({ status: 'completed' })
                        .eq('id', groupId);

                    if (groupError) {
                        console.error('Error updating game_groups status:', groupError);
                        throw new Error(`No se pudo cerrar el juego: ${groupError.message}`);
                    }

                    // Update ALL rounds in this group
                    const { error: roundsError } = await supabase
                        .from('rounds')
                        .update({ status: 'completed' })
                        .eq('group_id', groupId);

                    if (roundsError) {
                        console.warn('Error updating rounds status:', roundsError);
                    }

                    console.log('✅ Juego marcado como completado exitosamente');
                } catch (e) {
                    console.error('❌ Error crítico al cerrar el juego:', e);
                    // Re-throw el error para que sea manejado por el catch principal
                    throw e;
                }
            }


            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);

            if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                // Set a flag to prevent auto-redirect in PlayModeSelection
                sessionStorage.setItem('game_just_finished', 'true');

                // Clear localStorage
                clearRoundState();

                // Navigate immediately
                navigate('/play-mode', { replace: true });
            }
        } catch (error) {
            console.error('Error al finalizar ronda:', error);

            // Determinar mensaje de error específico
            const errorMessage = error instanceof Error
                ? error.message
                : 'Error desconocido al finalizar el juego';

            // Mostrar error específico al usuario
            alert(`Hubo un problema al finalizar el juego:\n\n${errorMessage}\n\nPor favor, intenta nuevamente o contacta a soporte.`);


            if (!hasNavigatedRef.current) {
                hasNavigatedRef.current = true;
                // Set a flag to prevent auto-redirect in PlayModeSelection
                sessionStorage.setItem('game_just_finished', 'true');

                // Clear localStorage
                clearRoundState();

                // Navigate immediately
                navigate('/play-mode', { replace: true });
            }
        } finally {
            setIsSaving(false);
        }
    };

    const [showFinishModal, setShowFinishModal] = React.useState(false);
    const [showCancelModal, setShowCancelModal] = React.useState(false);
    const [gameEndedMessage, setGameEndedMessage] = React.useState<{ userName: string, action: string } | null>(null);

    return (
        <div className="animate-fade" style={{
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            padding: '10px 10px 0 10px',
            width: '100%',
            justifyContent: 'space-between'
        }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>
                            {(() => {
                                const words = clubName.split(' ');
                                if (words.length <= 1) return <span style={{ color: 'white' }}>{clubName}</span>;
                                return (
                                    <>
                                        <span style={{ color: 'white' }}>{words[0]} </span>
                                        <span style={{ color: 'var(--secondary)' }}>{words[1]}</span>
                                        {words.length > 2 && <span style={{ color: 'white' }}> {words.slice(2).join(' ')}</span>}
                                    </>
                                );
                            })()}
                        </h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{fieldName} • Par {course?.club.includes('Lagartos') && recorrido === 'Corea' ? 71 : 72}</p>
                    </div>
                </div>
                <button onClick={() => setShowFinishModal(true)} style={{ color: 'var(--secondary)', fontSize: '13px' }}>Finalizar</button>
            </header>

            {/* Leaderboard Toggle & Content */}
            {groupId && (
                <div style={{ marginBottom: '6px', zIndex: 10 }}>
                    <button
                        onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            border: '1px solid rgba(163, 230, 53, 0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: 'white',
                            cursor: 'pointer'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Trophy size={16} color="var(--secondary)" />
                            <span style={{ fontWeight: '800', fontSize: '12px', textTransform: 'uppercase' }}>Marcador en Vivo</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', marginLeft: '-5px' }}>
                                {groupMembers.slice(0, 3).map((m, i) => (
                                    <div key={i} style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        border: '1.5px solid var(--primary)',
                                        marginLeft: i > 0 ? '-6px' : 0,
                                        overflow: 'hidden',
                                        background: 'var(--secondary)'
                                    }}>
                                        {m.profiles?.id_photo_url ? (
                                            <img src={m.profiles.id_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: 'var(--primary)', fontWeight: 'bold' }}>
                                                {m.profiles?.full_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <ChevronRight size={16} style={{ transform: isLeaderboardOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }} />
                        </div>
                    </button>

                    {isLeaderboardOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                borderTop: 'none',
                                borderBottomLeftRadius: '12px',
                                borderBottomRightRadius: '12px',
                                padding: '10px',
                                overflow: 'hidden'
                            }}
                        >
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {groupMembers.map((member) => {
                                    const score = groupScores[member.user_id] || 0;
                                    return (
                                        <div key={member.user_id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ width: '24px', height: '24px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.1)' }}>
                                                    {member.profiles?.id_photo_url ? (
                                                        <img src={member.profiles.id_photo_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '10px' }}>
                                                            {member.profiles?.full_name?.charAt(0)}
                                                        </div>
                                                    )}
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ color: 'white', fontWeight: '600', fontSize: '12px' }}>
                                                        {member.profiles?.full_name?.split(' ')[0]} {member.user_id === currentUserId ? '(Tú)' : ''}
                                                    </span>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span style={{
                                                            fontSize: '8px',
                                                            background: 'rgba(163, 230, 53, 0.15)',
                                                            color: 'var(--secondary)',
                                                            padding: '1px 6px',
                                                            borderRadius: '6px',
                                                            fontWeight: '900',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            Hoyo {groupCurrentHoles[member.user_id] || 1}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ textAlign: 'right' }}>
                                                    <span style={{ fontSize: '14px', fontWeight: '900', color: score === 0 ? 'var(--text-dim)' : 'var(--secondary)' }}>
                                                        {score || '--'}
                                                    </span>
                                                    <span style={{ fontSize: '8px', color: 'var(--text-dim)', marginLeft: '4px' }}>golpes</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </div>
            )}

            <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 20px', marginBottom: '6px', flexShrink: 0 }}>
                <button onClick={() => handleHoleChange('prev')} disabled={currentHole === 1} style={{ opacity: currentHole === 1 ? 0.3 : 1 }}><ChevronLeft size={20} /></button>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '600' }}>HOYO</span>
                    <div style={{ fontSize: '24px', fontWeight: '800', lineHeight: '1' }}>{currentHole}</div>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Par {currentHoleInfo.par} • Hcp {currentHoleInfo.handicap}</span>
                </div>
                <button onClick={() => handleHoleChange('next')} disabled={currentHole === 18} style={{ opacity: currentHole === 18 ? 0.3 : 1 }}><ChevronRight size={20} /></button>
            </div>

            <div style={{ marginBottom: '6px', padding: '0 5px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '10px', overflowX: 'auto', paddingBottom: '10px', paddingLeft: '5px', paddingRight: '5px', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}>
                    {[
                        { label: 'Eagle', diff: -2, color: '#f59e0b' },
                        { label: 'Birdie', diff: -1, color: 'var(--secondary)' },
                        { label: 'Par', diff: 0, color: '#60a5fa' },
                        { label: 'Bogey', diff: 1, color: '#f87171' },
                        { label: 'D.Bogey', diff: 2, color: '#ef4444' }
                    ].map((item) => {
                        const holePar = currentHoleInfo.par;
                        const scoreValue = holePar + item.diff;
                        const isSelected = currentStrokes === scoreValue;

                        return (
                            <div key={item.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px' }}>
                                <button
                                    onClick={() => {
                                        const scoreValue = currentHoleInfo.par + item.diff;
                                        setStrokes(prev => ({ ...prev, [currentHole]: scoreValue }));
                                        syncHoleScore(currentHole, scoreValue);
                                        if (navigator.vibrate) navigator.vibrate(10);
                                    }}
                                    style={{
                                        width: '50px',
                                        height: '50px',
                                        borderRadius: '50%',
                                        background: isSelected ? item.color : 'white',
                                        color: isSelected ? (item.label === 'Par' || item.label === 'Birdie' ? 'var(--primary)' : 'white') : '#333',
                                        border: isSelected ? `3px solid ${item.color}` : '2px solid rgba(255,255,255,0.1)',
                                        fontSize: '18px',
                                        fontWeight: '800',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: isSelected ? `0 0 20px ${item.color}66` : '0 4px 10px rgba(0,0,0,0.2)',
                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {/* Dimple effect for golf ball */}
                                    {!isSelected && <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '6px 6px' }} />}
                                    {scoreValue}
                                </button>
                                <span style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    color: isSelected ? item.color : 'var(--text-dim)',
                                    letterSpacing: '0.5px'
                                }}>
                                    {item.label}
                                </span>
                            </div>
                        );
                    })}

                    {/* Manual Adjuster */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: '60px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <button
                                onClick={() => handleStrokeChange(-1)}
                                style={{ width: '25px', height: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderTopLeftRadius: '25px', borderBottomLeftRadius: '25px', color: 'white' }}
                            >-</button>
                            <button
                                onClick={() => handleStrokeChange(1)}
                                style={{ width: '25px', height: '50px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderTopRightRadius: '25px', borderBottomRightRadius: '25px', color: 'white' }}
                            >+</button>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
                            {getScoreTerm(currentHoleInfo.par, currentStrokes)}
                        </span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '6px', flexShrink: 0 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px' }}>Puntaje: </span>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: relativeScore > 0 ? '#f87171' : relativeScore < 0 ? 'var(--secondary)' : 'white' }}>
                        {relativeScore === 0 ? 'PAR' : (relativeScore > 0 ? `+${relativeScore}` : relativeScore)}
                    </span>
                </div>
            </div>

            {/* Weather Dashboard - Replaces Distance boxes */}
            <div style={{ marginBottom: '8px', flexShrink: 0 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    <div className="glass" style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <Thermometer size={16} color="var(--secondary)" />
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Temp</div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>{weather?.temp ?? '--'}°</div>
                        <div style={{ fontSize: '8px', color: 'rgba(255,255,255,0.5)', fontWeight: '600', textTransform: 'capitalize' }}>{weather?.condition || 'Despejado'}</div>
                    </div>

                    <div className="glass" style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <Droplets size={16} color="#60a5fa" />
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Hum</div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>{weather?.humidity ?? '--'}%</div>
                    </div>

                    <div className="glass" style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <Sun size={16} color="#f59e0b" />
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>UV</div>
                        <div style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>{weather?.uvIndex ?? '--'}</div>
                    </div>

                    <div className="glass" style={{
                        padding: '12px 4px',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <CloudRain size={16} color="#38bdf8" />
                        <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Lluvia</div>
                        <div style={{ fontSize: '13px', fontWeight: '900', color: 'white' }}>
                            {weather?.precipitation ?? '0'}mm
                        </div>
                        <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', fontWeight: '700' }}>
                            {weather?.precipProb ?? '0'}% Prob.
                        </div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px', marginTop: '8px' }}>
                    <div className="glass" style={{
                        padding: '10px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'rgba(255, 255, 255, 0.03)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Wind size={18} color="var(--secondary)" />
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase', fontWeight: '800' }}>Viento</div>
                                <div style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>
                                    {weather?.wind ? `${weather.wind} km/h` : '--'} {getWindDirection(weather?.windDirection)}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass" style={{
                        padding: '10px 15px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(163, 230, 53, 0.08)',
                        border: '1px solid rgba(163, 230, 53, 0.2)'
                    }}>
                        <Navigation size={18} color="var(--secondary)" />
                        <div style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '9px', color: 'var(--secondary)', textTransform: 'uppercase', fontWeight: '800' }}>Palo Sugerido</div>
                            <div style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>{getClubRecommendation(distanceToHole || 0)}</div>
                        </div>
                    </div>
                </div>
            </div>



            {showFinishModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => setShowFinishModal(false)}>
                    <motion.div initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ width: '100%', background: 'rgba(20, 45, 30, 0.98)', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', padding: 'calc(20px + env(safe-area-inset-top)) 25px 30px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
                            ¿Finalizar <span style={{ color: 'var(--secondary)' }}>Partida</span>?
                        </h2>

                        {groupId ? (
                            <>
                                <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', lineHeight: '1.4' }}>
                                    Elige una opción:
                                </p>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '20px' }}>
                                    <button
                                        onClick={handleFinishRound}
                                        disabled={isSaving}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '14px',
                                            background: 'var(--secondary)',
                                            color: 'var(--primary)',
                                            fontWeight: '800',
                                            border: 'none'
                                        }}
                                    >
                                        {isSaving ? 'Guardando...' : '✅ Guardar mi Score'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowFinishModal(false);
                                            setShowCancelModal(true);
                                        }}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '14px',
                                            background: 'rgba(248, 113, 113, 0.15)',
                                            color: '#f87171',
                                            fontWeight: '700',
                                            border: '1px solid rgba(248, 113, 113, 0.3)'
                                        }}
                                    >
                                        ❌ Terminar Juego para Todos
                                    </button>
                                    <button
                                        onClick={() => setShowFinishModal(false)}
                                        style={{
                                            padding: '14px',
                                            borderRadius: '14px',
                                            background: 'rgba(255,255,255,0.05)',
                                            color: 'white',
                                            border: 'none'
                                        }}
                                    >
                                        Continuar Jugando
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                                <button onClick={() => setShowFinishModal(false)} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>Continuar</button>
                                <button onClick={handleFinishRound} disabled={isSaving} style={{ padding: '14px', borderRadius: '14px', background: 'var(--secondary)', color: 'var(--primary)', fontWeight: '800' }}>{isSaving ? 'Guardando...' : 'Finalizar'}</button>
                            </div>
                        )}
                    </motion.div>
                </div>
            )}

            {showCancelModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => setShowCancelModal(false)}>
                    <motion.div initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ width: '100%', background: 'rgba(45, 20, 20, 0.98)', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', padding: 'calc(20px + env(safe-area-inset-top)) 25px 30px', textAlign: 'center', border: '2px solid rgba(248, 113, 113, 0.3)' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', color: 'white', marginBottom: '8px' }}>
                            ¿Cancelar <span style={{ color: '#f87171' }}>Juego</span>?
                        </h2>
                        <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '20px', lineHeight: '1.4' }}>
                            {groupId
                                ? 'Esta acción terminará el juego para todos los jugadores. No se podrá deshacer.'
                                : 'Se perderán todos los datos de esta ronda.'}
                        </p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                            <button onClick={() => setShowCancelModal(false)} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>Volver</button>
                            <button onClick={handleCancelGame} disabled={isSaving} style={{ padding: '14px', borderRadius: '14px', background: '#f87171', color: 'white', fontWeight: '800' }}>{isSaving ? 'Cancelando...' : 'Sí, Cancelar'}</button>
                        </div>
                    </motion.div>
                </div>
            )}

            {gameEndedMessage && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        style={{
                            background: 'rgba(20, 45, 30, 0.98)',
                            borderRadius: '30px',
                            padding: '40px 30px',
                            textAlign: 'center',
                            maxWidth: '90%',
                            width: '350px',
                            border: '2px solid var(--secondary)'
                        }}
                    >
                        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🏌️</div>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', color: 'white', marginBottom: '12px' }}>
                            Juego <span style={{ color: 'var(--secondary)' }}>Finalizado</span>
                        </h2>
                        <p style={{ fontSize: '16px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
                            <strong style={{ color: 'var(--secondary)' }}>{gameEndedMessage.userName}</strong> ha {gameEndedMessage.action} el juego.
                        </p>
                        <div style={{ marginTop: '24px', height: '4px', background: 'rgba(163, 230, 53, 0.2)', borderRadius: '2px', overflow: 'hidden' }}>
                            <motion.div
                                initial={{ width: '0%' }}
                                animate={{ width: '100%' }}
                                transition={{ duration: 2.5, ease: 'linear' }}
                                style={{ height: '100%', background: 'var(--secondary)' }}
                            />
                        </div>
                        <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)', marginTop: '12px' }}>
                            Regresando al menú...
                        </p>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Round;
