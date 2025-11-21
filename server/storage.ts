import { db } from "./db";
import { 
  users, tournaments, tournamentParticipants, tournamentRoundTimes,
  stations, matches, heatSegments, heatJudges, heatScores,
  judgeDetailedScores,
  type User, type InsertUser,
  type Tournament, type InsertTournament,
  type TournamentParticipant, type InsertTournamentParticipant,
  type TournamentRoundTime, type InsertTournamentRoundTime,
  type Station, type InsertStation,
  type Match, type InsertMatch,
  type HeatSegment, type InsertHeatSegment,
  type HeatJudge, type InsertHeatJudge,
  type HeatScore, type InsertHeatScore,
  type JudgeDetailedScore, type InsertJudgeDetailedScore
} from "@shared/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined>;
  
  // Legacy Person methods (for backward compatibility)
  getPerson(id: number): Promise<User | undefined>;
  getPersonByEmail(email: string): Promise<User | undefined>;
  createPerson(person: InsertUser): Promise<User>;
  getAllPersons(): Promise<User[]>;
  updatePerson(id: number, data: Partial<InsertUser>): Promise<User | undefined>;

  // Tournament methods (ID is integer in current DB schema)
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getTournament(id: number): Promise<Tournament | undefined>;
  getAllTournaments(): Promise<Tournament[]>;
  updateTournament(id: number, data: Partial<InsertTournament>): Promise<Tournament | undefined>;

  // Tournament Participants
  addParticipant(participant: InsertTournamentParticipant): Promise<TournamentParticipant>;
  getTournamentParticipants(tournamentId: number): Promise<TournamentParticipant[]>;
  updateParticipantSeed(participantId: number, seed: number): Promise<TournamentParticipant | undefined>;
  
  // Legacy Registration methods (for backward compatibility)
  addRegistration(participant: InsertTournamentParticipant): Promise<TournamentParticipant>;
  getTournamentRegistrations(tournamentId: number): Promise<TournamentParticipant[]>;
  updateRegistrationSeed(participantId: number, seed: number): Promise<TournamentParticipant | undefined>;

  // Stations
  createStation(station: InsertStation): Promise<Station>;
  getStation(id: number): Promise<Station | undefined>;
  getAllStations(): Promise<Station[]>;
  updateStation(id: number, data: Partial<InsertStation>): Promise<Station | undefined>;

  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatch(id: number): Promise<Match | undefined>;
  getTournamentMatches(tournamentId: number): Promise<Match[]>;
  getStationMatches(stationId: number, limit?: number, offset?: number): Promise<Match[]>;
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

  // Detailed Judge Scores
  submitDetailedScore(score: InsertJudgeDetailedScore): Promise<JudgeDetailedScore>;
  submitBatchDetailedScores(scores: InsertJudgeDetailedScore[]): Promise<JudgeDetailedScore[]>;
  getMatchDetailedScores(matchId: number): Promise<JudgeDetailedScore[]>;

  // Tournament Round Times
  setRoundTimes(times: InsertTournamentRoundTime): Promise<TournamentRoundTime>;
  getRoundTimes(tournamentId: number, round: number): Promise<TournamentRoundTime | undefined>;
  getTournamentRoundTimes(tournamentId: number): Promise<TournamentRoundTime[]>;

  // Clear tournament data
  clearTournamentData(tournamentId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods (new API)
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    const result = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Legacy Person methods (for backward compatibility - map to User)
  async getPerson(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getPersonByEmail(email: string): Promise<User | undefined> {
    return this.getUserByEmail(email);
  }

  async createPerson(person: InsertUser): Promise<User> {
    return this.createUser(person);
  }

  async getAllPersons(): Promise<User[]> {
    return this.getAllUsers();
  }

  async updatePerson(id: number, data: Partial<InsertUser>): Promise<User | undefined> {
    return this.updateUser(id, data);
  }


  // Tournament methods (ID is now text)
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

  // Tournament Participants (new API)
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

  // Legacy Registration methods (for backward compatibility)
  async addRegistration(participant: InsertTournamentParticipant): Promise<TournamentParticipant> {
    return this.addParticipant(participant);
  }

  async getTournamentRegistrations(tournamentId: number): Promise<TournamentParticipant[]> {
    return this.getTournamentParticipants(tournamentId);
  }

  async updateRegistrationSeed(participantId: number, seed: number): Promise<TournamentParticipant | undefined> {
    return this.updateParticipantSeed(participantId, seed);
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

  async getStationMatches(stationId: number, limit: number = 10, offset: number = 0): Promise<Match[]> {
    return await db.select()
      .from(matches)
      .where(eq(matches.stationId, stationId))
      .limit(limit)
      .offset(offset);
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

  // Detailed Judge Scores
  async submitDetailedScore(score: InsertJudgeDetailedScore): Promise<JudgeDetailedScore> {
    const result = await db.insert(judgeDetailedScores).values(score).returning();
    return result[0];
  }

  async submitBatchDetailedScores(scores: InsertJudgeDetailedScore[]): Promise<JudgeDetailedScore[]> {
    if (scores.length === 0) return [];
    const result = await db.insert(judgeDetailedScores).values(scores).returning();
    return result;
  }

  async getMatchDetailedScores(matchId: number): Promise<JudgeDetailedScore[]> {
    return await db.select()
      .from(judgeDetailedScores)
      .where(eq(judgeDetailedScores.matchId, matchId));
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

  async clearTournamentData(tournamentId: number): Promise<void> {
    // First, get all matches for this tournament
    const tournamentMatches = await db.select({ id: matches.id }).from(matches).where(eq(matches.tournamentId, tournamentId));
    const matchIds = tournamentMatches.map(m => m.id);

    // Clear all tournament-related data in the correct order to avoid foreign key constraints
    if (matchIds.length > 0) {
      // Delete scores, judges, and segments for all matches using inArray
      await db.delete(heatScores).where(inArray(heatScores.matchId, matchIds));
      await db.delete(judgeDetailedScores).where(inArray(judgeDetailedScores.matchId, matchIds));
      await db.delete(heatJudges).where(inArray(heatJudges.matchId, matchIds));
      await db.delete(heatSegments).where(inArray(heatSegments.matchId, matchIds));
    }

    // Delete matches
    await db.delete(matches).where(eq(matches.tournamentId, tournamentId));
    
    // Delete tournament-specific data
    await db.delete(tournamentRoundTimes).where(eq(tournamentRoundTimes.tournamentId, tournamentId));
    await db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournamentId));
  }
}

export const storage = new DatabaseStorage();
