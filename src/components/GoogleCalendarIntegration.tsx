
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, AlertCircle, Video, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  initializeGoogleAPI,
  authenticateGoogleCalendar,
  getUpcomingEvents,
  checkGoogleCalendarConnection,
  CalendarEvent
} from '@/services/googleCalendarService';

export const GoogleCalendarIntegration = () => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [apiInitialized, setApiInitialized] = useState(false);

  useEffect(() => {
    if (user) {
      checkConnection();
      initAPI();
    }
    // eslint-disable-next-line
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
      fetchUpcomingEvents();
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
        fetchUpcomingEvents();
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

  const fetchUpcomingEvents = async () => {
    if (!user) return;
    try {
      const events = await getUpcomingEvents(user.id, 3); // fetch next 3
      setUpcomingEvents(events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleJoinMeeting = (meetingLink: string, eventTitle: string) => {
    window.open(meetingLink, '_blank', 'noopener,noreferrer');
    toast({
      title: "Opening Meeting",
      description: `Joining ${eventTitle}`,
    });
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
              Connect your Google Calendar to see your upcoming meetings and get notifications.
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
                onClick={fetchUpcomingEvents} 
                variant="outline" 
                size="sm"
              >
                Refresh
              </Button>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-slate-800">Upcoming Meetings</h4>
              
              {upcomingEvents.length === 0 ? (
                <p className="text-sm text-slate-500">No upcoming meetings found.</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-slate-800 text-sm">
                            {event.title}
                          </h5>
                          <div className="flex items-center space-x-3 mt-1 text-xs text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span>
                              {formatTime(event.start)} - {formatTime(event.end)}
                            </span>
                            <span className="ml-2">
                              {new Date(event.start).toLocaleDateString()}
                            </span>
                            {event.location && (
                              <div className="flex items-center space-x-1">
                                <MapPin className="w-3 h-3" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                          {event.meetingLink && (
                            <div className="mt-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                                onClick={() => handleJoinMeeting(event.meetingLink!, event.title)}
                              >
                                <Video className="w-3 h-3 mr-1" />
                                Join Meeting
                                <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5" />
            <div className="text-xs text-blue-700">
              <p className="font-medium">Setup Instructions:</p>
              <p>Make sure to configure your Google Cloud OAuth credentials with your actual Client ID and add your domain to authorized origins.</p>
            </div>
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
};
