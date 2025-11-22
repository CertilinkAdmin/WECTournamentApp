import { Router } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { tournaments, matches, tournamentParticipants, users, stations } from '../../shared/schema';
import { eq } from 'drizzle-orm';
import os from 'os';

const router = Router();

// In-memory storage for carousel images (could be moved to database later)
// Initialize with default images - will be populated on first request
let carouselImages: string[] | null = null;

// In-memory storage for tournament pause states (tournamentId -> isPaused)
const tournamentPauseStates = new Map<number, boolean>();

// ===== CAROUSEL MANAGEMENT =====
// Get carousel images
router.get('/carousel', async (req, res) => {
  try {
    // Initialize with default images from config if not already set
    if (carouselImages === null) {
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
    const { tournamentName = 'Test Tournament', numBaristas = 16, numJudges = 9 } = req.body;
    
    // Create test tournament
    const tournament = await storage.createTournament({
      name: tournamentName,
      status: 'SETUP',
      totalRounds: 5,
      currentRound: 1
    });
    
    // Create test baristas
    const baristas = [];
    for (let i = 1; i <= numBaristas; i++) {
      const barista = await storage.createUser({
        name: `Test Barista ${i}`,
        email: `barista${i}@test.com`,
        role: 'BARISTA',
        approved: true
      });
      baristas.push(barista);
    }
    
    // Create test judges
    const judges = [];
    for (let i = 1; i <= numJudges; i++) {
      const judge = await storage.createUser({
        name: `Test Judge ${i}`,
        email: `judge${i}@test.com`,
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
    
    // Add judges as participants
    for (let i = 0; i < judges.length; i++) {
      await storage.addParticipant({
        tournamentId: tournament.id,
        userId: judges[i].id,
        seed: i + 1
      });
    }
    
    // Ensure stations exist
    const existingStations = await storage.getAllStations();
    if (existingStations.length < 3) {
      await storage.createStation({ name: 'A', status: 'AVAILABLE', nextAvailableAt: new Date() });
      await storage.createStation({ name: 'B', status: 'AVAILABLE', nextAvailableAt: new Date() });
      await storage.createStation({ name: 'C', status: 'AVAILABLE', nextAvailableAt: new Date() });
    }
    
    res.json({
      success: true,
      tournament,
      baristasCreated: baristas.length,
      judgesCreated: judges.length,
      message: `Test data created: Tournament "${tournamentName}" with ${baristas.length} baristas and ${judges.length} judges`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CLEAR TEST DATA =====
router.delete('/clear-test-data', async (req, res) => {
  try {
    // Get all test tournaments (those with "Test" in the name)
    const allTournaments = await storage.getAllTournaments();
    const testTournaments = allTournaments.filter(t => 
      t.name.toLowerCase().includes('test') || 
      t.name.toLowerCase().includes('demo')
    );
    
    let cleared = 0;
    for (const tournament of testTournaments) {
      await storage.clearTournamentData(tournament.id);
      cleared++;
    }
    
    res.json({
      success: true,
      tournamentsCleared: cleared,
      message: `Cleared ${cleared} test tournament(s)`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

