-- Give admin privileges to the owner
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'simonsandrea1994@gmail.com'
);
