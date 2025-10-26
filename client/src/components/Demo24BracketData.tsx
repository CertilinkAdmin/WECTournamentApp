// Demo 24-Person Tournament Bracket Data
// Used when no active tournament exists

interface BracketPosition {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  score1: number;
  score2: number;
  leftCupCode: string;
  rightCupCode: string;
}

const DEMO_COMPETITORS = [
  "Aga Muhammed", "Sebastian Hernandez", "Faiz Nordin", "Christos Sotiros",
  "Daniele Ricci", "Stevo Kühn", "Edwin Tascon", "Kirill Shlyakov",
  "Anja Fürst", "Carlos Medina", "Jae Kim", "Bill Nguyen",
  "Engi Pan", "Hojat Mousavi", "Sofia Martinez", "Lucas Silva",
  "Emma Chen", "Noah Kim", "Olivia Rossi", "Liam O'Brien",
  "Isabella Garcia", "Mason Lee", "Sophia Patel", "James Wilson"
];

// Round 1: 8 matches (16 competitors, 8 get byes)
export const DEMO_ROUND1: BracketPosition[] = [
  { heatNumber: 1, station: "A", competitor1: "Emma Chen", competitor2: "Noah Kim", winner: "Emma Chen", score1: 31, score2: 18, leftCupCode: "A1", rightCupCode: "A2" },
  { heatNumber: 2, station: "B", competitor1: "Olivia Rossi", competitor2: "Liam O'Brien", winner: "Olivia Rossi", score1: 29, score2: 22, leftCupCode: "B1", rightCupCode: "B2" },
  { heatNumber: 3, station: "C", competitor1: "Isabella Garcia", competitor2: "Mason Lee", winner: "Isabella Garcia", score1: 33, score2: 15, leftCupCode: "C1", rightCupCode: "C2" },
  { heatNumber: 4, station: "A", competitor1: "Sophia Patel", competitor2: "James Wilson", winner: "Sophia Patel", score1: 28, score2: 24, leftCupCode: "A3", rightCupCode: "A4" },
  { heatNumber: 5, station: "B", competitor1: "Hojat Mousavi", competitor2: "Sofia Martinez", winner: "Sofia Martinez", score1: 19, score2: 32, leftCupCode: "B3", rightCupCode: "B4" },
  { heatNumber: 6, station: "C", competitor1: "Lucas Silva", competitor2: "Engi Pan", winner: "Engi Pan", score1: 21, score2: 30, leftCupCode: "C3", rightCupCode: "C4" },
  { heatNumber: 7, station: "A", competitor1: "Bill Nguyen", competitor2: "Jae Kim", winner: "Jae Kim", score1: 26, score2: 27, leftCupCode: "A5", rightCupCode: "A6" },
  { heatNumber: 8, station: "B", competitor1: "Carlos Medina", competitor2: "Anja Fürst", winner: "Anja Fürst", score1: 23, score2: 29, leftCupCode: "B5", rightCupCode: "B6" },
];

// Round 2: 8 matches (8 R1 winners + 8 byes = 16 → 8)
export const DEMO_ROUND2: BracketPosition[] = [
  { heatNumber: 9, station: "C", competitor1: "Emma Chen", competitor2: "Aga Muhammed", winner: "Aga Muhammed", score1: 25, score2: 34, leftCupCode: "C5", rightCupCode: "C6" },
  { heatNumber: 10, station: "A", competitor1: "Olivia Rossi", competitor2: "Sebastian Hernandez", winner: "Sebastian Hernandez", score1: 27, score2: 32, leftCupCode: "A7", rightCupCode: "A8" },
  { heatNumber: 11, station: "B", competitor1: "Isabella Garcia", competitor2: "Faiz Nordin", winner: "Faiz Nordin", score1: 24, score2: 31, leftCupCode: "B7", rightCupCode: "B8" },
  { heatNumber: 12, station: "C", competitor1: "Sophia Patel", competitor2: "Christos Sotiros", winner: "Christos Sotiros", score1: 22, score2: 33, leftCupCode: "C7", rightCupCode: "C8" },
  { heatNumber: 13, station: "A", competitor1: "Sofia Martinez", competitor2: "Daniele Ricci", winner: "Daniele Ricci", score1: 26, score2: 30, leftCupCode: "A9", rightCupCode: "A10" },
  { heatNumber: 14, station: "B", competitor1: "Engi Pan", competitor2: "Stevo Kühn", winner: "Stevo Kühn", score1: 28, score2: 31, leftCupCode: "B9", rightCupCode: "B10" },
  { heatNumber: 15, station: "C", competitor1: "Jae Kim", competitor2: "Edwin Tascon", winner: "Edwin Tascon", score1: 25, score2: 29, leftCupCode: "C9", rightCupCode: "C10" },
  { heatNumber: 16, station: "A", competitor1: "Anja Fürst", competitor2: "Kirill Shlyakov", winner: "Kirill Shlyakov", score1: 27, score2: 30, leftCupCode: "A11", rightCupCode: "A12" },
];

// Round 3: 4 matches (8 → 4)
export const DEMO_ROUND3: BracketPosition[] = [
  { heatNumber: 17, station: "B", competitor1: "Aga Muhammed", competitor2: "Sebastian Hernandez", winner: "Aga Muhammed", score1: 35, score2: 28, leftCupCode: "B11", rightCupCode: "B12" },
  { heatNumber: 18, station: "C", competitor1: "Faiz Nordin", competitor2: "Christos Sotiros", winner: "Faiz Nordin", score1: 32, score2: 27, leftCupCode: "C11", rightCupCode: "C12" },
  { heatNumber: 19, station: "A", competitor1: "Daniele Ricci", competitor2: "Stevo Kühn", winner: "Stevo Kühn", score1: 29, score2: 33, leftCupCode: "A13", rightCupCode: "A14" },
  { heatNumber: 20, station: "B", competitor1: "Edwin Tascon", competitor2: "Kirill Shlyakov", winner: "Kirill Shlyakov", score1: 26, score2: 31, leftCupCode: "B13", rightCupCode: "B14" },
];

// Semi-Finals: 2 matches (4 → 2)
export const DEMO_SEMIFINALS: BracketPosition[] = [
  { heatNumber: 21, station: "C", competitor1: "Aga Muhammed", competitor2: "Faiz Nordin", winner: "Aga Muhammed", score1: 36, score2: 30, leftCupCode: "C13", rightCupCode: "C14" },
  { heatNumber: 22, station: "A", competitor1: "Stevo Kühn", competitor2: "Kirill Shlyakov", winner: "Stevo Kühn", score1: 34, score2: 29, leftCupCode: "A15", rightCupCode: "A16" },
];

// Final: 1 match (2 → 1)
export const DEMO_FINAL: BracketPosition = {
  heatNumber: 23,
  station: "B",
  competitor1: "Aga Muhammed",
  competitor2: "Stevo Kühn",
  winner: "Aga Muhammed",
  score1: 38,
  score2: 32,
  leftCupCode: "B15",
  rightCupCode: "B16"
};
