import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coffee, Award, Clock, MapPin } from 'lucide-react';
import './HeatCardCarousel.css';

interface Competitor {
  id: string;
  name: string;
  cupCode?: string;
  score?: number;
  isWinner?: boolean;
}

interface HeatCardCarouselProps {
  heatNumber: number;
  station: string;
  round: string;
  competitors: Competitor[];
  winner?: string;
  leftScore?: number;
  rightScore?: number;
  leftCupCode?: string;
  rightCupCode?: string;
  judges?: Array<{
    judgeName: string;
    visualLatteArt: 'left' | 'right';
    sensoryBeverage: 'Espresso' | 'Cappuccino';
    taste: 'left' | 'right';
    tactile: 'left' | 'right';
    flavour: 'left' | 'right';
    overall: 'left' | 'right';
    leftCupCode: string;
    rightCupCode: string;
  }>;
  onViewDetails?: () => void;
}

const HeatCardCarousel: React.FC<HeatCardCarouselProps> = ({
  heatNumber,
  station,
  round,
  competitors,
  winner,
  leftScore,
  rightScore,
  leftCupCode,
  rightCupCode,
  judges,
  onViewDetails
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [items, setItems] = useState<Array<{ id: string; type: 'heat' | 'competitor'; data: any }>>([]);

  useEffect(() => {
    // Create items array: heat info + competitors
    const heatItem = {
      id: 'heat',
      type: 'heat' as const,
      data: { heatNumber, station, round, winner, leftScore, rightScore, leftCupCode, rightCupCode, judges }
    };
    
    const competitorItems = competitors.map((comp, index) => ({
      id: `comp-${index}`,
      type: 'competitor' as const,
      data: comp
    }));

    setItems([heatItem, ...competitorItems]);
  }, [heatNumber, station, round, competitors, winner, leftScore, rightScore, leftCupCode, rightCupCode, judges]);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % items.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const getStationColor = (station: string) => {
    switch (station) {
      case 'A': return 'bg-primary';
      case 'B': return 'bg-chart-3';
      case 'C': return 'bg-chart-1';
      default: return 'bg-gray-500';
    }
  };

  const getBackgroundImage = (type: string, data: any) => {
    if (type === 'heat') {
      return 'linear-gradient(135deg, rgba(25, 35, 25, 0.9), rgba(45, 55, 45, 0.8))';
    } else {
      return data.isWinner 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.8))'
        : 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8))';
    }
  };

  return (
    <div className="heat-carousel-container">
      <div className="heat-carousel-slide">
        {items.map((item, index) => {
          const isActive = index === currentIndex;
          const isHeat = item.type === 'heat';
          const isCompetitor = item.type === 'competitor';
          
          return (
            <div
              key={item.id}
              className={`heat-carousel-item ${isActive ? 'active' : ''} ${isHeat ? 'heat-item' : 'competitor-item'}`}
              style={{
                backgroundImage: getBackgroundImage(item.type, item.data),
                zIndex: isActive ? 10 : 5 - Math.abs(index - currentIndex)
              }}
            >
              <div className="heat-carousel-content">
                {isHeat ? (
                  // Heat Information Card
                  <div className="heat-info">
                    <div className="heat-header">
                      <div className="heat-number">Heat {item.data.heatNumber}</div>
                      <Badge className={`${getStationColor(item.data.station)} text-white`}>
                        Station {item.data.station}
                      </Badge>
                    </div>
                    
                    <div className="heat-details">
                      <div className="heat-round">{item.data.round}</div>
                      
                      {item.data.winner && (
                        <div className="heat-winner">
                          <Trophy className="h-6 w-6 text-yellow-400" />
                          <span>Winner: {item.data.winner}</span>
                        </div>
                      )}
                      
                      {item.data.leftScore !== undefined && item.data.rightScore !== undefined && (
                        <div className="heat-scores">
                          <div className="score-item">
                            <span className="cup-code">{item.data.leftCupCode}</span>
                            <span className="score">{item.data.leftScore}</span>
                          </div>
                          <div className="vs">VS</div>
                          <div className="score-item">
                            <span className="score">{item.data.rightScore}</span>
                            <span className="cup-code">{item.data.rightCupCode}</span>
                          </div>
                        </div>
                      )}
                      
                      {item.data.judges && item.data.judges.length > 0 && (
                        <div className="heat-judges">
                          <Users className="h-4 w-4" />
                          <span>{item.data.judges.length} Judges</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Competitor Card
                  <div className="competitor-info">
                    <div className="competitor-header">
                      {item.data.isWinner && (
                        <Badge className="bg-yellow-500 text-black mb-2">
                          <Trophy className="h-3 w-3 mr-1" />
                          Winner
                        </Badge>
                      )}
                      <div className="competitor-name">{item.data.name}</div>
                    </div>
                    
                    <div className="competitor-details">
                      {item.data.cupCode && (
                        <div className="cup-code-display">
                          <Coffee className="h-4 w-4" />
                          <span>Cup: {item.data.cupCode}</span>
                        </div>
                      )}
                      
                      {item.data.score !== undefined && (
                        <div className="competitor-score">
                          <Award className="h-4 w-4" />
                          <span>Score: {item.data.score}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="heat-carousel-buttons">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={prevSlide}
          className="carousel-btn prev-btn"
        >
          ◁
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={nextSlide}
          className="carousel-btn next-btn"
        >
          ▷
        </Button>
      </div>
    </div>
  );
};

export default HeatCardCarousel;
