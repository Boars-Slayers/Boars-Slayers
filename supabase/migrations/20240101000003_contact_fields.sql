
-- Add contact details for recruitment
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Verify RLS ensures users can write these fields (already covered by "update own profile" policy)
