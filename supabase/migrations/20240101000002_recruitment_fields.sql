
-- Update profiles table with recruitment fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS aoe_insights_url TEXT,
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS accepted_rules BOOLEAN DEFAULT FALSE;

-- The steam_id column already exists from previous steps, but let's ensure it's there
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS steam_id TEXT;

-- Update RLS for profiles to allow users to update their own application data
CREATE POLICY "Users can update their own application"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);
