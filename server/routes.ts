import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Server as SocketIOServer } from "socket.io";
import { BracketGenerator } from "./bracketGenerator";
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
    const participants = await storage.getTournamentParticipants(parseInt(req.params.id));
    res.json(participants);
  });

  // Generate tournament bracket
  app.post("/api/tournaments/:id/generate-bracket", async (req, res) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const participants = await storage.getTournamentParticipants(tournamentId);
      
      if (participants.length === 0) {
        return res.status(400).json({ error: "No participants found" });
      }

      await BracketGenerator.generateBracket(tournamentId, participants);
      
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
      
      // Find the segment
      const segments = await storage.getMatchSegments(matchId);
      const segment = segments.find(s => s.segment === segmentCode);
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
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
      
      // Find the segment
      const segments = await storage.getMatchSegments(matchId);
      const segment = segments.find(s => s.segment === segmentCode);
      
      if (!segment) {
        return res.status(404).json({ error: "Segment not found" });
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
