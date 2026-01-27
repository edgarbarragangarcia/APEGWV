import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, CreditCard, ChevronRight, Edit2, Mail, Phone, MapPin, Store, Trophy, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Database } from '../types/database.types';
import PageHeader from '../components/PageHeader';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

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
            position: 'fixed',
            inset: 0,
            background: 'var(--primary)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 900,
            paddingTop: 'var(--header-offset-top)', // Push content below the global header
            paddingBottom: 'var(--nav-height)' // Respect bottom nav
        }}>
            {/* Standardized Page Header */}
            <div style={{ flexShrink: 0, zIndex: 10, background: 'var(--primary)', padding: '0 20px' }}>
                <PageHeader noMargin title="Mi Perfil" onBack={() => navigate('/')} />
            </div>

            <div style={{
                flex: 1,
                overflowY: 'auto',
                padding: '0 20px 20px 20px',
                display: 'flex',
                flexDirection: 'column',
                WebkitOverflowScrolling: 'touch',
                gap: '15px'
            }}>
                {/* Header Section - Premium & Ultra-Compact */}
                <div style={{ textAlign: 'center', marginBottom: '10px', position: 'relative' }}>
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                        <div style={{
                            width: '74px',
                            height: '74px',
                            borderRadius: '24px',
                            border: '2px solid var(--secondary)',
                            padding: '3px',
                            marginBottom: '8px',
                            background: 'linear-gradient(135deg, var(--secondary), #7cc42b)',
                            transform: 'rotate(-2deg)'
                        }}>
                            <div style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '20px',
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
                    </div>

                    <div style={{ position: 'relative' }}>
                        <h1 style={{ fontSize: '22px', fontWeight: '900', marginBottom: '2px', letterSpacing: '-0.5px', color: 'white' }}>
                            {(() => {
                                const name = profile?.full_name || 'Golfista';
                                const words = name.split(' ');
                                if (words.length <= 1) return <span style={{ color: 'white' }}>{name}</span>;
                                return (
                                    <>
                                        <span style={{ color: 'white' }}>{words[0]} </span>
                                        <span style={{ color: 'var(--secondary)' }}>{words[1]}</span>
                                    </>
                                );
                            })()}
                        </h1>
                        <p style={{ color: 'var(--text-dim)', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            ID: {profile?.federation_code || 'APEG-User'} • Hcp {profile?.handicap ?? '--'}
                        </p>

                        <button
                            onClick={() => navigate('/profile/edit')}
                            style={{
                                position: 'absolute',
                                top: '-30px',
                                right: '-10px',
                                padding: '8px',
                                color: 'var(--secondary)',
                                background: 'rgba(163, 230, 53, 0.1)',
                                borderRadius: '10px',
                                border: '1px solid rgba(163, 230, 53, 0.2)'
                            }}>
                            <Edit2 size={14} />
                        </button>
                    </div>
                </div>

                {/* Collapsible Account Info */}
                <div>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="glass"
                        style={{
                            width: '100%',
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'rgba(255,255,255,0.03)',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'var(--secondary)', padding: '6px', borderRadius: '8px', color: 'var(--primary)' }}>
                                <Shield size={14} strokeWidth={3} />
                            </div>
                            <span style={{ fontSize: '13px', fontWeight: '800', color: 'white' }}>Información de la Cuenta</span>
                        </div>
                        <ChevronRight
                            size={16}
                            color="var(--secondary)"
                            style={{ transform: showInfo ? 'rotate(90deg)' : 'none', transition: 'transform 0.3s ease' }}
                        />
                    </button>

                    {showInfo && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div style={{
                                marginTop: '8px',
                                padding: '12px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '12px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px',
                                border: '1px solid rgba(255,255,255,0.03)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Mail size={12} color="var(--text-dim)" />
                                    <span style={{ fontSize: '11px', color: 'white' }}>{profile?.email}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Phone size={12} color="var(--text-dim)" />
                                    <span style={{ fontSize: '11px', color: 'white' }}>{profile?.phone || 'No configurado'}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <MapPin size={12} color="var(--text-dim)" />
                                    <span style={{ fontSize: '11px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {profile?.address || 'No configurada'}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Interactive Settings and Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                    <button
                        id="btn-settings"
                        onClick={() => navigate('/settings')}
                        className="glass"
                        style={{
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Settings size={18} color="var(--secondary)" />
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Configuración del Sistema</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                    </button>

                    <button
                        onClick={() => navigate('/my-store')}
                        className="glass"
                        style={{
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Store size={18} color="var(--secondary)" />
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Mi Marketplace APEG</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                    </button>

                    <button
                        onClick={() => navigate('/my-events')}
                        className="glass"
                        style={{
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Trophy size={18} color="var(--secondary)" />
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Mis Eventos Organizados</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                    </button>

                    <button
                        onClick={() => navigate('/my-coupons')}
                        className="glass"
                        style={{
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Ticket size={18} color="var(--secondary)" />
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Mis Cupones</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                    </button>

                    <button
                        onClick={() => navigate('/payment-methods')}
                        className="glass"
                        style={{
                            padding: '12px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            width: '100%',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <CreditCard size={18} color="var(--secondary)" />
                            <span style={{ fontWeight: '600', fontSize: '13px' }}>Métodos de Pago</span>
                        </div>
                        <ChevronRight size={16} color="var(--text-dim)" />
                    </button>

                    {/* Logout - Pushed to absolute bottom */}
                    <div style={{ marginTop: 'auto', paddingBottom: '10px' }}>
                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="glass"
                            style={{
                                padding: '16px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '12px',
                                color: '#ff6b6b',
                                width: '100%',
                                border: '1px solid rgba(255, 107, 107, 0.2)',
                                background: 'rgba(255, 107, 107, 0.05)',
                                borderRadius: '16px',
                                fontWeight: '900',
                                fontSize: '13px',
                                cursor: loggingOut ? 'not-allowed' : 'pointer',
                                opacity: loggingOut ? 0.7 : 1,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}
                        >
                            <LogOut size={18} strokeWidth={3} />
                            <span>{loggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


export default Profile;
