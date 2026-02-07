import React from 'react';
import { motion } from 'framer-motion';
import { Instagram, Youtube, ExternalLink } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import PageHero from '../components/PageHero';

const CommunityPage: React.FC = () => {
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
            <PageHero image="/images/briceno18.png" />

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

                {/* Instagram Card */}
                <motion.a
                    href="https://www.instagram.com/amorporelgolf/reels/"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        minHeight: '200px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Background Gradient for Instagram */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        opacity: 0.8
                    }} />

                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.4)',
                        backdropFilter: 'blur(2px)'
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '30px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '15px'
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '12px',
                            borderRadius: '50%',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                        }}>
                            <Instagram size={32} color="#cc2366" />
                        </div>

                        <div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '900',
                                color: 'white',
                                marginBottom: '4px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Instagram Reels
                            </h2>
                            <p style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.9)',
                                margin: 0,
                                fontWeight: '500'
                            }}>
                                Vive los mejores momentos y highlights
                            </p>
                        </div>

                        <div style={{
                            marginTop: '10px',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            Ver Reels <ExternalLink size={12} />
                        </div>
                    </div>
                </motion.a>

                {/* YouTube Card */}
                <motion.a
                    href="https://www.youtube.com/@Amorporelgolf"
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                        display: 'block',
                        textDecoration: 'none',
                        position: 'relative',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        minHeight: '200px',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    {/* Background for YouTube */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: '#FF0000',
                        opacity: 0.8
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to bottom right, rgba(0,0,0,0.2), rgba(0,0,0,0.6))',
                    }} />

                    <div style={{
                        position: 'relative',
                        zIndex: 1,
                        padding: '30px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '15px'
                    }}>
                        <div style={{
                            background: 'white',
                            padding: '12px',
                            borderRadius: '50%',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                        }}>
                            <Youtube size={32} color="#FF0000" />
                        </div>

                        <div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '900',
                                color: 'white',
                                marginBottom: '4px',
                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                            }}>
                                Canal de YouTube
                            </h2>
                            <p style={{
                                fontSize: '14px',
                                color: 'rgba(255,255,255,0.9)',
                                margin: 0,
                                fontWeight: '500'
                            }}>
                                Contenido exclusivo, tutoriales y más
                            </p>
                        </div>

                        <div style={{
                            marginTop: '10px',
                            background: 'rgba(255,255,255,0.2)',
                            padding: '8px 16px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            color: 'white',
                            border: '1px solid rgba(255,255,255,0.3)'
                        }}>
                            Suscribirse <ExternalLink size={12} />
                        </div>
                    </div>
                </motion.a>

            </div>
        </div>
    );
};

export default CommunityPage;
