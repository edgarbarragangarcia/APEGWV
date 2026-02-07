import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Ticket, PlayCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BottomNav: React.FC = () => {
    const location = useLocation();

    // Explicitly define the type for icon
    const navItems = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/play-mode', icon: PlayCircle, label: 'Jugar' },
        { path: '/green-fee', icon: Ticket, label: 'Green Fee' },
        { path: '/tournaments', icon: Calendar, label: 'Eventos' },
        { path: '/community', icon: Users, label: 'Comunidad' },
    ];

    return (
        <motion.nav
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                width: '100%',
                maxWidth: 'var(--app-max-width)',
                margin: '0 auto',
                height: 'calc(65px + var(--safe-bottom, env(safe-area-inset-bottom)))',
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-around',
                zIndex: 1000,
                padding: '10px 10px calc(10px + var(--safe-bottom, env(safe-area-inset-bottom))) 10px',
                background: 'rgba(10, 20, 15, 0.75)', // Darker, more transparent
                backdropFilter: 'blur(30px) saturate(180%)',
                WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.4)',
                borderRadius: '24px 24px 0 0',
            }}
        >
            {navItems.map((item) => {
                const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        style={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textDecoration: 'none',
                            position: 'relative',
                            height: '100%',
                            maxWidth: '80px', // Prevent too wide click areas
                        }}
                    >
                        {/* Active Background Glow/Spotlight */}
                        <AnimatePresence>
                            {isActive && (
                                <motion.div
                                    layoutId="nav-glow"
                                    initial={{ opacity: 0, scale: 0.5 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    style={{
                                        position: 'absolute',
                                        top: '-20px',
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        background: 'radial-gradient(circle, rgba(74, 222, 128, 0.3) 0%, transparent 70%)',
                                        filter: 'blur(5px)',
                                        zIndex: -1,
                                    }}
                                />
                            )}
                        </AnimatePresence>

                        {/* Active Indicator Top Line */}
                        {isActive && (
                            <motion.div
                                layoutId="nav-indicator"
                                style={{
                                    position: 'absolute',
                                    top: '-10px',
                                    width: '20px',
                                    height: '2px',
                                    borderRadius: '2px',
                                    background: 'var(--secondary)',
                                    boxShadow: '0 0 8px var(--secondary)'
                                }}
                            />
                        )}

                        <motion.div
                            whileTap={{ scale: 0.9 }}
                            animate={{
                                y: isActive ? -2 : 0,
                            }}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                        >
                            <div style={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '24px',
                                height: '24px',
                            }}>
                                <item.icon
                                    size={22}
                                    color={isActive ? 'var(--secondary)' : 'rgba(255,255,255,0.5)'}
                                    strokeWidth={isActive ? 2.5 : 2}
                                />
                            </div>

                            <span style={{
                                fontSize: '10px',
                                fontWeight: isActive ? '700' : '500',
                                color: isActive ? 'var(--secondary)' : 'rgba(255,255,255,0.5)',
                                transition: 'color 0.2s ease',
                            }}>
                                {item.label}
                            </span>
                        </motion.div>
                    </NavLink>
                );
            })}
        </motion.nav>
    );
};

export default BottomNav;
