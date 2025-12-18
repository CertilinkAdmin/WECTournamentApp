-- Migration: Add performance indexes for frequently queried columns
-- These indexes optimize common query patterns and reduce response times

-- Indexes on heat_scores for batch queries
CREATE INDEX IF NOT EXISTS "heat_scores_match_id_idx" 
ON "heat_scores"("match_id");

CREATE INDEX IF NOT EXISTS "heat_scores_judge_id_idx" 
ON "heat_scores"("judge_id");

CREATE INDEX IF NOT EXISTS "heat_scores_competitor_id_idx" 
ON "heat_scores"("competitor_id");

-- Composite index for common score queries
CREATE INDEX IF NOT EXISTS "heat_scores_match_judge_idx" 
ON "heat_scores"("match_id", "judge_id");

-- Indexes on judge_detailed_scores for batch queries
CREATE INDEX IF NOT EXISTS "judge_detailed_scores_match_id_idx" 
ON "judge_detailed_scores"("match_id");

CREATE INDEX IF NOT EXISTS "judge_detailed_scores_judge_name_idx" 
ON "judge_detailed_scores"("judge_name");

-- Composite index for judge score lookups
CREATE INDEX IF NOT EXISTS "judge_detailed_scores_match_judge_idx" 
ON "judge_detailed_scores"("match_id", "judge_name");

-- Indexes on heat_judges for faster judge lookups
CREATE INDEX IF NOT EXISTS "heat_judges_match_id_idx" 
ON "heat_judges"("match_id");

CREATE INDEX IF NOT EXISTS "heat_judges_judge_id_idx" 
ON "heat_judges"("judge_id");

-- Composite index for judge assignment queries
CREATE INDEX IF NOT EXISTS "heat_judges_match_judge_idx" 
ON "heat_judges"("match_id", "judge_id");

-- Indexes on heat_segments for segment queries
CREATE INDEX IF NOT EXISTS "heat_segments_match_id_idx" 
ON "heat_segments"("match_id");

CREATE INDEX IF NOT EXISTS "heat_segments_segment_idx" 
ON "heat_segments"("segment");

-- Composite index for segment status queries
CREATE INDEX IF NOT EXISTS "heat_segments_match_segment_idx" 
ON "heat_segments"("match_id", "segment");

-- Indexes on matches for common filters
CREATE INDEX IF NOT EXISTS "matches_station_id_idx" 
ON "matches"("station_id");

CREATE INDEX IF NOT EXISTS "matches_status_idx" 
ON "matches"("status");

CREATE INDEX IF NOT EXISTS "matches_competitor1_id_idx" 
ON "matches"("competitor1_id");

CREATE INDEX IF NOT EXISTS "matches_competitor2_id_idx" 
ON "matches"("competitor2_id");

CREATE INDEX IF NOT EXISTS "matches_winner_id_idx" 
ON "matches"("winner_id");

-- Index on users for faster lookups
CREATE INDEX IF NOT EXISTS "users_email_idx" 
ON "users"("email");

CREATE INDEX IF NOT EXISTS "users_role_idx" 
ON "users"("role");

-- Index on tournament_participants for user lookups
CREATE INDEX IF NOT EXISTS "tournament_participants_user_id_idx" 
ON "tournament_participants"("user_id");

CREATE INDEX IF NOT EXISTS "tournament_participants_seed_idx" 
ON "tournament_participants"("seed");

