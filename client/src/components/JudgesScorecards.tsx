import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Trophy, Users, Coffee, Award } from 'lucide-react';

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

interface HeatData {
  heatNumber: number;
  judges: JudgeScore[];
  leftCompetitor: string;
  rightCompetitor: string;
  leftCupCode: string;
  rightCupCode: string;
  leftScore: number;
  rightScore: number;
  winner: string;
}

const HEAT_DATA: HeatData[] = [
  {
    heatNumber: 12,
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
    ],
    leftCompetitor: "Stevo Kühn",
    rightCompetitor: "Edwin Tascon",
    leftCupCode: "M7",
    rightCupCode: "K9",
    leftScore: 28,
    rightScore: 5,
    winner: "Stevo Kühn"
  },
  {
    heatNumber: 13,
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
    ],
    leftCompetitor: "Shlyakov Kirill",
    rightCompetitor: "Anja Fürst",
    leftCupCode: "F5",
    rightCupCode: "X1",
    leftScore: 24,
    rightScore: 9,
    winner: "Shlyakov Kirill"
  },
  {
    heatNumber: 14,
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
    ],
    leftCompetitor: "Carlos Medina",
    rightCompetitor: "Jae Kim",
    leftCupCode: "C6",
    rightCupCode: "L4",
    leftScore: 5,
    rightScore: 28,
    winner: "Jae Kim"
  },
  {
    heatNumber: 17,
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
    ],
    leftCompetitor: "Erlend Wessel-Berg",
    rightCompetitor: "Penny Chalkiadaki",
    leftCupCode: "W6",
    rightCupCode: "S5",
    leftScore: 9,
    rightScore: 24,
    winner: "Penny Chalkiadaki"
  },
  {
    heatNumber: 18,
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
    ],
    leftCompetitor: "Felix Ouma",
    rightCompetitor: "Aga Muhammed",
    leftCupCode: "V4",
    rightCupCode: "J1",
    leftScore: 2,
    rightScore: 31,
    winner: "Aga Muhammed"
  },
  {
    heatNumber: 19,
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
    ],
    leftCompetitor: "Artur Kosteniuk",
    rightCompetitor: "Julian Teo",
    leftCupCode: "G2",
    rightCupCode: "W8",
    leftScore: 2,
    rightScore: 9,
    winner: "Artur Kosteniuk"
  },
  {
    heatNumber: 21,
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
    ],
    leftCompetitor: "Faiz Nordin",
    rightCompetitor: "Christos Sotiros",
    leftCupCode: "Q5",
    rightCupCode: "B1",
    leftScore: 8,
    rightScore: 25,
    winner: "Christos Sotiros"
  },
  {
    heatNumber: 22,
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
    ],
    leftCompetitor: "Stevo Kühn",
    rightCompetitor: "Daniele Ricci",
    leftCupCode: "T8",
    rightCupCode: "J7",
    leftScore: 19,
    rightScore: 14,
    winner: "Stevo Kühn"
  },
  {
    heatNumber: 23,
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
    ],
    leftCompetitor: "Shlyakov Kirill",
    rightCompetitor: "Jae Kim",
    leftCupCode: "E9",
    rightCupCode: "V2",
    leftScore: 6,
    rightScore: 27,
    winner: "Jae Kim"
  },
  {
    heatNumber: 24,
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "M1",
        rightCupCode: "E6"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "M1",
        rightCupCode: "E3"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "E3",
        rightCupCode: "M1"
      }
    ],
    leftCompetitor: "Bill",
    rightCompetitor: "Engi",
    leftCupCode: "M1",
    rightCupCode: "E3",
    leftScore: 9,
    rightScore: 24,
    winner: "Engi"
  },
  {
    heatNumber: 25,
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
    ],
    leftCompetitor: "Penny Chalkiadaki",
    rightCompetitor: "Aga Muhammed",
    leftCupCode: "A7",
    rightCupCode: "F3",
    leftScore: 8,
    rightScore: 25,
    winner: "Aga Muhammed"
  },
  {
    heatNumber: 26,
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
    ],
    leftCompetitor: "Hojat",
    rightCompetitor: "Artur Kosteniuk",
    leftCupCode: "K5",
    rightCupCode: "J1",
    leftScore: 9,
    rightScore: 24,
    winner: "Artur Kosteniuk"
  },
  {
    heatNumber: 27,
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
    ],
    leftCompetitor: "Hojat",
    rightCompetitor: "Artur Kosteniuk",
    leftCupCode: "K5",
    rightCupCode: "J1",
    leftScore: 9,
    rightScore: 24,
    winner: "Artur Kosteniuk"
  },
  {
    heatNumber: 28,
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
    ],
    leftCompetitor: "Engi",
    rightCompetitor: "Jae Kim",
    leftCupCode: "G8",
    rightCupCode: "F4",
    leftScore: 10,
    rightScore: 23,
    winner: "Jae Kim"
  },
  {
    heatNumber: 29,
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
    ],
    leftCompetitor: "Aga Muhammed",
    rightCompetitor: "Artur Kosteniuk",
    leftCupCode: "L2",
    rightCupCode: "Z7",
    leftScore: 25,
    rightScore: 8,
    winner: "Aga Muhammed"
  },
  {
    heatNumber: 30,
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
    ],
    leftCompetitor: "Christos Sotiros",
    rightCompetitor: "Jae Kim",
    leftCupCode: "N4",
    rightCupCode: "K6",
    leftScore: 14,
    rightScore: 19,
    winner: "Jae Kim"
  },
  {
    heatNumber: 21,
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
    ],
    leftCompetitor: "Faiz Nordin",
    rightCompetitor: "Christos Sotiros",
    leftCupCode: "Q5",
    rightCupCode: "B1",
    leftScore: 8,
    rightScore: 25,
    winner: "Christos Sotiros"
  },
  {
    heatNumber: 22,
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
    ],
    leftCompetitor: "Stevo Kühn",
    rightCompetitor: "Daniele Ricci",
    leftCupCode: "T8",
    rightCupCode: "J7",
    leftScore: 19,
    rightScore: 14,
    winner: "Stevo Kühn"
  },
  {
    heatNumber: 23,
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
    ],
    leftCompetitor: "Shlyakov Kirill",
    rightCompetitor: "Jae Kim",
    leftCupCode: "E9",
    rightCupCode: "V2",
    leftScore: 6,
    rightScore: 27,
    winner: "Jae Kim"
  },
  {
    heatNumber: 24,
    judges: [
      {
        judgeName: "Michalis",
        visualLatteArt: "right",
        sensoryBeverage: "Cappuccino",
        taste: "right",
        tactile: "left",
        flavour: "right",
        overall: "right",
        leftCupCode: "M1",
        rightCupCode: "E6"
      },
      {
        judgeName: "Ali",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "M1",
        rightCupCode: "E3"
      },
      {
        judgeName: "Jasper",
        visualLatteArt: "right",
        sensoryBeverage: "Espresso",
        taste: "right",
        tactile: "right",
        flavour: "right",
        overall: "right",
        leftCupCode: "E3",
        rightCupCode: "M1"
      }
    ],
    leftCompetitor: "Bill",
    rightCompetitor: "Engi",
    leftCupCode: "M1",
    rightCupCode: "E3",
    leftScore: 9,
    rightScore: 24,
    winner: "Engi"
  },
  {
    heatNumber: 31,
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
    ],
    leftCompetitor: "Aga Muhammed",
    rightCompetitor: "Jae Kim",
    leftCupCode: "99",
    rightCupCode: "22",
    leftScore: 19,
    rightScore: 14,
    winner: "Aga Muhammed"
  }
];

function JudgeScorecard({ judge, heatNumber }: { judge: JudgeScore; heatNumber: number }) {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5" />
          Judge: {judge.judgeName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cup Codes */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
          <div className="text-center">
            <div className="font-semibold text-slate-600">Left Cup</div>
            <div className="text-2xl font-bold text-primary">{judge.leftCupCode}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-600">Right Cup</div>
            <div className="text-2xl font-bold text-primary">{judge.rightCupCode}</div>
          </div>
        </div>

        {/* Scoring Categories */}
        <div className="space-y-3">
          {/* Visual/Latte Art */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Coffee className="h-4 w-4 text-primary" />
              <span className="font-medium">Visual/Latte Art (3 points)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.visualLatteArt === 'left'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Left</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.visualLatteArt === 'right'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </div>

          {/* Sensory Beverage */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <span className="font-medium">Sensory Beverage</span>
            </div>
            <Badge variant="outline" className="font-medium">
              {judge.sensoryBeverage}
            </Badge>
          </div>

          {/* Taste */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-medium">Taste (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.taste === 'left'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Left</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.taste === 'right'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </div>

          {/* Tactile */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Tactile (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.tactile === 'left'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Left</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.tactile === 'right'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </div>

          {/* Flavour */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <span className="font-medium">Flavour (1 point)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.flavour === 'left'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Left</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.flavour === 'right'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm">Right</span>
              </div>
            </div>
          </div>

          {/* Overall */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-primary/5">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Overall (5 points)</span>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.overall === 'left'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm font-medium">Left</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox checked={judge.overall === 'right'} disabled className="data-[state=checked]:bg-cinnamon-brown data-[state=checked]:border-cinnamon-brown" />
                <span className="text-sm font-medium">Right</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function JudgesScorecards() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Trophy className="h-12 w-12 text-primary" />
            <h1 className="text-4xl font-bold text-primary">WEC25 Judge Scorecards</h1>
            <Trophy className="h-12 w-12 text-primary" />
          </div>
          <p className="text-xl text-muted-foreground">
            Detailed scoring breakdown for all heats
          </p>
        </div>

        {/* Heat Cards */}
        <div className="space-y-8">
          {HEAT_DATA.map((heat) => (
            <Card key={heat.heatNumber} className="shadow-lg">
              <CardHeader className="bg-primary/10">
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-6 w-6 text-primary" />
                    <span className="text-2xl">Heat {heat.heatNumber}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {heat.leftCompetitor} vs {heat.rightCompetitor}
                    </Badge>
                    <Badge className="bg-green-500 text-white text-lg px-4 py-2">
                      Winner: {heat.winner}
                    </Badge>
                  </div>
                </CardTitle>
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center p-3 bg-secondary dark:bg-white rounded-lg">
                    <div className="font-semibold text-slate-600">{heat.leftCompetitor}</div>
                    <div className="text-2xl font-bold text-primary">{heat.leftCupCode}</div>
                    <div className="text-lg font-bold text-green-600">{heat.leftScore} points</div>
                  </div>
                  <div className="text-center p-3 bg-secondary dark:bg-white rounded-lg">
                    <div className="font-semibold text-slate-600">{heat.rightCompetitor}</div>
                    <div className="text-2xl font-bold text-primary">{heat.rightCupCode}</div>
                    <div className="text-lg font-bold text-green-600">{heat.rightScore} points</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {heat.judges.map((judge, index) => (
                    <JudgeScorecard 
                      key={`${heat.heatNumber}-${index}`}
                      judge={judge} 
                      heatNumber={heat.heatNumber}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
