import { db } from "./db";
import { 
  users, tournaments, tournamentParticipants, tournamentRoundTimes,
  stations, matches, heatSegments, heatJudges, heatScores,
  type User, type InsertUser,
  type Tournament, type InsertTournament,
  type TournamentParticipant, type InsertTournamentParticipant,
  type TournamentRoundTime, type InsertTournamentRoundTime,
  type Station, type InsertStation,
  type Match, type InsertMatch,
  type HeatSegment, type InsertHeatSegment,
  type HeatJudge, type InsertHeatJudge,
  type HeatScore, type InsertHeatScore
} from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;

  // Tournament methods
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  updateTournament(id: number, data: Partial<InsertTournament>): Promise<Tournament | undefined>;

  // Tournament Participants
  addParticipant(participant: InsertTournamentParticipant): Promise<TournamentParticipant>;
  getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]>;
  updateParticipantSeed(participantId: number, seed: number): Promise<TournamentParticipant | undefined>;

  // Stations
  createStation(station: InsertStation): Promise<Station>;
  getStation(id: number): Promise<Station | undefined>;
  getAllStations(): Promise<Station[]>;
  updateStation(id: number, data: Partial<InsertStation>): Promise<Station | undefined>;

  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  getTournamentMatches(tournamentId: number): Promise<Match[]>;
  updateMatch(id: number, data: Partial<InsertMatch>): Promise<Match | undefined>;

  // Heat Segments
  createHeatSegment(segment: InsertHeatSegment): Promise<HeatSegment>;
  getMatchSegments(matchId: number): Promise<HeatSegment[]>;
  updateHeatSegment(id: number, data: Partial<InsertHeatSegment>): Promise<HeatSegment | undefined>;

  // Heat Judges
  assignJudge(assignment: InsertHeatJudge): Promise<HeatJudge>;
  getMatchJudges(matchId: number): Promise<HeatJudge[]>;

  // Heat Scores
  submitScore(score: InsertHeatScore): Promise<HeatScore>;
  getMatchScores(matchId: number): Promise<HeatScore[]>;

  // Tournament Round Times
  setRoundTimes(times: InsertTournamentRoundTime): Promise<TournamentRoundTime>;
  getRoundTimes(tournamentId: number, round: number): Promise<TournamentRoundTime | undefined>;
  getTournamentRoundTimes(tournamentId: number): Promise<TournamentRoundTime[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // Tournament methods
  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const result = await db.insert(tournaments).values(tournament).returning();
    return result[0];
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const result = await db.select().from(tournaments).where(eq(tournaments.id, id)).limit(1);
    return result[0];
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return await db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  }

  async updateTournament(id: number, data: Partial<InsertTournament>): Promise<Tournament | undefined> {
    const result = await db.update(tournaments)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tournaments.id, id))
      .returning();
    return result[0];
  }

  // Tournament Participants
  async addParticipant(participant: InsertTournamentParticipant): Promise<TournamentParticipant> {
    const result = await db.insert(tournamentParticipants).values(participant).returning();
    return result[0];
  }

  async getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]> {
    return await db.select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
  }

  async updateParticipantSeed(participantId: number, seed: number): Promise<TournamentParticipant | undefined> {
    const result = await db.update(tournamentParticipants)
      .set({ seed })
      .where(eq(tournamentParticipants.id, participantId))
      .returning();
    return result[0];
  }

  // Stations
  async createStation(station: InsertStation): Promise<Station> {
    const result = await db.insert(stations).values(station).returning();
    return result[0];
  }

  async getStation(id: number): Promise<Station | undefined> {
    const result = await db.select().from(stations).where(eq(stations.id, id)).limit(1);
    return result[0];
  }

  async getAllStations(): Promise<Station[]> {
    return await db.select().from(stations);
  }

  async updateStation(id: number, data: Partial<InsertStation>): Promise<Station | undefined> {
    const result = await db.update(stations)
      .set(data)
      .where(eq(stations.id, id))
      .returning();
    return result[0];
  }

  // Matches
  async createMatch(match: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(match).returning();
    return result[0];
  }

  async getMatch(id: number): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
    return result[0];
  }

  async getTournamentMatches(tournamentId: number): Promise<Match[]> {
    return await db.select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));
  }

  async updateMatch(id: number, data: Partial<InsertMatch>): Promise<Match | undefined> {
    const result = await db.update(matches)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(matches.id, id))
      .returning();
    return result[0];
  }

  // Heat Segments
  async createHeatSegment(segment: InsertHeatSegment): Promise<HeatSegment> {
    const result = await db.insert(heatSegments).values(segment).returning();
    return result[0];
  }

  async getMatchSegments(matchId: number): Promise<HeatSegment[]> {
    return await db.select()
      .from(heatSegments)
      .where(eq(heatSegments.matchId, matchId));
  }

  async updateHeatSegment(id: number, data: Partial<InsertHeatSegment>): Promise<HeatSegment | undefined> {
    const result = await db.update(heatSegments)
      .set(data)
      .where(eq(heatSegments.id, id))
      .returning();
    return result[0];
  }

  // Heat Judges
  async assignJudge(assignment: InsertHeatJudge): Promise<HeatJudge> {
    const result = await db.insert(heatJudges).values(assignment).returning();
    return result[0];
  }

  async getMatchJudges(matchId: number): Promise<HeatJudge[]> {
    return await db.select()
      .from(heatJudges)
      .where(eq(heatJudges.matchId, matchId));
  }

  // Heat Scores
  async submitScore(score: InsertHeatScore): Promise<HeatScore> {
    const result = await db.insert(heatScores).values(score).returning();
    return result[0];
  }

  async getMatchScores(matchId: number): Promise<HeatScore[]> {
    return await db.select()
      .from(heatScores)
      .where(eq(heatScores.matchId, matchId));
  }

  // Tournament Round Times
  async setRoundTimes(times: InsertTournamentRoundTime): Promise<TournamentRoundTime> {
    const result = await db.insert(tournamentRoundTimes).values(times).returning();
    return result[0];
  }

  async getRoundTimes(tournamentId: number, round: number): Promise<TournamentRoundTime | undefined> {
    const result = await db.select()
      .from(tournamentRoundTimes)
      .where(and(
        eq(tournamentRoundTimes.tournamentId, tournamentId),
        eq(tournamentRoundTimes.round, round)
      ))
      .limit(1);
    return result[0];
  }

  async getTournamentRoundTimes(tournamentId: number): Promise<TournamentRoundTime[]> {
    return await db.select()
      .from(tournamentRoundTimes)
      .where(eq(tournamentRoundTimes.tournamentId, tournamentId));
  }
}

export const storage = new DatabaseStorage();
