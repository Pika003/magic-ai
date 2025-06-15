
-- 1. Add a reset_date column to track last reset per user in feature_usage (nullable for backward compatibility)
ALTER TABLE public.feature_usage ADD COLUMN IF NOT EXISTS reset_date DATE;

-- 2. Add paid_user column to profiles to track unlimited upgrade status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paid_user BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Function to monthly reset usage for free users (not paid_user)
CREATE OR REPLACE FUNCTION public.reset_feature_usage_monthly()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  today DATE := current_date;
BEGIN
  -- Reset usage for all non-paid users whose reset_date is not today/month or is null
  UPDATE public.feature_usage
  SET usage_count = 0,
      reset_date = today,
      updated_at = now()
  WHERE user_id IN (
    SELECT id FROM public.profiles WHERE paid_user = FALSE
  ) AND (reset_date IS NULL OR date_trunc('month', reset_date) < date_trunc('month', today));
END;
$$;

-- 4. (Recommended) Call this function monthly through pg_cron or manually if pg_cron unavailable

-- 5. Optional: Add an index for usage tracking performance
CREATE INDEX IF NOT EXISTS idx_feature_usage_user_id ON public.feature_usage (user_id);

