
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface GoogleAuthResult {
  success: boolean;
  error?: string;
}

export interface GoogleTokenData {
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  expires_at: string;
}
