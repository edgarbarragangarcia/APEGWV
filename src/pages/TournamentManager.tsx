import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Plus, Trophy, Trash2, Calendar, Loader2, Pencil, Users, ChevronLeft, MapPin, X, Settings } from 'lucide-react';
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



// --- Sub-component for individual tournament cards ---
const TournamentCard = ({ tourney, onEdit, onDelete, onViewParticipants }: { tourney: Tournament, onEdit: () => void, onDelete: () => void, onViewParticipants: () => void }) => {
    const controls = useAnimation();
    const [isOpen, setIsOpen] = useState(false);
    const dragDistance = -80; // Space for a single "Gestión" button

    const onDragEnd = (_: any, info: any) => {
        if (info.offset.x < -30) {
            controls.start({ x: dragDistance });
            setIsOpen(true);
        } else {
            controls.start({ x: 0 });
            setIsOpen(false);
        }
    };

    const closeActions = () => {
        controls.start({ x: 0 });
        setIsOpen(false);
    };

    const ActionBtn = ({ hexColor, icon, onClick, label }: any) => (
        <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            style={{
                width: '56px',
                height: '80px',
                borderRadius: '18px',
                background: `color-mix(in srgb, ${hexColor} 15%, transparent)`,
                border: `1px solid color-mix(in srgb, ${hexColor} 30%, transparent)`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: hexColor,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                cursor: 'pointer'
            }}
        >
            {icon}
            <span style={{ fontSize: '8px', fontWeight: '950', textTransform: 'uppercase' }}>{label}</span>
        </motion.button>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ position: 'relative', marginBottom: '16px' }}
        >
            {/* Background Actions Layer */}
            <div style={{
                position: 'absolute',
                top: 0, bottom: 0, right: 0,
                width: '100px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingRight: '16px',
                zIndex: 1
            }}>
                <ActionBtn
                    hexColor="var(--secondary)"
                    icon={<Settings size={20} />}
                    onClick={() => { onViewParticipants(); closeActions(); }}
                    label="GESTIÓN"
                />
            </div>

            <div style={{
                position: 'relative',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '32px',
                overflow: 'hidden',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)',
            }}>
                {/* Content Layer (Draggable) */}
                <motion.div
                    drag="x"
                    dragConstraints={{ left: dragDistance, right: 0 }}
                    dragElastic={0.1}
                    animate={controls}
                    onDragEnd={onDragEnd}
                    whileDrag={{ cursor: 'grabbing' }}
                    onClick={() => {
                        if (isOpen) closeActions();
                        else { controls.start({ x: dragDistance }); setIsOpen(true); }
                    }}
                    style={{
                        position: 'relative',
                        zIndex: 2,
                        padding: '16px 20px',
                        background: 'rgba(6, 46, 36, 1)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '32px',
                        cursor: 'grab',
                        touchAction: 'pan-y'
                    }}
                >
                    {/* Swipe Hint */}
                    {!isOpen && (
                        <motion.div
                            animate={{ opacity: [0.4, 1, 0.4], x: [0, -3, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }}
                        >
                            <ChevronLeft size={16} />
                        </motion.div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
                        <span style={{
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: '950',
                            background: tourney.approval_status === 'approved' ? 'rgba(16, 185, 129, 0.1)' :
                                tourney.approval_status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            color: tourney.approval_status === 'approved' ? '#10b981' :
                                tourney.approval_status === 'rejected' ? '#ef4444' : '#f59e0b',
                            border: `1px solid ${tourney.approval_status === 'approved' ? 'rgba(16, 185, 129, 0.2)' :
                                tourney.approval_status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase'
                        }}>
                            {tourney.approval_status === 'approved' ? 'APROBADO' :
                                tourney.approval_status === 'rejected' ? 'RECHAZADA' : 'PENDIENTE ADMIN'}
                        </span>
                    </div>

                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                        <div style={{ position: 'relative' }}>
                            <div style={{
                                width: '64px', height: '64px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                            }}>
                                <img
                                    src={tourney.image_url || 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&q=80&w=200'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    alt=""
                                />
                            </div>
                            <div style={{ position: 'absolute', bottom: '-4px', right: '-4px', background: 'var(--secondary)', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #062e24', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                                <Trophy size={10} color="var(--primary)" strokeWidth={3} />
                            </div>
                        </div>
                        <div style={{ flex: 1, minWidth: 0, paddingRight: '20px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '900', marginBottom: '2px', color: 'white', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tourney.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                                <p style={{ fontSize: '16px', color: 'var(--secondary)', fontWeight: '950', letterSpacing: '-0.5px' }}>
                                    {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(tourney.price || 0)}
                                </p>
                                <span style={{
                                    fontSize: '9px',
                                    fontWeight: '800',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'var(--text-dim)',
                                    textTransform: 'uppercase'
                                }}>
                                    {tourney.status || 'ABIERTO'}
                                </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <MapPin size={10} color="var(--secondary)" strokeWidth={3} />
                                <div style={{ display: 'flex', flexDirection: 'row', gap: '6px', alignItems: 'center' }}>
                                    <span style={{ fontWeight: '800', fontSize: '11px', color: 'rgba(255,255,255,0.7)' }}>
                                        {tourney.club}
                                    </span>
                                    <div style={{ height: '10px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'rgba(255,255,255,0.3)', fontSize: '9px', fontWeight: '800' }}>
                                        <Calendar size={8} strokeWidth={3} />
                                        {new Date(tourney.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
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

    const formatPrice = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
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
            setIsPremium(!!profile?.is_premium);

            // Fetch User Tournaments with participant count



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
                        price: parseFloat(formData.price || '0'),
                        participants_limit: parseInt(formData.participants_limit || '100'),
                        image_url: formData.image_url,
                        status: formData.status,
                        game_mode: formData.game_mode,
                        address: formData.address,
                        budget_items: formData.budget_items as any,
                        approval_status: 'pending',
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
                        price: parseFloat(formData.price || '0'),
                        participants_limit: parseInt(formData.participants_limit || '100'),
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
            alert('Error al enviar la solicitud');
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

                <>
                    {/* Regular Creator View */}
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
                            <span>Enviar Nueva Solicitud</span>
                        </button>
                    )}
                </>

                {showForm ? (
                    <form onSubmit={handleSubmit} className="glass" style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                            <div>
                                <h2 style={{ fontSize: '18px', fontWeight: '800' }}>{editingId ? 'Editar Solicitud' : 'Nueva Solicitud'}</h2>
                                {!isPremium && <p style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '950' }}>PREFORMATO BÁSICO</p>}
                            </div>
                            <button
                                type="button"
                                onClick={resetForm}
                                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '8px', borderRadius: '12px', cursor: 'pointer' }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Nombre del Torneo*</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="form-input"
                                    placeholder="Ej: Copa Diamante 2024"
                                    required
                                />
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Club o Lugar*</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                    <input
                                        type="text"
                                        value={formData.club}
                                        onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        placeholder="Ej: Club Campestre"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="input-group">
                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Fecha del Torneo*</label>
                                <div style={{ position: 'relative' }}>
                                    <Calendar size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="form-input"
                                        style={{ paddingLeft: '40px' }}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary"
                                style={{ marginTop: '10px' }}
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'GUARDAR CAMBIOS' : 'ENVIAR SOLICITUD')}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                        {loading ? (
                            [1, 2].map(i => (
                                <div key={i} className="glass" style={{ padding: '20px', borderRadius: '32px' }}>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <Skeleton width="64px" height="64px" borderRadius="16px" />
                                        <div style={{ flex: 1 }}>
                                            <Skeleton width="70%" height="20px" style={{ marginBottom: '8px' }} />
                                            <Skeleton width="40%" height="15px" />
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : tournaments.length === 0 ? (
                            <div className="glass" style={{ padding: '60px 20px', textAlign: 'center', borderRadius: '30px', opacity: 0.6 }}>
                                <div style={{
                                    width: '80px', height: '80px',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
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
                                <TournamentCard
                                    key={tourney.id}
                                    tourney={tourney}
                                    onEdit={() => handleEditClick(tourney)}
                                    onDelete={() => handleDeleteClick(tourney)}
                                    onViewParticipants={() => handleViewParticipants(tourney)}
                                />
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
