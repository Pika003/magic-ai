import { api } from '@/lib/apiClient';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/constants/googleApi';
import type { GoogleAuthResult } from '@/types/googleCalendar';

let tokenClient: any = null;

export const authenticateGoogleCalendar = async (_userId?: string): Promise<GoogleAuthResult> => {
  return new Promise((resolve) => {
    try {
      if (!window.google?.accounts?.oauth2) {
        console.error('Google Identity Services not loaded');
        resolve({ success: false, error: 'Google Identity Services not loaded' });
        return;
      }

      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: GOOGLE_SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token response error:', tokenResponse.error);
            resolve({ success: false, error: tokenResponse.error });
            return;
          }

          try {
            const expiresAt = new Date(Date.now() + (tokenResponse.expires_in * 1000));

            await api.post('/google/token', {
              accessToken: tokenResponse.access_token,
              expiresAt: expiresAt.toISOString(),
            });

            console.log('Google token stored successfully');
            resolve({ success: true });
          } catch (error: any) {
            console.error('Error storing Google token:', error);
            resolve({ success: false, error: error.message || 'Failed to save authentication token' });
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch (error: any) {
      console.error('Google Calendar authentication error:', error);
      resolve({ success: false, error: error.message || 'Authentication failed' });
    }
  });
};

export const checkGoogleCalendarConnection = async (_userId?: string): Promise<boolean> => {
  try {
    const data = await api.get<{ connected: boolean }>('/google/status');
    return !!data.connected;
  } catch (error) {
    console.error('Error checking Google Calendar connection:', error);
    return false;
  }
};
