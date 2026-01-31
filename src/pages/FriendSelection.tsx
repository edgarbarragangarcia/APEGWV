import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Star, Info } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import UserSearch from '../components/UserSearch';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../services/SupabaseManager';

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    id_photo_url?: string | null;
}

const FriendSelection: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const [selectedFriends, setSelectedFriends] = useState<UserProfile[]>([]);
    const [groupName, setGroupName] = useState('');
    const [savedGroups, setSavedGroups] = useState<any[]>([]);

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
                    members: saved_group_members(
                        member_id,
                        profile: profiles(id, full_name, email, id_photo_url)
                    )
                `)
                .eq('owner_id', session.user.id);

            if (!error && data) {
                setSavedGroups(data);
            }
        } catch (err) {
            console.error('Error fetching saved groups:', err);
        }
    };

    const handleContinue = () => {
        // Navigate to course selection with the selected friends and group name
        navigate('/select-course', {
            state: {
                selectedFriends,
                groupName: groupName || 'Mi Grupo'
            }
        });
    };

    const selectSavedGroup = (group: any) => {
        const members = group.members.map((m: any) => m.profile).filter(Boolean);
        setSelectedFriends(members);
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
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1.5px solid rgba(255, 255, 255, 0.18)',
                    marginBottom: '20px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
                }}>
                    {/* Group Name Input */}
                    <div style={{ marginBottom: '25px' }}>
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

                {/* Saved Groups Quick Selection */}
                {savedGroups.length > 0 && (
                    <div style={{ marginBottom: '25px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                            <Star size={16} color="var(--secondary)" fill="var(--secondary)" />
                            <h4 style={{ fontSize: '14px', fontWeight: '800', color: 'white', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Tus Grupos Guardados</h4>
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '12px', paddingBottom: '10px', scrollbarWidth: 'none' }}>
                            {savedGroups.map(group => (
                                <button
                                    key={group.id}
                                    onClick={() => selectSavedGroup(group)}
                                    style={{
                                        flexShrink: 0,
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1.5px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '18px',
                                        padding: '12px 18px',
                                        color: 'white',
                                        cursor: 'pointer',
                                        textAlign: 'left',
                                        minWidth: '140px'
                                    }}
                                >
                                    <p style={{ fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>{group.name}</p>
                                    <p style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{group.members.length + 1} jugadores</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div style={{
                    background: 'rgba(163, 230, 53, 0.05)',
                    borderRadius: '18px',
                    padding: '15px',
                    border: '1px solid rgba(163, 230, 53, 0.1)',
                    marginBottom: '30px',
                    display: 'flex',
                    gap: '12px'
                }}>
                    <Info size={20} color="var(--secondary)" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '12px', color: 'var(--text-dim)', margin: 0, lineHeight: '1.5' }}>
                        El nombre del grupo aparecerá en el leaderboard y en tu historial de rondas.
                    </p>
                </div>

                <div style={{ paddingBottom: '40px' }}>
                    <button
                        onClick={handleContinue}
                        style={{
                            width: '100%',
                            padding: '20px',
                            borderRadius: '20px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            fontWeight: '900',
                            fontSize: '16px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            cursor: 'pointer',
                            boxShadow: '0 12px 35px rgba(163, 230, 53, 0.25)',
                            transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        Continuar a Campos
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FriendSelection;
