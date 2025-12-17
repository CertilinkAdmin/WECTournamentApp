-- Migration: Fix all tournament foreign keys to use CASCADE delete
-- This allows tournaments to be deleted along with all related data

-- Fix matches constraint
ALTER TABLE "matches" 
DROP CONSTRAINT IF EXISTS "matches_tournament_id_tournaments_id_fk";

ALTER TABLE "matches" 
ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" 
FOREIGN KEY ("tournament_id") 
REFERENCES "public"."tournaments"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix tournament_participants constraint
ALTER TABLE "tournament_participants" 
DROP CONSTRAINT IF EXISTS "tournament_participants_tournament_id_tournaments_id_fk";

ALTER TABLE "tournament_participants" 
ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" 
FOREIGN KEY ("tournament_id") 
REFERENCES "public"."tournaments"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix tournament_round_times constraint
ALTER TABLE "tournament_round_times" 
DROP CONSTRAINT IF EXISTS "tournament_round_times_tournament_id_tournaments_id_fk";

ALTER TABLE "tournament_round_times" 
ADD CONSTRAINT "tournament_round_times_tournament_id_tournaments_id_fk" 
FOREIGN KEY ("tournament_id") 
REFERENCES "public"."tournaments"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

