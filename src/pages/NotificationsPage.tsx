import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle2, ShoppingBag,
    ArrowLeft, Calendar,
    ChevronRight, Sparkles, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import Card from '../components/Card';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotifications();

    const getIcon = (type: string) => {
        switch (type) {
            case 'order_new':
            case 'order_update':
                return <ShoppingBag size={20} color="var(--secondary)" />;
            case 'promo':
                return <Sparkles size={20} color="#f59e0b" />;
            case 'social':
                return <MessageCircle size={20} color="#3b82f6" />;
            default:
                return <Bell size={20} color="var(--text-dim)" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-CO', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="animate-fade" style={{
            padding: '20px',
            paddingBottom: 'calc(var(--nav-height) + 40px)',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto'
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '30px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white'
                        }}
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: '800' }}>Notificaciones</h1>
                        {unreadCount > 0 && <p style={{ fontSize: '13px', color: 'var(--secondary)', fontWeight: '600' }}>{unreadCount} nuevas</p>}
                    </div>
                </div>

                {notifications.length > 0 && (
                    <button
                        onClick={() => markAllAsRead()}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--secondary)',
                            fontSize: '13px',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        <CheckCircle2 size={16} />
                        Limpiar
                    </button>
                )}
            </header>

            {notifications.length === 0 ? (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '100px 20px',
                    textAlign: 'center',
                    opacity: 0.3
                }}>
                    <Bell size={64} style={{ marginBottom: '20px' }} strokeWidth={1} />
                    <p style={{ fontSize: '16px', fontWeight: '600' }}>No tienes notificaciones</p>
                    <p style={{ fontSize: '14px', marginTop: '5px' }}>Te avisaremos cuando pase algo importante</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <AnimatePresence>
                        {notifications.map((notif) => (
                            <motion.div
                                key={notif.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onClick={() => {
                                    markAsRead(notif.id);
                                    if (notif.link) navigate(notif.link);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <Card style={{
                                    padding: '18px',
                                    background: notif.read ? 'rgba(255,255,255,0.02)' : 'rgba(163, 230, 53, 0.03)',
                                    border: notif.read ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(163, 230, 53, 0.2)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}>
                                    {!notif.read && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '18px',
                                            right: '18px',
                                            width: '8px',
                                            height: '8px',
                                            borderRadius: '50%',
                                            background: 'var(--secondary)',
                                            boxShadow: '0 0 10px var(--secondary)'
                                        }} />
                                    )}

                                    <div style={{ display: 'flex', gap: '18px' }}>
                                        <div style={{
                                            width: '45px',
                                            height: '45px',
                                            borderRadius: '14px',
                                            background: 'rgba(255,255,255,0.03)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {getIcon(notif.type)}
                                        </div>

                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                                <h4 style={{
                                                    fontSize: '15px',
                                                    fontWeight: notif.read ? '700' : '900',
                                                    color: notif.read ? 'rgba(255,255,255,0.9)' : 'white'
                                                }}>
                                                    {notif.title}
                                                </h4>
                                            </div>
                                            <p style={{
                                                fontSize: '14px',
                                                color: 'var(--text-dim)',
                                                lineHeight: '1.4',
                                                marginBottom: '10px'
                                            }}>
                                                {notif.message}
                                            </p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Calendar size={12} />
                                                    {formatDate(notif.created_at)}
                                                </div>
                                                {notif.link && (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: 'var(--secondary)', fontWeight: '700' }}>
                                                        Ver más <ChevronRight size={12} />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Background Decorations */}
            <div style={{
                position: 'fixed',
                top: '20%',
                right: '-10%',
                width: '300px',
                height: '300px',
                background: 'var(--secondary)',
                filter: 'blur(150px)',
                opacity: 0.03,
                zIndex: -1,
                pointerEvents: 'none'
            }} />
        </div>
    );
};

export default NotificationsPage;
