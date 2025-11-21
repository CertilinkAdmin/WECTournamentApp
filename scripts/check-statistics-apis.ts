#!/usr/bin/env bun

/**
 * API Health Check Script for Frontend Statistics Displays
 * 
 * This script checks all API endpoints used by frontend statistics displays
 * to ensure they're working correctly and returning expected data structures.
 */

interface ApiCheckResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'warning';
  statusCode?: number;
  responseTime?: number;
  error?: string;
  dataStructure?: {
    hasExpectedFields?: boolean;
    missingFields?: string[];
    dataType?: string;
    recordCount?: number;
  };
}

const BASE_URL = process.env.API_URL || process.env.PORT ? `http://localhost:${process.env.PORT}` : 'http://localhost:5000';

// Expected data structures for each endpoint
const EXPECTED_STRUCTURES: Record<string, {
  fields: string[];
  isArray?: boolean;
  minRecords?: number;
}> = {
  '/api/tournaments': {
    fields: ['id', 'name'],
    isArray: true,
  },
  '/api/tournaments/:id': {
    fields: ['tournament', 'matches', 'scores', 'detailedScores'],
    isArray: false,
  },
  '/api/tournaments/:id/matches': {
    fields: ['id', 'heatNumber', 'status', 'competitor1Id', 'competitor2Id'],
    isArray: true,
  },
  '/api/tournaments/:id/participants': {
    fields: ['id', 'userId', 'name'],
    isArray: true,
  },
  '/api/stations': {
    fields: ['id', 'name', 'status'],
    isArray: true,
  },
  '/api/users': {
    fields: ['id', 'name'],
    isArray: true,
  },
  '/api/persons': {
    fields: ['id', 'name'],
    isArray: true,
  },
  '/api/matches/:id/segments': {
    fields: ['id', 'matchId', 'code'],
    isArray: true,
  },
  '/api/admin/system-stats': {
    fields: ['uptime', 'memoryUsage', 'activeConnections'],
    isArray: false,
  },
};

async function checkEndpoint(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<ApiCheckResult> {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    const responseTime = Date.now() - startTime;
    
    let data: any;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      return {
        endpoint,
        method,
        status: 'error',
        statusCode: response.status,
        responseTime,
        error: `Non-JSON response: ${text.substring(0, 100)}`,
      };
    }
    
    if (!response.ok) {
      return {
        endpoint,
        method,
        status: 'error',
        statusCode: response.status,
        responseTime,
        error: data.error || `HTTP ${response.status}`,
      };
    }
    
    // Check data structure
    const expected = EXPECTED_STRUCTURES[endpoint.replace(/\d+/g, ':id')];
    let dataStructure: ApiCheckResult['dataStructure'] = undefined;
    
    if (expected) {
      const isArray = Array.isArray(data);
      const expectedIsArray = expected.isArray ?? false;
      
      if (isArray !== expectedIsArray) {
        dataStructure = {
          hasExpectedFields: false,
          dataType: isArray ? 'array' : 'object',
          error: `Expected ${expectedIsArray ? 'array' : 'object'}, got ${isArray ? 'array' : 'object'}`,
        };
      } else {
        const checkData = isArray ? (data[0] || {}) : data;
        const missingFields = expected.fields.filter(
          field => !(field in checkData)
        );
        
        dataStructure = {
          hasExpectedFields: missingFields.length === 0,
          missingFields: missingFields.length > 0 ? missingFields : undefined,
          dataType: isArray ? 'array' : 'object',
          recordCount: isArray ? data.length : undefined,
        };
        
        if (expected.minRecords && isArray && data.length < expected.minRecords) {
          dataStructure.error = `Expected at least ${expected.minRecords} records, got ${data.length}`;
        }
      }
    }
    
    return {
      endpoint,
      method,
      status: response.ok ? 'success' : 'error',
      statusCode: response.status,
      responseTime,
      dataStructure,
    };
  } catch (error: any) {
    return {
      endpoint,
      method,
      status: 'error',
      error: error.message || 'Network error',
    };
  }
}

async function getTournamentId(): Promise<number | null> {
  try {
    const response = await fetch(`${BASE_URL}/api/tournaments`);
    if (response.ok) {
      const tournaments = await response.json();
      if (Array.isArray(tournaments) && tournaments.length > 0) {
        return tournaments[0]?.id || null;
      }
    }
  } catch (error) {
    console.error('Failed to get tournament ID:', error);
  }
  return null;
}

async function getMatchId(tournamentId: number): Promise<number | null> {
  try {
    const matches = await fetch(`${BASE_URL}/api/tournaments/${tournamentId}/matches`)
      .then(r => r.json());
    return matches[0]?.id || null;
  } catch (error) {
    console.error('Failed to get match ID:', error);
  }
  return null;
}

async function main() {
  console.log('🔍 Checking API endpoints for frontend statistics displays...\n');
  console.log(`Base URL: ${BASE_URL}\n`);
  
  const results: ApiCheckResult[] = [];
  
  // Basic endpoints
  console.log('📊 Checking basic endpoints...');
  results.push(await checkEndpoint('/api/tournaments'));
  results.push(await checkEndpoint('/api/stations'));
  results.push(await checkEndpoint('/api/users'));
  results.push(await checkEndpoint('/api/persons'));
  results.push(await checkEndpoint('/api/admin/system-stats'));
  
  // Tournament-specific endpoints
  const tournamentId = await getTournamentId();
  if (tournamentId) {
    console.log(`\n🏆 Checking tournament endpoints (ID: ${tournamentId})...`);
    results.push(await checkEndpoint(`/api/tournaments/${tournamentId}`));
    results.push(await checkEndpoint(`/api/tournaments/${tournamentId}/matches`));
    results.push(await checkEndpoint(`/api/tournaments/${tournamentId}/participants`));
    
    // Match-specific endpoints
    const matchId = await getMatchId(tournamentId);
    if (matchId) {
      console.log(`\n🎯 Checking match endpoints (ID: ${matchId})...`);
      results.push(await checkEndpoint(`/api/matches/${matchId}/segments`));
    } else {
      console.log('\n⚠️  No matches found, skipping match-specific endpoints');
    }
  } else {
    console.log('\n⚠️  No tournament found, skipping tournament-specific endpoints');
  }
  
  // Print results
  console.log('\n' + '='.repeat(80));
  console.log('RESULTS SUMMARY');
  console.log('='.repeat(80) + '\n');
  
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const warningCount = results.filter(r => r.status === 'warning').length;
  
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log(`⚠️  Warnings: ${warningCount}\n`);
  
  // Detailed results
  for (const result of results) {
    const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
    console.log(`${icon} ${result.method} ${result.endpoint}`);
    
    if (result.statusCode) {
      console.log(`   Status: ${result.statusCode}`);
    }
    
    if (result.responseTime !== undefined) {
      console.log(`   Response Time: ${result.responseTime}ms`);
    }
    
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    
    if (result.dataStructure) {
      if (result.dataStructure.hasExpectedFields === false) {
        console.log(`   ⚠️  Missing fields: ${result.dataStructure.missingFields?.join(', ')}`);
      }
      if (result.dataStructure.recordCount !== undefined) {
        console.log(`   Records: ${result.dataStructure.recordCount}`);
      }
      if (result.dataStructure.error) {
        console.log(`   ⚠️  ${result.dataStructure.error}`);
      }
    }
    
    console.log('');
  }
  
  // Frontend component mapping
  console.log('\n' + '='.repeat(80));
  console.log('FRONTEND COMPONENT API USAGE');
  console.log('='.repeat(80) + '\n');
  
  const componentMapping: Record<string, string[]> = {
    'HeatResults.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id',
    ],
    'Standings.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id',
    ],
    'WEC2025Results.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id',
    ],
    'BaristaDetail.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id',
    ],
    'JudgeScorecardsResults.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id',
    ],
    'AdminDashboard.tsx': [
      '/api/admin/system-stats',
      '/api/persons',
      '/api/tournaments',
    ],
    'TournamentList.tsx': [
      '/api/tournaments/:id/matches',
      '/api/stations',
    ],
    'PublicDisplay.tsx': [
      '/api/tournaments',
      '/api/tournaments/:id/matches',
      '/api/users',
      '/api/stations',
      '/api/matches/:id/segments',
    ],
  };
  
  for (const [component, endpoints] of Object.entries(componentMapping)) {
    console.log(`📄 ${component}:`);
    for (const endpoint of endpoints) {
      const matchingResult = results.find(r => 
        endpoint.replace(':id', '\\d+').match(new RegExp('^' + r.endpoint.replace(/\d+/g, '\\d+') + '$'))
      );
      if (matchingResult) {
        const icon = matchingResult.status === 'success' ? '✅' : '❌';
        console.log(`   ${icon} ${endpoint}`);
      } else {
        console.log(`   ⚠️  ${endpoint} (not tested)`);
      }
    }
    console.log('');
  }
  
  // Exit with error code if any failures
  if (errorCount > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

