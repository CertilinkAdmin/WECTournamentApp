import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  Activity, Users, Database, Pause, Play, Trash2, Plus, 
  Image, Settings, AlertTriangle, CheckCircle2, XCircle,
  Server, Cpu, HardDrive, Wifi, Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import './AdminDashboard.css';

interface SystemStats {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
  databaseSize: number;
}

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  approved: boolean;
  createdAt: string;
}

interface Tournament {
  id: number;
  name: string;
  status: string;
  isPaused?: boolean;
}

const AdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [systemStats, setSystemStats] = useState<SystemStats>({
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    activeConnections: 0,
    databaseSize: 0
  });

  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/persons'],
  });

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch scorecard lock status
  const { data: scorecardLockStatus } = useQuery<{ locked: boolean }>({
    queryKey: ['/api/admin/scorecard-lock'],
    refetchInterval: 2000, // Check every 2 seconds
  });
  const scorecardLocked = scorecardLockStatus?.locked ?? false;

  // Mutation to update scorecard lock status
  const updateScorecardLockMutation = useMutation({
    mutationFn: async (locked: boolean) => {
      const response = await fetch('/api/admin/scorecard-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked }),
      });
      if (!response.ok) {
        throw new Error('Failed to update scorecard lock status');
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/admin/scorecard-lock'], data);
      toast({
        title: data.locked ? 'Scorecards Locked' : 'Scorecards Unlocked',
        description: data.locked 
          ? 'Scorecard editing is now disabled' 
          : 'Judges can now edit scorecards',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Fetch photo carousel images
  const { data: carouselImages = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/carousel'],
    queryFn: async () => {
      // For now, return the static config - later this will come from API
      const { wecPhotoAlbum } = await import('@/config/photoAlbum');
      return wecPhotoAlbum;
    },
  });

  // System monitoring refresh
  useEffect(() => {
    const fetchSystemStats = async () => {
      try {
        const response = await fetch('/api/admin/system-stats');
        if (response.ok) {
          const stats = await response.json();
          setSystemStats(stats);
        }
      } catch (error) {
        console.error('Error fetching system stats:', error);
      }
    };

    fetchSystemStats();
    const interval = setInterval(fetchSystemStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // User management mutations
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/persons`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userId, deleted: true }),
      });
      if (!response.ok) throw new Error('Failed to delete user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      toast({
        title: 'User deleted',
        description: 'User has been successfully deleted.',
      });
    },
  });

  // Tournament pause mutation
  const pauseTournamentMutation = useMutation({
    mutationFn: async ({ tournamentId, paused }: { tournamentId: number; paused: boolean }) => {
      const response = await fetch(`/api/admin/tournaments/${tournamentId}/pause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paused }),
      });
      if (!response.ok) throw new Error('Failed to pause tournament');
      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: variables.paused ? 'Tournament paused' : 'Tournament resumed',
        description: `Tournament has been ${variables.paused ? 'paused' : 'resumed'}.`,
      });
    },
  });

  // Photo carousel management
  const addCarouselImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch('/api/admin/carousel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to add image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousel'] });
      toast({
        title: 'Image added',
        description: 'Image has been added to the carousel.',
      });
    },
  });

  const removeCarouselImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await fetch('/api/admin/carousel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      });
      if (!response.ok) throw new Error('Failed to remove image');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/carousel'] });
      toast({
        title: 'Image removed',
        description: 'Image has been removed from the carousel.',
      });
    },
  });

  const [newImageUrl, setNewImageUrl] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('BARISTA');

  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter an image URL',
        variant: 'destructive',
      });
      return;
    }
    addCarouselImageMutation.mutate(newImageUrl);
    setNewImageUrl('');
  };

  const handleAddUser = async () => {
    if (!newUserName.trim() || !newUserEmail.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/persons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
        }),
      });

      if (!response.ok) throw new Error('Failed to create user');

      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      toast({
        title: 'User created',
        description: 'User has been successfully created.',
      });
      setNewUserName('');
      setNewUserEmail('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Full system control and monitoring</p>
        </div>

        <Tabs defaultValue="monitoring" className="w-full">
          <div className="relative mb-6">
            <TabsList className="relative flex flex-wrap gap-2 h-auto p-2 bg-muted/30 rounded-lg border border-border/50">
              <TabsTrigger 
                value="monitoring" 
                className="relative flex items-center gap-2 px-4 py-2.5 z-[5] transform transition-all hover:scale-105 data-[state=active]:z-[6] data-[state=active]:shadow-lg"
                style={{ transform: 'translateY(0px)' }}
              >
                <Activity className="h-4 w-4" />
                <span>Monitoring</span>
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="relative flex items-center gap-2 px-4 py-2.5 z-[4] transform transition-all hover:scale-105 data-[state=active]:z-[6] data-[state=active]:shadow-lg"
                style={{ transform: 'translateY(2px)' }}
              >
                <Users className="h-4 w-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger 
                value="tournaments" 
                className="relative flex items-center gap-2 px-4 py-2.5 z-[3] transform transition-all hover:scale-105 data-[state=active]:z-[6] data-[state=active]:shadow-lg"
                style={{ transform: 'translateY(4px)' }}
              >
                <Settings className="h-4 w-4" />
                <span>Tournaments</span>
              </TabsTrigger>
              <TabsTrigger 
                value="database" 
                className="relative flex items-center gap-2 px-4 py-2.5 z-[2] transform transition-all hover:scale-105 data-[state=active]:z-[6] data-[state=active]:shadow-lg"
                style={{ transform: 'translateY(6px)' }}
              >
                <Database className="h-4 w-4" />
                <span>Database</span>
              </TabsTrigger>
              <TabsTrigger 
                value="carousel" 
                className="relative flex items-center gap-2 px-4 py-2.5 z-[1] transform transition-all hover:scale-105 data-[state=active]:z-[6] data-[state=active]:shadow-lg"
                style={{ transform: 'translateY(8px)' }}
              >
                <Image className="h-4 w-4" />
                <span>Carousel</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">System Uptime</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatUptime(systemStats.uptime)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Server running time</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.memoryUsage.toFixed(1)}%</div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemStats.memoryUsage > 80 ? 'bg-red-500' : 
                        systemStats.memoryUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${systemStats.memoryUsage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.cpuUsage.toFixed(1)}%</div>
                  <div className="w-full bg-secondary rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full ${
                        systemStats.cpuUsage > 80 ? 'bg-red-500' : 
                        systemStats.cpuUsage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${systemStats.cpuUsage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
                  <Wifi className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStats.activeConnections}</div>
                  <p className="text-xs text-muted-foreground mt-1">WebSocket connections</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Database Size</div>
                    <div className="text-lg font-semibold">{formatBytes(systemStats.databaseSize)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Users</div>
                    <div className="text-lg font-semibold">{users.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Total Tournaments</div>
                    <div className="text-lg font-semibold">{tournaments.length}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Active Tournaments</div>
                    <div className="text-lg font-semibold">
                      {tournaments.filter(t => t.status === 'ACTIVE').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="user-name">Name</Label>
                    <Input
                      id="user-name"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddUser} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Create User
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>All Users ({users.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usersLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No users found</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">ID</th>
                            <th className="text-left p-2">Name</th>
                            <th className="text-left p-2">Email</th>
                            <th className="text-left p-2">Role</th>
                            <th className="text-left p-2">Status</th>
                            <th className="text-left p-2">Created</th>
                            <th className="text-right p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
                            <tr key={user.id} className="border-b hover:bg-secondary/50">
                              <td className="p-2">{user.id}</td>
                              <td className="p-2 font-medium">{user.name}</td>
                              <td className="p-2 text-sm text-muted-foreground">{user.email}</td>
                              <td className="p-2">
                                <Badge variant="outline">{user.role || 'N/A'}</Badge>
                              </td>
                              <td className="p-2">
                                {user.approved ? (
                                  <Badge variant="default" className="bg-green-500">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Approved
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </td>
                              <td className="p-2 text-sm text-muted-foreground">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-2">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                      if (confirm(`Delete user ${user.name}?`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tournaments Tab */}
          <TabsContent value="tournaments" className="space-y-4 mt-6">
            {/* Scorecard Lock Toggle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Scorecard Controls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/30">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="scorecard-lock" className="text-base font-semibold">
                      Judge Scorecard Editing
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {scorecardLocked ? 'Scorecards are locked - editing disabled' : 'Scorecards are unlocked - editing enabled'}
                    </p>
                  </div>
                  <Switch
                    id="scorecard-lock"
                    checked={!scorecardLocked}
                    disabled={updateScorecardLockMutation.isPending}
                    onCheckedChange={(checked) => {
                      updateScorecardLockMutation.mutate(!checked);
                    }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tournament Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournamentsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tournaments...</div>
                  ) : tournaments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tournaments found</div>
                  ) : (
                    tournaments.map((tournament) => (
                      <div
                        key={tournament.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <h3 className="font-semibold">{tournament.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={tournament.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {tournament.status}
                            </Badge>
                            {tournament.isPaused && (
                              <Badge variant="destructive">Paused</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`pause-${tournament.id}`}>Pause</Label>
                            <Switch
                              id={`pause-${tournament.id}`}
                              checked={tournament.isPaused || false}
                              onCheckedChange={(checked) => {
                                pauseTournamentMutation.mutate({
                                  tournamentId: tournament.id,
                                  paused: checked,
                                });
                              }}
                            />
                          </div>
                          {tournament.status === 'ACTIVE' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                pauseTournamentMutation.mutate({
                                  tournamentId: tournament.id,
                                  paused: !tournament.isPaused,
                                });
                              }}
                            >
                              {tournament.isPaused ? (
                                <>
                                  <Play className="h-4 w-4 mr-2" />
                                  Resume
                                </>
                              ) : (
                                <>
                                  <Pause className="h-4 w-4 mr-2" />
                                  Pause
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Operations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-auto flex-col items-start p-4">
                    <div className="font-semibold mb-1">Backup Database</div>
                    <div className="text-sm text-muted-foreground">Create a full database backup</div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4">
                    <div className="font-semibold mb-1">Optimize Tables</div>
                    <div className="text-sm text-muted-foreground">Run VACUUM and ANALYZE</div>
                  </Button>
                  <Button variant="outline" className="h-auto flex-col items-start p-4">
                    <div className="font-semibold mb-1">Clear Cache</div>
                    <div className="text-sm text-muted-foreground">Clear application cache</div>
                  </Button>
                  <Button variant="destructive" className="h-auto flex-col items-start p-4">
                    <div className="font-semibold mb-1">Reset Test Data</div>
                    <div className="text-sm text-muted-foreground">Clear all test tournament data</div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Database Tables</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['persons', 'tournaments', 'tournament_registrations', 'matches', 'heat_scores', 'stations'].map((table) => (
                    <div key={table} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{table}</div>
                        <div className="text-sm text-muted-foreground">View table structure</div>
                      </div>
                      <Button variant="outline" size="sm">
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Carousel Tab */}
          <TabsContent value="carousel" className="space-y-4 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Photo Carousel Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="image-url">Add Image URL</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="image-url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="https://example.com/image.jpg or /images/carousel/image.jpg"
                      className="flex-1"
                    />
                    <Button onClick={handleAddImage} disabled={addCarouselImageMutation.isPending}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    You can use external URLs or local paths (e.g., /images/carousel/photo.jpg)
                  </p>
                </div>

                <div>
                  <Label>Current Carousel Images ({carouselImages.length})</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                    {carouselImages.map((imageUrl, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-video bg-secondary rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Carousel image ${index + 1}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.jpg';
                            }}
                          />
                        </div>
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              if (confirm('Remove this image from the carousel?')) {
                                removeCarouselImageMutation.mutate(imageUrl);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 text-xs text-muted-foreground truncate">
                          {imageUrl.length > 30 ? `${imageUrl.substring(0, 30)}...` : imageUrl}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
