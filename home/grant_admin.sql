-- Give admin permissions to "El Piojo Karateka"
-- Assumes the username is "El Piojo Karateka". 
-- If the username is different (e.g. case sensitive), please adjust accordingly.

UPDATE profiles
SET role = 'admin'
WHERE username = 'El Piojo Karateka';
