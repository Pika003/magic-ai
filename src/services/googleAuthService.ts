
import { supabase } from '@/integrations/supabase/client';
import { GOOGLE_CLIENT_ID, GOOGLE_SCOPES } from '@/constants/googleApi';
import type { GoogleAuthResult } from '@/types/googleCalendar';

let tokenClient: any = null;

export const authenticateGoogleCalendar = async (userId: string): Promise<GoogleAuthResult> => {
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
