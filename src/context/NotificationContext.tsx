import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/SupabaseManager';
import type { Notification } from '../services/SupabaseManager';

// Declare iOS Native API
declare global {
    interface Window {
        iOSNative?: {
            requestNotifications: () => Promise<any>;
            getDeviceToken: () => string | null;
        };
        iOSPermissionStatuses?: {
            notifications?: string;
            deviceToken?: string;
        };
    }
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    deleteAllNotifications: () => Promise<void>;
    addNotification: (notification: Omit<Notification, 'id' | 'created_at' | 'read' | 'user_id'>) => Promise<void>;
    pushNotificationsEnabled: boolean;
    requestPushPermission: () => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(false);

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
            setNotifications(data as Notification[]);
        }
    };

    // Save device token to Supabase
    const saveDeviceToken = async (token: string) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        try {
            const { error } = await supabase
                .from('device_tokens')
                .upsert({
                    user_id: session.user.id,
                    token: token,
                    platform: 'ios',
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'token'
                });

            if (error) {
                console.error('Error saving device token:', error);
            } else {
                console.log('✅ Device token saved to Supabase');
            }
        } catch (err) {
            console.error('Error in saveDeviceToken:', err);
        }
    };

    // Request push notification permission
    const requestPushPermission = async (): Promise<boolean> => {
        if (!window.iOSNative?.requestNotifications) {
            console.log('iOS Native API not available');
            return false;
        }

        try {
            const statuses = await window.iOSNative.requestNotifications();
            const granted = statuses.notifications === 'authorized';
            setPushNotificationsEnabled(granted);

            if (granted && statuses.deviceToken) {
                await saveDeviceToken(statuses.deviceToken);
            }

            return granted;
        } catch (error) {
            console.error('Error requesting push notifications:', error);
            return false;
        }
    };

    // Initialize push notifications automatically
    useEffect(() => {
        const initPushNotifications = async () => {
            // Check if we're in iOS
            if (!window.iOSNative) return;

            // Wait a bit for auth to be ready
            await new Promise(resolve => setTimeout(resolve, 1000));

            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            // Check current status
            const currentStatus = window.iOSPermissionStatuses?.notifications;

            if (currentStatus === 'notDetermined') {
                // Auto-request permission
                console.log('🔔 Auto-requesting push notification permission...');
                await requestPushPermission();
            } else if (currentStatus === 'authorized') {
                setPushNotificationsEnabled(true);
                const token = window.iOSNative.getDeviceToken?.();
                if (token) {
                    await saveDeviceToken(token);
                }
            }
        };

        initPushNotifications();
    }, []);

    // Listen for iOS push notifications
    useEffect(() => {
        const handleIOSNotification = (event: CustomEvent) => {
            console.log('🔔 iOS Push Notification received:', event.detail);

            // Fetch fresh notifications from Supabase
            // (The backend should have already created the notification)
            fetchNotifications();
        };

        window.addEventListener('iosNotificationReceived', handleIOSNotification as EventListener);

        return () => {
            window.removeEventListener('iosNotificationReceived', handleIOSNotification as EventListener);
        };
    }, []);

    // Listen for permission updates
    useEffect(() => {
        const handlePermissionUpdate = (event: CustomEvent) => {
            const statuses = event.detail;
            if (statuses.notifications) {
                setPushNotificationsEnabled(statuses.notifications === 'authorized');

                // Save token if newly authorized
                if (statuses.notifications === 'authorized' && statuses.deviceToken) {
                    saveDeviceToken(statuses.deviceToken);
                }
            }
        };

        window.addEventListener('iosPermissionsUpdated', handlePermissionUpdate as EventListener);

        return () => {
            window.removeEventListener('iosPermissionsUpdated', handlePermissionUpdate as EventListener);
        };
    }, []);

    useEffect(() => {
        let channel: any = null;

        const subscribe = (userId: string) => {
            if (channel) {
                supabase.removeChannel(channel);
            }

            channel = supabase
                .channel(`notifications-realtime-${userId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'notifications',
                        filter: `user_id=eq.${userId}`
                    },
                    (payload) => {
                        console.log('🔔 Notificación en tiempo real:', payload);
                        if (payload.eventType === 'INSERT') {
                            setNotifications(prev => [payload.new as Notification, ...prev]);
                        } else if (payload.eventType === 'UPDATE') {
                            setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                        } else if (payload.eventType === 'DELETE') {
                            setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
                        }
                    }
                )
                .subscribe((status) => {
                    console.log(`🔔 Notificaciones Status (${userId}):`, status);
                });
        };

        // Check current session on mount
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                console.log('🔔 Notificaciones: Sesión detectada al montar');
                fetchNotifications();
                subscribe(session.user.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log('🔔 Auth Event:', event);
            if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
                fetchNotifications();
                subscribe(session.user.id);

                // Check for pending device token
                if (window.iOSPermissionStatuses?.deviceToken) {
                    console.log('🔔 Found pending device token on login, saving...');
                    saveDeviceToken(window.iOSPermissionStatuses.deviceToken);
                } else if (window.iOSNative?.getDeviceToken) {
                    const token = window.iOSNative.getDeviceToken();
                    if (token) {
                        console.log('🔔 Found pending device token (via getter) on login, saving...');
                        saveDeviceToken(token);
                    }
                }
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

    const deleteNotification = async (id: string) => {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', id);

        if (!error) {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }
    };

    const deleteAllNotifications = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', session.user.id);

        if (!error) {
            setNotifications([]);
        }
    };

    const addNotification = async (notificationData: Omit<Notification, 'id' | 'created_at' | 'read' | 'user_id'>) => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        await supabase
            .from('notifications')
            .insert({
                ...notificationData,
                read: false,
                user_id: session.user.id
            });
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            markAsRead,
            markAllAsRead,
            deleteNotification,
            deleteAllNotifications,
            addNotification,
            pushNotificationsEnabled,
            requestPushPermission
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
