import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Trash2, Users, Pencil, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../services/SupabaseManager';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

const FriendSelection: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { error: showError } = useToast();
    const [savedGroups, setSavedGroups] = useState<any[]>([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        fetchSavedGroups();

        // Subscribe to real-time changes
        let channel: any = null;

        const setupSubscription = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Subscribe to changes in both tables that affect the user
            channel = supabase
                .channel('saved_groups_changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'saved_groups' },
                    () => fetchSavedGroups()
                )
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'saved_group_members' },
                    () => fetchSavedGroups()
                )
                .subscribe();
        };

        setupSubscription();

        return () => {
            if (channel) supabase.removeChannel(channel);
        };
    }, []);

    const fetchSavedGroups = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await (supabase as any)
                .from('saved_groups')
                .select(`
                    id,
                    name,
                    owner_id,
                    members: saved_group_members(
                        member_id,
                        profile: profiles(id, full_name, email, id_photo_url)
                    )
                `);

            if (!error && data) {
                setSavedGroups(data);
            }
        } catch (err) {
            console.error('Error fetching saved groups:', err);
        }
    };

    const handleGroupClick = (group: any) => {
        // Prepare data for the next page
        const allMembersProfiles = group.members.map((m: any) => m.profile).filter(Boolean);
        // Exclude current user if they are in the list (though logic usually adds others)
        const friendsOnly = allMembersProfiles.filter((p: any) => p.id !== profile?.id);

        navigate('/select-course', {
            state: {
                selectedFriends: friendsOnly,
                groupName: group.name
            }
        });
    };

    const editGroup = (group: any, e: React.MouseEvent) => {
        e.stopPropagation();
        // Prepare data for the edit page
        const allMembersProfiles = group.members.map((m: any) => m.profile).filter(Boolean);
        const friendsOnly = allMembersProfiles.filter((p: any) => p.id !== profile?.id);

        navigate('/create-group', {
            state: {
                groupToEdit: {
                    id: group.id,
                    name: group.name,
                    members: friendsOnly
                }
            }
        });
    };

    const deleteGroup = async (groupId: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent selecting the group when deleting
        setGroupToDelete(groupId);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;

        try {
            const { error } = await supabase
                .from('saved_groups' as any)
                .delete()
                .eq('id', groupToDelete);

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            // Update local state
            setSavedGroups(savedGroups.filter(g => g.id !== groupToDelete));

            // Show centered success overlay
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);

        } catch (err: any) {
            console.error('Error deleting group:', err);
            showError(err?.message || 'No se pudo eliminar el grupo');
        } finally {
            setGroupToDelete(null);
            setDeleteConfirmOpen(false); // Close modal after operation
        }
    };

    return (
        <>
            <div style={{
                overflow: 'hidden',
                background: 'var(--primary)',
                zIndex: 500
            }} className="animate-fade">
                <PageHero image="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" />

                {/* Success Overlay */}
                {showSuccess && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(5px)',
                        zIndex: 2000,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'fadeIn 0.2s ease-out'
                    }}>
                        <div style={{
                            background: '#0f3a22',
                            border: '2px solid var(--secondary)',
                            borderRadius: '30px',
                            padding: '40px',
                            textAlign: 'center',
                            maxWidth: '85%',
                            width: '320px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            transform: 'scale(1)',
                            animation: 'scaleIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'var(--secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 20px auto',
                                boxShadow: '0 0 30px rgba(163, 230, 53, 0.4)'
                            }}>
                                <Check size={40} color="var(--primary)" strokeWidth={4} />
                            </div>

                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '900',
                                color: 'white',
                                marginBottom: '10px',
                                lineHeight: '1.2'
                            }}>
                                ¡Grupo Eliminado!
                            </h2>

                            <p style={{
                                fontSize: '15px',
                                color: 'rgba(255,255,255,0.8)',
                                marginBottom: '0'
                            }}>
                                El grupo ha sido eliminado correctamente.
                            </p>
                        </div>
                    </div>
                )}

                {/* Header Fijo */}
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
                        title="Juego en Grupo"
                        subtitle="Selecciona o crea un grupo"
                        showBack={true}
                        onBack={() => navigate('/play-mode')}
                    />
                </div>

                {/* Area de Scroll */}
                <div style={{
                    position: 'absolute',
                    top: 'calc(var(--header-offset-top) + 80px)',
                    left: '0',
                    right: '0',
                    bottom: 'calc(var(--nav-height))',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    padding: '0 20px 20px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '20px'
                }}>

                    {/* Botón Agregar Grupo - Apple Elite Style */}
                    <motion.button
                        whileTap={{ scale: 0.96 }}
                        onClick={() => navigate('/create-group')}
                        style={{
                            width: '100%',
                            background: 'linear-gradient(135deg, rgba(163, 230, 53, 0.12) 0%, rgba(163, 230, 53, 0.06) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(163, 230, 53, 0.25)',
                            borderRadius: '32px',
                            padding: '20px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '20px',
                            cursor: 'pointer',
                            color: 'var(--secondary)',
                            WebkitTapHighlightColor: 'transparent',
                            boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
                        }}
                    >
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '18px',
                            background: 'var(--secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 8px 20px rgba(163, 230, 53, 0.3)'
                        }}>
                            <Plus size={28} color="var(--primary)" strokeWidth={3} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                            <span style={{ display: 'block', fontSize: '19px', fontWeight: '900', letterSpacing: '-0.7px', color: '#fff' }}>Nuevo Grupo</span>
                            <span style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.45)', fontWeight: '600' }}>Inicia una nueva partida</span>
                        </div>
                    </motion.button>

                    {/* Lista de Grupos */}
                    {savedGroups.length > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginLeft: '5px' }}>
                                Tus Grupos
                            </h4>

                            {savedGroups.map(group => (
                                <motion.div
                                    key={group.id}
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => handleGroupClick(group)}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.04)',
                                        backdropFilter: 'blur(10px)',
                                        WebkitBackdropFilter: 'blur(10px)',
                                        borderRadius: '30px',
                                        padding: '22px',
                                        border: '1px solid rgba(255, 255, 255, 0.07)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
                                        <div style={{
                                            width: '54px',
                                            height: '54px',
                                            borderRadius: '18px',
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--secondary)',
                                            border: '1px solid rgba(255,255,255,0.08)'
                                        }}>
                                            <Users size={26} strokeWidth={2.5} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: '#fff', marginBottom: '2px', letterSpacing: '-0.5px' }}>
                                                {group.name}
                                            </h3>
                                            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                                                {group.members.length + 1} Jugadores
                                            </p>
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={(e) => editGroup(group, e)}
                                                style={{
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: 'none',
                                                    padding: '10px',
                                                    borderRadius: '12px',
                                                    color: 'rgba(255,255,255,0.6)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={(e) => deleteGroup(group.id, e)}
                                                style={{
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    border: 'none',
                                                    padding: '10px',
                                                    borderRadius: '12px',
                                                    color: '#ef4444',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                        <ChevronRight size={20} color="rgba(255,255,255,0.2)" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <ConfirmationModal
                isOpen={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
                onConfirm={confirmDelete}
                title="Eliminar Grupo"
                message="¿Estás seguro de que deseas eliminar este grupo? Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </>
    );
};

export default FriendSelection;
