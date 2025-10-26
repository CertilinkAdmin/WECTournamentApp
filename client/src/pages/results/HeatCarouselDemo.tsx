import React from 'react';
import HeatCardCarousel from '../../components/HeatCardCarousel';

const HeatCarouselDemo: React.FC = () => {
  // Sample heat data
  const sampleHeats = [
    {
      heatNumber: 12,
      station: "A",
      round: "Round 1 - Preliminary Heats",
      competitors: [
        {
          id: "1",
          name: "Stevo Kühn",
          cupCode: "M7",
          score: 28,
          isWinner: true
        },
        {
          id: "2", 
          name: "Edwin Tascon",
          cupCode: "K9",
          score: 5,
          isWinner: false
        }
      ],
      winner: "Stevo Kühn",
      leftScore: 28,
      rightScore: 5,
      leftCupCode: "M7",
      rightCupCode: "K9",
      judges: [
        {
          judgeName: "Jasper",
          visualLatteArt: "left" as const,
          sensoryBeverage: "Espresso" as const,
          taste: "right" as const,
          tactile: "left" as const,
          flavour: "right" as const,
          overall: "right" as const,
          leftCupCode: "K9",
          rightCupCode: "M7"
        },
        {
          judgeName: "Korn",
          visualLatteArt: "left" as const,
          sensoryBeverage: "Cappuccino" as const,
          taste: "left" as const,
          tactile: "left" as const,
          flavour: "left" as const,
          overall: "left" as const,
          leftCupCode: "K9",
          rightCupCode: "M7"
        }
      ]
    },
    {
      heatNumber: 28,
      station: "A",
      round: "Round 3 - Semifinals",
      competitors: [
        {
          id: "3",
          name: "Jae Kim",
          cupCode: "F4",
          score: 23,
          isWinner: true
        },
        {
          id: "4",
          name: "Engi Pan", 
          cupCode: "G8",
          score: 10,
          isWinner: false
        }
      ],
      winner: "Jae Kim",
      leftScore: 23,
      rightScore: 10,
      leftCupCode: "F4",
      rightCupCode: "G8",
      judges: [
        {
          judgeName: "Michalis",
          visualLatteArt: "left" as const,
          sensoryBeverage: "Cappuccino" as const,
          taste: "right" as const,
          tactile: "right" as const,
          flavour: "left" as const,
          overall: "right" as const,
          leftCupCode: "G8",
          rightCupCode: "F4"
        }
      ]
    },
    {
      heatNumber: 31,
      station: "A",
      round: "Final - Championship",
      competitors: [
        {
          id: "5",
          name: "Aga Muhammed",
          cupCode: "99",
          score: 19,
          isWinner: true
        },
        {
          id: "6",
          name: "Jae Kim",
          cupCode: "22", 
          score: 14,
          isWinner: false
        }
      ],
      winner: "Aga Muhammed",
      leftScore: 19,
      rightScore: 14,
      leftCupCode: "99",
      rightCupCode: "22",
      judges: [
        {
          judgeName: "Shinsaku",
          visualLatteArt: "right" as const,
          sensoryBeverage: "Cappuccino" as const,
          taste: "right" as const,
          tactile: "right" as const,
          flavour: "right" as const,
          overall: "right" as const,
          leftCupCode: "22",
          rightCupCode: "99"
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-4">Heat Card Carousel Demo</h1>
          <p className="text-xl text-muted-foreground">
            Interactive heat cards with rear heat info and front competitor cards
          </p>
        </div>

        <div className="space-y-12">
          {sampleHeats.map((heat, index) => (
            <div key={heat.heatNumber} className="flex justify-center">
              <HeatCardCarousel
                heatNumber={heat.heatNumber}
                station={heat.station}
                round={heat.round}
                competitors={heat.competitors}
                winner={heat.winner}
                leftScore={heat.leftScore}
                rightScore={heat.rightScore}
                leftCupCode={heat.leftCupCode}
                rightCupCode={heat.rightCupCode}
                judges={heat.judges}
                onViewDetails={() => console.log(`View details for heat ${heat.heatNumber}`)}
              />
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold mb-4">How to Use</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h3 className="font-semibold mb-2">1. Heat Information</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                The rear card shows heat details, scores, and judge information
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h3 className="font-semibold mb-2">2. Competitor Cards</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Front cards display individual competitor details and scores
              </p>
            </div>
            <div className="p-4 bg-white dark:bg-slate-800 rounded-lg shadow">
              <h3 className="font-semibold mb-2">3. Navigation</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use arrow buttons to cycle through heat info and competitors
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeatCarouselDemo;
