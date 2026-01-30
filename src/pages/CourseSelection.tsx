import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, MapPin, Wind, Droplets, Thermometer, ChevronRight, Navigation, ArrowLeft } from 'lucide-react';
import { COLOMBIAN_COURSES } from '../data/courses';
import type { GolfCourse } from '../data/courses';
import { fetchWeather } from '../services/WeatherService';
import type { WeatherData } from '../services/WeatherService';
import { useGeoLocation } from '../hooks/useGeoLocation';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';

const CourseSelection: React.FC = () => {
    const navigate = useNavigate();
    const locationState = useLocation();
    const { user } = useAuth();

    // Friends passed from FriendSelection page
    const selectedFriends = (locationState.state as any)?.selectedFriends || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedZone, setSelectedZone] = useState<string>('Todas');
    const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);

    const zones = ['Todas', 'Bogotá', 'Antioquia', 'Valle', 'Costa', 'Santanderes', 'Eje Cafetero', 'Centro'];

    const { calculateDistance, location, refreshLocation, permissionStatus } = useGeoLocation();
    const [showLocationLoading, setShowLocationLoading] = useState(true);

    // Timeout para el mensaje de carga de ubicación
    useEffect(() => {
        if (permissionStatus === 'granted' && !location) {
            const timer = setTimeout(() => {
                setShowLocationLoading(false);
            }, 12000); // Ocultar después de 12 segundos si aún no hay ubicación
            return () => clearTimeout(timer);
        }
    }, [permissionStatus, location]);

    const sortedCourses = [...COLOMBIAN_COURSES].map(course => ({
        ...course,
        distance: calculateDistance(course.lat, course.lon)
    })).sort((a, b) => {
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
        const loadWeather = async () => {
            const weatherMap: Record<string, WeatherData> = {};
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

    const handleSelectCourse = async (course: GolfCourse, recorrido?: string) => {
        if (selectedFriends.length > 0) {
            setIsCreatingGroup(true);
            try {
                const { data: group, error: groupError } = await supabase
                    .from('game_groups' as any)
                    .insert([{
                        created_by: user?.id,
                        course_id: course.id,
                        status: 'pending'
                    }])
                    .select()
                    .single();

                if (groupError) throw groupError;
                const groupData = group as any;

                const members = [
                    { group_id: groupData.id, user_id: user?.id, status: 'accepted' },
                    ...selectedFriends.map((f: any) => ({ group_id: groupData.id, user_id: f.id, status: 'invited' }))
                ];

                const { error: memberError } = await supabase
                    .from('group_members' as any)
                    .insert(members);

                if (memberError) throw memberError;

                navigate('/round', { state: { course, recorrido, groupId: groupData.id } });
            } catch (err) {
                console.error('Error creating group:', err);
                alert('No se pudo crear el grupo. ¿Ya ejecutaste el SQL en Supabase?');
                navigate('/round', { state: { course, recorrido } });
            } finally {
                setIsCreatingGroup(false);
            }
        } else {
            navigate('/round', { state: { course, recorrido } });
        }
    };

    return (
        <div style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden'
        }} className="animate-fade">
            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 87px)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'linear-gradient(180deg, var(--primary) 0%, var(--primary) 90%, transparent 100%)',
                paddingTop: '10px',
                paddingBottom: '20px',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <div style={{ marginBottom: '20px', display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            flexShrink: 0
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '5px', color: 'white' }}>
                            Selecciona <span style={{ color: 'var(--secondary)' }}>tu</span> Campo
                        </h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Listado oficial de clubes en Colombia</p>
                    </div>
                </div>

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


            {/* Main Content Scroll Area */}
            <div style={{
                position: 'absolute',
                top: 'calc(env(safe-area-inset-top) + 275px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 20px 20px'
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {permissionStatus === 'granted' && !location && showLocationLoading && (
                        <div className="glass animate-pulse" style={{ padding: '15px', textAlign: 'center', background: 'rgba(163, 230, 53, 0.05)', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--secondary)' }}>
                                <div className="spinner-small"></div>
                                <span style={{ fontSize: '12px', fontWeight: '700' }}>OBTENIENDO UBICACIÓN PRECISA...</span>
                            </div>
                        </div>
                    )}

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
                                                    className="btn-primary"
                                                    style={{ flex: 1, padding: '12px', fontSize: '13px' }}
                                                >
                                                    {r} <ChevronRight size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => handleSelectCourse(course)}
                                        disabled={isCreatingGroup}
                                        className="btn-primary"
                                        style={{ width: '100%', padding: '14px' }}
                                    >
                                        {isCreatingGroup ? 'Creando Grupo...' : <><Navigation size={18} fill="currentColor" /> Comenzar Partida</>}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

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
        </div>
    );
};

export default CourseSelection;
