
-- Make refresh_token nullable since Google OAuth2 doesn't always provide it in browser flows
ALTER TABLE public.user_google_tokens 
ALTER COLUMN refresh_token DROP NOT NULL;
