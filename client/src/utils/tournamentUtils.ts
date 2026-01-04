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
 * - "Test Tournament 2025" -> "test-tournament-2025" (for test tournaments)
 */
export function extractTournamentSlug(tournamentName: string): string | null {
  if (!tournamentName) return null;
  
  // Normalize the name: trim and handle multiple spaces
  const normalizedName = tournamentName.trim().replace(/\s+/g, ' ');
  const nameLower = normalizedName.toLowerCase();
  
  // Check if it's a test tournament
  const isTest = nameLower.includes('test') || nameLower.includes('demo');
  
  // For test tournaments, create a slug from the name
  if (isTest) {
    return normalizedName.toLowerCase().replace(/\s+/g, '-');
  }
  
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
 * Excludes test tournaments unless the slug explicitly indicates a test tournament
 */
export function findTournamentBySlug(
  tournaments: Array<{ id: number; name: string }>,
  slug: string
): { id: number; name: string } | null {
  if (!tournaments || tournaments.length === 0) return null;
  
  const slugLower = slug.toLowerCase();
  const isTestSlug = slugLower.includes('test') || slugLower.includes('demo');
  
  // Extract year from slug (e.g., "WEC2025" -> "2025")
  const yearMatch = slug.match(/(\d{4})/);
  if (!yearMatch) {
    // If no year, try exact name match (for test tournaments, etc.)
    const exactMatch = tournaments.find(t => 
      t.name.toLowerCase().replace(/\s+/g, '-') === slugLower ||
      t.name.toLowerCase() === slugLower
    );
    return exactMatch || null;
  }
  
  const year = yearMatch[1];
  
  // Filter tournaments by year and test status
  const matchingTournaments = tournaments.filter(t => {
    const nameLower = t.name.toLowerCase();
    const isTestTournament = nameLower.includes('test') || nameLower.includes('demo');
    
    // If looking for a test tournament, only match test tournaments
    if (isTestSlug) {
      return isTestTournament && t.name.includes(year);
    }
    
    // If looking for a real tournament, exclude test tournaments
    if (isTestTournament) {
      return false;
    }
    
    // Match by year and "World Espresso Championships" pattern
    return nameLower.includes('world espresso championships') && t.name.includes(year);
  });
  
  if (matchingTournaments.length === 0) {
    // If no matches, try any tournament with that year (respecting test status)
    const anyMatch = tournaments.find(t => {
      const nameLower = t.name.toLowerCase();
      const isTestTournament = nameLower.includes('test') || nameLower.includes('demo');
      if (isTestSlug) {
        return isTestTournament && t.name.includes(year);
      }
      return !isTestTournament && t.name.includes(year);
    });
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

