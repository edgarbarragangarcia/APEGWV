import React, { useEffect, useState } from 'react';
import { Calendar, Users, MapPin, Search, UserPlus, Trophy, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';

interface Tournament {
    id: string;
    name: string;
    description: string;
    date: string;
    club: string;
    price: number;
    participants_limit: number;
    current_participants: number;
    status: string;
    image_url: string;
}

const Tournaments: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [registrations, setRegistrations] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();

            // Fetch all tournaments
            const { data: allTourneys, error: tError } = await supabase
                .from('tournaments')
                .select('*')
                .order('date', { ascending: true });

            if (tError) throw tError;
            setTournaments(allTourneys || []);

            // Fetch user registrations
            if (session) {
                const { data: userRegs } = await supabase
                    .from('tournament_registrations')
                    .select('tournament_id')
                    .eq('user_id', session.user.id);

                setRegistrations(userRegs?.map(r => r.tournament_id) || []);
            }
        } catch (err) {
            console.error('Error fetching tournaments:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (tournamentId: string) => {
        setRegistering(tournamentId);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { error } = await supabase
                .from('tournament_registrations')
                .insert([{
                    tournament_id: tournamentId,
                    user_id: session.user.id
                }]);

            if (error) throw error;

            setRegistrations([...registrations, tournamentId]);
            if (navigator.vibrate) navigator.vibrate(50);
        } catch (err) {
            console.error('Error registering:', err);
            alert('Error al inscribirse');
        } finally {
            setRegistering(null);
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.club.toLowerCase().includes(searchQuery.toLowerCase());

        if (activeTab === 'my') {
            return matchesSearch && registrations.includes(t.id);
        }
        return matchesSearch;
    });

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '70vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }

    return (
        <div className="animate-fade" style={{
            paddingBottom: 'calc(var(--nav-height) + 20px)',
            width: '100%',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            <header style={{ marginBottom: '25px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '5px' }}>Eventos</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Compite y crece en la comunidad APEG</p>
            </header>

            {/* Tab Bar */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px',
                borderRadius: '16px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'all' ? 'var(--secondary)' : 'transparent',
                        color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-dim)',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Trophy size={18} /> Todos
                </button>
                <button
                    onClick={() => setActiveTab('my')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: activeTab === 'my' ? 'var(--secondary)' : 'transparent',
                        color: activeTab === 'my' ? 'var(--primary)' : 'var(--text-dim)',
                        fontWeight: '700',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                    }}
                >
                    <Users size={18} /> Mis Inscripciones
                </button>
            </div>

            {/* Search Bar */}
            <div className="glass" style={{
                margin: '0 0 25px 0',
                padding: '12px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
            }}>
                <Search size={20} color="var(--text-dim)" />
                <input
                    type="text"
                    placeholder="Buscar torneos, clubes o fechas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'white',
                        width: '100%',
                        outline: 'none',
                        fontSize: '15px'
                    }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredTournaments.length === 0 ? (activeTab === 'my' ? (
                    <div className="glass" style={{ textAlign: 'center', padding: '80px 20px', borderRadius: '30px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: 'rgba(255,b255,b255,0.03)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px',
                            border: '1px solid rgba(255,b255,b255,0.05)'
                        }}>
                            <Trophy size={40} color="var(--text-dim)" style={{ opacity: 0.3 }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Sin inscripciones</h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>Explora los mejores torneos y asegura tu lugar hoy mismo.</p>
                    </div>
                ) : (
                    <div className="glass" style={{ textAlign: 'center', padding: '60px 20px', borderRadius: '30px' }}>
                        <Calendar size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3, marginInline: 'auto' }} />
                        <p style={{ color: 'var(--text-dim)' }}>No hay torneos disponibles en este momento.</p>
                    </div>
                )) : (
                    filteredTournaments.map((tourney) => {
                        const isRegistered = registrations.includes(tourney.id);
                        return (
                            <div key={tourney.id} className="animate-fade-up">
                                <Card style={{
                                    padding: '0',
                                    overflow: 'hidden',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '28px',
                                    background: 'rgba(255,255,255,0.03)',
                                    boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{ position: 'relative', height: '140px' }}>
                                        <img
                                            src={tourney.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1000&auto=format&fit=crop'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            alt={tourney.name}
                                        />
                                        <div style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%)'
                                        }} />
                                        <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                                            <span style={{
                                                fontSize: '10px',
                                                padding: '6px 14px',
                                                borderRadius: '30px',
                                                background: isRegistered ? 'var(--secondary)' : 'rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(10px)',
                                                color: isRegistered ? 'var(--primary)' : 'white',
                                                fontWeight: '900',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.05em',
                                                border: '1px solid rgba(255,255,255,0.2)'
                                            }}>
                                                {isRegistered ? 'INSCRITO' : tourney.status}
                                            </span>
                                        </div>
                                        <div style={{ position: 'absolute', bottom: '15px', left: '20px', right: '20px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}>
                                                <Calendar size={13} strokeWidth={3} /> {new Date(tourney.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </div>
                                            <h3 style={{ fontSize: '22px', fontWeight: '900', color: 'white', lineHeight: '1.1' }}>{tourney.name}</h3>
                                        </div>
                                    </div>

                                    <div style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>
                                                    <MapPin size={16} color="var(--secondary)" /> {tourney.club}
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>
                                                    <Users size={15} color="var(--text-dim)" /> {tourney.current_participants}/{tourney.participants_limit} participantes
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '20px', fontWeight: '900', color: 'white', letterSpacing: '-0.5px' }}>
                                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tourney.price)}
                                                </div>
                                                <div style={{ fontSize: '9px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase' }}>Inscripción Abierta</div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => !isRegistered && handleRegister(tourney.id)}
                                            disabled={isRegistered || registering === tourney.id}
                                            style={{
                                                width: '100%',
                                                background: isRegistered ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, var(--secondary) 0%, #10b981 100%)',
                                                color: isRegistered ? 'var(--text-dim)' : 'var(--primary)',
                                                padding: '16px',
                                                borderRadius: '20px',
                                                fontWeight: '900',
                                                fontSize: '14px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '10px',
                                                border: 'none',
                                                cursor: isRegistered ? 'default' : 'pointer',
                                                boxShadow: isRegistered ? 'none' : '0 8px 20px rgba(163, 230, 53, 0.2)',
                                                transition: 'all 0.3s ease'
                                            }}>
                                            {registering === tourney.id ? (
                                                <Loader2 size={20} className="animate-spin" />
                                            ) : isRegistered ? (
                                                <><Trophy size={18} /> ESTÁS INSCRITO</>
                                            ) : (
                                                <><UserPlus size={18} /> INSCRIBIRME AHORA</>
                                            )}
                                        </button>
                                    </div>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Tournaments;
