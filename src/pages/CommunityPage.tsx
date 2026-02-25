import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, ExternalLink, MessageSquare, Heart, Share2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';
import { supabase } from '../services/SupabaseManager';

interface Post {
    id: string;
    content: string | null;
    media_url: string | null;
    media_type: string | null;
    created_at: string;
    likes_count: number;
    comments_count: number;
    user: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
}

const CommunityPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*, user:profiles(full_name, avatar_url)')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setPosts((data as any) || []);
        } catch (err) {
            console.error('Error fetching posts:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            bottom: '0',
            width: '100%',
            overflow: 'hidden'
        }}>
            <PageHero />

            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                zIndex: 900,
                background: 'transparent',
                paddingBottom: '5px'
            }}>
                <div style={{ padding: '0 20px' }}>
                    <PageHeader
                        noMargin
                        showBack={false}
                        title="Comunidad APEG"
                        subtitle="Conecta con otros golfistas"
                    />
                </div>
            </div>

            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 110px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 10px)',
                overflowY: 'auto',
                padding: '10px 20px 100px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '15px',
                zIndex: 10
            }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '5px' }}>
                    <YoutubeCard />
                    <InstagramCard />
                </div>


                <div style={{ fontSize: '10px', fontWeight: '800', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: '2px', marginLeft: '5px' }}>
                    Muro de la Comunidad
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.5)' }}>Cargando muro...</div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '24px' }}>
                        <MessageSquare size={40} color="rgba(255,255,255,0.2)" style={{ marginBottom: '15px' }} />
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px' }}>El muro está tranquilo. ¡Sé el primero en publicar algo!</p>
                    </div>
                ) : (
                    posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))
                )}
            </div>
        </div>
    );
};

const PostCard: React.FC<{ post: Post }> = ({ post }) => (
    <div style={{
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '24px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }}>
        <div style={{ padding: '15px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-light)', border: '1px solid var(--secondary)' }}>
                {post.user?.avatar_url && <img src={post.user.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />}
            </div>
            <div>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: 'white' }}>{post.user?.full_name || 'Golfista APEG'}</h4>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{new Date(post.created_at).toLocaleDateString()}</span>
            </div>
        </div>
        {post.content && <p style={{ margin: '0 15px 15px', fontSize: '13px', color: 'rgba(255,255,255,0.8)', lineHeight: '1.4' }}>{post.content}</p>}
        {post.media_url && (
            <div style={{ height: '300px', background: '#000' }}>
                <img src={post.media_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Heart size={18} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{post.likes_count}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessageSquare size={18} color="rgba(255,255,255,0.4)" />
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)' }}>{post.comments_count}</span>
            </div>
            <Share2 size={18} color="rgba(255,255,255,0.4)" style={{ marginLeft: 'auto' }} />
        </div>
    </div>
);

const YoutubeCard = () => (
    <motion.a
        href="https://www.youtube.com/@Amorporelgolf"
        target="_blank"
        whileTap={{ scale: 0.98 }}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(90deg, #282828 0%, #1a1a1a 100%)',
            padding: '12px 15px',
            borderRadius: '20px',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: '#FF0000', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Youtube size={16} color="white" />
            </div>
            <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Canal APEG</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '10px' }}>YouTube Shorts</p>
            </div>
        </div>
        <ExternalLink size={16} color="rgba(255,255,255,0.5)" />
    </motion.a>
);

const InstagramCard = () => (
    <motion.a
        href="https://www.instagram.com/amorporelgolf/reels/"
        target="_blank"
        whileTap={{ scale: 0.98 }}
        style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            padding: '12px 15px',
            borderRadius: '20px',
            textDecoration: 'none',
            border: '1px solid rgba(255,255,255,0.1)'
        }}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'white', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Instagram size={16} color="#dc2743" />
            </div>
            <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Instagram APEG</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>Nuestros reels</p>
            </div>
        </div>
        <ExternalLink size={16} color="white" />
    </motion.a>
);

export default CommunityPage;
