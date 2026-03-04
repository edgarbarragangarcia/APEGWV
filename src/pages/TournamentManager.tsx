import React, { useState, useEffect } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { Plus, Trophy, Trash2, Calendar, Loader2, Users, ChevronLeft, MapPin, Settings, ChevronDown, ChevronUp, Minus, ShieldCheck, HeartHandshake, Copy, CheckCircle2 } from 'lucide-react';
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
    current_participants?: number;
    paid_participants?: number;
    status: string | null;
    image_url: string | null;
    game_mode: string | null;
    address: string | null;
    budget_per_player: number | null;
    budget_prizes: number | null;
    budget_operational: number | null;
    budget_items: BudgetItem[] | null;
    approval_status?: 'pending' | 'approved' | 'rejected';
    rules?: string[];
    custom_rules?: string | null;
    sponsors?: string | null;
    prizes?: string | null;
    guests?: string | null;
}



interface BudgetItem {
    id: string;
    label: string;
    amount: string;
    type: 'per_player' | 'fixed';
    category?: 'income' | 'expense';
}



// --- Sub-component for individual tournament cards ---
const TournamentCard = ({ tourney, onEdit }: { tourney: Tournament, onEdit: () => void }) => {
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
                    onClick={() => { onEdit(); closeActions(); }}
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

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-start', marginBottom: '16px' }}>
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
                        <span style={{
                            fontSize: '9px',
                            fontWeight: '800',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-dim)',
                            textTransform: 'uppercase',
                            border: '1px solid rgba(255,255,255,0.1)',
                            letterSpacing: '0.02em'
                        }}>
                            {tourney.status || 'ABIERTO'}
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

    // Collapsible sections state
    const [showBudgetSection, setShowBudgetSection] = useState(false);
    const [showRulesSection, setShowRulesSection] = useState(false);
    const [showSponsorsSection, setShowSponsorsSection] = useState(false);
    const [showPrizesSection, setShowPrizesSection] = useState(false);
    const [showGuestsSection, setShowGuestsSection] = useState(false);
    const [guestSearchQuery, setGuestSearchQuery] = useState('');
    const [profileResults, setProfileResults] = useState<{ id: string, full_name: string, avatar_url: string | null }[]>([]);
    const [searchingProfiles, setSearchingProfiles] = useState(false);
    const [copied, setCopied] = useState(false);






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
            { id: '1', label: 'Costo Op. por Jugador', amount: '', type: 'per_player' as const, category: 'expense' },
            { id: '2', label: 'Bolsa de Premios', amount: '', type: 'fixed' as const, category: 'expense' },
            { id: '3', label: 'Otros Gastos', amount: '', type: 'fixed' as const, category: 'expense' }
        ] as BudgetItem[],
        rules: [] as string[],
        custom_rules: '',
        sponsors: [] as { id: string, name: string }[],
        prizes: [] as { id: string, name: string }[],
        guests: [] as { id: string, name: string }[],
        current_participants: 0,
        paid_participants: 0
    });

    const formatPrice = (val: string) => {
        const numeric = val.replace(/\D/g, '');
        if (!numeric) return '';
        return new Intl.NumberFormat('es-CO').format(parseInt(numeric));
    };

    const searchProfiles = async (query: string) => {
        if (!query || query.length < 2) {
            setProfileResults([]);
            return;
        }

        setSearchingProfiles(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .ilike('full_name', `%${query}%`)
                .limit(5);

            if (error) throw error;
            const mappedResults = (data || []).map(p => ({
                id: p.id,
                full_name: p.full_name || 'Usuario APEG',
                avatar_url: p.avatar_url
            }));
            setProfileResults(mappedResults);
        } catch (err) {
            console.error('Error searching profiles:', err);
        } finally {
            setSearchingProfiles(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (guestSearchQuery) {
                searchProfiles(guestSearchQuery);
            } else {
                setProfileResults([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [guestSearchQuery]);



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

            // Fetch all registrations to count statuses (grouped by tournament)
            const { data: regStats } = await supabase
                .from('tournament_registrations')
                .select('tournament_id, registration_status');

            const statsMap = (regStats || []).reduce((acc: any, curr: any) => {
                if (!acc[curr.tournament_id]) acc[curr.tournament_id] = { total: 0, paid: 0 };
                acc[curr.tournament_id].total++;
                if (curr.registration_status === 'paid' || curr.registration_status === 'Confirmado') {
                    acc[curr.tournament_id].paid++;
                }
                return acc;
            }, {});

            const transformedTourneys = userTourneys?.map((t: any) => ({
                ...t,
                current_participants: statsMap[t.id]?.total || 0,
                paid_participants: statsMap[t.id]?.paid || 0
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
                        rules: formData.rules,
                        custom_rules: formData.custom_rules,
                        sponsors: formData.sponsors.map(s => s.name).filter(Boolean).join('\n'),
                        prizes: formData.prizes.map(p => p.name).filter(Boolean).join('\n'),
                        guests: formData.guests.map(g => g.name).filter(Boolean).join('\n'),
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
                        rules: formData.rules,
                        custom_rules: formData.custom_rules,
                        sponsors: formData.sponsors.map(s => s.name).filter(Boolean).join('\n'),
                        prizes: formData.prizes.map(p => p.name).filter(Boolean).join('\n'),
                        guests: formData.guests.map(g => g.name).filter(Boolean).join('\n'),
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
                { id: '1', label: 'Costo Op. por Jugador', amount: '', type: 'per_player' as const, category: 'expense' },
                { id: '2', label: 'Bolsa de Premios', amount: '', type: 'fixed' as const, category: 'expense' },
                { id: '3', label: 'Otros Gastos', amount: '', type: 'fixed' as const, category: 'expense' }
            ],
            rules: [],
            custom_rules: '',
            sponsors: [],
            prizes: [],
            guests: [],
            current_participants: 0,
            paid_participants: 0
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
            budget_items: Array.isArray(tournament.budget_items)
                ? (tournament.budget_items as BudgetItem[]).map(item => ({ ...item, amount: item.amount?.toString() || '' }))
                : [
                    { id: '1', label: 'Costo Op. por Jugador', amount: (tournament.budget_per_player || '').toString(), type: 'per_player', category: 'expense' },
                    { id: '2', label: 'Bolsa de Premios', amount: (tournament.budget_prizes || '').toString(), type: 'fixed', category: 'expense' },
                    { id: '3', label: 'Otros Gastos', amount: (tournament.budget_operational || '').toString(), type: 'fixed', category: 'expense' }
                ],
            rules: tournament.rules || [],
            custom_rules: tournament.custom_rules || '',
            sponsors: tournament.sponsors ? tournament.sponsors.split('\n').filter(Boolean).map((name, i) => ({ id: i.toString(), name })) : [],
            prizes: tournament.prizes ? tournament.prizes.split('\n').filter(Boolean).map((name, i) => ({ id: i.toString(), name })) : [],
            guests: tournament.guests ? tournament.guests.split('\n').filter(Boolean).map((name, i) => ({ id: i.toString(), name })) : [],
            current_participants: tournament.current_participants || 0,
            paid_participants: tournament.paid_participants || 0
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
            <style>{`
                .form-input {
                    width: 100%;
                    box-sizing: border-box !important;
                    background: rgba(255,255,255,0.04) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 16px !important;
                    padding: 14px 16px !important;
                    color: white !important;
                    font-size: 15px !important;
                    font-family: var(--font-main);
                    transition: all 0.3s ease;
                    outline: none;
                }
                .form-input:focus {
                    background: rgba(255,255,255,0.07) !important;
                    border-color: var(--secondary) !important;
                    box-shadow: 0 0 0 4px rgba(163, 230, 53, 0.1);
                }
                .form-input.with-icon {
                    padding-left: 40px !important;
                }
                .input-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    margin-bottom: 4px;
                }
                .form-label {
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--text-dim);
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    padding-left: 4px;
                }
                select.form-input {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23A3E635' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 12px center;
                    background-size: 18px;
                    padding-right: 40px;
                }
                .form-input-sm {
                    width: 100%;
                    box-sizing: border-box !important;
                    background: rgba(255,255,255,0.04) !important;
                    border: 1px solid rgba(255,255,255,0.08) !important;
                    border-radius: 12px !important;
                    padding: 8px 12px !important;
                    color: white !important;
                    font-size: 13px !important;
                    font-family: var(--font-main);
                    transition: all 0.3s ease;
                    outline: none;
                }
                .form-input-sm:focus {
                    background: rgba(255,255,255,0.07) !important;
                    border-color: var(--secondary) !important;
                    box-shadow: 0 0 0 4px rgba(163, 230, 53, 0.1);
                }
                .form-input-sm.with-icon {
                    padding-left: 26px !important;
                }
                select.form-input-sm {
                    appearance: none;
                    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23A3E635' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
                    background-repeat: no-repeat;
                    background-position: right 8px center;
                    background-size: 14px;
                    padding-right: 30px !important;
                }
                input[type="date"].form-input {
                    appearance: none;
                    -webkit-appearance: none;
                    min-height: 50px;
                }
                input[type="date"].form-input::-webkit-date-and-time-value {
                    text-align: left;
                    margin: 0;
                }
                input[type="date"].form-input::-webkit-calendar-picker-indicator {
                    display: none;
                    -webkit-appearance: none;
                }
            `}</style>
            <PageHero />
            <div style={styles.headerArea}>
                <PageHeader
                    noMargin
                    title="Gestión de Eventos"
                    onBack={() => navigate('/profile')}
                />
            </div>

            <div style={styles.contentContainer}>

                <AnimatePresence mode="wait">
                    {showForm ? (

                        <motion.form
                            id="main-tournament-form"
                            key="tournament-form"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            onSubmit={handleSubmit}
                            style={{ width: '100%', paddingBottom: '30px', paddingTop: '20px' }}
                        >

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="input-group">
                                        <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Club o Lugar*</label>
                                        <div style={{ position: 'relative' }}>
                                            <MapPin size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                            <input
                                                type="text"
                                                value={formData.club}
                                                onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                                                className="form-input with-icon"
                                                placeholder="Ej: Club Campestre"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Fecha*</label>
                                        <div style={{ position: 'relative' }}>
                                            <Calendar size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                                className="form-input with-icon"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Advanced Fields - Only for Management/Edit Mode */}
                                {editingId && (
                                    <>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="input-group">
                                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Precio Inscripción</label>
                                                <input
                                                    type="text"
                                                    value={formData.displayPrice}
                                                    onChange={(e) => {
                                                        const raw = e.target.value.replace(/\D/g, '');
                                                        setFormData({ ...formData, price: raw, displayPrice: formatPrice(raw) });
                                                    }}
                                                    className="form-input"
                                                    placeholder="$ 0"
                                                />
                                            </div>
                                            <div className="input-group">
                                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Límite Participantes</label>
                                                <div style={{ position: 'relative' }}>
                                                    <Users size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--secondary)' }} />
                                                    <input
                                                        type="number"
                                                        value={formData.participants_limit}
                                                        onChange={(e) => setFormData({ ...formData, participants_limit: e.target.value })}
                                                        className="form-input with-icon"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="input-group">
                                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Modo de Juego</label>
                                                <select
                                                    value={formData.game_mode}
                                                    onChange={(e) => setFormData({ ...formData, game_mode: e.target.value })}
                                                    className="form-input"
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                >
                                                    <option value="Juego por Golpes">Juego por Golpes</option>
                                                    <option value="Stableford">Stableford</option>
                                                    <option value="Match Play">Match Play</option>
                                                    <option value="Scramble">Scramble</option>
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Estado del Evento</label>
                                                <select
                                                    value={formData.status}
                                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                                    className="form-input"
                                                    style={{ background: 'rgba(255,255,255,0.05)', color: 'white' }}
                                                >
                                                    <option value="Borrador">Borrador</option>
                                                    <option value="Abierto (Inscripciones)">Abierto (Inscripciones)</option>
                                                    <option value="Cerrado (Inscripciones)">Cerrado (Inscripciones)</option>
                                                    <option value="Finalizado">Finalizado</option>
                                                </select>
                                            </div>
                                        </div>

                                        {formData.status === 'Abierto (Inscripciones)' && editingId && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="glass"
                                                style={{
                                                    padding: '16px',
                                                    borderRadius: '20px',
                                                    background: 'rgba(163, 230, 53, 0.05)',
                                                    border: '1px solid rgba(163, 230, 53, 0.2)',
                                                    marginBottom: '15px'
                                                }}
                                            >
                                                <label style={{ fontSize: '10px', fontWeight: '950', color: 'var(--secondary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Link Público de Inscripción
                                                </label>
                                                <div style={{ display: 'flex', gap: '10px' }}>
                                                    <div style={{
                                                        flex: 1,
                                                        background: 'rgba(0,0,0,0.2)',
                                                        padding: '10px 14px',
                                                        borderRadius: '12px',
                                                        fontSize: '12px',
                                                        color: 'white',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                        border: '1px solid rgba(255,255,255,0.05)',
                                                        fontFamily: 'monospace'
                                                    }}>
                                                        {`https://apegwv.vercel.app/tournament-register/${editingId}`}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const url = `https://apegwv.vercel.app/tournament-register/${editingId}`;
                                                            navigator.clipboard.writeText(url);
                                                            setCopied(true);
                                                            setTimeout(() => setCopied(false), 2000);
                                                            if (navigator.vibrate) navigator.vibrate(50);
                                                        }}
                                                        style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '12px',
                                                            background: 'var(--secondary)',
                                                            color: 'var(--primary)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <AnimatePresence>
                                                            {copied ? (
                                                                <motion.div
                                                                    key="check"
                                                                    initial={{ scale: 0, opacity: 0 }}
                                                                    animate={{ scale: 1, opacity: 1 }}
                                                                    exit={{ scale: 0, opacity: 0 }}
                                                                    style={{
                                                                        position: 'absolute',
                                                                        top: '-35px',
                                                                        background: 'var(--secondary)',
                                                                        color: 'var(--primary)',
                                                                        padding: '4px 8px',
                                                                        borderRadius: '8px',
                                                                        fontSize: '10px',
                                                                        fontWeight: '900',
                                                                        whiteSpace: 'nowrap',
                                                                        boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                                                                    }}
                                                                >
                                                                    ¡COPIADO!
                                                                    <div style={{
                                                                        position: 'absolute',
                                                                        bottom: '-4px',
                                                                        left: '50%',
                                                                        transform: 'translateX(-50%) rotate(45deg)',
                                                                        width: '8px',
                                                                        height: '8px',
                                                                        background: 'var(--secondary)'
                                                                    }} />
                                                                </motion.div>
                                                            ) : null}
                                                        </AnimatePresence>
                                                        {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
                                                    </button>
                                                </div>
                                                <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '8px', fontWeight: '600' }}>
                                                    Copia este link para compartirlo con los jugadores.
                                                </p>
                                            </motion.div>
                                        )}

                                        <div className="input-group">
                                            <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Descripción / Notas</label>
                                            <textarea
                                                value={formData.description}
                                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                                className="form-input"
                                                rows={3}
                                                placeholder="Detalles adicionales del torneo..."
                                            />
                                        </div>

                                        {/* Budget Section */}
                                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => setShowBudgetSection(!showBudgetSection)}
                                            >
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--primary)' }}>$</span>
                                                    </div>
                                                    Presupuesto Estimado
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {showBudgetSection ? <ChevronUp size={20} color="var(--text-dim)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {showBudgetSection && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '15px', marginTop: '15px' }}>
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const newItem: BudgetItem = {
                                                                        id: Date.now().toString(),
                                                                        label: '',
                                                                        amount: '',
                                                                        type: 'fixed',
                                                                        category: 'expense'
                                                                    };
                                                                    setFormData({ ...formData, budget_items: [...formData.budget_items, newItem] });
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,b255,b255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: 'white',
                                                                    fontSize: '11px',
                                                                    padding: '6px 12px',
                                                                    borderRadius: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '800'
                                                                }}
                                                            >
                                                                <Plus size={14} /> Rubro
                                                            </button>
                                                        </div>

                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                                            {formData.budget_items.map((item, idx) => {
                                                                const isDefaultItem = ['1', '2', '3'].includes(item.id);
                                                                return (
                                                                    <div key={item.id} style={{ display: 'flex', flexDirection: 'column', gap: '10px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                            {isDefaultItem ? (
                                                                                <label style={{ fontSize: '13px', color: 'var(--text-dim)', fontWeight: '800' }}>{item.label}</label>
                                                                            ) : (
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.label}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...formData.budget_items];
                                                                                        newItems[idx].label = e.target.value;
                                                                                        setFormData({ ...formData, budget_items: newItems });
                                                                                    }}
                                                                                    placeholder="Nombre del rubro"
                                                                                    className="form-input-sm"
                                                                                    style={{ width: 'calc(100% - 30px)' }}
                                                                                />
                                                                            )}
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => {
                                                                                    const newItems = formData.budget_items.filter((_, i) => i !== idx);
                                                                                    setFormData({ ...formData, budget_items: newItems });
                                                                                }}
                                                                                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                            <div style={{ flex: 1, position: 'relative' }}>
                                                                                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)', fontSize: '13px', fontWeight: '800' }}>$</span>
                                                                                <input
                                                                                    type="text"
                                                                                    value={item.amount ? new Intl.NumberFormat('es-CO').format(parseInt(item.amount)) : ''}
                                                                                    onChange={(e) => {
                                                                                        const newItems = [...formData.budget_items];
                                                                                        newItems[idx].amount = e.target.value.replace(/\D/g, '');
                                                                                        setFormData({ ...formData, budget_items: newItems });
                                                                                    }}
                                                                                    className="form-input-sm with-icon"
                                                                                    placeholder="0"
                                                                                    style={{ fontSize: '13px', fontWeight: '700' }}
                                                                                />
                                                                            </div>
                                                                            <select
                                                                                value={item.type}
                                                                                onChange={(e) => {
                                                                                    const newItems = [...formData.budget_items];
                                                                                    newItems[idx].type = e.target.value as any;
                                                                                    setFormData({ ...formData, budget_items: newItems });
                                                                                }}
                                                                                className="form-input-sm"
                                                                                style={{ width: '110px', background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: '700' }}
                                                                            >
                                                                                <option value="per_player">Por Jugador</option>
                                                                                <option value="fixed">Fijo</option>
                                                                            </select>
                                                                            {isDefaultItem ? (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newItems = [...formData.budget_items];
                                                                                        newItems[idx].category = (item.category || 'expense') === 'income' ? 'expense' : 'income';
                                                                                        setFormData({ ...formData, budget_items: newItems });
                                                                                    }}
                                                                                    style={{
                                                                                        width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                                                        background: (item.category || 'expense') === 'income' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                                        color: (item.category || 'expense') === 'income' ? 'var(--secondary)' : '#ef4444',
                                                                                        border: '1px solid ' + ((item.category || 'expense') === 'income' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                                                                    }}
                                                                                >
                                                                                    {(item.category || 'expense') === 'income' ? <Plus size={18} /> : <Minus size={18} />}
                                                                                </button>
                                                                            ) : (
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const newItems = [...formData.budget_items];
                                                                                        newItems[idx].category = (item.category || 'expense') === 'income' ? 'expense' : 'income';
                                                                                        setFormData({ ...formData, budget_items: newItems });
                                                                                    }}
                                                                                    style={{
                                                                                        width: '38px', height: '38px', borderRadius: '12px', flexShrink: 0,
                                                                                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                                                                        background: (item.category || 'expense') === 'income' ? 'rgba(163, 230, 53, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                                                        color: (item.category || 'expense') === 'income' ? 'var(--secondary)' : '#ef4444',
                                                                                        border: '1px solid ' + ((item.category || 'expense') === 'income' ? 'rgba(163, 230, 53, 0.2)' : 'rgba(239, 68, 68, 0.2)')
                                                                                    }}
                                                                                >
                                                                                    {(item.category || 'expense') === 'income' ? <Plus size={18} /> : <Minus size={18} />}
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>

                                                        <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dotted rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '800', letterSpacing: '0.3px' }}>Balance Real (Recaudado):</span>
                                                                <span style={{ fontSize: '18px', fontWeight: '950', color: 'var(--secondary)' }}>
                                                                    {(() => {
                                                                        const paidCount = formData.paid_participants || 0;
                                                                        let income = paidCount * parseFloat(formData.price || '0');
                                                                        let costs = 0;
                                                                        formData.budget_items.forEach((item) => {
                                                                            const val = parseFloat(item.amount || '0');
                                                                            // Costs are usually based on current active participants or fixed
                                                                            const calculatedVal = item.type === 'per_player' ? val * (formData.current_participants || 0) : val;
                                                                            if ((item.category || 'expense') === 'income') {
                                                                                income += (item.type === 'per_player' ? val * paidCount : val);
                                                                            } else {
                                                                                costs += calculatedVal;
                                                                            }
                                                                        });
                                                                        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(income - costs);
                                                                    })()}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: 0.6 }}>
                                                                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '800' }}>Balance Estimado (Proyectado):</span>
                                                                <span style={{ fontSize: '15px', fontWeight: '900', color: 'white' }}>
                                                                    {(() => {
                                                                        const limit = parseInt(formData.participants_limit || '0');
                                                                        let income = limit * parseFloat(formData.price || '0');
                                                                        let costs = 0;
                                                                        formData.budget_items.forEach((item) => {
                                                                            const val = parseFloat(item.amount || '0');
                                                                            const calculatedVal = item.type === 'per_player' ? val * limit : val;
                                                                            if ((item.category || 'expense') === 'income') {
                                                                                income += calculatedVal;
                                                                            } else {
                                                                                costs += calculatedVal;
                                                                            }
                                                                        });
                                                                        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(income - costs);
                                                                    })()}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,b255,b255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => setShowRulesSection(!showRulesSection)}
                                            >
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <ShieldCheck size={12} color="var(--primary)" />
                                                    </div>
                                                    Reglas y Condiciones (Opcionales)
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {showRulesSection ? <ChevronUp size={20} color="var(--text-dim)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {showRulesSection && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', marginTop: '15px' }}>
                                                            {['Reglas de Invierno', 'Reglas Locales del Club', 'Reglas USGA'].map((rule) => (
                                                                <label key={rule} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '10px 15px', borderRadius: '12px' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={formData.rules.includes(rule)}
                                                                        onChange={(e) => {
                                                                            if (e.target.checked) setFormData({ ...formData, rules: [...formData.rules, rule] });
                                                                            else setFormData({ ...formData, rules: formData.rules.filter(r => r !== rule) });
                                                                        }}
                                                                        style={{ accentColor: 'var(--secondary)' }}
                                                                    />
                                                                    <span style={{ fontSize: '13px', color: 'white' }}>{rule}</span>
                                                                </label>
                                                            ))}
                                                            <div className="input-group" style={{ marginTop: '5px' }}>
                                                                <label style={{ fontSize: '12px', fontWeight: '800', marginBottom: '5px', display: 'block', color: 'var(--text-dim)' }}>Reglas Personalizadas</label>
                                                                <textarea
                                                                    value={formData.custom_rules || ''}
                                                                    onChange={(e) => setFormData({ ...formData, custom_rules: e.target.value })}
                                                                    className="form-input"
                                                                    rows={2}
                                                                    placeholder="Reglas adicionales..."
                                                                />
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,b255,b255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => setShowSponsorsSection(!showSponsorsSection)}
                                            >
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <HeartHandshake size={12} color="var(--primary)" />
                                                    </div>
                                                    Patrocinadores
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {showSponsorsSection ? <ChevronUp size={20} color="var(--text-dim)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {showSponsorsSection && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                                            {formData.sponsors.map((sponsor, idx) => (
                                                                <div key={sponsor.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={sponsor.name}
                                                                        onChange={(e) => {
                                                                            const newSponsors = [...formData.sponsors];
                                                                            newSponsors[idx].name = e.target.value;
                                                                            setFormData({ ...formData, sponsors: newSponsors });
                                                                        }}
                                                                        className="form-input-sm"
                                                                        placeholder="Nombre del patrocinador"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newSponsors = formData.sponsors.filter((_, i) => i !== idx);
                                                                            setFormData({ ...formData, sponsors: newSponsors });
                                                                        }}
                                                                        style={{ width: '38px', height: '38px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData({ ...formData, sponsors: [...formData.sponsors, { id: Date.now().toString(), name: '' }] });
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: 'white',
                                                                    fontSize: '11px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '800',
                                                                    width: 'fit-content'
                                                                }}
                                                            >
                                                                <Plus size={14} /> Añadir Patrocinador
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,b255,b255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => setShowPrizesSection(!showPrizesSection)}
                                            >
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Trophy size={12} color="var(--primary)" />
                                                    </div>
                                                    Premios Especiales
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {showPrizesSection ? <ChevronUp size={20} color="var(--text-dim)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {showPrizesSection && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                                            {formData.prizes.map((prize, idx) => (
                                                                <div key={prize.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={prize.name}
                                                                        onChange={(e) => {
                                                                            const newPrizes = [...formData.prizes];
                                                                            newPrizes[idx].name = e.target.value;
                                                                            setFormData({ ...formData, prizes: newPrizes });
                                                                        }}
                                                                        className="form-input-sm"
                                                                        placeholder="Ej: Hole in One, Mejor Acercamiento..."
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newPrizes = formData.prizes.filter((_, i) => i !== idx);
                                                                            setFormData({ ...formData, prizes: newPrizes });
                                                                        }}
                                                                        style={{ width: '38px', height: '38px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData({ ...formData, prizes: [...formData.prizes, { id: Date.now().toString(), name: '' }] });
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: 'white',
                                                                    fontSize: '11px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '800',
                                                                    width: 'fit-content'
                                                                }}
                                                            >
                                                                <Plus size={14} /> Añadir Premio
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        <div style={{ marginTop: '10px', padding: '15px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div
                                                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                                                onClick={() => setShowGuestsSection(!showGuestsSection)}
                                            >
                                                <h3 style={{ fontSize: '14px', fontWeight: '900', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                                                    <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <Users size={12} color="var(--primary)" />
                                                    </div>
                                                    Invitados Especiales
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    {showGuestsSection ? <ChevronUp size={20} color="var(--text-dim)" /> : <ChevronDown size={20} color="var(--text-dim)" />}
                                                </div>
                                            </div>

                                            <AnimatePresence>
                                                {showGuestsSection && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        style={{ overflow: 'hidden' }}
                                                    >
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px' }}>
                                                            {/* Search Input for existing profiles */}
                                                            <div style={{ position: 'relative' }}>
                                                                <div className="input-group" style={{ marginBottom: '10px' }}>
                                                                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                                                        <Users size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '14px' }} />
                                                                        <input
                                                                            type="text"
                                                                            value={guestSearchQuery}
                                                                            onChange={(e) => setGuestSearchQuery(e.target.value)}
                                                                            className="form-input with-icon"
                                                                            placeholder="Buscar usuarios inscritos..."
                                                                        />
                                                                        {searchingProfiles && (
                                                                            <Loader2 className="animate-spin" size={16} color="var(--secondary)" style={{ position: 'absolute', right: '12px' }} />
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                {/* Search Results Dropdown */}
                                                                <AnimatePresence>
                                                                    {profileResults.length > 0 && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, y: -10 }}
                                                                            animate={{ opacity: 1, y: 0 }}
                                                                            exit={{ opacity: 0, y: -10 }}
                                                                            style={{
                                                                                position: 'absolute',
                                                                                top: '100%',
                                                                                left: 0,
                                                                                right: 0,
                                                                                background: '#151c18',
                                                                                borderRadius: '16px',
                                                                                border: '1px solid rgba(255,255,255,0.1)',
                                                                                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                                                                                zIndex: 20,
                                                                                marginTop: '5px',
                                                                                overflow: 'hidden'
                                                                            }}
                                                                        >
                                                                            {profileResults.map((profile) => (
                                                                                <div
                                                                                    key={profile.id}
                                                                                    onClick={() => {
                                                                                        if (!formData.guests.some(g => g.name === profile.full_name)) {
                                                                                            setFormData({
                                                                                                ...formData,
                                                                                                guests: [...formData.guests, { id: profile.id, name: profile.full_name }]
                                                                                            });
                                                                                        }
                                                                                        setGuestSearchQuery('');
                                                                                        setProfileResults([]);
                                                                                    }}
                                                                                    style={{
                                                                                        padding: '12px 15px',
                                                                                        display: 'flex',
                                                                                        alignItems: 'center',
                                                                                        gap: '12px',
                                                                                        cursor: 'pointer',
                                                                                        borderBottom: '1px solid rgba(255,255,255,0.05)'
                                                                                    }}
                                                                                    className="item-hover"
                                                                                >
                                                                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', overflow: 'hidden' }}>
                                                                                        <img
                                                                                            src={profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=0E2F1F&color=A3E635`}
                                                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                                            alt={profile.full_name}
                                                                                        />
                                                                                    </div>
                                                                                    <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{profile.full_name}</span>
                                                                                </div>
                                                                            ))}
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>

                                                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />

                                                            {formData.guests.map((guest, idx) => (
                                                                <div key={guest.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <input
                                                                        type="text"
                                                                        value={guest.name}
                                                                        onChange={(e) => {
                                                                            const newGuests = [...formData.guests];
                                                                            newGuests[idx].name = e.target.value;
                                                                            setFormData({ ...formData, guests: newGuests });
                                                                        }}
                                                                        className="form-input-sm"
                                                                        placeholder="Nombre del invitado"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newGuests = formData.guests.filter((_, i) => i !== idx);
                                                                            setFormData({ ...formData, guests: newGuests });
                                                                        }}
                                                                        style={{ width: '38px', height: '38px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' }}
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFormData({ ...formData, guests: [...formData.guests, { id: Date.now().toString(), name: '' }] });
                                                                }}
                                                                style={{
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    color: 'white',
                                                                    fontSize: '11px',
                                                                    padding: '8px 12px',
                                                                    borderRadius: '12px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: '800',
                                                                    width: 'fit-content'
                                                                }}
                                                            >
                                                                <Plus size={14} /> Añadir Invitado
                                                            </button>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Action buttons for admin/manage */}
                                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                            <button
                                                type="button"
                                                onClick={() => navigate(`/my-events/${editingId}/participants`)}
                                                style={{ flex: 1, padding: '12px', borderRadius: '15px', background: 'rgba(163, 230, 53, 0.1)', color: 'var(--secondary)', border: '1px solid rgba(163, 230, 53, 0.2)', fontSize: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                            >
                                                <Users size={16} /> Ver Participantes
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const tourney = tournaments.find(t => t.id === editingId);
                                                    if (tourney) handleDeleteClick(tourney);
                                                }}
                                                style={{ padding: '12px', borderRadius: '15px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="btn-primary"
                                    style={{ marginTop: '10px', padding: '15px', fontSize: '14px', boxSizing: 'border-box' }}
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : (editingId ? 'GUARDAR TODOS LOS CAMBIOS' : 'GUARDAR EVENTO')}
                                </button>
                            </div>
                        </motion.form>
                    ) : (
                        <div key="tournament-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
                            {/* Regular Creator View */}
                            {showPremiumInvitation && (
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

                            {isPremium && (
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="btn-primary"
                                >
                                    <Plus size={18} />
                                    <span>Enviar Nueva Solicitud</span>
                                </button>
                            )}
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
                                    />
                                ))
                            )}
                        </div>
                    )}
                </AnimatePresence>
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
