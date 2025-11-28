import { describe, expect, test } from 'bun:test';
import type { Station } from '../shared/schema';
import { getMainStationsForTournament } from '../client/src/utils/stationUtils';

const sampleStations: Station[] = [
  { id: 1, tournamentId: 1, name: 'Station A', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: null },
  { id: 2, tournamentId: 1, name: 'Main Stage', location: 'WEC 2025 Milano', status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: null },
  { id: 93, tournamentId: 45, name: 'A', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: 290 },
  { id: 94, tournamentId: 45, name: 'B', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: 292 },
  { id: 95, tournamentId: 45, name: 'C', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: 291 },
  { id: 3, tournamentId: 1, name: 'A', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: null },
  { id: 4, tournamentId: 1, name: 'B', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: null },
  { id: 5, tournamentId: 1, name: 'C', location: null, status: 'AVAILABLE', nextAvailableAt: new Date().toISOString(), currentMatchId: null, stationLeadId: null },
];

describe('getMainStationsForTournament', () => {
  test('selects A/B/C belonging to the active tournament when duplicates exist', () => {
    const result = getMainStationsForTournament(sampleStations, 45);
    expect(result.map((station) => station.id)).toEqual([93, 94, 95]);
  });

  test('falls back to earliest instances if tournament-specific stations missing', () => {
    const result = getMainStationsForTournament(sampleStations, 999);
    expect(result.map((station) => station.id)).toEqual([1, 4, 5]);
  });
});


