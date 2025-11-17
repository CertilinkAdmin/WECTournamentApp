-- ============================================================================
-- RESTRUCTURED SCHEMA MIGRATION
-- Two top-level classes: PERSONS and TOURNAMENTS
-- ============================================================================

-- Drop old enums if they exist (for fresh start)
DROP TYPE IF EXISTS "public"."user_role" CASCADE;

-- Create new enums
CREATE TYPE "public"."person_role" AS ENUM('JUDGE', 'BARISTA', 'VOLUNTEER', 'PARTNER');
CREATE TYPE "public"."verification_status" AS ENUM('UNVERIFIED', 'VERIFIED', 'REJECTED');

-- Keep existing enums (they're still used)
-- judge_role, match_status, segment_status, segment_type, station_status, tournament_status

-- ============================================================================
-- PERSONS - Permanent Pool (Top Level Class 1)
-- ============================================================================
CREATE TABLE "persons" (
	"id" serial PRIMARY KEY NOT NULL,
	"external_profile_id" text UNIQUE,
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- TOURNAMENTS - Tournament Hierarchy (Top Level Class 2)
-- ============================================================================
-- Tournament ID is composite: location + year (e.g., "WEC2025")
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text NOT NULL,
	"year" integer NOT NULL,
	"status" "tournament_status" DEFAULT 'SETUP' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"total_rounds" integer DEFAULT 5 NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- TOURNAMENT REGISTRATIONS - Links Persons to Tournaments
-- ============================================================================
CREATE TABLE "tournament_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"person_id" integer NOT NULL,
	"role" "person_role" NOT NULL,
	"verification_status" "verification_status" DEFAULT 'UNVERIFIED' NOT NULL,
	"seed" integer,
	"eliminated_round" integer,
	"final_rank" integer,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"verified_at" timestamp,
	"verified_by" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- TOURNAMENT ROUND TIMES
-- ============================================================================
CREATE TABLE "tournament_round_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"round" integer NOT NULL,
	"dial_in_minutes" integer DEFAULT 2 NOT NULL,
	"cappuccino_minutes" integer DEFAULT 2 NOT NULL,
	"espresso_minutes" integer DEFAULT 1 NOT NULL,
	"total_minutes" integer DEFAULT 5 NOT NULL
);

-- ============================================================================
-- STATIONS - Tournament-specific stations (A, B, C for data grouping)
-- ============================================================================
CREATE TABLE "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "station_status" DEFAULT 'AVAILABLE' NOT NULL,
	"next_available_at" timestamp DEFAULT now() NOT NULL,
	"current_match_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- MATCHES (HEATS) - Individual matches within rounds
-- ============================================================================
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" text NOT NULL,
	"round" integer NOT NULL,
	"heat_number" integer NOT NULL,
	"station_id" integer,
	"status" "match_status" DEFAULT 'PENDING' NOT NULL,
	"competitor1_registration_id" integer,
	"competitor2_registration_id" integer,
	"winner_registration_id" integer,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- HEAT SEGMENTS
-- ============================================================================
CREATE TABLE "heat_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"segment" "segment_type" NOT NULL,
	"status" "segment_status" DEFAULT 'IDLE' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"planned_minutes" integer NOT NULL
);

-- ============================================================================
-- HEAT JUDGES - Judge assignments to matches
-- ============================================================================
CREATE TABLE "heat_judges" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"judge_registration_id" integer NOT NULL,
	"role" "judge_role" NOT NULL
);

-- ============================================================================
-- HEAT SCORES - Scoring records for matches
-- ============================================================================
CREATE TABLE "heat_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"judge_registration_id" integer NOT NULL,
	"competitor_registration_id" integer NOT NULL,
	"segment" "segment_type" NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- DETAILED JUDGE SCORECARDS (cup-based scoring)
-- ============================================================================
CREATE TABLE "judge_detailed_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"judge_name" text NOT NULL,
	"left_cup_code" text NOT NULL,
	"right_cup_code" text NOT NULL,
	"sensory_beverage" text NOT NULL,
	"visual_latte_art" text NOT NULL,
	"taste" text NOT NULL,
	"tactile" text NOT NULL,
	"flavour" text NOT NULL,
	"overall" text NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Tournament Registrations
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_tournament_id_tournaments_id_fk" 
	FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_person_id_persons_id_fk" 
	FOREIGN KEY ("person_id") REFERENCES "public"."persons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "tournament_registrations" ADD CONSTRAINT "tournament_registrations_verified_by_persons_id_fk" 
	FOREIGN KEY ("verified_by") REFERENCES "public"."persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Tournament Round Times
ALTER TABLE "tournament_round_times" ADD CONSTRAINT "tournament_round_times_tournament_id_tournaments_id_fk" 
	FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Stations
ALTER TABLE "stations" ADD CONSTRAINT "stations_tournament_id_tournaments_id_fk" 
	FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "stations" ADD CONSTRAINT "stations_current_match_id_matches_id_fk" 
	FOREIGN KEY ("current_match_id") REFERENCES "public"."matches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Matches
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" 
	FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_station_id_stations_id_fk" 
	FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitor1_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("competitor1_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitor2_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("competitor2_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("winner_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Heat Segments
ALTER TABLE "heat_segments" ADD CONSTRAINT "heat_segments_match_id_matches_id_fk" 
	FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Heat Judges
ALTER TABLE "heat_judges" ADD CONSTRAINT "heat_judges_match_id_matches_id_fk" 
	FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "heat_judges" ADD CONSTRAINT "heat_judges_judge_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("judge_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Heat Scores
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_match_id_matches_id_fk" 
	FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_judge_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("judge_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_competitor_registration_id_tournament_registrations_id_fk" 
	FOREIGN KEY ("competitor_registration_id") REFERENCES "public"."tournament_registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Judge Detailed Scores
ALTER TABLE "judge_detailed_scores" ADD CONSTRAINT "judge_detailed_scores_match_id_matches_id_fk" 
	FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- INDEXES for Performance
-- ============================================================================

-- Persons
CREATE INDEX "persons_external_profile_id_idx" ON "persons"("external_profile_id");
CREATE INDEX "persons_email_idx" ON "persons"("email");

-- Tournament Registrations
CREATE INDEX "tournament_registrations_tournament_id_idx" ON "tournament_registrations"("tournament_id");
CREATE INDEX "tournament_registrations_person_id_idx" ON "tournament_registrations"("person_id");
CREATE INDEX "tournament_registrations_role_idx" ON "tournament_registrations"("role");
CREATE INDEX "tournament_registrations_verification_status_idx" ON "tournament_registrations"("verification_status");
CREATE UNIQUE INDEX "tournament_registrations_tournament_person_role_unique" ON "tournament_registrations"("tournament_id", "person_id", "role");

-- Matches
CREATE INDEX "matches_tournament_id_idx" ON "matches"("tournament_id");
CREATE INDEX "matches_round_idx" ON "matches"("tournament_id", "round");
CREATE INDEX "matches_station_id_idx" ON "matches"("station_id");

-- Stations
CREATE INDEX "stations_tournament_id_idx" ON "stations"("tournament_id");

