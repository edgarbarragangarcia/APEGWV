import React from 'react';
import { useLocation } from 'react-router-dom';
import Card from '../components/Card';
import { ChevronLeft, ChevronRight, Info, Target, History } from 'lucide-react';
import type { GolfCourse } from '../data/courses';
import { supabase } from '../services/SupabaseManager';
import { useGreenReader } from '../hooks/useGreenReader';

const Round: React.FC = () => {
    const location = useLocation();
    const { course, recorrido } = (location.state as { course?: GolfCourse; recorrido?: string }) || {};

    const clubName = course?.club || 'Club de Golf';
    const fieldName = recorrido ? `${course?.name} - ${recorrido}` : (course?.name || 'Recorrido Principal');
    const [holeData, setHoleData] = React.useState<any[]>([]);

    // Green Reader Hook
    const { beta, gamma, calibrate } = useGreenReader();
    // Factor de amplificación visual para la flecha
    // Si gamma es positivo (caída derecha), rotamos la flecha a la izquierda (negativo)
    const aimRotation = -gamma * 2;

    // Restauramos estados perdidos
    const [currentHole, setCurrentHole] = React.useState(1);
    const [strokes, setStrokes] = React.useState<Record<number, number>>({});

    const currentStrokes = strokes[currentHole] || 0;

    // Datos del hoyo actual
    const currentHoleInfo = holeData.find(h => h.hole_number === currentHole) || { par: 4, handicap: currentHole }; // Fallback inicial

    React.useEffect(() => {
        const fetchHoles = async () => {
            if (!course?.id) return;
            try {
                // Intento buscar por ID de curso y recorrido exacto
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
                    // Si no hay datos en DB, usamos datos "standard" para no romper la UI
                    // Pero idealmente vendrían de la DB como pidió el usuario.
                    console.warn('No hole data found in DB');
                }
            } catch (err) {
                console.error(err);
            } finally {
                // Loading finished
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
                    onClick={() => {
                        if (confirm('¿Terminar ronda?')) {
                            // En el futuro aquí se guardaría el score en Supabase
                            window.history.back();
                        }
                    }}
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

            {/* GPS Distances */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: '15px', marginBottom: '20px', alignItems: 'center' }}>
                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>FRONT</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{140 + currentHole * 2}</span>
                </div>

                <div className="glass flex-center" style={{
                    height: '140px',
                    flexDirection: 'column',
                    border: '2px solid var(--secondary)',
                    boxShadow: '0 0 20px rgba(163, 230, 53, 0.2)'
                }}>
                    <span style={{ fontSize: '12px', color: 'var(--secondary)', fontWeight: '600' }}>CENTER</span>
                    <span style={{ fontSize: '48px', fontWeight: '800' }}>{155 + currentHole * 3}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-dim)' }}>
                        <Target size={12} /> m
                    </div>
                </div>

                <div className="glass flex-center" style={{ height: '100px', flexDirection: 'column' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>BACK</span>
                    <span style={{ fontSize: '24px', fontWeight: '700' }}>{170 + currentHole * 4}</span>
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
                                width: '2px', // Line thinner
                                height: '180px', // Long enough to reach hole area
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
                                    background: 'linear-gradient(to top, #ef4444, transparent)', // Red fade
                                    opacity: 0.8
                                }} />
                            </div>

                            {/* Blue Curve (Break Hint) - Optional visualization of gravity */}
                            {Math.abs(gamma) > 1 && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '50%',
                                    left: '50%',
                                    width: '100px',
                                    height: '180px',
                                    borderLeft: gamma > 0 ? 'none' : '2px solid rgba(59, 130, 246, 0.5)', // Blue
                                    borderRight: gamma > 0 ? '2px solid rgba(59, 130, 246, 0.5)' : 'none',
                                    borderRadius: gamma > 0 ? '0 100% 0 0' : '100% 0 0 0', // Simple naive curve
                                    transform: `translate(-50%, -100%) scaleX(${Math.min(Math.abs(gamma) / 10, 1.5)})`, // Stretch curve based on break
                                    transformOrigin: 'bottom center',
                                    opacity: 0.6
                                }} />
                            )}
                        </div>
                    </div>

                    <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button className="glass" style={{ padding: '8px' }}><Info size={16} /></button>
                        <button
                            onClick={calibrate}
                            className="glass"
                            style={{
                                padding: '8px 12px',
                                fontSize: '10px',
                                background: 'rgba(255,255,255,0.1)',
                                color: 'var(--text-dim)'
                            }}
                        >
                            CALIBRAR
                        </button>
                    </div>

                    <div style={{ position: 'absolute', bottom: '20px', left: '20px', background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>Slope: {Math.round(beta)}°</span>
                        <span>Break: {Math.round(gamma)}°</span>
                    </div>
                </div>
            </Card>


        </div>
    );
};

export default Round;
