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
  tournamentParticipants, heatJudges, matches, stations,
  type Tournament
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

      // Get tournament to access enabledStations
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
      
      // Get tournament-specific stations
      const tournamentStations = await storage.getTournamentStations(tournamentId);
      const stationsForAssignment = tournamentStations
        .filter(s => enabledStations.includes(s.name))
        .sort((a, b) => a.name.localeCompare(b.name));

      if (stationsForAssignment.length === 0) {
        return res.status(400).json({ error: `No enabled stations (${enabledStations.join(', ')}) found for this tournament` });
      }

      // Shuffle station leads for randomization
      const shuffledLeads = [...stationLeads].sort(() => Math.random() - 0.5);

      // Assign station leads to stations (distribute evenly, wrap around if needed)
      let assignedCount = 0;
      for (let i = 0; i < stationsForAssignment.length; i++) {
        const station = stationsForAssignment[i];
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
      let judgeRotationIndex = 0; // Track position in rotation for staggering

      for (const match of tournamentMatches) {
        // Skip if match already has judges assigned
        const existingJudges = await storage.getMatchJudges(match.id);

        if (existingJudges.length > 0) {
          // Delete existing judges for this match first
          for (const existingJudge of existingJudges) {
            await db.delete(heatJudges).where(eq(heatJudges.id, existingJudge.id));
          }
        }

        // Assign 3 judges: 2 ESPRESSO, 1 CAPPUCCINO
        // Ensure 3 UNIQUE judges per heat, with proper staggering across heats
        const assignedJudges: typeof judges = [];
        const usedJudgeIds = new Set<number>();

        // Select 3 unique judges, starting from rotation index and wrapping around
        // Add safety limit to prevent infinite loop
        let maxAttempts = shuffledJudges.length * 3; // Try at most 3x the number of judges
        let attempts = 0;
        
        while (assignedJudges.length < 3 && attempts < maxAttempts) {
          attempts++;
          const judgeIndex = (judgeRotationIndex + assignedJudges.length) % shuffledJudges.length;
          const judge = shuffledJudges[judgeIndex];
          
          // Only add if not already used in this heat
          if (!usedJudgeIds.has(judge.id)) {
            assignedJudges.push(judge);
            usedJudgeIds.add(judge.id);
          } else {
            // If judge already in this heat, try to find next available judge
            let found = false;
            for (let offset = 1; offset < shuffledJudges.length && !found; offset++) {
              const nextIndex = (judgeIndex + offset) % shuffledJudges.length;
              const nextJudge = shuffledJudges[nextIndex];
              if (!usedJudgeIds.has(nextJudge.id)) {
                assignedJudges.push(nextJudge);
                usedJudgeIds.add(nextJudge.id);
                found = true;
              }
            }
            // If we couldn't find a unique judge, break to avoid infinite loop
            if (!found) {
              console.warn(`⚠️ Could not find 3 unique judges for match ${match.id}. Found ${assignedJudges.length} judges.`);
              break;
            }
          }
        }

        // Safety check: if we don't have 3 judges, skip this match
        if (assignedJudges.length < 3) {
          console.error(`❌ Cannot assign judges to match ${match.id}: Only ${assignedJudges.length} unique judges available (need 3). Skipping this match.`);
          continue; // Skip this match and continue with next
        }

        // Rotate starting position for next heat to stagger judges
        judgeRotationIndex = (judgeRotationIndex + 1) % shuffledJudges.length;

        // Create judge assignments
        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[0].id,
          role: 'ESPRESSO' // First ESPRESSO judge
        });

        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[1].id,
          role: 'ESPRESSO' // Second ESPRESSO judge
        });

        await storage.assignJudge({
          matchId: match.id,
          judgeId: assignedJudges[2].id,
          role: 'CAPPUCCINO' // CAPPUCCINO judge
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

      // Create tournament-specific stations based on enabledStations
      const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
      for (const stationName of enabledStations) {
        await storage.createStation({
          tournamentId: tournament.id,
          name: stationName,
          status: "AVAILABLE",
          nextAvailableAt: new Date()
        });
      }

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

      // Get scores with judge names for all matches (batch query - optimized)
      const matchIds = matches.map(m => m.id);
      const allMatchScores = matchIds.length > 0 
        ? await storage.getMatchScoresBatch(matchIds)
        : [];
      const scoresWithJudgeNames = allMatchScores.map((s) => {
        const judge = allUsers.find(u => u.id === s.judgeId);
        return {
          ...s,
          judgeName: judge?.name || 'Unknown Judge'
        };
      });

      // Get detailed scores for all matches (batch query - optimized)
      const detailedScoresForTournament = matchIds.length > 0
        ? await storage.getMatchDetailedScoresBatch(matchIds)
        : [];

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

  // Update tournament enabledStations with heat migration support
  app.patch("/api/tournaments/:id/enabled-stations", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { enabledStations } = req.body;

      if (!Array.isArray(enabledStations) || enabledStations.length < 1) {
        return res.status(400).json({ error: "enabledStations must be an array with at least one station" });
      }

      // Validate stations are A, B, or C
      const validStations = ['A', 'B', 'C'];
      if (!enabledStations.every(s => validStations.includes(s))) {
        return res.status(400).json({ error: "enabledStations can only contain A, B, or C" });
      }

      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const oldEnabledStations = tournament.enabledStations || ['A', 'B', 'C'];
      const disabledStations = oldEnabledStations.filter(s => !enabledStations.includes(s));
      const newlyEnabledStations = enabledStations.filter(s => !oldEnabledStations.includes(s));

      // Get all matches for this tournament
      const allMatches = await storage.getTournamentMatches(tournamentId);
      const hasMatches = allMatches.length > 0;

      // Get existing tournament stations
      const tournamentStations = await storage.getTournamentStations(tournamentId);

      // If NO matches exist yet (before bracket generation), create/delete stations
      if (!hasMatches) {
        // Create newly enabled stations
        for (const stationName of newlyEnabledStations) {
          const stationExists = tournamentStations.some(s => s.name === stationName);
          if (!stationExists) {
            await storage.createStation({
              tournamentId: tournamentId,
              name: stationName,
              status: "AVAILABLE",
              nextAvailableAt: new Date()
            });
            console.log(`Created station ${stationName} for tournament ${tournamentId}`);
          }
        }

        // Delete disabled stations (only if they have no matches)
        for (const stationName of disabledStations) {
          const stationToDelete = tournamentStations.find(s => s.name === stationName);
          if (stationToDelete) {
            // Check if station has any matches (should be 0 since hasMatches is false, but double-check)
            const stationMatches = allMatches.filter(m => m.stationId === stationToDelete.id);
            if (stationMatches.length === 0) {
              // Delete station (cascade will handle related data)
              await db.delete(stations).where(eq(stations.id, stationToDelete.id));
              console.log(`Deleted unused station ${stationName} for tournament ${tournamentId}`);
            }
          }
        }
      }

      // If there are matches and stations are being disabled, mark stations as OFFLINE (don't migrate)
      if (hasMatches && disabledStations.length > 0) {
        // Get tournament stations
        const stationsToDeactivate = tournamentStations.filter(s => disabledStations.includes(s.name));
        
        // Mark disabled stations as OFFLINE instead of migrating matches
        for (const station of stationsToDeactivate) {
          await storage.updateStation(station.id, { status: 'OFFLINE' });
          console.log(`Marked station ${station.name} as OFFLINE for tournament ${tournamentId}`);
        }
      }

      // If stations are being re-enabled, mark them as AVAILABLE
      if (newlyEnabledStations.length > 0) {
        const stationsToReactivate = tournamentStations.filter(s => 
          newlyEnabledStations.includes(s.name) && s.status === 'OFFLINE'
        );
        
        for (const station of stationsToReactivate) {
          await storage.updateStation(station.id, { status: 'AVAILABLE' });
          console.log(`Reactivated station ${station.name} for tournament ${tournamentId}`);
        }
      }

      // Update tournament enabledStations
      const updatedTournament = await storage.updateTournament(tournamentId, { enabledStations });
      if (!updatedTournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      io.to(`tournament:${tournamentId}`).emit("tournament:updated", updatedTournament);
      res.json({ 
        tournament: updatedTournament,
        deactivatedStations: disabledStations.length > 0 ? disabledStations : [],
        reactivatedStations: newlyEnabledStations.length > 0 ? newlyEnabledStations : []
      });
    } catch (error: any) {
      console.error('Error updating enabledStations:', error);
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
  // Get round times for a tournament (returns all round structures)
  app.get("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const roundTimes = await storage.getTournamentRoundTimes(tournamentId);
      res.json(roundTimes);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Set heat structure (per-round timing configuration)
  app.post("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { round = 1, dialInMinutes, cappuccinoMinutes, espressoMinutes } = req.body;

      if (!round || round < 1) {
        return res.status(400).json({ error: 'Round must be a positive integer' });
      }

      const totalMinutes = dialInMinutes + cappuccinoMinutes + espressoMinutes;

      // Check if heat structure already exists for this specific round
      const existingStructure = await storage.getRoundTimes(tournamentId, round);

      let heatStructure;
      if (existingStructure) {
        // Update existing structure for this round
        heatStructure = await storage.updateRoundTimes(tournamentId, round, {
          dialInMinutes,
          cappuccinoMinutes,
          espressoMinutes,
          totalMinutes
        });
      } else {
        // Create new structure for this round
        heatStructure = await storage.setRoundTimes({
          tournamentId,
          round,
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

      // Allow updating plannedMinutes only when segment is IDLE (not started)
      if (updateData.plannedMinutes !== undefined && segment.status !== 'IDLE') {
        return res.status(400).json({
          error: "Cannot update segment timing after segment has started. Only IDLE segments can have their timing adjusted."
        });
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

          // Broadcast station timing coordination for DIAL_IN segment
          if (updatedSegment.segment === 'DIAL_IN') {
            const station = await storage.getStation(match.stationId!);
            if (station) {
              if (station.name === 'A') {
                // Station A started: Station B gets 10 min, Station C gets 20 min (fallback)
                io.to(`tournament:${match.tournamentId}`).emit("station-timing:dial-in-started", {
                  stationA: { started: true, startTime: updatedSegment.startTime || new Date() },
                  stationB: { countdown: 10 * 60 }, // 10 minutes countdown
                  stationC: { countdown: 20 * 60 }  // 20 minutes countdown (fallback)
                });
              } else if (station.name === 'B') {
                // Station B started: Station C gets 10 min countdown (overrides 20 min fallback)
                io.to(`tournament:${match.tournamentId}`).emit("station-timing:dial-in-started", {
                  stationB: { started: true, startTime: updatedSegment.startTime || new Date() },
                  stationC: { countdown: 10 * 60 }  // 10 minutes countdown after Station B starts
                });
              }
            }
          }
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

  // Global lock status - checks if all segments are ended and all judges have submitted
  app.get("/api/matches/:id/global-lock-status", async (req, res) => {
    try {
      const matchId = parseInt(req.params.id);
      const lockStatus = await storage.getGlobalLockStatus(matchId);
      res.json(lockStatus);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to get global lock status' });
    }
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

      // Check global lock status to ensure all segments are ended and all judges have submitted
      // This ensures cup positions can only be assigned after the heat is fully complete
      const globalLockStatus = await storage.getGlobalLockStatus(matchId);
      
      if (!globalLockStatus.allSegmentsEnded) {
        return res.status(400).json({ 
          error: 'All segments (DIAL_IN, CAPPUCCINO, ESPRESSO) must be completed before assigning cup positions',
          globalLockStatus
        });
      }

      if (!globalLockStatus.allJudgesSubmitted) {
        const missingDetails = globalLockStatus.missingSubmissions
          .map(m => `${m.judgeName} (${m.role}): ${m.missing.join(', ')}`)
          .join('; ');
        return res.status(400).json({ 
          error: `All judges must complete scoring before assigning cup positions. Missing: ${missingDetails}`,
          globalLockStatus
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
          // Get tournament to access enabledStations
          const tournament = await storage.getTournament(tournamentId);
          if (tournament) {
            const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
            
            // Get tournament-specific stations
            const tournamentStations = await storage.getTournamentStations(tournamentId);
            const stationsForAssignment = tournamentStations
              .filter(s => enabledStations.includes(s.name))
              .sort((a, b) => a.name.localeCompare(b.name));

            if (stationsForAssignment.length > 0) {
              // Shuffle station leads for randomization
              const shuffledLeads = [...stationLeads].sort(() => Math.random() - 0.5);

              // Assign station leads to stations (distribute evenly, wrap around if needed)
              for (let i = 0; i < stationsForAssignment.length; i++) {
                const station = stationsForAssignment[i];
                const stationLead = shuffledLeads[i % shuffledLeads.length];

                await storage.updateStation(station.id, { stationLeadId: stationLead.id });
              }
              console.log(`Assigned ${Math.min(stationsForAssignment.length, stationLeads.length)} station leads to stations`);
            }
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

      // Segment progression: Segments can proceed without waiting for judge scores
      // - DIAL_IN: No scoring, no judge check needed
      // - CAPPUCCINO: Can start after DIAL_IN ends (no judge check needed)  
      // - ESPRESSO: Can start after CAPPUCCINO ends (no judge check needed)
      // Judge completion will be checked at heat advancement instead

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
          if (station) {
            if (station.name === 'A') {
              // Station A started: Station B gets 10 min, Station C gets 20 min (fallback)
              io.to(`tournament:${matchData.tournamentId}`).emit("station-timing:dial-in-started", {
                stationA: { started: true, startTime: new Date() },
                stationB: { countdown: 10 * 60 }, // 10 minutes countdown
                stationC: { countdown: 20 * 60 }  // 20 minutes countdown (fallback)
              });
            } else if (station.name === 'B') {
              // Station B started: Station C gets 10 min countdown (overrides 20 min fallback)
              io.to(`tournament:${matchData.tournamentId}`).emit("station-timing:dial-in-started", {
                stationB: { started: true, startTime: new Date() },
                stationC: { countdown: 10 * 60 }  // 10 minutes countdown after Station B starts
              });
            }
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
        // CAPPUCCINO segment ending means CAPPUCCINO judge needs to score
        // ESPRESSO segment ending means ESPRESSO judges need to score
        if (segmentCode === 'CAPPUCCINO' || segmentCode === 'ESPRESSO') {
          const matchJudges = await storage.getMatchJudges(matchId);
          const relevantJudges = matchJudges.filter(j => {
            if (segmentCode === 'CAPPUCCINO') {
              return j.role === 'CAPPUCCINO';
            } else {
              return j.role === 'ESPRESSO';
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

      if (!tournamentId || isNaN(tournamentId)) {
        return res.status(400).json({ error: "Invalid tournament ID" });
      }

      // Get current tournament (works for both regular and test tournaments)
      // Tournament type is defined in @shared/schema - same type for all tournaments
      const tournament: Tournament | undefined = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ 
          error: `Tournament ${tournamentId} not found. Tournament may not exist or may have been deleted.` 
        });
      }
      
      // Tournament is now guaranteed to be defined (TypeScript type narrowing)

      // Get all matches for the current round
      const currentMatches = await storage.getTournamentMatches(tournamentId);
      if (currentMatches.length === 0) {
        return res.status(400).json({ error: "No matches found for this tournament" });
      }

      const currentRound = Math.max(...currentMatches.map(m => m.round));
      const currentRoundMatches = currentMatches.filter(m => m.round === currentRound);

      // Get ALL stations for this tournament to verify round completion
      const allStations = await storage.getAllStations();
      const enabledStations = tournament.enabledStations || ['A', 'B', 'C'];
      const tournamentStations = allStations.filter(s => s.tournamentId === tournamentId && enabledStations.includes(s.name));

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

      // Use centralized round completion checker
      const { checkRoundCompletion } = await import('./utils/roundCompletion');
      const completionStatus = await checkRoundCompletion(tournamentId, currentRound);

      if (!completionStatus.isComplete) {
        const errorDetails = completionStatus.errors.join('; ');
        const incompleteDetails = completionStatus.stationStatus
          .filter(s => !s.isComplete && s.totalMatches > 0)
          .map(s => `Station ${s.stationName}: ${s.incompleteMatches.length} incomplete, ${s.matchesWithoutWinners.length} without winners`)
          .join('; ');

        return res.status(400).json({
          error: `Round ${currentRound} is not complete. ${errorDetails}`,
          completionStatus,
          incompleteDetails
        });
      }

      // Get winners from current round (use completion status winners)
      const winners = completionStatus.matchesWithWinners > 0
        ? currentRoundMatches
            .filter(m => m.winnerId)
            .map(m => m.winnerId!)
        : [];

      if (winners.length === 0) {
        return res.status(400).json({ 
          error: "No winners found in current round",
          completionStatus
        });
      }

      // Validate all winners are valid tournament participants
      const participants = await storage.getTournamentParticipants(tournamentId);
      const participantUserIds = new Set(participants.map(p => p.userId));
      const invalidWinners = winners.filter(w => !participantUserIds.has(w));
      
      if (invalidWinners.length > 0) {
        return res.status(400).json({
          error: `Invalid winners found: ${invalidWinners.length} winner(s) are not tournament participants`,
          invalidWinners
        });
      }

      // Ensure all winners have cup codes - generate if missing
      const allUsers = await storage.getAllUsers();
      for (const winnerId of winners) {
        const participant = participants.find(p => p.userId === winnerId);
        if (participant && !participant.cupCode) {
          // Get user info to generate cup code
          const user = allUsers.find(u => u.id === winnerId);
          if (user) {
            const cupCode = BracketGenerator.generateCupCode(user.name, participant.seed || 999, participant.seed ? participant.seed - 1 : undefined);
            await storage.updateParticipantCupCode(participant.id, cupCode);
            console.log(`✅ Generated cup code ${cupCode} for winner ${user.name} (participant ${participant.id})`);
          }
        }
      }

      // Check for duplicate winners (should not happen but safety check)
      const uniqueWinners = [...new Set(winners)];
      if (uniqueWinners.length !== winners.length) {
        console.warn(`⚠️ Duplicate winners found in Round ${currentRound}, removing duplicates`);
        const duplicates = winners.filter((w, i) => winners.indexOf(w) !== i);
        console.warn(`Duplicate winner IDs: ${duplicates.join(', ')}`);
      }

      // Use unique winners
      const finalWinners = uniqueWinners;

      // Check if tournament is complete (only 1 winner remaining)
      if (finalWinners.length === 1) {
        console.log(`🏆 Tournament ${tournamentId} complete! Final winner: ${finalWinners[0]}`);
        
        // Update tournament status if needed
        await storage.updateTournament(tournamentId, {
          currentRound: currentRound + 1
        });

        io.to(`tournament:${tournamentId}`).emit("tournament:complete", {
          tournamentId,
          winnerId: finalWinners[0],
          finalRound: currentRound,
          message: `Tournament complete! Winner determined in Round ${currentRound}`
        });

        return res.json({
          success: true,
          tournamentComplete: true,
          winnerId: finalWinners[0],
          finalRound: currentRound,
          message: `Tournament complete! Final winner determined.`
        });
      }

      if (finalWinners.length < 2) {
        return res.status(400).json({
          error: `Insufficient winners (${finalWinners.length}) to create next round. Need at least 2 winners.`
        });
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

      // Sort winners by original seeding to maintain bracket order
      const sortedWinners = winners.map(winnerId => {
        const participant = participants.find(p => p.userId === winnerId);
        return { winnerId, seed: participant?.seed || 999 };
      }).sort((a, b) => a.seed - b.seed).map(w => w.winnerId);

      // Split sorted winners into 3 groups for stations A, B, C
      const groupSize = Math.ceil(sortedWinners.length / 3);
      const groups = [
        sortedWinners.slice(0, groupSize),
        sortedWinners.slice(groupSize, groupSize * 2),
        sortedWinners.slice(groupSize * 2)
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

      // Emit WebSocket events
      io.to(`tournament:${tournamentId}`).emit("round:complete", {
        tournamentId,
        round: currentRound,
        winners: finalWinners,
        winnersCount: finalWinners.length,
        message: `Round ${currentRound} completed with ${finalWinners.length} winners`
      });

      io.to(`tournament:${tournamentId}`).emit("next-round-populated", {
        tournamentId,
        round: nextRound,
        previousRound: currentRound,
        totalMatches: heatNumber - 1,
        advancingCompetitors: finalWinners.length,
        message: `Round ${nextRound} has been set up with ${finalWinners.length} advancing competitors`
      });

      console.log(`✅ Round ${nextRound} populated: ${heatNumber - 1} matches created with ${finalWinners.length} advancing competitors`);

      res.json({
        success: true,
        previousRound: currentRound,
        nextRound,
        matchesCreated: heatNumber - 1,
        advancingCompetitors: finalWinners.length,
        winners: finalWinners,
        message: `Round ${nextRound} successfully created with ${finalWinners.length} advancing competitors`
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
      // BUT FIRST: Check global lock status - ensures all segments ended AND all judges submitted
      if (runningMatch) {
        const globalLockStatus = await storage.getGlobalLockStatus(runningMatch.id);

        // Check if all segments are ended
        if (!globalLockStatus.allSegmentsEnded) {
          return res.status(400).json({
            error: `Cannot advance heat. All segments (DIAL_IN, CAPPUCCINO, ESPRESSO) must be completed before advancing.`,
            globalLockStatus
          });
        }

        // Check if all judges have submitted their scores
        if (!globalLockStatus.allJudgesSubmitted) {
          const missingDetails = globalLockStatus.missingSubmissions
            .map(m => `${m.judgeName} (${m.role}): ${m.missing.join(', ')}`)
            .join('; ');
          
          return res.status(400).json({
            error: `Cannot advance heat. All judges must complete scoring before advancing. Missing: ${missingDetails}`,
            globalLockStatus
          });
        }

        // Check that cup positions are assigned
        const cupPositions = await storage.getMatchCupPositions(runningMatch.id);
        const hasLeftPosition = cupPositions.some(p => p.position === 'left');
        const hasRightPosition = cupPositions.some(p => p.position === 'right');

        if (!hasLeftPosition || !hasRightPosition) {
          return res.status(400).json({
            error: `Cannot advance heat. Cup codes must be assigned to left/right positions before advancing. Please assign cup positions first.`,
            cupPositions
          });
        }

        // All judges have completed and cup positions assigned - calculate winner and complete the match
        const { calculateMatchWinner } = await import('./utils/winnerCalculation');
        const winnerResult = await calculateMatchWinner(runningMatch.id);

        if (winnerResult.error) {
          return res.status(400).json({
            error: `Cannot advance heat. ${winnerResult.error}`,
            details: winnerResult
          });
        }

        if (!winnerResult.winnerId) {
          return res.status(400).json({
            error: `Cannot advance heat. Winner could not be determined. ${winnerResult.tieBreakerReason || 'Tied scores require manual resolution.'}`,
            details: winnerResult
          });
        }

        // Update match with calculated winner
        completedMatch = await storage.updateMatch(runningMatch.id, {
          status: 'DONE',
          winnerId: winnerResult.winnerId,
          endTime: new Date()
        });

        if (completedMatch) {
          // Log winner calculation for audit
          console.log(`✅ Heat ${runningMatch.heatNumber} completed - Winner: ${winnerResult.winnerId} (Scores: ${winnerResult.competitor1Score} vs ${winnerResult.competitor2Score}${winnerResult.tie ? ` - ${winnerResult.tieBreakerReason}` : ''})`);
          
          io.to(`tournament:${completedMatch.tournamentId}`).emit("heat:completed", completedMatch);
          io.to(`tournament:${completedMatch.tournamentId}`).emit("match:winner-calculated", {
            matchId: completedMatch.id,
            winnerId: winnerResult.winnerId,
            competitor1Score: winnerResult.competitor1Score,
            competitor2Score: winnerResult.competitor2Score,
            tie: winnerResult.tie,
            tieBreakerReason: winnerResult.tieBreakerReason
          });
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