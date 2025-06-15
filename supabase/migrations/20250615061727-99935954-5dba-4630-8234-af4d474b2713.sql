
-- Create feature usage tracking table
CREATE TABLE public.feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature_name TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature_name)
);

-- Create payment records table
CREATE TABLE public.payment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_provider TEXT NOT NULL, -- 'stripe' or 'razorpay'
  payment_id TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policies for feature_usage table
CREATE POLICY "Users can view their own feature usage" 
  ON public.feature_usage 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature usage" 
  ON public.feature_usage 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature usage" 
  ON public.feature_usage 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policies for payment_records table
CREATE POLICY "Users can view their own payment records" 
  ON public.payment_records 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payment records" 
  ON public.payment_records 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create function to increment feature usage
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id UUID,
  p_feature_name TEXT
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INTEGER;
BEGIN
  -- Insert or update feature usage
  INSERT INTO public.feature_usage (user_id, feature_name, usage_count, last_used_at)
  VALUES (p_user_id, p_feature_name, 1, now())
  ON CONFLICT (user_id, feature_name) 
  DO UPDATE SET 
    usage_count = feature_usage.usage_count + 1,
    last_used_at = now(),
    updated_at = now();
  
  -- Get the current count
  SELECT usage_count INTO current_count
  FROM public.feature_usage
  WHERE user_id = p_user_id AND feature_name = p_feature_name;
  
  RETURN current_count;
END;
$$;

-- Create function to get total feature usage for a user
CREATE OR REPLACE FUNCTION public.get_total_usage(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  SELECT COALESCE(SUM(usage_count), 0) INTO total_count
  FROM public.feature_usage
  WHERE user_id = p_user_id;
  
  RETURN total_count;
END;
$$;
