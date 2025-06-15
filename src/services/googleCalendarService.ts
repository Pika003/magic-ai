import { supabase } from '@/integrations/supabase/client';

const GOOGLE_CLIENT_ID = "591673388194-dlu3uddopek8k1f0br2cnif46ohn6jiu.apps.googleusercontent.com";
const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.readonly';
const GOOGLE_DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

let gapiInited = false;
let gisInited = false;
let tokenClient: any = null;

export const initializeGoogleAPI = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Load Google Identity Services
    const gisScript = document.createElement('script');
    gisScript.src = 'https://accounts.google.com/gsi/client';
    gisScript.onload = () => {
      gisInited = true;
      checkInitialization();
    };
    gisScript.onerror = reject;
    document.head.appendChild(gisScript);

    // Load Google API client
    const gapiScript = document.createElement('script');
    gapiScript.src = 'https://apis.google.com/js/api.js';
    gapiScript.onload = () => {
      window.gapi.load('client', async () => {
        try {
          await window.gapi.client.init({
            discoveryDocs: [GOOGLE_DISCOVERY_DOC],
          });
          gapiInited = true;
          checkInitialization();
        } catch (error) {
          reject(error);
        }
      });
    };
    gapiScript.onerror = reject;
    document.head.appendChild(gapiScript);

    function checkInitialization() {
      if (gapiInited && gisInited) {
        resolve();
      }
    }
  });
};

export const authenticateGoogleCalendar = async (userId: string): Promise<{ success: boolean; error?: string }> => {
  return new Promise((resolve) => {
    try {
      console.log('Starting Google Calendar authentication for user:', userId);
      
      if (!window.google?.accounts?.oauth2) {
        console.error('Google Identity Services not loaded');
        resolve({ success: false, error: 'Google Identity Services not loaded' });
        return;
      }

      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: async (tokenResponse: any) => {
          console.log('Token response received:', tokenResponse);
          
          if (tokenResponse.error) {
            console.error('Token response error:', tokenResponse.error);
            resolve({ success: false, error: tokenResponse.error });
            return;
          }

          try {
            // Calculate expires_at (token typically expires in 1 hour)
            const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));
            
            console.log('Attempting to store tokens in database...');
            console.log('User ID:', userId);
            console.log('Expires at:', expiresAt.toISOString());

            // Store tokens in database with nullable refresh_token
            const { data, error } = await supabase
              .from('user_google_tokens')
              .upsert({
                user_id: userId,
                access_token: tokenResponse.access_token,
                refresh_token: null, // Set to null since OAuth2 flow doesn't provide it
                expires_at: expiresAt.toISOString()
              }, {
                onConflict: 'user_id'
              });

            console.log('Supabase upsert result:', { data, error });

            if (error) {
              console.error('Supabase error details:', error);
              resolve({ success: false, error: `Database error: ${error.message}` });
              return;
            }

            console.log('Tokens stored successfully');
            resolve({ success: true });
          } catch (error) {
            console.error('Error processing token:', error);
            resolve({ success: false, error: 'Failed to process authentication token' });
          }
        },
      });

      console.log('Requesting access token...');
      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Google Calendar authentication error:', error);
      resolve({ success: false, error: 'Authentication failed' });
    }
  });
};

/**
 * Fetches the next 2-3 upcoming Google Calendar events (starting from now)
 */
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

export const checkGoogleCalendarConnection = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('user_google_tokens')
      .select('expires_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      return false;
    }

    const now = new Date();
    const expiresAt = new Date(data.expires_at);
    
    return now < expiresAt;
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return false;
  }
};

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
