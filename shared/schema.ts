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
export const userRoleEnum = pgEnum('user_role', ['ADMIN', 'JUDGE', 'BARISTA', 'STATION_LEAD', 'PUBLIC']);

// Tournament Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  role: userRoleEnum("role").notNull().default('BARISTA'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tournaments table
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  status: tournamentStatusEnum("status").notNull().default('SETUP'),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  totalRounds: integer("total_rounds").notNull().default(5),
  currentRound: integer("current_round").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;

// Tournament Participants
export const tournamentParticipants = pgTable("tournament_participants", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  userId: integer("user_id").notNull().references(() => users.id),
  seed: integer("seed").notNull(),
  eliminatedRound: integer("eliminated_round"),
  finalRank: integer("final_rank"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({ id: true, createdAt: true });
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;
export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;

// Tournament Round Times
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

// Stations
export const stations = pgTable("stations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location"),
  status: stationStatusEnum("status").notNull().default('AVAILABLE'),
  nextAvailableAt: timestamp("next_available_at").defaultNow().notNull(),
  currentMatchId: integer("current_match_id"),
});

export const insertStationSchema = createInsertSchema(stations).omit({ id: true });
export type InsertStation = z.infer<typeof insertStationSchema>;
export type Station = typeof stations.$inferSelect;

// Matches (Heats)
export const matches = pgTable("matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  round: integer("round").notNull(),
  heatNumber: integer("heat_number").notNull(),
  stationId: integer("station_id").references(() => stations.id),
  status: matchStatusEnum("status").notNull().default('PENDING'),
  competitor1Id: integer("competitor1_id").references(() => users.id),
  competitor2Id: integer("competitor2_id").references(() => users.id),
  winnerId: integer("winner_id").references(() => users.id),
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

// Heat Judges
export const heatJudges = pgTable("heat_judges", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull().references(() => users.id),
  role: judgeRoleEnum("role").notNull(),
});

export const insertHeatJudgeSchema = createInsertSchema(heatJudges).omit({ id: true });
export type InsertHeatJudge = z.infer<typeof insertHeatJudgeSchema>;
export type HeatJudge = typeof heatJudges.$inferSelect;

// Heat Scores
export const heatScores = pgTable("heat_scores", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull().references(() => matches.id),
  judgeId: integer("judge_id").notNull().references(() => users.id),
  competitorId: integer("competitor_id").notNull().references(() => users.id),
  segment: segmentTypeEnum("segment").notNull(),
  score: integer("score").notNull(),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
});

export const insertHeatScoreSchema = createInsertSchema(heatScores).omit({ id: true, submittedAt: true });
export type InsertHeatScore = z.infer<typeof insertHeatScoreSchema>;
export type HeatScore = typeof heatScores.$inferSelect;
