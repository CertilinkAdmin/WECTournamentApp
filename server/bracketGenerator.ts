import { storage } from "./storage";
import type { Station, TournamentParticipant, TournamentRoundTime } from "@shared/schema";

interface BracketPair {
  seed1: number;
  seed2: number;
}

// Represents a single matchup in a bracket assignment
interface BracketAssignment {
  round: number;
  heatNumber: number;
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

    // Ensure proper staggered timing is maintained
    const now = new Date();
    const stationName = station.name;

    // If this is the first heat assignment, ensure staggered timing
    if (stationName === 'A' && station.nextAvailableAt.getTime() === now.getTime()) {
      // Station A starts immediately - this is correct
    } else if (stationName === 'B' && station.nextAvailableAt.getTime() === now.getTime() + 10 * 60 * 1000) {
      // Station B starts 10 minutes after Station A - this is correct
    } else if (stationName === 'C' && station.nextAvailableAt.getTime() === now.getTime() + 20 * 60 * 1000) {
      // Station C starts 20 minutes after Station A - this is correct
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

    // Track assigned baristas per round to prevent duplicates
    const assignedBaristasInRound: Set<number> = new Set();

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

    // Set staggered start times with proper timing
    // Station A starts immediately
    await storage.updateStation(stationA.id, { 
      nextAvailableAt: now,
      status: 'AVAILABLE'
    });

    // Station B starts 10 minutes after Station A
    await storage.updateStation(stationB.id, { 
      nextAvailableAt: new Date(now.getTime() + 10 * 60 * 1000),
      status: 'AVAILABLE'
    });

    // Station C starts 20 minutes after Station A
    await storage.updateStation(stationC.id, { 
      nextAvailableAt: new Date(now.getTime() + 20 * 60 * 1000),
      status: 'AVAILABLE'
    });

    // Generate Round 1 matches with proper bracket splitting
    const round1Pairings = this.generateRound1Pairings(totalParticipants);
    let heatNumber = 1;

    // Split pairings into 3 groups for stations A, B, C
    const groupSize = Math.ceil(round1Pairings.length / 3);
    const groups = [
      round1Pairings.slice(0, groupSize),
      round1Pairings.slice(groupSize, groupSize * 2),
      round1Pairings.slice(groupSize * 2)
    ].filter(group => group.length > 0);

    // Assign each group to a station
    const stationAssignments = [
      { station: stationA, pairings: groups[0] || [] },
      { station: stationB, pairings: groups[1] || [] },
      { station: stationC, pairings: groups[2] || [] }
    ];

    for (const { station, pairings } of stationAssignments) {
      for (const pairing of pairings) {
        const competitor1 = participants.find(p => p.seed === pairing.seed1);
        const competitor2 = pairing.seed2 === 0 ? null : participants.find(p => p.seed === pairing.seed2);

        if (!competitor1) {
          throw new Error(`Participant not found for seed ${pairing.seed1}`);
        }

        // Check for duplicate assignments in the same round
        if (assignedBaristasInRound.has(competitor1.userId)) {
          throw new Error(`Barista ${competitor1.userId} already assigned in this round`);
        }
        if (competitor2 && assignedBaristasInRound.has(competitor2.userId)) {
          throw new Error(`Barista ${competitor2.userId} already assigned in this round`);
        }

        // Add baristas to tracking set
        assignedBaristasInRound.add(competitor1.userId);
        if (competitor2) {
          assignedBaristasInRound.add(competitor2.userId);
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

          // Create perfect scores for bye (33 points total)
          // 3 judges x 11 points each (3 visual + 1 taste + 1 tactile + 1 flavour + 5 overall)

          // Create 3 dummy judge users for bye matches
          const judgeNames = ['Judge 1', 'Judge 2', 'Judge 3'];
          const sensoryBeverages = ['Cappuccino', 'Espresso', 'Espresso'];

          // Get or create judge users
          const judges: { id: number; name: string }[] = [];
          for (const judgeName of judgeNames) {
            let judge = await storage.getUserByEmail(`${judgeName.toLowerCase().replace(' ', '.')}@system.bye`);
            if (!judge) {
              judge = await storage.createUser({
                name: judgeName,
                email: `${judgeName.toLowerCase().replace(' ', '.')}@system.bye`,
                role: 'JUDGE'
              });
            }
            judges.push(judge);
          }

          // Create detailed scores and aggregate scores for each judge
          for (let i = 0; i < 3; i++) {
            // Detailed score (for sensory evaluation card)
            await storage.submitDetailedScore({
              matchId: match.id,
              judgeName: judges[i].name,
              leftCupCode: 'BYE',
              rightCupCode: '—',
              sensoryBeverage: sensoryBeverages[i],
              visualLatteArt: 'left',
              taste: 'left',
              tactile: 'left',
              flavour: 'left',
              overall: 'left'
            });

            // Aggregate score (11 points per judge for bye)
            await storage.submitScore({
              matchId: match.id,
              judgeId: judges[i].id,
              competitorId: competitor1.userId,
              segment: 'DIAL_IN',
              score: 11,
              notes: 'Automatic bye advancement - perfect score'
            });
          }

          heatNumber++;
          continue;
        }

        // Regular match with two competitors
        if (!competitor2) {
          throw new Error(`Participant not found for seed ${pairing.seed2}`);
        }

        // Use the assigned station for this group
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

        // Get tournament heat structure (use round 1 as template)
        let heatStructure = await storage.getRoundTimes(tournamentId, 1);
        if (!heatStructure) {
          // Create default heat structure if none exists
          heatStructure = await storage.setRoundTimes({
            tournamentId,
            round: 1,
            dialInMinutes: 10,
            cappuccinoMinutes: 3,
            espressoMinutes: 2,
            totalMinutes: 15
          });
        }

        // Create heat segments using tournament heat structure
        await storage.createHeatSegment({
          matchId: match.id,
          segment: 'DIAL_IN',
          status: 'IDLE',
          plannedMinutes: heatStructure.dialInMinutes
        });

        await storage.createHeatSegment({
          matchId: match.id,
          segment: 'CAPPUCCINO',
          status: 'IDLE',
          plannedMinutes: heatStructure.cappuccinoMinutes
        });

        await storage.createHeatSegment({
          matchId: match.id,
          segment: 'ESPRESSO',
          status: 'IDLE',
          plannedMinutes: heatStructure.espressoMinutes
        });

        // Assign 3 judges to this heat (2 ESPRESSO, 1 CAPPUCCINO)
        // Get all approved judges
        const allJudges = await storage.getAllUsers();
        const approvedJudges = allJudges.filter(u => u.role === 'JUDGE' && u.approved === true);

        if (approvedJudges.length >= 3) {
          // Shuffle judges for randomization
          const shuffledJudges = [...approvedJudges].sort(() => Math.random() - 0.5);

          // Select 3 unique judges (wrap around if needed)
          const selectedJudges = [];
          for (let i = 0; i < 3; i++) {
            selectedJudges.push(shuffledJudges[i % shuffledJudges.length]);
          }

          // Assign roles: 2 ESPRESSO judges (TECHNICAL), 1 CAPPUCCINO judge (SENSORY)
          // All 3 judges score latte art
          await storage.assignJudge({
            matchId: match.id,
            judgeId: selectedJudges[0].id,
            role: 'TECHNICAL' // First ESPRESSO judge
          });
          await storage.assignJudge({
            matchId: match.id,
            judgeId: selectedJudges[1].id,
            role: 'TECHNICAL' // Second ESPRESSO judge
          });
          await storage.assignJudge({
            matchId: match.id,
            judgeId: selectedJudges[2].id,
            role: 'SENSORY' // CAPPUCCINO judge
          });
        }

        // Update station availability (total minutes per heat + 10 minute buffer)
        const nextAvailable = new Date(station.nextAvailableAt.getTime() + (roundTimes.totalMinutes + 10) * 60 * 1000);
        await storage.updateStation(station.id, { nextAvailableAt: nextAvailable });

        heatNumber++;
      }
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
   * Generate cup code from name and seed
   * Format: First 2 letters of name (uppercase) + seed number
   * For test baristas: ATest, BTest, CTest, etc.
   */
  static generateCupCode(name: string, seed: number, index?: number): string {
    // Check if it's a test barista (name contains "test" case-insensitive)
    const isTest = /test/i.test(name);

    if (isTest) {
      // For test baristas: ATest, BTest, CTest, DTest, etc.
      const testIndex = index !== undefined ? index : seed - 1;
      const testLetter = String.fromCharCode(65 + (testIndex % 26)); // A=65, B=66, etc. (wrap around after Z)
      return `${testLetter}Test`;
    }

    // For regular baristas: First 2 letters (uppercase) + seed number
    // Remove all non-alphabetic characters and spaces
    const cleanName = name.trim().replace(/[^a-zA-Z]/g, '').replace(/\s+/g, '');

    // If name has less than 2 letters, pad with 'X' or use first letter twice
    let firstTwo: string;
    if (cleanName.length === 0) {
      firstTwo = 'XX';
    } else if (cleanName.length === 1) {
      firstTwo = (cleanName[0] + 'X').toUpperCase();
    } else {
      firstTwo = cleanName.substring(0, 2).toUpperCase();
    }

    return `${firstTwo}${seed}`;
  }

  /**
   * Randomize participant seeds
   * @param participants - Array of participants
   * @param allUsers - Array of all users (to get names for cup code generation)
   * @returns Participants with randomized seeds and cup codes
   */
  static randomizeSeeds(participants: TournamentParticipant[], allUsers: any[] = []): TournamentParticipant[] {
    const shuffled = [...participants];

    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Assign new seeds and generate cup codes
    return shuffled.map((participant, index) => {
      const seed = index + 1;
      const user = allUsers.find(u => u.id === participant.userId);
      const name = user?.name || 'Unknown';
      const cupCode = this.generateCupCode(name, seed, index);

      return {
        ...participant,
        seed,
        cupCode
      };
    });
  }

  /**
   * Generate Round 1 bracket with proper seeding and bye handling
   * Each participant competes once in Round 1
   */
  private static generateRound1Bracket(totalParticipants: number): BracketAssignment[] {
    // Calculate bracket size (next power of 2)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(totalParticipants)));
    const byes = bracketSize - totalParticipants;

    console.log(`📋 Round 1: ${totalParticipants} participants, ${bracketSize} bracket size, ${byes} byes`);

    const assignments: BracketAssignment[] = [];
    let heatNumber = 1;

    // Create matchups for Round 1
    for (let i = 0; i < bracketSize / 2; i++) {
      const seed1 = i * 2 + 1;
      const seed2 = i * 2 + 2;

      // Handle byes - if seed2 is beyond total participants, it's a bye
      const actualSeed2 = seed2 > totalParticipants ? 0 : seed2;

      assignments.push({
        round: 1,
        heatNumber: heatNumber++,
        seed1,
        seed2: actualSeed2
      });
    }

    return assignments;
  }

  /**
   * Generate subsequent rounds from winners (called after previous round completes)
   */
  static async generateNextRound(tournamentId: number, completedRound: number) {
    // Get all matches from the completed round
    const completedMatches = await storage.db.query.matches.findMany({
      where: (matches, { eq, and }) => and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.round, completedRound),
        eq(matches.status, 'DONE')
      )
    });

    if (completedMatches.length === 0) {
      throw new Error(`No completed matches found for round ${completedRound}`);
    }

    // Check if all matches in the round are complete
    const allMatches = await storage.db.query.matches.findMany({
      where: (matches, { eq, and }) => and(
        eq(matches.tournamentId, tournamentId),
        eq(matches.round, completedRound)
      )
    });

    if (completedMatches.length !== allMatches.length) {
      throw new Error(`Round ${completedRound} is not complete. ${completedMatches.length}/${allMatches.length} matches finished`);
    }

    // Get winners for next round
    const winners: TournamentParticipant[] = [];
    for (const match of completedMatches) {
      if (match.winnerId) {
        const winner = await storage.db.query.tournamentParticipants.findFirst({
          where: (participants, { eq, and }) => and(
            eq(participants.tournamentId, tournamentId),
            eq(participants.userId, match.winnerId!)
          )
        });
        if (winner) winners.push(winner);
      }
    }

    if (winners.length < 2) {
      console.log(`🏆 Tournament complete! Final winner determined.`);
      return;
    }

    // Generate next round bracket
    const nextRound = completedRound + 1;
    const nextRoundAssignments = this.generateRound1Bracket(winners.length);

    // Update heat numbers and round numbers
    const adjustedAssignments = nextRoundAssignments.map(assignment => ({
      ...assignment,
      round: nextRound,
      heatNumber: assignment.heatNumber + (completedRound * 100) // Offset heat numbers by round
    }));

    // Get available stations
    const allStations = await storage.getAllStations();
    const availableStations = allStations.filter(s => s.status === 'AVAILABLE');
    const stationA = availableStations.find(s => s.name === 'Station A');
    const stationB = availableStations.find(s => s.name === 'Station B');  
    const stationC = availableStations.find(s => s.name === 'Station C');

    if (!stationA || !stationB || !stationC) {
      throw new Error("Stations A, B, C must exist for next round");
    }

    // Assign to stations
    const stationAssignments = this.assignRound1ToStations(adjustedAssignments, [stationA, stationB, stationC]);

    // Create matches for next round
    for (const { station, pairings } of stationAssignments) {
      for (const pairing of pairings) {
        const competitor1 = winners.find(p => p.seed === pairing.seed1);
        const competitor2 = pairing.seed2 === 0 ? null : winners.find(p => p.seed === pairing.seed2);

        if (!competitor1) continue;

        const match = await storage.createMatch({
          tournamentId,
          round: nextRound,
          heatNumber: pairing.heatNumber,
          stationId: station.id,
          competitor1Id: competitor1.userId,
          competitor2Id: competitor2?.userId || null,
          status: 'PENDING' as const
        });

        // Create heat segments
        await storage.createHeatSegments(match.id);
      }
    }

    console.log(`✅ Generated Round ${nextRound} with ${adjustedAssignments.length} matches`);
  }

  /**
   * Assign Round 1 heats to stations in round-robin fashion
   */
  private static assignRound1ToStations(
    assignments: BracketAssignment[],
    stations: { id: number; name: string }[]
  ): { station: { id: number; name: string }; pairings: BracketAssignment[] }[] {
    const result: { station: { id: number; name: string }; pairings: BracketAssignment[] }[] = [];

    // Initialize station assignments
    for (const station of stations) {
      result.push({ station, pairings: [] });
    }

    // Assign heats to stations in round-robin fashion
    assignments.forEach((assignment, index) => {
      const stationIndex = index % stations.length;
      result[stationIndex].pairings.push(assignment);
    });

    return result;
  }
}