import { db } from "./db";
import { 
  users, tournaments, tournamentParticipants, tournamentRoundTimes,
  stations, matches, heatSegments, heatJudges, heatScores,
  judgeDetailedScores, matchCupPositions,
  type User, type InsertUser,
  type Tournament, type InsertTournament,
  type TournamentParticipant, type InsertTournamentParticipant,
  type TournamentRoundTime, type InsertTournamentRoundTime,
  type Station, type InsertStation,
  type Match, type InsertMatch,
  type HeatSegment, type InsertHeatSegment,
  type HeatJudge, type InsertHeatJudge,
  type HeatScore, type InsertHeatScore,
  type JudgeDetailedScore, type InsertJudgeDetailedScore,
  type MatchCupPosition, type InsertMatchCupPosition
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
  updateParticipantCupCode(participantId: number, cupCode: string): Promise<TournamentParticipant | undefined>;
  updateParticipantSeedAndCupCode(participantId: number, seed: number, cupCode: string): Promise<TournamentParticipant | undefined>;
  
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
  getHeatSegment(id: number): Promise<HeatSegment | undefined>;
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
  getJudgeCompletionStatus(matchId: number, segmentType: 'CAPPUCCINO' | 'ESPRESSO'): Promise<{
    allComplete: boolean;
    judges: Array<{
      judgeId: number;
      judgeName: string;
      role: 'ESPRESSO' | 'CAPPUCCINO';
      completed: boolean;
    }>;
  }>;

  // Tournament Round Times
  setRoundTimes(times: InsertTournamentRoundTime): Promise<TournamentRoundTime>;
  getRoundTimes(tournamentId: number, round: number): Promise<TournamentRoundTime | undefined>;
  getTournamentRoundTimes(tournamentId: number): Promise<TournamentRoundTime[]>;
  updateRoundTimes(tournamentId: number, round: number, data: Partial<InsertTournamentRoundTime>): Promise<TournamentRoundTime | undefined>;

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

  async updateParticipantCupCode(participantId: number, cupCode: string): Promise<TournamentParticipant | undefined> {
    const result = await db.update(tournamentParticipants)
      .set({ cupCode })
      .where(eq(tournamentParticipants.id, participantId))
      .returning();
    return result[0];
  }

  async updateParticipantSeedAndCupCode(participantId: number, seed: number, cupCode: string): Promise<TournamentParticipant | undefined> {
    const result = await db.update(tournamentParticipants)
      .set({ seed, cupCode })
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
    // WARNING: This returns stations from all tournaments
    // Prefer getTournamentStations(tournamentId) for proper partitioning
    return await db.select().from(stations);
  }

  async getTournamentStations(tournamentId: number): Promise<Station[]> {
    return await db.select()
      .from(stations)
      .where(eq(stations.tournamentId, tournamentId));
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

  async deleteMatch(matchId: number): Promise<void> {
    // Delete related data first (foreign key constraints)
    await db.delete(heatScores).where(eq(heatScores.matchId, matchId));
    await db.delete(judgeDetailedScores).where(eq(judgeDetailedScores.matchId, matchId));
    await db.delete(heatJudges).where(eq(heatJudges.matchId, matchId));
    await db.delete(heatSegments).where(eq(heatSegments.matchId, matchId));
    await db.delete(matchCupPositions).where(eq(matchCupPositions.matchId, matchId));
    // Delete the match itself
    await db.delete(matches).where(eq(matches.id, matchId));
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

  async getHeatSegment(id: number): Promise<HeatSegment | undefined> {
    const result = await db.select()
      .from(heatSegments)
      .where(eq(heatSegments.id, id))
      .limit(1);
    return result[0];
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
  // Upsert logic: Check if score exists for this judge/match, and merge fields if it does
  // This allows visual latte art and sensory scores to be submitted independently
  async submitDetailedScore(score: InsertJudgeDetailedScore): Promise<JudgeDetailedScore> {
    // Check if a score already exists for this judge/match combination
    const existing = await db.select()
      .from(judgeDetailedScores)
      .where(
        and(
          eq(judgeDetailedScores.matchId, score.matchId),
          eq(judgeDetailedScores.judgeName, score.judgeName)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing record by merging provided fields
      // Only update fields that are explicitly provided (not undefined)
      // This allows latte art and sensory to be submitted independently
      const existingScore = existing[0];
      const updateData: Partial<InsertJudgeDetailedScore> = {};
      
      // Only update fields that are explicitly provided (not undefined)
      // This preserves existing values for fields not included in the submission
      // This allows visual latte art and sensory scores to be submitted independently
      if (score.visualLatteArt !== undefined) {
        updateData.visualLatteArt = score.visualLatteArt;
      }
      if (score.taste !== undefined) {
        updateData.taste = score.taste;
      }
      if (score.tactile !== undefined) {
        updateData.tactile = score.tactile;
      }
      if (score.flavour !== undefined) {
        updateData.flavour = score.flavour;
      }
      if (score.overall !== undefined) {
        updateData.overall = score.overall;
      }
      // Update sensoryBeverage if provided
      if (score.sensoryBeverage !== undefined) {
        updateData.sensoryBeverage = score.sensoryBeverage;
      }
      // Update cup codes if provided
      if (score.leftCupCode !== undefined) {
        updateData.leftCupCode = score.leftCupCode;
      }
      if (score.rightCupCode !== undefined) {
        updateData.rightCupCode = score.rightCupCode;
      }
      if (score.cupCode1 !== undefined) {
        updateData.cupCode1 = score.cupCode1;
      }
      if (score.cupCode2 !== undefined) {
        updateData.cupCode2 = score.cupCode2;
      }

      // Only update if there are fields to update
      if (Object.keys(updateData).length > 0) {
        const result = await db.update(judgeDetailedScores)
          .set(updateData)
          .where(eq(judgeDetailedScores.id, existingScore.id))
          .returning();
        return result[0];
      } else {
        // No fields to update, return existing
        return existingScore;
      }
    } else {
      // Insert new record
      const result = await db.insert(judgeDetailedScores).values(score).returning();
      return result[0];
    }
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

  async getJudgeCompletionStatus(matchId: number, segmentType: 'CAPPUCCINO' | 'ESPRESSO'): Promise<{
    allComplete: boolean;
    judges: Array<{
      judgeId: number;
      judgeName: string;
      role: 'ESPRESSO' | 'CAPPUCCINO';
      completed: boolean;
    }>;
  }> {
    // Get all judges assigned to this match
    const matchJudges = await this.getMatchJudges(matchId);
    
    // Filter judges based on segment type
    // CAPPUCCINO: CAPPUCCINO judge (1 judge scores Cappuccino sensory)
    // ESPRESSO: ESPRESSO judges (2 judges score Espresso sensory)
    const relevantJudges = matchJudges.filter(j => {
      if (segmentType === 'CAPPUCCINO') {
        return j.role === 'CAPPUCCINO';
      } else {
        return j.role === 'ESPRESSO';
      }
    });

    // Get all detailed scores for this match
    const allScores = await this.getMatchDetailedScores(matchId);
    
    // Get all users to map judge IDs to names
    const allUsers = await this.getAllUsers();
    
    // Check completion status for each judge
    const judgesStatus = relevantJudges.map(judge => {
      const judgeUser = allUsers.find(u => u.id === judge.judgeId);
      const judgeName = judgeUser?.name || `Judge ${judge.judgeId}`;
      
      // Check if this judge has submitted a score for this segment
      // For CAPPUCCINO: check if sensoryBeverage is 'Cappuccino'
      // For ESPRESSO: check if sensoryBeverage is 'Espresso'
      const expectedBeverage = segmentType === 'CAPPUCCINO' ? 'Cappuccino' : 'Espresso';
      const judgeScore = allScores.find(
        score => score.judgeName === judgeName && score.sensoryBeverage === expectedBeverage
      );
      
      return {
        judgeId: judge.judgeId,
        judgeName,
        role: judge.role,
        completed: !!judgeScore,
      };
    });

    const allComplete = judgesStatus.length > 0 && judgesStatus.every(j => j.completed);

    return {
      allComplete,
      judges: judgesStatus,
    };
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

  async updateRoundTimes(tournamentId: number, round: number, data: Partial<InsertTournamentRoundTime>): Promise<TournamentRoundTime | undefined> {
    const result = await db.update(tournamentRoundTimes)
      .set(data)
      .where(and(
        eq(tournamentRoundTimes.tournamentId, tournamentId),
        eq(tournamentRoundTimes.round, round)
      ))
      .returning();
    return result[0];
  }

  // Match Cup Positions
  async setMatchCupPositions(matchId: number, positions: Array<{ cupCode: string; position: 'left' | 'right' }>, assignedBy?: number): Promise<MatchCupPosition[]> {
    // Delete existing positions for this match
    await db.delete(matchCupPositions).where(eq(matchCupPositions.matchId, matchId));
    
    // Insert new positions
    const insertData: InsertMatchCupPosition[] = positions.map(p => ({
      matchId,
      cupCode: p.cupCode,
      position: p.position,
      assignedBy: assignedBy || null,
    }));
    
    const result = await db.insert(matchCupPositions).values(insertData).returning();
    return result;
  }

  async getMatchCupPositions(matchId: number): Promise<MatchCupPosition[]> {
    return await db.select()
      .from(matchCupPositions)
      .where(eq(matchCupPositions.matchId, matchId));
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
      await db.delete(matchCupPositions).where(inArray(matchCupPositions.matchId, matchIds));
    }

    // Delete matches
    await db.delete(matches).where(eq(matches.tournamentId, tournamentId));
    
    // Delete tournament-specific data
    await db.delete(tournamentRoundTimes).where(eq(tournamentRoundTimes.tournamentId, tournamentId));
    await db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournamentId));
  }
}

export const storage = new DatabaseStorage();
