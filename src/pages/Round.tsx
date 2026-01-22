import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, Target, History } from 'lucide-react';
import type { GolfCourse } from '../data/courses';
import { supabase } from '../services/SupabaseManager';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { fetchWeather, type WeatherData } from '../services/WeatherService';
import { Wind, Navigation, Info } from 'lucide-react';
import { motion } from 'framer-motion';

const Round: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { course, recorrido } = (location.state as { course?: GolfCourse; recorrido?: string }) || {};

    const clubName = course?.club || 'Club de Golf';
    const fieldName = recorrido ? `${course?.name} - ${recorrido}` : (course?.name || 'Recorrido Principal');
    const [holeData, setHoleData] = React.useState<any[]>([]);

    // Hooks
    const { calculateDistance } = useGeoLocation();

    // GPS Logic
    const targetLat = course?.lat || 0;
    const targetLon = course?.lon || 0;
    const distanceToHole = calculateDistance(targetLat, targetLon);

    // Restauramos estados
    const [currentHole, setCurrentHole] = React.useState(1);
    const [strokes, setStrokes] = React.useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = React.useState(false);
    const [weather, setWeather] = React.useState<WeatherData | null>(null);
    const [roundId, setRoundId] = React.useState<string | null>(null);

    const caddiePhrases = [
        "¡Buen tiro! Mantén este ritmo y el par es tuyo.",
        "Ojo con el viento, apunta un poco más a la izquierda hoy.",
        "Confía en tu swing, relájate y el palo hará el trabajo.",
        "Este es un gran día para un Birdie. ¡A por ello!",
        "Mantén la calma, el próximo hoyo es una nueva oportunidad.",
        "Visualiza la caída y confía en tu instinto."
    ];
    const [caddieMessage, setCaddieMessage] = React.useState(caddiePhrases[0]);

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCaddieMessage(caddiePhrases[Math.floor(Math.random() * caddiePhrases.length)]);
        }, 15000);
        return () => clearInterval(interval);
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
                        date_played: new Date().toISOString()
                    }])
                    .select()
                    .single();

                if (rErr) throw rErr;
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
                .single();

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
                    .single();

                if (roundError) throw roundError;

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

            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
            navigate('/rounds');
        } catch (error) {
            console.error('Error al finalizar ronda:', error);
            alert('Error al guardar los datos finales.');
            setIsSaving(false);
        }
    };

    const [showFinishModal, setShowFinishModal] = React.useState(false);

    return (
        <div className="animate-fade" style={{
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom) - 130px)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
            padding: '0 5px'
        }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '8px', border: '1px solid var(--glass-border)', borderRadius: '10px' }}>
                        <History size={20} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '18px' }}>{clubName}</h1>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{fieldName} • Par {course?.club.includes('Lagartos') && recorrido === 'Corea' ? 71 : 72}</p>
                    </div>
                </div>
                <button onClick={() => setShowFinishModal(true)} style={{ color: 'var(--secondary)' }}>Finalizar</button>
            </header>

            <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 25px', marginBottom: '10px', flexShrink: 0 }}>
                <button onClick={() => handleHoleChange('prev')} disabled={currentHole === 1} style={{ opacity: currentHole === 1 ? 0.3 : 1 }}><ChevronLeft /></button>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '600' }}>HOYO</span>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{currentHole}</div>
                    <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Par {currentHoleInfo.par} • Hcp {currentHoleInfo.handicap}</span>
                </div>
                <button onClick={() => handleHoleChange('next')} disabled={currentHole === 18} style={{ opacity: currentHole === 18 ? 0.3 : 1 }}><ChevronRight /></button>
            </div>

            <div style={{ marginBottom: '15px', padding: '0 10px', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'flex-start', gap: '15px', overflowX: 'auto', paddingBottom: '15px', paddingLeft: '10px', paddingRight: '10px', scrollSnapType: 'x proximity', WebkitOverflowScrolling: 'touch' }}>
                    {[
                        { label: 'Eagle', diff: -2, color: '#f59e0b' },
                        { label: 'Birdie', diff: -1, color: 'var(--secondary)' },
                        { label: 'Par', diff: 0, color: 'white' },
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
                        <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-dim)', textTransform: 'uppercase' }}>+/-</span>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '10px' }}>
                    <div style={{ fontSize: '14px', color: 'var(--text-dim)', fontWeight: '500' }}>
                        Puntaje: <span style={{ color: 'white', fontWeight: '800' }}>{currentStrokes === 0 ? 'PENDIENTE' : getScoreTerm(currentHoleInfo.par, currentStrokes)}</span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '10px', marginBottom: '10px', alignItems: 'center', flexShrink: 0 }}>
                <div className="glass flex-center" style={{ height: '80px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FRONT</span>
                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{distanceToHole ? Math.max(0, distanceToHole - 15) : (140 + currentHole * 2)}</span>
                </div>

                <div className="glass flex-center" style={{
                    height: '110px',
                    flexDirection: 'column',
                    border: '2px solid transparent',
                    transition: 'all 0.5s ease',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>
                        DISTANCIA AL CENTRO
                    </span>

                    {distanceToHole !== null ? (
                        <span style={{ fontSize: '40px', fontWeight: '800' }}>
                            {distanceToHole}
                        </span>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>
                                BUSCANDO...
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>
                        <Target size={10} color={distanceToHole !== null ? 'var(--secondary)' : 'var(--text-dim)'} />
                        <span>{distanceToHole !== null ? ' m' : '---'}</span>
                    </div>
                </div>

                <div className="glass flex-center" style={{ height: '80px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BACK</span>
                    <span style={{ fontSize: '20px', fontWeight: '700' }}>{distanceToHole ? (distanceToHole + 15) : (170 + currentHole * 4)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px', marginBottom: '10px', flexShrink: 0 }}>
                <Card style={{ marginBottom: 0, padding: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Wind size={14} color="var(--secondary)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '600' }}>VIENTO</span>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span style={{ fontSize: '18px', fontWeight: '800' }}>{weather?.wind || '--'}</span>
                            <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>km/h</span>
                        </div>
                    </div>
                </Card>

                <Card style={{ marginBottom: 0, padding: '10px', background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.1), rgba(163, 230, 53, 0.02))', border: '1px solid rgba(163, 230, 53, 0.2)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Info size={14} color="var(--secondary)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '600' }}>SUGERIDO</span>
                        <div style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>{getClubRecommendation(distanceToHole, weather?.wind, getWindDirection(weather?.windDirection))}</div>
                    </div>
                </Card>
            </div>

            {/* AI Caddie Card */}
            <Card style={{
                flex: 1,
                marginBottom: 0,
                padding: '12px 15px',
                background: 'rgba(163, 230, 53, 0.05)',
                border: '1px dashed rgba(163, 230, 53, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                minHeight: '60px'
            }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'var(--secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    boxShadow: '0 0 15px rgba(163, 230, 53, 0.3)'
                }}>
                    <Navigation size={20} color="var(--primary)" />
                </div>
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '10px', fontWeight: '900', color: 'var(--secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Caddie Virtual</div>
                    <p style={{ fontSize: '12px', color: 'white', fontWeight: '500', lineHeight: '1.3', fontStyle: 'italic' }}>
                        "{caddieMessage}"
                    </p>
                </div>
            </Card>

            {showFinishModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'flex-start', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => setShowFinishModal(false)}>
                    <motion.div initial={{ y: '-100%' }} animate={{ y: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ width: '100%', background: 'rgba(20, 45, 30, 0.98)', borderBottomLeftRadius: '30px', borderBottomRightRadius: '30px', padding: 'calc(20px + env(safe-area-inset-top)) 25px 30px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>¿Finalizar Partida?</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '20px' }}>
                            <button onClick={() => setShowFinishModal(false)} style={{ padding: '14px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'white' }}>Continuar</button>
                            <button onClick={handleFinishRound} disabled={isSaving} style={{ padding: '14px', borderRadius: '14px', background: 'var(--secondary)', color: 'var(--primary)', fontWeight: '800' }}>{isSaving ? 'Guardando...' : 'Finalizar'}</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Round;
