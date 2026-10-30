import { api } from '@/lib/apiClient';
import type { CalendarEvent } from '@/types/googleCalendar';

// Helper function to extract meeting link from various sources
const extractMeetingLink = (event: any): string | undefined => {
  if (event.conferenceData?.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find((entry: any) => entry.entryPointType === 'video');
    if (videoEntry?.uri) {
      return videoEntry.uri;
    }
  }

  const description = event.description || '';
  const meetingLinkPatterns = [
    /https:\/\/meet\.google\.com\/[a-z-]+/i,
    /https:\/\/zoom\.us\/j\/\d+/i,
    /https:\/\/teams\.microsoft\.com\/l\/meetup-join\/[^\s]+/i,
    /https:\/\/[^\s]*\.zoom\.us\/[^\s]*/i,
  ];

  for (const pattern of meetingLinkPatterns) {
    const match = description.match(pattern);
    if (match) {
      return match[0];
    }
  }

  const location = event.location || '';
  for (const pattern of meetingLinkPatterns) {
    const match = location.match(pattern);
    if (match) {
      return match[0];
    }
  }

  return undefined;
};

export const getUpcomingEvents = async (_userId?: string, limit = 3): Promise<CalendarEvent[]> => {
  try {
    const tokenData = await api.get<{ accessToken: string; expiresAt: string }>('/google/token');
    if (!tokenData || !tokenData.accessToken) return [];

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    if (now >= expiresAt) return [];

    if (!window.gapi?.client) return [];

    window.gapi.client.setToken({
      access_token: tokenData.accessToken,
    });

    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      maxResults: limit,
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    } as any);

    const events: CalendarEvent[] = response.result.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || '',
      meetingLink: extractMeetingLink(event),
    })) || [];

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};

export const getTodaysEvents = async (_userId?: string): Promise<CalendarEvent[]> => {
  try {
    const tokenData = await api.get<{ accessToken: string; expiresAt: string }>('/google/token');
    if (!tokenData || !tokenData.accessToken) return [];

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    if (now >= expiresAt) return [];

    if (!window.gapi?.client) return [];

    window.gapi.client.setToken({
      access_token: tokenData.accessToken,
    });

    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const response = await window.gapi.client.calendar.events.list({
      calendarId: 'primary',
      timeMin: startOfDay.toISOString(),
      timeMax: endOfDay.toISOString(),
      showDeleted: false,
      singleEvents: true,
      orderBy: 'startTime',
    } as any);

    const events: CalendarEvent[] = response.result.items?.map((event: any) => ({
      id: event.id,
      title: event.summary || 'No title',
      start: event.start?.dateTime || event.start?.date || '',
      end: event.end?.dateTime || event.end?.date || '',
      description: event.description || '',
      location: event.location || '',
      meetingLink: extractMeetingLink(event),
    })) || [];

    if (events.length > 0) {
      await api.post('/google/sync-events', { events }).catch((e) => {
        console.error('Failed to sync events to database:', e);
      });
    }

    return events;
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return [];
  }
};
