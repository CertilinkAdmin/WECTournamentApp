import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@shared/schema';

const ManageBaristas: React.FC = () => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all baristas
  const { data: allUsers = [], isLoading, refetch } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const baristas = allUsers.filter(u => u.role === 'BARISTA');
  const filteredBaristas = baristas.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const approvedBaristas = filteredBaristas.filter(b => b.approved);
  const pendingBaristas = filteredBaristas.filter(b => !b.approved);

  const approveMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: userId, approved: true })
      });
      if (!response.ok) throw new Error('Failed to approve barista');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Barista Approved',
        description: 'The barista has been approved and will appear in tournament selection.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to approve barista.',
        variant: 'destructive'
      });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: userId, approved: false })
      });
      if (!response.ok) throw new Error('Failed to reject barista');
      return response.json();
    },
    onSuccess: () => {
      refetch();
      toast({
        title: 'Barista Rejected',
        description: 'The barista has been removed from approved list.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to reject barista.',
        variant: 'destructive'
      });
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Users className="h-8 w-8 text-primary" />
          Manage Baristas
        </h1>
        <p className="text-muted-foreground">
          Approve baristas to make them available for tournament selection
        </p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search baristas by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Approval */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pending Approval</span>
              <Badge variant="secondary">{pendingBaristas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {pendingBaristas.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending baristas</p>
            ) : (
              pendingBaristas.map((barista) => (
                <Card key={barista.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{barista.name}</div>
                        <div className="text-sm text-muted-foreground">{barista.email}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => approveMutation.mutate(barista.id)}
                          disabled={approveMutation.isPending}
                        >
                          <CheckCircle2 className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        {/* Approved Baristas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Approved Baristas</span>
              <Badge variant="default">{approvedBaristas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 max-h-[600px] overflow-y-auto">
            {approvedBaristas.length === 0 ? (
              <p className="text-muted-foreground text-sm">No approved baristas yet</p>
            ) : (
              approvedBaristas.map((barista) => (
                <Card key={barista.id} className="border border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold flex items-center gap-2">
                          {barista.name}
                          <Badge variant="default" className="text-xs">Approved</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">{barista.email}</div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rejectMutation.mutate(barista.id)}
                        disabled={rejectMutation.isPending}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ManageBaristas;

