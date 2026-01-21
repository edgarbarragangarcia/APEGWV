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
                    <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                        <Trophy size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.2, marginInline: 'auto' }} />
                        <p style={{ color: 'var(--text-dim)', fontSize: '15px' }}>No te has inscrito en ningún torneo aún.</p>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px' }}>
                        <Calendar size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3, marginInline: 'auto' }} />
                        <p style={{ color: 'var(--text-dim)' }}>No hay torneos disponibles en este momento.</p>
                    </div>
                )) : (
                    filteredTournaments.map((tourney) => {
                        const isRegistered = registrations.includes(tourney.id);
                        return (
                            <Card key={tourney.id} style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ height: '6px', background: isRegistered ? '#10b981' : 'var(--secondary)' }} />
                                <div style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '6px' }}>
                                                <Calendar size={13} /> {new Date(tourney.date).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                            </div>
                                            <h3 style={{ fontSize: '19px', fontWeight: '800', lineHeight: '1.2', wordBreak: 'break-word' }}>{tourney.name}</h3>
                                        </div>
                                        <div style={{ textAlign: 'right', marginLeft: '15px', flexShrink: 0 }}>
                                            <div style={{ fontSize: '17px', fontWeight: '900', color: 'white' }}>
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tourney.price)}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: '700' }}>GREEN FEE INCL.</div>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>
                                            <MapPin size={16} color="var(--secondary)" /> {tourney.club}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)', fontWeight: '500' }}>
                                            <Users size={16} color="var(--secondary)" /> {tourney.current_participants}/{tourney.participants_limit}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '5px 12px',
                                            borderRadius: '30px',
                                            background: isRegistered ? 'rgba(16, 185, 129, 0.1)' : 'rgba(163, 230, 53, 0.1)',
                                            color: isRegistered ? '#10b981' : 'var(--secondary)',
                                            fontWeight: '800',
                                            textTransform: 'uppercase'
                                        }}>
                                            {isRegistered ? 'INSCRITO' : tourney.status}
                                        </span>
                                        <button
                                            onClick={() => !isRegistered && handleRegister(tourney.id)}
                                            disabled={isRegistered || registering === tourney.id}
                                            style={{
                                                background: isRegistered ? 'rgba(255,255,255,0.05)' : 'var(--secondary)',
                                                color: isRegistered ? 'var(--text-dim)' : 'var(--primary)',
                                                padding: '10px 22px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: 'none',
                                                cursor: isRegistered ? 'default' : 'pointer',
                                                boxShadow: isRegistered ? 'none' : '0 4px 15px rgba(163, 230, 53, 0.2)'
                                            }}>
                                            {registering === tourney.id ? (
                                                <Loader2 size={16} className="animate-spin" />
                                            ) : isRegistered ? (
                                                <>LISTO</>
                                            ) : (
                                                <><UserPlus size={16} /> INSCRIBIRME</>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default Tournaments;
