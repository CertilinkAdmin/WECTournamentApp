import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, inArray } from 'drizzle-orm';
import {
  tournaments,
  users,
  tournamentParticipants,
  matches,
  heatJudges,
  judgeDetailedScores,
  heatScores,
  stations,
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Judge name mapping (Google Sheets → Database)
const JUDGE_NAME_MAP: Record<string, string> = {
  'MC': 'Michalis',
  'JASPER': 'Jasper',
  'Jasper': 'Jasper',
  'Shin': 'Shinsaku',
  'Korn': 'Korn',
  'Ali': 'Ali',
  'Junior': 'Junior',
  'Tess': 'Tess',
};

// Parse Google Sheets data structure
// Based on the spreadsheet: HEAT | JUDGE | LATTE ART | CUP CODE | BEVERAGE | TASTE | TACTILE | FLAVOUR | OVERALL
interface SheetRow {
  heat: string;
  judge: string;
  latteArt?: string; // LEFT CUP, RIGHT CUP, or ESPRESSO
  cupCode?: string;
  beverage?: string; // CAPPUCCINO or ESPRESSO
  taste?: string; // LEFT CUP, RIGHT CUP, or score
  tactile?: string; // LEFT CUP, RIGHT CUP, or score
  flavour?: string; // LEFT CUP, RIGHT CUP, or score
  overall?: string; // LEFT CUP, RIGHT CUP, or score
  total?: number;
  competitor?: string;
}

// Comprehensive data from spreadsheet
// This is a simplified structure - in production, you'd parse the actual CSV/Excel
const SPREADSHEET_DATA: Record<string, any[]> = {
  'Heat 12': [
    // CAPPUCCINO scores
    { judge: 'MC', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'right', overall: 'left' },
    { judge: 'Korn', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'right', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'JASPER', beverage: 'CAPPUCCINO', leftCup: 'M7', rightCup: 'K9', visualLatteArt: 'left', taste: 'right', tactile: 'left', flavour: 'right', overall: 'right' },
    // ESPRESSO scores
    { judge: 'Korn', beverage: 'ESPRESSO', leftCup: 'M7', rightCup: 'K9', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'JASPER', beverage: 'ESPRESSO', leftCup: 'M7', rightCup: 'K9', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 13': [
    { judge: 'Shin', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Ali', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'right', taste: 'right', tactile: 'right', flavour: 'right', overall: 'left' },
    { judge: 'Junior', beverage: 'CAPPUCCINO', leftCup: 'F5', rightCup: 'X1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Ali', beverage: 'ESPRESSO', leftCup: 'F5', rightCup: 'X1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 19': [
    { judge: 'Tess', beverage: 'CAPPUCCINO', leftCup: 'G2', rightCup: 'W8', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
    { judge: 'Junior', beverage: 'ESPRESSO', leftCup: 'G2', rightCup: 'W8', taste: 'right', tactile: 'right', flavour: 'right', overall: 'right' },
    { judge: 'Tess', beverage: 'ESPRESSO', leftCup: 'G2', rightCup: 'W8', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  ],
  'Heat 21': [
    { judge: 'MC', beverage: 'CAPPUCCINO', leftCup: 'Q5', rightCup: 'B1', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'right' },
    { judge: 'Ali', beverage: 'ESPRESSO', leftCup: 'Q5', rightCup: 'B1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
    { judge: 'Jasper', beverage: 'ESPRESSO', leftCup: 'Q5', rightCup: 'B1', taste: 'left', tactile: 'left', flavour: 'right', overall: 'right' },
  ],
  'Heat 22': [
    { judge: 'Shin', beverage: 'CAPPUCCINO', leftCup: 'T8', rightCup: 'J7', visualLatteArt: 'left', taste: 'left', tactile: 'left', flavour: 'left', overall: 'left' },
  ],
};

// Competitor to cup code mappings
const COMPETITOR_CUP_CODES: Record<string, Record<string, string>> = {
  'Heat 12': { 'Stevo': 'M7', 'Edwin': 'K9' },
  'Heat 13': { 'Kirill': 'F5', 'Anja': 'X1' },
  'Heat 19': { 'Artur': 'G2', 'Julian': 'W8' },
  'Heat 21': { 'Faiz': 'Q5', 'Christos': 'B1' },
  'Heat 22': { 'Danielle': 'T8', 'Stevo': 'J7' },
};

// Competitor names (from totals in spreadsheet)
const COMPETITOR_NAMES: Record<string, string> = {
  'M7': 'Stevo',
  'K9': 'Edwin',
  'F5': 'Kirill',
  'X1': 'Anja',
  'G2': 'Artur',
  'W8': 'Julian',
  'Q5': 'Faiz',
  'B1': 'Christos',
  'T8': 'Danielle',
  'J7': 'Stevo',
};

async function createTournament2() {
  console.log('🏆 Creating WEC 2025 Milano Tournament #2...\n');

  try {
    // 1. Create tournament
    const [tournament] = await db.insert(tournaments).values({
      name: 'WEC 2025 Milano #2',
      location: 'Milano',
      status: 'COMPLETED', // Since we're importing completed results
      totalRounds: 5,
      currentRound: 5,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
      enabledStations: ['A', 'B', 'C'],
    }).returning();

    console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})\n`);

    // 2. Create stations
    const stationNames = ['A', 'B', 'C'];
    for (const name of stationNames) {
      await db.insert(stations).values({
        tournamentId: tournament.id,
        name,
        status: 'AVAILABLE',
        nextAvailableAt: new Date(),
      });
    }
    console.log(`✅ Created ${stationNames.length} stations\n`);

    // 3. Get or create users (competitors and judges)
    const allUsers = await db.select().from(users);
    const userMap = new Map<string, number>();
    allUsers.forEach(u => userMap.set(u.name.toLowerCase(), u.id));

    // Create missing competitors
    const competitorNames = new Set(Object.values(COMPETITOR_NAMES));
    for (const name of competitorNames) {
      const key = name.toLowerCase();
      if (!userMap.has(key)) {
        const [user] = await db.insert(users).values({
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@wec2025.com`,
          role: 'BARISTA',
          approved: true,
        }).returning();
        userMap.set(key, user.id);
        console.log(`✅ Created competitor: ${name}`);
      }
    }

    // Create missing judges
    const judgeNames = new Set(Object.values(JUDGE_NAME_MAP));
    for (const name of judgeNames) {
      const key = name.toLowerCase();
      if (!userMap.has(key)) {
        const [user] = await db.insert(users).values({
          name,
          email: `${name.toLowerCase().replace(' ', '.')}@wec2025.com`,
          role: 'JUDGE',
          approved: true,
        }).returning();
        userMap.set(key, user.id);
        console.log(`✅ Created judge: ${name}`);
      }
    }
    console.log('');

    // 4. Add competitors as tournament participants
    const competitorUserIds = Array.from(competitorNames).map(name => userMap.get(name.toLowerCase())!);
    let seed = 1;
    for (const userId of competitorUserIds) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId,
        seed: seed++,
      });
    }
    console.log(`✅ Added ${competitorUserIds.length} competitors as participants\n`);

    // 5. Add judges as tournament participants
    const judgeUserIds = Array.from(judgeNames).map(name => userMap.get(name.toLowerCase())!);
    let judgeSeed = 1;
    for (const userId of judgeUserIds) {
      await db.insert(tournamentParticipants).values({
        tournamentId: tournament.id,
        userId,
        seed: judgeSeed++,
      });
    }
    console.log(`✅ Added ${judgeUserIds.length} judges as participants\n`);

    // 6. First, get the structure from tournament 1 to replicate bye rounds
    const tournament1Matches = await db.select().from(matches).where(eq(matches.tournamentId, 1));
    const tournament1Byes = tournament1Matches.filter(m => m.competitor2Id === null);
    
    console.log(`📋 Found ${tournament1Byes.length} bye matches in tournament 1`);
    console.log(`📋 Total matches in tournament 1: ${tournament1Matches.length}\n`);

    // 7. Create matches for each heat (including byes from tournament 1 structure)
    const heatMatches: Record<string, number> = {};
    let heatNumber = 1;

    // First, create bye matches based on tournament 1 structure
    const tournament1Participants = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, 1));
    const tournament2Participants = await db.select().from(tournamentParticipants).where(eq(tournamentParticipants.tournamentId, tournament.id));
    
    // Map tournament 1 seeds to tournament 2 seeds (assuming same structure)
    const seedMap = new Map<number, number>();
    tournament1Participants.forEach((p1, idx) => {
      const p2 = tournament2Participants[idx];
      if (p2) seedMap.set(p1.seed, p2.seed);
    });

    // Create bye matches from tournament 1
    for (const byeMatch of tournament1Byes) {
      if (byeMatch.round === 1 && byeMatch.competitor1Id) {
        // Find the participant in tournament 1 with this competitor
        const t1Participant = tournament1Participants.find(p => p.userId === byeMatch.competitor1Id);
        if (t1Participant) {
          const t2Seed = seedMap.get(t1Participant.seed);
          if (t2Seed) {
            const t2Participant = tournament2Participants.find(p => p.seed === t2Seed);
            if (t2Participant) {
              const [match] = await db.insert(matches).values({
                tournamentId: tournament.id,
                heatNumber: heatNumber++,
                round: 1,
                stationId: null, // No station for bye
                competitor1Id: t2Participant.userId,
                competitor2Id: null, // Bye
                status: 'DONE',
                winnerId: t2Participant.userId, // Automatic winner
                startTime: new Date(),
                endTime: new Date(),
              }).returning();
              console.log(`✅ Created BYE match: Heat ${match.heatNumber} - Seed ${t2Seed} (automatic advancement)`);
            }
          }
        }
      }
    }

    // Now create regular matches from spreadsheet data
    for (const [heatName, heatData] of Object.entries(SPREADSHEET_DATA)) {
      // Get competitor cup codes for this heat
      const cupCodeMap = COMPETITOR_CUP_CODES[heatName];
      if (!cupCodeMap) {
        console.log(`⚠️  Skipping ${heatName}: No cup code mapping found`);
        continue;
      }

      const competitorEntries = Object.entries(cupCodeMap);
      if (competitorEntries.length < 2) {
        console.log(`⚠️  Skipping ${heatName}: Need 2 competitors, found ${competitorEntries.length}`);
        continue;
      }

      const [comp1Name, comp1Cup] = competitorEntries[0];
      const [comp2Name, comp2Cup] = competitorEntries[1];
      const comp1Id = userMap.get(comp1Name.toLowerCase());
      const comp2Id = userMap.get(comp2Name.toLowerCase());

      if (!comp1Id || !comp2Id) {
        console.log(`⚠️  Skipping ${heatName}: Missing competitors`);
        continue;
      }

      // Get a station (round-robin)
      const stationName = stationNames[(heatNumber - 1) % stationNames.length];
      const [station] = await db.select().from(stations).where(eq(stations.tournamentId, tournament.id)).limit(1);
      
      const [match] = await db.insert(matches).values({
        tournamentId: tournament.id,
        heatNumber: heatNumber++,
        round: 1,
        stationId: station?.id,
        competitor1Id: comp1Id,
        competitor2Id: comp2Id,
        status: 'DONE',
      }).returning();

      heatMatches[heatName] = match.id;
      console.log(`✅ Created ${heatName}: ${comp1Name} (${comp1Cup}) vs ${comp2Name} (${comp2Cup}) - Match ID: ${match.id}`);
    }
    console.log('');

    // 7. Assign judges to matches and import scores
    for (const [heatName, heatData] of Object.entries(SPREADSHEET_DATA)) {
      const matchId = heatMatches[heatName];
      if (!matchId) continue;

      const match = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
      if (!match[0]) continue;

      const comp1Id = match[0].competitor1Id;
      const comp2Id = match[0].competitor2Id;
      const comp1 = allUsers.find(u => u.id === comp1Id);
      const comp2 = allUsers.find(u => u.id === comp2Id);

      // Get cup codes for this heat
      const cupCodeMap = COMPETITOR_CUP_CODES[heatName];
      let comp1Cup = '';
      let comp2Cup = '';
      if (comp1 && comp2 && cupCodeMap) {
        for (const [name, cupCode] of Object.entries(cupCodeMap)) {
          if (comp1.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(comp1.name.toLowerCase())) {
            comp1Cup = cupCode;
          }
          if (comp2.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(comp2.name.toLowerCase())) {
            comp2Cup = cupCode;
          }
        }
      }

      console.log(`\n📋 Processing ${heatName} (Match ID: ${matchId})`);
      console.log(`   Competitors: ${comp1?.name} (${comp1Cup}) vs ${comp2?.name} (${comp2Cup})`);

      // Group scores by judge
      const judgeScores: Record<string, any[]> = {};
      for (const score of heatData) {
        if (!judgeScores[score.judge]) {
          judgeScores[score.judge] = [];
        }
        judgeScores[score.judge].push(score);
      }

      // Assign judges and import scores
      const assignedJudgeIds: number[] = [];
      for (const [judgeSheetName, scores] of Object.entries(judgeScores)) {
        const judgeName = JUDGE_NAME_MAP[judgeSheetName] || judgeSheetName;
        const judgeId = userMap.get(judgeName.toLowerCase());

        if (!judgeId) {
          console.log(`   ⚠️  Judge ${judgeName} not found, skipping`);
          continue;
        }

        // Assign judge to match (if not already assigned)
        if (!assignedJudgeIds.includes(judgeId)) {
          const hasEspresso = scores.some(s => s.beverage === 'ESPRESSO');
          const hasCappuccino = scores.some(s => s.beverage === 'CAPPUCCINO');
          
          await db.insert(heatJudges).values({
            matchId,
            judgeId,
            role: hasCappuccino ? 'SENSORY' : 'TECHNICAL',
          }).onConflictDoNothing();
          assignedJudgeIds.push(judgeId);
        }

        // Import detailed scores
        for (const score of scores) {
          const leftCupCode = score.leftCup;
          const rightCupCode = score.rightCup;

          // Determine which cup is left/right based on competitor cup codes
          let leftCup = '';
          let rightCup = '';
          if (leftCupCode === comp1Cup || rightCupCode === comp1Cup) {
            leftCup = comp1Cup;
            rightCup = comp2Cup;
          } else {
            leftCup = comp2Cup;
            rightCup = comp1Cup;
          }

          // Parse scores
          // For CAPPUCCINO: visualLatteArt is scored (3 points)
          // For ESPRESSO: visualLatteArt is not scored but still needs a value (use empty string or 'N/A')
          const visualLatteArt = score.beverage === 'CAPPUCCINO' && score.visualLatteArt
            ? (score.visualLatteArt === 'left' ? leftCup : score.visualLatteArt === 'right' ? rightCup : '')
            : ''; // ESPRESSO uses empty string for visualLatteArt
          const taste = score.taste === 'left' ? leftCup : score.taste === 'right' ? rightCup : '';
          const tactile = score.tactile === 'left' ? leftCup : score.tactile === 'right' ? rightCup : '';
          const flavour = score.flavour === 'left' ? leftCup : score.flavour === 'right' ? rightCup : '';
          const overall = score.overall === 'left' ? leftCup : score.overall === 'right' ? rightCup : '';

          await db.insert(judgeDetailedScores).values({
            matchId,
            judgeName: judgeName,
            leftCupCode: leftCup,
            rightCupCode: rightCup,
            sensoryBeverage: score.beverage,
            visualLatteArt: visualLatteArt,
            taste: taste,
            tactile: tactile,
            flavour: flavour,
            overall: overall,
          }).onConflictDoNothing();
        }
      }

      // Calculate and insert total scores
      const allDetailedScores = await db.select().from(judgeDetailedScores).where(eq(judgeDetailedScores.matchId, matchId));
      
      const calculateTotal = (cupCode: string) => {
        let total = 0;
        for (const score of allDetailedScores) {
          if (score.sensoryBeverage === 'CAPPUCCINO' && score.visualLatteArt === cupCode) total += 3;
          if (score.taste === cupCode) total += 1;
          if (score.tactile === cupCode) total += 1;
          if (score.flavour === cupCode) total += 1;
          if (score.overall === cupCode) total += 5;
        }
        return total;
      };

      const comp1Total = calculateTotal(comp1Cup);
      const comp2Total = calculateTotal(comp2Cup);

      // Insert total scores - use CAPPUCCINO as segment type for total scores
      await db.insert(heatScores).values({
        matchId,
        judgeId: assignedJudgeIds[0] || 1,
        competitorId: comp1Id!,
        segment: 'CAPPUCCINO', // Using CAPPUCCINO as segment type for total scores
        score: comp1Total,
        notes: 'Imported from Google Sheets - Total Score',
      }).onConflictDoNothing();

      await db.insert(heatScores).values({
        matchId,
        judgeId: assignedJudgeIds[0] || 1,
        competitorId: comp2Id!,
        segment: 'CAPPUCCINO', // Using CAPPUCCINO as segment type for total scores
        score: comp2Total,
        notes: 'Imported from Google Sheets - Total Score',
      }).onConflictDoNothing();

      console.log(`   ✅ Scores: ${comp1?.name} (${comp1Cup}) = ${comp1Total}, ${comp2?.name} (${comp2Cup}) = ${comp2Total}`);
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ TOURNAMENT #2 CREATED AND DATA IMPORTED!');
    console.log(`   Tournament ID: ${tournament.id}`);
    console.log(`   Matches Created: ${Object.keys(heatMatches).length}`);
    console.log('='.repeat(60));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

createTournament2();

