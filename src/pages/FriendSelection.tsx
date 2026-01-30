import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import UserSearch from '../components/UserSearch';
import { useProfile } from '../hooks/useProfile';

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

    const handleContinue = () => {
        // Navigate to course selection with the selected friends
        navigate('/select-course', { state: { selectedFriends } });
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
                    title="Invita Amigos"
                    subtitle="Selecciona hasta 3 amigos para tu grupo"
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
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                        <div style={{ position: 'relative' }}>
                            {profile?.id_photo_url ? (
                                <img
                                    src={profile.id_photo_url}
                                    alt="Tú"
                                    style={{ width: '50px', height: '50px', borderRadius: '15px', objectFit: 'cover', border: '2px solid var(--secondary)' }}
                                />
                            ) : (
                                <div style={{
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '15px',
                                    background: 'var(--secondary)',
                                    color: 'var(--primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                    fontWeight: '900'
                                }}>
                                    {profile?.full_name?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div style={{
                                position: 'absolute',
                                bottom: '-5px',
                                right: '-5px',
                                background: 'var(--primary)',
                                borderRadius: '50%',
                                padding: '2px'
                            }}>
                                <div style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '4px' }}>
                                    <Users size={12} />
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ fontSize: '18px', fontWeight: '900', color: 'white', margin: 0 }}>Tu Grupo</h4>
                            <p style={{ fontSize: '13px', color: 'var(--text-dim)', margin: 0 }}>
                                {selectedFriends.length + 1} de 4 jugadores
                            </p>
                        </div>
                    </div>

                    <UserSearch onUsersSelected={setSelectedFriends} />
                </div>

                <div style={{ paddingBottom: '40px' }}>
                    <button
                        onClick={handleContinue}
                        style={{
                            width: '100%',
                            padding: '18px',
                            borderRadius: '18px',
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
                            boxShadow: '0 10px 30px rgba(163, 230, 53, 0.3)',
                            transition: 'all 0.3s ease'
                        }}
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
