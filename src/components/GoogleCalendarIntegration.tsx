
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  initializeGoogleAPI,
  authenticateGoogleCalendar,
  getTodaysEvents,
  checkGoogleCalendarConnection,
  CalendarEvent
} from '@/services/googleCalendarService';

export const GoogleCalendarIntegration = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState<CalendarEvent[]>([]);
  const [apiInitialized, setApiInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
      initAPI();
    }
  }, [user]);

  const initAPI = async () => {
    try {
      await initializeGoogleAPI();
      setApiInitialized(true);
    } catch (error) {
      console.error('Failed to initialize Google API:', error);
      toast({
        title: "Error",
        description: "Failed to initialize Google Calendar API",
        variant: "destructive"
      });
    }
  };

  const checkConnection = async () => {
    if (!user) return;
    
    const connected = await checkGoogleCalendarConnection(user.id);
    setIsConnected(connected);
    
    if (connected) {
      fetchTodaysEvents();
    }
  };

  const connectGoogleCalendar = async () => {
    if (!user || !apiInitialized) return;

    setLoading(true);
    try {
      const result = await authenticateGoogleCalendar(user.id);
      
      if (result.success) {
        setIsConnected(true);
        toast({
          title: "Success",
          description: "Google Calendar connected successfully!"
        });
        fetchTodaysEvents();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to connect Google Calendar",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect Google Calendar",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaysEvents = async () => {
    if (!user) return;

    try {
      const events = await getTodaysEvents(user.id);
      setTodaysEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <span>Google Calendar Integration</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isConnected ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              Connect your Google Calendar to see today's meetings and get notifications.
            </p>
            <Button 
              onClick={connectGoogleCalendar} 
              disabled={loading || !apiInitialized}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {loading ? "Connecting..." : "Connect Google Calendar"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  Connected
                </Badge>
              </div>
              <Button 
                onClick={fetchTodaysEvents} 
                variant="outline" 
                size="sm"
              >
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">Today's Meetings</h4>
              
              {todaysEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No meetings scheduled for today.</p>
              ) : (
                <div className="space-y-2">
                  {todaysEvents.map((event) => (
                    <div 
                      key={event.id} 
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800 text-sm">
                            {event.title}
                          </h5>
                          <div className="flex items-center space-x-3 mt-1">
                            <div className="flex items-center space-x-1 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>
                                {formatTime(event.start)} - {formatTime(event.end)}
                              </span>
                            </div>
                            {event.location && (
                              <div className="flex items-center space-x-1 text-xs text-slate-500">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Setup Instructions:</p>
              <p>Make sure to configure your Google Cloud OAuth credentials with your actual Client ID and add your domain to authorized origins.</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
