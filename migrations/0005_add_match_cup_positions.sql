-- Migration: Add match_cup_positions table for admin-assigned left/right positions
-- This table stores the admin's assignment of cup codes to left/right positions
-- after all judges have completed scoring

CREATE TABLE IF NOT EXISTS "match_cup_positions" (
  "id" serial PRIMARY KEY NOT NULL,
  "match_id" integer NOT NULL REFERENCES "matches"("id") ON DELETE CASCADE,
  "cup_code" text NOT NULL,
  "position" text NOT NULL CHECK ("position" IN ('left', 'right')),
  "assigned_at" timestamp DEFAULT now() NOT NULL,
  "assigned_by" integer REFERENCES "users"("id"),
  UNIQUE("match_id", "cup_code")
);

-- Index for fast lookups by match_id
CREATE INDEX IF NOT EXISTS "match_cup_positions_match_id_idx" 
ON "match_cup_positions"("match_id");

-- Index for position lookups
CREATE INDEX IF NOT EXISTS "match_cup_positions_position_idx" 
ON "match_cup_positions"("match_id", "position");

