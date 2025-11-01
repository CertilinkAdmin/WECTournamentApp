// Bracket API Routes - Express endpoints for bracket operations

import type { Express } from 'express';
import { generateRound1 } from '../bracket/generateRound1';
import { moveCompetitor, type MoveFrom, type MoveTo } from '../bracket/manualOverride';
import type { Competitor, Heat } from '../bracket/types';

export function registerBracketRoutes(app: Express) {
  /**
   * POST /api/bracket/generate
   * Generates Round 1 from a list of competitors
   */
  app.post('/api/bracket/generate', async (req, res) => {
    try {
      const { competitors } = req.body as { competitors: Competitor[] };
      
      if (!Array.isArray(competitors)) {
        return res.status(400).json({ error: 'competitors must be an array' });
      }
      
      // Validate competitors have required fields
      for (const comp of competitors) {
        if (!comp.id || !comp.name || typeof comp.signupOrder !== 'number') {
          return res.status(400).json({ 
            error: 'Each competitor must have id, name, and signupOrder' 
          });
        }
      }
      
      // Sort by signupOrder (should already be sorted, but ensure it)
      const sortedCompetitors = [...competitors].sort((a, b) => 
        a.signupOrder - b.signupOrder
      );
      
      const round = generateRound1(sortedCompetitors);
      
      console.log('BRACKET_GENERATED', { 
        roundNumber: round.roundNumber, 
        numHeats: round.heats.length,
        numCompetitors: competitors.length 
      });
      
      res.json({ round });
    } catch (error: any) {
      console.error('Error generating bracket:', error);
      res.status(500).json({ error: error.message || 'Failed to generate bracket' });
    }
  });
  
  /**
   * POST /api/bracket/override
   * Moves a competitor from one heat/slot to another
   */
  app.post('/api/bracket/override', async (req, res) => {
    try {
      const { heats, from, to } = req.body as { 
        heats: Heat[]; 
        from: MoveFrom; 
        to: MoveTo;
      };
      
      if (!Array.isArray(heats)) {
        return res.status(400).json({ error: 'heats must be an array' });
      }
      
      if (!from || !to) {
        return res.status(400).json({ error: 'from and to are required' });
      }
      
      if (from.side !== 'A' && from.side !== 'B') {
        return res.status(400).json({ error: "from.side must be 'A' or 'B'" });
      }
      
      if (to.side !== 'A' && to.side !== 'B') {
        return res.status(400).json({ error: "to.side must be 'A' or 'B'" });
      }
      
      const updatedHeats = moveCompetitor(heats, from, to);
      
      console.log('MANUAL_OVERRIDE', { 
        fromHeat: from.heatId, 
        fromSide: from.side,
        toHeat: to.heatId,
        toSide: to.side
      });
      
      res.json({ heats: updatedHeats });
    } catch (error: any) {
      console.error('Error performing manual override:', error);
      res.status(500).json({ error: error.message || 'Failed to move competitor' });
    }
  });
}

