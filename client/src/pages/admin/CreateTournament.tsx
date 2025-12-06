import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trophy, MapPin, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import type { Tournament } from '@shared/schema';

export default function CreateTournament() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    startDate: '',
    endDate: '',
    totalRounds: 5,
    enabledStations: ['A', 'B', 'C'] as string[],
  });

  const createTournamentMutation = useMutation({
    mutationFn: async (tournamentData: Partial<Tournament>) => {
      const response = await fetch('/api/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: tournamentData.name,
          location: tournamentData.location || null,
          status: 'SETUP',
          startDate: tournamentData.startDate ? new Date(tournamentData.startDate).toISOString() : null,
          endDate: tournamentData.endDate ? new Date(tournamentData.endDate).toISOString() : null,
          totalRounds: tournamentData.totalRounds || 5,
          currentRound: 1,
          enabledStations: formData.enabledStations,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create tournament');
      }
      
      return response.json();
    },
    onSuccess: (data: Tournament) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: 'Tournament Created',
        description: `${data.name} has been created and is now available for registration.`,
      });
      navigate('/admin/tournaments');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Tournament name is required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.enabledStations.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'At least one station must be enabled',
        variant: 'destructive',
      });
      return;
    }

    createTournamentMutation.mutate(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin/tournaments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Create Tournament</h1>
              <p className="text-muted-foreground mt-1">
                Set up a new tournament and make it available for member registration
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Details</CardTitle>
            <CardDescription>
              Fill in the tournament information. Once created, members can register as baristas or judges.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tournament Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Tournament Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="e.g., World Espresso Championships 2025 Milano"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  className="text-lg"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a descriptive name for the tournament
                </p>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  placeholder="e.g., Milano, Italy"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  City and country where the tournament will take place
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    When the tournament begins
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    End Date
                  </Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={formData.startDate || undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    When the tournament concludes
                  </p>
                </div>
              </div>

              {/* Total Rounds */}
              <div className="space-y-2">
                <Label htmlFor="totalRounds">
                  Total Rounds
                </Label>
                <Input
                  id="totalRounds"
                  type="number"
                  min="1"
                  max="10"
                  value={formData.totalRounds}
                  onChange={(e) => handleChange('totalRounds', parseInt(e.target.value) || 5)}
                />
                <p className="text-xs text-muted-foreground">
                  Number of rounds in the tournament bracket (default: 5)
                </p>
              </div>

              {/* Station Selection */}
              <div className="space-y-2">
                <Label>
                  Enabled Stations <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-4">
                  {['A', 'B', 'C'].map((station) => (
                    <label key={station} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledStations.includes(station)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({
                              ...prev,
                              enabledStations: [...prev.enabledStations, station].sort(),
                            }));
                          } else {
                            if (formData.enabledStations.length > 1) {
                              setFormData(prev => ({
                                ...prev,
                                enabledStations: prev.enabledStations.filter(s => s !== station),
                              }));
                            } else {
                              toast({
                                title: 'Validation Error',
                                description: 'At least one station must be enabled',
                                variant: 'destructive',
                              });
                            }
                          }
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium">Station {station}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which stations will be used for this tournament. At least one station is required.
                </p>
              </div>

              {/* Info Box */}
              <div className="bg-muted/50 border border-primary/20 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-primary" />
                  What happens next?
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Tournament will be created with status "SETUP"</li>
                  <li>Members can register as baristas or judges from the Tournaments page</li>
                  <li>You can manage registrations in Admin → Baristas/Judges</li>
                  <li>Once ready, you can randomize seeds and generate the bracket</li>
                </ul>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/tournaments')}
                  disabled={createTournamentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createTournamentMutation.isPending || !formData.name.trim()}
                  className="min-w-[140px]"
                >
                  {createTournamentMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-4 w-4 mr-2" />
                      Create Tournament
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

