import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Bookmark, Check } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
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

const CreateGroup: React.FC = () => {
    const location = useLocation();
    const groupToEdit = (location.state as any)?.groupToEdit;

    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { error: showError } = useToast();
    const [selectedFriends, setSelectedFriends] = useState<UserProfile[]>(groupToEdit?.members || []);

    const [groupName, setGroupName] = useState(groupToEdit?.name || '');
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    // If we are editing, we have an ID
    const isEditing = !!groupToEdit;

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

            let groupId = isEditing ? groupToEdit.id : null;

            if (isEditing) {
                // UPDATE EXISTING GROUP
                const { error: updateError } = await (supabase as any)
                    .from('saved_groups')
                    .update({
                        name: groupName,
                    })
                    .eq('id', groupId);

                if (updateError) throw updateError;

                // For members, a simple strategy: delete all and re-insert
                // This avoids complex diffing logic
                const { error: deleteError } = await (supabase as any)
                    .from('saved_group_members')
                    .delete()
                    .eq('group_id', groupId);

                if (deleteError) throw deleteError;

            } else {
                // CREATE NEW GROUP
                const { data: group, error: groupError } = await (supabase as any)
                    .from('saved_groups')
                    .insert({
                        name: groupName,
                        owner_id: session.user.id
                    })
                    .select()
                    .single();

                if (groupError) throw groupError;
                groupId = group.id;
            }

            // 2. Add members (for both create and update flows)
            if (selectedFriends.length > 0) {
                const membersToInsert = selectedFriends.map(friend => ({
                    group_id: groupId,
                    member_id: friend.id
                }));

                const { error: membersError } = await (supabase as any)
                    .from('saved_group_members')
                    .insert(membersToInsert);

                if (membersError) throw membersError;
            }

            // success(isEditing ? '¡Grupo actualizado con éxito!' : '¡Grupo guardado con éxito!');
            setShowSuccess(true);

            // Auto hide after 2 seconds
            setTimeout(() => {
                setShowSuccess(false);
            }, 2000);

            // After saving, continue to course selection or go back to list?
            // Usually saving is optional before playing, or maybe saving implies playing with it.
            // Let's assume we continue to play with this new group.
            // handleContinue();

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

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: '100%',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            background: 'var(--primary)',
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
                        background: '#0f3a22', // Darker green relative to primary usually
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
                            {isEditing ? '¡Grupo Actualizado!' : '¡Grupo Guardado!'}
                        </h2>

                        <p style={{
                            fontSize: '15px',
                            color: 'rgba(255,255,255,0.8)',
                            marginBottom: '0'
                        }}>
                            {isEditing ? 'Los cambios han sido guardados correctamente.' : 'Tu grupo está listo para jugar.'}
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
                    title={isEditing ? "Editar Grupo" : "Nuevo Grupo"}
                    subtitle={isEditing ? "Modifica tu grupo" : "Crea un grupo para jugar"}
                    showBack={true}
                    onBack={() => navigate('/friend-selection')}
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
                zIndex: 1,
                pointerEvents: 'auto'
            }}>
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
                            {saving ? 'Guardando...' : (isEditing ? 'Actualizar Grupo' : 'Guardar este Grupo')}
                        </button>
                        {!isEditing && (
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'center', marginTop: '8px', fontWeight: '500' }}>
                                Guarda esta combinación para seleccionarla rápido después
                            </p>
                        )}
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
    );
};

export default CreateGroup;
