import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";
import { BracketGenerator } from "./bracketGenerator";
import { WEC25_COMPETITORS, WEC25_ROUND1 } from "./wec25";
import { 
  insertTournamentSchema, insertTournamentParticipantSchema,
  insertStationSchema, insertMatchSchema, insertHeatScoreSchema,
  insertUserSchema, insertHeatSegmentSchema, insertHeatJudgeSchema
} from "@shared/schema";

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

  // ===== TOURNAMENT ROUTES =====
  app.post("/api/tournaments", async (req, res) => {
    try {
      const tournamentData = insertTournamentSchema.parse(req.body);
      const tournament = await storage.createTournament(tournamentData);
      
      // Create default stations
      await storage.createStation({ name: "A", status: "AVAILABLE", nextAvailableAt: new Date() });
      await storage.createStation({ name: "B", status: "AVAILABLE", nextAvailableAt: new Date() });
      await storage.createStation({ name: "C", status: "AVAILABLE", nextAvailableAt: new Date() });
      
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
    const tournament = await storage.getTournament(parseInt(req.params.id));
    if (!tournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }
    res.json(tournament);
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
      const participants = await storage.getTournamentParticipants(tournamentId);
      
      // Filter to only return baristas (competitors), not judges
      const allUsers = await storage.getAllUsers();
      const baristaParticipants = participants.filter(participant => {
        const user = allUsers.find(u => u.id === participant.userId);
        return user?.role === 'BARISTA';
      });
      
      res.json(baristaParticipants);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate tournament bracket
  app.post("/api/tournaments/:id/generate-bracket", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const participants = await storage.getTournamentParticipants(tournamentId);
      
      // Filter to only use baristas (competitors), not judges
      const allUsers = await storage.getAllUsers();
      const baristaParticipants = participants.filter(participant => {
        const user = allUsers.find(u => u.id === participant.userId);
        return user?.role === 'BARISTA';
      });
      
      if (baristaParticipants.length === 0) {
        return res.status(400).json({ error: "No barista participants found" });
      }

      await BracketGenerator.generateBracket(tournamentId, baristaParticipants);
      
      const matches = await storage.getTournamentMatches(tournamentId);
      io.to(`tournament:${tournamentId}`).emit("bracket:generated", matches);
      
      res.json({ success: true, matchesCreated: matches.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Generate exact WEC25 bracket (Round 1 fixed as per spec)
  app.post("/api/tournaments/:id/generate-wec25", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);

      // Ensure stations exist
      const stations = await storage.getAllStations();
      const stationA = stations.find(s => s.name === 'A');
      const stationB = stations.find(s => s.name === 'B');
      const stationC = stations.find(s => s.name === 'C');
      if (!stationA || !stationB || !stationC) {
        return res.status(400).json({ error: "Stations A, B, C must exist" });
      }

      // Create users for competitors if missing and add as participants
      const existingUsers = await storage.getAllUsers();
      const nameToUserId = new Map<string, number>();

      for (const comp of WEC25_COMPETITORS) {
        let user = existingUsers.find(u => u.name === comp.name);
        if (!user) {
          user = await storage.createUser({ name: comp.name, email: comp.email, role: 'BARISTA' });
        }
        nameToUserId.set(comp.name, user.id);
      }

      // Add participants if not present, assign seeds by heat order
      const existingParticipants = await storage.getTournamentParticipants(tournamentId);
      let seedCounter = 1;
      for (const spec of WEC25_ROUND1) {
        const names = [spec.competitor1, spec.competitor2].filter(n => n !== 'BUY') as string[];
        for (const name of names) {
          const userId = nameToUserId.get(name)!;
          const already = existingParticipants.find(p => p.userId === userId);
          if (!already) {
            await storage.addParticipant({ tournamentId, userId, seed: seedCounter++ });
          }
        }
      }

      // Refresh participants list (baristas only)
      const participants = await storage.getTournamentParticipants(tournamentId);

      // Clear any existing matches for this tournament before generating
      // Optional: implement storage.clearTournamentMatches if available; fallback to continue creating

      // Create Round 1 matches exactly as per WEC25 spec
      const now = new Date();
      await storage.updateStation(stationA.id, { nextAvailableAt: now, status: 'AVAILABLE' });
      await storage.updateStation(stationB.id, { nextAvailableAt: new Date(now.getTime() + 10 * 60 * 1000), status: 'AVAILABLE' });
      await storage.updateStation(stationC.id, { nextAvailableAt: new Date(now.getTime() + 20 * 60 * 1000), status: 'AVAILABLE' });

      for (const spec of WEC25_ROUND1) {
        const station = spec.station === 'A' ? stationA : spec.station === 'B' ? stationB : stationC;
        const competitor1Id = spec.competitor1 === 'BUY' ? null : nameToUserId.get(spec.competitor1) || null;
        const competitor2Id = spec.competitor2 === 'BUY' ? null : nameToUserId.get(spec.competitor2) || null;

        if (competitor1Id && !competitor2Id) {
          // Bye: auto-win
          await storage.createMatch({
            tournamentId,
            round: 1,
            heatNumber: spec.heatNumber,
            stationId: null,
            competitor1Id,
            competitor2Id: null,
            status: 'DONE',
            winnerId: competitor1Id,
            startTime: new Date(),
            endTime: new Date()
          });
          continue;
        }

        await storage.createMatch({
          tournamentId,
          round: 1,
          heatNumber: spec.heatNumber,
          stationId: station.id,
          competitor1Id: competitor1Id!,
          competitor2Id: competitor2Id!,
          status: 'PENDING',
          startTime: station.nextAvailableAt
        });
      }

      const matches = await storage.getTournamentMatches(tournamentId);
      io.to(`tournament:${tournamentId}`).emit("bracket:generated", matches);
      res.json({ success: true, matchesCreated: matches.length });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
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
      const participants = await storage.getTournamentParticipants(tournamentId);
      
      if (participants.length === 0) {
        return res.status(400).json({ error: "No participants found" });
      }

      const randomized = BracketGenerator.randomizeSeeds(participants);
      
      // Persist the randomized seeds to database
      for (const participant of randomized) {
        await storage.updateParticipantSeed(participant.id, participant.seed);
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

  // Set round times
  app.post("/api/tournaments/:id/round-times", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const { round, dialInMinutes, cappuccinoMinutes, espressoMinutes } = req.body;
      
      const totalMinutes = dialInMinutes + cappuccinoMinutes + espressoMinutes;
      
      const roundTime = await storage.setRoundTimes({
        tournamentId,
        round,
        dialInMinutes,
        cappuccinoMinutes,
        espressoMinutes,
        totalMinutes
      });
      
      io.to(`tournament:${tournamentId}`).emit("round-times:updated", roundTime);
      res.json(roundTime);
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

  // Update segment status (for Station Lead to start/end segments)
  app.patch("/api/segments/:id", async (req, res) => {
    try {
      const segmentId = parseInt(req.params.id);
      const segment = await storage.updateHeatSegment(segmentId, req.body);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      res.json(segment);
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
      const match = await storage.updateMatch(parseInt(req.params.id), req.body);
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
    const segments = await storage.getMatchSegments(parseInt(req.params.id));
    res.json(segments);
  });

  app.patch("/api/segments/:id", async (req, res) => {
    try {
      const segment = await storage.updateHeatSegment(parseInt(req.params.id), req.body);
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
      }
      io.emit("segment:updated", segment);
      res.json(segment);
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
      const requiredSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      const existingSegments = segments.map(s => s.segment);
      const missingSegments = requiredSegments.filter(seg => !existingSegments.includes(seg));
      
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
      
      const updatedSegment = await storage.updateHeatSegment(segment.id, {
        status: 'RUNNING',
        startTime: new Date()
      });
      
      const match = await storage.getMatch(matchId);
      if (match) {
        io.to(`tournament:${match.tournamentId}`).emit("segment:started", updatedSegment);
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
      
      const match = await storage.getMatch(matchId);
      if (match) {
        io.to(`tournament:${match.tournamentId}`).emit("segment:ended", updatedSegment);
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
      const requiredSegments = ['DIAL_IN', 'CAPPUCCINO', 'ESPRESSO'];
      const existingSegments = segments.map(s => s.segment);
      
      const missingSegments = requiredSegments.filter(seg => !existingSegments.includes(seg));
      const extraSegments = existingSegments.filter(seg => !requiredSegments.includes(seg));
      
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
      const currentRound = Math.max(...currentMatches.map(m => m.round));
      const currentRoundMatches = currentMatches.filter(m => m.round === currentRound);
      
      // Check if all current round matches are complete
      const allCurrentRoundComplete = currentRoundMatches.every(m => m.status === 'DONE');
      if (!allCurrentRoundComplete) {
        return res.status(400).json({ error: "Current round must be complete before populating next round" });
      }

      // Get winners from current round
      const winners = currentRoundMatches
        .filter(m => m.winnerId)
        .map(m => m.winnerId!);

      if (winners.length === 0) {
        return res.status(400).json({ error: "No winners found in current round" });
      }

      // Get stations
      const stations = await storage.getAllStations();
      const availableStations = stations.filter(s => s.status === 'AVAILABLE');

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

      for (let i = 0; i < groups.length; i++) {
        const group = groups[i];
        const station = sortedStations[i];
        
        // Create matches for this group
        for (let j = 0; j < group.length; j += 2) {
          const competitor1 = group[j];
          const competitor2 = group[j + 1];
          
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

      // Emit WebSocket update
      io.to(`tournament:${tournamentId}`).emit("next-round-populated", {
        round: nextRound,
        message: "Next round has been populated with competitors"
      });

      res.json({ 
        success: true, 
        nextRound, 
        matchesCreated: heatNumber - 1,
        message: "Next round populated successfully" 
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

      await BracketGenerator.generateBracket(tournamentId, participants);
      
      const matches = await storage.getTournamentMatches(tournamentId);
      io.to(`tournament:${tournamentId}`).emit("bracket:seeded", matches);
      
      res.json({ success: true, matches });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  return httpServer;
}
