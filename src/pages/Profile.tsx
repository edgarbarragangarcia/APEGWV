import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, CreditCard, ChevronRight, Edit2, Mail, Phone, MapPin, Store, Trophy, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Database } from '../types/database.types';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;
                setProfile(profileData);
            } catch (err) {
                console.error('Error fetching profile:', err);
            }
        };

        fetchUserData();
    }, [user]);

    const handleLogout = async () => {
        if (loggingOut) return;
        setLoggingOut(true);

        try {
            localStorage.clear();
            sessionStorage.clear();
            // Clear specific keys if needed
            Object.keys(localStorage).forEach(key => {
                if (key.includes('supabase.auth.token')) localStorage.removeItem(key);
            });

            await Promise.race([
                supabase.auth.signOut(),
                new Promise(resolve => setTimeout(resolve, 1500))
            ]);
            window.location.replace('/auth');
        } catch (error) {
            console.error('Logout error:', error);
            window.location.replace('/auth');
        }
    };

    return (
        <div className="animate-fade" style={styles.pageContainer}>
            <div style={styles.headerArea}>
                <PageHeader noMargin title="Mi Perfil" onBack={() => navigate('/')} />
            </div>

            <div style={styles.contentContainer}>
                {/* Profile Header - Compact */}
                <div style={styles.profileHeader}>
                    <div style={styles.avatarWrapper}>
                        <div style={styles.avatarRing}>
                            <div style={styles.avatarInner}>
                                <img
                                    src={profile?.id_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0E2F1F&color=A3E635&size=120`}
                                    alt="Profile"
                                    style={styles.avatarImg}
                                />
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/profile/edit')}
                            style={styles.editButton}
                        >
                            <Edit2 size={12} />
                        </button>
                    </div>

                    <div style={{ textAlign: 'center', marginTop: '5px' }}>
                        <h1 style={styles.nameText}>
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
                        <p style={styles.subText}>
                            ID: {profile?.federation_code || 'APEG'} • Hcp {profile?.handicap ?? '--'}
                        </p>
                    </div>
                </div>

                {/* Account Info Accordion - Compact */}
                <div style={{ marginBottom: '10px' }}>
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="glass"
                        style={styles.menuButton}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={styles.iconBox}>
                                <Shield size={14} strokeWidth={3} />
                            </div>
                            <span style={styles.menuText}>Información de la Cuenta</span>
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
                            <div style={styles.infoBox}>
                                <InfoRow icon={Mail} text={profile?.email} />
                                <InfoRow icon={Phone} text={profile?.phone || 'No configurado'} />
                                <InfoRow icon={MapPin} text={profile?.address || 'No configurada'} />
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Main Menu - Flex container to fit screen */}
                <div style={styles.menuContainer}>
                    <MenuButton icon={Settings} label="Configuración del Sistema" onClick={() => navigate('/settings')} />
                    <MenuButton icon={Store} label="Mi Marketplace APEG" onClick={() => navigate('/my-store')} />
                    <MenuButton icon={Trophy} label="Mis Eventos Organizados" onClick={() => navigate('/my-events')} />
                    <MenuButton icon={Ticket} label="Mis Cupones" onClick={() => navigate('/my-coupons')} />
                    <MenuButton icon={CreditCard} label="Métodos de Pago" onClick={() => navigate('/payment-methods')} />

                    {/* Spacer to push Logout to bottom if space permits */}
                    <div style={{ flex: 1 }} />

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="glass"
                        style={styles.logoutButton}
                    >
                        <LogOut size={16} strokeWidth={3} />
                        <span>{loggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Sub Components ---

const MenuButton = ({ icon: Icon, label, onClick }: any) => (
    <button onClick={onClick} className="glass" style={styles.menuButton}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={18} color="var(--secondary)" />
            <span style={styles.menuText}>{label}</span>
        </div>
        <ChevronRight size={16} color="var(--text-dim)" />
    </button>
);

const InfoRow = ({ icon: Icon, text }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={12} color="var(--text-dim)" />
        <span style={{ fontSize: '11px', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text}
        </span>
    </div>
);

// --- Styles ---

const styles = {
    pageContainer: {
        position: 'fixed' as 'fixed', inset: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', zIndex: 900,
        paddingTop: 'var(--header-offset-top)',
        paddingBottom: 'var(--nav-height)'
    },
    headerArea: {
        flexShrink: 0, zIndex: 10, background: 'var(--primary)', padding: '0 20px'
    },
    contentContainer: {
        flex: 1,
        display: 'flex', flexDirection: 'column' as 'column',
        padding: '0 20px 15px 20px',
        overflowY: 'auto' as 'auto', // Allow scroll only if screen is extremely small
        WebkitOverflowScrolling: 'touch' as 'touch',
        gap: '10px' // Reduced gap
    },
    profileHeader: {
        display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center',
        marginBottom: '5px', flexShrink: 0
    },
    avatarWrapper: {
        position: 'relative' as 'relative', marginBottom: '5px'
    },
    avatarRing: {
        width: '68px', height: '68px', // Slightly smaller
        borderRadius: '22px', border: '2px solid var(--secondary)',
        padding: '2px', background: 'linear-gradient(135deg, var(--secondary), #7cc42b)',
        transform: 'rotate(-2deg)'
    },
    avatarInner: {
        width: '100%', height: '100%', borderRadius: '18px',
        overflow: 'hidden', transform: 'rotate(2deg)', background: 'var(--primary)'
    },
    avatarImg: {
        width: '100%', height: '100%', objectFit: 'cover' as 'cover'
    },
    editButton: {
        position: 'absolute' as 'absolute', top: '-5px', right: '-15px',
        padding: '6px', color: 'var(--secondary)',
        background: 'rgba(163, 230, 53, 0.1)', borderRadius: '8px',
        border: '1px solid rgba(163, 230, 53, 0.2)', cursor: 'pointer'
    },
    nameText: {
        fontSize: '20px', fontWeight: '900', marginBottom: '0',
        letterSpacing: '-0.5px', color: 'white', lineHeight: '1.2'
    },
    subText: {
        color: 'var(--text-dim)', fontSize: '10px', fontWeight: '600',
        textTransform: 'uppercase' as 'uppercase', letterSpacing: '0.5px'
    },
    menuContainer: {
        display: 'flex', flexDirection: 'column' as 'column',
        gap: '8px', flex: 1 // Distribute space
    },
    menuButton: {
        padding: '12px 16px', // Compact padding
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px'
    },
    iconBox: {
        background: 'var(--secondary)', padding: '5px', borderRadius: '6px', color: 'var(--primary)'
    },
    menuText: {
        fontWeight: '700', fontSize: '14px', color: 'white'
    },
    infoBox: {
        marginTop: '5px', padding: '10px', background: 'rgba(0,0,0,0.2)',
        borderRadius: '12px', display: 'flex', flexDirection: 'column' as 'column',
        gap: '8px', border: '1px solid rgba(255,255,255,0.03)'
    },
    logoutButton: {
        marginTop: 'auto', padding: '14px', // Reduced from 16
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', color: '#ff6b6b', width: '100%',
        border: '1px solid rgba(255, 107, 107, 0.2)',
        background: 'rgba(255, 107, 107, 0.05)', borderRadius: '14px',
        fontWeight: '900', fontSize: '12px',
        textTransform: 'uppercase' as 'uppercase', letterSpacing: '1px'
    }
};

export default Profile;

