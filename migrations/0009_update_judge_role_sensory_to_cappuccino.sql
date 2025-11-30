-- Update judge_role enum to replace SENSORY with CAPPUCCINO
-- SENSORY was used for Cappuccino judges, ESPRESSO for Espresso judges
-- All judges are sensory judges, but assigned to different segments:
-- - CAPPUCCINO: 1 judge scores Cappuccino sensory
-- - ESPRESSO: 2 judges score Espresso sensory

-- First, update all existing SENSORY records to CAPPUCCINO
UPDATE heat_judges SET role = 'CAPPUCCINO' WHERE role = 'SENSORY';

-- Drop and recreate the enum with CAPPUCCINO and ESPRESSO
ALTER TYPE judge_role RENAME TO judge_role_old;
CREATE TYPE judge_role AS ENUM ('ESPRESSO', 'CAPPUCCINO');

-- Update the table to use the new enum
ALTER TABLE heat_judges ALTER COLUMN role TYPE judge_role USING role::text::judge_role;

-- Drop the old enum
DROP TYPE judge_role_old;

