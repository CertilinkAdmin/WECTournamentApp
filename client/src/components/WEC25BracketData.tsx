// WEC25 Tournament Bracket Data
// Based on the actual WEC25 tournament bracket

export const WEC25_COMPETITORS = [
  // Round 1 Competitors
  { id: 1, name: "Penny Chalkiadaki", email: "penny@example.com", role: "BARISTA" as const },
  { id: 2, name: "Erlend Wessel-Berg", email: "erlend@example.com", role: "BARISTA" as const },
  { id: 3, name: "Felix Ouma", email: "felix@example.com", role: "BARISTA" as const },
  { id: 4, name: "Aga Muhammed", email: "aga@example.com", role: "BARISTA" as const },
  { id: 5, name: "Julian Teo", email: "julian@example.com", role: "BARISTA" as const },
  { id: 6, name: "Artur Kosteniuk", email: "artur@example.com", role: "BARISTA" as const },
  { id: 7, name: "Hojat Mousavi", email: "hojat@example.com", role: "BARISTA" as const },
  { id: 8, name: "Sebastian Hernandez", email: "sebastian@example.com", role: "BARISTA" as const },
  { id: 9, name: "Faiz Nordin", email: "faiz@example.com", role: "BARISTA" as const },
  { id: 10, name: "Cristian Fernández", email: "cristian@example.com", role: "BARISTA" as const },
  { id: 11, name: "Christos Sotiros", email: "christos@example.com", role: "BARISTA" as const },
  { id: 12, name: "Daniele Ricci", email: "daniele@example.com", role: "BARISTA" as const },
  { id: 13, name: "Stevo Kühn", email: "stevo@example.com", role: "BARISTA" as const },
  { id: 14, name: "Edwin Tascon", email: "edwin@example.com", role: "BARISTA" as const },
  { id: 15, name: "Shlyakov Kirill", email: "kirill@example.com", role: "BARISTA" as const },
  { id: 16, name: "Anja Fürst", email: "anja@example.com", role: "BARISTA" as const },
  { id: 17, name: "Carlos Medina", email: "carlos@example.com", role: "BARISTA" as const },
  { id: 18, name: "Jae Kim", email: "jae@example.com", role: "BARISTA" as const },
  { id: 19, name: "Bill Nguyen", email: "bill@example.com", role: "BARISTA" as const },
  { id: 20, name: "Chris Rodriguez", email: "chris@example.com", role: "BARISTA" as const },
  { id: 21, name: "Engi Pan", email: "engi@example.com", role: "BARISTA" as const },
  { id: 22, name: "Gary Au", email: "gary@example.com", role: "BARISTA" as const },
];

export const WEC25_BRACKET_POSITIONS = [
  // Round 1 - Heats 1-16 (All heats before 12 were byes - 33 points each)
  { heatNumber: 1, station: "A", competitor1: "Penny Chalkiadaki", competitor2: "BUY", winner: "Penny Chalkiadaki", score1: 33, score2: 0 },
  { heatNumber: 2, station: "B", competitor1: "Erlend Wessel-Berg", competitor2: "BUY", winner: "Erlend Wessel-Berg", score1: 33, score2: 0 },
  { heatNumber: 3, station: "C", competitor1: "Felix Ouma", competitor2: "BUY", winner: "Felix Ouma", score1: 33, score2: 0 },
  { heatNumber: 4, station: "A", competitor1: "Aga Muhammed", competitor2: "BUY", winner: "Aga Muhammed", score1: 33, score2: 0 },
  { heatNumber: 5, station: "B", competitor1: "Julian Teo", competitor2: "BUY", winner: "Julian Teo", score1: 33, score2: 0 },
  { heatNumber: 6, station: "C", competitor1: "Artur Kosteniuk", competitor2: "BUY", winner: "Artur Kosteniuk", score1: 33, score2: 0 },
  { heatNumber: 7, station: "A", competitor1: "Hojat Mousavi", competitor2: "BUY", winner: "Hojat Mousavi", score1: 33, score2: 0 },
  { heatNumber: 8, station: "B", competitor1: "Sebastian Hernandez", competitor2: "BUY", winner: "Sebastian Hernandez", score1: 33, score2: 0 },
  { heatNumber: 9, station: "C", competitor1: "Faiz Nordin", competitor2: "BUY", winner: "Faiz Nordin", score1: 33, score2: 0 },
  { heatNumber: 10, station: "A", competitor1: "Christos Sotiros", competitor2: "BUY", winner: "Christos Sotiros", score1: 33, score2: 0 },
  { heatNumber: 11, station: "B", competitor1: "Daniele Ricci", competitor2: "BUY", winner: "Daniele Ricci", score1: 33, score2: 0 },
  { heatNumber: 12, station: "C", competitor1: "Stevo Kühn", competitor2: "Edwin Tascon", winner: "Stevo Kühn", score1: 0, score2: 0 },
  { heatNumber: 13, station: "A", competitor1: "Shlyakov Kirill", competitor2: "Anja Fürst", winner: "Shlyakov Kirill", score1: 0, score2: 0 },
  { heatNumber: 14, station: "B", competitor1: "Carlos Medina", competitor2: "Jae Kim", winner: "Jae Kim", score1: 0, score2: 0 },
  { heatNumber: 15, station: "C", competitor1: "Bill Nguyen", competitor2: "BUY", winner: "Bill Nguyen", score1: 33, score2: 0 },
  { heatNumber: 16, station: "A", competitor1: "Engi Pan", competitor2: "BUY", winner: "Engi Pan", score1: 33, score2: 0 },
];

export const WEC25_ROUND2_POSITIONS = [
  // Round 2 - Heats 17-24 (with actual results from bracket)
  { heatNumber: 17, station: "B", competitor1: "Penny Chalkiadaki", competitor2: "Erlend Wessel-Berg", winner: "Penny Chalkiadaki", score1: 0, score2: 0 },
  { heatNumber: 18, station: "C", competitor1: "Felix Ouma", competitor2: "Aga Muhammed", winner: "Aga Muhammed", score1: 0, score2: 0 },
  { heatNumber: 19, station: "A", competitor1: "Julian Teo", competitor2: "Artur Kosteniuk", winner: "Artur Kosteniuk", score1: 0, score2: 0 },
  { heatNumber: 20, station: "B", competitor1: "Hojat Mousavi", competitor2: "Sebastian Hernandez", winner: "Hojat Mousavi", score1: 0, score2: 0 },
  { heatNumber: 21, station: "C", competitor1: "Faiz Nordin", competitor2: "Christos Sotiros", winner: "Christos Sotiros", score1: 0, score2: 0 },
  { heatNumber: 22, station: "A", competitor1: "Daniele Ricci", competitor2: "Stevo Kühn", winner: "Stevo Kühn", score1: 0, score2: 0 },
  { heatNumber: 23, station: "B", competitor1: "Shlyakov Kirill", competitor2: "Jae Kim", winner: "Jae Kim", score1: 0, score2: 0 },
  { heatNumber: 24, station: "C", competitor1: "Bill Nguyen", competitor2: "Engi Pan", winner: "Engi Pan", score1: 0, score2: 0 },
];

export const WEC25_ROUND3_POSITIONS = [
  // Round 3 - Heats 25-28 (with actual results from bracket)
  { heatNumber: 25, station: "A", competitor1: "Penny Chalkiadaki", competitor2: "Aga Muhammed", winner: "Aga Muhammed", score1: 0, score2: 0 },
  { heatNumber: 26, station: "B", competitor1: "Artur Kosteniuk", competitor2: "Hojat Mousavi", winner: "Artur Kosteniuk", score1: 0, score2: 0 },
  { heatNumber: 27, station: "C", competitor1: "Christos Sotiros", competitor2: "Stevo Kühn", winner: "Christos Sotiros", score1: 0, score2: 0 },
  { heatNumber: 28, station: "A", competitor1: "Jae Kim", competitor2: "Engi Pan", winner: "Jae Kim", score1: 0, score2: 0 },
];

export const WEC25_ROUND4_POSITIONS = [
  // Round 4 - Heats 29-30 (with actual results from bracket)
  { heatNumber: 29, station: "B", competitor1: "Aga Muhammed", competitor2: "Artur Kosteniuk", winner: "Aga Muhammed", score1: 0, score2: 0 },
  { heatNumber: 30, station: "C", competitor1: "Christos Sotiros", competitor2: "Jae Kim", winner: "Jae Kim", score1: 0, score2: 0 },
];

export const WEC25_FINAL_POSITION = [
  // Final - Heat 31 (CHAMPION: Aga Muhammed)
  { heatNumber: 31, station: "A", competitor1: "Aga Muhammed", competitor2: "Jae Kim", winner: "Aga Muhammed", score1: 0, score2: 0 },
];
