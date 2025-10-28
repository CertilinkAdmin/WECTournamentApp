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

interface Judge {
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
  judges?: Judge[];
  onViewDetails?: () => void;
}

// Placeholder for getJudgeScore function, assuming it's defined elsewhere or needs to be implemented.
// This function would calculate the total score for a judge based on their individual category scores.
const getJudgeScore = (judge: Judge, side: 'left' | 'right', selectedHeat: any): number => {
  let score = 0;
  if (judge.visualLatteArt === side) score += 3;
  if (judge.taste === side) score += 1;
  if (judge.tactile === side) score += 1;
  if (judge.flavour === side) score += 1;
  if (judge.overall === side) score += 5;
  return score;
};

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedHeat, setSelectedHeat] = useState<any>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<'left' | 'right' | null>(null);
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
      return 'linear-gradient(135deg, rgba(153, 77, 39, 0.9), rgba(222, 204, 167, 0.8))'; // Cinnamon Brown and Light Sand
    } else {
      return data.isWinner 
        ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(16, 185, 129, 0.8))'
        : 'linear-gradient(135deg, rgba(153, 77, 39, 0.9), rgba(222, 204, 167, 0.8))'; // Cinnamon Brown and Light Sand
    }
  };

  const openModal = (heatData: any) => {
    setSelectedHeat(heatData);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedHeat(null);
    setSelectedCompetitor(null);
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
              onClick={() => isHeat && openModal(item.data)}
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

      {isModalOpen && selectedHeat && (
        <div className="heat-modal-overlay" onClick={closeModal}>
          <div className="heat-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="heat-modal-close" onClick={closeModal}>
              ×
            </button>

            <div className="heat-modal-header">
              <h2>Heat {selectedHeat.heatNumber} - Round {Math.ceil(selectedHeat.heatNumber / 8)}</h2>
            </div>

            <div className="heat-modal-body">
              <div 
                className="competitor-section clickable"
                onClick={() => setSelectedCompetitor(selectedCompetitor === 'left' ? null : 'left')}
              >
                <h3>{selectedHeat.leftCompetitor || selectedHeat.competitor1}</h3>
                <div className="competitor-total">Total: {selectedHeat.leftScore || selectedHeat.score1}</div>
                <div className="cup-code">Cup: {selectedHeat.leftCupCode}</div>
                <div className="click-hint">Click for detailed scores</div>

                {selectedCompetitor === 'left' && selectedHeat.judges && (
                  <div className="sensory-details">
                    <h4>Sensory Breakdown</h4>
                    {selectedHeat.judges.map((judge: Judge, idx: number) => (
                      <div key={idx} className="judge-details">
                        <div className="judge-header">{judge.judgeName}</div>
                        <div className="sensory-categories">
                          <div className="category">
                            <span className="category-name">Visual/Latte Art (3pts):</span>
                            <span className={`category-result ${judge.visualLatteArt === 'left' ? 'won' : 'lost'}`}>
                              {judge.visualLatteArt === 'left' ? '✓ Won (3pts)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Sensory Beverage:</span>
                            <span className="category-info">{judge.sensoryBeverage}</span>
                          </div>
                          <div className="category">
                            <span className="category-name">Taste (1pt):</span>
                            <span className={`category-result ${judge.taste === 'left' ? 'won' : 'lost'}`}>
                              {judge.taste === 'left' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Tactile (1pt):</span>
                            <span className={`category-result ${judge.tactile === 'left' ? 'won' : 'lost'}`}>
                              {judge.tactile === 'left' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Flavour (1pt):</span>
                            <span className={`category-result ${judge.flavour === 'left' ? 'won' : 'lost'}`}>
                              {judge.flavour === 'left' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category overall">
                            <span className="category-name">Overall (5pts):</span>
                            <span className={`category-result ${judge.overall === 'left' ? 'won' : 'lost'}`}>
                              {judge.overall === 'left' ? '✓ Won (5pts)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="judge-total">
                            <span>Judge Total: {getJudgeScore(judge, 'left', selectedHeat)} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="vs-section">VS</div>

              <div 
                className="competitor-section clickable"
                onClick={() => setSelectedCompetitor(selectedCompetitor === 'right' ? null : 'right')}
              >
                <h3>{selectedHeat.rightCompetitor || selectedHeat.competitor2}</h3>
                <div className="competitor-total">Total: {selectedHeat.rightScore || selectedHeat.score2}</div>
                <div className="cup-code">Cup: {selectedHeat.rightCupCode}</div>
                <div className="click-hint">Click for detailed scores</div>

                {selectedCompetitor === 'right' && selectedHeat.judges && (
                  <div className="sensory-details">
                    <h4>Sensory Breakdown</h4>
                    {selectedHeat.judges.map((judge: Judge, idx: number) => (
                      <div key={idx} className="judge-details">
                        <div className="judge-header">{judge.judgeName}</div>
                        <div className="sensory-categories">
                          <div className="category">
                            <span className="category-name">Visual/Latte Art (3pts):</span>
                            <span className={`category-result ${judge.visualLatteArt === 'right' ? 'won' : 'lost'}`}>
                              {judge.visualLatteArt === 'right' ? '✓ Won (3pts)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Sensory Beverage:</span>
                            <span className="category-info">{judge.sensoryBeverage}</span>
                          </div>
                          <div className="category">
                            <span className="category-name">Taste (1pt):</span>
                            <span className={`category-result ${judge.taste === 'right' ? 'won' : 'lost'}`}>
                              {judge.taste === 'right' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Tactile (1pt):</span>
                            <span className={`category-result ${judge.tactile === 'right' ? 'won' : 'lost'}`}>
                              {judge.tactile === 'right' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category">
                            <span className="category-name">Flavour (1pt):</span>
                            <span className={`category-result ${judge.flavour === 'right' ? 'won' : 'lost'}`}>
                              {judge.flavour === 'right' ? '✓ Won (1pt)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="category overall">
                            <span className="category-name">Overall (5pts):</span>
                            <span className={`category-result ${judge.overall === 'right' ? 'won' : 'lost'}`}>
                              {judge.overall === 'right' ? '✓ Won (5pts)' : '✗ Lost (0pts)'}
                            </span>
                          </div>
                          <div className="judge-total">
                            <span>Judge Total: {getJudgeScore(judge, 'right', selectedHeat)} pts</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="heat-modal-footer">
              <div className="judges-section">
                <h4>Judges</h4>
                <div className="judges-list">
                  {selectedHeat.judges && selectedHeat.judges.map((judge: Judge, idx: number) => (
                    <span key={idx} className="judge-badge">{judge.judgeName}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatCardCarousel;