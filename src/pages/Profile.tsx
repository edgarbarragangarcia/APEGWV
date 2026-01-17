import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, ShoppingBag, CreditCard, ChevronRight, Loader2, Edit2, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PlayerStats = Database['public']['Tables']['player_stats']['Row'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Fetch Profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (profileError) throw profileError;
                setProfile(profileData);

                // Fetch Stats
                const { data: statsData } = await supabase
                    .from('player_stats')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle();

                setStats(statsData);
            } catch (err) {
                console.error('Error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        } finally {
            // Force session clean up or redirect
            window.location.href = '/auth';
        }
    };

    if (loading) {
        return <div className="flex-center" style={{ height: '70vh' }}><Loader2 className="animate-spin" /></div>;
    }

    const menuItems = [
        { icon: Shield, label: 'Datos de la Federación', extra: profile?.federation_code || 'No vinculado', onClick: () => navigate('/profile/edit') },
        { icon: ShoppingBag, label: 'Mi tienda', extra: 'Panel Vendedor', onClick: () => navigate('/my-store') },
        { icon: CreditCard, label: 'Métodos de Pago', extra: 'Configurar' },
        { icon: Mail, label: 'Correo Electrónico', extra: profile?.email || 'No configurado' },
        { icon: Phone, label: 'Teléfono Celular', extra: profile?.phone || 'No configurado' },
        { icon: Settings, label: 'Configuración', extra: '', onClick: () => navigate('/settings') },
    ];

    return (
        <div className="animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '30px', position: 'relative' }}>
                <div
                    onClick={() => navigate('/profile/edit')}
                    style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        padding: '10px',
                        cursor: 'pointer',
                        color: 'var(--text-dim)'
                    }}>
                    <Edit2 size={20} />
                </div>

                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '3px solid var(--secondary)',
                        padding: '4px',
                        marginBottom: '15px'
                    }}>
                        <img
                            src={profile?.id_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0E2F1F&color=A3E635&size=120`}
                            alt="Profile"
                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                        />
                    </div>
                    {profile?.is_premium && (
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            right: 0,
                            background: 'var(--accent)',
                            color: 'var(--primary)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '10px',
                            fontWeight: '800',
                            textTransform: 'uppercase'
                        }}>
                            PREMIUM
                        </div>
                    )}
                </div>
                <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>{profile?.full_name || 'Golfista'}</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                    Hándicap {profile?.handicap !== null && profile?.handicap !== undefined ? profile.handicap : '--'} • {profile?.federation_code ? 'Federado' : 'No Federado'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '30px' }} onClick={() => navigate('/profile/stats')}>
                <div className="glass" style={{ padding: '15px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.average_score || '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Avg Score</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.putts_avg || '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Putts Avg</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center', cursor: 'pointer' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.fairways_hit_rate ? `${stats.fairways_hit_rate}%` : '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fairways</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        className="glass"
                        onClick={item.onClick}
                        style={{
                            padding: '18px 20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            cursor: item.onClick ? 'pointer' : 'default'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <item.icon size={20} color="var(--secondary)" />
                            <span style={{ fontWeight: '500' }}>{item.label}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>{item.extra}</span>
                            <ChevronRight size={18} color="var(--text-dim)" />
                        </div>
                    </button>
                ))}

                <button
                    onClick={handleLogout}
                    className="glass"
                    style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#ff4444',
                        marginTop: '20px',
                        width: '100%',
                        border: '1px solid rgba(255, 68, 68, 0.2)',
                        background: 'rgba(255, 68, 68, 0.05)',
                        fontWeight: '700'
                    }}
                >
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
