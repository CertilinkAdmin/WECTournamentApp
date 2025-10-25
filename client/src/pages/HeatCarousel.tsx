import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, Coffee } from 'lucide-react';

interface HeatData {
  heatNumber: number;
  leftCompetitor: string;
  rightCompetitor: string;
  leftCupCode: string;
  rightCupCode: string;
  leftScore: number;
  rightScore: number;
  winner: string;
  station: string;
  backgroundImage: string;
}

const HEAT_CAROUSEL_DATA: HeatData[] = [
  {
    heatNumber: 12,
    leftCompetitor: "Stevo Kühn",
    rightCompetitor: "Edwin Tascon",
    leftCupCode: "M7",
    rightCupCode: "K9",
    leftScore: 28,
    rightScore: 5,
    winner: "Stevo Kühn",
    station: "C",
    backgroundImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 13,
    leftCompetitor: "Shlyakov Kirill",
    rightCompetitor: "Anja Fürst",
    leftCupCode: "F5",
    rightCupCode: "X1",
    leftScore: 24,
    rightScore: 9,
    winner: "Shlyakov Kirill",
    station: "A",
    backgroundImage: "https://images.unsplash.com/photo-1439792675105-701e6a4ab6f0?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 14,
    leftCompetitor: "Carlos Medina",
    rightCompetitor: "Jae Kim",
    leftCupCode: "C6",
    rightCupCode: "L4",
    leftScore: 5,
    rightScore: 28,
    winner: "Jae Kim",
    station: "B",
    backgroundImage: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 17,
    leftCompetitor: "Erlend Wessel-Berg",
    rightCompetitor: "Penny Chalkiadaki",
    leftCupCode: "W6",
    rightCupCode: "S5",
    leftScore: 9,
    rightScore: 24,
    winner: "Penny Chalkiadaki",
    station: "A",
    backgroundImage: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 18,
    leftCompetitor: "Felix Ouma",
    rightCompetitor: "Aga Muhammed",
    leftCupCode: "V4",
    rightCupCode: "J1",
    leftScore: 2,
    rightScore: 31,
    winner: "Aga Muhammed",
    station: "B",
    backgroundImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 19,
    leftCompetitor: "Artur Kosteniuk",
    rightCompetitor: "Julian Teo",
    leftCupCode: "G2",
    rightCupCode: "W8",
    leftScore: 2,
    rightScore: 9,
    winner: "Artur Kosteniuk",
    station: "C",
    backgroundImage: "https://images.unsplash.com/photo-1439792675105-701e6a4ab6f0?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 21,
    leftCompetitor: "Faiz Nordin",
    rightCompetitor: "Christos Sotiros",
    leftCupCode: "Q5",
    rightCupCode: "B1",
    leftScore: 8,
    rightScore: 25,
    winner: "Christos Sotiros",
    station: "A",
    backgroundImage: "https://images.unsplash.com/photo-1483982258113-b72862e6cff6?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 22,
    leftCompetitor: "Stevo Kühn",
    rightCompetitor: "Daniele Ricci",
    leftCupCode: "T8",
    rightCupCode: "J7",
    leftScore: 19,
    rightScore: 14,
    winner: "Stevo Kühn",
    station: "B",
    backgroundImage: "https://images.unsplash.com/photo-1477346611705-65d1883cee1e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 23,
    leftCompetitor: "Shlyakov Kirill",
    rightCompetitor: "Jae Kim",
    leftCupCode: "E9",
    rightCupCode: "V2",
    leftScore: 6,
    rightScore: 27,
    winner: "Jae Kim",
    station: "C",
    backgroundImage: "https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  },
  {
    heatNumber: 24,
    leftCompetitor: "Bill",
    rightCompetitor: "Engi",
    leftCupCode: "M1",
    rightCupCode: "E3",
    leftScore: 9,
    rightScore: 24,
    winner: "Engi",
    station: "A",
    backgroundImage: "https://images.unsplash.com/photo-1439792675105-701e6a4ab6f0?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  }
];

export default function HeatCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % HEAT_CAROUSEL_DATA.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + HEAT_CAROUSEL_DATA.length) % HEAT_CAROUSEL_DATA.length);
  };

  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary text-white';
      case 'B': return 'bg-chart-3 text-white';
      case 'C': return 'bg-chart-1 text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-slate-300 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-slate-100 shadow-2xl rounded-3xl">
        <div className="relative w-full h-full rounded-3xl overflow-hidden">
          {/* Main slide */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
            style={{ backgroundImage: `url(${HEAT_CAROUSEL_DATA[currentIndex].backgroundImage})` }}
          >
            <div className="absolute inset-0 bg-black/50" />
            
            {/* Header Section */}
            <div className="absolute top-8 left-8 right-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Trophy className="h-10 w-10 text-yellow-400" />
                  <div>
                    <div className="text-5xl font-bold uppercase text-white animate-fade-in-up">
                      Heat {HEAT_CAROUSEL_DATA[currentIndex].heatNumber}
                    </div>
                    <Badge className={`${getStationColor(HEAT_CAROUSEL_DATA[currentIndex].station)} text-lg font-bold px-4 py-2 mt-2`}>
                      Station {HEAT_CAROUSEL_DATA[currentIndex].station}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Competitors Section - Left Side */}
            <div className="absolute top-1/2 left-8 transform -translate-y-1/2 w-[300px]">
              <div className="space-y-6 animate-fade-in-up-delay-1">
                {/* Left Competitor */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-2">
                    {HEAT_CAROUSEL_DATA[currentIndex].leftCompetitor}
                  </div>
                  <div className="text-sm text-white/80 mb-3">Cup: {HEAT_CAROUSEL_DATA[currentIndex].leftCupCode}</div>
                  <div className="text-4xl font-bold text-green-400">
                    {HEAT_CAROUSEL_DATA[currentIndex].leftScore} pts
                  </div>
                </div>

                {/* VS Divider */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-white bg-white/20 rounded-full w-16 h-16 flex items-center justify-center mx-auto">
                    VS
                  </div>
                </div>

                {/* Right Competitor */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                  <div className="text-2xl font-bold text-white mb-2">
                    {HEAT_CAROUSEL_DATA[currentIndex].rightCompetitor}
                  </div>
                  <div className="text-sm text-white/80 mb-3">Cup: {HEAT_CAROUSEL_DATA[currentIndex].rightCupCode}</div>
                  <div className="text-4xl font-bold text-green-400">
                    {HEAT_CAROUSEL_DATA[currentIndex].rightScore} pts
                  </div>
                </div>
              </div>
            </div>

            {/* Winner Section - Right Side */}
            <div className="absolute top-1/2 right-8 transform -translate-y-1/2 w-[350px]">
              <div className="animate-fade-in-up-delay-2">
                <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 backdrop-blur-sm rounded-3xl p-8 border-2 border-yellow-400/50 shadow-2xl">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-2xl font-bold text-yellow-300 mb-2">CHAMPION</div>
                    <div className="text-4xl font-bold text-white mb-4">
                      {HEAT_CAROUSEL_DATA[currentIndex].winner}
                    </div>
                    <div className="text-lg text-yellow-200">
                      Heat {HEAT_CAROUSEL_DATA[currentIndex].heatNumber} Winner
                    </div>
                    <div className="mt-4 text-2xl font-bold text-yellow-300">
                      {HEAT_CAROUSEL_DATA[currentIndex].winner === HEAT_CAROUSEL_DATA[currentIndex].leftCompetitor 
                        ? HEAT_CAROUSEL_DATA[currentIndex].leftScore 
                        : HEAT_CAROUSEL_DATA[currentIndex].rightScore} Points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Side cards */}
          {HEAT_CAROUSEL_DATA.slice(1, 4).map((heat, index) => {
            const actualIndex = (currentIndex + index + 1) % HEAT_CAROUSEL_DATA.length;
            return (
              <div
                key={actualIndex}
                className="absolute w-[200px] h-[250px] top-1/2 transform -translate-y-1/2 rounded-3xl shadow-2xl bg-cover bg-center bg-no-repeat transition-all duration-500"
                style={{
                  left: `${50 + (index * 22)}%`,
                  backgroundImage: `url(${heat.backgroundImage})`,
                  zIndex: 10 - index
                }}
              >
                <div className="absolute inset-0 bg-black/50 rounded-3xl" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="text-lg font-bold">Heat {heat.heatNumber}</div>
                  <div className="text-sm opacity-80">{heat.leftCompetitor} vs {heat.rightCompetitor}</div>
                  <Badge className={`${getStationColor(heat.station)} text-xs mt-2`}>
                    Station {heat.station}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 flex gap-5">
          <button
            onClick={prevSlide}
            className="w-10 h-9 rounded-lg border-2 border-black/30 bg-white/60 hover:bg-white hover:border-white/80 transition-all duration-300 hover:scale-110 focus:scale-110 focus:bg-white focus:border-white/80 flex items-center justify-center"
          >
            <span className="text-black font-bold">◁</span>
          </button>
          <button
            onClick={nextSlide}
            className="w-10 h-9 rounded-lg border-2 border-black/30 bg-white/60 hover:bg-white hover:border-white/80 transition-all duration-300 hover:scale-110 focus:scale-110 focus:bg-white focus:border-white/80 flex items-center justify-center"
          >
            <span className="text-black font-bold">▷</span>
          </button>
        </div>
      </div>

      {/* Attribution */}
      <div className="fixed bottom-5 left-5 z-50">
        <a
          href="https://github.com/MDJAmin"
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-600 hover:text-black transition-colors duration-500 font-mono italic text-lg border-t border-b border-dashed border-slate-600 py-1"
        >
          WEC25 Tournament
        </a>
      </div>

      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(100px);
            filter: blur(33px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-in-out 1 forwards;
        }

        .animate-fade-in-up-delay-1 {
          animation: fade-in-up 1s ease-in-out 0.3s 1 forwards;
        }

        .animate-fade-in-up-delay-2 {
          animation: fade-in-up 1s ease-in-out 0.6s 1 forwards;
        }
      `}</style>
    </div>
  );
}
