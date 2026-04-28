import React, { useState, useEffect } from 'react';
import { Search, UserPlus, X, Loader2 } from 'lucide-react';
import { supabase } from '../services/SupabaseManager';

interface UserProfile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url?: string | null;
    handicap?: number | null;
    average_score?: number | null;
}

interface UserSearchProps {
    onUsersSelected: (users: UserProfile[]) => void;
    initialSelected?: UserProfile[];
}

const UserSearch: React.FC<UserSearchProps> = ({ onUsersSelected, initialSelected = [] }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<UserProfile[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<UserProfile[]>(initialSelected);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        setSelectedUsers(initialSelected);
    }, [initialSelected]);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.trim().length < 3) {
                setResults([]);
                return;
            }

            console.log('Searching for:', query);
            setSearching(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email, avatar_url, handicap, average_score')
                .or(`full_name.ilike.%${query}%,email.ilike.%${query}%,federation_code.ilike.%${query}%`)
                .limit(10);

            if (error) {
                console.error('Search error:', error);
            }

            if (data) {
                console.log('Search results:', data);
                // Filter out already selected users
                const filtered = data.filter(u => !selectedUsers.find(selected => selected.id === u.id));
                setResults(filtered);
            }
            setSearching(false);
        };

        const timeoutId = setTimeout(searchUsers, 500);
        return () => clearTimeout(timeoutId);
    }, [query, selectedUsers]);

    const toggleUser = (user: UserProfile) => {
        let newSelected;
        if (selectedUsers.find(u => u.id === user.id)) {
            newSelected = selectedUsers.filter(u => u.id !== user.id);
        } else {
            if (selectedUsers.length >= 3) {
                alert('Máximo 4 jugadores por grupo (tú + 3 amigos)');
                return;
            }
            newSelected = [...selectedUsers, user];
        }
        setSelectedUsers(newSelected);
        onUsersSelected(newSelected);
        setQuery('');
        setResults([]);
    };

    return (
        <div style={{ marginBottom: '20px', position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: 'var(--secondary)', marginBottom: '10px', textTransform: 'uppercase' }}>
                Invitar Amigos (Opcional)
            </label>

            {/* Selected Users Chips */}
            {selectedUsers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {selectedUsers.map(user => (
                        <div key={user.id} style={{
                            background: 'rgba(163, 230, 53, 0.1)',
                            border: '1px solid rgba(163, 230, 53, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            animation: 'scaleIn 0.2s ease'
                        }}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="" style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>
                                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                </div>
                            )}
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{user.full_name || user.email}</span>
                            <button onClick={() => toggleUser(user)} style={{ background: 'none', border: 'none', color: 'var(--secondary)', cursor: 'pointer', padding: 0, display: 'flex' }}>
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="glass" style={{
                padding: '12px 15px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'rgba(0,0,0,0.2)'
            }}>
                <Search size={18} color="var(--text-dim)" />
                <input
                    type="text"
                    placeholder="Buscar por nombre o correo..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ background: 'none', border: 'none', color: 'white', width: '100%', outline: 'none', fontSize: '14px' }}
                />
                {searching && <Loader2 size={16} className="animate-spin" color="var(--secondary)" />}
            </div>

            {results.length > 0 && (
                <div style={{
                    marginTop: '8px',
                    background: 'rgba(15, 47, 31, 0.98)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    overflow: 'hidden',
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    {results.map(user => (
                        <button
                            key={user.id}
                            onClick={() => toggleUser(user)}
                            style={{
                                width: '100%',
                                padding: '12px 15px',
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" style={{ width: '32px', height: '32px', borderRadius: '10px', objectFit: 'cover' }} />
                                ) : (
                                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px' }}>
                                        {user.full_name?.charAt(0) || user.email?.charAt(0)}
                                    </div>
                                )}
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontWeight: '600', fontSize: '14px' }}>{user.full_name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{user.email}</span>
                                        {user.handicap !== undefined && (
                                            <span style={{ 
                                                fontSize: '10px', 
                                                background: 'rgba(163, 230, 53, 0.15)', 
                                                color: 'var(--secondary)', 
                                                padding: '1px 6px', 
                                                borderRadius: '6px', 
                                                fontWeight: '800' 
                                            }}>
                                                Hcp {user.handicap}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <UserPlus size={16} color="var(--secondary)" />
                        </button>
                    ))}
                </div>
            )}

            {query.trim().length >= 3 && !searching && results.length === 0 && (
                <div style={{
                    marginTop: '8px',
                    padding: '15px',
                    textAlign: 'center',
                    background: 'rgba(255,255,255,0.02)',
                    borderRadius: '12px',
                    border: '1px dashed rgba(255,255,255,0.1)',
                    color: 'var(--text-dim)',
                    fontSize: '13px'
                }}>
                    No se encontraron jugadores que coincidan con "{query}"
                </div>
            )}
        </div>
    );
};

export default UserSearch;
