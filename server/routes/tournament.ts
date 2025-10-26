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

    // Get participants
    const participants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));

    // Get matches
    const matchesData = await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));

    // Get scores
    const scoresData = await db
      .select()
      .from(heatScores);

    res.json({
      tournament: tournament[0],
      participants: participants || [],
      matches: matchesData || [],
      scores: scoresData || []
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
