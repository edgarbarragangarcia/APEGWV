import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit3, Target, Ruler, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

interface UserClub {
    id: string;
    club_name: string;
    brand: string | null;
    average_distance: number | null;
    is_active: boolean;
}

const MyBag: React.FC = () => {
    const navigate = useNavigate();
    const { session } = useAuth();
    const [clubs, setClubs] = useState<UserClub[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClub, setEditingClub] = useState<Partial<UserClub> | null>(null);
    const [formData, setFormData] = useState({
        club_name: '',
        brand: '',
        average_distance: ''
    });

    useEffect(() => {
        if (session) {
            fetchClubs();
        }
    }, [session]);

    const fetchClubs = async () => {
        try {
            if (!session) return;
            const { data, error } = await supabase
                .from('user_clubs')
                .select('*')
                .eq('user_id', session.user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setClubs((data as any) || []);
        } catch (err) {
            console.error('Error fetching clubs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveClub = async () => {
        if (!session || !formData.club_name) return;

        try {
            const clubData = {
                user_id: session.user.id,
                club_name: formData.club_name,
                brand: formData.brand || null,
                average_distance: formData.average_distance ? parseFloat(formData.average_distance) : null,
            };

            if (editingClub?.id) {
                const { error } = await supabase
                    .from('user_clubs')
                    .update(clubData)
                    .eq('id', editingClub.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('user_clubs')
                    .insert([clubData]);
                if (error) throw error;
            }

            setIsModalOpen(false);
            setEditingClub(null);
            setFormData({ club_name: '', brand: '', average_distance: '' });
            fetchClubs();
        } catch (err) {
            console.error('Error saving club:', err);
        }
    };

    const handleDeleteClub = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este palo de tu talega?')) return;
        try {
            const { error } = await supabase
                .from('user_clubs')
                .delete()
                .eq('id', id);
            if (error) throw error;
            fetchClubs();
        } catch (err) {
            console.error('Error deleting club:', err);
        }
    };

    const openEditModal = (club: UserClub) => {
        setEditingClub(club);
        setFormData({
            club_name: club.club_name,
            brand: club.brand || '',
            average_distance: club.average_distance?.toString() || ''
        });
        setIsModalOpen(true);
    };

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            overflow: 'hidden'
        }}>
            <PageHero />

            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                zIndex: 900,
                background: 'transparent',
                paddingBottom: '5px'
            }}>
                <div style={{ padding: '0 20px' }}>
                    <PageHeader
                        noMargin
                        onBack={() => navigate('/profile')}
                        title="Mi Talega"
                        subtitle="Gestiona tus palos y distancias"
                    />
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 80px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 10px)',
                overflowY: 'auto',
                padding: '20px 20px 100px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                zIndex: 10
            }}>
                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                        setEditingClub(null);
                        setFormData({ club_name: '', brand: '', average_distance: '' });
                        setIsModalOpen(true);
                    }}
                    style={{
                        padding: '16px',
                        borderRadius: '20px',
                        background: 'var(--secondary)',
                        color: 'var(--primary)',
                        border: 'none',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        boxShadow: '0 10px 25px rgba(163, 230, 53, 0.2)'
                    }}
                >
                    <Plus size={20} /> AGREGAR PALO
                </motion.button>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Cargando tu talega...</div>
                ) : clubs.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: '24px',
                        border: '1px dashed rgba(255,255,255,0.1)'
                    }}>
                        <Target size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: '15px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Tu talega está vacía. Agrega tus palos para tener recomendaciones precisas en el campo.</p>
                    </div>
                ) : (
                    clubs.map((club) => (
                        <motion.div
                            key={club.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '20px',
                                padding: '16px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '45px',
                                    height: '45px',
                                    borderRadius: '12px',
                                    background: 'var(--primary-light)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'var(--secondary)'
                                }}>
                                    <Target size={24} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'white' }}>{club.club_name}</h3>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '2px' }}>
                                        {club.brand && <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{club.brand}</span>}
                                        {club.average_distance && (
                                            <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: '700' }}>
                                                Avg: {club.average_distance}m
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => openEditModal(club)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '8px', borderRadius: '10px', color: 'white' }}>
                                    <Edit3 size={18} />
                                </button>
                                <button onClick={() => handleDeleteClub(club.id)} style={{ background: 'rgba(248, 113, 113, 0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#f87171' }}>
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>

            {/* Modal de Agregar/Editar */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'flex-end', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)' }}>
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            style={{
                                width: '100%',
                                background: 'rgba(10, 20, 15, 0.98)',
                                borderTopLeftRadius: '30px',
                                borderTopRightRadius: '30px',
                                padding: '25px',
                                borderTop: '2px solid var(--secondary)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h2 style={{ color: 'white', margin: 0 }}>{editingClub ? 'Editar Palo' : 'Nuevo Palo'}</h2>
                                <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)' }}><X /></button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Nombre del Palo</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Hierro 7, Driver..."
                                        value={formData.club_name}
                                        onChange={(e) => setFormData({ ...formData, club_name: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '14px', color: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Marca (Opcional)</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Titleist, TaylorMade..."
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '14px', color: 'white' }}
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', color: 'var(--secondary)', fontWeight: '800', textTransform: 'uppercase', marginBottom: '8px' }}>Distancia Promedio (Metros)</label>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="number"
                                            placeholder="Ej: 150"
                                            value={formData.average_distance}
                                            onChange={(e) => setFormData({ ...formData, average_distance: e.target.value })}
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '14px', color: 'white' }}
                                        />
                                        <Ruler size={18} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                                    </div>
                                </div>

                                <motion.button
                                    whileTap={{ scale: 0.95 }}
                                    onClick={handleSaveClub}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '16px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        border: 'none',
                                        fontWeight: '800',
                                        marginTop: '10px'
                                    }}
                                >
                                    GUARDAR EN TALEGA
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MyBag;
