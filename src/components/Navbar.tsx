import React, { useEffect, useState } from 'react';
import { Search, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/SupabaseManager';

const Navbar: React.FC = () => {
    const [profile, setProfile] = useState<any>(null);
    const videoRef = React.useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.play().catch(error => {
                console.log("Video autoplay failed:", error);
            });
        }
    }, []);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data } = await supabase
                    .from('profiles')
                    .select('full_name, id_photo_url')
                    .eq('id', session.user.id)
                    .single();
                setProfile(data);
            }
        };
        fetchProfile();

        // Escuchar actualizaciones del perfil
        window.addEventListener('profile-updated', fetchProfile);
        return () => window.removeEventListener('profile-updated', fetchProfile);
    }, []);
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
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'orange',
                        padding: '3px'
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '7px',
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
                                <source src="/gif/watermarked-4f9c0c88-80ff-4880-9dd5-4ccce3509025.MP4" type="video/mp4" />
                            </video>
                        </div>
                    </div>
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
                    <img
                        src={profile?.id_photo_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=0E2F1F&color=A3E635`}
                        alt="Profile"
                        style={{ width: '100%', height: '100%' }}
                    />
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;
