import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, ShoppingBag, Calendar, Ticket } from 'lucide-react';

const BottomNav: React.FC = () => {
    const navItems = [
        { path: '/', icon: Home, label: 'Inicio' },
        { path: '/green-fee', icon: Ticket, label: 'Green Fee' },
        { path: '/shop', icon: ShoppingBag, label: 'Tienda' },
        { path: '/tournaments', icon: Calendar, label: 'Eventos' },
    ];

    return (
        <nav className="glass" style={{
            position: 'fixed',
            bottom: 'calc(20px + var(--safe-bottom))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% - 40px)',
            maxWidth: 'calc(var(--app-max-width) - 40px)',
            height: '70px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            zIndex: 1000,
            padding: '0 10px',
            borderRadius: '25px',
        }}>
            {navItems.map((item) => (
                <NavLink
                    key={item.path}
                    to={item.path}
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
