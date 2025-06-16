
-- Create table to store user structure templates
CREATE TABLE public.structure_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  template_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.structure_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for structure templates
CREATE POLICY "Users can view their own structure templates" 
  ON public.structure_templates 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own structure templates" 
  ON public.structure_templates 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own structure templates" 
  ON public.structure_templates 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own structure templates" 
  ON public.structure_templates 
  FOR DELETE 
  USING (auth.uid() = user_id);
