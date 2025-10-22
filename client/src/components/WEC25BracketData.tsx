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
  // Round 1 - Heats 1-16
  { heatNumber: 1, station: "A", competitor1: "Penny Chalkiadaki", competitor2: "BUY" },
  { heatNumber: 2, station: "B", competitor1: "Erlend Wessel-Berg", competitor2: "BUY" },
  { heatNumber: 3, station: "C", competitor1: "Felix Ouma", competitor2: "BUY" },
  { heatNumber: 4, station: "A", competitor1: "Aga Muhammed", competitor2: "BUY" },
  { heatNumber: 5, station: "B", competitor1: "Julian Teo", competitor2: "BUY" },
  { heatNumber: 6, station: "C", competitor1: "Artur Kosteniuk", competitor2: "BUY" },
  { heatNumber: 7, station: "A", competitor1: "Hojat Mousavi", competitor2: "BUY" },
  { heatNumber: 8, station: "B", competitor1: "Sebastian Hernandez", competitor2: "BUY" },
  { heatNumber: 9, station: "C", competitor1: "Faiz Nordin", competitor2: "Cristian Fernández" },
  { heatNumber: 10, station: "A", competitor1: "Christos Sotiros", competitor2: "Daniele Ricci" },
  { heatNumber: 11, station: "B", competitor1: "Cristian Fernández", competitor2: "Daniele Ricci" },
  { heatNumber: 12, station: "C", competitor1: "Stevo Kühn", competitor2: "Edwin Tascon" },
  { heatNumber: 13, station: "A", competitor1: "Shlyakov Kirill", competitor2: "Anja Fürst" },
  { heatNumber: 14, station: "B", competitor1: "Carlos Medina", competitor2: "Jae Kim" },
  { heatNumber: 15, station: "C", competitor1: "Bill Nguyen", competitor2: "Chris Rodriguez" },
  { heatNumber: 16, station: "A", competitor1: "Engi Pan", competitor2: "Gary Au" },
];

export const WEC25_ROUND2_POSITIONS = [
  // Round 2 - Heats 17-24
  { heatNumber: 17, station: "B", competitor1: "H1", competitor2: "H2" }, // Penny vs Erlend
  { heatNumber: 18, station: "C", competitor1: "H3", competitor2: "H4" }, // Felix vs Aga
  { heatNumber: 19, station: "A", competitor1: "H5", competitor2: "H6" }, // Julian vs Artur
  { heatNumber: 20, station: "B", competitor1: "H7", competitor2: "H8" }, // Hojat vs Sebastian
  { heatNumber: 21, station: "C", competitor1: "H9", competitor2: "H10" }, // Faiz/Cristian vs Christos/Daniele
  { heatNumber: 22, station: "A", competitor1: "H11", competitor2: "H12" }, // Cristian/Daniele vs Stevo/Edwin
  { heatNumber: 23, station: "B", competitor1: "H13", competitor2: "H14" }, // Kirill/Anja vs Carlos/Jae
  { heatNumber: 24, station: "C", competitor1: "H15", competitor2: "H16" }, // Bill/Chris vs Engi/Gary
];

export const WEC25_ROUND3_POSITIONS = [
  // Round 3 - Heats 25-28
  { heatNumber: 25, station: "A", competitor1: "H17", competitor2: "H18" },
  { heatNumber: 26, station: "B", competitor1: "H19", competitor2: "H20" },
  { heatNumber: 27, station: "C", competitor1: "H21", competitor2: "H22" },
  { heatNumber: 28, station: "A", competitor1: "H23", competitor2: "H24" },
];

export const WEC25_ROUND4_POSITIONS = [
  // Round 4 - Heats 29-30
  { heatNumber: 29, station: "B", competitor1: "H25", competitor2: "H26" },
  { heatNumber: 30, station: "C", competitor1: "H27", competitor2: "H28" },
];

export const WEC25_FINAL_POSITION = [
  // Final - Heat 31
  { heatNumber: 31, station: "A", competitor1: "H29", competitor2: "H30" },
];
