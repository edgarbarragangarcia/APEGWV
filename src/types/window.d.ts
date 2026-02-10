interface Window {
    iOSNative?: {
        // Notifications
        requestNotifications: () => Promise<any>;
        getDeviceToken: () => string | null;

        // OCR
        startOCR?: () => Promise<{
            number?: string;
            expiry?: string;
            name?: string;
        }>;

        // Permissions
        getStatuses?: () => void;
        requestPermission?: (type: string) => void;
        requestAll?: () => void;
        openSettings?: () => void;

        // Sensors
        startSensors?: (interval?: number) => void;
        stopSensors?: () => void;
    };

    iOSPermissionStatuses?: {
        notifications?: string;
        deviceToken?: string;
        location?: string;
        camera?: string;
        microphone?: string;
    };

    // Event handlers called by native code
    onPermissionUpdate?: (statuses: any) => void;
    onNotificationPermissionResult?: (granted: boolean) => void;
    onOCRResult?: (data: any) => void;
    onOCRError?: (error: any) => void;
}
