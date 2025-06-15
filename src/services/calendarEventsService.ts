
import { supabase } from '@/integrations/supabase/client';
import type { CalendarEvent } from '@/types/googleCalendar';

export const getUpcomingEvents = async (userId: string, limit = 3): Promise<CalendarEvent[]> => {
  try {
    console.log('Fetching upcoming events for user:', userId);
    
    // Get stored tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error('No Google tokens found:', tokenError);
      return [];
    }

    console.log('Token data retrieved:', { expires_at: tokenData.expires_at });

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now >= expiresAt) {
      console.log('Token expired, need to re-authenticate');
      return [];
    }

    // Set the access token for gapi client
    window.gapi.client.setToken({
      access_token: tokenData.access_token
    });

    console.log('Making calendar API request...');

    // TimeMin is now; fetch upcoming
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      maxResults: limit,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    } as any);

    console.log('Calendar API response:', response);

    const events: CalendarEvent[] = response.result.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || ''
    })) || [];

    console.log('Processed events:', events);
    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

export const getTodaysEvents = async (userId: string): Promise<CalendarEvent[]> => {
  try {
    // Get stored tokens
    const { data: tokenData, error: tokenError } = await supabase
      .from('user_google_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (tokenError || !tokenData) {
      console.error('No Google tokens found');
      return [];
    }

    // Check if token is expired
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);
    
    if (now >= expiresAt) {
      console.log('Token expired, need to re-authenticate');
      return [];
    }

    // Set the access token for gapi client
    window.gapi.client.setToken({
      access_token: tokenData.access_token
    });

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch events from Google Calendar API
    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime'
    } as any);

    const events: CalendarEvent[] = response.result.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || ''
    })) || [];

    // Cache events in database
    if (events.length > 0) {
      const eventData = events.map(event => ({
        user_id: userId,
        event_id: event.id,
        title: event.title,
        start_time: event.start,
        end_time: event.end,
        description: event.description,
        location: event.location
      }));

      await supabase
        .from('user_calendar_events')
        .upsert(eventData);

      const notificationsData = events.map(event => ({
        user_id: userId,
        type: 'meeting' as const,
        title: `${event.title}`,
        message: `Today at ${new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
        scheduled_for: event.start,
      }));

      // delete old meeting notifications for today to avoid duplicates
      const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .eq('type', 'meeting')
          .gte('scheduled_for', startOfDay.toISOString())
          .lte('scheduled_for', endOfDay.toISOString());

      if (deleteError) {
          console.error('Error deleting old meeting notifications:', deleteError);
      }
      
      const { error: notificationError } = await supabase
          .from('notifications')
          .insert(notificationsData);

      if (notificationError) {
          console.error('Error creating meeting notifications:', notificationError);
      }
    }

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};
