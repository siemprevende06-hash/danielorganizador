import { useEffect, useCallback, useRef } from 'react';
export function useNotifications() {
    const permissionRef = useRef('default');
    useEffect(() => {
        if ('Notification' in window) {
            permissionRef.current = Notification.permission;
        }
    }, []);
    const requestPermission = useCallback(async () => {
        if (!('Notification' in window))
            return false;
        const perm = await Notification.requestPermission();
        permissionRef.current = perm;
        return perm === 'granted';
    }, []);
    const notify = useCallback((title, options) => {
        if (permissionRef.current === 'granted') {
            new Notification(title, { icon: '/pwa-192x192.png', ...options });
        }
    }, []);
    const scheduleBlockReminder = useCallback((blockTitle, startTime) => {
        const [h, m] = startTime.split(':').map(Number);
        const now = new Date();
        const target = new Date();
        target.setHours(h, m - 5, 0, 0); // 5 min before
        const diff = target.getTime() - now.getTime();
        if (diff > 0 && diff < 86400000) {
            setTimeout(() => {
                notify(`⏰ En 5 min: ${blockTitle}`, { body: `Tu bloque "${blockTitle}" empieza a las ${startTime}` });
            }, diff);
        }
    }, [notify]);
    return { requestPermission, notify, scheduleBlockReminder, permission: permissionRef.current };
}
