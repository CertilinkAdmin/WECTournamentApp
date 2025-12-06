-- Migration: Add enabled_stations column to tournaments table
-- This allows tournaments to configure which stations (A, B, C) are available
-- Defaults to ['A', 'B', 'C'] for backward compatibility

-- Step 1: Add enabled_stations column with default value
ALTER TABLE "tournaments" 
ADD COLUMN IF NOT EXISTS "enabled_stations" text[] DEFAULT ARRAY['A', 'B', 'C']::text[];

-- Step 2: Update existing tournaments to have ['A', 'B', 'C'] if NULL
UPDATE "tournaments" 
SET "enabled_stations" = ARRAY['A', 'B', 'C']::text[]
WHERE "enabled_stations" IS NULL;

-- Step 3: Make enabled_stations NOT NULL after setting defaults
ALTER TABLE "tournaments" 
ALTER COLUMN "enabled_stations" SET NOT NULL;

-- Step 4: Add constraint to ensure only valid station letters (A, B, C) are allowed
ALTER TABLE "tournaments" 
ADD CONSTRAINT "tournaments_enabled_stations_check" 
CHECK (
  "enabled_stations" <@ ARRAY['A', 'B', 'C']::text[] 
  AND array_length("enabled_stations", 1) >= 1
);

-- Step 5: Add comment for documentation
COMMENT ON COLUMN "tournaments"."enabled_stations" IS 'Array of enabled station letters (A, B, C). Must contain at least one station.';

