-- Allow admins to insert participants manually (for managing tournaments)
DO $$ BEGIN
  CREATE POLICY "Admins insert participants"
    ON tournament_participants FOR INSERT
    WITH CHECK ( auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin') );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
