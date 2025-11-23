-- Migration: Add indexes on tournament_id columns for better query performance
-- These indexes ensure fast filtering by tournament_id across all tables

-- Index on tournament_participants.tournament_id
CREATE INDEX IF NOT EXISTS "tournament_participants_tournament_id_idx" 
ON "tournament_participants"("tournament_id");

-- Index on matches.tournament_id (if not exists)
CREATE INDEX IF NOT EXISTS "matches_tournament_id_idx" 
ON "matches"("tournament_id");

-- Composite index for common match queries (tournament + round)
CREATE INDEX IF NOT EXISTS "matches_tournament_round_idx" 
ON "matches"("tournament_id", "round");

-- Composite index for match status queries (tournament + status)
CREATE INDEX IF NOT EXISTS "matches_tournament_status_idx" 
ON "matches"("tournament_id", "status");

-- Index on tournament_round_times.tournament_id
CREATE INDEX IF NOT EXISTS "tournament_round_times_tournament_id_idx" 
ON "tournament_round_times"("tournament_id");

-- Composite index for round times (tournament + round)
CREATE INDEX IF NOT EXISTS "tournament_round_times_tournament_round_idx" 
ON "tournament_round_times"("tournament_id", "round");

