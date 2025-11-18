import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar, Trophy, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import AppHeader from '../../components/AppHeader';
import { extractTournamentSlug } from '@/utils/tournamentUtils';
import { Button } from '@/components/ui/button';

interface Tournament {
  id: number;
  name: string;
  status: 'SETUP' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: string | null;
  endDate: string | null;
  totalRounds: number;
  currentRound: number;
}

interface Match {
  id: number;
  tournamentId: number;
  round: number;
  heatNumber: number;
  status: 'PENDING' | 'READY' | 'RUNNING' | 'DONE';
}

export default function ResultsTournamentList() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const { data: tournaments, isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    refetchInterval: 10000, // Poll every 10s for live results
  });

  // Filter tournaments - only show completed tournaments
  const completedTournaments = useMemo(() => {
    return tournaments?.filter(t => t.status === 'COMPLETED') || [];
  }, [tournaments]);

  // Filter tournaments by search query
  const filteredTournaments = useMemo(() => {
    if (!searchQuery.trim()) {
      return completedTournaments;
    }
    
    const query = searchQuery.toLowerCase();
    return completedTournaments.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.id.toString().includes(query)
    );
  }, [completedTournaments, searchQuery]);

  const getShortName = (name: string): string => {
    if (name.includes('Milano')) return "WEC'25 Milano";
    if (name.includes('Panama')) return "WEC'26 Panama";
    return name.replace(' Espresso Championship', '').replace('2026 ', '');
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    const slug = extractTournamentSlug(tournament.name);
    if (slug) {
      // Navigate to overview page which shows rounds cards
      navigate(`/results/${slug}`);
    } else {
      // Fallback: For WEC 2025 Milano, use WEC2025 slug
      if (tournament.name.includes('2025') && tournament.name.toLowerCase().includes('milano')) {
        navigate(`/results/WEC2025`);
      } else {
        // Fallback to WEC2025 if slug can't be extracted
        navigate(`/results/WEC2025`);
      }
    }
    setDropdownOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      
      {/* Page Title */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6" />
            <h1 className="text-2xl font-bold">Results</h1>
          </div>
          <p className="text-primary-foreground/80 text-sm">
            Search and select a completed tournament to view its bracket
          </p>
        </div>
      </div>

      {/* Search and Dropdown */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search tournaments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Tournament Dropdown */}
          <Popover open={dropdownOpen} onOpenChange={setDropdownOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={dropdownOpen}
                className="w-full justify-between"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {searchQuery ? `Searching: "${searchQuery}"` : 'Select a tournament...'}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput 
                  placeholder="Search tournaments..." 
                  value={searchQuery} 
                  onValueChange={setSearchQuery} 
                />
                <CommandList>
                  <CommandEmpty>
                    {completedTournaments.length === 0 
                      ? 'No completed tournaments available'
                      : 'No tournaments found matching your search'
                    }
                  </CommandEmpty>
                  <CommandGroup>
                    {filteredTournaments.map((tournament) => (
                      <CommandItem
                        key={tournament.id}
                        value={tournament.name}
                        onSelect={() => handleTournamentSelect(tournament)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col gap-1 flex-1 w-full">
                          <div className="flex items-center gap-2">
                            <Trophy className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="font-semibold flex-1">{tournament.name}</span>
                            <Badge variant="secondary" className="ml-auto flex-shrink-0">Completed</Badge>
                          </div>
                          {tournament.startDate && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-6">
                              <Calendar className="h-3 w-3 flex-shrink-0" />
                              <span>
                                {format(new Date(tournament.startDate), 'MMMM d, yyyy')}
                                {tournament.endDate && 
                                  ` - ${format(new Date(tournament.endDate), 'MMMM d, yyyy')}`
                                }
                              </span>
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {/* Info Card */}
          {completedTournaments.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No completed tournaments</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Completed tournaments will appear here once tournaments are finished
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

