import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Wind, Droplets, Thermometer, ChevronRight, Navigation } from 'lucide-react';
import { COLOMBIAN_COURSES } from '../data/courses';
import type { GolfCourse } from '../data/courses';
import { fetchWeather } from '../services/WeatherService';
import type { WeatherData } from '../services/WeatherService';
import { useGeoLocation } from '../hooks/useGeoLocation';

const CourseSelection: React.FC = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZone, setSelectedZone] = useState<string>('Todas');
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});

    const zones = ['Todas', 'Bogotá', 'Antioquia', 'Valle', 'Costa', 'Santanderes', 'Eje Cafetero', 'Centro'];

    const { calculateDistance, location, refreshLocation, permissionStatus } = useGeoLocation();

    const sortedCourses = [...COLOMBIAN_COURSES].map(course => ({
        ...course,
        distance: calculateDistance(course.lat, course.lon)
    })).sort((a, b) => {
        // Si no hay distancia (location no cargada), mantenemos orden original (alfabético por club)
        if (a.distance === null && b.distance === null) return a.club.localeCompare(b.club);
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
    });

    const filteredCourses = sortedCourses.filter(course => {
        const matchesSearch = course.club.toLowerCase().includes(searchQuery.toLowerCase()) ||
            course.city.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesZone = selectedZone === 'Todas' || course.zone === selectedZone;
        return matchesSearch && matchesZone;
    });

    useEffect(() => {
        // Cargar clima para los primeros cursos visibles
        const loadWeather = async () => {
            const weatherMap: Record<string, WeatherData> = {};
            // Usamos COLOMBIAN_COURSES directamente para evitar re-triggers en el loop de clima
            for (const course of COLOMBIAN_COURSES.slice(0, 10)) {
                try {
                    const data = await fetchWeather(course.lat, course.lon);
                    weatherMap[course.id] = data;
                } catch (e) {
                    console.error(e);
                }
            }
            setWeatherData(weatherMap);
        };
        loadWeather();
    }, []);

    const handleSelectCourse = (course: GolfCourse, recorrido?: string) => {
        navigate('/round', { state: { course, recorrido } });
    };

    return (
        <div className="animate-fade" style={{ paddingBottom: '100px' }}>
            <header style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 style={{ fontSize: '28px', marginBottom: '4px' }}>Selecciona tu Campo</h1>
                    <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Listado oficial de clubes en Colombia</p>
                </div>
                <button
                    onClick={() => refreshLocation()}
                    className="glass"
                    style={{
                        padding: '10px',
                        borderRadius: '12px',
                        background: 'rgba(163, 230, 53, 0.1)',
                        border: '1px solid rgba(163, 230, 53, 0.2)',
                        color: 'var(--secondary)'
                    }}
                    title="Actualizar ubicación"
                >
                    <Navigation size={20} />
                </button>
            </header>

            {/* Status Indicator */}
            {!location && permissionStatus === 'granted' && (
                <div style={{ marginBottom: '15px', padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '10px', fontSize: '12px', color: '#60a5fa', textAlign: 'center' }}>
                    Obteniendo ubicación precisa...
                </div>
            )}

            {/* Search and Filters */}
            <div style={{ position: 'sticky', top: 'var(--header-height)', zIndex: 10, background: 'var(--primary)', padding: '10px 0' }}>
                <div className="glass" style={{
                    padding: '12px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    marginBottom: '15px'
                }}>
                    <Search size={20} color="var(--text-dim)" />
                    <input
                        type="text"
                        placeholder="Buscar club o ciudad..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'white',
                            width: '100%',
                            outline: 'none',
                            fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
                    {zones.map(zone => (
                        <button
                            key={zone}
                            onClick={() => setSelectedZone(zone)}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '20px',
                                background: selectedZone === zone ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                                color: selectedZone === zone ? 'var(--primary)' : 'white',
                                whiteSpace: 'nowrap',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {zone}
                        </button>
                    ))}
                </div>
            </div>

            {/* Course List */}
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {filteredCourses.map((course) => (
                    <div key={course.id} className="glass" style={{ overflow: 'hidden' }}>
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                <div>
                                    <h3 style={{ fontSize: '18px', marginBottom: '4px' }}>{course.club}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-dim)', fontSize: '13px' }}>
                                        <MapPin size={14} /> {course.city}, {course.zone}
                                        {course.distance !== null && (
                                            <>
                                                <span style={{ margin: '0 5px' }}>•</span>
                                                <span style={{ color: 'var(--secondary)', fontWeight: '600' }}>
                                                    {course.distance > 1000 ? `${(course.distance / 1000).toFixed(1)} km` : `${course.distance} m`}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Weather Widget Pequeno */}
                                {weatherData[course.id] && (
                                    <div style={{
                                        background: 'rgba(163, 230, 53, 0.1)',
                                        padding: '8px 12px',
                                        borderRadius: '12px',
                                        textAlign: 'right'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                                            <Thermometer size={14} color="var(--secondary)" />
                                            <span style={{ fontWeight: '700', color: 'var(--secondary)' }}>{weatherData[course.id].temp}°C</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', color: 'var(--text-dim)', marginTop: '4px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Wind size={10} /> {weatherData[course.id].wind}k/h</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}><Droplets size={10} /> {weatherData[course.id].humidity}%</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <p style={{ fontSize: '14px', color: 'var(--text-dim)', lineHeight: '1.5', marginBottom: '15px' }}>
                                {course.description}
                            </p>

                            {/* Recorridos Selectors */}
                            {course.recorridos ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--secondary)' }}>
                                        Selecciona Recorrido:
                                    </span>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        {course.recorridos.map(r => (
                                            <button
                                                key={r}
                                                onClick={() => handleSelectCourse(course, r)}
                                                style={{
                                                    flex: 1,
                                                    background: 'var(--secondary)',
                                                    color: 'var(--primary)',
                                                    padding: '12px',
                                                    borderRadius: '12px',
                                                    fontSize: '13px',
                                                    fontWeight: '700',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '8px',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                {r} <ChevronRight size={14} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => handleSelectCourse(course)}
                                    style={{
                                        width: '100%',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        padding: '14px',
                                        borderRadius: '12px',
                                        fontWeight: '700',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    <Navigation size={18} fill="currentColor" /> Comenzar Partida
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Debug Info at bottom */}
            <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '10px', textTransform: 'uppercase' }}>Depuración GPS</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '11px' }}>
                    <div>Latitud: <span style={{ color: 'white' }}>{location?.latitude?.toFixed(5) || '---'}</span></div>
                    <div>Longitud: <span style={{ color: 'white' }}>{location?.longitude?.toFixed(5) || '---'}</span></div>
                    <div>Estado Permiso: <span style={{ color: 'var(--secondary)' }}>{permissionStatus.toUpperCase()}</span></div>
                </div>
                {!location && (
                    <button
                        onClick={() => refreshLocation()}
                        style={{ marginTop: '10px', width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: '8px', fontSize: '11px' }}
                    >
                        Forzar obtención de ubicación
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseSelection;
