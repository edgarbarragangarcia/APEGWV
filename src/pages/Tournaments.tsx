import React from 'react';
import Card from '../components/Card';
import { Calendar, Users, MapPin } from 'lucide-react';

const tournaments = [
    { id: 1, name: 'Copa Primavera 2024', date: '15 Abr', club: 'Golf Santander', participants: '84/100', status: 'Inscripciones Abiertas', price: '$ 350.000' },
    { id: 2, name: 'Open Amateur Madrid', date: '22 Abr', club: 'Real Club Vereda', participants: '120/120', status: 'Lista de Espera', price: '$ 450.000' },
    { id: 3, name: 'Torneo Benéfico APEG', date: '05 May', club: 'La Herrería', participants: '45/150', status: 'Inscripciones Abiertas', price: '$ 600.000' },
];

const Tournaments: React.FC = () => {
    return (
        <div className="animate-fade">
            <header style={{ marginBottom: '25px' }}>
                <h1 style={{ fontSize: '28px' }}>Torneos y Eventos</h1>
                <p style={{ color: 'var(--text-dim)' }}>Compite con los mejores de la comunidad</p>
            </header>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {tournaments.map((tourney) => (
                    <Card key={tourney.id} style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{
                            height: '8px',
                            background: tourney.status.includes('Abiertas') ? 'var(--secondary)' : '#f59e0b'
                        }} />
                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '5px' }}>
                                        <Calendar size={14} /> {tourney.date}
                                    </div>
                                    <h3 style={{ fontSize: '20px' }}>{tourney.name}</h3>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{tourney.price}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Green Fee Incl.</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)' }}>
                                    <MapPin size={16} /> {tourney.club}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-dim)' }}>
                                    <Users size={16} /> {tourney.participants}
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: tourney.status.includes('Abiertas') ? 'var(--secondary)' : '#f59e0b'
                                }}>
                                    {tourney.status}
                                </span>
                                <button style={{
                                    background: tourney.status.includes('Abiertas') ? 'var(--secondary)' : 'var(--glass-bg)',
                                    color: tourney.status.includes('Abiertas') ? 'var(--primary)' : 'var(--text-dim)',
                                    padding: '10px 25px',
                                    borderRadius: '12px',
                                    fontWeight: '600',
                                    fontSize: '14px'
                                }}>
                                    {tourney.status.includes('Abiertas') ? 'Inscribirme' : 'Ver info'}
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div style={{ marginTop: '30px' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>Ranking de la Temporada</h3>
                <Card>
                    {[1, 2, 3].map((rank) => (
                        <div key={rank} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            padding: '12px 0',
                            borderBottom: rank < 3 ? '1px solid var(--glass-border)' : 'none'
                        }}>
                            <div style={{ width: '30px', fontWeight: '800', fontSize: '18px', color: rank === 1 ? 'var(--accent)' : 'var(--text-dim)' }}>
                                #{rank}
                            </div>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-light)' }} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '600' }}>{rank === 1 ? 'Marcos Alonso' : rank === 2 ? 'Sofía Galán' : 'Eduardo Sanz'}</div>
                                <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Handicap {rank === 1 ? '2.1' : rank === 2 ? '4.5' : '5.0'}</div>
                            </div>
                            <div style={{ fontWeight: '700', color: 'var(--secondary)' }}>{1250 - (rank * 100)} pts</div>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
};

export default Tournaments;
