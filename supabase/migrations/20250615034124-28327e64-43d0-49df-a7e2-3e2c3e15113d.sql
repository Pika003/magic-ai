
-- Create table to store Google Calendar tokens
CREATE TABLE public.user_google_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(user_id)
);

-- Enable RLS on user_google_tokens
ALTER TABLE public.user_google_tokens ENABLE ROW LEVEL SECURITY;

-- User google tokens policies
CREATE POLICY "Users can manage their own google tokens" 
  ON public.user_google_tokens 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create table for calendar events cache
CREATE TABLE public.user_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (id),
  UNIQUE(user_id, event_id)
);

-- Enable RLS on user_calendar_events
ALTER TABLE public.user_calendar_events ENABLE ROW LEVEL SECURITY;

-- User calendar events policies
CREATE POLICY "Users can manage their own calendar events" 
  ON public.user_calendar_events 
  FOR ALL 
  USING (auth.uid() = user_id);
