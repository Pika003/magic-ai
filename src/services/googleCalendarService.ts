
// Re-export everything from the refactored modules for backward compatibility
export type { CalendarEvent, GoogleAuthResult } from '@/types/googleCalendar';
export { initializeGoogleAPI } from '@/utils/googleApiInitializer';
export { 
  authenticateGoogleCalendar, 
  checkGoogleCalendarConnection 
} from '@/services/googleAuthService';
export { 
  getUpcomingEvents, 
  getTodaysEvents 
} from '@/services/calendarEventsService';
export { 
  getNotifications, 
  dismissNotification, 
  markNotificationAsRead 
} from '@/services/notificationService';
