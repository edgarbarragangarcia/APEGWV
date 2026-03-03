import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Plus, Trophy, Trash2, Calendar, Loader2, CheckCircle2, Pencil, Users, ChevronDown } from 'lucide-react';
import Card from '../components/Card';
import Skeleton from '../components/Skeleton';
import PageHero from '../components/PageHero';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import ConfirmationModal from '../components/ConfirmationModal';

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
    game_mode: string | null;
    address: string | null;
    budget_per_player: number | null;
    budget_prizes: number | null;
    budget_operational: number | null;
    budget_items: BudgetItem[] | null;
    approval_status?: 'pending' | 'approved' | 'rejected';
}



interface BudgetItem {
    id: string;
    label: string;
    amount: string;
    type: 'per_player' | 'fixed';
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    style?: React.CSSProperties;
}

const CustomSelect: React.FC<CustomSelectProps> = ({ value, onChange, options, placeholder = "Seleccionar", style }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = options.find(o => o.value === value)?.label || value || placeholder;

    return (
        <div ref={containerRef} style={{ position: 'relative', width: '100%', ...style }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: '12px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '15px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
            >
                <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selectedLabel}</span>
                <ChevronDown size={16} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', color: 'var(--text-dim)' }} />
            </div>

            {isOpen && (
                <div className="animate-fade-in" style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: 0,
                    right: 0,
                    background: '#1a1a1a', // Solid dark background
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    zIndex: 100,
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                    maxHeight: '200px',
                    overflowY: 'auto'
                }}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '12px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                color: option.value === value ? 'var(--secondary)' : 'white',
                                background: option.value === value ? 'rgba(163, 230, 53, 0.05)' : 'transparent',
                                cursor: 'pointer',
                                fontSize: '14px',
                                fontWeight: option.value === value ? '700' : '400',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {option.value === value && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--secondary)' }} />}
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

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
    const [isDeleting, setIsDeleting] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingTournaments, setPendingTournaments] = useState<Tournament[]>([]);
    const [viewingAdmin, setViewingAdmin] = useState(false);



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
        status: 'Abierto',
        game_mode: 'Juego por Golpes',
        address: '',
        budget_items: [
            { id: '1', label: 'Costo Op. por Jugador', amount: '', type: 'per_player' as const },
            { id: '2', label: 'Bolsa de Premios', amount: '', type: 'fixed' as const },
            { id: '3', label: 'Otros Gastos', amount: '', type: 'fixed' as const }
        ] as BudgetItem[]
    });

    const calculateBudget = () => {
        const income = (parseInt(formData.displayPrice.replace(/\D/g, '')) || 0) * (parseInt(formData.participants_limit) || 0);
        let expenses = 0;

        formData.budget_items.forEach(item => {
            const amount = parseInt(item.amount) || 0;
            if (item.type === 'per_player') {
                expenses += amount * (parseInt(formData.participants_limit) || 0);
            } else {
                expenses += amount;
            }
        });

        return { income, expenses, profit: income - expenses };
    };

    const addBudgetItem = () => {
        setFormData(prev => ({
            ...prev,
            budget_items: [
                ...prev.budget_items,
                { id: Date.now().toString(), label: '', amount: '', type: 'fixed' }
            ]
        }));
    };

    const removeBudgetItem = (id: string) => {
        setFormData(prev => ({
            ...prev,
            budget_items: prev.budget_items.filter(item => item.id !== id)
        }));
    };

    const updateBudgetItem = (id: string, field: keyof BudgetItem, value: string) => {
        setFormData(prev => ({
            ...prev,
            budget_items: prev.budget_items.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        }));
    };

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
            // Check Premium Status and Admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_premium, is_admin')
                .eq('id', user.id)
                .single();

            setIsAdmin(!!profile?.is_admin);

            if (!profile?.is_premium && !profile?.is_admin) {
                setIsPremium(false);
                setLoading(false);
                return;
            }

            setIsPremium(true);

            // If admin, fetch all pending tournaments
            if (profile?.is_admin) {
                const { data: pendingData } = await supabase
                    .from('tournaments')
                    .select('*, registrations: tournament_registrations(count)')
                    .eq('approval_status', 'pending')
                    .order('created_at', { ascending: false });

                if (pendingData) {
                    setPendingTournaments(pendingData.map((t: any) => ({
                        ...t,
                        current_participants: t.registrations?.[0]?.count || 0
                    })));
                }
            }

            // Fetch User Tournaments with participant count
            const { data: userTourneys, error } = await supabase
                .from('tournaments')
                .select(`
                    *,
                    registrations: tournament_registrations(count)
                `)
                .eq('creator_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const transformedTourneys = userTourneys?.map((t: any) => ({
                ...t,
                current_participants: t.registrations?.[0]?.count || 0
            })) || [];

            setTournaments(transformedTourneys);
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
                        game_mode: formData.game_mode,
                        address: formData.address,
                        budget_items: formData.budget_items as any,
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
                        game_mode: formData.game_mode,
                        address: formData.address,
                        budget_items: formData.budget_items as any,
                        creator_id: user.id,
                        approval_status: 'pending'
                    } as any])
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
            status: 'Abierto',
            game_mode: 'Juego por Golpes',
            address: '',
            budget_items: [
                { id: '1', label: 'Costo Op. por Jugador', amount: '', type: 'per_player' },
                { id: '2', label: 'Bolsa de Premios', amount: '', type: 'fixed' },
                { id: '3', label: 'Otros Gastos', amount: '', type: 'fixed' }
            ]
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
            status: tournament.status || 'Abierto',
            game_mode: tournament.game_mode || 'Juego por Golpes',
            address: tournament.address || '',
            budget_items: tournament.budget_items && Array.isArray(tournament.budget_items) && tournament.budget_items.length > 0
                ? (tournament.budget_items as BudgetItem[]).map(item => ({ ...item, amount: item.amount.toString() }))
                : [
                    { id: '1', label: 'Costo Op. por Jugador', amount: (tournament.budget_per_player || '').toString(), type: 'per_player' },
                    { id: '2', label: 'Bolsa de Premios', amount: (tournament.budget_prizes || '').toString(), type: 'fixed' },
                    { id: '3', label: 'Otros Gastos', amount: (tournament.budget_operational || '').toString(), type: 'fixed' }
                ]
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
        setIsDeleting(true);

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
        } finally {
            setIsDeleting(false);
        }
    };
    const handleViewParticipants = (tournament: Tournament) => {
        navigate(`/my-events/${tournament.id}/participants`);
    };

    const handleApprove = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('tournaments')
                .update({ approval_status: status } as any)
                .eq('id', id);

            if (error) throw error;

            // Update lists
            setPendingTournaments(pendingTournaments.filter(t => t.id !== id));
            if (status === 'approved') {
                // If the current user is the creator, update their list
                setTournaments(tournaments.map(t => t.id === id ? { ...t, approval_status: status } : t));
            }
        } catch (err) {
            console.error('Error updating tournament status:', err);
            alert('Error al actualizar el estado del torneo');
        }
    };

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '50vh' }}>
                <Loader2 className="animate-spin" color="var(--secondary)" size={32} />
            </div>
        );
    }

    // We will handle the Premium check inside the main container to allow proposals
    const showPremiumInvitation = !isPremium && !isAdmin;

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            <PageHero />
            <div style={styles.headerArea}>
                <PageHeader
                    noMargin
                    title="Gestión de Eventos"
                    onBack={() => navigate('/profile')}
                />
            </div>

            <div style={styles.contentContainer}>
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
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
                </div>
                {isAdmin && (
                    <div className="glass" style={{ padding: '8px', borderRadius: '15px', display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setViewingAdmin(false)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '10px',
                                background: !viewingAdmin ? 'var(--secondary)' : 'transparent',
                                color: !viewingAdmin ? 'var(--primary)' : 'white',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '13px',
                                transition: 'all 0.3s'
                            }}
                        >
                            MIS EVENTOS
                        </button>
                        <button
                            onClick={() => setViewingAdmin(true)}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '10px',
                                background: viewingAdmin ? 'var(--secondary)' : 'transparent',
                                color: viewingAdmin ? 'var(--primary)' : 'white',
                                border: 'none',
                                fontWeight: '800',
                                fontSize: '13px',
                                transition: 'all 0.3s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                            }}
                        >
                            SOLICITUDES {pendingTournaments.length > 0 && (
                                <span style={{ background: '#f87171', color: 'white', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
                                    {pendingTournaments.length}
                                </span>
                            )}
                        </button>
                    </div>
                )}

                {viewingAdmin ? (
                    // Admin View: Pending Tournaments
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'white', opacity: 0.7, marginBottom: '5px' }}>Solicitudes Pendientes</h2>
                        {pendingTournaments.length === 0 ? (
                            <div className="glass" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '30px' }}>
                                <CheckCircle2 size={32} color="var(--secondary)" style={{ marginBottom: '15px', opacity: 0.5 }} />
                                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>No hay solicitudes pendientes por el momento.</p>
                            </div>
                        ) : (
                            pendingTournaments.map(tourney => (
                                <Card key={tourney.id} style={{ padding: '20px', borderRadius: '25px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '15px', background: 'rgba(255,b255,b255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Trophy size={24} color="var(--secondary)" />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: '800' }}>{tourney.name}</h3>
                                            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>{tourney.club} | {new Date(tourney.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{tourney.description}</p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button
                                            onClick={() => handleApprove(tourney.id, 'approved')}
                                            className="btn-primary"
                                            style={{ padding: '10px', fontSize: '12px', background: '#4ade80', color: '#064e3b' }}
                                        >
                                            APROBAR
                                        </button>
                                        <button
                                            onClick={() => handleApprove(tourney.id, 'rejected')}
                                            style={{ padding: '10px', fontSize: '12px', borderRadius: '12px', border: '1px solid #f87171', color: '#f87171', background: 'transparent', fontWeight: '800' }}
                                        >
                                            RECHAZAR
                                        </button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                ) : (
                    // Regular Creator View
                    <>
                        {showPremiumInvitation && !showForm && (
                            <div className="glass" style={{ padding: '20px', borderRadius: '25px', textAlign: 'center', background: 'rgba(212, 175, 55, 0.05)', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                                <Trophy size={24} color="var(--accent)" style={{ marginBottom: '10px', marginInline: 'auto' }} />
                                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'white', marginBottom: '5px' }}>¿Quieres organizar un torneo?</h3>
                                <p style={{ fontSize: '13px', color: 'var(--text-dim)', marginBottom: '15px' }}>Envía tu propuesta básica para que el administrador la valide.</p>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="btn-primary"
                                    style={{ background: 'var(--secondary)', color: 'var(--primary)', padding: '12px', fontSize: '13px' }}
                                >
                                    Enviar Propuesta de Torneo
                                </button>
                            </div>
                        )}

                        {isPremium && !showForm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="btn-primary"
                            >
                                <Plus size={18} />
                                <span>Organizar Nuevo Torneo</span>
                            </button>
                        )}
                    </>
                )}

                {showForm ? (
                    <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '700' }}>{editingId ? 'Editar Evento' : (isPremium ? 'Nuevo Evento' : 'Propuesta de Torneo')}</h2>
                                {!isPremium && <p style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '700' }}>PREFORMATO BÁSICO</p>}
                            </div>
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

                            {isPremium && (
                                <>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Cant. Jugadores</label>
                                            <input
                                                type="number"
                                                required
                                                value={formData.participants_limit}
                                                onChange={e => setFormData({ ...formData, participants_limit: e.target.value })}
                                                style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Precio (COP)</label>
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
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Modalidad de Juego</label>
                                        <CustomSelect
                                            value={formData.game_mode}
                                            onChange={(val) => setFormData({ ...formData, game_mode: val })}
                                            options={[
                                                { value: "Juego por Golpes", label: "Juego por Golpes (Medal Play)" },
                                                { value: "Juego por Hoyos", label: "Juego por Hoyos (Match Play)" },
                                                { value: "Stableford", label: "Stableford" },
                                                { value: "Foursome", label: "Foursome" },
                                                { value: "Fourball", label: "Fourball" }
                                            ]}
                                        />
                                    </div>
                                </>
                            )}

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
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Dirección (Google Maps)</label>
                                <input
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px' }}
                                    placeholder="Pegar enlace o dirección"
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {isPremium && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Estado</label>
                                        <CustomSelect
                                            value={formData.status}
                                            onChange={(val) => setFormData({ ...formData, status: val })}
                                            options={[
                                                { value: "Abierto", label: "Abierto" },
                                                { value: "Cerrado", label: "Cerrado" },
                                                { value: "Finalizado", label: "Finalizado" }
                                            ]}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '13px', color: 'var(--text-dim)' }}>Fecha del Evento</label>
                                    <input
                                        required
                                        type="date"
                                        value={formData.date}
                                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: 'white', fontSize: '15px', boxSizing: 'border-box' }}
                                    />
                                </div>
                            </div>

                            <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

                            {isPremium && (
                                <>
                                    <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '10px 0' }} />

                                    {/* Budget Section */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--secondary)', margin: 0 }}>Mini Presupuesto</h3>
                                        <button
                                            type="button"
                                            onClick={addBudgetItem}
                                            style={{
                                                background: 'rgba(163, 230, 53, 0.1)',
                                                color: 'var(--secondary)',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                fontSize: '12px',
                                                fontWeight: '700',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '5px'
                                            }}
                                        >
                                            <Plus size={14} /> Agregar campo
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {formData.budget_items.map((item) => (
                                            <div key={item.id} className="glass" style={{ padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box', width: '100%' }}>
                                                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                                    <input
                                                        value={item.label}
                                                        onChange={e => updateBudgetItem(item.id, 'label', e.target.value)}
                                                        placeholder="Nombre del gasto..."
                                                        style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeBudgetItem(item.id)}
                                                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '35px', height: '35px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1fr)', gap: '10px' }}>
                                                    <input
                                                        type="number"
                                                        value={item.amount}
                                                        onChange={e => updateBudgetItem(item.id, 'amount', e.target.value)}
                                                        placeholder="Monto"
                                                        style={{ width: '100%', minWidth: 0, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '10px', padding: '8px 12px', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                                                    />
                                                    <CustomSelect
                                                        value={item.type}
                                                        onChange={(val) => updateBudgetItem(item.id, 'type', val as 'per_player' | 'fixed')}
                                                        options={[
                                                            { value: "fixed", label: "Fijo (Total)" },
                                                            { value: "per_player", label: "Por Jugador" }
                                                        ]}
                                                        style={{ fontSize: '13px' }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Live Budget Summary */}
                                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        {(() => {
                                            const { income, expenses, profit } = calculateBudget();
                                            return (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '13px' }}>
                                                        <span style={{ color: 'var(--text-dim)' }}>Ingresos Estimados:</span>
                                                        <span style={{ color: '#4ade80' }}>+ {new Intl.NumberFormat('es-CO').format(income)}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '13px' }}>
                                                        <span style={{ color: 'var(--text-dim)' }}>Gastos Totales:</span>
                                                        <span style={{ color: '#f87171' }}>- {new Intl.NumberFormat('es-CO').format(expenses)}</span>
                                                    </div>
                                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                                                        <span>Utilidad Neta:</span>
                                                        <span style={{ color: profit >= 0 ? 'var(--secondary)' : '#f87171' }}>
                                                            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(profit)}
                                                        </span>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </>
                            )}

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
                                className="btn-primary"
                                style={{ marginTop: '20px' }}
                            >
                                {saving ? <Loader2 className="animate-spin" /> : (isPremium ? 'PUBLICAR EVENTO' : 'ENVIAR PARA VALIDACIÓN')}
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

                                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                                                {/* Approval status badge */}
                                                <div style={{
                                                    fontSize: '9px',
                                                    fontWeight: '900',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    background: tourney.approval_status === 'approved' ? 'rgba(74, 222, 128, 0.1)' :
                                                        tourney.approval_status === 'rejected' ? 'rgba(248, 113, 113, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                                                    color: tourney.approval_status === 'approved' ? '#4ade80' :
                                                        tourney.approval_status === 'rejected' ? '#f87171' : '#fbbf24',
                                                    border: `1px solid ${tourney.approval_status === 'approved' ? 'rgba(74, 222, 128, 0.2)' :
                                                        tourney.approval_status === 'rejected' ? 'rgba(248, 113, 113, 0.2)' : 'rgba(251, 191, 36, 0.2)'}`,
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {tourney.approval_status === 'approved' ? 'Aprobado' :
                                                        tourney.approval_status === 'rejected' ? 'Rechazado' : 'Pendiente Admin'}
                                                </div>

                                                <div style={{
                                                    fontSize: '9px',
                                                    fontWeight: '900',
                                                    padding: '2px 8px',
                                                    borderRadius: '6px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    color: 'var(--text-dim)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {tourney.status}
                                                </div>
                                            </div>
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
            </div>
            <AnimatePresence>
                <ConfirmationModal
                    isOpen={deleteModal.isOpen}
                    onClose={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmDelete}
                    title="¿Eliminar Torneo?"
                    message={`¿Estás seguro que deseas eliminar "${deleteModal.tournamentName}"? Esta acción no se puede deshacer.`}
                    confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
                    cancelText="Cancelar"
                    type="danger"
                />
            </AnimatePresence>
        </div>
    );
};

// --- Styles ---
const styles = {
    pageContainer: {
        position: 'fixed' as 'fixed', inset: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', zIndex: 900
    },
    headerArea: {
        flexShrink: 0,
        position: 'relative' as 'relative',
        zIndex: 10,
        background: 'transparent',
        padding: '0 20px',
        paddingTop: 'var(--header-offset-top)'
    },
    contentContainer: {
        flex: 1,
        position: 'relative' as 'relative',
        zIndex: 10,
        display: 'flex', flexDirection: 'column' as 'column',
        padding: '0 20px calc(var(--nav-height) + 20px) 20px',
        overflowY: 'auto' as 'auto',
        WebkitOverflowScrolling: 'touch' as 'touch',
        gap: '15px'
    }
};

export default TournamentManager;
