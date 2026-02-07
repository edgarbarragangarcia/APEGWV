import React, { useEffect, useState } from 'react';
import { supabase } from '../services/SupabaseManager';
import { Settings, LogOut, Shield, CreditCard, ChevronRight, Edit2, Mail, Phone, MapPin, Store, Trophy, Ticket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import type { Database } from '../types/database.types';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { useAuth } from '../context/AuthContext';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [storeName, setStoreName] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);
    const [showInfo, setShowInfo] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!user) return;
            try {
                // Fetch profile
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profileError) throw profileError;
                setProfile(profileData);

                // Fetch store name from seller_profiles
                const { data: sellerData, error: sellerError } = await supabase
                    .from('seller_profiles')
                    .select('store_name')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (!sellerError && sellerData) {
                    setStoreName(sellerData.store_name);
                }
            } catch (err) {
                console.error('Error fetching profile data:', err);
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
            <PageHero image="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2070&auto=format&fit=crop" />
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
                            <Edit2 size={14} />
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

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '5px 0' }} />

                                <ClickableInfoRow
                                    icon={Settings}
                                    label="Configuración del Sistema"
                                    onClick={() => navigate('/settings')}
                                />
                                <ClickableInfoRow
                                    icon={CreditCard}
                                    label="Métodos de Pago"
                                    onClick={() => navigate('/payment-methods')}
                                />
                            </div>
                        </motion.div>
                    )}
                </div>

                <div style={styles.menuContainer}>
                    <MenuButton
                        icon={Store}
                        label={storeName ? `Mi Marketplace ${storeName}` : "Mi Marketplace"}
                        onClick={() => navigate('/my-store')}
                    />
                    <MenuButton icon={Trophy} label="Mis Eventos Organizados" onClick={() => navigate('/my-events')} />
                    <MenuButton icon={Ticket} label="Mis Cupones" onClick={() => navigate('/my-coupons')} />

                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="glass"
                        style={styles.logoutButton}
                    >
                        <LogOut size={16} strokeWidth={3} />
                        <span>{loggingOut ? 'SALIR' : 'CERRAR SESIÓN'}</span>
                    </button>

                    {/* Spacer to maintain layout if needed */}
                    <div style={{ flex: 1, minHeight: '20px' }} />
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
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '2px 0' }}>
        <Icon size={14} color="var(--text-dim)" />
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {text}
        </span>
    </div>
);

const ClickableInfoRow = ({ icon: Icon, label, onClick }: any) => (
    <button
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '8px 0',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Icon size={14} color="var(--secondary)" />
            <span style={{ fontSize: '13px', fontWeight: '600', color: 'white' }}>{label}</span>
        </div>
        <ChevronRight size={14} color="var(--text-dim)" />
    </button>
);

// --- Styles ---

const styles = {
    pageContainer: {
        position: 'fixed' as 'fixed', inset: 0,
        background: 'var(--primary)',
        display: 'flex', flexDirection: 'column' as 'column',
        overflow: 'hidden', zIndex: 900
    },
    headerArea: {
        flexShrink: 0,
        position: 'relative' as 'relative',
        zIndex: 10,
        background: 'transparent',
        padding: '0 20px',
        paddingTop: 'var(--header-offset-top)'
    },
    contentContainer: {
        flex: 1,
        position: 'relative' as 'relative',
        zIndex: 10,
        display: 'flex', flexDirection: 'column' as 'column',
        padding: '0 20px calc(var(--nav-height) + 15px) 20px',
        overflowY: 'auto' as 'auto', // Allow scroll only if screen is extremely small
        WebkitOverflowScrolling: 'touch' as 'touch',
        gap: '10px' // Reduced gap
    },
    profileHeader: {
        display: 'flex', flexDirection: 'column' as 'column', alignItems: 'center',
        marginBottom: '5px', marginTop: '30px', flexShrink: 0
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
        position: 'absolute' as 'absolute', top: '-5px', right: '-10px',
        padding: '8px', color: 'var(--primary)',
        background: 'var(--secondary)', borderRadius: '50%',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        border: '2px solid var(--primary)', cursor: 'pointer',
        zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'center'
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
        marginTop: '15px',
        marginBottom: '10px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '12px 28px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '10px', color: '#ff6b6b',
        width: 'fit-content', // Makes it look more round/pill
        border: '1px solid rgba(255, 107, 107, 0.2)',
        background: 'rgba(255, 107, 107, 0.05)',
        borderRadius: '30px', // Pill shape
        fontWeight: '900', fontSize: '11px',
        textTransform: 'uppercase' as 'uppercase',
        letterSpacing: '1px'
    }
};

export default Profile;

