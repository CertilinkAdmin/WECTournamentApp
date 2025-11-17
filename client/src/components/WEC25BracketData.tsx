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
  score1: number;
  score2: number;
  judges?: JudgeScore[];
  leftCupCode?: string;
  rightCupCode?: string;
}

export const WEC25_COMPETITORS = [
  // WEC25 Competitors from the tournament bracket image
  { id: 1, name: "Sebastian Hernandez", email: "sebastian@example.com", role: "BARISTA" as const },
  { id: 2, name: "Faiz Nordin", email: "faiz@example.com", role: "BARISTA" as const },
  { id: 3, name: "Christos Sotiros", email: "christos@example.com", role: "BARISTA" as const },
  { id: 4, name: "Daniele Ricci", email: "daniele@example.com", role: "BARISTA" as const },
  { id: 5, name: "Stevo Kühn", email: "stevo@example.com", role: "BARISTA" as const },
  { id: 6, name: "Edwin Tascon", email: "edwin@example.com", role: "BARISTA" as const },
  { id: 7, name: "Kirill Shlyakov", email: "kirill@example.com", role: "BARISTA" as const },
  { id: 8, name: "Anja Fürst", email: "anja@example.com", role: "BARISTA" as const },
  { id: 9, name: "Carlos Medina", email: "carlos@example.com", role: "BARISTA" as const },
  { id: 10, name: "Jae Kim", email: "jae@example.com", role: "BARISTA" as const },
  { id: 11, name: "Bill Nguyen", email: "bill@example.com", role: "BARISTA" as const },
  { id: 12, name: "Engi Pan", email: "engi@example.com", role: "BARISTA" as const },
  { id: 13, name: "Hojat Mousavi", email: "hojat@example.com", role: "BARISTA" as const },
  { id: 14, name: "Aga Muhammed", email: "aga@example.com", role: "BARISTA" as const },
];

export const WEC25_BRACKET_POSITIONS: BracketPosition[] = [
  // Round 1 - Heats 1-16 (Bye heats 1-11, competitive heats 12-16)
  // Accurate BYE matchups for Round 1
  { 
    heatNumber: 1, 
    station: "A", 
    competitor1: "Penny", 
    competitor2: "BYE", 
    winner: "Penny", 
    score1: 33, 
    score2: 0,
    leftCupCode: "S5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 2, 
    station: "B", 
    competitor1: "Erland", 
    competitor2: "BYE", 
    winner: "Erland", 
    score1: 33, 
    score2: 0,
    leftCupCode: "W6",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 3, 
    station: "C", 
    competitor1: "Felix", 
    competitor2: "BYE", 
    winner: "Felix", 
    score1: 33, 
    score2: 0,
    leftCupCode: "V4",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 4, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "BYE", 
    winner: "Aga", 
    score1: 33, 
    score2: 0,
    leftCupCode: "J1",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 5, 
    station: "B", 
    competitor1: "Julian", 
    competitor2: "BYE", 
    winner: "Julian", 
    score1: 33, 
    score2: 0,
    leftCupCode: "W8",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 6, 
    station: "C", 
    competitor1: "Artur", 
    competitor2: "BYE", 
    winner: "Artur", 
    score1: 33, 
    score2: 0,
    leftCupCode: "G2",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 7, 
    station: "A", 
    competitor1: "Hojat", 
    competitor2: "BYE", 
    winner: "Hojat", 
    score1: 33, 
    score2: 0,
    leftCupCode: "K5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 8, 
    station: "B", 
    competitor1: "SCRATCHED", 
    competitor2: "BYE", 
    winner: "BYE", 
    score1: 0, 
    score2: 33,
    leftCupCode: "SCRATCHED",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 9, 
    station: "C", 
    competitor1: "Faiz", 
    competitor2: "BYE", 
    winner: "Faiz", 
    score1: 33, 
    score2: 0,
    leftCupCode: "Q5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 10, 
    station: "A", 
    competitor1: "Christos", 
    competitor2: "BYE", 
    winner: "Christos", 
    score1: 33, 
    score2: 0,
    leftCupCode: "B1",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 11, 
    station: "B", 
    competitor1: "Daniele", 
    competitor2: "BYE", 
    winner: "Daniele", 
    score1: 33, 
    score2: 0,
    leftCupCode: "J7",
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
    leftCupCode: "M7",
    rightCupCode: "K9",
    judges: [
      {
        judgeName: "Jasper",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "K9",
        rightCupCode: "M7"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "M7",
        rightCupCode: "K9"
      },
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "right",
        overall: "left",
        leftCupCode: "M7",
        rightCupCode: "K9"
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
    leftCupCode: "F5",
    rightCupCode: "X1",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "F5",
        rightCupCode: "X1"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "X1",
        rightCupCode: "F5"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "X1",
        rightCupCode: "F5"
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
    leftCupCode: "L4",
    rightCupCode: "C6",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "C6",
        rightCupCode: "L4"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "C6",
        rightCupCode: "L4"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "C6",
        rightCupCode: "L4"
      }
    ]
  },
  { 
    heatNumber: 15, 
    station: "C", 
    competitor1: "Bill", 
    competitor2: "BYE", 
    winner: "Bill", 
    score1: 33, 
    score2: 0,
    leftCupCode: "N2",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 16, 
    station: "A", 
    competitor1: "Engi", 
    competitor2: "BYE", 
    winner: "Engi", 
    score1: 33, 
    score2: 0,
    leftCupCode: "Y9",
    rightCupCode: "BYE"
  },
];

export const WEC25_ROUND2_POSITIONS: BracketPosition[] = [
  // Round 2 - Heats 17-24
  { 
    heatNumber: 17, 
    station: "B", 
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
    station: "C", 
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
    station: "A", 
    competitor1: "Artur", 
    competitor2: "Julian", 
    winner: "Artur", 
    score1: 24, 
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
    station: "B", 
    competitor1: "Daniele", 
    competitor2: "BYE", 
    winner: "Daniele", 
    score1: 33, 
    score2: 0,
    leftCupCode: "J7",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 21, 
    station: "C", 
    competitor1: "Faiz", 
    competitor2: "Christos", 
    winner: "Christos", 
    score1: 15, 
    score2: 18,
    leftCupCode: "Q5",
    rightCupCode: "B1",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "right",
        flavour: "left",
        overall: "left",
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
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "Q5",
        rightCupCode: "B1"
      }
    ]
  },
  { 
    heatNumber: 22, 
    station: "A", 
    competitor1: "Stevo", 
    competitor2: "Daniele", 
    winner: "Stevo", 
    score1: 25, 
    score2: 8,
    leftCupCode: "M7",
    rightCupCode: "J7",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "M7",
        rightCupCode: "J7"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "M7",
        rightCupCode: "J7"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "M7",
        rightCupCode: "J7"
      }
    ]
  },
  { 
    heatNumber: 23, 
    station: "B", 
    competitor1: "Jae", 
    competitor2: "Kirill", 
    winner: "Jae", 
    score1: 23, 
    score2: 10,
    leftCupCode: "L4",
    rightCupCode: "F5",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "F5",
        rightCupCode: "L4"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "F5",
        rightCupCode: "L4"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "F5",
        rightCupCode: "L4"
      }
    ]
  },
  { 
    heatNumber: 24, 
    station: "C", 
    competitor1: "Engi", 
    competitor2: "Bill", 
    winner: "Engi", 
    score1: 19, 
    score2: 14,
    leftCupCode: "Y9",
    rightCupCode: "N2",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "right",
        flavour: "left",
        overall: "left",
        leftCupCode: "Y9",
        rightCupCode: "N2"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "Y9",
        rightCupCode: "N2"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "Y9",
        rightCupCode: "N2"
      }
    ]
  },
];

export const WEC25_ROUND3_POSITIONS: BracketPosition[] = [
  // Round 3 - Heats 25-28
  { 
    heatNumber: 25, 
    station: "A", 
    competitor1: "Penny", 
    competitor2: "Aga", 
    winner: "Aga", 
    score1: 8, 
    score2: 25,
    leftCupCode: "S5",
    rightCupCode: "J1",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "S5",
        rightCupCode: "J1"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "S5",
        rightCupCode: "J1"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "S5",
        rightCupCode: "J1"
      }
    ]
  },
  { 
    heatNumber: 26, 
    station: "B", 
    competitor1: "Hojat", 
    competitor2: "Artur", 
    winner: "Artur", 
    score1: 9, 
    score2: 24,
    leftCupCode: "K5",
    rightCupCode: "G2",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "K5",
        rightCupCode: "G2"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "K5",
        rightCupCode: "G2"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "K5",
        rightCupCode: "G2"
      }
    ]
  },
  { 
    heatNumber: 27, 
    station: "C", 
    competitor1: "Christos", 
    competitor2: "Stevo", 
    winner: "Stevo", 
    score1: 14, 
    score2: 19,
    leftCupCode: "B1",
    rightCupCode: "M7",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "B1",
        rightCupCode: "M7"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "B1",
        rightCupCode: "M7"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "B1",
        rightCupCode: "M7"
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
    leftCupCode: "L4",
    rightCupCode: "Y9",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "Y9",
        rightCupCode: "L4"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "Y9",
        rightCupCode: "L4"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "L4",
        rightCupCode: "Y9"
      }
    ]
  },
];

export const WEC25_ROUND4_POSITIONS: BracketPosition[] = [
  // Round 4 - Heats 29-30
  { 
    heatNumber: 29, 
    station: "B", 
    competitor1: "Aga", 
    competitor2: "Artur", 
    winner: "Aga", 
    score1: 25, 
    score2: 8,
    leftCupCode: "J1",
    rightCupCode: "G2",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "J1",
        rightCupCode: "G2"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "G2",
        rightCupCode: "J1"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "G2",
        rightCupCode: "J1"
      }
    ]
  },
  { 
    heatNumber: 30, 
    station: "C", 
    competitor1: "Christos", 
    competitor2: "Jae", 
    winner: "Jae", 
    score1: 14, 
    score2: 19,
    leftCupCode: "B1",
    rightCupCode: "L4",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "B1",
        rightCupCode: "L4"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "B1",
        rightCupCode: "L4"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "B1",
        rightCupCode: "L4"
      }
    ]
  },
];

export const WEC25_FINAL_POSITION: BracketPosition[] = [
  // Final - Heat 31 (CHAMPION: Aga)
  { 
    heatNumber: 31, 
    station: "A", 
    competitor1: "Aga", 
    competitor2: "Jae", 
    winner: "Aga", 
    score1: 19, 
    score2: 14,
    leftCupCode: "J1",
    rightCupCode: "L4",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "L4",
        rightCupCode: "J1"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "L4",
        rightCupCode: "J1"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "J1",
        rightCupCode: "L4"
      }
    ]
  },
];
