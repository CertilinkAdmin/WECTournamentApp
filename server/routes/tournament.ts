import { Router } from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc } from 'drizzle-orm';
import { 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  judgeDetailedScores,
  users 
} from '../../shared/schema';

const router = Router();

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/tournament_db';
const sql = postgres(connectionString);
const db = drizzle(sql);

// Get tournament by ID with all related data
router.get('/:id', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Get tournament
    const tournament = await db.select().from(tournaments).where(eq(tournaments.id, tournamentId)).limit(1);
    if (tournament.length === 0) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    // Get participants with user info
    const participantsData = await db
      .select({
        id: tournamentParticipants.id,
        seed: tournamentParticipants.seed,
        finalRank: tournamentParticipants.finalRank,
        userId: tournamentParticipants.userId,
        name: users.name,
        email: users.email
      })
      .from(tournamentParticipants)
      .leftJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    // Get matches with competitor names
    const matchesData = await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));
    
    // Fetch competitor names for each match
    const matchesWithNames = await Promise.all(
      matchesData.map(async (match) => {
        let competitor1Name = '';
        let competitor2Name = '';
        
        if (match.competitor1Id) {
          const comp1 = await db.select({ name: users.name })
            .from(users)
            .where(eq(users.id, match.competitor1Id))
            .limit(1);
          competitor1Name = comp1[0]?.name || '';
        }
        
        if (match.competitor2Id) {
          const comp2 = await db.select({ name: users.name })
            .from(users)
            .where(eq(users.id, match.competitor2Id))
            .limit(1);
          competitor2Name = comp2[0]?.name || '';
        }
        
        return {
          ...match,
          competitor1Name,
          competitor2Name
        };
      })
    );

    // Get scores for this tournament's matches
    const matchIds = matchesData.map(m => m.id);
    const scoresData = matchIds.length > 0
      ? await db
          .select({
            matchId: heatScores.matchId,
            judgeId: heatScores.judgeId,
            competitorId: heatScores.competitorId,
            segment: heatScores.segment,
            score: heatScores.score,
            judgeName: users.name
          })
          .from(heatScores)
          .leftJoin(users, eq(heatScores.judgeId, users.id))
      : [];

    // Get detailed scores for this tournament's matches  
    const detailedScoresData = matchIds.length > 0
      ? await db
          .select()
          .from(judgeDetailedScores)
      : [];

    res.json({
      tournament: tournament[0],
      participants: participantsData || [],
      matches: matchesWithNames || [],
      scores: scoresData || [],
      detailedScores: detailedScoresData || []
    });

  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all tournaments
router.get('/', async (req, res) => {
  try {
    const tournamentsList = await db
      .select()
      .from(tournaments)
      .orderBy(desc(tournaments.createdAt));

    res.json(tournamentsList);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tournament leaderboard
router.get('/:id/leaderboard', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Get participants with their total scores
    const leaderboard = await db
      .select({
        participantId: tournamentParticipants.id,
        userId: tournamentParticipants.userId,
        name: users.name,
        seed: tournamentParticipants.seed,
        finalRank: tournamentParticipants.finalRank,
        totalScore: heatScores.score
      })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .leftJoin(matches, eq(tournamentParticipants.tournamentId, matches.tournamentId))
      .leftJoin(heatScores, eq(matches.id, heatScores.matchId))
      .where(eq(tournamentParticipants.tournamentId, tournamentId))
      .orderBy(desc(heatScores.score));

    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
