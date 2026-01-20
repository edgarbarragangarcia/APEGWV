import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/SupabaseManager';
import type { Notification } from '../services/SupabaseManager';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read'>) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const fetchNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (!error && data) {
            setNotifications(data);
        }
    };

    useEffect(() => {
        let channel: any = null;

        const initNotifications = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                fetchNotifications();
                setupRealtime(session.user.id);
            }
        };

        const setupRealtime = (userId: string) => {
            if (channel) supabase.removeChannel(channel);

            channel = supabase
                .channel(`notifications:${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        if (payload.eventType === 'INSERT') {
                            setNotifications(prev => [payload.new as Notification, ...prev]);
                        } else if (payload.eventType === 'UPDATE') {
                            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                        } else if (payload.eventType === 'DELETE') {
                            setNotifications(prev => prev.filter(n => n.id === payload.old.id));
                        }
                    }
                )
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        console.log('Notificaciones conectadas');
                    } else if (status === 'CHANNEL_ERROR') {
                        console.error('Error en conexión de notificaciones');
                    } else if (status === 'CLOSED') {
                        console.log('Conexión de notificaciones cerrada');
                    }
                });
        };

        initNotifications();

        // Listen for auth changes to re-setup or cleanup
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                fetchNotifications();
                setupRealtime(session.user.id);
            } else if (event === 'SIGNED_OUT') {
                setNotifications([]);
                if (channel) {
                    supabase.removeChannel(channel);
                    channel = null;
                }
            }
        });

        return () => {
            subscription.unsubscribe();
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, []);

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        }
    };

    const markAllAsRead = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', session.user.id)
            .eq('read', false);

        if (!error) {
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        }
    };

    const addNotification = async (notificationData: Omit<Notification, 'id' | 'created_at' | 'read'>) => {
        await supabase
            .from('notifications')
            .insert(notificationData);
        // Real-time listener will take care of updating state
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            addNotification
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
