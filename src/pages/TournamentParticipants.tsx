import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { User, Trophy, Calendar, Users, ChevronLeft } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import PageHero from '../components/PageHero';
import PageHeader from '../components/PageHeader';


interface Participant {
    id: string;
    full_name: string | null;
    id_photo_url: string | null;
    handicap: number | null;
    email: string | null;
    phone: string | null;
    total_rounds: number | null;
    average_score: number | null;
}

const TournamentParticipants: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [tournamentName, setTournamentName] = useState('');
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);

    useEffect(() => {
        if (id) {
            fetchData();
        }
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch tournament details
            const { data: tournament, error: tournamentError } = await supabase
                .from('tournaments')
                .select('name')
                .eq('id', id || '')
                .single();

            if (tournamentError) throw tournamentError;
            setTournamentName(tournament.name);

            // Fetch participants registrations
            const { data: registrations, error: regError } = await supabase
                .from('tournament_registrations')
                .select('user_id')
                .eq('tournament_id', id || '');

            if (regError) throw regError;

            // Fetch profiles separately
            const userIds = registrations?.map(r => r.user_id).filter((uid): uid is string => uid !== null) || [];

            if (userIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, full_name, id_photo_url, handicap, email, phone, total_rounds, average_score')
                    .in('id', userIds);

                if (profilesError) throw profilesError;
                setParticipants(profilesData as Participant[]);
            } else {
                setParticipants([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900
        }}>
            <PageHero />
            {/* Header */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'transparent',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    title="Participantes"
                    subtitle={tournamentName || 'Cargando...'}
                    onBack={() => navigate(-1)}
                />
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 78px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                padding: '0 20px 40px 20px',
                overflowX: 'hidden'
            }}>

                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {[1, 2, 3, 4].map(i => <Skeleton key={i} height="70px" borderRadius="18px" />)}
                    </div>
                ) : selectedParticipant ? (
                    <div className="animate-fade-in" style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <button
                            onClick={() => setSelectedParticipant(null)}
                            style={{ marginBottom: '20px', width: 'fit-content', color: 'var(--secondary)', background: 'none', border: 'none', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: '600' }}
                        >
                            <ChevronLeft size={16} /> Volver a la lista
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                            <div style={{
                                width: '120px',
                                height: '120px',
                                borderRadius: '40px',
                                margin: '0 auto 20px',
                                overflow: 'hidden',
                                border: '4px solid var(--secondary)',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                            }}>
                                <img
                                    src={selectedParticipant.id_photo_url || `https://ui-avatars.com/api/?name=${selectedParticipant.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt={selectedParticipant.full_name || 'User'}
                                />
                            </div>
                            <h3 style={{ fontSize: '24px', fontWeight: '900', color: 'white', marginBottom: '5px' }}>{selectedParticipant.full_name}</h3>
                            <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '5px 12px', borderRadius: '20px', marginTop: '5px' }}>
                                <span style={{ color: 'var(--text-dim)', fontSize: '13px', marginRight: '5px' }}>Hándicap Index:</span>
                                <span style={{ color: 'white', fontWeight: '800' }}>{selectedParticipant.handicap ?? '--'}</span>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '25px' }}>
                            <div className="glass" style={{ padding: '20px', borderRadius: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                <Trophy size={24} color="var(--secondary)" style={{ marginBottom: '10px', opacity: 0.8 }} />
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Rondas</p>
                                <p style={{ fontSize: '24px', fontWeight: '900', color: 'white', lineHeight: 1 }}>{selectedParticipant.total_rounds || 0}</p>
                            </div>
                            <div className="glass" style={{ padding: '20px', borderRadius: '20px', textAlign: 'center', background: 'rgba(255,255,255,0.03)' }}>
                                <Calendar size={24} color="#60a5fa" style={{ marginBottom: '10px', opacity: 0.8 }} />
                                <p style={{ fontSize: '12px', color: 'var(--text-dim)', marginBottom: '5px', fontWeight: '600', textTransform: 'uppercase' }}>Promedio</p>
                                <p style={{ fontSize: '24px', fontWeight: '900', color: 'white', lineHeight: 1 }}>{selectedParticipant.average_score || '--'}</p>
                            </div>
                        </div>

                        <div className="glass" style={{ padding: '25px', borderRadius: '25px', marginBottom: '20px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-dim)', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '1px' }}>Información de Contacto</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px', fontWeight: '600' }}>EMAIL</p>
                                        <p style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{selectedParticipant.email || 'No disponible'}</p>
                                    </div>
                                </div>
                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }} />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Users size={20} color="white" />
                                    </div>
                                    <div>
                                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '2px', fontWeight: '600' }}>TELÉFONO</p>
                                        <p style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{selectedParticipant.phone || 'No disponible'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : participants.length === 0 ? (
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)', paddingBottom: '100px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
                            <Users size={32} style={{ opacity: 0.5 }} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Sin participantes</h3>
                        <p style={{ fontSize: '14px', textAlign: 'center', maxWidth: '250px' }}>Aún no hay jugadores inscritos en este torneo.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Total de inscritos</p>
                            <span style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: '800' }}>{participants.length}</span>
                        </div>
                        {participants.map(p => (
                            <div
                                key={p.id}
                                onClick={() => setSelectedParticipant(p)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '15px',
                                    padding: '12px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '18px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                className="item-hover"
                            >
                                <div style={{ width: '50px', height: '50px', borderRadius: '15px', overflow: 'hidden', background: 'var(--primary-light)', border: '1px solid rgba(255,255,255,0.1)' }}>
                                    <img
                                        src={p.id_photo_url || `https://ui-avatars.com/api/?name=${p.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        alt={p.full_name || 'User'}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '2px' }}>{p.full_name || 'Golfista APEG'}</h4>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Hándicap: <span style={{ color: 'white', fontWeight: '600' }}>{p.handicap ?? '--'}</span></span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                                    <ChevronLeft size={16} style={{ transform: 'rotate(180deg)', color: 'var(--text-dim)' }} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default TournamentParticipants;
