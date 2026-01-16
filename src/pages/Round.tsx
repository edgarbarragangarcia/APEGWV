import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, Target, History } from 'lucide-react';
import type { GolfCourse } from '../data/courses';
import { supabase } from '../services/SupabaseManager';
import { useGreenReader } from '../hooks/useGreenReader';
import { useGeoLocation } from '../hooks/useGeoLocation';

const Round: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { course, recorrido } = (location.state as { course?: GolfCourse; recorrido?: string }) || {};

    const clubName = course?.club || 'Club de Golf';
    const fieldName = recorrido ? `${course?.name} - ${recorrido}` : (course?.name || 'Recorrido Principal');
    const [holeData, setHoleData] = React.useState<any[]>([]);

    // Hooks
    const { beta, gamma, calibrate, requestAccess, isLevel, hasData: sensorsActive } = useGreenReader();
    const { calculateDistance, error: gpsError, permissionStatus } = useGeoLocation();

    // Manual sensor activation override
    const [forceSensors, setForceSensors] = React.useState(false);

    // GPS Logic
    // Nota: Como no tenemos las coordenadas exactas de cada hoyo en DB aún, usamos la coordenada del club como proxy TEMPORAL.
    // En producción, holeData debería traer { lat, lon } del centro del green.
    const targetLat = course?.lat || 0;
    const targetLon = course?.lon || 0;

    const distanceToHole = calculateDistance(targetLat, targetLon);

    // Si estamos a menos de 50 metros, asumimos "Zona de Green" -> Activamos sensores
    const isNearGreen = forceSensors || (distanceToHole !== null && distanceToHole < 50);

    // Factor de amplificación visual para la flecha
    // Aumentado a x5 para que sea más sensible y visible
    const aimRotation = -gamma * 5;

    // Restauramos estados perdidos
    const [currentHole, setCurrentHole] = React.useState(1);
    const [strokes, setStrokes] = React.useState<Record<number, number>>({});
    const [isSaving, setIsSaving] = React.useState(false);

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
                    console.warn('No hole data found in DB');
                }
            } catch (err) {
                console.error(err);
            }
        };

        fetchHoles();
    }, [course, recorrido]);

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

    const getSlopeIntensity = (g: number) => {
        const absG = Math.abs(g);
        if (absG < 1) return 'PLANO';
        if (absG < 3) return g > 0 ? 'CAÍDA LEVE DER' : 'CAÍDA LEVE IZQ';
        if (absG < 6) return g > 0 ? 'CAÍDA MEDIA DER' : 'CAÍDA MEDIA IZQ';
        return g > 0 ? 'CAÍDA FUERTE DER' : 'CAÍDA FUERTE IZQ';
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

            // Calcular totales
            const holeNumbers = Object.keys(strokes).map(Number);
            const totalScore = holeNumbers.reduce((acc, h) => acc + (strokes[h] || 0), 0);

            const firstNine = holeNumbers
                .filter(h => h >= 1 && h <= 9)
                .reduce((acc, h) => acc + (strokes[h] || 0), 0);

            const secondNine = holeNumbers
                .filter(h => h >= 10 && h <= 18)
                .reduce((acc, h) => acc + (strokes[h] || 0), 0);

            // 1. Insertar Ronda
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

            // 2. Insertar Hoyos (solo los que tienen golpes)
            if (round && holeNumbers.length > 0) {
                const holesToInsert = holeNumbers.map(h => ({
                    round_id: round.id,
                    hole_number: h,
                    par: holeData.find(hd => hd.hole_number === h)?.par || 4,
                    score: strokes[h]
                }));

                const { error: holesError } = await supabase
                    .from('round_holes')
                    .insert(holesToInsert);

                if (holesError) {
                    console.error('Error saving hole details:', holesError);
                    // No bloqueamos el flujo principal si los detalles fallan pero la ronda se guardó
                }
            }

            // Éxito: vibrar y navegar
            if (navigator.vibrate) navigator.vibrate([10, 30, 10]);
            navigate('/rounds');

        } catch (error) {
            console.error('Error al finalizar ronda:', error);
            alert('Error al guardar la ronda. Por favor intenta de nuevo.');
            setIsSaving(false);
        }
    };

    const [showFinishModal, setShowFinishModal] = React.useState(false);

    return (
        <div className="animate-fade" style={{ maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>

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
                <button
                    onClick={() => setShowFinishModal(true)}
                    style={{ color: 'var(--secondary)' }}
                >
                    Finalizar
                </button>
            </header>

            {/* Hole Selector */}
            <div className="glass" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 25px',
                marginBottom: '20px'
            }}>
                <button onClick={() => handleHoleChange('prev')} disabled={currentHole === 1} style={{ opacity: currentHole === 1 ? 0.3 : 1 }}><ChevronLeft /></button>
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary)', fontWeight: '600' }}>HOYO</span>
                    <div style={{ fontSize: '32px', fontWeight: '800' }}>{currentHole}</div>
                    <span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                        Par {currentHoleInfo.par} • Hcp {currentHoleInfo.handicap}
                    </span>
                </div>
                <button onClick={() => handleHoleChange('next')} disabled={currentHole === 18} style={{ opacity: currentHole === 18 ? 0.3 : 1 }}><ChevronRight /></button>
            </div>


            {/* Quick Score - Moved below Hole Selector */}
            <div style={{ marginBottom: '20px', padding: '0 10px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', alignItems: 'center' }}>
                    <button
                        onClick={() => handleStrokeChange(-1)}
                        className="glass"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '28px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)' }}>
                        -
                    </button>

                    <div style={{ textAlign: 'center', minWidth: '100px' }}>
                        <div style={{ fontSize: '56px', fontWeight: '800', lineHeight: '1' }}>{currentStrokes}</div>
                        <div style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            marginTop: '5px',
                            color: getScoreTerm(currentHoleInfo.par, currentStrokes) === 'Birdie' || getScoreTerm(currentHoleInfo.par, currentStrokes) === 'Eagle' ? 'var(--secondary)' :
                                getScoreTerm(currentHoleInfo.par, currentStrokes).includes('Bogey') ? '#f87171' : 'var(--text-dim)'
                        }}>
                            {getScoreTerm(currentHoleInfo.par, currentStrokes).toUpperCase()}
                        </div>
                    </div>

                    <button
                        onClick={() => handleStrokeChange(1)}
                        className="glass"
                        style={{ width: '60px', height: '60px', borderRadius: '50%', fontSize: '28px', borderColor: 'var(--secondary)', color: 'var(--secondary)', cursor: 'pointer', background: 'rgba(163, 230, 53, 0.1)' }}>
                        +
                    </button>
                </div>
            </div>

            {/* GPS Distances OR Green Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column', opacity: isNearGreen ? 0.5 : 1 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FRONT</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>
                        {distanceToHole ? Math.max(0, distanceToHole - 15) : (140 + currentHole * 2)}
                    </span>
                </div>

                <div className="glass flex-center" style={{
                    height: '140px',
                    flexDirection: 'column',
                    border: isNearGreen ? '2px solid var(--secondary)' : '2px solid transparent',
                    boxShadow: isNearGreen ? '0 0 30px rgba(163, 230, 53, 0.3)' : 'none',
                    transition: 'all 0.5s ease',
                    position: 'relative'
                }}>
                    <span style={{ fontSize: '12px', color: isNearGreen ? 'var(--secondary)' : 'var(--text-dim)', fontWeight: '600' }}>
                        {isNearGreen ? 'ZONA DE GREEN' : 'DISTANCIA AL CENTRO'}
                    </span>

                    {distanceToHole !== null ? (
                        <span style={{ fontSize: '48px', fontWeight: '800' }}>
                            {distanceToHole}
                        </span>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                            <span style={{ fontSize: '20px', fontWeight: '700', color: permissionStatus === 'denied' ? '#ef4444' : 'var(--text-dim)' }}>
                                {permissionStatus === 'denied' ? 'Sin Permiso' : 'Buscando...'}
                            </span>
                            {gpsError && <span style={{ fontSize: '10px', maxWidth: '80%', textAlign: 'center', color: 'orange' }}>{gpsError}</span>}
                        </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
                        <Target size={12} /> {distanceToHole !== null ? ' m (GPS)' : 'Localizando...'}
                    </div>
                </div>

                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column', opacity: isNearGreen ? 0.5 : 1 }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BACK</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>
                        {distanceToHole ? (distanceToHole + 15) : (170 + currentHole * 4)}
                    </span>
                    {!isNearGreen && !forceSensors && (
                        <button
                            onClick={() => setForceSensors(true)}
                            style={{ fontSize: '9px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'var(--text-dim)', marginTop: '5px', padding: '2px 5px', borderRadius: '4px' }}
                        >
                            FORZAR GREEN
                        </button>
                    )}
                </div>
            </div>

            {/* Simulated Course Visualization + Green Reader */}
            <Card style={{ padding: 0, height: '350px', overflow: 'hidden', position: 'relative' }}>
                <div style={{
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(to bottom, #1a4d35, #0a261a)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}>
                    {/* Mock hole visualization */}
                    <div style={{
                        width: '180px',
                        height: '280px',
                        background: 'rgba(163, 230, 53, 0.15)',
                        borderRadius: '90px',
                        border: '2px dashed rgba(255,255,255,0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '30px',
                        position: 'relative' // Contexto para lineas
                    }}>
                        {/* Hole */}
                        <div style={{ width: '30px', height: '30px', background: '#15803d', borderRadius: '50%', boxShadow: 'inset 2px 2px 5px rgba(0,0,0,0.5)', zIndex: 2 }} />

                        {/* Ball */}
                        <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', zIndex: 2, position: 'relative' }}>
                            {/* Red Arrow (Aim Line) - Originates from Ball */}
                            <div style={{
                                position: 'absolute',
                                bottom: '50%',
                                left: '50%',
                                width: '2px',
                                height: '180px',
                                background: 'transparent',
                                transformOrigin: 'bottom center',
                                transform: `translateX(-50%) rotate(${aimRotation}deg)`,
                                transition: 'transform 0.1s ease-out',
                                zIndex: 1,
                                pointerEvents: 'none'
                            }}>
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    background: 'linear-gradient(to top, #ef4444, transparent)',
                                    opacity: 0.8,
                                    position: 'relative'
                                }}>
                                    {/* Degree indicator on arrow */}
                                    <span style={{
                                        position: 'absolute',
                                        top: '20px',
                                        left: '5px',
                                        fontSize: '10px',
                                        color: '#ef4444',
                                        fontWeight: 'bold',
                                        background: 'rgba(0,0,0,0.4)',
                                        padding: '1px 4px',
                                        borderRadius: '3px',
                                        transform: `rotate(${-aimRotation}deg)`,
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {Math.abs(Math.round(gamma))}° {gamma > 0 ? 'R' : 'L'}
                                    </span>
                                </div>
                            </div>

                            {/* Blue Curve (Break Hint) */}
                            {Math.abs(gamma) > 0.5 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '50%',
                                    left: '50%',
                                    width: '120px',
                                    height: '200px',
                                    borderLeft: gamma > 0 ? 'none' : '3px solid rgba(59, 130, 246, 0.4)',
                                    borderRight: gamma > 0 ? '3px solid rgba(59, 130, 246, 0.4)' : 'none',
                                    borderRadius: gamma > 0 ? '0 100% 0 0' : '100% 0 0 0',
                                    transform: `translate(-50%, -100%) scaleX(${Math.min(Math.abs(gamma) / 8, 2)})`,
                                    transformOrigin: 'bottom center',
                                    opacity: 0.7,
                                    filter: 'blur(1px)'
                                }} />
                            )}
                        </div>
                    </div>

                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end' }}>
                        {/* Bubble Level Indicator */}
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            background: 'rgba(0,0,0,0.4)',
                            border: `2px solid ${isLevel ? 'var(--secondary)' : 'rgba(255,255,255,0.2)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative'
                        }}>
                            <div style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                background: isLevel ? 'var(--secondary)' : 'white',
                                boxShadow: isLevel ? '0 0 10px var(--secondary)' : 'none',
                                transform: `translate(${Math.min(Math.max(gamma * 2, -15), 15)}px, ${Math.min(Math.max(beta * 2, -15), 15)}px)`,
                                transition: 'all 0.1s ease-out'
                            }} />
                            {/* Level targets */}
                            <div style={{ position: 'absolute', width: '12px', height: '12px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                        </div>

                        <button
                            onClick={calibrate}
                            className="glass"
                            style={{
                                padding: '8px 12px',
                                fontSize: '10px',
                                background: isLevel ? 'rgba(163, 230, 53, 0.2)' : 'rgba(255,255,255,0.1)',
                                color: isLevel ? 'var(--secondary)' : 'var(--text-dim)',
                                border: isLevel ? '1px solid var(--secondary)' : '1px solid transparent'
                            }}
                        >
                            CALIBRAR
                        </button>
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '8px 15px', borderRadius: '20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: `4px solid ${Math.abs(gamma) > 5 ? '#ef4444' : 'var(--secondary)'}` }}>
                        <span style={{ fontWeight: '800', color: 'white' }}>{getSlopeIntensity(gamma)}</span>
                        <div style={{ display: 'flex', gap: '10px', opacity: 0.8 }}>
                            <span>Slope: {Math.abs(Math.round(beta))}°</span>
                            <span>Break: {Math.abs(Math.round(gamma))}°</span>
                        </div>
                    </div>

                    {/* Sensor Activation Overlay */}
                    {isNearGreen && !sensorsActive && (
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(2px)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 10
                        }}>
                            <button
                                onClick={requestAccess}
                                className="glass"
                                style={{
                                    padding: '15px 30px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    boxShadow: '0 0 20px rgba(34, 197, 94, 0.5)'
                                }}
                            >
                                ACTIVAR LECTURA
                            </button>
                        </div>
                    )}
                </div>
            </Card>


            {/* Top Sheet de Finalización */}
            {showFinishModal && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'flex-start',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(8px)',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setShowFinishModal(false)}>
                    <motion.div
                        initial={{ y: '-100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{
                            width: '100%',
                            background: 'rgba(20, 45, 30, 0.98)',
                            borderBottom: '1px solid rgba(255,255,255,0.1)',
                            borderBottomLeftRadius: '30px',
                            borderBottomRightRadius: '30px',
                            padding: 'calc(20px + env(safe-area-inset-top)) 25px 30px',
                            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                            textAlign: 'center'
                        }}
                    >
                        <div style={{
                            width: '50px',
                            height: '50px',
                            borderRadius: '15px',
                            background: 'rgba(163, 230, 53, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 15px'
                        }}>
                            <History size={28} color="var(--secondary)" />
                        </div>

                        <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>¿Finalizar Partida?</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginBottom: '25px', lineHeight: '1.4' }}>
                            Tus golpes se guardarán en el historial.
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <button
                                onClick={() => setShowFinishModal(false)}
                                style={{
                                    padding: '14px',
                                    borderRadius: '14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontWeight: '600',
                                    fontSize: '15px',
                                    border: '1px solid rgba(255,255,255,0.1)'
                                }}
                            >
                                Continuar
                            </button>
                            <button
                                onClick={handleFinishRound}
                                disabled={isSaving}
                                style={{
                                    padding: '14px',
                                    borderRadius: '14px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    fontWeight: '800',
                                    fontSize: '15px',
                                    boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    opacity: isSaving ? 0.7 : 1
                                }}
                            >
                                {isSaving ? 'Guardando...' : 'Finalizar'}
                            </button>
                        </div>

                        {/* Drag indicator at bottom for top sheet */}
                        <div style={{
                            width: '40px',
                            height: '4px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '2px',
                            margin: '20px auto 0'
                        }} />
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default Round;
