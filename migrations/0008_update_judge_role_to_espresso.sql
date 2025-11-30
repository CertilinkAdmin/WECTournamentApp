-- Update judge_role enum to replace HEAD with ESPRESSO
-- HEAD was used for Espresso judges, SENSORY for Cappuccino judges
-- All judges are sensory judges, but assigned to different segments:
-- - SENSORY: 1 judge scores Cappuccino sensory
-- - ESPRESSO: 2 judges score Espresso sensory

-- First, update all existing HEAD records to ESPRESSO
UPDATE heat_judges SET role = 'ESPRESSO' WHERE role = 'HEAD';

-- Drop and recreate the enum with ESPRESSO and SENSORY
ALTER TYPE judge_role RENAME TO judge_role_old;
CREATE TYPE judge_role AS ENUM ('ESPRESSO', 'SENSORY');

-- Update the table to use the new enum
ALTER TABLE heat_judges ALTER COLUMN role TYPE judge_role USING role::text::judge_role;

-- Drop the old enum
DROP TYPE judge_role_old;

