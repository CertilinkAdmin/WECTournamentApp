/**
 * Import Tournament Data from Excel using MCP Excel Server
 * 
 * This script uses the Excel MCP server to read and parse the spreadsheet data
 * and import it into the tournament database.
 */

import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import {
  tournaments,
  users,
  tournamentParticipants,
  matches,
  heatJudges,
  judgeDetailedScores,
  heatScores,
  stations,
} from '../shared/schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be set');
}

const sql = postgres(connectionString);
const db = drizzle(sql);

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

interface SpreadsheetRow {
  HEAT?: string;
  JUDGE?: string;
  'LATTE ART'?: string;
  'CUP CODE'?: string;
  BEVERAGE?: string;
  TASTE?: string;
  TACTILE?: string;
  FLAVOUR?: string;
  OVERALL?: string;
  SUBTOTAL?: string;
  'CUP CODES'?: string;
  CODE?: string;
  TOTAL?: string;
  Competitor?: string;
}

/**
 * Parse Excel file using MCP Excel Server
 * Note: This requires the Excel MCP server to be configured and running
 */
async function parseExcelWithMCP(filePath: string): Promise<SpreadsheetRow[]> {
  console.log(`📊 Reading Excel file with MCP: ${filePath}`);
  
  // TODO: Use Excel MCP server functions to:
  // 1. Open the Excel file
  // 2. Read the sheet data
  // 3. Parse rows into structured format
  
  // Expected MCP function calls:
  // - excel_read_file(filePath)
  // - excel_get_sheets(filePath)
  // - excel_read_range(filePath, sheetName, range)
  
  // For now, return empty array - will be implemented when MCP is connected
  return [];
}

/**
 * Download Google Sheets as Excel and parse with MCP
 */
async function downloadAndParseGoogleSheets(sheetId: string, gid: string = '0'): Promise<SpreadsheetRow[]> {
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=xlsx&gid=${gid}`;
  const filePath = `/tmp/wec2025-data-${Date.now()}.xlsx`;
  
  console.log(`📥 Downloading Google Sheets as Excel...`);
  console.log(`   URL: ${exportUrl}`);
  console.log(`   Saving to: ${filePath}`);
  
  // Download the file
  const response = await fetch(exportUrl);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  
  const buffer = await response.arrayBuffer();
  const fs = await import('fs/promises');
  await fs.writeFile(filePath, Buffer.from(buffer));
  
  console.log(`✅ Downloaded Excel file (${buffer.byteLength} bytes)\n`);
  
  // Parse with MCP
  return await parseExcelWithMCP(filePath);
}

/**
 * Process parsed spreadsheet data and create tournament
 */
async function processSpreadsheetData(rows: SpreadsheetRow[], tournamentId: number) {
  console.log(`📋 Processing ${rows.length} rows from spreadsheet...\n`);
  
  // Group rows by heat
  const heatData: Record<string, SpreadsheetRow[]> = {};
  
  for (const row of rows) {
    if (!row.HEAT || !row.HEAT.trim()) continue;
    
    const heatName = row.HEAT.trim();
    if (!heatData[heatName]) {
      heatData[heatName] = [];
    }
    heatData[heatName].push(row);
  }
  
  console.log(`📊 Found ${Object.keys(heatData).length} heats in spreadsheet\n`);
  
  // Process each heat
  for (const [heatName, heatRows] of Object.entries(heatData)) {
    console.log(`\n📋 Processing ${heatName}...`);
    console.log(`   Rows: ${heatRows.length}`);
    
    // TODO: Parse judge scores, create matches, import data
    // This will be similar to the existing create-wec2025-tournament-2-fixed.ts logic
  }
}

async function importFromExcel() {
  console.log('🏆 Importing Tournament Data from Excel/Google Sheets via MCP...\n');
  
  const sheetId = '1zhIZk5t66I0prIntx5T9c0PS0yAA3wKyfcFXqNCPT0g';
  const gid = '0';
  
  try {
    // Step 1: Download Google Sheets as Excel
    const rows = await downloadAndParseGoogleSheets(sheetId, gid);
    
    if (rows.length === 0) {
      console.log('⚠️  No data parsed. This may be because:');
      console.log('   1. Excel MCP server is not connected');
      console.log('   2. Excel file format needs adjustment');
      console.log('   3. MCP functions need to be called directly\n');
      console.log('💡 For now, using manual data structure from create-wec2025-tournament-2-fixed.ts');
      return;
    }
    
    // Step 2: Create tournament
    const [tournament] = await db.insert(tournaments).values({
      name: 'WEC 2025 Milano #2 (MCP Import)',
      location: 'Milano',
      status: 'COMPLETED',
      totalRounds: 5,
      currentRound: 5,
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-05'),
    }).returning();
    
    console.log(`✅ Created tournament: ${tournament.name} (ID: ${tournament.id})\n`);
    
    // Step 3: Process spreadsheet data
    await processSpreadsheetData(rows, tournament.id);
    
    console.log(`\n${'='.repeat(60)}`);
    console.log('✅ TOURNAMENT CREATED FROM EXCEL/MCP!');
    console.log(`   Tournament ID: ${tournament.id}`);
    console.log('='.repeat(60));
    
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await sql.end();
  }
}

// Uncomment to run:
// importFromExcel();


