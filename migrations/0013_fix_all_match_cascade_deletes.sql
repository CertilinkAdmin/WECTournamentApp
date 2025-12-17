-- Migration: Fix all match foreign keys to use CASCADE delete
-- This allows matches to be deleted along with all related data

-- Fix match_cup_positions constraint
ALTER TABLE "match_cup_positions" 
DROP CONSTRAINT IF EXISTS "match_cup_positions_match_id_matches_id_fk";

ALTER TABLE "match_cup_positions" 
ADD CONSTRAINT "match_cup_positions_match_id_matches_id_fk" 
FOREIGN KEY ("match_id") 
REFERENCES "public"."matches"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix heat_judges constraint
ALTER TABLE "heat_judges" 
DROP CONSTRAINT IF EXISTS "heat_judges_match_id_matches_id_fk";

ALTER TABLE "heat_judges" 
ADD CONSTRAINT "heat_judges_match_id_matches_id_fk" 
FOREIGN KEY ("match_id") 
REFERENCES "public"."matches"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix heat_scores constraint
ALTER TABLE "heat_scores" 
DROP CONSTRAINT IF EXISTS "heat_scores_match_id_matches_id_fk";

ALTER TABLE "heat_scores" 
ADD CONSTRAINT "heat_scores_match_id_matches_id_fk" 
FOREIGN KEY ("match_id") 
REFERENCES "public"."matches"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix heat_segments constraint
ALTER TABLE "heat_segments" 
DROP CONSTRAINT IF EXISTS "heat_segments_match_id_matches_id_fk";

ALTER TABLE "heat_segments" 
ADD CONSTRAINT "heat_segments_match_id_matches_id_fk" 
FOREIGN KEY ("match_id") 
REFERENCES "public"."matches"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

-- Fix judge_detailed_scores constraint
ALTER TABLE "judge_detailed_scores" 
DROP CONSTRAINT IF EXISTS "judge_detailed_scores_match_id_matches_id_fk";

ALTER TABLE "judge_detailed_scores" 
ADD CONSTRAINT "judge_detailed_scores_match_id_matches_id_fk" 
FOREIGN KEY ("match_id") 
REFERENCES "public"."matches"("id") 
ON DELETE CASCADE 
ON UPDATE CASCADE;

