-- Fix permissions for Web Master to full control over roles, badges, and user assignments.
-- Also reinforces match permissions.

-- 1. CLAN_ROLES
DROP POLICY IF EXISTS "Web Masters can manage clan_roles" ON clan_roles;
CREATE POLICY "Web Masters can manage clan_roles"
ON clan_roles
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 2. USER_ROLES
DROP POLICY IF EXISTS "Web Masters can manage user_roles" ON user_roles;
CREATE POLICY "Web Masters can manage user_roles"
ON user_roles
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 3. BADGES
DROP POLICY IF EXISTS "Web Masters can manage badges" ON badges;
CREATE POLICY "Web Masters can manage badges"
ON badges
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 4. USER_BADGES
DROP POLICY IF EXISTS "Web Masters can manage user_badges" ON user_badges;
CREATE POLICY "Web Masters can manage user_badges"
ON user_badges
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 5. MATCHES (Re-affirming permissions)
DROP POLICY IF EXISTS "Web Masters can all matches" ON matches;
CREATE POLICY "Web Masters can all matches"
ON matches
FOR ALL
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

-- 6. STORAGE (Badges)
-- Add policies for web_master on 'badges' bucket
CREATE POLICY "Web Master Upload Badges"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'badges' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

CREATE POLICY "Web Master Update Badges"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'badges' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);

CREATE POLICY "Web Master Delete Badges"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'badges' AND
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'web_master')
);
