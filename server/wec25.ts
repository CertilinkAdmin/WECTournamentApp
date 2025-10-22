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

