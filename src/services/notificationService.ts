
import { supabase } from '@/integrations/supabase/client';

export const getNotifications = async (userId: string) => {
    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching notifications:', error);
        return [];
    }
    return data || [];
};

export const dismissNotification = async (notificationId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true, is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error dismissing notification:', error);
        return false;
    }
    return true;
};

export const markNotificationAsRead = async (notificationId: string) => {
    const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

    if (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
    return true;
};
