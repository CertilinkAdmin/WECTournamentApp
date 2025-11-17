/**
 * Utility functions for tournament routing by slug
 * Format: WEC2025, WEC2026, etc.
 * For future tournaments, the slug will be abstracted when the tournament is created
 */

/**
 * Extract tournament slug from tournament name
 * Examples:
 * - "World Espresso Championships 2025 Milano" -> "WEC2025"
 * - "2026 United States Espresso Championship" -> "WEC2026" (or could be "US2026" if needed)
 */
export function extractTournamentSlug(tournamentName: string): string | null {
  // Match WEC pattern: "World Espresso Championships" + year
  const wecMatch = tournamentName.match(/World\s+Espresso\s+Championships\s+(\d{4})/i);
  if (wecMatch) {
    return `WEC${wecMatch[1]}`;
  }

  // Match year pattern: "2025", "2026", etc. at the start or in the name
  const yearMatch = tournamentName.match(/(\d{4})/);
  if (yearMatch) {
    const year = yearMatch[1];
    // Check if it's an Espresso Championship
    if (tournamentName.toLowerCase().includes('espresso championship')) {
      return `WEC${year}`;
    }
    // For other formats, use WEC prefix
    return `WEC${year}`;
  }

  return null;
}

/**
 * Find tournament by slug
 * Matches tournaments by year extracted from slug
 */
export function findTournamentBySlug(
  tournaments: Array<{ id: number; name: string }>,
  slug: string
): { id: number; name: string } | null {
  // Extract year from slug (e.g., "WEC2025" -> "2025")
  const yearMatch = slug.match(/(\d{4})/);
  if (!yearMatch) return null;
  
  const year = yearMatch[1];
  
  // Find tournament that contains this year
  // Prioritize "World Espresso Championships" matches
  let tournament = tournaments.find(t => {
    const nameLower = t.name.toLowerCase();
    return nameLower.includes('world espresso championships') && nameLower.includes(year);
  });
  
  // If not found, try any tournament with that year
  if (!tournament) {
    tournament = tournaments.find(t => 
      t.name.includes(year)
    );
  }
  
  return tournament || null;
}

