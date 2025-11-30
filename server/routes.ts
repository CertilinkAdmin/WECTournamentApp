import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";
import { BracketGenerator } from "./bracketGenerator";
import tournamentRoutes from "./routes/tournament";
import { registerBracketRoutes } from "./routes/bracket";
import adminRoutes from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import {
  insertTournamentSchema, insertTournamentParticipantSchema,
  insertStationSchema, insertMatchSchema, insertHeatScoreSchema,
  insertUserSchema, insertHeatSegmentSchema, insertHeatJudgeSchema,
  tournamentParticipants, heatJudges, matches
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket setup
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Store io instance for use in routes
  app.set("io", io);

  // Tournament routes are handled below in the existing routes

  // WebSocket connection handling
  io.on("connection", (socket: any) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });

    socket.on("join:tournament", (tournamentId: number) => {
      socket.join(`tournament:${tournamentId}`);
      console.log(`Socket ${socket.id} joined tournament ${tournamentId}`);
    });

    socket.on("join", (room: string) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });
  });

  // ===== USER ROUTES =====
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/users", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.patch("/api/users", async (req, res) => {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'User id is required' });
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== PERSONS ROUTES (Legacy compatibility - maps to users) =====
  app.get("/api/persons", async (req, res) => {
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post("/api/persons", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/persons", async (req, res) => {
    try {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ error: 'User id is required' });
      }
      const user = await storage.updateUser(id, updateData);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== ADMIN ROUTES =====
  app.use("/api/admin", adminRoutes);

  // ===== BRACKET ROUTES =====
  registerBracketRoutes(app);

  // ===== AUTH ROUTES =====
  registerAuthRoutes(app);

  // ===== TOURNAMENT ROUTES =====

  // Assign station leads to tournament stations
  app.post("/api/tournaments/:id/assign-station-leads", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      // Get tournament participants (station leads) - only those approved for this tournament (seed > 0)
      const allParticipants = await storage.getTournamentParticipants(tournamentId);
      const allUsers = await storage.getAllUsers();

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
      const tournamentStations = await storage.getAllStations();
      const stationsABC = tournamentStations
        .filter(s => s.tournamentId === tournamentId && ['A', 'B', 'C'].includes(s.name))
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

        await storage.updateStation(station.id, { stationLeadId: stationLead.id });
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

  // Assign judges to all heats in a tournament
  app.post("/api/tournaments/:id/assign-judges", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      // Get tournament participants (judges) - only those approved for this tournament (seed > 0)
      const allParticipants = await storage.getTournamentParticipants(tournamentId);
      const allUsers = await storage.getAllUsers();

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
      const tournamentMatches = await storage.getTournamentMatches(tournamentId);

      if (tournamentMatches.length === 0) {
        return res.status(400).json({ error: 'No matches found for this tournament' });
      }

      // Shuffle judges array for randomization
      const shuffledJudges = [...judges].sort(() => Math.random() - 0.5);

      let assignedCount = 0;
      let judgeIndex = 0;

      for (const match of tournamentMatches) {
        // Skip if match already has judges assigned
        const existingJudges = await storage.getMatchJudges(match.id);

        if (existingJudges.length > 0) {
          // Delete existing judges for this match first
          for (const existingJudge of existingJudges) {
            await db.delete(heatJudges).where(eq(heatJudges.id, existingJudge.id));
          }
        }

        // Assign 3 judges: 2 ESPRESSO (TECHNICAL), 1 CAPPUCCINO (SENSORY)
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

        // Create judge assignments
        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[0].id,
          role: 'HEAD' // First ESPRESSO judge
        });

        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[1].id,
          role: 'HEAD' // Second ESPRESSO judge
        });

        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[2].id,
          role: 'SENSORY' // CAPPUCCINO judge
        });

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

  app.post("/api/tournaments", async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);

      // Create tournament-specific stations (with tournament_id)
      await storage.createStation({
        tournamentId: tournament.id,
        name: "A",
        status: "AVAILABLE",
        nextAvailableAt: new Date()
      });
      await storage.createStation({
        tournamentId: tournament.id,
        name: "B",
        status: "AVAILABLE",
        nextAvailableAt: new Date()
      });
      await storage.createStation({
        tournamentId: tournament.id,
        name: "C",
        status: "AVAILABLE",
        nextAvailableAt: new Date()
      });

      io.emit("tournament:created", tournament);
      res.json(tournament);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments", async (req, res) => {
    const tournaments = await storage.getAllTournaments();
    res.json(tournaments);
  });

  app.get("/api/tournaments/:id", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      console.log('Fetching tournament with ID:', tournamentId);

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Get participants with user info
      const participants = await storage.getTournamentParticipants(tournamentId);
      const allUsers = await storage.getAllUsers();
      const participantsWithInfo = participants.map((p) => {
        const user = allUsers.find(u => u.id === p.userId);
        return {
          id: p.id,
          seed: p.seed,
          finalRank: p.finalRank,
          userId: p.userId,
          name: user?.name || '',
          email: user?.email || ''
        };
      });

      // Get matches with competitor names
      const matches = await storage.getTournamentMatches(tournamentId);
      const matchesWithNames = matches.map((m) => {
        let competitor1Name = '';
        let competitor2Name = '';

        if (m.competitor1Id) {
          const comp1 = allUsers.find(u => u.id === m.competitor1Id);
          competitor1Name = comp1?.name || '';
        }

        if (m.competitor2Id) {
          const comp2 = allUsers.find(u => u.id === m.competitor2Id);
          competitor2Name = comp2?.name || '';
        }

        return {
          ...m,
          competitor1Name,
          competitor2Name
        };
      });

      // Get scores with judge names for all matches
      const scoresPromises = matches.map(m => storage.getMatchScores(m.id));
      const scoresArrays = await Promise.all(scoresPromises);
      const allMatchScores = scoresArrays.flat();
      const scoresWithJudgeNames = allMatchScores.map((s) => {
        const judge = allUsers.find(u => u.id === s.judgeId);
        return {
          ...s,
          judgeName: judge?.name || 'Unknown Judge'
        };
      });

      // Get detailed scores for all matches
      const detailedScoresPromises = matches.map(m => storage.getMatchDetailedScores(m.id));
      const detailedScoresArrays = await Promise.all(detailedScoresPromises);
      const detailedScoresForTournament = detailedScoresArrays.flat();

      res.json({
        tournament,
        participants: participantsWithInfo,
        matches: matchesWithNames,
        scores: scoresWithJudgeNames,
        detailedScores: detailedScoresForTournament
      });
    } catch (error: any) {
      console.error('Error in getTournament:', error);
      res.status(500).json({ error: "Internal server error", details: error.message });
    }
  });

  app.patch("/api/tournaments/:id", async (req, res) => {
    try {
      const tournament = await storage.updateTournament(parseInt(req.params.id), req.body);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      io.to(`tournament:${tournament.id}`).emit("tournament:updated", tournament);
      res.json(tournament);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== PARTICIPANT ROUTES =====
  app.post("/api/tournaments/:id/participants", async (req, res) => {
    try {
      const participantData = insertTournamentParticipantSchema.parse({
        ...req.body,
        tournamentId: parseInt(req.params.id)
      });
      const participant = await storage.addParticipant(participantData);
      io.to(`tournament:${participant.tournamentId}`).emit("participant:added", participant);
      res.json(participant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:id/participants", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { includeJudges } = req.query; // Optional query param to include judges
      const participants = await storage.getTournamentParticipants(tournamentId);

      if (includeJudges === 'true') {
        // Return all participants including judges
        res.json(participants);
      } else {
        // Filter to only return baristas (competitors), not judges
        const allUsers = await storage.getAllUsers();
        const baristaParticipants = participants.filter(participant => {
          const user = allUsers.find(u => u.id === participant.userId);
          return user?.role === 'BARISTA';
        });
        res.json(baristaParticipants);
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Update participant seed
  app.patch("/api/tournaments/:id/participants/:participantId/seed", async (req, res) => {
    try {
      const participantId = parseInt(req.params.participantId);
      const { seed } = req.body;

      if (typeof seed !== 'number') {
        return res.status(400).json({ error: "Seed must be a number" });
      }

      const participant = await storage.updateParticipantSeed(participantId, seed);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      io.to(`tournament:${participant.tournamentId}`).emit("participant:updated", participant);
      res.json(participant);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Delete participant
  app.delete("/api/tournaments/:id/participants/:participantId", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const participantId = parseInt(req.params.participantId);

      // Get participant first to verify it exists and belongs to tournament
      const participants = await storage.getTournamentParticipants(tournamentId);
      const participant = participants.find(p => p.id === participantId);

      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }

      // Delete from database
      await db.delete(tournamentParticipants).where(eq(tournamentParticipants.id, participantId));

      io.to(`tournament:${tournamentId}`).emit("participant:removed", { participantId, tournamentId });
      res.json({ success: true, participantId });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate tournament bracket (Round 1 only)
  app.post('/api/tournaments/:id/generate-bracket', async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      if (!tournamentId) {
        return res.status(400).json({ error: 'Invalid tournament ID' });
      }

      // Get all participants for this tournament
      const allParticipants = await db.select()
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.tournamentId, tournamentId))
        .orderBy(tournamentParticipants.seed);

      if (allParticipants.length === 0) {
        return res.status(400).json({ error: 'No participants found for tournament' });
      }

      // Filter to only baristas (competitors) with seeds > 0
      const allUsers = await storage.getAllUsers();
      const baristaParticipants = allParticipants.filter(participant => {
        const user = allUsers.find(u => u.id === participant.userId);
        return user?.role === 'BARISTA' && participant.seed && participant.seed > 0;
      });

      console.log(`Found ${allParticipants.length} total participants, ${baristaParticipants.length} barista competitors with seeds > 0`);

      if (baristaParticipants.length < 2) {
        return res.status(400).json({ 
          error: `Need at least 2 barista competitors with seeds > 0. Found: ${baristaParticipants.length}` 
        });
      }

      // Re-sequence seeds to be consecutive starting from 1
      const sortedBaristas = [...baristaParticipants].sort((a, b) => a.seed - b.seed);
      const resequencedBaristas = sortedBaristas.map((participant, index) => ({
        ...participant,
        seed: index + 1
      }));

      console.log('Resequenced baristas:', resequencedBaristas.map(p => ({ id: p.id, seed: p.seed, userId: p.userId })));

      const bracketResult = await BracketGenerator.generateBracket(tournamentId, resequencedBaristas);

      // Verify Round 1 matches were created
      const round1Matches = await db.select()
        .from(matches)
        .where(and(
          eq(matches.tournamentId, tournamentId),
          eq(matches.round, 1)
        ));

      console.log(`✅ Verified ${round1Matches.length} Round 1 matches in database`);

      res.json({ 
        success: true, 
        message: `Round 1 bracket generated successfully for ${resequencedBaristas.length} participants`,
        matchesCreated: bracketResult.round1Matches,
        totalMatches: bracketResult.totalMatches,
        round1Matches: round1Matches.length,
        round: 1
      });
    } catch (error: any) {
      console.error('Error generating bracket:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Generate next round from completed round
  app.post('/api/tournaments/:id/generate-next-round', async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { completedRound } = req.body;

      if (!tournamentId) {
        return res.status(400).json({ error: 'Invalid tournament ID' });
      }

      if (!completedRound || typeof completedRound !== 'number') {
        return res.status(400).json({ error: 'Invalid completed round number' });
      }

      await BracketGenerator.generateNextRound(tournamentId, completedRound);

      res.json({ 
        success: true, 
        message: `Next round generated successfully from completed round ${completedRound}` 
      });
    } catch (error: any) {
      console.error('Error generating next round:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Clear tournament data
  app.delete("/api/tournaments/:id/clear", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      // Clear all tournament-related data
      await storage.clearTournamentData(tournamentId);

      io.to(`tournament:${tournamentId}`).emit("tournament:cleared", { tournamentId });

      res.json({ success: true, message: "Tournament data cleared successfully" });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Randomize participant seeds
  app.post("/api/tournaments/:id/randomize-seeds", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { seedAssignments } = req.body; // Optional: accept specific seed assignments

      const allParticipants = await storage.getTournamentParticipants(tournamentId);

      // Filter to only baristas (competitors), not judges
      const allUsers = await storage.getAllUsers();
      const baristaParticipants = allParticipants.filter(participant => {
        const user = allUsers.find(u => u.id === participant.userId);
        return user?.role === 'BARISTA';
      });

      if (baristaParticipants.length === 0) {
        return res.status(400).json({ error: "No barista participants found to randomize" });
      }

      let randomized: typeof baristaParticipants;

      // If specific seed assignments provided, use them; otherwise randomize
      if (seedAssignments && Array.isArray(seedAssignments)) {
        // Validate seed assignments
        const participantIds = new Set(baristaParticipants.map(p => p.id));
        const assignmentIds = new Set(seedAssignments.map((a: any) => a.participantId));

        if (participantIds.size !== assignmentIds.size ||
          !Array.from(participantIds).every(id => assignmentIds.has(id))) {
          return res.status(400).json({ error: "Invalid seed assignments" });
        }

        randomized = seedAssignments.map((assignment: { participantId: number; seed: number }) => {
          const participant = baristaParticipants.find(p => p.id === assignment.participantId);
          if (!participant) throw new Error(`Participant ${assignment.participantId} not found`);
          return { ...participant, seed: assignment.seed };
        });
      } else {
        // Use Fisher-Yates shuffle - only on baristas
        randomized = BracketGenerator.randomizeSeeds(baristaParticipants, allUsers);
      }

      // Persist the randomized seeds and cup codes to database (only for baristas)
      for (const participant of randomized) {
        if (participant.cupCode) {
          await storage.updateParticipantSeedAndCupCode(participant.id, participant.seed, participant.cupCode);
        } else {
          await storage.updateParticipantSeed(participant.id, participant.seed);
        }
      }

      // Get updated participants from database
      const updatedParticipants = await storage.getTournamentParticipants(tournamentId);

      io.to(`tournament:${tournamentId}`).emit("seeds:randomized", updatedParticipants);

      res.json(updatedParticipants);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== SEGMENT TIME CONFIGURATION =====
  // Get round times for a tournament
  app.get("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const times = await storage.getTournamentRoundTimes(tournamentId);
      res.json(times);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get round times for tournament
  app.get("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const roundTimes = await storage.getTournamentRoundTimes(tournamentId);
      res.json(roundTimes);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set heat structure (tournament-wide timing configuration)
  app.post("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { round = 1, dialInMinutes, cappuccinoMinutes, espressoMinutes } = req.body;

      const totalMinutes = dialInMinutes + cappuccinoMinutes + espressoMinutes;

      // Check if heat structure already exists
      const existingStructure = await storage.getRoundTimes(tournamentId, 1);

      let heatStructure;
      if (existingStructure) {
        // Update existing structure
        heatStructure = await storage.updateRoundTimes(tournamentId, 1, {
          dialInMinutes,
          cappuccinoMinutes,
          espressoMinutes,
          totalMinutes
        });
      } else {
        // Create new structure
        heatStructure = await storage.setRoundTimes({
          tournamentId,
          round: 1, // Always use round 1 as the template
          dialInMinutes,
          cappuccinoMinutes,
          espressoMinutes,
          totalMinutes
        });
      }

      io.to(`tournament:${tournamentId}`).emit("heat-structure:updated", heatStructure);
      res.json(heatStructure);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Get match segments
  app.get("/api/matches/:id/segments", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const segments = await storage.getMatchSegments(matchId);
      res.json(segments);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== STATION ROUTES =====
  app.get("/api/stations", async (req, res) => {
    const stations = await storage.getAllStations();
    res.json(stations);
  });

  app.get("/api/stations/:id/matches", async (req, res) => {
    try {
      const stationId = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;

      const matches = await storage.getStationMatches(stationId, limit, offset);
      res.json(matches);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/stations/:id", async (req, res) => {
    try {
      const station = await storage.updateStation(parseInt(req.params.id), req.body);
      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }
      io.emit("station:updated", station);
      res.json(station);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== MATCH ROUTES =====
  app.post("/api/matches", async (req, res) => {
    try {
      const matchData = insertMatchSchema.parse(req.body);
      const match = await storage.createMatch(matchData);

      // Create heat segments
      await storage.createHeatSegment({
        matchId: match.id,
        segment: "DIAL_IN",
        status: "IDLE",
        plannedMinutes: 2
      });
      await storage.createHeatSegment({
        matchId: match.id,
        segment: "CAPPUCCINO",
        status: "IDLE",
        plannedMinutes: 2
      });
      await storage.createHeatSegment({
        matchId: match.id,
        segment: "ESPRESSO",
        status: "IDLE",
        plannedMinutes: 1
      });

      io.to(`tournament:${match.tournamentId}`).emit("match:created", match);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/tournaments/:id/matches", async (req, res) => {
    const matches = await storage.getTournamentMatches(parseInt(req.params.id));
    res.json(matches);
  });

  app.get("/api/matches/:id", async (req, res) => {
    const match = await storage.getMatch(parseInt(req.params.id));
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }
    res.json(match);
  });

  app.patch("/api/matches/:id", async (req, res) => {
    try {
      const updateData = { ...req.body };

      // Convert ISO string dates to Date objects for timestamp fields
      if (updateData.startTime && typeof updateData.startTime === 'string') {
        updateData.startTime = new Date(updateData.startTime);
      }
      if (updateData.endTime && typeof updateData.endTime === 'string') {
        updateData.endTime = new Date(updateData.endTime);
      }

      const match = await storage.updateMatch(parseInt(req.params.id), updateData);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }
      io.to(`tournament:${match.tournamentId}`).emit("match:updated", match);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== HEAT SEGMENT ROUTES =====
  app.get("/api/matches/:id/segments", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      if (isNaN(matchId)) {
        return res.status(400).json({ error: "Invalid match ID" });
      }
      const segments = await storage.getMatchSegments(matchId);
      res.json(segments || []);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/segments/:id", async (req, res) => {
    try {
      const segmentId = parseInt(req.params.id);
      const updateData = { ...req.body };

      // Convert ISO string dates to Date objects for timestamp fields
      if (updateData.startTime && typeof updateData.startTime === 'string') {
        updateData.startTime = new Date(updateData.startTime);
      }
      if (updateData.endTime && typeof updateData.endTime === 'string') {
        updateData.endTime = new Date(updateData.endTime);
      }

      // Get the current segment to check its match and status
      const segment = await storage.getHeatSegment(segmentId);

      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // If starting a segment (status changing to RUNNING), validate segment order
      if (updateData.status === 'RUNNING' && segment.status !== 'RUNNING') {
        const matchId = segment.matchId;
        const segments = await storage.getMatchSegments(matchId);

        // Validate segment order
        const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
        const currentIndex = segmentOrder.indexOf(segment.segment);

        if (currentIndex > 0) {
          const previousSegmentCode = segmentOrder[currentIndex - 1];
          const previousSegment = segments.find(s => s.segment === previousSegmentCode);

          if (previousSegment && previousSegment.status !== 'ENDED') {
            return res.status(400).json({
              error: `Previous segment ${previousSegmentCode} must be completed before starting ${segment.segment}`
            });
          }
        }

        // Set startTime if not provided
        if (!updateData.startTime) {
          updateData.startTime = new Date();
        }
      }

      // If ending a segment (status changing to ENDED), set endTime
      if (updateData.status === 'ENDED' && segment.status !== 'ENDED') {
        if (!updateData.endTime) {
          updateData.endTime = new Date();
        }
      }

      const updatedSegment = await storage.updateHeatSegment(segmentId, updateData);
      if (!updatedSegment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Emit appropriate socket events
      const match = await storage.getMatch(segment.matchId);
      if (match) {
        if (updateData.status === 'RUNNING') {
          io.to(`tournament:${match.tournamentId}`).emit("segment:started", updatedSegment);
        } else if (updateData.status === 'ENDED') {
          io.to(`tournament:${match.tournamentId}`).emit("segment:ended", updatedSegment);
        } else {
          io.to(`tournament:${match.tournamentId}`).emit("segment:updated", updatedSegment);
        }
      }

      res.json(updatedSegment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== JUDGE ROUTES =====
  app.post("/api/matches/:id/judges", async (req, res) => {
    try {
      const judgeData = insertHeatJudgeSchema.parse({
        ...req.body,
        matchId: parseInt(req.params.id)
      });
      const judge = await storage.assignJudge(judgeData);
      res.json(judge);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/matches/:id/judges", async (req, res) => {
    const judges = await storage.getMatchJudges(parseInt(req.params.id));
    res.json(judges);
  });

  // Get all matches a judge is assigned to
  app.get("/api/judges/:judgeId/matches", async (req, res) => {
    try {
      const judgeId = parseInt(req.params.judgeId);
      const judgeMatches = await db.select({
        match: matches,
        role: heatJudges.role,
      })
        .from(heatJudges)
        .innerJoin(matches, eq(heatJudges.matchId, matches.id))
        .where(eq(heatJudges.judgeId, judgeId));

      res.json(judgeMatches.map(jm => ({
        ...jm.match,
        judgeRole: jm.role,
      })));
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // ===== SCORING ROUTES =====
  app.post("/api/scores", async (req, res) => {
    try {
      const scoreData = insertHeatScoreSchema.parse(req.body);
      const score = await storage.submitScore(scoreData);

      // Get match to emit to correct tournament room
      const match = await storage.getMatch(score.matchId);
      if (match) {
        io.to(`tournament:${match.tournamentId}`).emit("score:submitted", score);
      }

      res.json(score);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/matches/:id/scores", async (req, res) => {
    const scores = await storage.getMatchScores(parseInt(req.params.id));
    res.json(scores);
  });

  // Detailed judge scores
  app.post("/api/detailed-scores", async (req, res) => {
    try {
      const { insertJudgeDetailedScoreSchema } = await import("@shared/schema");
      const scoreData = insertJudgeDetailedScoreSchema.parse(req.body);
      const score = await storage.submitDetailedScore(scoreData);

      // Get match to emit to correct tournament room
      const match = await storage.getMatch(score.matchId);
      if (match) {
        io.to(`tournament:${match.tournamentId}`).emit("detailed-score:submitted", score);
      }

      res.json(score);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Batch submit detailed scores
  app.post("/api/detailed-scores/batch", async (req, res) => {
    try {
      const { insertJudgeDetailedScoreSchema } = await import("@shared/schema");
      const z = await import("zod");
      const batchSchema = z.z.array(insertJudgeDetailedScoreSchema);
      const scoresData = batchSchema.parse(req.body);
      const scores = await storage.submitBatchDetailedScores(scoresData);

      // Emit to tournament room if match exists
      if (scores.length > 0) {
        const match = await storage.getMatch(scores[0].matchId);
        if (match) {
          io.to(`tournament:${match.tournamentId}`).emit("detailed-scores:batch-submitted", scores);
        }
      }

      res.json(scores);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/matches/:id/detailed-scores", async (req, res) => {
    const scores = await storage.getMatchDetailedScores(parseInt(req.params.id));
    res.json(scores);
  });

  // Match Cup Positions - Admin assignment of left/right positions to cup codes
  app.post("/api/matches/:matchId/cup-positions", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);

      // Validate match exists
      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: 'Match not found' });
      }

      // Validate all judges have scored both CAPPUCCINO and ESPRESSO
      const cappuccinoStatus = await storage.getJudgeCompletionStatus(matchId, 'CAPPUCCINO');
      const espressoStatus = await storage.getJudgeCompletionStatus(matchId, 'ESPRESSO');

      if (!cappuccinoStatus.allComplete || !espressoStatus.allComplete) {
        return res.status(400).json({ 
          error: 'All judges must complete scoring before assigning cup positions',
          cappuccinoStatus,
          espressoStatus
        });
      }

      // Validate request body
      const { positions, assignedBy } = req.body;
      if (!Array.isArray(positions) || positions.length !== 2) {
        return res.status(400).json({ error: 'Must provide exactly 2 cup positions (left and right)' });
      }

      // Validate positions have required fields
      for (const pos of positions) {
        if (!pos.cupCode || !pos.position || !['left', 'right'].includes(pos.position)) {
          return res.status(400).json({ error: 'Each position must have cupCode and position (left or right)' });
        }
      }

      // Validate both left and right are present
      const hasLeft = positions.some(p => p.position === 'left');
      const hasRight = positions.some(p => p.position === 'right');
      if (!hasLeft || !hasRight) {
        return res.status(400).json({ error: 'Must assign both left and right positions' });
      }

      // Get current user if available (for assignedBy)
      const currentUser = (req as any).user;
      const assignedById = assignedBy || (currentUser?.id ? parseInt(currentUser.id) : undefined);

      // Set cup positions
      const result = await storage.setMatchCupPositions(matchId, positions, assignedById);

      // Emit to tournament room
      const updatedMatch = await storage.getMatch(matchId);
      if (updatedMatch) {
        io.to(`tournament:${updatedMatch.tournamentId}`).emit("cup-positions:assigned", {
          matchId,
          positions: result
        });
      }

      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to assign cup positions' });
    }
  });

  app.get("/api/matches/:matchId/cup-positions", async (req, res) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const positions = await storage.getMatchCupPositions(matchId);
      res.json(positions);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Failed to get cup positions' });
    }
  });

  // Get judge completion status for a segment
  app.get("/api/matches/:id/segments/:segmentCode/judges-completion", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const segmentCode = req.params.segmentCode.toUpperCase();

      // Validate segment code
      if (segmentCode !== 'CAPPUCCINO' && segmentCode !== 'ESPRESSO') {
        return res.status(400).json({ 
          error: "Invalid segment code. Must be CAPPUCCINO or ESPRESSO" 
        });
      }

      const completionStatus = await storage.getJudgeCompletionStatus(
        matchId, 
        segmentCode as 'CAPPUCCINO' | 'ESPRESSO'
      );

      res.json(completionStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // ===== TOURNAMENT MODE MANAGEMENT =====
  // Get tournament mode status
  app.get("/api/tournament-mode/:tournamentId/status", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const tournament = await storage.getTournament(tournamentId);

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Tournament mode is active if status is not SETUP
      const isActive = tournament.status !== 'SETUP';

      res.json({
        tournamentId,
        isActive,
        status: tournament.status,
        currentRound: tournament.currentRound,
        totalRounds: tournament.totalRounds
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Activate tournament mode
  app.post("/api/tournament-mode/:tournamentId/activate", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const tournament = await storage.updateTournament(tournamentId, {
        status: 'ACTIVE',
        startDate: new Date()
      });

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Assign cup codes to participants who don't have them yet
      const allParticipants = await storage.getTournamentParticipants(tournamentId);
      const allUsers = await storage.getAllUsers();

      // Filter to only baristas (competitors)
      const baristaParticipants = allParticipants.filter(participant => {
        const user = allUsers.find(u => u.id === participant.userId);
        return user?.role === 'BARISTA';
      });

      // Assign cup codes to participants missing them
      for (const participant of baristaParticipants) {
        if (!participant.cupCode && participant.seed > 0) {
          const user = allUsers.find(u => u.id === participant.userId);
          if (user) {
            const cupCode = BracketGenerator.generateCupCode(user.name, participant.seed, participant.seed - 1);
            await storage.updateParticipantCupCode(participant.id, cupCode);
          }
        }
      }

      // Assign station leads to stations (A, B, C)
      try {
        const allParticipants = await storage.getTournamentParticipants(tournamentId);
        const allUsers = await storage.getAllUsers();

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

        if (stationLeads.length > 0) {
          // Get all stations for this tournament
          const tournamentStations = await storage.getAllStations();
          const stationsABC = tournamentStations
            .filter(s => s.tournamentId === tournamentId && ['A', 'B', 'C'].includes(s.name))
            .sort((a, b) => a.name.localeCompare(b.name));

          if (stationsABC.length > 0) {
            // Shuffle station leads for randomization
            const shuffledLeads = [...stationLeads].sort(() => Math.random() - 0.5);

            // Assign station leads to stations (distribute evenly, wrap around if needed)
            for (let i = 0; i < stationsABC.length; i++) {
              const station = stationsABC[i];
              const stationLead = shuffledLeads[i % shuffledLeads.length];

              await storage.updateStation(station.id, { stationLeadId: stationLead.id });
            }
            console.log(`Assigned ${Math.min(stationsABC.length, stationLeads.length)} station leads to stations`);
          }
        }
      } catch (error) {
        console.warn('Failed to assign station leads:', error);
      }

      io.to(`tournament:${tournamentId}`).emit("tournament:activated", tournament);
      res.json({ success: true, tournament });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Deactivate tournament mode
  app.post("/api/tournament-mode/:tournamentId/deactivate", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.tournamentId);
      const tournament = await storage.updateTournament(tournamentId, {
        status: 'COMPLETED',
        endDate: new Date()
      });

      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      io.to(`tournament:${tournamentId}`).emit("tournament:deactivated", tournament);
      res.json({ success: true, tournament });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== HEAT CONTROL APIs =====
  // Start a heat
  app.post("/api/heats/:id/start", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const match = await storage.updateMatch(matchId, {
        status: 'RUNNING',
        startTime: new Date()
      });

      if (!match) {
        return res.status(404).json({ error: "Heat not found" });
      }

      io.to(`tournament:${match.tournamentId}`).emit("heat:started", match);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Start a segment
  app.post("/api/heats/:id/segment/:code/start", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const segmentCode = req.params.code.toUpperCase();

      const match = await storage.getMatch(matchId);
      if (!match) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Validate segment code
      const validSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      if (!validSegments.includes(segmentCode)) {
        return res.status(400).json({ error: "Invalid segment code. Must be DIAL_IN, CAPPUCCINO, or ESPRESSO" });
      }

      // Find the segment
      const segments = await storage.getMatchSegments(matchId);
      const segment = segments.find(s => s.segment === segmentCode);

      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Validate that all required segments exist for this match
      const requiredSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'] as const;
      const existingSegments = segments.map(s => s.segment);
      const missingSegments = requiredSegments.filter(seg => !existingSegments.includes(seg as any));

      if (missingSegments.length > 0) {
        return res.status(400).json({
          error: `Match is missing required segments: ${missingSegments.join(', ')}`
        });
      }

      // Check if previous segment is completed (if not the first segment)
      const segmentOrder = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      const currentIndex = segmentOrder.indexOf(segmentCode);

      if (currentIndex > 0) {
        const previousSegmentCode = segmentOrder[currentIndex - 1];
        const previousSegment = segments.find(s => s.segment === previousSegmentCode);

        if (previousSegment && previousSegment.status !== 'ENDED') {
          return res.status(400).json({
            error: `Previous segment ${previousSegmentCode} must be completed before starting ${segmentCode}`
          });
        }
      }

      // Judge completion checks for segment progression:
      // - DIAL_IN: No scoring, no judge check needed
      // - CAPPUCCINO: Can start after DIAL_IN ends (no judge check needed)  
      // - ESPRESSO: Can only start after CAPPUCCINO ends AND judges complete CAPPUCCINO scoring
      if (segmentCode === 'ESPRESSO') {
        try {
          const completionStatus = await storage.getJudgeCompletionStatus(matchId, 'CAPPUCCINO');

          if (!completionStatus.allComplete) {
            const incompleteJudges = completionStatus.judges
              .filter(j => !j.completed)
              .map(j => `${j.judgeName} (${j.role})`)
              .join(', ');

            return res.status(400).json({
              error: `Cannot start ESPRESSO segment. Judges must complete scoring for CAPPUCCINO segment first. Missing scores from: ${incompleteJudges || 'judges'}`,
              completionStatus
            });
          }
        } catch (error: any) {
          // If there's an error checking completion, log it but don't block (for now)
          console.error('Error checking judge completion:', error);
        }
      }

      const updatedSegment = await storage.updateHeatSegment(segment.id, {
        status: 'RUNNING',
        startTime: new Date()
      });

      const matchData = await storage.getMatch(matchId);
      if (matchData) {
        io.to(`tournament:${matchData.tournamentId}`).emit("segment:started", updatedSegment);

        // Broadcast station timing coordination for DIAL_IN segment
        if (segmentCode === 'DIAL_IN') {
          const station = await storage.getStation(matchData.stationId!);
          if (station && station.name === 'A') {
            io.to(`tournament:${matchData.tournamentId}`).emit("station-timing:dial-in-started", {
              stationA: { started: true, startTime: new Date() },
              stationB: { countdown: 10 * 60 }, // 10 minutes countdown
              stationC: { countdown: 20 * 60 }  // 20 minutes countdown
            });
          }
        }
      }

      res.json(updatedSegment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Stop a segment
  app.post("/api/heats/:id/segment/:code/stop", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const segmentCode = req.params.code.toUpperCase();

      // Validate segment code
      const validSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      if (!validSegments.includes(segmentCode)) {
        return res.status(400).json({ error: "Invalid segment code. Must be DIAL_IN, CAPPUCCINO, or ESPRESSO" });
      }

      // Find the segment
      const segments = await storage.getMatchSegments(matchId);
      const segment = segments.find(s => s.segment === segmentCode);

      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }

      // Validate that segment is currently running
      if (segment.status !== 'RUNNING') {
        return res.status(400).json({
          error: `Segment ${segmentCode} is not currently running. Current status: ${segment.status}`
        });
      }

      const updatedSegment = await storage.updateHeatSegment(segment.id, {
        status: 'ENDED',
        endTime: new Date()
      });

      const matchData = await storage.getMatch(matchId);
      if (matchData) {
        io.to(`tournament:${matchData.tournamentId}`).emit("segment:ended", updatedSegment);

        // Notify judges when a segment ends and scoring is needed
        // CAPPUCCINO segment ending means SENSORY judge needs to score
        // ESPRESSO segment ending means TECHNICAL and HEAD judges need to score
        if (segmentCode === 'CAPPUCCINO' || segmentCode === 'ESPRESSO') {
          const matchJudges = await storage.getMatchJudges(matchId);
          const relevantJudges = matchJudges.filter(j => {
            if (segmentCode === 'CAPPUCCINO') {
              return j.role === 'SENSORY';
            } else {
              return j.role === 'HEAD';
            }
          });

          // Emit notification to each relevant judge
          relevantJudges.forEach(judge => {
            io.to(`judge:${judge.judgeId}`).emit("judge:scoring-required", {
              matchId,
              heatNumber: matchData.heatNumber,
              round: matchData.round,
              segment: segmentCode,
              message: `Heat ${matchData.heatNumber} (Round ${matchData.round}) - ${segmentCode} segment is ready for scoring`
            });
          });
        }
      }

      res.json(updatedSegment);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Validate match segments
  app.get("/api/matches/:id/segments/validate", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);

      const segments = await storage.getMatchSegments(matchId);
      const requiredSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'] as const;
      const existingSegments = segments.map(s => s.segment);

      const missingSegments = requiredSegments.filter(seg => !existingSegments.includes(seg as any));
      const extraSegments = existingSegments.filter(seg => !requiredSegments.includes(seg as any));

      const isValid = missingSegments.length === 0 && extraSegments.length === 0;

      res.json({
        isValid,
        requiredSegments,
        existingSegments: existingSegments,
        missingSegments,
        extraSegments,
        message: isValid
          ? "Match has all required segments"
          : `Match is invalid: missing ${missingSegments.join(', ')}, extra ${extraSegments.join(', ')}`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Finalize station round - calculate winners/losers and advance to next round pool
  app.post("/api/tournaments/:id/finalize-station-round", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { stationId, round } = req.body;

      if (!stationId || !round) {
        return res.status(400).json({ error: 'Station ID and round are required' });
      }

      // Get station info
      const station = await storage.getStation(stationId);
      if (!station) {
        return res.status(404).json({ error: 'Station not found' });
      }

      // Get all matches for this station in this round
      const stationRoundMatches = await db.select()
        .from(matches)
        .where(
          and(
            eq(matches.tournamentId, tournamentId),
            eq(matches.stationId, stationId),
            eq(matches.round, round)
          )
        );

      if (stationRoundMatches.length === 0) {
        return res.status(400).json({ error: `No matches found for Station ${station.name} in Round ${round}` });
      }

      // Check if all matches are complete
      const incompleteMatches = stationRoundMatches.filter(m => m.status !== 'DONE');
      if (incompleteMatches.length > 0) {
        return res.status(400).json({ 
          error: `Not all heats are complete. ${incompleteMatches.length} heat(s) still in progress.`,
          incompleteHeats: incompleteMatches.map(m => m.heatNumber)
        });
      }

      // Get winners from this station's round
      const winners = stationRoundMatches
        .filter(m => m.winnerId)
        .map(m => m.winnerId!);

      if (winners.length === 0) {
        return res.status(400).json({ error: 'No winners found in this station\'s round. All heats must have winners declared.' });
      }

      // Get tournament to check current round
      const tournament = await db.select()
        .from(tournaments)
        .where(eq(tournaments.id, tournamentId))
        .limit(1);

      if (tournament.length === 0) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      const nextRound = round + 1;

      // Store winners for next round (they'll be used when all stations complete their rounds)
      // For now, we'll just mark that this station's round is finalized
      // The actual bracket generation happens when all stations complete via populate-next-round

      console.log(`✅ Station ${station.name} Round ${round} finalized. ${winners.length} winner(s) ready for Round ${nextRound}`);

      res.json({
        success: true,
        stationName: station.name,
        round,
        nextRound,
        winnersCount: winners.length,
        winners,
        message: `Station ${station.name} Round ${round} finalized. ${winners.length} winner(s) ready for Round ${nextRound}.`
      });
    } catch (error: any) {
      console.error('Error finalizing station round:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  });

  // Populate next round of competitors across all stations
  app.post("/api/tournaments/:id/populate-next-round", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      // Get current tournament
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      // Get all matches for the current round
      const currentMatches = await storage.getTournamentMatches(tournamentId);
      if (currentMatches.length === 0) {
        return res.status(400).json({ error: "No matches found for this tournament" });
      }

      const currentRound = Math.max(...currentMatches.map(m => m.round));
      const currentRoundMatches = currentMatches.filter(m => m.round === currentRound);

      // Get ALL stations for this tournament to verify round completion
      const allStations = await storage.getAllStations();
      const tournamentStations = allStations.filter(s => s.tournamentId === tournamentId && ['A', 'B', 'C'].includes(s.name));

      // Group current round matches by station
      const matchesByStation = new Map<number, typeof currentRoundMatches>();
      currentRoundMatches.forEach(match => {
        if (match.stationId) {
          if (!matchesByStation.has(match.stationId)) {
            matchesByStation.set(match.stationId, []);
          }
          matchesByStation.get(match.stationId)!.push(match);
        }
      });

      // Verify ALL stations have completed ALL their heats in current round
      const stationCompletionStatus = tournamentStations.map(station => {
        const stationMatches = matchesByStation.get(station.id) || [];
        const completedMatches = stationMatches.filter(m => m.status === 'DONE');
        const incompleteMatches = stationMatches.filter(m => m.status !== 'DONE');
        
        return {
          stationName: station.name,
          stationId: station.id,
          totalHeats: stationMatches.length,
          completedHeats: completedMatches.length,
          incompleteHeats: incompleteMatches.length,
          isComplete: stationMatches.length > 0 && incompleteMatches.length === 0,
          incompleteHeatNumbers: incompleteMatches.map(m => m.heatNumber)
        };
      });

      const incompleteStations = stationCompletionStatus.filter(s => !s.isComplete && s.totalHeats > 0);
      
      if (incompleteStations.length > 0) {
        const stationDetails = incompleteStations.map(s => 
          `Station ${s.stationName}: ${s.incompleteHeats} heats remaining (Heats: ${s.incompleteHeatNumbers.join(', ')})`
        ).join('; ');
        
        return res.status(400).json({ 
          error: `ALL stations must complete their heats in Round ${currentRound} before advancing. Incomplete stations: ${stationDetails}`,
          stationCompletionStatus,
          incompleteStations: incompleteStations.map(s => s.stationName)
        });
      }

      // Check if all completed matches have winners
      const allCurrentRoundComplete = currentRoundMatches.every(m => m.status === 'DONE');
      const allHaveWinners = currentRoundMatches.every(m => m.winnerId !== null);
      const matchesWithoutWinners = currentRoundMatches.filter(m => m.winnerId === null);

      if (!allCurrentRoundComplete) {
        return res.status(400).json({ 
          error: `Internal error: Round completion check failed despite station verification.`,
          stationCompletionStatus
        });
      }

      if (!allHaveWinners) {
        return res.status(400).json({ 
          error: `All heats in Round ${currentRound} must have winners declared before advancing to next round.`,
          matchesWithoutWinners: matchesWithoutWinners.map(m => `Heat ${m.heatNumber}`)
        });
      }

      // Get winners from current round
      const winners = currentRoundMatches
        .filter(m => m.winnerId)
        .map(m => m.winnerId!);

      if (winners.length === 0) {
        return res.status(400).json({ error: "No winners found in current round" });
      }

      // Check for duplicate winners (should not happen but safety check)
      const uniqueWinners = [...new Set(winners)];
      if (uniqueWinners.length !== winners.length) {
        console.warn('Duplicate winners found in current round, removing duplicates');
        winners.splice(0, winners.length, ...uniqueWinners);
      }

      // Get stations for this tournament
      const roundStations = await storage.getAllStations();
      const availableTournamentStations = roundStations.filter(s => s.tournamentId === tournamentId);
      const availableStations = availableTournamentStations.filter(s => s.status === 'AVAILABLE');

      if (availableStations.length < 3) {
        return res.status(400).json({ error: "Need at least 3 available stations" });
      }

      // Sort stations by name (A, B, C)
      const sortedStations = availableStations.sort((a, b) => a.name.localeCompare(b.name));

      // Split winners into 3 groups for stations A, B, C
      const groupSize = Math.ceil(winners.length / 3);
      const groups = [
        winners.slice(0, groupSize),
        winners.slice(groupSize, groupSize * 2),
        winners.slice(groupSize * 2)
      ].filter(group => group.length > 0);

      // Create matches for next round
      const nextRound = currentRound + 1;
      let heatNumber = 1;
      const assignedInNextRound = new Set<number>();

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const station = sortedStations[i];

        // Create matches for this group
        for (let j = 0; j < group.length; j += 2) {
          const competitor1 = group[j];
          const competitor2 = group[j + 1];

          // Validate no duplicate assignments
          if (assignedInNextRound.has(competitor1)) {
            return res.status(500).json({ 
              error: `Competitor ${competitor1} already assigned in next round` 
            });
          }
          if (competitor2 && assignedInNextRound.has(competitor2)) {
            return res.status(500).json({ 
              error: `Competitor ${competitor2} already assigned in next round` 
            });
          }

          // Track assignments
          assignedInNextRound.add(competitor1);
          if (competitor2) {
            assignedInNextRound.add(competitor2);
          }

          if (competitor2) {
            // Regular match with two competitors
            const match = await storage.createMatch({
              tournamentId,
              round: nextRound,
              heatNumber: heatNumber++,
              stationId: station.id,
              competitor1Id: competitor1,
              competitor2Id: competitor2,
              status: 'PENDING',
              startTime: station.nextAvailableAt
            });

            // Get segment times for this round
            let roundTimes = await storage.getRoundTimes(tournamentId, nextRound);
            if (!roundTimes) {
              roundTimes = await storage.setRoundTimes({
                tournamentId,
                round: nextRound,
                dialInMinutes: 10,
                cappuccinoMinutes: 3,
                espressoMinutes: 2,
                totalMinutes: 15
              });
            }

            // Create heat segments
            await storage.createHeatSegment({
              matchId: match.id,
              segment: 'DIAL_IN',
              status: 'IDLE',
              plannedMinutes: roundTimes.dialInMinutes
            });

            await storage.createHeatSegment({
              matchId: match.id,
              segment: 'CAPPUCCINO',
              status: 'IDLE',
              plannedMinutes: roundTimes.cappuccinoMinutes
            });

            await storage.createHeatSegment({
              matchId: match.id,
              segment: 'ESPRESSO',
              status: 'IDLE',
              plannedMinutes: roundTimes.espressoMinutes
            });

            // Update station availability
            const nextAvailable = new Date(station.nextAvailableAt.getTime() + (roundTimes.totalMinutes + 10) * 60 * 1000);
            await storage.updateStation(station.id, { nextAvailableAt: nextAvailable });
          } else {
            // Bye - competitor advances automatically
            await storage.createMatch({
              tournamentId,
              round: nextRound,
              heatNumber: heatNumber++,
              stationId: null,
              competitor1Id: competitor1,
              competitor2Id: null,
              status: 'DONE',
              winnerId: competitor1,
              startTime: new Date(),
              endTime: new Date()
            });
          }
        }
      }

      // Update tournament current round
      await storage.updateTournament(tournamentId, { 
        currentRound: nextRound 
      });

      // Emit WebSocket update
      io.to(`tournament:${tournamentId}`).emit("next-round-populated", {
        round: nextRound,
        previousRound: currentRound,
        totalMatches: heatNumber - 1,
        message: `Round ${nextRound} has been set up with advancing competitors`
      });

      res.json({
        success: true,
        previousRound: currentRound,
        nextRound,
        matchesCreated: heatNumber - 1,
        advancingCompetitors: winners.length,
        message: `Round ${nextRound} successfully created with ${winners.length} advancing competitors`
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Complete a heat
  app.post("/api/heats/:id/complete", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const { winnerId } = req.body;

      const match = await storage.updateMatch(matchId, {
        status: 'DONE',
        winnerId,
        endTime: new Date()
      });

      if (!match) {
        return res.status(404).json({ error: "Heat not found" });
      }

      io.to(`tournament:${match.tournamentId}`).emit("heat:completed", match);
      res.json(match);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Advance to next heat in station queue
  app.post("/api/stations/:stationId/advance-heat", async (req, res) => {
    try {
      const stationId = parseInt(req.params.stationId);
      
      // Get current running/ready match for this station
      const currentMatch = await db.select()
        .from(matches)
        .where(
          eq(matches.stationId, stationId)
        )
        .orderBy(matches.heatNumber);

      const runningMatch = currentMatch.find(m => m.status === 'RUNNING');
      const readyMatch = currentMatch.find(m => m.status === 'READY' || m.status === 'PENDING');

      if (!runningMatch && !readyMatch) {
        return res.status(404).json({ error: "No active heat found for this station" });
      }

      let completedMatch = null;

      // Complete the running match if there is one
      if (runningMatch) {
        completedMatch = await storage.updateMatch(runningMatch.id, {
          status: 'DONE',
          endTime: new Date()
        });

        if (completedMatch) {
          io.to(`tournament:${completedMatch.tournamentId}`).emit("heat:completed", completedMatch);
        }
      }

      // Find next pending heat for this station
      const pendingMatches = currentMatch.filter(m => 
        m.status === 'PENDING' || 
        (m.status === 'READY' && m.id !== runningMatch?.id)
      );

      let nextMatch = null;
      if (pendingMatches.length > 0) {
        // Start the next heat in queue
        const nextPendingMatch = pendingMatches[0];
        nextMatch = await storage.updateMatch(nextPendingMatch.id, {
          status: 'READY',
          startTime: new Date()
        });

        if (nextMatch) {
          io.to(`tournament:${nextMatch.tournamentId}`).emit("heat:advanced", {
            completed: completedMatch,
            next: nextMatch,
            stationId
          });
        }
      }

      res.json({
        success: true,
        completed: completedMatch,
        next: nextMatch,
        message: nextMatch 
          ? `Advanced to Heat ${nextMatch.heatNumber}`
          : completedMatch 
            ? "Heat completed. No more heats in queue for this station."
            : "No heat to advance"
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== STATION QUEUE MANAGEMENT =====
  // Get station queue
  app.get("/api/stations/:stationId/queue", async (req, res) => {
    try {
      const stationId = parseInt(req.params.stationId);
      const station = await storage.getStation(stationId);

      if (!station) {
        return res.status(404).json({ error: "Station not found" });
      }

      // Get matches for this station
      const matches = await storage.getStationMatches(stationId, 10, 0);

      res.json({
        station,
        queue: matches,
        nextAvailableAt: station.nextAvailableAt
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // ===== BRACKET MANAGEMENT =====
  // Get tournament bracket
  app.get("/api/tournaments/:id/bracket", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const matches = await storage.getTournamentMatches(tournamentId);
      const participants = await storage.getTournamentParticipants(tournamentId);

      res.json({
        tournamentId,
        matches,
        participants
      });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Seed tournament bracket
  app.post("/api/tournaments/:id/seed", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const participants = await storage.getTournamentParticipants(tournamentId);

      if (participants.length === 0) {
        return res.status(400).json({ error: "No participants found" });
      }

      const bracketResult = await BracketGenerator.generateBracket(tournamentId, participants);
      console.log(`✅ Bracket generated: ${bracketResult.round1Matches} Round 1 matches, ${bracketResult.totalMatches} total matches`);

      const matches = await storage.getTournamentMatches(tournamentId);
      io.to(`tournament:${tournamentId}`).emit("bracket:seeded", matches);

      res.json({ success: true, matches });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}