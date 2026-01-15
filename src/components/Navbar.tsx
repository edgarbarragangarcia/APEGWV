import React from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
    return (
        <nav className="glass-dark" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: 'var(--header-height)',
            display: 'flex',
            alignItems: 'center',
            padding: 'var(--safe-top) 20px 0',
            zIndex: 1000,
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        background: 'var(--secondary)',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)',
                        fontWeight: 'bold',
                        fontSize: '20px'
                    }}>A</div>
                    <span style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '1px' }}>APEG</span>
                </Link>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button style={{ color: 'var(--text-dim)' }}><Search size={22} /></button>
                <button style={{ color: 'var(--text-dim)' }}><Bell size={22} /></button>
                <Link to="/profile" style={{
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    overflow: 'hidden',
                    border: '2px solid var(--secondary)'
                }}>
                    <img src="https://ui-avatars.com/api/?name=User&background=0E2F1F&color=A3E635" alt="Profile" style={{ width: '100%', height: '100%' }} />
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
