import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Calendar, Ticket, PlayCircle, Users } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/play-mode', icon: PlayCircle, label: 'Jugar' },
        { path: '/green-fee', icon: Ticket, label: 'Green Fee' },
        { path: '/tournaments', icon: Calendar, label: 'Eventos' },
        { path: '/community', icon: Users, label: 'Comunidad' },
    ];

    return (
        <nav style={{
            position: 'fixed',
            bottom: '0',
            left: '0',
            right: '0',
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            height: 'calc(55px + var(--safe-bottom))',
            display: 'flex',
            alignItems: 'stretch',
            zIndex: 1000,
            padding: '0 0 var(--safe-bottom) 0',
            background: 'rgba(14, 47, 31, 0.95)',
            backdropFilter: 'blur(25px) saturate(180%)',
            WebkitBackdropFilter: 'blur(25px) saturate(180%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.5)',
            borderRadius: '24px 24px 0 0',
            overflow: 'hidden'
        }}>
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    style={({ isActive }) => ({
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        color: isActive ? 'var(--secondary)' : 'var(--text-dim)',
                        textDecoration: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        padding: '6px 0',
                        position: 'relative'
                    })}
                >
                    {({ isActive }) => (
                        <>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                height: '24px',
                                transition: 'transform 0.3s ease',
                                transform: isActive ? 'translateY(-2px)' : 'none'
                            }}>
                                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span style={{
                                fontSize: '9px',
                                fontWeight: isActive ? '800' : '500',
                                lineHeight: 1,
                                whiteSpace: 'nowrap',
                                textAlign: 'center',
                                letterSpacing: '0.1px',
                                transition: 'all 0.3s ease',
                                opacity: isActive ? 1 : 0.8
                            }}>
                                {item.label}
                            </span>
                            {isActive && (
                                <div style={{
                                    position: 'absolute',
                                    bottom: '10px',
                                    width: '4px',
                                    height: '4px',
                                    borderRadius: '50%',
                                    background: 'var(--secondary)',
                                    boxShadow: '0 0 10px var(--secondary)'
                                }} />
                            )}
                        </>
                    )}
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
