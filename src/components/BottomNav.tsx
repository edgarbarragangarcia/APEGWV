import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Calendar, Ticket, PlayCircle } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/play-mode', icon: PlayCircle, label: 'Jugar' },
        { path: '/green-fee', icon: Ticket, label: 'Green Fee' },
        { path: '/shop', icon: ShoppingBag, label: 'Marketplace' },
        { path: '/tournaments', icon: Calendar, label: 'Eventos' },
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
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            padding: '0 10px var(--safe-bottom) 10px',
            background: 'linear-gradient(135deg, rgba(14, 47, 31, 0.95) 0%, rgba(20, 64, 42, 0.95) 100%)',
            backdropFilter: 'blur(15px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.4)',
            borderRadius: '30px 30px 0 0'
        }}>
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
                    id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                    style={({ isActive }) => ({
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        color: isActive ? 'var(--secondary)' : 'var(--text-dim)',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease'
                    })}
                >
                    <item.icon size={24} />
                    <span style={{ fontSize: '10px', fontWeight: '500' }}>{item.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNav;
