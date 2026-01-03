import { storage } from "../storage";
import type { Tournament, TournamentParticipant, Match } from "@shared/schema";

export type RoundType = 'QUALIFYING' | 'SEMIFINAL' | 'FINAL';

export interface RoundScores {
  participantId: number;
  userId: number;
  participantName: string;
  roundScore: number;
  cumulativeScore: number;
  matchesWon: number;
  matchesPlayed: number;
}

export interface LeaderboardEntry extends RoundScores {
  seed: number;
  eliminatedRound: number | null;
  rank: number;
}

export interface RoundCompletionResult {
  round: number;
  roundType: RoundType;
  totalRounds: number;
  isComplete: boolean;
  scores: RoundScores[];
  winnerId?: number;
  winnerName?: string;
}

export function determineRoundType(round: number, totalRounds: number): RoundType {
  if (round === totalRounds) {
    return 'FINAL';
  }
  if (round === totalRounds - 1) {
    return 'SEMIFINAL';
  }
  return 'QUALIFYING';
}

export function getRoundDisplayName(round: number, totalRounds: number): string {
  const roundType = determineRoundType(round, totalRounds);
  switch (roundType) {
    case 'FINAL':
      return 'Final';
    case 'SEMIFINAL':
      return 'Semifinal';
    default:
      return `Round ${round}`;
  }
}

export async function isRoundComplete(tournamentId: number, round: number): Promise<boolean> {
  const matches = await storage.getTournamentMatches(tournamentId);
  const roundMatches = matches.filter(m => m.round === round);
  
  if (roundMatches.length === 0) {
    return false;
  }
  
  return roundMatches.every(m => m.status === 'DONE');
}

export async function computeRoundScores(tournamentId: number, round: number): Promise<RoundScores[]> {
  const matches = await storage.getTournamentMatches(tournamentId);
  const roundMatches = matches.filter(m => m.round === round);
  const participants = await storage.getTournamentParticipants(tournamentId);
  const users = await storage.getAllUsers();
  
  const scoreMap = new Map<number, RoundScores>();
  
  for (const match of roundMatches) {
    const heatScores = await storage.getMatchScores(match.id);
    
    for (const competitorId of [match.competitor1Id, match.competitor2Id]) {
      if (!competitorId) continue;
      
      const participant = participants.find(p => p.userId === competitorId);
      if (!participant) continue;
      
      const user = users.find(u => u.id === competitorId);
      const competitorScores = heatScores.filter((s: { competitorId: number }) => s.competitorId === competitorId);
      const matchScore = competitorScores.reduce((sum: number, s: { score: number }) => sum + s.score, 0);
      
      if (!scoreMap.has(participant.id)) {
        scoreMap.set(participant.id, {
          participantId: participant.id,
          userId: competitorId,
          participantName: user?.name || `Participant ${participant.id}`,
          roundScore: 0,
          cumulativeScore: participant.totalScore || 0,
          matchesWon: 0,
          matchesPlayed: 0,
        });
      }
      
      const entry = scoreMap.get(participant.id)!;
      entry.roundScore += matchScore;
      entry.matchesPlayed += 1;
      
      if (match.winnerId === competitorId) {
        entry.matchesWon += 1;
      }
    }
  }
  
  return Array.from(scoreMap.values()).sort((a, b) => b.roundScore - a.roundScore);
}

export async function updateCumulativeScores(
  tournamentId: number, 
  roundScores: RoundScores[]
): Promise<void> {
  for (const score of roundScores) {
    const newTotalScore = score.cumulativeScore + score.roundScore;
    await storage.updateParticipantTotalScore(score.participantId, newTotalScore);
  }
}

export async function updateEliminatedParticipants(
  tournamentId: number, 
  round: number
): Promise<void> {
  const matches = await storage.getTournamentMatches(tournamentId);
  const roundMatches = matches.filter(m => m.round === round && m.status === 'DONE');
  const participants = await storage.getTournamentParticipants(tournamentId);
  
  for (const match of roundMatches) {
    if (!match.winnerId) continue;
    
    const loserId = match.competitor1Id === match.winnerId 
      ? match.competitor2Id 
      : match.competitor1Id;
    
    if (!loserId) continue;
    
    const loserParticipant = participants.find(p => p.userId === loserId);
    if (loserParticipant && !loserParticipant.eliminatedRound) {
      await storage.updateParticipantElimination(loserParticipant.id, round);
    }
  }
}

export async function finalizeTournament(
  tournamentId: number
): Promise<{ winnerId: number; winnerName: string } | null> {
  const tournament = await storage.getTournament(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }
  
  const matches = await storage.getTournamentMatches(tournamentId);
  const finalMatches = matches.filter(m => m.round === tournament.totalRounds && m.status === 'DONE');
  
  if (finalMatches.length === 0) {
    return null;
  }
  
  const finalMatch = finalMatches[0];
  if (!finalMatch.winnerId) {
    return null;
  }
  
  const users = await storage.getAllUsers();
  const winner = users.find(u => u.id === finalMatch.winnerId);
  
  await storage.setTournamentWinner(tournamentId, finalMatch.winnerId);
  
  const participants = await storage.getTournamentParticipants(tournamentId);
  const winnerParticipant = participants.find(p => p.userId === finalMatch.winnerId);
  if (winnerParticipant) {
    await storage.updateParticipantFinalRank(winnerParticipant.id, 1);
  }
  
  return {
    winnerId: finalMatch.winnerId,
    winnerName: winner?.name || 'Unknown',
  };
}

export async function completeRound(
  tournamentId: number, 
  round: number
): Promise<RoundCompletionResult> {
  const tournament = await storage.getTournament(tournamentId);
  if (!tournament) {
    throw new Error(`Tournament ${tournamentId} not found`);
  }
  
  const isComplete = await isRoundComplete(tournamentId, round);
  if (!isComplete) {
    throw new Error(`Round ${round} is not complete. All matches must be DONE.`);
  }
  
  // Calculate and store heat scores for all matches in this round before computing round scores
  // This ensures scores are available for leaderboard and round completion calculations
  try {
    const { calculateAndStoreHeatScores } = await import('./scoreCalculation');
    const matches = await storage.getTournamentMatches(tournamentId);
    const roundMatches = matches.filter(m => m.round === round);
    
    console.log(`📊 Calculating heat scores for Round ${round} (${roundMatches.length} matches)...`);
    for (const match of roundMatches) {
      try {
        await calculateAndStoreHeatScores(match.id);
      } catch (error) {
        console.warn(`⚠️  Failed to calculate scores for match ${match.id}:`, error);
      }
    }
    console.log(`✅ Heat scores calculated for Round ${round}`);
  } catch (error) {
    console.warn(`⚠️  Failed to calculate heat scores for Round ${round}:`, error);
    // Don't fail round completion if score calculation fails
  }
  
  const roundType = determineRoundType(round, tournament.totalRounds);
  const scores = await computeRoundScores(tournamentId, round);
  
  await updateCumulativeScores(tournamentId, scores);
  await updateEliminatedParticipants(tournamentId, round);
  
  let winnerId: number | undefined;
  let winnerName: string | undefined;
  
  if (roundType === 'FINAL') {
    // Finalize tournament - don't bump currentRound beyond totalRounds
    const result = await finalizeTournament(tournamentId);
    if (result) {
      winnerId = result.winnerId;
      winnerName = result.winnerName;
    }
  } else {
    // Only bump currentRound for non-final rounds
    await storage.updateTournamentCurrentRound(tournamentId, round + 1);
  }
  
  return {
    round,
    roundType,
    totalRounds: tournament.totalRounds,
    isComplete: true,
    scores,
    winnerId,
    winnerName,
  };
}

export async function getLeaderboard(tournamentId: number): Promise<LeaderboardEntry[]> {
  const participants = await storage.getTournamentParticipants(tournamentId);
  const users = await storage.getAllUsers();
  const matches = await storage.getTournamentMatches(tournamentId);
  
  const entries: LeaderboardEntry[] = participants.map(p => {
    const user = users.find(u => u.id === p.userId);
    
    const participantMatches = matches.filter(
      m => (m.competitor1Id === p.userId || m.competitor2Id === p.userId) && m.status === 'DONE'
    );
    const matchesWon = participantMatches.filter(m => m.winnerId === p.userId).length;
    
    return {
      participantId: p.id,
      userId: p.userId,
      participantName: user?.name || `Participant ${p.id}`,
      roundScore: 0,
      cumulativeScore: p.totalScore || 0,
      matchesWon,
      matchesPlayed: participantMatches.length,
      seed: p.seed,
      eliminatedRound: p.eliminatedRound,
      rank: 0,
    };
  });
  
  entries.sort((a, b) => {
    if (b.cumulativeScore !== a.cumulativeScore) {
      return b.cumulativeScore - a.cumulativeScore;
    }
    if (b.matchesWon !== a.matchesWon) {
      return b.matchesWon - a.matchesWon;
    }
    return a.seed - b.seed;
  });
  
  entries.forEach((entry, index) => {
    entry.rank = index + 1;
  });
  
  return entries;
}
