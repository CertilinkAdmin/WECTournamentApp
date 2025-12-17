-- Migration: Fix stations foreign key to use CASCADE delete
-- This allows tournaments to be deleted along with their stations

-- Drop the existing constraint
ALTER TABLE "stations" 
DROP CONSTRAINT IF EXISTS "stations_tournament_id_tournaments_id_fk";

-- Recreate the constraint with CASCADE delete
ALTER TABLE "stations" 
ADD CONSTRAINT "stations_tournament_id_tournaments_id_fk" 
FOREIGN KEY ("tournament_id") 
REFERENCES "public"."tournaments"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

