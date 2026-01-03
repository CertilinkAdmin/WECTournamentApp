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
import { eq, inArray, like, or, sql, and } from 'drizzle-orm';
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
    // Use local image paths only (no hardcoded external URLs)
    if (carouselImages.length === 0) {
      carouselImages = [
        '/images/wec.png',
        '/images/wec3.png',
        '/images/wec4.png',
        '/images/MJ106371 copy.jpg',
        '/images/MJ106438 copy.jpg',
        '/images/MJ106534 copy.jpg',
        '/images/MJ106643 copy.jpg',
      ];
    }
    res.json(carouselImages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Shuffle carousel images - MUST be before /carousel POST route
router.post('/carousel/shuffle', async (req, res) => {
  try {
    if (carouselImages.length <= 1) {
      return res.status(400).json({ error: 'Need at least 2 images to shuffle' });
    }

    // Fisher-Yates shuffle algorithm
    const shuffled = [...carouselImages];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    carouselImages = shuffled;
    res.json({ success: true, images: carouselImages });
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
    
    // Create 9 test station leads
    const stationLeads = [];
    for (let i = 1; i <= 9; i++) {
      const stationLead = await storage.createUser({
        name: `Test Station Lead ${i}`,
        email: `test-stationlead-${tournament.id}-${i}-${timestamp}@test.com`,
        role: 'STATION_LEAD',
        approved: true
      });
      stationLeads.push(stationLead);
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
    
    // Create tournament-specific stations based on enabledStations
    const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
    const createdStations = [];
    for (const name of enabledStations) {
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
      stationLeadsCreated: stationLeads.length,
      stationsCreated: createdStations.length,
      message: `Test tournament "${testTournamentName}" created with ${baristas.length} baristas, ${judges.length} judges, ${stationLeads.length} station leads, and ${createdStations.length} stations`
    });
  } catch (error: any) {
    console.error('Error creating test data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== CLEAR TEST DATA =====
router.delete('/clear-test-data', async (req, res) => {
  try {
    console.log('Starting test data cleanup...');
    
    // Get all tournaments
    const allTournaments = await storage.getAllTournaments();
    console.log(`Found ${allTournaments.length} total tournaments`);
    
    // Identify test tournaments by:
    // 1. Name containing "test" or "demo" (case-insensitive)
    // 2. Having participants with test email addresses (@test.com or test- prefix)
    const testTournamentIds = new Set<number>();
    const testTournamentNames: string[] = [];
    
    // First, find tournaments by name (case-insensitive)
    allTournaments.forEach(t => {
      const nameLower = t.name.toLowerCase();
      if (nameLower.includes('test') || nameLower.includes('demo')) {
        testTournamentIds.add(t.id);
        testTournamentNames.push(t.name);
        console.log(`Found test tournament by name: ${t.name} (ID: ${t.id})`);
      }
    });
    
    // Also find tournaments that have test users (even if name doesn't contain "test")
    // Test users have emails like: test-barista-{tournamentId}-{index}-{timestamp}@test.com
    // or: test-judge-{tournamentId}-{index}-{timestamp}@test.com
    // or: test-stationlead-{tournamentId}-{index}-{timestamp}@test.com
    
    // Get all users with test email patterns
    const allUsersList = await db.select()
      .from(users)
      .where(
        or(
          like(users.email, '%@test.com'),
          like(users.email, 'test-%')
        )
      );
    
    console.log(`Found ${allUsersList.length} test users`);
    const testUserIds = new Set(allUsersList.map(u => u.id));
    
    // Find tournaments that have test users as participants
    if (testUserIds.size > 0) {
      const allParticipants = await db.select()
        .from(tournamentParticipants)
        .where(inArray(tournamentParticipants.userId, Array.from(testUserIds)));
      
      console.log(`Found ${allParticipants.length} test user participants`);
      
      allParticipants.forEach(p => {
        if (!testTournamentIds.has(p.tournamentId)) {
          const tournament = allTournaments.find(t => t.id === p.tournamentId);
          if (tournament) {
            testTournamentIds.add(p.tournamentId);
            testTournamentNames.push(tournament.name);
            console.log(`Found test tournament by test user: ${tournament.name} (ID: ${tournament.id})`);
          }
        }
      });
    }
    
    const testTournaments = allTournaments.filter(t => testTournamentIds.has(t.id));
    
    console.log(`Total test tournaments to clear: ${testTournaments.length}`);
    console.log(`Tournament names: ${testTournamentNames.join(', ')}`);
    
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
        console.log(`Clearing tournament: ${tournament.name} (ID: ${tournament.id})`);
        
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
        
        console.log(`Successfully cleared tournament: ${tournament.name}`);
        cleared++;
      } catch (error: any) {
        const errorMsg = `Failed to clear tournament ${tournament.id} (${tournament.name}): ${error.message}`;
        errors.push(errorMsg);
        console.error(errorMsg, error);
      }
    }
    
    // Delete all test users (those with @test.com emails or test- prefix)
    // Do this after tournaments to avoid foreign key issues
    try {
      const deletedUsers = await db.delete(users).where(
        or(
          like(users.email, '%@test.com'),
          like(users.email, 'test-%')
        )
      ).returning();
      
      console.log(`Deleted ${deletedUsers.length} test users`);
    } catch (error: any) {
      console.error('Error deleting test users:', error);
      errors.push(`Failed to delete some test users: ${error.message}`);
    }
    
    const message = `Cleared ${cleared} test tournament(s): ${testTournamentNames.join(', ')}${errors.length > 0 ? ` (${errors.length} error(s))` : ''}`;
    console.log(message);
    
    res.json({
      success: true,
      tournamentsCleared: cleared,
      tournamentNames: testTournamentNames,
      errors: errors.length > 0 ? errors : undefined,
      message
    });
  } catch (error: any) {
    console.error('Error in clear-test-data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ===== DATABASE TABLE MANAGEMENT =====
// Get list of all database tables with row counts
router.get('/database/tables', async (req, res) => {
  try {
    const tableNames = [
      'users',
      'tournaments',
      'tournament_participants',
      'matches',
      'stations',
      'heat_segments',
      'heat_judges',
      'heat_scores',
      'judge_detailed_scores',
      'tournament_round_times',
      'match_cup_positions'
    ];

    const tables = await Promise.all(
      tableNames.map(async (tableName) => {
        try {
          const result = await db.execute(
            sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
          );
          const count = result.rows[0]?.count || 0;
          return { name: tableName, rowCount: parseInt(count as string, 10) };
        } catch (error) {
          return { name: tableName, rowCount: 0, error: 'Unable to read' };
        }
      })
    );

    res.json({ tables });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get table data with pagination
router.get('/database/tables/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = (page - 1) * limit;

    // Validate table name to prevent SQL injection
    const validTables = [
      'users',
      'tournaments',
      'tournament_participants',
      'matches',
      'stations',
      'heat_segments',
      'heat_judges',
      'heat_scores',
      'judge_detailed_scores',
      'tournament_round_times',
      'match_cup_positions'
    ];

    if (!validTables.includes(tableName)) {
      return res.status(400).json({ error: 'Invalid table name' });
    }

    // Get total count
    const countResult = await db.execute(
      sql.raw(`SELECT COUNT(*) as count FROM ${tableName}`)
    );
    const totalCount = parseInt(countResult.rows[0]?.count as string, 10);

    // Get table data
    const dataResult = await db.execute(
      sql.raw(`SELECT * FROM ${tableName} ORDER BY id DESC LIMIT ${limit} OFFSET ${offset}`)
    );

    // Get column names
    const columnsResult = await db.execute(
      sql.raw(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '${tableName}' ORDER BY ordinal_position`)
    );

    res.json({
      tableName,
      columns: columnsResult.rows,
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ===== USER MANAGEMENT =====
// Create user
router.post('/users', async (req, res) => {
  try {
    const { name, email, role } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const newUser = await storage.createUser({
      name,
      email,
      role: role || 'BARISTA',
      approved: false,
    });

    res.json({ success: true, user: newUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Check if user exists
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is referenced in tournament_participants
    const participants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.userId, userId))
      .limit(1);

    if (participants.length > 0) {
      return res.status(400).json({
        error: 'Cannot delete user: user is registered in tournaments. Remove from tournaments first.',
      });
    }

    // Delete user
    await db.delete(users).where(eq(users.id, userId));

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update user role
router.patch('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const { role, approved } = req.body;

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: any = {};
    if (role) updateData.role = role;
    if (approved !== undefined) updateData.approved = approved;

    const updatedUser = await storage.updateUser(userId, updateData);
    res.json({ success: true, user: updatedUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Approve user
router.post('/users/:id/approve', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user approval status
    await storage.updateUser(userId, { approved: true });

    // If user is a tournament participant, update their seed (approve them for tournament)
    const userParticipants = await db
      .select()
      .from(tournamentParticipants)
      .where(
        and(
          eq(tournamentParticipants.userId, userId),
          eq(tournamentParticipants.seed, 0)
        )
      );

    // Assign next available seed for each tournament they're in
    for (const participant of userParticipants) {
      const allTournamentParticipants = await db
        .select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, participant.tournamentId));

      const maxSeed = Math.max(
        0,
        ...allTournamentParticipants
          .filter(p => p.seed > 0)
          .map(p => p.seed)
      );

      await storage.updateParticipantSeed(participant.id, maxSeed + 1);
    }

    res.json({ success: true, message: 'User approved successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Reject user
router.post('/users/:id/reject', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user approval status to false
    await storage.updateUser(userId, { approved: false });

    // Remove user from tournament participants (set seed to 0)
    const participants = await db
      .select()
      .from(tournamentParticipants)
      .where(eq(tournamentParticipants.userId, userId));

    for (const participant of participants) {
      await storage.updateParticipantSeed(participant.id, 0);
    }

    res.json({ success: true, message: 'User rejected' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

