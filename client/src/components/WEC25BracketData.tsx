
// WEC25 Tournament Bracket Data
// Based on the actual WEC25 tournament bracket with judges and scorecards

interface JudgeScore {
  judgeName: string;
  visualLatteArt: 'left' | 'right';
  sensoryBeverage: 'Espresso' | 'Cappuccino';
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
  leftCupCode: string;
  rightCupCode: string;
}

interface BracketPosition {
  heatNumber: number;
  station: string;
  competitor1: string;
  competitor2: string;
  winner: string;
  score1: number | null; // null for BYE heats
  score2: number | null; // null for BYE heats
  judges?: JudgeScore[];
  leftCupCode?: string;
  rightCupCode?: string;
}

export const WEC25_COMPETITORS = [
  // WEC25 Competitors from the tournament bracket
  { id: 1, name: "Penny", email: "penny@example.com", role: "BARISTA" as const },
  { id: 2, name: "Erland", email: "erland@example.com", role: "BARISTA" as const },
  { id: 3, name: "Felix", email: "felix@example.com", role: "BARISTA" as const },
  { id: 4, name: "Aga", email: "aga@example.com", role: "BARISTA" as const },
  { id: 5, name: "Julian", email: "julian@example.com", role: "BARISTA" as const },
  { id: 6, name: "Artur", email: "artur@example.com", role: "BARISTA" as const },
  { id: 7, name: "Hojat", email: "hojat@example.com", role: "BARISTA" as const },
  { id: 8, name: "Faiz", email: "faiz@example.com", role: "BARISTA" as const },
  { id: 9, name: "Christos", email: "christos@example.com", role: "BARISTA" as const },
  { id: 10, name: "Daniele", email: "daniele@example.com", role: "BARISTA" as const },
  { id: 11, name: "Stevo", email: "stevo@example.com", role: "BARISTA" as const },
  { id: 12, name: "Edwin", email: "edwin@example.com", role: "BARISTA" as const },
  { id: 13, name: "Kirill", email: "kirill@example.com", role: "BARISTA" as const },
  { id: 14, name: "Anja", email: "anja@example.com", role: "BARISTA" as const },
  { id: 15, name: "Jae", email: "jae@example.com", role: "BARISTA" as const },
  { id: 16, name: "Carlos", email: "carlos@example.com", role: "BARISTA" as const },
  { id: 17, name: "Bill", email: "bill@example.com", role: "BARISTA" as const },
  { id: 18, name: "Engi", email: "engi@example.com", role: "BARISTA" as const },
];

// Round 1 - Round of 32 (Heats 1-16)
export const WEC25_BRACKET_POSITIONS: BracketPosition[] = [
  { 
    heatNumber: 1, 
    station: "A", 
    competitor1: "Penny", 
    competitor2: "BYE", 
    winner: "Penny", 
    score1: null, 
    score2: null,
    leftCupCode: "P1",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 2, 
    station: "B", 
    competitor1: "Erland", 
    competitor2: "BYE", 
    winner: "Erland", 
    score1: null, 
    score2: null,
    leftCupCode: "E2",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 3, 
    station: "C", 
    competitor1: "Felix", 
    competitor2: "BYE", 
    winner: "Felix", 
    score1: null, 
    score2: null,
    leftCupCode: "F3",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 4, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "BYE", 
    winner: "Aga", 
    score1: null, 
    score2: null,
    leftCupCode: "A4",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 5, 
    station: "B", 
    competitor1: "Julian", 
    competitor2: "BYE", 
    winner: "Julian", 
    score1: null, 
    score2: null,
    leftCupCode: "J5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 6, 
    station: "C", 
    competitor1: "Artur", 
    competitor2: "BYE", 
    winner: "Artur", 
    score1: null, 
    score2: null,
    leftCupCode: "A6",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 7, 
    station: "A", 
    competitor1: "Hojat", 
    competitor2: "BYE", 
    winner: "Hojat", 
    score1: null, 
    score2: null,
    leftCupCode: "H7",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 8, 
    station: "B", 
    competitor1: "SCRATCHED", 
    competitor2: "BYE", 
    winner: "BYE", 
    score1: null, 
    score2: null,
    leftCupCode: "SCRATCHED",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 9, 
    station: "C", 
    competitor1: "Faiz", 
    competitor2: "BYE", 
    winner: "Faiz", 
    score1: null, 
    score2: null,
    leftCupCode: "F9",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 10, 
    station: "A", 
    competitor1: "Christos", 
    competitor2: "BYE", 
    winner: "Christos", 
    score1: null, 
    score2: null,
    leftCupCode: "C10",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 11, 
    station: "B", 
    competitor1: "Daniele", 
    competitor2: "BYE", 
    winner: "Daniele", 
    score1: null, 
    score2: null,
    leftCupCode: "D11",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 12, 
    station: "C", 
    competitor1: "Stevo", 
    competitor2: "Edwin", 
    winner: "Stevo", 
    score1: 28, 
    score2: 5,
    leftCupCode: "S12",
    rightCupCode: "E12",
    judges: [
      {
        judgeName: "Jasper",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "S12",
        rightCupCode: "E12"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "S12",
        rightCupCode: "E12"
      },
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "right",
        overall: "left",
        leftCupCode: "S12",
        rightCupCode: "E12"
      }
    ]
  },
  { 
    heatNumber: 13, 
    station: "A", 
    competitor1: "Kirill", 
    competitor2: "Anja", 
    winner: "Kirill", 
    score1: 24, 
    score2: 9,
    leftCupCode: "K13",
    rightCupCode: "A13",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "K13",
        rightCupCode: "A13"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "K13",
        rightCupCode: "A13"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "K13",
        rightCupCode: "A13"
      }
    ]
  },
  { 
    heatNumber: 14, 
    station: "B", 
    competitor1: "Jae", 
    competitor2: "Carlos", 
    winner: "Jae", 
    score1: 28, 
    score2: 5,
    leftCupCode: "J14",
    rightCupCode: "C14",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "J14",
        rightCupCode: "C14"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "J14",
        rightCupCode: "C14"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "J14",
        rightCupCode: "C14"
      }
    ]
  },
  { 
    heatNumber: 15, 
    station: "C", 
    competitor1: "Bill", 
    competitor2: "BYE", 
    winner: "Bill", 
    score1: null, 
    score2: null,
    leftCupCode: "B15",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 16, 
    station: "A", 
    competitor1: "Engi", 
    competitor2: "BYE", 
    winner: "Engi", 
    score1: null, 
    score2: null,
    leftCupCode: "E16",
    rightCupCode: "BYE"
  },
];

// Round 2 - Round of 16 (Heats 17-24)
export const WEC25_ROUND2_POSITIONS: BracketPosition[] = [
  { 
    heatNumber: 17, 
    station: "A", 
    competitor1: "Erland", 
    competitor2: "Penny", 
    winner: "Penny", 
    score1: 9, 
    score2: 24,
    leftCupCode: "W6",
    rightCupCode: "S5",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "S5",
        rightCupCode: "W6"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "W6",
        rightCupCode: "S5"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "W6",
        rightCupCode: "S5"
      }
    ]
  },
  { 
    heatNumber: 18, 
    station: "B", 
    competitor1: "Felix", 
    competitor2: "Aga", 
    winner: "Aga", 
    score1: 2, 
    score2: 31,
    leftCupCode: "V4",
    rightCupCode: "J1",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "V4",
        rightCupCode: "J1"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "V4",
        rightCupCode: "J1"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "V4",
        rightCupCode: "J1"
      }
    ]
  },
  { 
    heatNumber: 19, 
    station: "C", 
    competitor1: "Artur", 
    competitor2: "Julian", 
    winner: "Artur", 
    score1: 2, 
    score2: 9,
    leftCupCode: "G2",
    rightCupCode: "W8",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "G2",
        rightCupCode: "W8"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "G2",
        rightCupCode: "W8"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "G2",
        rightCupCode: "W8"
      }
    ]
  },
  { 
    heatNumber: 20, 
    station: "A", 
    competitor1: "Daniele", 
    competitor2: "BYE", 
    winner: "Daniele", 
    score1: null, 
    score2: null,
    leftCupCode: "D20",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 21, 
    station: "B", 
    competitor1: "Faiz", 
    competitor2: "Christos", 
    winner: "Christos", 
    score1: 8, 
    score2: 25,
    leftCupCode: "Q5",
    rightCupCode: "B1",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "Q5",
        rightCupCode: "B1"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "Q5",
        rightCupCode: "B1"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "B1",
        rightCupCode: "Q5"
      }
    ]
  },
  { 
    heatNumber: 22, 
    station: "C", 
    competitor1: "Stevo", 
    competitor2: "Daniele", 
    winner: "Stevo", 
    score1: 19, 
    score2: 14,
    leftCupCode: "T8",
    rightCupCode: "J7",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "T8",
        rightCupCode: "J7"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "J7",
        rightCupCode: "T8"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "J7",
        rightCupCode: "T8"
      }
    ]
  },
  { 
    heatNumber: 23, 
    station: "A", 
    competitor1: "Jae", 
    competitor2: "Kirill", 
    winner: "Jae", 
    score1: 27, 
    score2: 6,
    leftCupCode: "E9",
    rightCupCode: "V2",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "E9",
        rightCupCode: "V2"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "E9",
        rightCupCode: "V2"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "V2",
        rightCupCode: "E9"
      }
    ]
  },
  { 
    heatNumber: 24, 
    station: "B", 
    competitor1: "Engi", 
    competitor2: "Bill", 
    winner: "Engi", 
    score1: 24, 
    score2: 9,
    leftCupCode: "E24",
    rightCupCode: "B24",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "E24",
        rightCupCode: "B24"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "E24",
        rightCupCode: "B24"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "E24",
        rightCupCode: "B24"
      }
    ]
  },
];

// Round 3 - Quarterfinals (Heats 25-28)
export const WEC25_ROUND3_POSITIONS: BracketPosition[] = [
  { 
    heatNumber: 25, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "Penny", 
    winner: "Aga", 
    score1: 25, 
    score2: 8,
    leftCupCode: "A25",
    rightCupCode: "P25",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A25",
        rightCupCode: "P25"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A25",
        rightCupCode: "P25"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A25",
        rightCupCode: "P25"
      }
    ]
  },
  { 
    heatNumber: 26, 
    station: "B", 
    competitor1: "Artur", 
    competitor2: "Hojat", 
    winner: "Artur", 
    score1: 24, 
    score2: 9,
    leftCupCode: "A26",
    rightCupCode: "H26",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "A26",
        rightCupCode: "H26"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "A26",
        rightCupCode: "H26"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A26",
        rightCupCode: "H26"
      }
    ]
  },
  { 
    heatNumber: 27, 
    station: "C", 
    competitor1: "Christos", 
    competitor2: "Stevo", 
    winner: "Christos", 
    score1: 24, 
    score2: 9,
    leftCupCode: "C27",
    rightCupCode: "S27",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "C27",
        rightCupCode: "S27"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "C27",
        rightCupCode: "S27"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "C27",
        rightCupCode: "S27"
      }
    ]
  },
  { 
    heatNumber: 28, 
    station: "A", 
    competitor1: "Jae", 
    competitor2: "Engi", 
    winner: "Jae", 
    score1: 23, 
    score2: 10,
    leftCupCode: "J28",
    rightCupCode: "E28",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "J28",
        rightCupCode: "E28"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "J28",
        rightCupCode: "E28"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "J28",
        rightCupCode: "E28"
      }
    ]
  },
];

// Round 4 - Semifinals (Heats 29-30)
export const WEC25_ROUND4_POSITIONS: BracketPosition[] = [
  { 
    heatNumber: 29, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "Artur", 
    winner: "Aga", 
    score1: 25, 
    score2: 8,
    leftCupCode: "A29",
    rightCupCode: "A29R",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A29",
        rightCupCode: "A29R"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A29",
        rightCupCode: "A29R"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A29",
        rightCupCode: "A29R"
      }
    ]
  },
  { 
    heatNumber: 30, 
    station: "B", 
    competitor1: "Jae", 
    competitor2: "Christos", 
    winner: "Jae", 
    score1: 19, 
    score2: 14,
    leftCupCode: "J30",
    rightCupCode: "C30",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "J30",
        rightCupCode: "C30"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "J30",
        rightCupCode: "C30"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "J30",
        rightCupCode: "C30"
      }
    ]
  },
];

// Final - Heat 31
export const WEC25_FINAL_POSITION: BracketPosition[] = [
  { 
    heatNumber: 31, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "Jae", 
    winner: "Aga", 
    score1: 19, 
    score2: 14,
    leftCupCode: "A31",
    rightCupCode: "J31",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A31",
        rightCupCode: "J31"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A31",
        rightCupCode: "J31"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A31",
        rightCupCode: "J31"
      }
    ]
  },
];
