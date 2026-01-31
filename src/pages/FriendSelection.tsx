import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Trash2, Bookmark } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import UserSearch from '../components/UserSearch';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../services/SupabaseManager';
import { useToast } from '../context/ToastContext';
import ConfirmationModal from '../components/ConfirmationModal';

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    id_photo_url?: string | null;
}

const FriendSelection: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { success, error: showError } = useToast();
    const [selectedFriends, setSelectedFriends] = useState<UserProfile[]>([]);
    const [groupName, setGroupName] = useState('');
    const [savedGroups, setSavedGroups] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

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

    const handleSaveGroup = async () => {
        if (!groupName.trim()) {
            showError('Por favor ponle un nombre al grupo para guardarlo');
            return;
        }
        if (selectedFriends.length === 0) {
            showError('Selecciona al menos un amigo para guardar el grupo');
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error('No session');

            // 1. Create group
            const { data: group, error: groupError } = await (supabase as any)
                .from('saved_groups')
                .insert({
                    name: groupName,
                    owner_id: session.user.id
                })
                .select()
                .single();

            if (groupError) throw groupError;

            // 2. Add members
            const membersToInsert = selectedFriends.map(friend => ({
                group_id: group.id,
                member_id: friend.id
            }));

            const { error: membersError } = await (supabase as any)
                .from('saved_group_members')
                .insert(membersToInsert);

            if (membersError) throw membersError;

            // 3. Add to local state immediately for instant visual feedback
            const newGroupWithMembers = {
                id: group.id,
                name: group.name,
                owner_id: group.owner_id,
                members: selectedFriends.map(friend => ({
                    member_id: friend.id,
                    profile: friend
                }))
            };

            setSavedGroups([newGroupWithMembers, ...savedGroups]);
            success('¡Grupo guardado con éxito!');
        } catch (err) {
            console.error('Error saving group:', err);
            showError('Error al guardar el grupo');
        } finally {
            setSaving(false);
        }
    };

    const handleContinue = async () => {
        // Navigate to course selection with the selected friends and group name
        navigate('/select-course', {
            state: {
                selectedFriends,
                groupName: groupName || 'Mi Grupo'
            }
        });
    };

    const selectSavedGroup = (group: any) => {
        // Collect all available profiles from the members join
        const allMembersProfiles = group.members.map((m: any) => m.profile).filter(Boolean);

        // Combine them (the simplified query only returns members for now to avoid 400 error)
        const allPlayers = [...allMembersProfiles];

        // Filter out the current user because they are already shown separately in the UI
        const friendsOnly = allPlayers.filter((p: any) => p.id !== profile?.id);

        setSelectedFriends(friendsOnly);
        setGroupName(group.name);
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
            success('Grupo eliminado exitosamente');
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
                position: 'fixed',
                top: '0',
                left: '0',
                right: '0',
                bottom: '0',
                width: '100%',
                maxWidth: 'var(--app-max-width)',
                margin: '0 auto',
                overflow: 'hidden',
                background: 'var(--primary)',
                zIndex: 500
            }} className="animate-fade">

                {/* Header Fijo */}
                <div style={{
                    position: 'absolute',
                    top: 'var(--header-offset-top)',
                    left: '0',
                    right: '0',
                    width: '100%',
                    zIndex: 900,
                    background: 'var(--primary)',
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    pointerEvents: 'auto'
                }}>
                    <PageHeader
                        title="Configura tu Grupo"
                        subtitle="Ponle un nombre e invita amigos"
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
                    padding: '0 20px 20px 20px'
                }}>
                    {/* Saved Groups Quick Selection */}
                    {savedGroups.length > 0 && (
                        <div style={{
                            marginBottom: '25px',
                            marginLeft: '-20px',
                            marginRight: '-20px'
                        }}>
                            <div style={{ paddingLeft: '20px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                <Star size={16} color="var(--secondary)" fill="var(--secondary)" />
                                <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tus Grupos Guardados</h4>
                            </div>
                            <div style={{
                                display: 'flex',
                                overflowX: 'auto',
                                gap: '12px',
                                paddingLeft: '20px',
                                paddingRight: '20px',
                                paddingBottom: '8px',
                                scrollbarWidth: 'none',
                                WebkitOverflowScrolling: 'touch',
                                msOverflowStyle: 'none'
                            }}>
                                {savedGroups.map(group => (
                                    <div
                                        key={group.id}
                                        style={{
                                            position: 'relative',
                                            flexShrink: 0,
                                            background: 'rgba(255, 255, 255, 0.04)',
                                            border: '1.5px solid rgba(255, 255, 255, 0.12)',
                                            borderRadius: '20px',
                                            padding: '14px 20px',
                                            color: 'white',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            minWidth: '150px',
                                            transition: 'all 0.2s ease'
                                        }}
                                        onClick={() => selectSavedGroup(group)}
                                    >
                                        <button
                                            onClick={(e) => deleteGroup(group.id, e)}
                                            style={{
                                                position: 'absolute',
                                                top: '8px',
                                                right: '8px',
                                                background: 'rgba(220, 38, 38, 0.15)',
                                                border: '1px solid rgba(220, 38, 38, 0.3)',
                                                borderRadius: '8px',
                                                width: '28px',
                                                height: '28px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                opacity: 0.7,
                                                transition: 'all 0.2s ease'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.opacity = '1';
                                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.25)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.opacity = '0.7';
                                                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.15)';
                                            }}
                                        >
                                            <Trash2 size={14} color="#dc2626" />
                                        </button>
                                        <p style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', whiteSpace: 'nowrap', paddingRight: '30px' }}>{group.name}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{group.members.length + 1} jugadores</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: '28px',
                        padding: '24px',
                        border: '1.5px solid rgba(255, 255, 255, 0.18)',
                        marginBottom: '20px',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                    }}>
                        {/* --- SECCIÓN 1: JUGADORES --- */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            marginBottom: '24px',
                            borderBottom: '1.5px solid rgba(255,255,255,0.08)',
                            paddingBottom: '24px'
                        }}>
                            <div style={{ position: 'relative' }}>
                                {profile?.id_photo_url ? (
                                    <img
                                        src={profile.id_photo_url}
                                        alt="Tú"
                                        style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '20px',
                                            objectFit: 'cover',
                                            border: '2.5px solid var(--secondary)',
                                            boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)'
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '56px',
                                        height: '56px',
                                        borderRadius: '20px',
                                        background: 'var(--secondary)',
                                        color: 'var(--primary)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: '900',
                                        boxShadow: '0 4px 15px rgba(163, 230, 53, 0.3)'
                                    }}>
                                        {profile?.full_name?.charAt(0) || 'U'}
                                    </div>
                                )}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '-4px',
                                    right: '-4px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    fontSize: '10px',
                                    fontWeight: '900',
                                    padding: '2px 6px',
                                    borderRadius: '8px',
                                    border: '2px solid var(--primary)'
                                }}>TÚ</div>
                            </div>
                            <div>
                                <h4 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: '0 0 2px 0', letterSpacing: '-0.5px' }}>
                                    {groupName || 'Tu Grupo'}
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--secondary)' }}></div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0, fontWeight: '700' }}>
                                        {selectedFriends.length + 1} de 4 <span style={{ opacity: 0.6, fontWeight: '500' }}>Jugadores</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* --- SECCIÓN 2: IDENTIDAD DEL GRUPO --- */}
                        <div style={{
                            marginBottom: '24px'
                        }}>
                            <div style={{ marginBottom: '16px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                    Nombre del Grupo
                                </label>
                                <div style={{
                                    background: 'rgba(0,0,0,0.25)',
                                    border: '1.5px solid rgba(255,255,255,0.12)',
                                    borderRadius: '18px',
                                    padding: '14px 18px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <input
                                        type="text"
                                        placeholder="Ej: Los Amigos del Golf"
                                        value={groupName}
                                        onChange={(e) => setGroupName(e.target.value)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'white',
                                            width: '100%',
                                            outline: 'none',
                                            fontSize: '17px',
                                            fontWeight: '600'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>



                        <UserSearch initialSelected={selectedFriends} onUsersSelected={setSelectedFriends} />

                        {/* Standalone Save Group Button */}
                        <div style={{ marginTop: '16px' }}>
                            <button
                                onClick={handleSaveGroup}
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    background: 'rgba(163, 230, 53, 0.1)',
                                    border: '1.5px solid rgba(163, 230, 53, 0.3)',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    color: 'var(--secondary)',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    cursor: saving ? 'wait' : 'pointer',
                                    transition: 'all 0.2s ease',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(163, 230, 53, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(163, 230, 53, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <Bookmark size={16} fill="var(--secondary)" />
                                {saving ? 'Guardando...' : 'Guardar este Grupo'}
                            </button>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px', fontWeight: '500' }}>
                                Guarda esta combinación para seleccionarla rápido después
                            </p>
                        </div>
                    </div>

                    {/* Botón de Continuar - Dentro del área scrolleable */}
                    <div style={{ padding: '0 0 40px 0' }}>
                        <button
                            onClick={handleContinue}
                            disabled={saving}
                            style={{
                                width: '100%',
                                padding: '20px',
                                borderRadius: '20px',
                                background: saving ? 'var(--text-dim)' : 'var(--secondary)',
                                color: 'var(--primary)',
                                fontWeight: '900',
                                fontSize: '16px',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                cursor: saving ? 'not-allowed' : 'pointer',
                                boxShadow: saving ? 'none' : '0 12px 35px rgba(163, 230, 53, 0.25)',
                                transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                opacity: saving ? 0.7 : 1
                            }}
                            onMouseDown={(e) => !saving && (e.currentTarget.style.transform = 'scale(0.98)')}
                            onMouseUp={(e) => !saving && (e.currentTarget.style.transform = 'scale(1)')}
                        >
                            {saving ? (
                                <>
                                    <div className="animate-spin" style={{ width: '20px', height: '20px', border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
                                    Guardando Grupo...
                                </>
                            ) : (
                                <>
                                    Continuar a Campos
                                    <ChevronRight size={20} />
                                </>
                            )}
                        </button>
                    </div>
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
