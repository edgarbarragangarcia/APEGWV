import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Users } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import UserSearch from '../components/UserSearch';
import { motion } from 'framer-motion';

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
}

const FriendSelection: React.FC = () => {
    const navigate = useNavigate();
    const [selectedFriends, setSelectedFriends] = useState<UserProfile[]>([]);

    const handleContinue = () => {
        // Navigate to course selection with the selected friends
        navigate('/select-course', { state: { selectedFriends } });
    };

    return (
        <div className="animate-fade" style={{
            padding: '20px',
            paddingTop: 'calc(env(safe-area-inset-top) + 20px)',
            minHeight: '100dvh',
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <button
                    onClick={() => navigate('/play-mode')}
                    style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: 'none',
                        color: 'white',
                        padding: '10px',
                        borderRadius: '12px',
                        cursor: 'pointer'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
            </div>

            <PageHeader
                title="Invita Amigos"
                subtitle="Selecciona hasta 3 amigos para tu grupo"
            />

            <div style={{ flex: 1, marginTop: '20px' }}>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '24px',
                    padding: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#3b82f6'
                        }}>
                            <Users size={20} />
                        </div>
                        <div>
                            <h4 style={{ fontSize: '16px', fontWeight: '800' }}>Tu Grupo</h4>
                            <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
                                {selectedFriends.length} amigos seleccionados
                            </p>
                        </div>
                    </div>

                    <UserSearch onUsersSelected={setSelectedFriends} />
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                    padding: '20px 0',
                    paddingBottom: 'calc(var(--safe-bottom) + 80px)' // Leave space for BottomNav
                }}
            >
                <button
                    onClick={handleContinue}
                    disabled={selectedFriends.length === 0}
                    style={{
                        width: '100%',
                        padding: '18px',
                        borderRadius: '18px',
                        background: selectedFriends.length > 0 ? 'var(--secondary)' : 'rgba(255,255,255,0.05)',
                        color: selectedFriends.length > 0 ? 'var(--primary)' : 'var(--text-dim)',
                        fontWeight: '900',
                        fontSize: '16px',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px',
                        cursor: selectedFriends.length > 0 ? 'pointer' : 'not-allowed',
                        boxShadow: selectedFriends.length > 0 ? '0 10px 30px rgba(163, 230, 53, 0.3)' : 'none',
                        transition: 'all 0.3s ease'
                    }}
                >
                    Continuar a Campos
                    <ChevronRight size={20} />
                </button>
            </motion.div>
        </div>
    );
};

export default FriendSelection;
