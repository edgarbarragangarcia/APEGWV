import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '../services/SupabaseManager';
import {
    Plus, Trophy, Trash2,
    Calendar, Loader2, CheckCircle2,
    Pencil
} from 'lucide-react';
import Card from '../components/Card';

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

const TournamentManager: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [isPremium, setIsPremium] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; tournamentId: string | null; tournamentName: string }>({
        isOpen: false,
        tournamentId: null,
        tournamentName: ''
    });

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        club: '',
        price: '', // Numeric string without formatting
        displayPrice: '', // String with thousand separators for UI
        participants_limit: '100',
        image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop'
    });

    const formatPrice = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
    };

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        const numeric = val.replace(/\D/g, '');
        setFormData(prev => ({
            ...prev,
            price: numeric,
            displayPrice: formatPrice(numeric)
        }));
    };

    useEffect(() => {
        fetchTournamentData();
    }, []);

    const fetchTournamentData = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/auth');
                return;
            }

            // Check Premium Status
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', session.user.id)
                .single();

            if (!profile?.is_premium) {
                setIsPremium(false);
                setLoading(false);
                return;
            }

            setIsPremium(true);

            // Fetch User Tournaments
            const { data: userTourneys, error } = await supabase
                .from('tournaments')
                .select('*')
                .eq('creator_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTournaments(userTourneys || []);

        } catch (err) {
            console.error('Error fetching tournament data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            let result;

            if (editingId) {
                result = await supabase
                    .from('tournaments')
                    .update({
                        name: formData.name,
                        description: formData.description,
                        date: formData.date,
                        club: formData.club,
                        price: parseFloat(formData.price),
                        participants_limit: parseInt(formData.participants_limit),
                        image_url: formData.image_url,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingId)
                    .select()
                    .single();
            } else {
                result = await supabase
                    .from('tournaments')
                    .insert([{
                        name: formData.name,
                        description: formData.description,
                        date: formData.date,
                        club: formData.club,
                        price: parseFloat(formData.price),
                        participants_limit: parseInt(formData.participants_limit),
                        image_url: formData.image_url,
                        creator_id: user.id
                    }])
                    .select()
                    .single();
            }

            const { data, error } = result;
            if (error) throw error;

            if (editingId) {
                setTournaments(tournaments.map(t => t.id === editingId ? data : t));
            } else {
                setTournaments([data, ...tournaments]);
            }

            setShowForm(false);
            resetForm();
        } catch (err) {
            console.error('Error saving tournament:', err);
            alert('Error al guardar el torneo');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            date: '',
            club: '',
            price: '',
            displayPrice: '',
            participants_limit: '100',
            image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop'
        });
        setEditingId(null);
    };

    const handleEditClick = (tournament: Tournament) => {
        const p = tournament.price.toString();
        setFormData({
            name: tournament.name,
            description: tournament.description || '',
            date: tournament.date.split('T')[0],
            club: tournament.club,
            price: p,
            displayPrice: formatPrice(p),
            participants_limit: tournament.participants_limit.toString(),
            image_url: tournament.image_url
        });
        setEditingId(tournament.id);
        setShowForm(true);
    };

    const handleDeleteClick = (tournament: Tournament) => {
        setDeleteModal({
            isOpen: true,
            tournamentId: tournament.id,
            tournamentName: tournament.name
        });
    };

    const confirmDelete = async () => {
        if (!deleteModal.tournamentId) return;

        try {
            const { error } = await supabase
                .from('tournaments')
                .delete()
                .eq('id', deleteModal.tournamentId);

            if (error) throw error;
            setTournaments(tournaments.filter(t => t.id !== deleteModal.tournamentId));
            setDeleteModal({ isOpen: false, tournamentId: null, tournamentName: '' });
        } catch (err) {
            console.error('Error deleting tournament:', err);
            alert('Error al eliminar el torneo');
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }

    if (!isPremium) {
        return (
            <div className="animate-fade" style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ background: 'rgba(212, 175, 55, 0.1)', padding: '30px', borderRadius: '30px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
                    <Trophy size={48} color="var(--accent)" style={{ marginBottom: '20px', marginInline: 'auto' }} />
                    <h2 style={{ fontSize: '22px', marginBottom: '10px' }}>Crea tu propio Torneo</h2>
                    <p style={{ color: 'var(--text-dim)', marginBottom: '25px', fontSize: '15px' }}>
                        Solo los miembros Premium pueden organizar torneos y eventos para la comunidad APEG.
                    </p>
                    <button
                        onClick={() => navigate('/profile')}
                        style={{ background: 'var(--accent)', color: 'var(--primary)', padding: '12px 25px', borderRadius: '15px', fontWeight: '800' }}
                    >
                        MEJORAR A PREMIUM
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade">
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '15px' }}>Mis Eventos Organizados</h2>

            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    style={{
                        background: 'var(--secondary)',
                        color: 'var(--primary)',
                        padding: '12px',
                        borderRadius: '15px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        fontWeight: '700',
                        fontSize: '14px',
                        width: '100%',
                        marginBottom: '20px'
                    }}
                >
                    <Plus size={18} />
                    <span>Organizar Nuevo Torneo</span>
                </button>
            )}

            {showForm ? (
                <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px', marginBottom: '30px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editingId ? 'Editar Evento' : 'Nuevo Evento'}</h2>
                        <button type="button" onClick={() => { setShowForm(false); resetForm(); }} style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Cancelar</button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Nombre del Torneo</label>
                            <input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                placeholder="Ej: Abierto APEG Verano"
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Fecha</label>
                                <input
                                    required
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Precio Green Fee (COP)</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        required
                                        type="text"
                                        inputMode="numeric"
                                        value={formData.displayPrice}
                                        onChange={handlePriceChange}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                        placeholder="0"
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '12px', pointerEvents: 'none' }}>
                                        $
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Club de Golf</label>
                            <input
                                required
                                value={formData.club}
                                onChange={e => setFormData({ ...formData, club: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                placeholder="Nombre del club"
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Descripción y Reglas</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', minHeight: '80px', resize: 'none' }}
                                placeholder="Detalles del formato, premios, etc..."
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                width: '100%',
                                background: saving ? 'rgba(163, 230, 53, 0.3)' : 'var(--secondary)',
                                color: 'var(--primary)',
                                padding: '15px',
                                borderRadius: '15px',
                                fontWeight: '800',
                                marginTop: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                            {saving ? 'GUARDANDO...' : 'PUBLICAR TORNEO'}
                        </button>
                    </div>
                </form>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {tournaments.length === 0 ? (
                        <div className="glass" style={{ padding: '40px 20px', textAlign: 'center' }}>
                            <Trophy size={48} color="var(--text-dim)" style={{ marginBottom: '15px', opacity: 0.3, marginInline: 'auto' }} />
                            <p style={{ color: 'var(--text-dim)' }}>Aún no has organizado eventos.</p>
                        </div>
                    ) : (
                        tournaments.map(tourney => (
                            <div key={tourney.id} style={{ position: 'relative', overflow: 'hidden', borderRadius: '20px' }}>
                                <Card style={{ marginBottom: 0, padding: '15px', display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                                    <div style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '12px',
                                        background: 'var(--primary-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Trophy size={24} color="var(--secondary)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '2px' }}>{tourney.name}</h3>
                                        <div style={{ display: 'flex', gap: '10px', fontSize: '12px', color: 'var(--text-dim)' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(tourney.date).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span style={{ color: 'var(--secondary)', fontWeight: '700' }}>
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tourney.price)}
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEditClick(tourney)} style={{ color: 'var(--text-dim)' }}><Pencil size={18} /></button>
                                        <button onClick={() => handleDeleteClick(tourney)} style={{ color: '#ff6b6b' }}><Trash2 size={18} /></button>
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModal.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000, padding: '20px', backdropFilter: 'blur(8px)'
                }}>
                    <div className="glass" style={{ width: '100%', maxWidth: '320px', padding: '25px', borderRadius: '24px', textAlign: 'center', background: 'var(--primary)' }}>
                        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>¿Eliminar evento?</h2>
                        <p style={{ color: 'var(--text-dim)', fontSize: '14px', marginBottom: '25px' }}>¿Estás seguro que deseas eliminar {deleteModal.tournamentName}?</p>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button onClick={() => setDeleteModal({ ...deleteModal, isOpen: false })} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)' }}>Cancelar</button>
                            <button onClick={confirmDelete} style={{ flex: 1, padding: '12px', borderRadius: '12px', background: '#ef4444', color: 'white', fontWeight: '700' }}>Eliminar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentManager;
