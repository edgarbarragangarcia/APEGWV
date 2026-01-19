import React, { useEffect, useState } from 'react';
import { Calendar, Users, MapPin, Search, Trophy, Loader2, Trophy as TrophyIcon, UserPlus } from 'lucide-react';
import Card from '../components/Card';
import { supabase } from '../services/SupabaseManager';
import TournamentManager from './TournamentManager';

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
    const [viewTab, setViewTab] = useState<'all' | 'manage'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const { data, error } = await supabase
                    .from('tournaments')
                    .select('*')
                    .order('date', { ascending: true });

                if (error) throw error;
                setTournaments(data || []);
            } catch (err) {
                console.error('Error fetching tournaments:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchTournaments();
    }, []);

    const filteredTournaments = tournaments.filter(t =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.club.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    return (
        <div className="animate-fade" style={{ paddingBottom: '100px' }}>
            <header style={{ marginBottom: '20px' }}>
                <h1 style={{ fontSize: '28px' }}>Eventos</h1>
                <p style={{ color: 'var(--text-dim)' }}>Compite y crece en la comunidad APEG</p>
            </header>

            {/* Tab Bar - Similar to Shop */}
            <div style={{
                display: 'flex',
                background: 'rgba(255,255,255,0.05)',
                padding: '4px',
                borderRadius: '16px',
                marginBottom: '20px'
            }}>
                <button
                    onClick={() => setViewTab('all')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: viewTab === 'all' ? 'var(--secondary)' : 'transparent',
                        color: viewTab === 'all' ? 'var(--primary)' : 'var(--text-dim)',
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
                    <Trophy size={18} /> Torneos
                </button>
                <button
                    onClick={() => setViewTab('manage')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        background: viewTab === 'manage' ? 'var(--secondary)' : 'transparent',
                        color: viewTab === 'manage' ? 'var(--primary)' : 'var(--text-dim)',
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
                    <TrophyIcon size={18} /> Mis Eventos
                </button>
            </div>

            {viewTab === 'all' ? (
                <>
                    {/* Search Bar */}
                    <div className="glass" style={{
                        padding: '12px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        marginBottom: '25px'
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
                        {filteredTournaments.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <Calendar size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3, marginInline: 'auto' }} />
                                <p style={{ color: 'var(--text-dim)' }}>No hay torneos disponibles en este momento.</p>
                            </div>
                        ) : (
                            filteredTournaments.map((tourney) => (
                                <Card key={tourney.id} style={{ padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ height: '6px', background: 'var(--secondary)' }} />
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
                                                background: 'rgba(163, 230, 53, 0.1)',
                                                color: 'var(--secondary)',
                                                fontWeight: '800',
                                                textTransform: 'uppercase'
                                            }}>
                                                {tourney.status}
                                            </span>
                                            <button style={{
                                                background: 'var(--secondary)',
                                                color: 'var(--primary)',
                                                padding: '10px 22px',
                                                borderRadius: '12px',
                                                fontWeight: '800',
                                                fontSize: '13px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                border: 'none',
                                                boxShadow: '0 4px 15px rgba(163, 230, 53, 0.2)'
                                            }}>
                                                <UserPlus size={16} /> INSCRIBIRME
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <TournamentManager />
            )}
        </div>
    );
};

export default Tournaments;

