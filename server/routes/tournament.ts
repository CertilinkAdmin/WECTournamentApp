import { Router } from 'express';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, desc, inArray, and } from 'drizzle-orm';
import { 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  heatScores,
  judgeDetailedScores,
  users,
  stations
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
          .where(inArray(heatScores.matchId, matchIds))
      : [];

    // Get detailed scores for this tournament's matches  
    const detailedScoresData = matchIds.length > 0
      ? await db
          .select()
          .from(judgeDetailedScores)
          .where(inArray(judgeDetailedScores.matchId, matchIds))
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

// Assign judges to all heats in a tournament
router.post('/:id/assign-judges', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Get tournament participants (judges) - only those approved for this tournament (seed > 0)
    const allParticipants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    
    const allUsers = await db.select().from(users);
    
    // Filter to only judges who are approved for this tournament (seed > 0)
    const judges = allParticipants
      .filter(p => {
        const user = allUsers.find(u => u.id === p.userId);
        return user?.role === 'JUDGE' && p.seed && p.seed > 0;
      })
      .map(p => {
        const user = allUsers.find(u => u.id === p.userId);
        return user!;
      });
    
    if (judges.length < 3) {
      return res.status(400).json({ 
        error: `Need at least 3 approved judges for this tournament. Currently have ${judges.length}.` 
      });
    }
    
    // Get all matches for this tournament
    const tournamentMatches = await db
      .select()
      .from(matches)
      .where(eq(matches.tournamentId, tournamentId));
    
    if (tournamentMatches.length === 0) {
      return res.status(400).json({ error: 'No matches found for this tournament' });
    }
    
    // Shuffle judges array for randomization
    const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);
    
    let assignedCount = 0;
    let judgeIndex = 0;
    
    for (const match of tournamentMatches) {
      // Skip if match already has judges assigned
      const existingJudges = await db
        .select()
        .from(heatJudges)
        .where(eq(heatJudges.matchId, match.id));
      
      if (existingJudges.length > 0) {
        // Delete existing judges for this match
        await db.delete(heatJudges).where(eq(heatJudges.matchId, match.id));
      }
      
      // Assign 3 judges: 2 ESPRESSO, 1 CAPPUCCINO
      // All 3 judges score Visual/Latte Art
      // 1 Cappuccino judge scores sensory categories for Cappuccino
      // 2 Espresso judges score sensory categories for Espresso
      const assignedJudges: typeof judges = [];
      
      // Select 3 unique judges (wrap around if needed)
      for (let i = 0; i < 3; i++) {
        if (judgeIndex >= shuffledJudges.length) {
          // Reshuffle if we've used all judges
          shuffledJudges.sort(() => Math.random() - 0.5);
          judgeIndex = 0;
        }
        assignedJudges.push(shuffledJudges[judgeIndex]);
        judgeIndex++;
      }
      
      // Assign 3 judges - all are sensory judges (no distinction)
      // All judges score both Cappuccino and Espresso segments
      // Visual Latte Art is only scored on Cappuccino
      await db.insert(heatJudges).values([
        {
          matchId: match.id,
          judgeId: assignedJudges[0].id,
          role: 'SENSORY' // Judge 1
        },
        {
          matchId: match.id,
          judgeId: assignedJudges[1].id,
          role: 'SENSORY' // Judge 2
        },
        {
          matchId: match.id,
          judgeId: assignedJudges[2].id,
          role: 'SENSORY' // Judge 3
        }
      ]);
      
      assignedCount++;
    }
    
    res.json({
      success: true,
      message: `Assigned 3 judges to ${assignedCount} heats`,
      judgesAssigned: assignedCount * 3,
      totalJudges: judges.length
    });
  } catch (error: any) {
    console.error('Error assigning judges:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Assign station leads to stations (A, B, C)
router.post('/:id/assign-station-leads', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Get tournament participants (station leads) - only those approved for this tournament (seed > 0)
    const allParticipants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.tournamentId, tournamentId));
    
    const allUsers = await db.select().from(users);
    
    // Filter to only station leads who are approved for this tournament (seed > 0)
    const stationLeads = allParticipants
      .filter(p => {
        const user = allUsers.find(u => u.id === p.userId);
        return user?.role === 'STATION_LEAD' && p.seed && p.seed > 0;
      })
      .map(p => {
        const user = allUsers.find(u => u.id === p.userId);
        return user!;
      });
    
    if (stationLeads.length === 0) {
      return res.status(400).json({ 
        error: `No approved station leads found for this tournament.` 
      });
    }
    
    // Get all stations for this tournament
    const tournamentStations = await db
      .select()
      .from(stations)
      .where(eq(stations.tournamentId, tournamentId));
    
    // Filter to stations A, B, C
    const stationsABC = tournamentStations
      .filter(s => ['A', 'B', 'C'].includes(s.name))
      .sort((a, b) => a.name.localeCompare(b.name));
    
    if (stationsABC.length === 0) {
      return res.status(400).json({ error: 'No stations A, B, C found for this tournament' });
    }
    
    // Shuffle station leads for randomization
    const shuffledLeads = [...stationLeads].sort(() => Math.random() - 0.5);
    
    // Assign station leads to stations (distribute evenly, wrap around if needed)
    let assignedCount = 0;
    for (let i = 0; i < stationsABC.length; i++) {
      const station = stationsABC[i];
      const stationLead = shuffledLeads[i % shuffledLeads.length];
      
      await db.update(stations)
        .set({ stationLeadId: stationLead.id })
        .where(eq(stations.id, station.id));
      
      assignedCount++;
    }
    
    res.json({
      success: true,
      message: `Assigned ${assignedCount} station leads to stations`,
      stationLeadsAssigned: assignedCount,
      totalStationLeads: stationLeads.length
    });
  } catch (error: any) {
    console.error('Error assigning station leads:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

export default router;
