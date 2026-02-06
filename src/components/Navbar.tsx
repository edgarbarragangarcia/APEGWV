import React, { useEffect } from 'react';
import { Bell, ShoppingBag } from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import { useProfile } from '../hooks/useProfile';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { totalItems } = useCart();
    const { unreadCount } = useNotifications();
    const videoRef = React.useRef<HTMLVideoElement>(null);

    const location = useLocation();
    const transparentRoutes = [
        '/', '/green-fee', '/tournaments', '/profile', '/round', '/play-mode',
        '/friend-selection', '/create-group', '/select-course', '/my-store',
        '/my-reservations', '/settings', '/rounds', '/cart', '/checkout',
        '/my-events', '/my-coupons', '/notifications'
    ];
    const isCategoryPage = location.pathname.includes('/category/');
    const isTransparentNavbar = isCategoryPage || transparentRoutes.some(route =>
        location.pathname === route || location.pathname.startsWith(route + '/')
    );

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        // Force muted at DOM level (sometimes React prop is not enough for autoplay)
        video.muted = true;
        video.defaultMuted = true;

        const attemptPlay = () => {
            if (video.paused) {
                video.play().catch(error => {
                    console.log("Autoplay blocked, waiting for interaction:", error);
                });
            }
        };

        attemptPlay();
        video.addEventListener('loadeddata', attemptPlay);

        // Fallback: Play on first touch/click anywhere to bypass mobile restrictions
        const unlock = () => {
            attemptPlay();
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('click', unlock);
        };

        window.addEventListener('touchstart', unlock);
        window.addEventListener('click', unlock);

        return () => {
            video.removeEventListener('loadeddata', attemptPlay);
            window.removeEventListener('touchstart', unlock);
            window.removeEventListener('click', unlock);
        };
    }, []);

    return (
        <nav className="glass-dark" style={{
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            paddingTop: 'calc(env(safe-area-inset-top) + 15px)',
            paddingBottom: '10px',
            paddingLeft: '20px',
            paddingRight: '20px',
            display: 'flex',
            alignItems: 'center',
            zIndex: 1000,
            justifyContent: 'space-between',
            borderRadius: '0 0 24px 24px',
            border: 'none',
            borderBottom: isTransparentNavbar ? 'none' : '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(25px) saturate(180%)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%)',
            boxShadow: isTransparentNavbar ? 'none' : '0 10px 40px rgba(0, 0, 0, 0.5)',
            background: isTransparentNavbar
                ? 'linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)'
                : 'rgba(14, 47, 31, 0.85)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'white',
                        padding: '2px',
                        border: '2px solid var(--secondary)',
                        boxShadow: '0 0 15px rgba(163, 230, 53, 0.2)'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            background: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                loop
                                muted
                                playsInline
                                preload="auto"
                                style={{
                                    width: '150%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    transform: 'scale(2.0)',
                                    transformOrigin: '5% 48%'
                                }}
                            >
                                <source src="https://drqyvhwgnuvrcmwthwwn.supabase.co/storage/v1/object/public/video/watermarked-4f9c0c88-80ff-4880-9dd5-4ccce3509025.MP4" type="video/mp4" />
                            </video>
                        </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{
                            fontSize: '18px',
                            fontWeight: '700',
                            letterSpacing: '1px',
                            lineHeight: '1.2',
                            textShadow: '0 0 10px rgba(163, 230, 53, 0.15)'
                        }}>APEG</span>
                        <span style={{ fontSize: '9px', fontWeight: '500', color: 'var(--text-dim)', letterSpacing: '0.5px', marginTop: '-2px' }}>Amor Por El Golf</span>
                    </div>
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Cart Icon */}
                <button
                    onClick={() => navigate('/cart')}
                    style={{
                        color: 'var(--text-dim)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ShoppingBag size={20} />
                    {totalItems > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '2px',
                            background: 'var(--secondary)',
                            color: 'var(--primary)',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 5px',
                            borderRadius: '10px',
                            minWidth: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                        }}>
                            {totalItems}
                        </span>
                    )}
                </button>

                {/* Notifications Icon */}
                <button
                    onClick={() => navigate('/notifications')}
                    style={{
                        color: 'var(--text-dim)',
                        background: 'none',
                        border: 'none',
                        padding: '8px',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '4px',
                            right: '2px',
                            background: '#ef4444', // Red for notifications
                            color: 'white',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 5px',
                            borderRadius: '10px',
                            minWidth: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }}>
                            {unreadCount}
                        </span>
                    )}
                </button>

                <Link
                    id="nav-profile"
                    to="/profile"
                    style={{
                        marginLeft: '4px',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '2px solid var(--secondary)',
                        boxShadow: '0 0 15px rgba(163, 230, 53, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                    <img
                        src={profile?.id_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                        alt="Profile"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
