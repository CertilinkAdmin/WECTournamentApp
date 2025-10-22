#!/usr/bin/env node

async function printBracket() {
  try {
    console.log('🏆 TOURNAMENT BRACKET PRINT-OUT\n');
    console.log('=' .repeat(50));
    
    // Fetch tournaments
    console.log('📋 Fetching tournament data...');
    const tournamentsResponse = await fetch('http://localhost:5000/api/tournaments');
    const tournaments = await tournamentsResponse.json();
    
    if (tournaments.length === 0) {
      console.log('❌ No tournaments found. Please create a tournament first.');
      return;
    }
    
    const currentTournament = tournaments[0];
    console.log(`\n🎯 Current Tournament: ${currentTournament.name}`);
    console.log(`📅 Created: ${new Date(currentTournament.createdAt).toLocaleString()}`);
    console.log(`🏁 Status: ${currentTournament.status}`);
    console.log(`📊 Total Rounds: ${currentTournament.totalRounds || 5}`);
    
    // Fetch participants
    console.log('\n👥 Fetching participants...');
    const participantsResponse = await fetch(`http://localhost:5000/api/tournaments/${currentTournament.id}/participants`);
    const participants = await participantsResponse.json();
    
    console.log(`\n📊 PARTICIPANTS (${participants.length} total):`);
    console.log('-'.repeat(30));
    
    const baristas = participants.filter(p => p.role === 'BARISTA');
    const judges = participants.filter(p => p.role === 'JUDGE');
    const stationLeads = participants.filter(p => p.role === 'STATION_LEAD');
    
    console.log(`🥤 Baristas (Competitors): ${baristas.length}`);
    baristas.forEach((barista, index) => {
      console.log(`  ${index + 1}. ${barista.name} (ID: ${barista.id})`);
    });
    
    console.log(`\n⚖️  Judges: ${judges.length}`);
    judges.forEach((judge, index) => {
      console.log(`  ${index + 1}. ${judge.name} (ID: ${judge.id})`);
    });
    
    console.log(`\n🎛️  Station Leads: ${stationLeads.length}`);
    stationLeads.forEach((lead, index) => {
      console.log(`  ${index + 1}. ${lead.name} (ID: ${lead.id})`);
    });
    
    // Fetch matches
    console.log('\n🏆 Fetching bracket matches...');
    const matchesResponse = await fetch(`http://localhost:5000/api/tournaments/${currentTournament.id}/matches`);
    const matches = await matchesResponse.json();
    
    if (matches.length === 0) {
      console.log('❌ No matches found. Please generate the bracket first.');
      return;
    }
    
    console.log(`\n🏆 TOURNAMENT BRACKET (${matches.length} matches):`);
    console.log('=' .repeat(50));
    
    // Group matches by round
    const matchesByRound = matches.reduce((acc, match) => {
      if (!acc[match.round]) acc[match.round] = [];
      acc[match.round].push(match);
      return acc;
    }, {});
    
    // Sort matches within each round by heat number
    Object.keys(matchesByRound).forEach(round => {
      matchesByRound[round].sort((a, b) => a.heatNumber - b.heatNumber);
    });
    
    // Display each round
    Object.keys(matchesByRound).sort((a, b) => parseInt(a) - parseInt(b)).forEach(round => {
      const roundMatches = matchesByRound[round];
      console.log(`\n🥇 ROUND ${round} (${roundMatches.length} matches):`);
      console.log('-'.repeat(40));
      
      roundMatches.forEach(match => {
        const competitor1Name = baristas.find(b => b.id === match.competitor1Id)?.name || 'TBD';
        const competitor2Name = baristas.find(b => b.id === match.competitor2Id)?.name || 'TBD';
        const winnerName = baristas.find(b => b.id === match.winnerId)?.name || 'TBD';
        const stationName = match.stationId ? `Station ${String.fromCharCode(64 + match.stationId)}` : 'TBD';
        
        console.log(`  Heat ${match.heatNumber}: ${competitor1Name} vs ${competitor2Name}`);
        console.log(`    Station: ${stationName}`);
        console.log(`    Status: ${match.status}`);
        if (match.winnerId) {
          console.log(`    Winner: ${winnerName}`);
        }
        if (match.startTime) {
          console.log(`    Start: ${new Date(match.startTime).toLocaleString()}`);
        }
        if (match.endTime) {
          console.log(`    End: ${new Date(match.endTime).toLocaleString()}`);
        }
        console.log('');
      });
    });
    
    // Fetch stations
    console.log('\n🏢 Fetching stations...');
    const stationsResponse = await fetch('http://localhost:5000/api/stations');
    const stations = await stationsResponse.json();
    
    console.log(`\n🏢 STATIONS (${stations.length} total):`);
    console.log('-'.repeat(30));
    
    stations.forEach(station => {
      console.log(`  ${station.name}: ${station.description || 'No description'}`);
      console.log(`    Status: ${station.status}`);
      if (station.nextAvailableAt) {
        console.log(`    Next Available: ${new Date(station.nextAvailableAt).toLocaleString()}`);
      }
      console.log('');
    });
    
    // Summary statistics
    console.log('\n📊 BRACKET SUMMARY:');
    console.log('=' .repeat(30));
    console.log(`Total Matches: ${matches.length}`);
    console.log(`Total Competitors: ${baristas.length}`);
    console.log(`Total Judges: ${judges.length}`);
    console.log(`Total Stations: ${stations.length}`);
    
    const completedMatches = matches.filter(m => m.status === 'DONE').length;
    const runningMatches = matches.filter(m => m.status === 'RUNNING').length;
    const readyMatches = matches.filter(m => m.status === 'READY').length;
    
    console.log(`\nMatch Status:`);
    console.log(`  ✅ Completed: ${completedMatches}`);
    console.log(`  🔄 Running: ${runningMatches}`);
    console.log(`  ⏳ Ready: ${readyMatches}`);
    console.log(`  📋 Total: ${matches.length}`);
    
    console.log('\n🎉 Bracket print-out complete!');
    
  } catch (error) {
    console.error('❌ Error fetching bracket data:', error.message);
    console.log('\n💡 Make sure the server is running on port 5000');
    console.log('   Run: npm run dev');
  }
}

printBracket();
