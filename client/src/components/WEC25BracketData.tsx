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
  { 
    heatNumber: 1, 
    station: "A", 
    competitor1: "Aga Muhammed", 
    competitor2: "BYE", 
    winner: "Aga Muhammed", 
    score1: 33, 
    score2: 0,
    leftCupCode: "99",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 2, 
    station: "B", 
    competitor1: "Jae Kim", 
    competitor2: "BYE", 
    winner: "Jae Kim", 
    score1: 33, 
    score2: 0,
    leftCupCode: "22",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 3, 
    station: "C", 
    competitor1: "Stevo Kühn", 
    competitor2: "BYE", 
    winner: "Stevo Kühn", 
    score1: 33, 
    score2: 0,
    leftCupCode: "M7",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 4, 
    station: "A", 
    competitor1: "Edwin Tascon", 
    competitor2: "BYE", 
    winner: "Edwin Tascon", 
    score1: 33, 
    score2: 0,
    leftCupCode: "K9",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 5, 
    station: "B", 
    competitor1: "Kirill Yudin", 
    competitor2: "BYE", 
    winner: "Kirill Yudin", 
    score1: 33, 
    score2: 0,
    leftCupCode: "F5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 6, 
    station: "C", 
    competitor1: "Anja Manfredi", 
    competitor2: "BYE", 
    winner: "Anja Manfredi", 
    score1: 33, 
    score2: 0,
    leftCupCode: "X1",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 7, 
    station: "A", 
    competitor1: "Jae Kim", 
    competitor2: "BYE", 
    winner: "Jae Kim", 
    score1: 33, 
    score2: 0,
    leftCupCode: "L4",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 8, 
    station: "B", 
    competitor1: "Carlos Medina", 
    competitor2: "BYE", 
    winner: "Carlos Medina", 
    score1: 33, 
    score2: 0,
    leftCupCode: "C6",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 9, 
    station: "C", 
    competitor1: "Erland Oye", 
    competitor2: "BYE", 
    winner: "Erland Oye", 
    score1: 33, 
    score2: 0,
    leftCupCode: "W6",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 10, 
    station: "A", 
    competitor1: "Penny Rodriguez", 
    competitor2: "BYE", 
    winner: "Penny Rodriguez", 
    score1: 33, 
    score2: 0,
    leftCupCode: "S5",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 11, 
    station: "B", 
    competitor1: "Felix Irmer", 
    competitor2: "BYE", 
    winner: "Felix Irmer", 
    score1: 33, 
    score2: 0,
    leftCupCode: "V4",
    rightCupCode: "BYE"
  },
  { 
    heatNumber: 12, 
    station: "C", 
    competitor1: "Stevo Kühn", 
    competitor2: "Edwin Tascon", 
    winner: "Stevo Kühn", 
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
    competitor1: "Kirill Shlyakov", 
    competitor2: "Anja Fürst", 
    winner: "Kirill Shlyakov", 
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
    competitor1: "Carlos Medina", 
    competitor2: "Jae Kim", 
    winner: "Jae Kim", 
    score1: 5, 
    score2: 28,
    leftCupCode: "C6",
    rightCupCode: "L4",
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
    competitor1: "Julian Teo", 
    competitor2: "Felix Irmer", 
    winner: "Felix Irmer", 
    score1: 8, 
    score2: 25,
    leftCupCode: "D3",
    rightCupCode: "R8",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "D3",
        rightCupCode: "R8"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "right",
        flavour: "left",
        overall: "left",
        leftCupCode: "D3",
        rightCupCode: "R8"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "D3",
        rightCupCode: "R8"
      }
    ]
  },
  { 
    heatNumber: 16, 
    station: "A", 
    competitor1: "Danielle Ricci", 
    competitor2: "Bill Nguyen", 
    winner: "Bill Nguyen", 
    score1: 12, 
    score2: 21,
    leftCupCode: "H7",
    rightCupCode: "N2",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "right",
        overall: "left",
        leftCupCode: "H7",
        rightCupCode: "N2"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "H7",
        rightCupCode: "N2"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "H7",
        rightCupCode: "N2"
      }
    ]
  },
];

export const WEC25_ROUND2_POSITIONS: BracketPosition[] = [
  // Round 2 - Heats 17-24 (with actual results from bracket and judges)
  { 
    heatNumber: 17, 
    station: "B", 
    competitor1: "Erlend Wessel-Berg", 
    competitor2: "Penny Chalkiadaki", 
    winner: "Penny Chalkiadaki", 
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
    competitor1: "Felix Ouma", 
    competitor2: "Aga Muhammed", 
    winner: "Aga Muhammed", 
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
    competitor1: "Julian Teo", 
    competitor2: "Artur Kosteniuk", 
    winner: "Artur Kosteniuk", 
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
    station: "B", 
    competitor1: "Faiz Nordin", 
    competitor2: "Engi Pan", 
    winner: "Engi Pan", 
    score1: 15, 
    score2: 18,
    leftCupCode: "U4",
    rightCupCode: "Y9",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "right",
        flavour: "left",
        overall: "left",
        leftCupCode: "U4",
        rightCupCode: "Y9"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "U4",
        rightCupCode: "Y9"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "U4",
        rightCupCode: "Y9"
      }
    ]
  },
  { 
    heatNumber: 21, 
    station: "C", 
    competitor1: "Faiz Nordin", 
    competitor2: "Christos Sotiros", 
    winner: "Christos Sotiros", 
    score1: 0, 
    score2: 0 
  },
  { 
    heatNumber: 22, 
    station: "A", 
    competitor1: "Daniele Ricci", 
    competitor2: "Stevo Kühn", 
    winner: "Stevo Kühn", 
    score1: 0, 
    score2: 0 
  },
  { 
    heatNumber: 23, 
    station: "B", 
    competitor1: "Kirill Shlyakov", 
    competitor2: "Jae Kim", 
    winner: "Jae Kim", 
    score1: 0, 
    score2: 0 
  },
  { 
    heatNumber: 24, 
    station: "C", 
    competitor1: "Bill Nguyen", 
    competitor2: "Engi Pan", 
    winner: "Engi Pan", 
    score1: 0, 
    score2: 0 
  },
];

export const WEC25_ROUND3_POSITIONS: BracketPosition[] = [
  // Round 3 - Heats 25-28 (with actual results from bracket and judges)
  { 
    heatNumber: 25, 
    station: "A", 
    competitor1: "Penny Chalkiadaki", 
    competitor2: "Aga Muhammed", 
    winner: "Aga Muhammed", 
    score1: 8, 
    score2: 25,
    leftCupCode: "A7",
    rightCupCode: "F3",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "A7",
        rightCupCode: "F3"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "A7",
        rightCupCode: "F3"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "A7",
        rightCupCode: "F3"
      }
    ]
  },
  { 
    heatNumber: 26, 
    station: "B", 
    competitor1: "Hojat Mousavi", 
    competitor2: "Artur Kosteniuk", 
    winner: "Artur Kosteniuk", 
    score1: 9, 
    score2: 24,
    leftCupCode: "K5",
    rightCupCode: "J1",
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
        rightCupCode: "J1"
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
        rightCupCode: "J1"
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
        rightCupCode: "J1"
      }
    ]
  },
  { 
    heatNumber: 27, 
    station: "C", 
    competitor1: "Hojat Mousavi", 
    competitor2: "Artur Kosteniuk", 
    winner: "Artur Kosteniuk", 
    score1: 9, 
    score2: 24,
    leftCupCode: "P3",
    rightCupCode: "M9",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "P3",
        rightCupCode: "M9"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "P3",
        rightCupCode: "M9"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "P3",
        rightCupCode: "M9"
      }
    ]
  },
  { 
    heatNumber: 28, 
    station: "A", 
    competitor1: "Jae Kim", 
    competitor2: "Engi Pan", 
    winner: "Jae Kim", 
    score1: 23, 
    score2: 10,
    leftCupCode: "F4",
    rightCupCode: "G8",
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "G8",
        rightCupCode: "F4"
      },
      {
        judgeName: "Tess",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "G8",
        rightCupCode: "F4"
      },
      {
        judgeName: "Junior",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "F4",
        rightCupCode: "G8"
      }
    ]
  },
];

export const WEC25_ROUND4_POSITIONS: BracketPosition[] = [
  // Round 4 - Heats 29-30 (with actual results from bracket and judges)
  { 
    heatNumber: 29, 
    station: "B", 
    competitor1: "Aga Muhammed", 
    competitor2: "Artur Kosteniuk", 
    winner: "Aga Muhammed", 
    score1: 25, 
    score2: 8,
    leftCupCode: "L2",
    rightCupCode: "Z7",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "L2",
        rightCupCode: "Z7"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "Z7",
        rightCupCode: "L2"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "Z7",
        rightCupCode: "L2"
      }
    ]
  },
  { 
    heatNumber: 30, 
    station: "C", 
    competitor1: "Christos Sotiros", 
    competitor2: "Jae Kim", 
    winner: "Jae Kim", 
    score1: 14, 
    score2: 19,
    leftCupCode: "N4",
    rightCupCode: "K6",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "left",
        sensoryBeverage: "Cappuccino",
        taste: "left",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "N4",
        rightCupCode: "K6"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "left",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "N4",
        rightCupCode: "K6"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "N4",
        rightCupCode: "K6"
      }
    ]
  },
];

export const WEC25_FINAL_POSITION: BracketPosition[] = [
  // Final - Heat 31 (CHAMPION: Aga Muhammed)
  { 
    heatNumber: 31, 
    station: "A", 
    competitor1: "Aga Muhammed", 
    competitor2: "Jae Kim", 
    winner: "Aga Muhammed", 
    score1: 19, 
    score2: 14,
    leftCupCode: "99",
    rightCupCode: "22",
    judges: [
      {
        judgeName: "Shinsaku",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "22",
        rightCupCode: "99"
      },
      {
        judgeName: "Korn",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "left",
        flavour: "left",
        overall: "left",
        leftCupCode: "22",
        rightCupCode: "99"
      },
      {
        judgeName: "Boss",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "left",
        overall: "right",
        leftCupCode: "99",
        rightCupCode: "22"
      }
    ]
  },
];
