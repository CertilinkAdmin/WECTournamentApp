import { storage } from "./storage";
import type { Station, TournamentParticipant, TournamentRoundTime } from "@shared/schema";

interface BracketPair {
  seed1: number;
  seed2: number;
}

export class BracketGenerator {
  /**
   * Generate tournament bracket pairings for Round 1 with bye support
   * @param totalPlayers - Any number of players (2 or more)
   * @returns Array of bracket pairs with byes for odd numbers
   */
  static generateRound1Pairings(totalPlayers: number): BracketPair[] {
    if (totalPlayers < 2) {
      throw new Error("Need at least 2 players");
    }

    const pairings: BracketPair[] = [];
    
    // If odd number of players, give the top seed a bye
    if (totalPlayers % 2 === 1) {
      // Top seed (seed 1) gets a bye - create a pairing with null for competitor2
      pairings.push({
        seed1: 1,
        seed2: 0 // Use 0 to indicate bye (will be handled as null in match creation)
      });
      
      // Pair remaining players normally (seeds 2 through totalPlayers)
      for (let i = 2; i <= Math.floor(totalPlayers / 2) + 1; i++) {
        pairings.push({
          seed1: i,
          seed2: totalPlayers - i + 2
        });
      }
    } else {
      // Even number of players - standard pairing
      const halfPlayers = totalPlayers / 2;
      for (let i = 1; i <= halfPlayers; i++) {
        pairings.push({
          seed1: i,
          seed2: totalPlayers - i + 1
        });
      }
    }

    return pairings;
  }

  /**
   * Assign station with staggered timing
   * Stations A, B, C start +0, +10, +20 minutes respectively
   * 10-minute buffer between heats on same station
   */
  static async assignStation(stations: Station[]): Promise<Station> {
    // Sort stations by next available time
    const sortedStations = [...stations].sort(
      (a, b) => a.nextAvailableAt.getTime() - b.nextAvailableAt.getTime()
    );

    // Get the station that's available soonest
    const station = sortedStations.find(s => s.status === 'AVAILABLE');
    
    if (!station) {
      throw new Error("No available stations");
    }

    return station;
  }

  /**
   * Generate complete tournament bracket with bye support
   * @param tournamentId - Tournament ID
   * @param participants - List of tournament participants with seeds
   */
  static async generateBracket(tournamentId: number, participants: TournamentParticipant[]) {
    const totalParticipants = participants.length;
    
    if (totalParticipants < 2) {
      throw new Error("Need at least 2 participants");
    }

    // Calculate total rounds needed (including byes)
    const totalRounds = Math.ceil(Math.log2(totalParticipants));

    // Get stations
    const allStations = await storage.getAllStations();
    const availableStations = allStations.filter(s => s.status === 'AVAILABLE');

    if (availableStations.length < 3) {
      throw new Error("Need at least 3 stations (A, B, C)");
    }

    // Set initial staggered start times
    const now = new Date();
    const stationA = availableStations.find(s => s.name === 'A');
    const stationB = availableStations.find(s => s.name === 'B');
    const stationC = availableStations.find(s => s.name === 'C');

    if (!stationA || !stationB || !stationC) {
      throw new Error("Stations A, B, C must exist");
    }

    // Set staggered start times
    await storage.updateStation(stationA.id, { nextAvailableAt: now });
    await storage.updateStation(stationB.id, { 
      nextAvailableAt: new Date(now.getTime() + 10 * 60 * 1000) 
    });
    await storage.updateStation(stationC.id, { 
      nextAvailableAt: new Date(now.getTime() + 20 * 60 * 1000) 
    });

    // Generate Round 1 matches
    const round1Pairings = this.generateRound1Pairings(totalParticipants);
    let heatNumber = 1;

    for (const pairing of round1Pairings) {
      const competitor1 = participants.find(p => p.seed === pairing.seed1);
      const competitor2 = pairing.seed2 === 0 ? null : participants.find(p => p.seed === pairing.seed2);

      if (!competitor1) {
        throw new Error(`Participant not found for seed ${pairing.seed1}`);
      }

      // Handle bye (seed2 is 0, indicating a bye)
      if (pairing.seed2 === 0) {
        // This is a bye - competitor1 advances automatically
        // Create a special "bye" match that's automatically won
        const match = await storage.createMatch({
          tournamentId,
          round: 1,
          heatNumber,
          stationId: null, // No station needed for bye
          competitor1Id: competitor1.userId,
          competitor2Id: null, // No second competitor for bye
          status: 'DONE', // Bye is automatically complete
          winnerId: competitor1.userId, // Winner is automatic
          startTime: new Date(),
          endTime: new Date()
        });
        
        heatNumber++;
        continue;
      }

      // Regular match with two competitors
      if (!competitor2) {
        throw new Error(`Participant not found for seed ${pairing.seed2}`);
      }

      // Assign station
      const updatedStations = await storage.getAllStations();
      const station = await this.assignStation(updatedStations.filter(s => s.status === 'AVAILABLE'));

      // Create match
      const match = await storage.createMatch({
        tournamentId,
        round: 1,
        heatNumber,
        stationId: station.id,
        competitor1Id: competitor1.userId,
        competitor2Id: competitor2.userId,
        status: 'PENDING',
        startTime: station.nextAvailableAt
      });

      // Get segment times for this round (or use defaults)
      let roundTimes = await storage.getRoundTimes(tournamentId, 1);
      if (!roundTimes) {
        // Create default times
        roundTimes = await storage.setRoundTimes({
          tournamentId,
          round: 1,
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

      // Update station availability (total minutes per heat + 10 minute buffer)
      const nextAvailable = new Date(station.nextAvailableAt.getTime() + (roundTimes.totalMinutes + 10) * 60 * 1000);
      await storage.updateStation(station.id, { nextAvailableAt: nextAvailable });

      heatNumber++;
    }

    // Create placeholder matches for subsequent rounds
    let previousRoundMatches = totalParticipants / 2;
    for (let round = 2; round <= totalRounds; round++) {
      const matchesInRound = previousRoundMatches / 2;
      
      for (let i = 0; i < matchesInRound; i++) {
        await storage.createMatch({
          tournamentId,
          round,
          heatNumber: heatNumber++,
          status: 'PENDING'
        });
      }
      
      previousRoundMatches = matchesInRound;
    }
  }

  /**
   * Randomize participant seeds
   * @param participants - Array of participants
   * @returns Participants with randomized seeds
   */
  static randomizeSeeds(participants: TournamentParticipant[]): TournamentParticipant[] {
    const shuffled = [...participants];
    
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign new seeds
    return shuffled.map((participant, index) => ({
      ...participant,
      seed: index + 1
    }));
  }
}
