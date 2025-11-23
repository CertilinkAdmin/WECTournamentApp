import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { 
  tournaments, 
  matches, 
  tournamentParticipants, 
  users, 
  stations,
  heatScores,
  judgeDetailedScores,
  heatJudges,
  heatSegments,
  tournamentRoundTimes
} from '../../shared/schema';
import { eq, inArray } from 'drizzle-orm';
import os from 'os';

const router = Router();

// In-memory storage for carousel images (could be moved to database later)
// Initialize with default images - will be populated on first request
let carouselImages: string[] = [];

// In-memory storage for tournament pause states (tournamentId -> isPaused)
const tournamentPauseStates = new Map<number, boolean>();

// ===== CAROUSEL MANAGEMENT =====
// Get carousel images
router.get('/carousel', async (req, res) => {
  try {
    // Initialize with default images from config if not already set
    if (carouselImages.length === 0) {
      // Try to load from config file (client-side config)
      // Since we're on the server, we'll use a fallback approach
      // The client will handle loading from the config file
      carouselImages = [
        'https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1920&q=80',
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=1920&q=80',
        'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1920&q=80',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1920&q=80',
        'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=1920&q=80',
        'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=1920&q=80',
      ];
    }
    res.json(carouselImages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Add carousel image
router.post('/carousel', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'imageUrl is required and must be a string' });
    }
    
    if (carouselImages.includes(imageUrl)) {
      return res.status(400).json({ error: 'Image already exists in carousel' });
    }
    
    carouselImages.push(imageUrl);
    res.json({ success: true, images: carouselImages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Remove carousel image
router.delete('/carousel', async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl || typeof imageUrl !== 'string') {
      return res.status(400).json({ error: 'imageUrl is required and must be a string' });
    }
    
    const index = carouselImages.indexOf(imageUrl);
    if (index === -1) {
      return res.status(404).json({ error: 'Image not found in carousel' });
    }
    
    carouselImages.splice(index, 1);
    res.json({ success: true, images: carouselImages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== SYSTEM STATISTICS =====
router.get('/system-stats', async (req, res) => {
  try {
    // Get system uptime
    const uptime = process.uptime();
    
    // Get memory usage
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
    
    // Get CPU usage (simplified - actual CPU usage would require more complex calculation)
    const cpus = os.cpus();
    const cpuUsage = 50; // Placeholder - would need to calculate from previous samples
    
    // Get active connections (WebSocket connections would be tracked separately)
    const activeConnections = 0; // Placeholder - would need to track from Socket.IO
    
    // Get database size (simplified)
    const databaseSize = 0; // Placeholder - would need actual database query
    
    res.json({
      uptime: Math.floor(uptime),
      memoryUsage: Math.round(memoryUsage * 10) / 10,
      cpuUsage: cpuUsage,
      activeConnections: activeConnections,
      databaseSize: databaseSize
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TOURNAMENT PAUSE/RESUME =====
router.post('/tournaments/:id/pause', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { paused } = req.body;
    
    if (typeof paused !== 'boolean') {
      return res.status(400).json({ error: 'paused must be a boolean' });
    }
    
    // Get tournament
    const tournament = await storage.getTournament(tournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }
    
    // Store pause state in memory (in production, add isPaused field to schema)
    tournamentPauseStates.set(tournamentId, paused);
    
    // Emit WebSocket event if available
    const io = (req as any).app.get('io');
    if (io) {
      io.to(`tournament:${tournamentId}`).emit('tournament:pause-changed', { tournamentId, paused });
    }
    
    res.json({
      success: true,
      tournament,
      isPaused: paused
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get tournament pause state
router.get('/tournaments/:id/pause', async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const isPaused = tournamentPauseStates.get(tournamentId) || false;
    res.json({ tournamentId, isPaused });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all tournament pause states
router.get('/tournaments/pause-states', async (req, res) => {
  try {
    const allTournaments = await storage.getAllTournaments();
    const states: Record<number, boolean> = {};
    for (const tournament of allTournaments) {
      states[tournament.id] = tournamentPauseStates.get(tournament.id) || false;
    }
    res.json(states);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== TEST DATA SEEDING =====
router.post('/seed-test-data', async (req, res) => {
  try {
    const { 
      tournamentName = 'Test Tournament', 
      numBaristas = 16, 
      numJudges = 9 
    } = req.body;
    
    // Validate inputs
    if (typeof numBaristas !== 'number' || numBaristas < 2 || numBaristas > 64) {
      return res.status(400).json({ 
        error: 'numBaristas must be a number between 2 and 64' 
      });
    }
    
    if (typeof numJudges !== 'number' || numJudges < 1 || numJudges > 20) {
      return res.status(400).json({ 
        error: 'numJudges must be a number between 1 and 20' 
      });
    }
    
    // Ensure tournament name is marked as test (for isolation)
    const testTournamentName = tournamentName.toLowerCase().includes('test') 
      ? tournamentName 
      : `Test Tournament: ${tournamentName}`;
    
    // Create test tournament with explicit test marker
    const tournament = await storage.createTournament({
      name: testTournamentName,
      status: 'SETUP',
      totalRounds: 5,
      currentRound: 1
    });
    
    // Create test baristas with unique emails per tournament
    const baristas = [];
    const timestamp = Date.now();
    for (let i = 1; i <= numBaristas; i++) {
      const barista = await storage.createUser({
        name: `Test Barista ${i}`,
        email: `test-barista-${tournament.id}-${i}-${timestamp}@test.com`,
        role: 'BARISTA',
        approved: true
      });
      baristas.push(barista);
    }
    
    // Create test judges with unique emails per tournament
    const judges = [];
    for (let i = 1; i <= numJudges; i++) {
      const judge = await storage.createUser({
        name: `Test Judge ${i}`,
        email: `test-judge-${tournament.id}-${i}-${timestamp}@test.com`,
        role: 'JUDGE',
        approved: true
      });
      judges.push(judge);
    }
    
    // Add baristas as participants with seeds
    for (let i = 0; i < baristas.length; i++) {
      await storage.addParticipant({
        tournamentId: tournament.id,
        userId: baristas[i].id,
        seed: i + 1
      });
    }
    
    // Judges are NOT participants - they judge matches, not compete
    // Remove the code that adds judges as participants
    
    // Create tournament-specific stations (with tournament_id)
    const stationNames = ['A', 'B', 'C'];
    const createdStations = [];
    for (const name of stationNames) {
      try {
        const station = await storage.createStation({ 
        tournamentId: tournament.id,
          name, 
          status: 'AVAILABLE', 
          nextAvailableAt: new Date() 
        });
        createdStations.push(station);
      } catch (error: any) {
        // Station might already exist, skip
        console.warn(`Station ${name} creation warning:`, error.message);
      }
    }
    
    res.json({
      success: true,
      tournament,
      baristasCreated: baristas.length,
      judgesCreated: judges.length,
      stationsCreated: createdStations.length,
      message: `Test tournament "${testTournamentName}" created with ${baristas.length} baristas, ${judges.length} judges, and ${createdStations.length} stations`
    });
  } catch (error: any) {
    console.error('Error creating test data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CLEAR TEST DATA =====
router.delete('/clear-test-data', async (req, res) => {
  try {
    // Get all test tournaments (those with "Test" in the name or test emails)
    const allTournaments = await storage.getAllTournaments();
    const testTournaments = allTournaments.filter(t => 
      t.name.toLowerCase().includes('test') || 
      t.name.toLowerCase().includes('demo')
    );
    
    if (testTournaments.length === 0) {
      return res.json({
        success: true,
        tournamentsCleared: 0,
        message: 'No test tournaments found to clear'
      });
    }
    
    let cleared = 0;
    const errors: string[] = [];
    
    for (const tournament of testTournaments) {
      try {
        // Get all participants for this tournament
        const participants = await db.select()
          .from(tournamentParticipants)
          .where(eq(tournamentParticipants.tournamentId, tournament.id));
        
        // Get all matches for this tournament
        const tournamentMatches = await db.select()
          .from(matches)
          .where(eq(matches.tournamentId, tournament.id));
        const matchIds = tournamentMatches.map(m => m.id);
        
        // Delete all related data in correct order
        if (matchIds.length > 0) {
          await db.delete(judgeDetailedScores).where(inArray(judgeDetailedScores.matchId, matchIds));
          await db.delete(heatScores).where(inArray(heatScores.matchId, matchIds));
          await db.delete(heatJudges).where(inArray(heatJudges.matchId, matchIds));
          await db.delete(heatSegments).where(inArray(heatSegments.matchId, matchIds));
        }
        
        await db.delete(matches).where(eq(matches.tournamentId, tournament.id));
        await db.delete(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id));
        
        // Delete tournament-specific stations
        await db.delete(stations).where(eq(stations.tournamentId, tournament.id));
        
        // Delete tournament round times
        await db.delete(tournamentRoundTimes).where(eq(tournamentRoundTimes.tournamentId, tournament.id));
        
        // Delete the tournament
        await db.delete(tournaments).where(eq(tournaments.id, tournament.id));
        
        // Delete test users (those with test emails for this tournament)
        const testUserEmails = participants.map(p => {
          // Extract test user emails pattern
          return `test-%-${tournament.id}-%@test.com`;
        });
        
        // Delete users with test emails matching this tournament
        await db.delete(users).where(
          // This is a simplified approach - in production, you'd want more precise matching
          eq(users.email, `test-${tournament.id}`)
        );
        
      cleared++;
      } catch (error: any) {
        errors.push(`Failed to clear tournament ${tournament.id}: ${error.message}`);
        console.error(`Error clearing tournament ${tournament.id}:`, error);
      }
    }
    
    res.json({
      success: true,
      tournamentsCleared: cleared,
      errors: errors.length > 0 ? errors : undefined,
      message: `Cleared ${cleared} test tournament(s)${errors.length > 0 ? ` with ${errors.length} error(s)` : ''}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

