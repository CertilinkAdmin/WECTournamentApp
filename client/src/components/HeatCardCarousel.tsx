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

  const currentItem = items[currentIndex];
  const isCurrentHeat = currentItem?.type === 'heat';
  
  // Get total number of heat items (exclude heat info card)
  const totalHeats = items.filter(item => item.type === 'competitor').length;
  const currentHeatIndex = isCurrentHeat ? 0 : currentIndex;

  return (
    <div className="heat-carousel-container">
      {/* Horizontal Heat Navigation Card */}
      {isCurrentHeat && currentItem && (
        <div className="heat-navigation-card" onClick={() => openModal(currentItem.data)}>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="heat-nav-btn prev"
            data-testid="button-heat-previous"
          >
            <span className="nav-arrow">←</span>
            <span className="nav-text">Previous</span>
          </Button>

          <div className="heat-navigation-content">
            <div className="heat-navigation-title" data-testid="text-heat-number">
              Heat {currentItem.data.heatNumber}
            </div>
            <div className="heat-navigation-subtitle" data-testid="text-heat-total">
              of {totalHeats}
            </div>
            <div className="heat-navigation-matchup" data-testid="text-heat-matchup">
              {competitors.length >= 2 ? `${competitors[0].name} vs ${competitors[1].name}` : 'BYE vs BYE'}
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="heat-nav-btn next"
            data-testid="button-heat-next"
          >
            <span className="nav-text">Next</span>
            <span className="nav-arrow">→</span>
          </Button>
        </div>
      )}

      {/* Competitor Cards */}
      {!isCurrentHeat && currentItem && (
        <div className="competitor-display-card">
          <div className="competitor-card-content"
               style={{ backgroundImage: getBackgroundImage('competitor', currentItem.data) }}>
            <div className="competitor-info">
              <div className="competitor-header">
                {currentItem.data.isWinner && (
                  <Badge className="bg-yellow-500 text-black mb-2">
                    <Trophy className="h-3 w-3 mr-1" />
                    Winner
                  </Badge>
                )}
                <div className="competitor-name">{currentItem.data.name}</div>
              </div>

              <div className="competitor-details">
                {currentItem.data.cupCode && (
                  <div className="cup-code-display">
                    <Coffee className="h-4 w-4" />
                    <span>Cup: {currentItem.data.cupCode}</span>
                  </div>
                )}

                {currentItem.data.score !== undefined && (
                  <div className="competitor-score">
                    <Award className="h-4 w-4" />
                    <span>Score: {currentItem.data.score}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation buttons for competitor view */}
          <div className="competitor-nav-buttons">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={prevSlide}
              className="carousel-btn prev-btn"
              data-testid="button-competitor-previous"
            >
              ◁
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={nextSlide}
              className="carousel-btn next-btn"
              data-testid="button-competitor-next"
            >
              ▷
            </Button>
          </div>
        </div>
      )}

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
                {selectedHeat.judges && selectedHeat.judges.length > 0 ? (
                  <>
                    <h4>Judges</h4>
                    <div className="judges-list">
                      {selectedHeat.judges.map((judge: Judge, idx: number) => (
                        <span key={idx} className="judge-badge">{judge.judgeName}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-judges-message" data-testid="text-no-judge-scorecards">
                    <Users className="h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-gray-500 text-sm">No judge scorecards available for this heat</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeatCardCarousel;