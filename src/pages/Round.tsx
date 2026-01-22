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
        setStrokes(prev => ({
            ...prev,
            [currentHole]: Math.max(0, (prev[currentHole] || 0) + change)
        }));
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

    const handleFinishRound = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Debes iniciar sesión para guardar tu ronda');
                setIsSaving(false);
                return;
            }

            const holeNumbers = Object.keys(strokes).map(Number);
            const totalScore = holeNumbers.reduce((acc, h) => acc + (strokes[h] || 0), 0);
            const firstNine = holeNumbers.filter(h => h >= 1 && h <= 9).reduce((acc, h) => acc + (strokes[h] || 0), 0);
            const secondNine = holeNumbers.filter(h => h >= 10 && h <= 18).reduce((acc, h) => acc + (strokes[h] || 0), 0);

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
            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
            navigate('/rounds');
        } catch (error) {
            console.error('Error al finalizar ronda:', error);
            alert('Error al guardar la ronda.');
            setIsSaving(false);
        }
    };

    const [showFinishModal, setShowFinishModal] = React.useState(false);

    return (
        <div className="animate-fade" style={{ maxWidth: 'var(--app-max-width)', margin: '0 auto' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
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

            <div className="glass" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 25px', marginBottom: '20px' }}>
                <button onClick={() => handleHoleChange('prev')} disabled={currentHole === 1} style={{ opacity: currentHole === 1 ? 0.3 : 1 }}><ChevronLeft /></button>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '600' }}>HOYO</span>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{currentHole}</div>
                    <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>Par {currentHoleInfo.par} • Hcp {currentHoleInfo.handicap}</span>
                </div>
                <button onClick={() => handleHoleChange('next')} disabled={currentHole === 18} style={{ opacity: currentHole === 18 ? 0.3 : 1 }}><ChevronRight /></button>
            </div>

            <div style={{ marginBottom: '20px', padding: '0 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
                    <button onClick={() => handleStrokeChange(-1)} className="glass" style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '28px', background: 'rgba(255,255,255,0.05)' }}>-</button>
                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <div style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1' }}>{currentStrokes}</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            color: getScoreTerm(currentHoleInfo.par, currentStrokes) === 'Birdie' || getScoreTerm(currentHoleInfo.par, currentStrokes) === 'Eagle' ? 'var(--secondary)' :
                                getScoreTerm(currentHoleInfo.par, currentStrokes).includes('Bogey') ? '#f87171' : 'var(--text-dim)'
                        }}>{getScoreTerm(currentHoleInfo.par, currentStrokes).toUpperCase()}</div>
                    </div>
                    <button onClick={() => handleStrokeChange(1)} className="glass" style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '28px', borderColor: 'var(--secondary)', color: 'var(--secondary)', background: 'rgba(163, 230, 53, 0.1)' }}>+</button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FRONT</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{distanceToHole ? Math.max(0, distanceToHole - 15) : (140 + currentHole * 2)}</span>
                </div>

                <div className="glass flex-center" style={{
                    height: '140px',
                    flexDirection: 'column',
                    border: '2px solid transparent',
                    transition: 'all 0.5s ease',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
                        DISTANCIA AL CENTRO
                    </span>

                    {distanceToHole !== null ? (
                        <span style={{ fontSize: '48px', fontWeight: '800' }}>
                            {distanceToHole}
                        </span>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                                ESPERANDO GPS...
                            </span>
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)', marginTop: '5px' }}>
                        <Target size={12} color={distanceToHole !== null ? 'var(--secondary)' : 'var(--text-dim)'} />
                        <span>{distanceToHole !== null ? ' m (En vivo)' : 'Esperando GPS'}</span>
                    </div>
                </div>

                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BACK</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{distanceToHole ? (distanceToHole + 15) : (170 + currentHole * 4)}</span>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <Card style={{ marginBottom: 0, padding: '15px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Wind size={16} color="var(--secondary)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>VIENTO</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                        <span style={{ fontSize: '28px', fontWeight: '800' }}>{weather?.wind || '--'}</span>
                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>km/h</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                        <Navigation size={12} style={{ transform: `rotate(${(weather?.windDirection || 0) + 180}deg)`, color: 'var(--secondary)' }} />
                        <span style={{ fontSize: '13px', fontWeight: '600' }}>{getWindDirection(weather?.windDirection)}</span>
                    </div>
                </Card>

                <Card style={{ marginBottom: 0, padding: '15px', background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.1), rgba(163, 230, 53, 0.02))', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                        <Info size={16} color="var(--secondary)" />
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>PALO SUGERIDO</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'white', lineHeight: '1.2' }}>{getClubRecommendation(distanceToHole, weather?.wind, getWindDirection(weather?.windDirection))}</div>
                </Card>
            </div>

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
