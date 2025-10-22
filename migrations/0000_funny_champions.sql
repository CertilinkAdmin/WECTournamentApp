CREATE TYPE "public"."judge_role" AS ENUM('HEAD', 'TECHNICAL', 'SENSORY');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('PENDING', 'READY', 'RUNNING', 'DONE');--> statement-breakpoint
CREATE TYPE "public"."segment_status" AS ENUM('IDLE', 'RUNNING', 'ENDED');--> statement-breakpoint
CREATE TYPE "public"."segment_type" AS ENUM('DIAL_IN', 'CAPPUCCINO', 'ESPRESSO');--> statement-breakpoint
CREATE TYPE "public"."station_status" AS ENUM('AVAILABLE', 'BUSY', 'OFFLINE');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('ADMIN', 'JUDGE', 'BARISTA', 'STATION_LEAD');--> statement-breakpoint
CREATE TABLE "heat_judges" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"judge_id" integer NOT NULL,
	"role" "judge_role" NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heat_scores" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"judge_id" integer NOT NULL,
	"competitor_id" integer NOT NULL,
	"segment" "segment_type" NOT NULL,
	"score" integer NOT NULL,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "heat_segments" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" integer NOT NULL,
	"segment" "segment_type" NOT NULL,
	"status" "segment_status" DEFAULT 'IDLE' NOT NULL,
	"start_time" timestamp,
	"end_time" timestamp,
	"planned_minutes" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"round" integer NOT NULL,
	"heat_number" integer NOT NULL,
	"station_id" integer,
	"status" "match_status" DEFAULT 'PENDING' NOT NULL,
	"competitor1_id" integer,
	"competitor2_id" integer,
	"winner_id" integer,
	"start_time" timestamp,
	"end_time" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"status" "station_status" DEFAULT 'AVAILABLE' NOT NULL,
	"next_available_at" timestamp DEFAULT now() NOT NULL,
	"current_match_id" integer
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"seed" integer NOT NULL,
	"eliminated_round" integer,
	"final_rank" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_round_times" (
	"id" serial PRIMARY KEY NOT NULL,
	"tournament_id" integer NOT NULL,
	"round" integer NOT NULL,
	"dial_in_minutes" integer DEFAULT 2 NOT NULL,
	"cappuccino_minutes" integer DEFAULT 2 NOT NULL,
	"espresso_minutes" integer DEFAULT 1 NOT NULL,
	"total_minutes" integer DEFAULT 5 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"status" "tournament_status" DEFAULT 'SETUP' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"total_rounds" integer DEFAULT 5 NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'BARISTA' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "heat_judges" ADD CONSTRAINT "heat_judges_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_judges" ADD CONSTRAINT "heat_judges_judge_id_tournament_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_judge_id_tournament_users_id_fk" FOREIGN KEY ("judge_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_scores" ADD CONSTRAINT "heat_scores_competitor_id_tournament_users_id_fk" FOREIGN KEY ("competitor_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "heat_segments" ADD CONSTRAINT "heat_segments_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitor1_id_tournament_users_id_fk" FOREIGN KEY ("competitor1_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_competitor2_id_tournament_users_id_fk" FOREIGN KEY ("competitor2_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_id_tournament_users_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_tournament_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."tournament_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_round_times" ADD CONSTRAINT "tournament_round_times_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;