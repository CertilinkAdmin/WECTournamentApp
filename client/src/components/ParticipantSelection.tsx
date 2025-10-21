import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  Trophy, 
  Coffee, 
  Search, 
  Plus, 
  X, 
  Shuffle,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MockParticipant {
  id: string;
  name: string;
  role: 'COMPETITOR' | 'BARISTA' | 'JUDGE';
  experience?: string;
  location?: string;
  specialty?: string;
}

interface ParticipantSelectionProps {
  onSelectionChange: (selected: {
    competitors: MockParticipant[];
    baristas: MockParticipant[];
    judges: MockParticipant[];
  }) => void;
  initialSelection?: {
    competitors: MockParticipant[];
    baristas: MockParticipant[];
    judges: MockParticipant[];
  };
}

// Mock data pools
const MOCK_COMPETITORS: MockParticipant[] = [
  { id: "comp-1", name: "Alex Chen", role: "COMPETITOR", experience: "5 years", location: "Seattle, WA", specialty: "Espresso" },
  { id: "comp-2", name: "Maria Rodriguez", role: "COMPETITOR", experience: "3 years", location: "Portland, OR", specialty: "Latte Art" },
  { id: "comp-3", name: "James Wilson", role: "COMPETITOR", experience: "7 years", location: "San Francisco, CA", specialty: "Pour Over" },
  { id: "comp-4", name: "Sarah Kim", role: "COMPETITOR", experience: "4 years", location: "Los Angeles, CA", specialty: "Cold Brew" },
  { id: "comp-5", name: "David Thompson", role: "COMPETITOR", experience: "6 years", location: "Austin, TX", specialty: "Cappuccino" },
  { id: "comp-6", name: "Emma Davis", role: "COMPETITOR", experience: "2 years", location: "Denver, CO", specialty: "Macchiato" },
  { id: "comp-7", name: "Michael Brown", role: "COMPETITOR", experience: "8 years", location: "Chicago, IL", specialty: "Americano" },
  { id: "comp-8", name: "Lisa Zhang", role: "COMPETITOR", experience: "5 years", location: "Boston, MA", specialty: "Mocha" },
  { id: "comp-9", name: "Ryan O'Connor", role: "COMPETITOR", experience: "3 years", location: "Miami, FL", specialty: "Flat White" },
  { id: "comp-10", name: "Jessica Lee", role: "COMPETITOR", experience: "4 years", location: "Phoenix, AZ", specialty: "Cortado" },
  { id: "comp-11", name: "Carlos Mendez", role: "COMPETITOR", experience: "6 years", location: "Dallas, TX", specialty: "Espresso" },
  { id: "comp-12", name: "Amanda Foster", role: "COMPETITOR", experience: "3 years", location: "Nashville, TN", specialty: "Latte Art" },
  { id: "comp-13", name: "Kevin Park", role: "COMPETITOR", experience: "7 years", location: "Minneapolis, MN", specialty: "Pour Over" },
  { id: "comp-14", name: "Rachel Green", role: "COMPETITOR", experience: "5 years", location: "Detroit, MI", specialty: "Cold Brew" },
  { id: "comp-15", name: "Tom Anderson", role: "COMPETITOR", experience: "4 years", location: "Cleveland, OH", specialty: "Cappuccino" },
  { id: "comp-16", name: "Nina Patel", role: "COMPETITOR", experience: "6 years", location: "Tampa, FL", specialty: "Macchiato" },
];

const MOCK_BARISTAS: MockParticipant[] = [
  { id: "bar-1", name: "Sophie Martinez", role: "BARISTA", experience: "10 years", location: "Seattle, WA", specialty: "Training" },
  { id: "bar-2", name: "Marcus Johnson", role: "BARISTA", experience: "8 years", location: "Portland, OR", specialty: "Competition Prep" },
  { id: "bar-3", name: "Elena Rodriguez", role: "BARISTA", experience: "12 years", location: "San Francisco, CA", specialty: "Latte Art" },
  { id: "bar-4", name: "Daniel Kim", role: "BARISTA", experience: "9 years", location: "Los Angeles, CA", specialty: "Espresso" },
  { id: "bar-5", name: "Isabella Chen", role: "BARISTA", experience: "7 years", location: "Austin, TX", specialty: "Pour Over" },
  { id: "bar-6", name: "Lucas Williams", role: "BARISTA", experience: "11 years", location: "Denver, CO", specialty: "Cold Brew" },
  { id: "bar-7", name: "Olivia Davis", role: "BARISTA", experience: "6 years", location: "Chicago, IL", specialty: "Cappuccino" },
  { id: "bar-8", name: "Noah Thompson", role: "BARISTA", experience: "13 years", location: "Boston, MA", specialty: "Training" },
];

const MOCK_JUDGES: MockParticipant[] = [
  { id: "judge-1", name: "Dr. Robert Smith", role: "JUDGE", experience: "15 years", location: "Seattle, WA", specialty: "Coffee Science" },
  { id: "judge-2", name: "Prof. Maria Garcia", role: "JUDGE", experience: "18 years", location: "Portland, OR", specialty: "Sensory Analysis" },
  { id: "judge-3", name: "Master James Wilson", role: "JUDGE", experience: "20 years", location: "San Francisco, CA", specialty: "Competition Rules" },
  { id: "judge-4", name: "Expert Sarah Johnson", role: "JUDGE", experience: "16 years", location: "Los Angeles, CA", specialty: "Latte Art" },
  { id: "judge-5", name: "Judge Michael Brown", role: "JUDGE", experience: "14 years", location: "Austin, TX", specialty: "Espresso" },
  { id: "judge-6", name: "Chief Lisa Davis", role: "JUDGE", experience: "17 years", location: "Denver, CO", specialty: "Pour Over" },
];

export default function ParticipantSelection({ onSelectionChange, initialSelection }: ParticipantSelectionProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompetitors, setSelectedCompetitors] = useState<MockParticipant[]>(initialSelection?.competitors || []);
  const [selectedBaristas, setSelectedBaristas] = useState<MockParticipant[]>(initialSelection?.baristas || []);
  const [selectedJudges, setSelectedJudges] = useState<MockParticipant[]>(initialSelection?.judges || []);

  // Filter participants based on search term
  const filteredCompetitors = MOCK_COMPETITORS.filter(comp => 
    comp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredBaristas = MOCK_BARISTAS.filter(bar => 
    bar.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bar.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bar.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredJudges = MOCK_JUDGES.filter(judge => 
    judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.specialty?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    judge.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleParticipantToggle = (participant: MockParticipant, type: 'competitor' | 'barista' | 'judge') => {
    const isSelected = (type === 'competitor' ? selectedCompetitors : 
                       type === 'barista' ? selectedBaristas : 
                       selectedJudges).some(p => p.id === participant.id);

    if (isSelected) {
      // Remove participant
      if (type === 'competitor') {
        setSelectedCompetitors(prev => prev.filter(p => p.id !== participant.id));
      } else if (type === 'barista') {
        setSelectedBaristas(prev => prev.filter(p => p.id !== participant.id));
      } else {
        setSelectedJudges(prev => prev.filter(p => p.id !== participant.id));
      }
    } else {
      // Add participant
      if (type === 'competitor') {
        setSelectedCompetitors(prev => [...prev, participant]);
      } else if (type === 'barista') {
        setSelectedBaristas(prev => [...prev, participant]);
      } else {
        setSelectedJudges(prev => [...prev, participant]);
      }
    }
  };

  const handleRandomize = () => {
    // Randomly select 16 competitors, 4 baristas, and 3 judges
    const shuffledCompetitors = [...MOCK_COMPETITORS].sort(() => Math.random() - 0.5);
    const shuffledBaristas = [...MOCK_BARISTAS].sort(() => Math.random() - 0.5);
    const shuffledJudges = [...MOCK_JUDGES].sort(() => Math.random() - 0.5);

    setSelectedCompetitors(shuffledCompetitors.slice(0, 16));
    setSelectedBaristas(shuffledBaristas.slice(0, 4));
    setSelectedJudges(shuffledJudges.slice(0, 3));

    toast({
      title: "Participants Randomized",
      description: "Random selection of participants has been applied.",
    });
  };

  const handleClearAll = () => {
    setSelectedCompetitors([]);
    setSelectedBaristas([]);
    setSelectedJudges([]);
    
    toast({
      title: "Selection Cleared",
      description: "All participant selections have been cleared.",
    });
  };

  // Notify parent component of selection changes
  useEffect(() => {
    onSelectionChange({
      competitors: selectedCompetitors,
      baristas: selectedBaristas,
      judges: selectedJudges,
    });
  }, [selectedCompetitors, selectedBaristas, selectedJudges, onSelectionChange]);

  const renderParticipantCard = (participant: MockParticipant, type: 'competitor' | 'barista' | 'judge') => {
    const isSelected = (type === 'competitor' ? selectedCompetitors : 
                       type === 'barista' ? selectedBaristas : 
                       selectedJudges).some(p => p.id === participant.id);

    return (
      <Card 
        key={participant.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
        }`}
        onClick={() => handleParticipantToggle(participant, type)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Checkbox checked={isSelected} readOnly />
                <h4 className="font-medium">{participant.name}</h4>
                {isSelected && <CheckCircle2 className="h-4 w-4 text-primary" />}
              </div>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p><strong>Experience:</strong> {participant.experience}</p>
                <p><strong>Location:</strong> {participant.location}</p>
                <p><strong>Specialty:</strong> {participant.specialty}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participant Selection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Participants</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name, specialty, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRandomize}>
                <Shuffle className="h-4 w-4 mr-2" />
                Randomize
              </Button>
              <Button variant="outline" onClick={handleClearAll}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </div>
          
          {/* Selection Summary */}
          <div className="flex gap-4 text-sm">
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {selectedCompetitors.length} Competitors
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Coffee className="h-3 w-3" />
              {selectedBaristas.length} Baristas
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              {selectedJudges.length} Judges
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Competitors Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Competitors ({selectedCompetitors.length}/16 selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCompetitors.map(participant => 
              renderParticipantCard(participant, 'competitor')
            )}
          </div>
          {filteredCompetitors.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No competitors found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Baristas Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coffee className="h-5 w-5" />
            Baristas ({selectedBaristas.length}/8 selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredBaristas.map(participant => 
              renderParticipantCard(participant, 'barista')
            )}
          </div>
          {filteredBaristas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No baristas found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Judges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Judges ({selectedJudges.length}/6 selected)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJudges.map(participant => 
              renderParticipantCard(participant, 'judge')
            )}
          </div>
          {filteredJudges.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No judges found matching your search.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Messages */}
      {selectedCompetitors.length < 16 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span>Please select 16 competitors for the tournament.</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedBaristas.length < 4 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span>Please select at least 4 baristas for the tournament.</span>
            </div>
          </CardContent>
        </Card>
      )}
      
      {selectedJudges.length < 3 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-800">
              <AlertCircle className="h-4 w-4" />
              <span>Please select at least 3 judges for the tournament.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
