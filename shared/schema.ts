import { pgTable, text, serial, integer, timestamp, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const tournamentStatusEnum = pgEnum('tournament_status', ['SETUP', 'ACTIVE', 'COMPLETED', 'CANCELLED']);
export const matchStatusEnum = pgEnum('match_status', ['PENDING', 'READY', 'RUNNING', 'DONE']);
export const segmentTypeEnum = pgEnum('segment_type', ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO']);
export const segmentStatusEnum = pgEnum('segment_status', ['IDLE', 'RUNNING', 'ENDED']);
export const stationStatusEnum = pgEnum('station_status', ['AVAILABLE', 'BUSY', 'OFFLINE']);
export const judgeRoleEnum = pgEnum('judge_role', ['HEAD', 'TECHNICAL', 'SENSORY']);
export const personRoleEnum = pgEnum('person_role', ['JUDGE', 'BARISTA', 'VOLUNTEER', 'PARTNER']);
export const verificationStatusEnum = pgEnum('verification_status', ['UNVERIFIED', 'VERIFIED', 'REJECTED']);
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'JUDGE', 'BARISTA', 'STATION_LEAD', 'PUBLIC']);

// ============================================================================
// USERS - Legacy table (still exists in current DB)
// ============================================================================
// TODO: Migrate to persons table when migration is applied
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('BARISTA'),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// PERSONS - Permanent Pool (Top Level Class 1)
// ============================================================================
// This table stores all persons from the parent app's profile system
// They exist in a permanent pool and can register for multiple tournaments
export const persons = pgTable("persons", {
  id: serial("id").primaryKey(),
  // Reference to external profile system (parent app)
  externalProfileId: text("external_profile_id").unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  // Optional: store basic info that might be useful across tournaments
  phone: text("phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPersonSchema = createInsertSchema(persons).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPerson = z.infer<typeof insertPersonSchema>;
export type Person = typeof persons.$inferSelect;

// ============================================================================
// TOURNAMENTS - Tournament Hierarchy (Top Level Class 2)
// ============================================================================
// Tournament ID is composite: location + year (e.g., "WEC2025")
// Hierarchy: Tournament → Rounds → Heats → Stations
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(), // Integer ID (legacy schema - will be migrated to text later)
  name: text("name").notNull(),
  location: text("location"), // e.g., "WEC" (nullable in current DB)
  status: tournamentStatusEnum("status").notNull().default('SETUP'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalRounds: integer("total_rounds").notNull().default(5),
  currentRound: integer("current_round").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ createdAt: true, updatedAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// ============================================================================
// TOURNAMENT REGISTRATIONS - Links Persons to Tournaments
// ============================================================================
// When a person registers for a tournament, they're added here as UNVERIFIED
// Once admin verifies them, status becomes VERIFIED and they're in the tournament roles pool
export const tournamentRegistrations = pgTable("tournament_registrations", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  personId: integer("person_id").notNull().references(() => persons.id),
  role: personRoleEnum("role").notNull(), // JUDGE, BARISTA, VOLUNTEER, PARTNER
  verificationStatus: verificationStatusEnum("verification_status").notNull().default('UNVERIFIED'),
  // For competitors/baristas: bracket-related fields
  seed: integer("seed"), // Only for verified BARISTA role
  eliminatedRound: integer("eliminated_round"), // Only for verified BARISTA role
  finalRank: integer("final_rank"), // Only for verified BARISTA role
  // Metadata
  registeredAt: timestamp("registered_at").defaultNow().notNull(),
  verifiedAt: timestamp("verified_at"),
  verifiedBy: integer("verified_by").references(() => persons.id), // Admin person_id who verified
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTournamentRegistrationSchema = createInsertSchema(tournamentRegistrations).omit({ id: true, createdAt: true, updatedAt: true, registeredAt: true });
export type InsertTournamentRegistration = z.infer<typeof insertTournamentRegistrationSchema>;
export type TournamentRegistration = typeof tournamentRegistrations.$inferSelect;

// ============================================================================
// TOURNAMENT ROUND TIMES - Configuration for each round's timing
// ============================================================================
export const tournamentRoundTimes = pgTable("tournament_round_times", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  round: integer("round").notNull(),
  dialInMinutes: integer("dial_in_minutes").notNull().default(2),
  cappuccinoMinutes: integer("cappuccino_minutes").notNull().default(2),
  espressoMinutes: integer("espresso_minutes").notNull().default(1),
  totalMinutes: integer("total_minutes").notNull().default(5),
});

export const insertTournamentRoundTimeSchema = createInsertSchema(tournamentRoundTimes).omit({ id: true });
export type InsertTournamentRoundTime = z.infer<typeof insertTournamentRoundTimeSchema>;
export type TournamentRoundTime = typeof tournamentRoundTimes.$inferSelect;

// ============================================================================
// STATIONS - Tournament-specific stations (A, B, C for data grouping)
// ============================================================================
// Stations belong to tournaments and are used for grouping heats
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  // tournamentId: integer("tournament_id"), // Not in current DB schema yet
  name: text("name").notNull(), // "A", "B", "C" or more descriptive names
  location: text("location"), // Legacy field in current DB
  status: stationStatusEnum("status").notNull().default('AVAILABLE'),
  nextAvailableAt: timestamp("next_available_at").defaultNow().notNull(),
  currentMatchId: integer("current_match_id"), // References matches.id
  // createdAt: timestamp("created_at"), // Not in current DB schema
  // updatedAt: timestamp("updated_at"), // Not in current DB schema
});

export const insertStationSchema = createInsertSchema(stations).omit({ id: true });
export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stations.$inferSelect;

// ============================================================================
// MATCHES (HEATS) - Individual matches within rounds
// ============================================================================
// Hierarchy: Tournament → Round → Heat (Match) → Station
// References tournament registrations (not persons directly) for competitors
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  round: integer("round").notNull(),
  heatNumber: integer("heat_number").notNull(),
  stationId: integer("station_id").references(() => stations.id),
  status: matchStatusEnum("status").notNull().default('PENDING'),
  // Current DB schema uses competitor1_id/competitor2_id (references users table)
  // TODO: Migrate to competitor1RegistrationId/competitor2RegistrationId when migration is applied
  competitor1Id: integer("competitor1_id"), // References users.id in current schema
  competitor2Id: integer("competitor2_id"), // References users.id in current schema
  winnerId: integer("winner_id"), // References users.id in current schema
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertMatchSchema = createInsertSchema(matches).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Match = typeof matches.$inferSelect;

// Heat Segments
export const heatSegments = pgTable("heat_segments", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  segment: segmentTypeEnum("segment").notNull(),
  status: segmentStatusEnum("status").notNull().default('IDLE'),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  plannedMinutes: integer("planned_minutes").notNull(),
});

export const insertHeatSegmentSchema = createInsertSchema(heatSegments).omit({ id: true });
export type InsertHeatSegment = z.infer<typeof insertHeatSegmentSchema>;
export type HeatSegment = typeof heatSegments.$inferSelect;

// ============================================================================
// HEAT JUDGES - Judge assignments to matches
// ============================================================================
// Current DB schema uses judge_id (references users.id)
// TODO: Migrate to judgeRegistrationId when migration is applied
export const heatJudges = pgTable("heat_judges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull(), // References users.id in current schema
  role: judgeRoleEnum("role").notNull(), // HEAD, TECHNICAL, SENSORY
});

export const insertHeatJudgeSchema = createInsertSchema(heatJudges).omit({ id: true });
export type InsertHeatJudge = z.infer<typeof insertHeatJudgeSchema>;
export type HeatJudge = typeof heatJudges.$inferSelect;

// ============================================================================
// HEAT SCORES - Scoring records for matches
// ============================================================================
// Current DB schema uses judge_id and competitor_id (references users.id)
// TODO: Migrate to judgeRegistrationId/competitorRegistrationId when migration is applied
export const heatScores = pgTable("heat_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull(), // References users.id in current schema
  competitorId: integer("competitor_id").notNull(), // References users.id in current schema
  segment: segmentTypeEnum("segment").notNull(),
  score: integer("score").notNull(),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertHeatScoreSchema = createInsertSchema(heatScores).omit({ id: true, submittedAt: true });
export type InsertHeatScore = z.infer<typeof insertHeatScoreSchema>;
export type HeatScore = typeof heatScores.$inferSelect;

// Detailed Judge Scorecards (cup-based scoring)
export const judgeDetailedScores = pgTable("judge_detailed_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeName: text("judge_name").notNull(),
  
  // Cup codes
  leftCupCode: text("left_cup_code").notNull(),
  rightCupCode: text("right_cup_code").notNull(),
  
  // Sensory beverage type for this judge
  sensoryBeverage: text("sensory_beverage").notNull(), // 'Cappuccino' or 'Espresso'
  
  // Visual/Latte Art (3 points) - which cup won
  visualLatteArt: text("visual_latte_art").notNull(), // 'left' or 'right'
  
  // Taste (1 point) - which cup won
  taste: text("taste").notNull(), // 'left' or 'right'
  
  // Tactile (1 point) - which cup won
  tactile: text("tactile").notNull(), // 'left' or 'right'
  
  // Flavour (1 point) - which cup won
  flavour: text("flavour").notNull(), // 'left' or 'right'
  
  // Overall (5 points) - which cup won
  overall: text("overall").notNull(), // 'left' or 'right'
  
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertJudgeDetailedScoreSchema = createInsertSchema(judgeDetailedScores).omit({ id: true, submittedAt: true });
export type InsertJudgeDetailedScore = z.infer<typeof insertJudgeDetailedScoreSchema>;
export type JudgeDetailedScore = typeof judgeDetailedScores.$inferSelect;
