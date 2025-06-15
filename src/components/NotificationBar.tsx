
import React, { useState, useEffect } from 'react';
import { Bell, X, Calendar, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getTodaysEvents, CalendarEvent } from '@/services/googleCalendarService';
import { Button } from '@/components/ui/button';

export const NotificationBar = () => {
  const { user } = useAuth();
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [showNotification, setShowNotification] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (user) {
      checkTodaysMeetings();
    }
  }, [user]);

  const checkTodaysMeetings = async () => {
    if (!user) return;

    try {
      const events = await getTodaysEvents(user.id);
      setTodaysEvents(events);
      
      if (events.length > 0 && !dismissed) {
        setShowNotification(true);
      }
    } catch (error) {
      console.error('Error checking today\'s meetings:', error);
    }
  };

  const dismissNotification = () => {
    setShowNotification(false);
    setDismissed(true);
  };

  const getUpcomingMeeting = () => {
    const now = new Date();
    const upcoming = todaysEvents.find(event => {
      const eventStart = new Date(event.start);
      return eventStart > now;
    });
    return upcoming || todaysEvents[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!showNotification || todaysEvents.length === 0) {
    return null;
  }

  const upcomingMeeting = getUpcomingMeeting();

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-blue-500 text-white px-4 py-2 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Bell className="w-4 h-4" />
          <div className="flex items-center space-x-2 text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              {todaysEvents.length === 1 
                ? "You have 1 meeting today" 
                : `You have ${todaysEvents.length} meetings today`}
            </span>
            {upcomingMeeting && (
              <div className="flex items-center space-x-1 ml-4">
                <Clock className="w-3 h-3" />
                <span className="font-medium">
                  Next: {upcomingMeeting.title} at {formatTime(upcomingMeeting.start)}
                </span>
              </div>
            )}
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={dismissNotification}
          className="text-white hover:bg-blue-600 h-8 w-8 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
