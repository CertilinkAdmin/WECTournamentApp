import React from 'react';
import { Link, useLocation } from 'wouter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Play, Eye, Trophy, Users, MapPin, ExternalLink } from 'lucide-react';

export default function TournamentNavigation() {
  const [location] = useLocation();

  const navItems = [
    {
      path: '/',
      label: 'Tournament Setup',
      icon: Settings,
      description: 'Create and configure tournaments',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      path: '/live',
      label: 'Live Tournament',
      icon: Play,
      description: 'Manage active tournament',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      path: '/public',
      label: 'Public Display',
      icon: Eye,
      description: 'Spectator view for displays',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    }
  ];

  const extraActions = [
    {
      path: '/competitor/register',
      label: 'Register Barista',
      icon: ExternalLink,
    }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location === '/';
    return location.startsWith(path);
  };

  return (
    <div className="bg-card border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Tournament System</h1>
            </div>
            <Badge variant="outline" className="text-xs">
              v1.0
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              return (
                <Button
                  key={item.path}
                  asChild
                  variant={active ? "default" : "ghost"}
                  className={`${active ? '' : 'hover:bg-muted'}`}
                >
                  <Link href={item.path}>
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
            {extraActions.map((item) => {
              const Icon = item.icon;
              return (
                <Button key={item.path} asChild variant="outline">
                  <Link href={item.path}>
                    <Icon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}


