import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { User, Users, UserPlus, Search, Filter, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'ADMIN' | 'JUDGE' | 'BARISTA' | 'STATION_LEAD';
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('baristas');

  // Fetch users
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Separate baristas and judges
  const baristas = filteredUsers.filter(u => u.role === 'BARISTA');
  const judges = filteredUsers.filter(u => u.role === 'JUDGE');
  const stationLeads = filteredUsers.filter(u => u.role === 'STATION_LEAD');
  const admins = filteredUsers.filter(u => u.role === 'ADMIN');

  // Pagination logic
  const getCurrentUsers = () => {
    if (activeTab === 'baristas') return baristas;
    if (activeTab === 'judges') return judges;
    if (activeTab === 'station-leads') return stationLeads;
    if (activeTab === 'admins') return admins;
    return filteredUsers;
  };

  const currentUsers = getCurrentUsers();
  const totalPages = Math.ceil(currentUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = currentUsers.slice(startIndex, endIndex);

  // Reset page when changing tabs or filters
  React.useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, roleFilter, searchTerm]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'destructive';
      case 'JUDGE': return 'default';
      case 'BARISTA': return 'secondary';
      case 'STATION_LEAD': return 'outline';
      default: return 'secondary';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN': return '👑';
      case 'JUDGE': return '⚖️';
      case 'BARISTA': return '☕';
      case 'STATION_LEAD': return '🎯';
      default: return '👤';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-6 w-6" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="role-filter">Filter by Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="BARISTA">Baristas (Competitors)</SelectItem>
                  <SelectItem value="JUDGE">Judges</SelectItem>
                  <SelectItem value="STATION_LEAD">Station Leads</SelectItem>
                  <SelectItem value="ADMIN">Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Categories */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="baristas" className="flex items-center gap-2">
            <span>☕</span>
            <span>Baristas</span>
            <Badge variant="secondary" className="ml-1">{baristas.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="judges" className="flex items-center gap-2">
            <span>⚖️</span>
            <span>Judges</span>
            <Badge variant="default" className="ml-1">{judges.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="station-leads" className="flex items-center gap-2">
            <span>🎯</span>
            <span>Station Leads</span>
            <Badge variant="outline" className="ml-1">{stationLeads.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="admins" className="flex items-center gap-2">
            <span>👑</span>
            <span>Admins</span>
            <Badge variant="destructive" className="ml-1">{admins.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="baristas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>☕</span>
                  <span>Baristas (Competitors)</span>
                </div>
                <Badge variant="secondary">{baristas.length} baristas</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {baristas.length === 0 ? (
              <div className="text-center p-6">
                <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No Baristas Found</h3>
                <p className="text-muted-foreground mb-4">Register baristas using the WEC Competitor Registration form.</p>
                <Button asChild>
                  <Link href="/competitor/register">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Register New Barista
                  </Link>
                </Button>
              </div>
              ) : (
                <div className="space-y-2">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="judges" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>⚖️</span>
                  <span>Judges (Non-Competitors)</span>
                </div>
                <Badge variant="default">{judges.length} judges</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {judges.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No judges found.</p>
                  <p className="text-sm">Judges evaluate competitors but do not compete.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="station-leads" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>🎯</span>
                  <span>Station Leads</span>
                </div>
                <Badge variant="outline">{stationLeads.length} station leads</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stationLeads.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No station leads found.</p>
                  <p className="text-sm">Station leads manage timing and coordination.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="admins" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>👑</span>
                  <span>Administrators</span>
                </div>
                <Badge variant="destructive">{admins.length} admins</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {admins.length === 0 ? (
                <div className="text-center p-6 text-muted-foreground">
                  <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No administrators found.</p>
                  <p className="text-sm">Administrators manage the tournament system.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-muted rounded-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getRoleIcon(user.role)}</span>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => handlePageChange(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{baristas.length}</div>
              <div className="text-sm text-muted-foreground">Baristas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{judges.length}</div>
              <div className="text-sm text-muted-foreground">Judges</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stationLeads.length}</div>
              <div className="text-sm text-muted-foreground">Station Leads</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{admins.length}</div>
              <div className="text-sm text-muted-foreground">Admins</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
