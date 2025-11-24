/**
 * Reorganize Google Sheets/Excel Data into Clean Structure
 * 
 * This script:
 * 1. Downloads Google Sheets as Excel
 * 2. Parses the Excel file
 * 3. Reorganizes data by Heat → Judge → Beverage
 * 4. Outputs clean JSON structure for easy import
 */

import XLSX from 'xlsx';
import fs from 'fs/promises';

// Judge name mapping
const JUDGE_NAME_MAP: Record<string, string> = {
  'MC': 'Michalis',
  'JASPER': 'Jasper',
  'Jasper': 'Jasper',
  'Shin': 'Shinsaku',
  'Korn': 'Korn',
  'Ali': 'Ali',
  'Junior': 'Junior',
  'Tess': 'Tess',
};

interface RawSpreadsheetRow {
  HEAT?: string | number;
  JUDGE?: string;
  'LATTE ART'?: string;
  'CUP CODE'?: string;
  BEVERAGE?: string;
  TASTE?: string | number;
  TACTILE?: string | number;
  FLAVOUR?: string | number;
  OVERALL?: string | number;
  SUBTOTAL?: string | number;
  'CUP CODES'?: string;
  CODE?: string;
  TOTAL?: string | number;
  Competitor?: string;
}

interface ReorganizedJudgeScore {
  judgeName: string;
  beverage: 'CAPPUCCINO' | 'ESPRESSO';
  leftCupCode: string;
  rightCupCode: string;
  visualLatteArt?: 'left' | 'right'; // Only for CAPPUCCINO
  taste: 'left' | 'right';
  tactile: 'left' | 'right';
  flavour: 'left' | 'right';
  overall: 'left' | 'right';
}

interface ReorganizedHeat {
  heatNumber: number;
  heatName: string;
  competitor1?: string;
  competitor2?: string;
  competitor1CupCode?: string;
  competitor2CupCode?: string;
  judgeScores: ReorganizedJudgeScore[];
}

interface ReorganizedTournamentData {
  heats: ReorganizedHeat[];
  summary: {
    totalHeats: number;
    totalJudges: number;
    uniqueJudges: string[];
  };
}

/**
 * Download Google Sheets as Excel
 */
async function downloadGoogleSheets(sheetId: string, gid: string = '0'): Promise<string> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=${gid}`;
  const filePath = `/tmp/wec2025-data-${Date.now()}.xlsx`;
  
  console.log(`📥 Downloading Google Sheets as Excel...`);
  console.log(`   URL: ${exportUrl}`);
  
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(buffer));
  
  console.log(`✅ Downloaded Excel file (${buffer.byteLength} bytes) to ${filePath}\n`);
  return filePath;
}

/**
 * Parse Excel file and extract data
 */
function parseExcelFile(filePath: string): RawSpreadsheetRow[] {
  console.log(`📊 Parsing Excel file: ${filePath}\n`);
  
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // Convert to JSON
  const rows = XLSX.utils.sheet_to_json<RawSpreadsheetRow>(worksheet, {
    defval: '', // Default value for empty cells
    raw: false, // Convert all values to strings
  });
  
  console.log(`✅ Parsed ${rows.length} rows from sheet "${sheetName}"\n`);
  return rows;
}

/**
 * Normalize cell value to string
 */
function normalizeValue(value: string | number | undefined): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'number') return value.toString();
  return String(value).trim();
}

/**
 * Determine if a value indicates "left" or "right" cup
 */
function parseCupWinner(value: string): 'left' | 'right' | null {
  const normalized = normalizeValue(value).toUpperCase();
  if (normalized.includes('LEFT') || normalized === 'L' || normalized.startsWith('LEFT')) {
    return 'left';
  }
  if (normalized.includes('RIGHT') || normalized === 'R' || normalized.startsWith('RIGHT')) {
    return 'right';
  }
  return null;
}

/**
 * Extract cup codes from various fields
 */
function extractCupCodes(row: RawSpreadsheetRow, heatName: string): { left: string; right: string } {
  // Try multiple fields for cup codes
  const code = normalizeValue(row.CODE);
  const cupCode = normalizeValue(row['CUP CODE']);
  const cupCodes = normalizeValue(row['CUP CODES']);
  
  // Common patterns: "M7 / K9" or "M7, K9" or just "M7"
  const combined = `${code} ${cupCode} ${cupCodes}`.trim();
  
  // Try to extract two codes
  const match = combined.match(/([A-Z0-9]+)\s*[\/,]\s*([A-Z0-9]+)/);
  if (match) {
    return { left: match[1], right: match[2] };
  }
  
  // If single code, try to split by space
  const codes = combined.split(/\s+/).filter(c => /^[A-Z0-9]+$/.test(c));
  if (codes.length >= 2) {
    return { left: codes[0], right: codes[1] };
  }
  
  // Fallback: return empty
  return { left: '', right: '' };
}

/**
 * Reorganize raw spreadsheet data into structured format
 */
function reorganizeData(rawRows: RawSpreadsheetRow[]): ReorganizedTournamentData {
  console.log('🔄 Reorganizing data by Heat → Judge → Beverage...\n');
  
  // Group by heat
  const heatMap = new Map<string, RawSpreadsheetRow[]>();
  
  for (const row of rawRows) {
    const heat = normalizeValue(row.HEAT);
    if (!heat || heat === '' || heat.toLowerCase() === 'heat') continue;
    
    if (!heatMap.has(heat)) {
      heatMap.set(heat, []);
    }
    heatMap.get(heat)!.push(row);
  }
  
  console.log(`📊 Found ${heatMap.size} heats\n`);
  
  const reorganizedHeats: ReorganizedHeat[] = [];
  const allJudges = new Set<string>();
  
  // Process each heat
  for (const [heatName, heatRows] of heatMap.entries()) {
    const heatNumber = parseInt(heatName.replace(/[^0-9]/g, '')) || 0;
    
    console.log(`   Processing ${heatName} (${heatRows.length} rows)...`);
    
    // Extract cup codes for this heat
    const cupCodes = extractCupCodes(heatRows[0] || {}, heatName);
    
    // Group by judge and beverage
    const judgeScoresMap = new Map<string, Map<string, ReorganizedJudgeScore>>();
    
    for (const row of heatRows) {
      const judgeName = normalizeValue(row.JUDGE);
      if (!judgeName) continue;
      
      const normalizedJudge = JUDGE_NAME_MAP[judgeName] || judgeName;
      allJudges.add(normalizedJudge);
      
      const beverage = normalizeValue(row.BEVERAGE).toUpperCase();
      if (beverage !== 'CAPPUCCINO' && beverage !== 'ESPRESSO') continue;
      
      const key = `${normalizedJudge}-${beverage}`;
      
      if (!judgeScoresMap.has(normalizedJudge)) {
        judgeScoresMap.set(normalizedJudge, new Map());
      }
      
      const beverageMap = judgeScoresMap.get(normalizedJudge)!;
      
      if (!beverageMap.has(beverage)) {
        beverageMap.set(beverage, {
          judgeName: normalizedJudge,
          beverage: beverage as 'CAPPUCCINO' | 'ESPRESSO',
          leftCupCode: cupCodes.left,
          rightCupCode: cupCodes.right,
          taste: 'left',
          tactile: 'left',
          flavour: 'left',
          overall: 'left',
        });
      }
      
      const score = beverageMap.get(beverage)!;
      
      // Parse latte art (only for CAPPUCCINO)
      if (beverage === 'CAPPUCCINO') {
        const latteArt = normalizeValue(row['LATTE ART']).toUpperCase();
        if (latteArt.includes('LEFT')) {
          score.visualLatteArt = 'left';
        } else if (latteArt.includes('RIGHT')) {
          score.visualLatteArt = 'right';
        }
      }
      
      // Parse sensory scores
      const taste = parseCupWinner(row.TASTE);
      if (taste) score.taste = taste;
      
      const tactile = parseCupWinner(row.TACTILE);
      if (tactile) score.tactile = tactile;
      
      const flavour = parseCupWinner(row.FLAVOUR);
      if (flavour) score.flavour = flavour;
      
      const overall = parseCupWinner(row.OVERALL);
      if (overall) score.overall = overall;
    }
    
    // Flatten judge scores
    const judgeScores: ReorganizedJudgeScore[] = [];
    for (const beverageMap of judgeScoresMap.values()) {
      for (const score of beverageMap.values()) {
        judgeScores.push(score);
      }
    }
    
    reorganizedHeats.push({
      heatNumber,
      heatName,
      competitor1CupCode: cupCodes.left,
      competitor2CupCode: cupCodes.right,
      judgeScores,
    });
  }
  
  // Sort heats by number
  reorganizedHeats.sort((a, b) => a.heatNumber - b.heatNumber);
  
  return {
    heats: reorganizedHeats,
    summary: {
      totalHeats: reorganizedHeats.length,
      totalJudges: allJudges.size,
      uniqueJudges: Array.from(allJudges).sort(),
    },
  };
}

/**
 * Main function to reorganize spreadsheet data
 */
async function reorganizeSpreadsheetData() {
  console.log('🏆 Reorganizing Tournament Spreadsheet Data\n');
  console.log('='.repeat(60));
  
  const sheetId = '1zhIZk5t66I0prIntx5T9c0PS0yAA3wKyfcFXqNCPT0g';
  const gid = '0';
  
  try {
    // Step 1: Download Excel file
    const excelPath = await downloadGoogleSheets(sheetId, gid);
    
    // Step 2: Parse Excel
    const rawRows = parseExcelFile(excelPath);
    
    // Step 3: Reorganize data
    const reorganized = reorganizeData(rawRows);
    
    // Step 4: Output to JSON file
    const outputPath = './scripts/reorganized-tournament-data.json';
    await fs.writeFile(
      outputPath,
      JSON.stringify(reorganized, null, 2),
      'utf-8'
    );
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATA REORGANIZATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   Total Heats: ${reorganized.summary.totalHeats}`);
    console.log(`   Total Judges: ${reorganized.summary.totalJudges}`);
    console.log(`   Judges: ${reorganized.summary.uniqueJudges.join(', ')}`);
    console.log(`\n📁 Output saved to: ${outputPath}`);
    console.log(`\n💡 You can now use this JSON file to import data into the database.\n`);
    
    // Clean up temp file
    await fs.unlink(excelPath);
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  }
}

// Run if executed directly
reorganizeSpreadsheetData().catch(console.error);

export { reorganizeSpreadsheetData, ReorganizedTournamentData, ReorganizedHeat, ReorganizedJudgeScore };

