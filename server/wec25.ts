export type Wec25Competitor = {
  name: string;
  email: string;
};

export const WEC25_COMPETITORS: Wec25Competitor[] = [
  { name: "Penny Chalkiadaki", email: "penny@wec25.example" },
  { name: "Erlend Wessel-Berg", email: "erlend@wec25.example" },
  { name: "Felix Ouma", email: "felix@wec25.example" },
  { name: "Aga Muhammed", email: "aga@wec25.example" },
  { name: "Julian Teo", email: "julian@wec25.example" },
  { name: "Artur Kosteniuk", email: "artur@wec25.example" },
  { name: "Hojat Mousavi", email: "hojat@wec25.example" },
  { name: "Sebastian Hernandez", email: "sebastian@wec25.example" },
  { name: "Faiz Nordin", email: "faiz@wec25.example" },
  { name: "Cristian Fernández", email: "cristian@wec25.example" },
  { name: "Christos Sotiros", email: "christos@wec25.example" },
  { name: "Daniele Ricci", email: "daniele@wec25.example" },
  { name: "Stevo Kühn", email: "stevo@wec25.example" },
  { name: "Edwin Tascon", email: "edwin@wec25.example" },
  { name: "Shlyakov Kirill", email: "kirill@wec25.example" },
  { name: "Anja Fürst", email: "anja@wec25.example" },
  { name: "Carlos Medina", email: "carlos@wec25.example" },
  { name: "Jae Kim", email: "jae@wec25.example" },
  { name: "Bill Nguyen", email: "bill@wec25.example" },
  { name: "Chris Rodriguez", email: "chris@wec25.example" },
  { name: "Engi Pan", email: "engi@wec25.example" },
  { name: "Gary Au", email: "gary@wec25.example" }
];

// Minimal mapping for Round 1 as seen in the image. BUY means bye
export type Round1Spec = {
  heatNumber: number;
  station: 'A' | 'B' | 'C';
  competitor1: string; // name or BUY
  competitor2: string; // name or BUY
};

export const WEC25_ROUND1: Round1Spec[] = [
  { heatNumber: 1, station: 'A', competitor1: 'Penny Chalkiadaki', competitor2: 'BUY' },
  { heatNumber: 2, station: 'B', competitor1: 'Erlend Wessel-Berg', competitor2: 'BUY' },
  { heatNumber: 3, station: 'C', competitor1: 'Felix Ouma', competitor2: 'BUY' },
  { heatNumber: 4, station: 'A', competitor1: 'Aga Muhammed', competitor2: 'BUY' },
  { heatNumber: 5, station: 'B', competitor1: 'Julian Teo', competitor2: 'BUY' },
  { heatNumber: 6, station: 'C', competitor1: 'Artur Kosteniuk', competitor2: 'BUY' },
  { heatNumber: 7, station: 'A', competitor1: 'Hojat Mousavi', competitor2: 'BUY' },
  { heatNumber: 8, station: 'B', competitor1: 'Sebastian Hernandez', competitor2: 'BUY' },
  { heatNumber: 9, station: 'C', competitor1: 'Faiz Nordin', competitor2: 'Cristian Fernández' },
  { heatNumber: 10, station: 'A', competitor1: 'Christos Sotiros', competitor2: 'Daniele Ricci' },
  { heatNumber: 11, station: 'B', competitor1: 'Cristian Fernández', competitor2: 'Daniele Ricci' },
  { heatNumber: 12, station: 'C', competitor1: 'Stevo Kühn', competitor2: 'Edwin Tascon' },
  { heatNumber: 13, station: 'A', competitor1: 'Shlyakov Kirill', competitor2: 'Anja Fürst' },
  { heatNumber: 14, station: 'B', competitor1: 'Carlos Medina', competitor2: 'Jae Kim' },
  { heatNumber: 15, station: 'C', competitor1: 'Bill Nguyen', competitor2: 'Chris Rodriguez' },
  { heatNumber: 16, station: 'A', competitor1: 'Engi Pan', competitor2: 'Gary Au' },
];

// Subsequent rounds reference winners from previous heats using codes like "H17"
export type RoundRefSpec = {
  heatNumber: number;
  station: 'A' | 'B' | 'C';
  ref1: string; // e.g., H1, H17
  ref2: string; // e.g., H2, H18
};

export const WEC25_ROUND2: RoundRefSpec[] = [
  { heatNumber: 17, station: 'B', ref1: 'H1',  ref2: 'H2'  },
  { heatNumber: 18, station: 'C', ref1: 'H3',  ref2: 'H4'  },
  { heatNumber: 19, station: 'A', ref1: 'H5',  ref2: 'H6'  },
  { heatNumber: 20, station: 'B', ref1: 'H7',  ref2: 'H8'  },
  { heatNumber: 21, station: 'C', ref1: 'H9',  ref2: 'H10' },
  { heatNumber: 22, station: 'A', ref1: 'H11', ref2: 'H12' },
  { heatNumber: 23, station: 'B', ref1: 'H13', ref2: 'H14' },
  { heatNumber: 24, station: 'C', ref1: 'H15', ref2: 'H16' },
];

export const WEC25_ROUND3: RoundRefSpec[] = [
  { heatNumber: 25, station: 'A', ref1: 'H17', ref2: 'H18' },
  { heatNumber: 26, station: 'B', ref1: 'H19', ref2: 'H20' },
  { heatNumber: 27, station: 'C', ref1: 'H21', ref2: 'H22' },
  { heatNumber: 28, station: 'A', ref1: 'H23', ref2: 'H24' },
];

export const WEC25_ROUND4: RoundRefSpec[] = [
  { heatNumber: 29, station: 'B', ref1: 'H25', ref2: 'H26' },
  { heatNumber: 30, station: 'C', ref1: 'H27', ref2: 'H28' },
];

export const WEC25_FINAL: RoundRefSpec[] = [
  { heatNumber: 31, station: 'A', ref1: 'H29', ref2: 'H30' },
];

