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
  if (!tournamentName) return null;
  
  // Normalize the name: trim and handle multiple spaces
  const normalizedName = tournamentName.trim().replace(/\s+/g, ' ');
  
  // Match WEC pattern: "World Espresso Championships" + year (with optional location)
  // Examples: "World Espresso Championships 2025 Milano", "World Espresso Championships 2025"
  const wecMatch = normalizedName.match(/World\s+Espresso\s+Championships\s+(\d{4})(?:\s+\w+)?/i);
  if (wecMatch) {
    return `WEC${wecMatch[1]}`;
  }

  // Match year pattern: "2025", "2026", etc. at the start or in the name
  const yearMatch = normalizedName.match(/(\d{4})/);
  if (yearMatch) {
    const year = yearMatch[1];
    // Check if it's an Espresso Championship
    if (normalizedName.toLowerCase().includes('espresso championship')) {
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
 * Prioritizes tournaments with "Milano" in the name and higher IDs (more recent)
 */
export function findTournamentBySlug(
  tournaments: Array<{ id: number; name: string }>,
  slug: string
): { id: number; name: string } | null {
  // Extract year from slug (e.g., "WEC2025" -> "2025")
  const yearMatch = slug.match(/(\d{4})/);
  if (!yearMatch) return null;
  
  const year = yearMatch[1];
  
  // Find all tournaments that match the year
  const matchingTournaments = tournaments.filter(t => {
    const nameLower = t.name.toLowerCase();
    return nameLower.includes('world espresso championships') && t.name.includes(year);
  });
  
  if (matchingTournaments.length === 0) {
    // If no "World Espresso Championships" matches, try any tournament with that year
    const anyMatch = tournaments.find(t => t.name.includes(year));
    return anyMatch || null;
  }
  
  // If multiple matches, prioritize:
  // 1. Tournaments with "Milano" in the name (more specific)
  // 2. Higher ID (more recent/complete data)
  const milanoTournaments = matchingTournaments.filter(t => 
    t.name.toLowerCase().includes('milano')
  );
  
  if (milanoTournaments.length > 0) {
    // Sort by ID descending (highest ID = most recent)
    milanoTournaments.sort((a, b) => b.id - a.id);
    return milanoTournaments[0];
  }
  
  // If no Milano tournaments, return the one with highest ID
  matchingTournaments.sort((a, b) => b.id - a.id);
  return matchingTournaments[0];
}

