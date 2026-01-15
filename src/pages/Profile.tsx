import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, ShoppingBag, CreditCard, ChevronRight, Loader2 } from 'lucide-react';

const Profile: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);

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
        { icon: Shield, label: 'Datos de la Federación', extra: profile?.federation_code || 'No vinculado' },
        { icon: ShoppingBag, label: 'Mis Ventas', extra: 'Sin activos' },
        { icon: CreditCard, label: 'Métodos de Pago', extra: 'Configurar' },
        { icon: Settings, label: 'Configuración', extra: '' },
    ];

    return (
        <div className="animate-fade">
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
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
                            style={{ width: '100%', height: '100%', borderRadius: '50%' }}
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
                <h1 style={{ fontSize: '24px', marginBottom: '5px' }}>{profile?.full_name || 'golfista'}</h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px' }}>
                    Hándicap {stats?.handicap_index || '--'} • {profile?.federation_code ? 'Federado' : 'No Federado'}
                </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '30px' }}>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.average_score || '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Avg Score</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.putts_avg || '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Putts Avg</div>
                </div>
                <div className="glass" style={{ padding: '15px', textAlign: 'center' }}>
                    <div style={{ fontSize: '18px', fontWeight: '700' }}>{stats?.fairways_hit_rate ? `${stats.fairways_hit_rate}%` : '--'}</div>
                    <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Fairways</div>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {menuItems.map((item, i) => (
                    <button key={i} className="glass" style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%'
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
                    style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        color: '#ef4444',
                        marginTop: '10px',
                        width: '100%'
                    }}
                >
                    <LogOut size={20} />
                    <span style={{ fontWeight: '600' }}>Cerrar Sesión</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
