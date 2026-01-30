import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell, CheckCircle2, ShoppingBag,
    ChevronRight, Sparkles, MessageCircle, Trash2, Clock,
    Check, X, Users
} from 'lucide-react';
import { supabase } from '../services/SupabaseManager';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';
import PageHeader from '../components/PageHeader';
import ConfirmationModal from '../components/ConfirmationModal';

const NotificationsPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { notifications, markAsRead, markAllAsRead, unreadCount, deleteNotification, deleteAllNotifications } = useNotifications();
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const getIcon = (type: string) => {
        const iconSize = 22;
        switch (type) {
            case 'offer':
            case 'offer_update':
                return {
                    icon: <Sparkles size={iconSize} color="var(--secondary)" />,
                    bg: 'rgba(163, 230, 53, 0.1)',
                    glow: 'rgba(163, 230, 53, 0.3)'
                };
            case 'order_new':
            case 'order_update':
                return {
                    icon: <ShoppingBag size={iconSize} color="#fbbf24" />,
                    bg: 'rgba(251, 191, 36, 0.1)',
                    glow: 'rgba(251, 191, 36, 0.3)'
                };
            case 'social':
                return {
                    icon: <MessageCircle size={iconSize} color="#3b82f6" />,
                    bg: 'rgba(59, 130, 246, 0.1)',
                    glow: 'rgba(59, 130, 246, 0.3)'
                };
            case 'game_invitation':
                return {
                    icon: <Users size={iconSize} color="var(--secondary)" />,
                    bg: 'rgba(163, 230, 53, 0.1)',
                    glow: 'rgba(163, 230, 53, 0.4)'
                };
            default:
                return {
                    icon: <Bell size={iconSize} color="var(--text-dim)" />,
                    bg: 'rgba(255, 255, 255, 0.05)',
                    glow: 'rgba(255, 255, 255, 0.1)'
                };
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

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { type: 'spring' as const, damping: 15, stiffness: 100 }
        }
    };

    const handleInviteAction = async (notifId: string, groupId: string, action: 'accepted' | 'declined') => {
        try {
            const { error } = await supabase
                .from('group_members' as any)
                .update({ status: action })
                .eq('group_id', groupId)
                .eq('user_id', user?.id);

            if (error) throw error;

            // Mark notification as read and delete it
            await markAsRead(notifId);
            await deleteNotification(notifId);

            if (action === 'accepted') {
                navigate(`/round?group_id=${groupId}`);
            }
        } catch (err) {
            console.error('Error handling invitation:', err);
            alert('No se pudo procesar la invitación.');
        }
    };

    return (
        <div className="animate-fade" style={{
            position: 'fixed',
            inset: 0,
            width: '100%',
            maxWidth: 'var(--app-max-width)',
            margin: '0 auto',
            overflow: 'hidden',
            background: 'var(--primary)'
        }}>
            {/* Header Fijo */}
            <div style={{
                position: 'absolute',
                top: 'var(--header-offset-top)',
                left: '0',
                right: '0',
                width: '100%',
                zIndex: 900,
                background: 'var(--primary)',
                paddingLeft: '20px',
                paddingRight: '20px',
                pointerEvents: 'auto'
            }}>
                <PageHeader
                    noMargin
                    title="Notificaciones"
                    subtitle={unreadCount > 0 ? `${unreadCount} nuevas` : undefined}
                />

                {notifications.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            display: 'flex',
                            gap: '10px',
                            marginTop: '5px'
                        }}
                    >
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => markAllAsRead()}
                            style={{
                                flex: 1,
                                background: 'rgba(163, 230, 53, 0.1)',
                                border: '1px solid rgba(163, 230, 53, 0.2)',
                                color: 'var(--secondary)',
                                padding: '12px',
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <CheckCircle2 size={16} />
                            Leídos
                        </motion.button>
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsDeleteModalOpen(true)}
                            style={{
                                flex: 1,
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#ff6b6b',
                                padding: '12px',
                                borderRadius: '16px',
                                fontSize: '13px',
                                fontWeight: '800',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <Trash2 size={16} />
                            Borrar
                        </motion.button>
                    </motion.div>
                )}
            </div>

            {/* Area de Scroll */}
            <div style={{
                position: 'absolute',
                top: notifications.length > 0 ? 'calc(var(--header-offset-top) + 110px)' : 'calc(var(--header-offset-top) + 60px)',
                left: '0',
                right: '0',
                bottom: 'calc(var(--nav-height))',
                overflowY: 'auto',
                overflowX: 'hidden',
                padding: '0 20px 40px 20px',
                transition: 'top 0.3s ease'
            }}>

                <ConfirmationModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={deleteAllNotifications}
                    title="¿Eliminar todo?"
                    message="Esta acción borrará permanentemente todas tus notificaciones. ¿Deseas continuar?"
                    confirmText="Sí, eliminar todo"
                    cancelText="Cancelar"
                    type="danger"
                />

                {notifications.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '120px 20px',
                            textAlign: 'center',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '30px',
                            border: '1px dashed rgba(255,255,255,0.05)',
                            marginTop: '20px'
                        }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '25px',
                            background: 'rgba(255,255,255,0.03)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '20px',
                            color: 'var(--text-dim)'
                        }}>
                            <Bell size={40} strokeWidth={1.5} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'white' }}>Todo al día</h3>
                        <p style={{ fontSize: '14px', color: 'var(--text-dim)', marginTop: '8px', maxWidth: '240px', lineHeight: '1.5' }}>
                            Te avisaremos aquí cuando tengas nuevas ofertas o noticias importantes.
                        </p>
                    </motion.div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                        <AnimatePresence mode="popLayout">
                            {notifications.map((n) => {
                                const notif = n as any;
                                const iconStyle = getIcon(notif.type);
                                return (
                                    <motion.div
                                        key={notif.id}
                                        variants={itemVariants}
                                        layout
                                        exit={{ opacity: 0, x: 50, scale: 0.9 }}
                                        onClick={() => {
                                            markAsRead(notif.id);
                                            if (notif.link) navigate(notif.link);
                                        }}
                                        style={{
                                            position: 'relative',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {/* Glassmorphism Card */}
                                        <div style={{
                                            padding: '20px',
                                            background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
                                            backdropFilter: 'blur(10px)',
                                            WebkitBackdropFilter: 'blur(10px)',
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            borderRadius: '24px',
                                            display: 'flex',
                                            gap: '18px',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: notif.read ? 'none' : '0 10px 30px rgba(0,0,0,0.2)'
                                        }}>
                                            {/* Unread Indicator Bar */}
                                            {!notif.read && (
                                                <div style={{
                                                    position: 'absolute',
                                                    left: 0,
                                                    top: 0,
                                                    bottom: 0,
                                                    width: '4px',
                                                    background: 'var(--secondary)',
                                                    boxShadow: '0 0 15px var(--secondary)'
                                                }} />
                                            )}

                                            {/* Icon Container */}
                                            <div style={{
                                                width: '54px',
                                                height: '54px',
                                                borderRadius: '18px',
                                                background: iconStyle.bg,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                boxShadow: `0 8px 20px ${iconStyle.glow}`,
                                                border: '1px solid rgba(255,255,255,0.05)'
                                            }}>
                                                {iconStyle.icon}
                                            </div>

                                            {/* Content */}
                                            <div style={{ flex: 1 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                                    <h4 style={{
                                                        fontSize: '16px',
                                                        fontWeight: '900',
                                                        color: 'white',
                                                        letterSpacing: '-0.3px',
                                                        lineHeight: '1.2'
                                                    }}>
                                                        {notif.title}
                                                    </h4>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, color: '#ff6b6b' }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteNotification(notif.id);
                                                        }}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.03)',
                                                            border: 'none',
                                                            color: 'rgba(255,255,255,0.2)',
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '10px',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            marginLeft: '10px'
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </motion.button>
                                                </div>
                                                <p style={{
                                                    fontSize: '14px',
                                                    color: 'var(--text-dim)',
                                                    lineHeight: '1.5',
                                                    marginBottom: '12px'
                                                }}>
                                                    {notif.message}
                                                </p>

                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontWeight: '600' }}>
                                                        <Clock size={12} />
                                                        {formatDate(notif.created_at)}
                                                    </div>

                                                    {notif.type === 'game_invitation' && !notif.read && (
                                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const groupId = notif.link?.split('group_id=')[1];
                                                                    if (groupId) handleInviteAction(notif.id, groupId, 'accepted');
                                                                }}
                                                                style={{
                                                                    flex: 1,
                                                                    background: 'var(--secondary)',
                                                                    color: 'var(--primary)',
                                                                    border: 'none',
                                                                    padding: '10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '13px',
                                                                    fontWeight: '800',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                <Check size={16} /> Aceptar
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const groupId = notif.link?.split('group_id=')[1];
                                                                    if (groupId) handleInviteAction(notif.id, groupId, 'declined');
                                                                }}
                                                                style={{
                                                                    flex: 1,
                                                                    background: 'rgba(255,255,255,0.05)',
                                                                    color: 'white',
                                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                                    padding: '10px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '13px',
                                                                    fontWeight: '800',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    gap: '6px'
                                                                }}
                                                            >
                                                                <X size={16} /> Rechazar
                                                            </button>
                                                        </div>
                                                    )}

                                                    {notif.link && notif.type !== 'game_invitation' && (
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '4px',
                                                            color: 'var(--secondary)',
                                                            fontSize: '12px',
                                                            fontWeight: '900',
                                                            textTransform: 'uppercase',
                                                            letterSpacing: '0.5px'
                                                        }}>
                                                            Detalles <ChevronRight size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Background Glows for Depth */}
                <div style={{
                    position: 'fixed',
                    top: '20%',
                    right: '-20%',
                    width: '400px',
                    height: '400px',
                    background: 'var(--secondary)',
                    filter: 'blur(150px)',
                    opacity: 0.05,
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
                <div style={{
                    position: 'fixed',
                    bottom: '10%',
                    left: '-20%',
                    width: '300px',
                    height: '300px',
                    background: '#3b82f6',
                    filter: 'blur(150px)',
                    opacity: 0.03,
                    zIndex: -1,
                    pointerEvents: 'none'
                }} />
                {/* Final del Área de Scroll */}
            </div>
        </div>
    );
};

export default NotificationsPage;
