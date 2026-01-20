import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, CreditCard, ChevronRight, Edit2, Mail, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Database } from '../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type PlayerStats = Database['public']['Tables']['player_stats']['Row'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [stats, setStats] = useState<PlayerStats | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // Fetch Profile (which now contains stats)
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .maybeSingle();

                if (profileError) throw profileError;
                setProfile(profileData);

                // Set stats from the same profile data to keep the UI logic working
                if (profileData) {
                    setStats(profileData as any);
                }
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        };

        fetchUserData();
    }, []);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);

        try {
            // 1. Clear local storage immediately
            localStorage.clear();
            sessionStorage.clear();

            // 2. Clear any Supabase specific keys manually
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.includes('supabase.auth.token')) {
                    localStorage.removeItem(key);
                }
            }

            // 3. Attempt Supabase signOut with a strict timeout for mobile/slow networks
            await Promise.race([
                supabase.auth.signOut(),
                new Promise(resolve => setTimeout(resolve, 1500))
            ]);

            // 4. Forceful redirect using replace to clear history stack
            window.location.replace('/auth');
        } catch (error) {
            console.error('Logout error, forcing redirect:', error);
            window.location.replace('/auth');
        }
    };





    return (
        <div className="animate-fade" style={{
            paddingBottom: 'calc(var(--nav-height) + 20px)',
            width: '100%',
            overflowX: 'hidden',
            position: 'relative'
        }}>
            {/* Header Section */}
            <div style={{ textAlign: 'center', marginBottom: '35px', position: 'relative' }}>
                <div
                    onClick={() => navigate('/profile/edit')}
                    style={{
                        position: 'absolute',
                        top: '25px',
                        right: '0',
                        padding: '12px',
                        cursor: 'pointer',
                        color: 'var(--secondary)',
                        background: 'rgba(163, 230, 53, 0.1)',
                        borderRadius: '12px'
                    }}>
                    <Edit2 size={18} />
                </div>

                <div style={{ position: 'relative', display: 'inline-block' }}>
                    <div style={{
                        width: '110px',
                        height: '110px',
                        borderRadius: '35px',
                        border: '3px solid var(--secondary)',
                        padding: '4px',
                        marginBottom: '15px',
                        background: 'linear-gradient(135deg, var(--secondary), #7cc42b)',
                        transform: 'rotate(-2deg)'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '28px',
                            overflow: 'hidden',
                            transform: 'rotate(2deg)',
                            background: 'var(--primary)'
                        }}>
                            <img
                                src={profile?.id_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0E2F1F&color=A3E635&size=120`}
                                alt="Profile"
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                    </div>
                    {profile?.is_premium && (
                        <div style={{
                            position: 'absolute',
                            bottom: '10px',
                            right: '-5px',
                            background: 'var(--accent)',
                            color: 'var(--primary)',
                            padding: '4px 10px',
                            borderRadius: '10px',
                            fontSize: '9px',
                            fontWeight: '900',
                            letterSpacing: '0.5px',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                            transform: 'rotate(5deg)'
                        }}>
                            PREMIUM
                        </div>
                    )}
                </div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '4px', letterSpacing: '-0.5px' }}>
                    {profile?.full_name || 'Golfista'}
                </h1>
                <p style={{ color: 'var(--text-dim)', fontSize: '14px', fontWeight: '500' }}>
                    Socio APEG • Hándicap {profile?.handicap ?? '--'}
                </p>
            </div>

            {/* Stats Summary Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '30px' }}>
                <div onClick={() => navigate('/profile/stats')} className="glass" style={{ padding: '15px 10px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>{stats?.average_score || '--'}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>Avg Score</div>
                </div>
                <div onClick={() => navigate('/profile/stats')} className="glass" style={{ padding: '15px 10px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>{stats?.putts_avg || '--'}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>Putts Avg</div>
                </div>
                <div onClick={() => navigate('/profile/stats')} className="glass" style={{ padding: '15px 10px', textAlign: 'center', cursor: 'pointer', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--secondary)' }}>{stats?.fairways_hit_rate ? `${stats.fairways_hit_rate}%` : '--'}</div>
                    <div style={{ fontSize: '9px', color: 'var(--text-dim)', fontWeight: '700', textTransform: 'uppercase', marginTop: '4px' }}>Fairways</div>
                </div>
            </div>

            {/* Fixed Personal Data Card */}
            <div className="glass" style={{ padding: '20px', marginBottom: '25px', background: 'rgba(255,255,255,0.02)' }}>
                <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-dim)', marginBottom: '18px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Información de la Cuenta
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <Shield size={18} color="var(--secondary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>FEDERACIÓN</p>
                            <p style={{ fontSize: '14px', fontWeight: '500' }}>{profile?.federation_code || 'No vinculado'}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <Mail size={18} color="var(--secondary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>CORREO ELECTRÓNICO</p>
                            <p style={{ fontSize: '14px', fontWeight: '500' }}>{profile?.email || 'No configurado'}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ background: 'rgba(163, 230, 53, 0.1)', padding: '8px', borderRadius: '10px' }}>
                            <Phone size={18} color="var(--secondary)" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: '600' }}>TELÉFONO</p>
                            <p style={{ fontSize: '14px', fontWeight: '500' }}>{profile?.phone || 'No configurado'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Interactive Settings and Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                    onClick={() => navigate('/settings')}
                    className="glass"
                    style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,b255,b255,0.1)'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <Settings size={20} color="var(--secondary)" />
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Configuración del Sistema</span>
                    </div>
                    <ChevronRight size={18} color="var(--text-dim)" />
                </button>

                <button
                    onClick={() => navigate('/payment-methods')}
                    className="glass"
                    style={{
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,b255,b255,0.1)'
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <CreditCard size={20} color="var(--secondary)" />
                        <span style={{ fontWeight: '600', fontSize: '14px' }}>Métodos de Pago</span>
                    </div>
                    <ChevronRight size={18} color="var(--text-dim)" />
                </button>

                <button
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="glass"
                    style={{
                        padding: '18px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '12px',
                        color: '#ff6b6b',
                        marginTop: '15px',
                        width: '100%',
                        border: '1px solid rgba(255, 107, 107, 0.2)',
                        background: 'rgba(255, 107, 107, 0.05)',
                        fontWeight: '800',
                        fontSize: '14px',
                        cursor: loggingOut ? 'not-allowed' : 'pointer',
                        opacity: loggingOut ? 0.7 : 1,
                        touchAction: 'manipulation'
                    }}
                >
                    <LogOut size={20} />
                    <span>{loggingOut ? 'Cerrando...' : 'Cerrar Sesión'}</span>
                </button>
            </div>
        </div>
    );
};

export default Profile;
