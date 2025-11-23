-- Migration: Add tournament_id to stations table for proper tournament partitioning
-- This ensures stations are properly isolated per tournament

-- Step 1: Add tournament_id column (nullable first to allow migration)
ALTER TABLE "stations" 
ADD COLUMN IF NOT EXISTS "tournament_id" integer;

-- Step 2: For existing stations, assign them to the first tournament (or most recent)
-- This is a one-time migration - new stations should always specify tournament_id
UPDATE "stations" 
SET "tournament_id" = (
  SELECT id FROM tournaments 
  ORDER BY id DESC 
  LIMIT 1
)
WHERE "tournament_id" IS NULL;

-- Step 3: Make tournament_id NOT NULL after assigning values
ALTER TABLE "stations" 
ALTER COLUMN "tournament_id" SET NOT NULL;

-- Step 4: Add foreign key constraint
ALTER TABLE "stations" 
ADD CONSTRAINT "stations_tournament_id_tournaments_id_fk" 
FOREIGN KEY ("tournament_id") 
REFERENCES "public"."tournaments"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Step 5: Create index for performance
CREATE INDEX IF NOT EXISTS "stations_tournament_id_idx" 
ON "stations"("tournament_id");

-- Step 6: Create composite index for common queries (tournament + status)
CREATE INDEX IF NOT EXISTS "stations_tournament_status_idx" 
ON "stations"("tournament_id", "status");

