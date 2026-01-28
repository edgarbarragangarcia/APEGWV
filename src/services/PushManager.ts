import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from './SupabaseManager';

export const setupPushNotifications = async (userId: string) => {
    if (Capacitor.getPlatform() === 'web') {
        console.log('Push notifications not supported on web');
        return;
    }

    // Request permission to use push notifications
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
        const hasAskedThisSession = sessionStorage.getItem('pushed_asked');
        if (hasAskedThisSession) return;

        permStatus = await PushNotifications.requestPermissions();
        sessionStorage.setItem('pushed_asked', 'true');
    }

    if (permStatus.receive !== 'granted') {
        throw new Error('User denied permissions!');
    }

    // Register with Apple / Google to receive push via APNS/FCM
    await PushNotifications.register();

    // On success, we should be able to receive an FCM token
    PushNotifications.addListener('registration', async (token) => {
        console.log('Push registration success, token: ' + token.value);

        // Save token to Supabase profile
        const { error } = await supabase
            .from('profiles')
            .update({ push_token: token.value } as any)
            .eq('id', userId);

        if (error) {
            console.error('Error saving push token to profile:', error);
        }
    });

    // Some registration error occurred
    PushNotifications.addListener('registrationError', (error: any) => {
        console.error('Error on registration: ' + JSON.stringify(error));
    });

    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('Push received: ' + JSON.stringify(notification));
    });

    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
        console.log('Push action performed: ' + JSON.stringify(notification));
    });
};
