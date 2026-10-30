import { api } from '@/lib/apiClient';

export interface Notification {
  id: string;
  user_id?: string;
  project_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  is_dismissed: boolean;
  scheduled_for?: string | null;
  created_at: string;
  updated_at: string;
}

export const getNotifications = async (_userId?: string): Promise<Notification[]> => {
  try {
    return await api.get<Notification[]>('/notifications');
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const dismissNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await api.patch(`/notifications/${notificationId}/dismiss`);
    return true;
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return false;
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};
