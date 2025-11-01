// Bracket System Tests
// Tests for BYE-only-in-round-1 behavior and no-show handling

import { describe, test, expect } from 'bun:test';
import { generateRound1 } from '../server/bracket/generateRound1';
import { buildNextRound } from '../server/bracket/buildNextRound';
import { resolveHeat } from '../server/bracket/resolveHeat';
import { moveCompetitor } from '../server/bracket/manualOverride';
import type { Competitor, Round, Heat } from '../server/bracket/types';

describe('Bracket System', () => {
  
  test('7 signups -> round 1 has 4 heats, exactly 1 bye, byes applied to earliest signups', () => {
    const competitors: Competitor[] = [
      { id: '1', name: 'Competitor 1', signupOrder: 1 },
      { id: '2', name: 'Competitor 2', signupOrder: 2 },
      { id: '3', name: 'Competitor 3', signupOrder: 3 },
      { id: '4', name: 'Competitor 4', signupOrder: 4 },
      { id: '5', name: 'Competitor 5', signupOrder: 5 },
      { id: '6', name: 'Competitor 6', signupOrder: 6 },
      { id: '7', name: 'Competitor 7', signupOrder: 7 },
    ];
    
    const round1 = generateRound1(competitors);
    
    expect(round1.roundNumber).toBe(1);
    expect(round1.heats.length).toBe(4);
    
    // Count byes
    const byes = round1.heats.filter(h => 
      h.competitorA?.status === 'bye' || h.competitorB?.status === 'bye'
    );
    
    expect(byes.length).toBeGreaterThan(0);
    
    // First competitor should have bye status
    const firstHeat = round1.heats[0];
    expect(firstHeat.competitorA?.status).toBe('bye');
    
    // All heats should have round=1
    round1.heats.forEach(heat => {
      expect(heat.round).toBe(1);
      expect(heat.id).toMatch(/^R1-H\d+$/);
    });
  });
  
  test('Resolving a heat where competitorA is no-show advances competitorB but keeps competitorA name', () => {
    const heat: Heat = {
      id: 'R1-H1',
      round: 1,
      slot: 0,
      competitorA: { id: '1', name: 'No Show Competitor', signupOrder: 1, status: 'no-show' },
      competitorB: { id: '2', name: 'Active Competitor', signupOrder: 2, status: 'active' },
      winnerId: undefined,
      note: undefined
    };
    
    const resolved = resolveHeat(heat);
    
    expect(resolved.winnerId).toBe('2');
    expect(resolved.note).toBe('No Show Competitor NO SHOW');
    // Verify no-show competitor name is preserved
    expect(resolved.competitorA?.name).toBe('No Show Competitor');
    expect(resolved.competitorA?.status).toBe('no-show');
  });
  
  test('buildNextRound from 8 winners -> 4 heats', () => {
    const prevRound: Round = {
      roundNumber: 1,
      heats: [
        { id: 'R1-H0', round: 1, slot: 0, competitorA: { id: '1', name: 'A1', signupOrder: 1 }, competitorB: { id: '2', name: 'A2', signupOrder: 2 }, winnerId: '1' },
        { id: 'R1-H1', round: 1, slot: 1, competitorA: { id: '3', name: 'B1', signupOrder: 3 }, competitorB: { id: '4', name: 'B2', signupOrder: 4 }, winnerId: '3' },
        { id: 'R1-H2', round: 1, slot: 2, competitorA: { id: '5', name: 'C1', signupOrder: 5 }, competitorB: { id: '6', name: 'C2', signupOrder: 6 }, winnerId: '5' },
        { id: 'R1-H3', round: 1, slot: 3, competitorA: { id: '7', name: 'D1', signupOrder: 7 }, competitorB: { id: '8', name: 'D2', signupOrder: 8 }, winnerId: '7' },
        { id: 'R1-H4', round: 1, slot: 4, competitorA: { id: '9', name: 'E1', signupOrder: 9 }, competitorB: { id: '10', name: 'E2', signupOrder: 10 }, winnerId: '9' },
        { id: 'R1-H5', round: 1, slot: 5, competitorA: { id: '11', name: 'F1', signupOrder: 11 }, competitorB: { id: '12', name: 'F2', signupOrder: 12 }, winnerId: '11' },
        { id: 'R1-H6', round: 1, slot: 6, competitorA: { id: '13', name: 'G1', signupOrder: 13 }, competitorB: { id: '14', name: 'G2', signupOrder: 14 }, winnerId: '13' },
        { id: 'R1-H7', round: 1, slot: 7, competitorA: { id: '15', name: 'H1', signupOrder: 15 }, competitorB: { id: '16', name: 'H2', signupOrder: 16 }, winnerId: '15' },
      ]
    };
    
    const nextRound = buildNextRound(prevRound);
    
    expect(nextRound.roundNumber).toBe(2);
    expect(nextRound.heats.length).toBe(4);
    expect(nextRound.heats[0].id).toBe('R2-H0');
  });
  
  test('Manual override successfully moves competitor', () => {
    const heats: Heat[] = [
      { id: 'R1-H1', round: 1, slot: 0, competitorA: { id: '1', name: 'Comp1', signupOrder: 1 }, competitorB: { id: '2', name: 'Comp2', signupOrder: 2 } },
      { id: 'R1-H2', round: 1, slot: 1, competitorA: { id: '3', name: 'Comp3', signupOrder: 3 }, competitorB: { id: '4', name: 'Comp4', signupOrder: 4 } },
    ];
    
    const updated = moveCompetitor(
      heats,
      { heatId: 'R1-H1', side: 'A' },
      { heatId: 'R1-H2', side: 'B' }
    );
    
    expect(updated.length).toBe(heats.length);
    expect(updated[0].competitorA).toBeUndefined();
    expect(updated[1].competitorB?.id).toBe('1');
    expect(updated[1].competitorB?.name).toBe('Comp1');
  });
  
  test('Double no-show does not crash and leaves winner unresolved', () => {
    const heat: Heat = {
      id: 'R1-H1',
      round: 1,
      slot: 0,
      competitorA: { id: '1', name: 'No Show 1', signupOrder: 1, status: 'no-show' },
      competitorB: { id: '2', name: 'No Show 2', signupOrder: 2, status: 'no-show' },
      winnerId: undefined,
      note: undefined
    };
    
    const resolved = resolveHeat(heat);
    
    expect(resolved.winnerId).toBeUndefined();
    expect(resolved.note).toBe('DOUBLE NO SHOW');
    expect(resolved.competitorA?.name).toBe('No Show 1');
    expect(resolved.competitorB?.name).toBe('No Show 2');
  });
});

