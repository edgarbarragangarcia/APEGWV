import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Plus, Trophy, Trash2, Calendar, Loader2, CheckCircle2, Pencil, Users, X } from 'lucide-react';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';

interface Tournament {
    id: string;
    name: string;
    description: string | null;
    date: string;
    club: string;
    price: number;
    participants_limit: number | null;
    current_participants: number | null;
    status: string | null;
    image_url: string | null;
}

interface Participant {
    id: string;
    full_name: string | null;
    id_photo_url: string | null;
    handicap: number | null;
}

const TournamentManager: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
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
    const [viewingParticipants, setViewingParticipants] = useState<{ isOpen: boolean; tournamentId: string | null; tournamentName: string }>({
        isOpen: false,
        tournamentId: null,
        tournamentName: ''
    });
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loadingParticipants, setLoadingParticipants] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        date: '',
        club: '',
        price: '', // Numeric string without formatting
        displayPrice: '', // String with thousand separators for UI
        participants_limit: '100',
        image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop',
        status: 'Abierto'
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

    const fetchTournamentData = async () => {
        if (!user) return;

        try {
            // Check Premium Status
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium')
                .eq('id', user.id)
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
                .select('id, name, description, date, club, price, participants_limit, current_participants, status, image_url')
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTournaments((userTourneys as unknown as Tournament[]) || []);
        } catch (err) {
            console.error('Error fetching tournament data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTournamentData();
        } else {
            setLoading(false);
        }
    }, [user]);

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
                        status: formData.status,
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
                        status: formData.status,
                        creator_id: user.id
                    }])
                    .select()
                    .single();
            }

            const { data, error } = result;
            if (error) throw error;

            if (editingId) {
                setTournaments(tournaments.map(t => t.id === editingId ? data as unknown as Tournament : t));
            } else {
                setTournaments([data as unknown as Tournament, ...tournaments]);
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
            image_url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop',
            status: 'Abierto'
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
            participants_limit: (tournament.participants_limit || 100).toString(),
            image_url: tournament.image_url || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1000&auto=format&fit=crop',
            status: tournament.status || 'Abierto'
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
    const handleViewParticipants = async (tournament: Tournament) => {
        setViewingParticipants({
            isOpen: true,
            tournamentId: tournament.id,
            tournamentName: tournament.name
        });
        setParticipants([]);
        setLoadingParticipants(true);

        try {
            const { data, error } = await supabase
                .from('tournament_registrations')
                .select(`
                    profiles:user_id (id, full_name, id_photo_url, handicap)
                `)
                .eq('tournament_id', tournament.id);

            if (error) throw error;
            const list = data?.map((r: any) => Array.isArray(r.profiles) ? r.profiles[0] : r.profiles).filter(Boolean) || [];
            setParticipants(list as Participant[]);
        } catch (err) {
            console.error('Error fetching participants:', err);
        } finally {
            setLoadingParticipants(false);
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
        <div className="animate-fade" style={{ paddingBottom: 'calc(var(--nav-height) + 20px)' }}>
            {/* Standard Header */}
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <span style={{
                    fontSize: '11px',
                    fontWeight: '900',
                    color: 'var(--secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    opacity: 0.8
                }}>
                    Panel de Organización
                </span>
                <h1 style={{
                    fontSize: '26px',
                    fontWeight: '900',
                    color: 'white',
                    marginTop: '4px'
                }}>
                    Gestión de Eventos
                </h1>
            </div>

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
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Estado de Inscripciones</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', outline: 'none' }}
                            >
                                <option value="Abierto">Abierto</option>
                                <option value="Cerrado">Cerrado</option>
                                <option value="Finalizado">Finalizado</option>
                            </select>
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
                    {loading ? (
                        [1, 2].map(i => (
                            <div key={i} className="glass" style={{ padding: '20px', borderRadius: '28px' }}>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                                    <Skeleton width="60px" height="60px" borderRadius="15px" />
                                    <div style={{ flex: 1 }}>
                                        <Skeleton width="70%" height="20px" style={{ marginBottom: '8px' }} />
                                        <Skeleton width="40%" height="15px" />
                                    </div>
                                </div>
                                <Skeleton height="40px" borderRadius="12px" />
                            </div>
                        ))
                    ) : tournaments.length === 0 ? (
                        <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '30px' }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px',
                                border: '1px solid rgba(255,255,255,0.05)'
                            }}>
                                <Trophy size={32} color="var(--text-dim)" style={{ opacity: 0.5 }} />
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Sin eventos organizados</h3>
                            <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>Crea tu primer torneo y empieza a gestionar participantes.</p>
                        </div>
                    ) : (
                        tournaments.map(tourney => (
                            <div key={tourney.id} className="animate-fade-up">
                                <Card style={{
                                    marginBottom: 0,
                                    padding: '15px',
                                    display: 'flex',
                                    gap: '18px',
                                    alignItems: 'center',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '26px',
                                    border: '1px solid rgba(255,b255,b255,0.06)',
                                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                                }}>
                                    <div style={{
                                        width: '75px',
                                        height: '75px',
                                        borderRadius: '20px',
                                        background: 'var(--primary-light)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        flexShrink: 0
                                    }}>
                                        <Trophy size={32} color="var(--secondary)" />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <h3 style={{
                                            fontSize: '17px',
                                            fontWeight: '900',
                                            marginBottom: '6px',
                                            color: 'white',
                                            letterSpacing: '-0.3px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }}>{tourney.name}</h3>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '13px' }}>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-dim)', fontWeight: '600' }}>
                                                <Calendar size={14} color="var(--secondary)" />
                                                {new Date(tourney.date).toLocaleDateString()}
                                            </span>
                                            <span style={{ color: 'var(--secondary)', fontWeight: '900' }}>
                                                {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tourney.price)}
                                            </span>
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                padding: '2px 8px',
                                                borderRadius: '6px',
                                                background: tourney.status === 'Abierto' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(255,255,255,0.05)',
                                                color: tourney.status === 'Abierto' ? 'var(--secondary)' : 'var(--text-dim)',
                                                textTransform: 'uppercase'
                                            }}>
                                                {tourney.status || 'Abierto'}
                                            </span>
                                            <button
                                                onClick={() => handleViewParticipants(tourney)}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px',
                                                    color: 'var(--secondary)',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    background: 'rgba(163, 230, 53, 0.1)',
                                                    padding: '4px 10px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Users size={14} />
                                                <span>{tourney.current_participants || 0} Participantes</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '5px' }}>
                                        <button onClick={() => handleEditClick(tourney)} style={{ color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}><Pencil size={18} /></button>
                                        <button onClick={() => handleDeleteClick(tourney)} style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.1)', borderRadius: '12px', padding: '10px', cursor: 'pointer' }}><Trash2 size={18} /></button>
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

            {/* Participants Modal */}
            {viewingParticipants.isOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    zIndex: 1001, backdropFilter: 'blur(10px)'
                }}>
                    <div className="animate-slide-up" style={{
                        width: '100%',
                        maxWidth: '500px',
                        background: 'var(--primary)',
                        borderTopLeftRadius: '30px',
                        borderTopRightRadius: '30px',
                        padding: '30px 20px calc(env(safe-area-inset-bottom) + 30px)',
                        maxHeight: '85vh',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <div>
                                <h2 style={{ fontSize: '20px', fontWeight: '800' }}>Participantes</h2>
                                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>{viewingParticipants.tournamentName}</p>
                            </div>
                            <button
                                onClick={() => setViewingParticipants({ ...viewingParticipants, isOpen: false })}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {loadingParticipants ? (
                                [1, 2, 3].map(i => <Skeleton key={i} height="70px" borderRadius="18px" />)
                            ) : participants.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)' }}>
                                    <Users size={48} style={{ marginBottom: '15px', opacity: 0.2, marginInline: 'auto' }} />
                                    <p>Aún no hay inscritos en este torneo.</p>
                                </div>
                            ) : (
                                participants.map(p => (
                                    <div key={p.id} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px',
                                        padding: '12px',
                                        background: 'rgba(255,255,255,0.03)',
                                        borderRadius: '18px',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                        <div style={{ width: '45px', height: '45px', borderRadius: '12px', overflow: 'hidden', background: 'var(--primary-light)' }}>
                                            <img
                                                src={p.id_photo_url || `https://ui-avatars.com/api/?name=${p.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt={p.full_name || 'User'}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{p.full_name || 'Golfista APEG'}</h4>
                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>Hándicap: {p.handicap ?? '--'}</p>
                                        </div>
                                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', color: 'var(--secondary)', padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '800' }}>
                                            CONFIRMADO
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TournamentManager;
