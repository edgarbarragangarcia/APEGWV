import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import UserSearch from '../components/UserSearch';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../services/SupabaseManager';
import { useToast } from '../context/ToastContext';

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
    const [saveGroup, setSaveGroup] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchSavedGroups();
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
                    owner:profiles(id, full_name, email, id_photo_url),
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

    const handleContinue = async () => {
        if (saveGroup) {
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

                success('¡Grupo guardado con éxito!');
                fetchSavedGroups(); // Refresh list
            } catch (err) {
                console.error('Error saving group:', err);
                showError('Error al guardar el grupo');
            } finally {
                setSaving(false);
            }
        }

        // Navigate to course selection with the selected friends and group name
        navigate('/select-course', {
            state: {
                selectedFriends,
                groupName: groupName || 'Mi Grupo'
            }
        });
    };

    const selectSavedGroup = (group: any) => {
        // Collect all potential players (members + owner)
        const allMembersProfiles = group.members.map((m: any) => m.profile).filter(Boolean);
        const ownerProfile = group.owner;

        // Combine them
        const allPlayers = ownerProfile ? [...allMembersProfiles, ownerProfile] : allMembersProfiles;

        // Filter out the current user because they are already shown separately in the UI
        const friendsOnly = allPlayers.filter((p: any) => p.id !== profile?.id);

        setSelectedFriends(friendsOnly);
        setGroupName(group.name);
    };

    return (
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
                                <button
                                    key={group.id}
                                    onClick={() => selectSavedGroup(group)}
                                    style={{
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
                                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.96)'}
                                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                >
                                    <p style={{ fontSize: '15px', fontWeight: '800', marginBottom: '4px', whiteSpace: 'nowrap' }}>{group.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '500' }}>{group.members.length + 1} jugadores</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1.5px solid rgba(255, 255, 255, 0.18)',
                    marginBottom: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                    {/* Group Name Input */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                            Nombre del Grupo
                        </label>
                        <div style={{
                            background: 'rgba(0,0,0,0.2)',
                            border: '1.5px solid rgba(255,255,255,0.15)',
                            borderRadius: '16px',
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
                                    fontSize: '16px',
                                    fontWeight: '600'
                                }}
                            />
                        </div>
                    </div>

                    {/* Save Group Toggle */}
                    <div
                        onClick={() => setSaveGroup(!saveGroup)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '25px',
                            cursor: 'pointer',
                            userSelect: 'none'
                        }}
                    >
                        <div style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: `2px solid ${saveGroup ? 'var(--secondary)' : 'rgba(255,255,255,0.3)'}`,
                            background: saveGroup ? 'var(--secondary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s ease'
                        }}>
                            {saveGroup && <div style={{ width: '10px', height: '10px', background: 'var(--primary)', borderRadius: '2px' }} />}
                        </div>
                        <span style={{ fontSize: '13px', color: saveGroup ? 'white' : 'var(--text-dim)', fontWeight: '600' }}>
                            Guardar este grupo para el futuro
                        </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                        <div style={{ position: 'relative' }}>
                            {profile?.id_photo_url ? (
                                <img
                                    src={profile.id_photo_url}
                                    alt="Tú"
                                    style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover', border: '2.5px solid var(--secondary)' }}
                                />
                            ) : (
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '18px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    fontWeight: '900'
                                }}>
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                        </div>
                        <div>
                            <h4 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>{groupName || 'Tu Grupo'}</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                                {selectedFriends.length + 1} de 4 jugadores
                            </p>
                        </div>
                    </div>

                    <UserSearch initialSelected={selectedFriends} onUsersSelected={setSelectedFriends} />
                </div>





                <div style={{ paddingBottom: '40px' }}>
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
    );
};

export default FriendSelection;
