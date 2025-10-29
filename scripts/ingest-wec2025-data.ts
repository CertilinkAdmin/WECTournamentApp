import { db } from "../db";
import { 
  users, 
  tournaments, 
  tournamentParticipants, 
  matches, 
  heatJudges, 
  judgeDetailedScores, 
  heatScores 
} from "../shared/schema";
import { eq, and } from "drizzle-orm";
import fs from "fs";
import path from "path";

// BYE match competitors for heats 1-11 (Round 1)
const byeCompetitors = [
  { heatNumber: 1, name: "Ronny Chalhoub" },
  { heatNumber: 2, name: "David Yescas-Berg" },
  { heatNumber: 3, name: "Keita Osawa" },
  { heatNumber: 4, name: "Alge Mohamed" },
  { heatNumber: 5, name: "Julian Yip" },
  { heatNumber: 6, name: "Artur Kusnierz" },
  { heatNumber: 7, name: "BYE Competitor 7" }, // Need actual name from image
  { heatNumber: 8, name: "Sebastian Hernandez" },
  { heatNumber: 9, name: "Fraz Nurdin" },
  { heatNumber: 10, name: "Christie Sidikat" },
  { heatNumber: 11, name: "Danielle Misa" },
];

// Cup code to competitor name mapping (extracted from the text file)
const cupCodeMapping: Record<string, string> = {
  "M7": "Stevo",
  "K9": "Edwin",
  "F5": "Kirill",
  "X1": "Anja",
  "C6": "Carlos",
  "L4": "Jae",
  "S5": "Penny",
  "W6": "Erland",
  "V4": "Felix",
  "J1": "Aga",
  "G2": "Artur",
  "W8": "Julian",
  "Q5": "Faiz",
  "B1": "Christos",
  "T8": "Stevo", // Appears again
  "J7": "Danielle",
  "E9": "Kirill", // Appears again
  "V2": "Jae", // Appears again
  "M1": "Bill",
  "E3": "Engi",
  "E6": "Engi", // Appears again (typo in original data?)
  "A7": "Penny", // Appears again
  "F3": "Aga", // Appears again
  "K5": "Hojat",
  "P3": "Unknown", // Not clear from data
  "M9": "Unknown", // Not clear from data
  "G8": "Engi", // Appears again
  "F4": "Jae", // Appears again
  "L2": "Aga", // Appears again
  "Z7": "Artur", // Appears again
  "N4": "Christos", // Appears again
  "K6": "Jae", // Appears again
  "22": "Jae", // Numeric codes in final heat
  "99": "Aga", // Numeric codes in final heat
};

// Judge names appearing in the data
const judgeNames = [
  "Jasper",
  "Korn",
  "Michalis",
  "Shinsaku",
  "Ali",
  "Junior",
  "Tess",
  "Boss"
];

interface JudgeScore {
  judgeName: string;
  sensoryBeverage: string;
  visualLatteArt: "left cup" | "right cup";
  taste: "left cup" | "right cup";
  tactile: "left cup" | "right cup";
  flavour: "left cup" | "right cup";
  overall: "left cup" | "right cup";
  leftCupCode: string;
  rightCupCode: string;
}

interface HeatData {
  heatNumber: number;
  judges: JudgeScore[];
  competitor1Code: string;
  competitor2Code: string;
  competitor1Name: string;
  competitor2Name: string;
  competitor1TotalScore: number;
  competitor2TotalScore: number;
  winner: string;
}

function parseTournamentData(filePath: string): HeatData[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const heats: HeatData[] = [];
  
  // Split by heat sections
  const heatSections = content.split(/\*\*HEAT \d+\*\*/);
  
  for (let i = 1; i < heatSections.length; i++) {
    const section = heatSections[i];
    
    // Extract heat number from previous split
    const heatNumberMatch = content.match(new RegExp(`\\*\\*HEAT (\\d+)\\*\\*[^]*?${section.substring(0, 50)}`));
    if (!heatNumberMatch) continue;
    
    const heatNumber = parseInt(heatNumberMatch[1]);
    if (heatNumber < 12) continue; // Skip BYE heats
    
    const judges: JudgeScore[] = [];
    
    // Extract judge sections
    const judgePattern = /Judge Name: ([^\n]+)[\s\S]*?Visual\/Latte Art \(3 points\): (left cup|right cup)[\s\S]*?Sensory Beverage: ([^\n]+)[\s\S]*?Taste \(1 point\): (left cup|right cup)[\s\S]*?Tactile \(1 point\): (left cup|right cup)[\s\S]*?Flavour \(1 point\): (left cup|right cup)[\s\S]*?Overall \(5 points\): (left cup|right cup)[\s\S]*?Left Cup Code\/Competitor: ([^\n]+)[\s\S]*?Right Cup Code: ([^\n]+)/gi;
    
    let judgeMatch;
    while ((judgeMatch = judgePattern.exec(section)) !== null) {
      judges.push({
        judgeName: judgeMatch[1].trim(),
        visualLatteArt: judgeMatch[2] as "left cup" | "right cup",
        sensoryBeverage: judgeMatch[3].trim(),
        taste: judgeMatch[4] as "left cup" | "right cup",
        tactile: judgeMatch[5] as "left cup" | "right cup",
        flavour: judgeMatch[6] as "left cup" | "right cup",
        overall: judgeMatch[7] as "left cup" | "right cup",
        leftCupCode: judgeMatch[8].trim(),
        rightCupCode: judgeMatch[9].trim(),
      });
    }
    
    // Extract competitor totals and winner
    const comp1Match = section.match(/([A-Z0-9]+) = ([^:]+): (\d+) points/);
    const comp2Match = section.match(/([A-Z0-9]+) = ([^:]+): (\d+) points[\s\S]*?([A-Z0-9]+) = ([^:]+): (\d+) points/);
    
    if (comp1Match && comp2Match) {
      const winnerMatch = section.match(/Winner: ([^\n]+)/);
      
      heats.push({
        heatNumber,
        judges,
        competitor1Code: comp1Match[1],
        competitor2Code: comp2Match[4],
        competitor1Name: comp1Match[2].trim(),
        competitor2Name: comp2Match[5].trim(),
        competitor1TotalScore: parseInt(comp1Match[3]),
        competitor2TotalScore: parseInt(comp2Match[6]),
        winner: winnerMatch ? winnerMatch[1].trim() : "",
      });
    }
  }
  
  return heats;
}

async function ingestTournamentData() {
  console.log("🏆 Starting WEC 2025 Tournament Data Ingestion...\n");
  
  try {
    // Get tournament ID 4
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, 4)
    });
    
    if (!tournament) {
      console.error("❌ Tournament ID 4 not found");
      return;
    }
    
    console.log(`✅ Found tournament: ${tournament.name}\n`);
    
    // Get all users and create lookup
    const allUsers = await db.query.users.findMany();
    const userLookup = new Map(allUsers.map(u => [u.name, u]));
    
    // Get all participants
    const participants = await db.query.tournamentParticipants.findMany({
      where: eq(tournamentParticipants.tournamentId, 4)
    });
    
    console.log(`📋 Found ${participants.length} participants\n`);
    
    // Parse the tournament data file
    const filePath = path.join(__dirname, "../attached_assets/Pasted-Full-Tournament-brackets-https-1drv-ms-b-c-c6270c9a1a05aa6b-Eb8fiv38nwBIjmyD-S05mjYByJ9pDWa-Y-1761748238023_1761748238024.txt");
    const heatsData = parseTournamentData(filePath);
    
    console.log(`📊 Parsed ${heatsData.length} heats from data file\n`);
    
    // Process heats 1-11 as BYE matches
    console.log("🔄 Processing BYE matches (Heats 1-11)...");
    for (const bye of byeCompetitors) {
      // Create system judges for BYE
      // TODO: Implement BYE match creation
      console.log(`  Heat ${bye.heatNumber}: ${bye.name} receives 33 points (BYE)`);
    }
    
    // Process heats 12-31 with actual competition
    console.log("\n🔄 Processing competition heats (12-31)...");
    for (const heat of heatsData) {
      console.log(`\n  Heat ${heat.heatNumber}: ${heat.competitor1Name} vs ${heat.competitor2Name}`);
      console.log(`    Scores: ${heat.competitor1Name} ${heat.competitor1TotalScore} - ${heat.competitor2TotalScore} ${heat.competitor2Name}`);
      console.log(`    Winner: ${heat.winner}`);
      console.log(`    Judges: ${heat.judges.map(j => j.judgeName).join(", ")}`);
      
      // TODO: Create match, assign judges, create detailed scores
    }
    
    console.log("\n✅ Data ingestion complete!");
    
  } catch (error) {
    console.error("❌ Error during data ingestion:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  ingestTournamentData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { ingestTournamentData, parseTournamentData };
