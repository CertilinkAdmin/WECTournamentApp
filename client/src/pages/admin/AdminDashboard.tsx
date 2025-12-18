import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToastAction } from '@/components/ui/toast';
import { 
  Activity, Users, Database, Pause, Play, Trash2, Plus, 
  Image, Settings, AlertTriangle, CheckCircle2, XCircle,
  Server, Cpu, HardDrive, Wifi, Clock, Loader2, Eye, UserPlus, Shield, Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import './AdminDashboard.css';

// Table Data Viewer Component
const TableDataViewer: React.FC<{ tableName: string }> = ({ tableName }) => {
  const [page, setPage] = useState(1);
  const limit = 50;

  const { data, isLoading } = useQuery<{
    tableName: string;
    columns: Array<{ column_name: string; data_type: string }>;
    data: any[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }>({
    queryKey: ['/api/admin/database/tables', tableName, page],
    queryFn: async () => {
      const response = await fetch(`/api/admin/database/tables/${tableName}?page=${page}&limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch table data');
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="text-center p-4">Loading table data...</div>;
  }

  if (!data) {
    return <div className="text-center p-4 text-destructive">Failed to load table data</div>;
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-muted">
              {data.columns.map((col) => (
                <th key={col.column_name} className="border p-2 text-left font-semibold">
                  {col.column_name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.data.length === 0 ? (
              <tr>
                <td colSpan={data.columns.length} className="text-center p-4 text-muted-foreground">
                  No data found
                </td>
              </tr>
            ) : (
              data.data.map((row, idx) => (
                <tr key={idx} className="border-b">
                  {data.columns.map((col) => (
                    <td key={col.column_name} className="border p-2 text-sm">
                      {row[col.column_name] !== null && row[col.column_name] !== undefined
                        ? String(row[col.column_name])
                        : 'NULL'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {data.pagination.page} of {data.pagination.totalPages} pages ({data.pagination.total} total rows)
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page >= data.pagination.totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
};

// Test Tournament Form Component
const TestTournamentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [tournamentName, setTournamentName] = useState('Test Tournament');
  const [numBaristas, setNumBaristas] = useState(16);
  const [numJudges, setNumJudges] = useState(9);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (numBaristas < 2 || numBaristas > 64) {
      toast({
        title: 'Invalid Input',
        description: 'Number of baristas must be between 2 and 64',
        variant: 'destructive',
      });
      return;
    }

    if (numJudges < 1 || numJudges > 20) {
      toast({
        title: 'Invalid Input',
        description: 'Number of judges must be between 1 and 20',
        variant: 'destructive',
      });
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/seed-test-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tournamentName,
          numBaristas,
          numJudges
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        onSuccess();
        toast({
          title: 'Tournament Landscape Initiated',
          description: 'Tournament landscape has been initiated. Proceed to the tournaments page to continue setup.',
          action: (
            <ToastAction 
              altText="Go to tournaments" 
              onClick={() => navigate('/admin/tournaments')}
              className="flex items-center gap-2"
            >
              <Trophy className="h-4 w-4" />
              Go to Tournies
            </ToastAction>
          ),
        });
        // Reset form
        setTournamentName('Test Tournament');
        setNumBaristas(16);
        setNumJudges(9);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create test data');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tournament-name">Tournament Name</Label>
          <Input
            id="tournament-name"
            value={tournamentName}
            onChange={(e) => setTournamentName(e.target.value)}
            placeholder="Test Tournament"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="num-baristas">
            Number of Baristas
            <span className="text-xs text-muted-foreground ml-2">(2-64)</span>
          </Label>
          <Input
            id="num-baristas"
            type="number"
            min="2"
            max="64"
            value={numBaristas}
            onChange={(e) => setNumBaristas(parseInt(e.target.value) || 16)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="num-judges">
            Number of Judges
            <span className="text-xs text-muted-foreground ml-2">(1-20)</span>
          </Label>
          <Input
            id="num-judges"
            type="number"
            min="1"
            max="20"
            value={numJudges}
            onChange={(e) => setNumJudges(parseInt(e.target.value) || 9)}
          />
        </div>
      </div>
      
      <Button
        onClick={handleCreate}
        disabled={isCreating || !tournamentName.trim()}
        className="w-full"
      >
        {isCreating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Test Tournament...
          </>
        ) : (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Create Test Tournament
          </>
        )}
      </Button>
      
      <p className="text-xs text-muted-foreground">
        💡 Test tournaments are automatically marked and isolated from real tournament data.
        All test users have unique emails to prevent conflicts.
      </p>
    </div>
  );
};

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

  // Fetch database tables
  const { data: dbTables = { tables: [] }, isLoading: tablesLoading } = useQuery<{ tables: Array<{ name: string; rowCount: number }> }>({
    queryKey: ['/api/admin/database/tables'],
    queryFn: async () => {
      const response = await fetch('/api/admin/database/tables');
      if (!response.ok) throw new Error('Failed to fetch tables');
      return response.json();
    },
  });

  // State for user management
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<'ADMIN' | 'JUDGE' | 'BARISTA' | 'STATION_LEAD' | 'PUBLIC'>('BARISTA');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  // Fetch tournaments
  const { data: tournaments = [], isLoading: tournamentsLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
  });

  // Fetch pause states for tournaments
  const { data: pauseStates = {} } = useQuery<Record<number, boolean>>({
    queryKey: ['/api/admin/tournaments/pause-states'],
    enabled: tournaments.length > 0,
  });

  // Fetch photo carousel images
  const { data: carouselImages = [] } = useQuery<string[]>({
    queryKey: ['/api/admin/carousel'],
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
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
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

  const createUserMutation = useMutation({
    mutationFn: async (userData: { name: string; email: string; role: string }) => {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error('Failed to create user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      setShowAddUserDialog(false);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserRole('BARISTA');
      toast({
        title: 'User created',
        description: 'User has been successfully created.',
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (!response.ok) throw new Error('Failed to update user role');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      toast({
        title: 'Role updated',
        description: 'User role has been successfully updated.',
      });
    },
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to approve user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      toast({
        title: 'User approved',
        description: 'User has been successfully approved.',
      });
    },
  });

  const rejectUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch(`/api/admin/users/${userId}/reject`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reject user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/persons'] });
      toast({
        title: 'User rejected',
        description: 'User has been rejected.',
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tournaments/pause-states'] });
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
      <div className="max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1600px] mx-auto px-4 lg:px-6 xl:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Full system control and monitoring</p>
        </div>

        <Tabs defaultValue="monitoring" className="w-full">
          <div className="relative mb-6">
            <TabsList className="relative flex flex-wrap gap-2 h-auto p-2 bg-muted/50 dark:bg-muted/30 rounded-lg border border-border/70 dark:border-border/50">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-4 lg:gap-6">
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

              <Card className="border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 dark:bg-transparent rounded-t-lg">
                  <CardTitle className="text-sm font-medium text-primary dark:text-foreground">Memory Usage</CardTitle>
                  <HardDrive className="h-4 w-4 text-primary/70 dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary dark:text-foreground">{systemStats.memoryUsage.toFixed(1)}%</div>
                  <div className="w-full bg-secondary/60 dark:bg-secondary rounded-full h-2 mt-2 border border-secondary/40">
                    <div 
                      className={`h-2 rounded-full ${
                        systemStats.memoryUsage > 80 ? 'bg-red-600 dark:bg-red-500' : 
                        systemStats.memoryUsage > 60 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500'
                      }`}
                      style={{ width: `${systemStats.memoryUsage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 dark:bg-transparent rounded-t-lg">
                  <CardTitle className="text-sm font-medium text-primary dark:text-foreground">CPU Usage</CardTitle>
                  <Cpu className="h-4 w-4 text-primary/70 dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary dark:text-foreground">{systemStats.cpuUsage.toFixed(1)}%</div>
                  <div className="w-full bg-secondary/60 dark:bg-secondary rounded-full h-2 mt-2 border border-secondary/40">
                    <div 
                      className={`h-2 rounded-full ${
                        systemStats.cpuUsage > 80 ? 'bg-red-600 dark:bg-red-500' : 
                        systemStats.cpuUsage > 60 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-green-600 dark:bg-green-500'
                      }`}
                      style={{ width: `${systemStats.cpuUsage}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-primary/20">
                <CardHeader className="flex flex-row items-center justify-between pb-2 bg-primary/5 dark:bg-transparent rounded-t-lg">
                  <CardTitle className="text-sm font-medium text-primary dark:text-foreground">Active Connections</CardTitle>
                  <Wifi className="h-4 w-4 text-primary/70 dark:text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary dark:text-foreground">{systemStats.activeConnections}</div>
                  <p className="text-xs text-muted-foreground mt-1">WebSocket connections</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Database Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-secondary/40 dark:bg-secondary/20 rounded-lg border border-secondary/50">
                    <div className="text-sm text-muted-foreground font-medium">Database Size</div>
                    <div className="text-lg font-semibold text-primary dark:text-foreground">{formatBytes(systemStats.databaseSize)}</div>
                  </div>
                  <div className="p-3 bg-secondary/40 dark:bg-secondary/20 rounded-lg border border-secondary/50">
                    <div className="text-sm text-muted-foreground font-medium">Total Users</div>
                    <div className="text-lg font-semibold text-primary dark:text-foreground">{users.length}</div>
                  </div>
                  <div className="p-3 bg-secondary/40 dark:bg-secondary/20 rounded-lg border border-secondary/50">
                    <div className="text-sm text-muted-foreground font-medium">Total Tournaments</div>
                    <div className="text-lg font-semibold text-primary dark:text-foreground">{tournaments.length}</div>
                  </div>
                  <div className="p-3 bg-secondary/40 dark:bg-secondary/20 rounded-lg border border-secondary/50">
                    <div className="text-sm text-muted-foreground font-medium">Active Tournaments</div>
                    <div className="text-lg font-semibold text-primary dark:text-foreground">
                      {tournaments.filter(t => t.status === 'ACTIVE').length}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 mt-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Create New User</CardTitle>
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

            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">All Users ({users.length})</CardTitle>
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
                            <tr key={user.id} className="border-b hover:bg-secondary/60 dark:hover:bg-secondary/50">
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
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Tournament Controls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tournamentsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading tournaments...</div>
                  ) : tournaments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No tournaments found</div>
                  ) : (
                    tournaments.map((tournament) => {
                      const isPaused = pauseStates[tournament.id] || false;
                      return (
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
                              {isPaused && (
                                <Badge variant="destructive">Paused</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Label htmlFor={`pause-${tournament.id}`}>Pause</Label>
                              <Switch
                                id={`pause-${tournament.id}`}
                                checked={isPaused}
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
                                    paused: !isPaused,
                                  });
                                }}
                              >
                                {isPaused ? (
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
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-4 mt-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Database Operations</CardTitle>
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
                  <Button 
                    variant="destructive" 
                    className="h-auto flex-col items-start p-4"
                    onClick={async () => {
                      if (confirm('Are you sure you want to clear all test tournament data? This cannot be undone.')) {
                        try {
                          const response = await fetch('/api/admin/clear-test-data', { method: 'DELETE' });
                          if (response.ok) {
                            queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
                            toast({
                              title: 'Test Data Cleared',
                              description: 'All test tournament data has been cleared.',
                            });
                          } else {
                            throw new Error('Failed to clear test data');
                          }
                        } catch (error: any) {
                          toast({
                            title: 'Error',
                            description: error.message,
                            variant: 'destructive',
                          });
                        }
                      }
                    }}
                  >
                    <div className="font-semibold mb-1">Reset Test Data</div>
                    <div className="text-sm text-muted-foreground">Clear all test tournament data</div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Test Data Seeding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Create test tournaments with sample baristas and judges for development and testing.
                  Test tournaments are isolated and won't mix with real tournament data.
                </p>
                
                <TestTournamentForm 
                  onSuccess={() => {
                          queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
                          queryClient.invalidateQueries({ queryKey: ['/api/users'] });
                    }}
                />
              </CardContent>
            </Card>

            {/* User Management Section */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-primary dark:text-foreground">User Management</CardTitle>
                  <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add User
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New User</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
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
                        <div>
                          <Label htmlFor="user-role">Role</Label>
                          <Select value={newUserRole} onValueChange={(value: any) => setNewUserRole(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BARISTA">Barista</SelectItem>
                              <SelectItem value="JUDGE">Judge</SelectItem>
                              <SelectItem value="STATION_LEAD">Station Lead</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="PUBLIC">Public</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          onClick={() => {
                            if (!newUserName || !newUserEmail) {
                              toast({
                                title: 'Error',
                                description: 'Name and email are required',
                                variant: 'destructive',
                              });
                              return;
                            }
                            createUserMutation.mutate({
                              name: newUserName,
                              email: newUserEmail,
                              role: newUserRole,
                            });
                          }}
                          disabled={createUserMutation.isPending}
                          className="w-full"
                        >
                          {createUserMutation.isPending ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            'Create User'
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {usersLoading ? (
                    <div className="text-center p-4">Loading users...</div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <div className="font-medium">{user.name}</div>
                            <Badge variant={user.approved ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            {!user.approved && (
                              <Badge variant="outline" className="text-orange-600">Pending Approval</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {!user.approved && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approveUserMutation.mutate(user.id)}
                                disabled={approveUserMutation.isPending}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => rejectUserMutation.mutate(user.id)}
                                disabled={rejectUserMutation.isPending}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          <Select
                            value={user.role}
                            onValueChange={(value) => updateUserRoleMutation.mutate({ userId: user.id, role: value })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BARISTA">Barista</SelectItem>
                              <SelectItem value="JUDGE">Judge</SelectItem>
                              <SelectItem value="STATION_LEAD">Station Lead</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="PUBLIC">Public</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                                deleteUserMutation.mutate(user.id);
                              }
                            }}
                            disabled={deleteUserMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Approval Management Section */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Approval Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="competitors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="competitors">Competitors</TabsTrigger>
                    <TabsTrigger value="judges">Judges</TabsTrigger>
                    <TabsTrigger value="station-leads">Station Leads</TabsTrigger>
                  </TabsList>
                  <TabsContent value="competitors" className="space-y-2">
                    {users
                      .filter(u => u.role === 'BARISTA' && !u.approved)
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUserMutation.mutate(user.id)}
                              disabled={approveUserMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectUserMutation.mutate(user.id)}
                              disabled={rejectUserMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.role === 'BARISTA' && !u.approved).length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">No pending competitors</div>
                    )}
                  </TabsContent>
                  <TabsContent value="judges" className="space-y-2">
                    {users
                      .filter(u => u.role === 'JUDGE' && !u.approved)
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUserMutation.mutate(user.id)}
                              disabled={approveUserMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectUserMutation.mutate(user.id)}
                              disabled={rejectUserMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.role === 'JUDGE' && !u.approved).length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">No pending judges</div>
                    )}
                  </TabsContent>
                  <TabsContent value="station-leads" className="space-y-2">
                    {users
                      .filter(u => u.role === 'STATION_LEAD' && !u.approved)
                      .map(user => (
                        <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => approveUserMutation.mutate(user.id)}
                              disabled={approveUserMutation.isPending}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectUserMutation.mutate(user.id)}
                              disabled={rejectUserMutation.isPending}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      ))}
                    {users.filter(u => u.role === 'STATION_LEAD' && !u.approved).length === 0 && (
                      <div className="text-center p-4 text-muted-foreground">No pending station leads</div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Database Tables Section */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Database Tables</CardTitle>
              </CardHeader>
              <CardContent>
                {tablesLoading ? (
                  <div className="text-center p-4">Loading tables...</div>
                ) : (
                  <div className="space-y-2">
                    {dbTables.tables.map((table) => (
                      <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{table.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {table.rowCount !== undefined ? `${table.rowCount} rows` : 'Unable to read'}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTable(table.name)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table Data Viewer Dialog */}
            {selectedTable && (
              <Dialog open={!!selectedTable} onOpenChange={() => setSelectedTable(null)}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Table: {selectedTable}</DialogTitle>
                  </DialogHeader>
                  <TableDataViewer tableName={selectedTable} />
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Carousel Tab */}
          <TabsContent value="carousel" className="space-y-4 mt-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5 dark:bg-transparent rounded-t-lg">
                <CardTitle className="text-primary dark:text-foreground">Photo Carousel Management</CardTitle>
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
