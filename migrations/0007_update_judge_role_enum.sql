
-- Update judge_role enum to remove TECHNICAL and keep HEAD, SENSORY
-- First, update all existing TECHNICAL records to SENSORY
UPDATE heat_judges SET role = 'SENSORY' WHERE role = 'TECHNICAL';

-- Drop and recreate the enum with only HEAD and SENSORY
ALTER TYPE judge_role RENAME TO judge_role_old;
CREATE TYPE judge_role AS ENUM ('HEAD', 'SENSORY');

-- Update the table to use the new enum
ALTER TABLE heat_judges ALTER COLUMN role TYPE judge_role USING role::text::judge_role;

-- Drop the old enum
DROP TYPE judge_role_old;
