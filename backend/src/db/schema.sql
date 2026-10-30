-- ============================================================
--  Magic AI – Database Schema (Node.js + PostgreSQL version)
--  Run this against a fresh PostgreSQL database.
--  Replaces Supabase auth.users with public.users.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Users (replaces Supabase auth.users) ───────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT        UNIQUE NOT NULL,
  password_hash TEXT        NOT NULL,
  full_name     TEXT,
  username      TEXT        UNIQUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  paid_user   BOOLEAN     NOT NULL DEFAULT false,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── User Secrets (API keys stored by user) ──────────────────
CREATE TABLE IF NOT EXISTS public.user_secrets (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  secret_name  TEXT        NOT NULL,
  secret_value TEXT        NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, secret_name)
);

-- ─── Projects ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.projects (
  id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name                  TEXT        NOT NULL,
  description           TEXT,
  status                TEXT        NOT NULL DEFAULT 'active',
  client_name           TEXT,
  client_email          TEXT,
  last_update_sent      TIMESTAMPTZ,
  update_frequency_days INTEGER,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Notifications ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id    UUID        REFERENCES public.projects(id) ON DELETE SET NULL,
  title         TEXT        NOT NULL,
  message       TEXT        NOT NULL,
  type          TEXT        NOT NULL DEFAULT 'info',
  is_read       BOOLEAN     NOT NULL DEFAULT false,
  is_dismissed  BOOLEAN     NOT NULL DEFAULT false,
  scheduled_for TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Feature Usage ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_name TEXT        NOT NULL,
  usage_count  INTEGER     NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reset_date   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- ─── Payment Records ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.payment_records (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  payment_provider TEXT        NOT NULL,
  payment_id       TEXT        NOT NULL,
  amount           NUMERIC     NOT NULL,
  currency         TEXT        NOT NULL DEFAULT 'USD',
  status           TEXT        NOT NULL DEFAULT 'pending',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Structure Templates ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.structure_templates (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name             TEXT        NOT NULL,
  template_content TEXT        NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── GitHub Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_github_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  token_type    TEXT,
  scope         TEXT,
  expires_at    TIMESTAMPTZ,
  connected     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── GitLab Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_gitlab_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  token_type    TEXT,
  scope         TEXT,
  expires_at    TIMESTAMPTZ,
  connected     BOOLEAN     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Google Tokens ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_google_tokens (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  access_token  TEXT        NOT NULL,
  refresh_token TEXT,
  expires_at    TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Calendar Events ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_calendar_events (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id    TEXT        NOT NULL,
  title       TEXT        NOT NULL,
  description TEXT,
  start_time  TIMESTAMPTZ NOT NULL,
  end_time    TIMESTAMPTZ NOT NULL,
  location    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
--  PostgreSQL Functions
-- ============================================================

-- Increment usage count for a feature (upsert)
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id    UUID,
  p_feature_name TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_reset_date TIMESTAMPTZ;
BEGIN
  -- Calculate next month's reset date if not set
  v_reset_date := date_trunc('month', now()) + INTERVAL '1 month';

  INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at, reset_date)
  VALUES (p_user_id, p_feature_name, 1, now(), v_reset_date)
  ON CONFLICT (user_id, feature_name)
  DO UPDATE SET
    usage_count  = feature_usage.usage_count + 1,
    last_used_at = now(),
    updated_at   = now()
  RETURNING usage_count INTO v_count;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Get total usage for a user across all features
CREATE OR REPLACE FUNCTION public.get_total_usage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_total INTEGER;
BEGIN
  SELECT COALESCE(SUM(usage_count), 0)
  INTO v_total
  FROM public.feature_usage
  WHERE user_id = p_user_id;

  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Reset feature usage monthly (call via cron / scheduled job)
CREATE OR REPLACE FUNCTION public.reset_feature_usage_monthly()
RETURNS VOID AS $$
BEGIN
  UPDATE public.feature_usage
  SET usage_count = 0,
      reset_date  = date_trunc('month', now()) + INTERVAL '1 month',
      updated_at  = now()
  WHERE reset_date <= now();
END;
$$ LANGUAGE plpgsql;

-- Auto-generate project update notifications
CREATE OR REPLACE FUNCTION public.generate_project_update_notifications()
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.notifications (user_id, project_id, title, message, type)
  SELECT
    p.user_id,
    p.id,
    'Project Update Reminder',
    'Time to send a client update for project: ' || p.name,
    'reminder'
  FROM public.projects p
  WHERE p.update_frequency_days IS NOT NULL
    AND p.client_email IS NOT NULL
    AND (
      p.last_update_sent IS NULL
      OR p.last_update_sent + (p.update_frequency_days || ' days')::INTERVAL <= now()
    );
END;
$$ LANGUAGE plpgsql;
