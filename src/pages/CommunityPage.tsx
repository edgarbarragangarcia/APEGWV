import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, ExternalLink, Play } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

const CommunityPage: React.FC = () => {
    const [showVideo, setShowVideo] = useState(false);

    // Video ID (Updated to user provided Short)
    const videoId = "wtBXAaQhHoc";

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

            {/* Header Fijo */}
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
                        subtitle="Únete a nuestra pasión por el golf"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div style={{
                position: 'absolute',
                top: 'calc(var(--header-offset-top) + 80px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height) + 10px)',
                overflowY: 'auto',
                padding: '20px 20px 100px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                zIndex: 10
            }}>

                {/* YouTube Featured Video Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    style={{
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        background: '#000',
                        aspectRatio: '9/16',
                    }}
                >
                    {showVideo ? (
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{
                                border: 'none',
                                display: 'block'
                            }}
                        ></iframe>
                    ) : (
                        <div
                            onClick={() => setShowVideo(true)}
                            style={{
                                position: 'absolute',
                                inset: 0,
                                cursor: 'pointer',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                backgroundImage: `url(https://img.youtube.com/vi/${videoId}/maxresdefault.jpg)`,
                            }}
                        >
                            <div style={{
                                position: 'absolute',
                                inset: 0,
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.3s'
                            }}>
                                <motion.div
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '50%',
                                        background: 'rgba(255, 0, 0, 0.9)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 8px 20px rgba(255,0,0,0.4)',
                                    }}
                                >
                                    <Play size={28} fill="white" color="white" style={{ marginLeft: '4px' }} />
                                </motion.div>
                            </div>

                            {/* Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '15px',
                                left: '15px',
                                background: 'rgba(255,0,0,0.9)',
                                color: 'white',
                                padding: '4px 10px',
                                borderRadius: '12px',
                                fontSize: '10px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                            }}>
                                Video Destacado
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Channel Link */}
                <motion.a
                    href="https://www.youtube.com/@Amorporelgolf"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'linear-gradient(90deg, #282828 0%, #1a1a1a 100%)',
                        padding: '16px 20px',
                        borderRadius: '20px',
                        textDecoration: 'none',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            background: '#FF0000',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Youtube size={20} color="white" />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontSize: '15px', fontWeight: 'bold' }}>
                                Más videos en YouTube
                            </h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
                                @Amorporelgolf
                            </p>
                        </div>
                    </div>
                    <ExternalLink size={18} color="rgba(255,255,255,0.5)" />
                </motion.a>

                {/* Instagram Card (Condensed) */}
                <motion.a
                    href="https://www.instagram.com/amorporelgolf/reels/"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        height: '140px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        opacity: 0.9
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '20px',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{
                                background: 'white',
                                padding: '10px',
                                borderRadius: '50%',
                                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                            }}>
                                <Instagram size={28} color="#cc2366" />
                            </div>
                            <div>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '900',
                                    color: 'white',
                                    margin: 0,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    Instagram Reels
                                </h2>
                                <p style={{
                                    fontSize: '13px',
                                    color: 'rgba(255,255,255,0.9)',
                                    margin: '4px 0 0 0',
                                    fontWeight: '500'
                                }}>
                                    Vive los mejores momentos
                                </p>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(255,255,255,0.2)',
                            padding: '8px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <ExternalLink size={16} color="white" />
                        </div>
                    </div>
                </motion.a>

            </div>
        </div>
    );
};

export default CommunityPage;
