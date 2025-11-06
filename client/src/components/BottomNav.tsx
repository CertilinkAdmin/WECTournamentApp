import { Link, useLocation } from 'react-router-dom';
import { Settings, Play, Trophy, LayoutGrid, Award, Crown, FileText, Zap, BarChart3, MapPin, LayoutDashboard, Users, Gavel } from 'lucide-react';

interface NavButton {
  path: string;
  label: string;
  icon: React.ElementType;
}

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Extract tournamentId from pathname if present
  const extractTournamentId = (path: string): string | null => {
    const resultsMatch = path.match(/^\/results\/(\d+)/);
    if (resultsMatch) return resultsMatch[1];
    
    const liveMatch = path.match(/^\/live\/(\d+)/);
    if (liveMatch) return liveMatch[1];
    
    return null;
  };
  
  const tournamentId = extractTournamentId(pathname);
  
  // Determine which navigation set to display based on current route
  const getNavButtons = (): NavButton[] => {
    // Landing page - Main 3 routes
    if (pathname === '/') {
      return [
        { path: '/admin', label: 'Admin', icon: Settings },
        { path: '/live', label: 'Live', icon: Play },
        { path: '/results', label: 'Results', icon: Trophy },
      ];
    }
    
    // Results section navigation with tournament ID
    if (pathname.startsWith('/results') && tournamentId) {
      return [
        { path: `/results/${tournamentId}/bracket`, label: 'Bracket', icon: LayoutGrid },
        { path: `/results/${tournamentId}/baristas`, label: 'Baristas', icon: Crown },
        { path: `/results/${tournamentId}/judges`, label: 'Judges', icon: Award },
        { path: `/results/${tournamentId}/scorecards`, label: 'Scores', icon: FileText },
      ];
    }
    
    // Live section navigation with tournament ID
    if (pathname.startsWith('/live') && tournamentId) {
      return [
        { path: `/live/${tournamentId}/bracket`, label: 'Bracket', icon: LayoutGrid },
        { path: `/live/${tournamentId}/heats`, label: 'Heats', icon: Zap },
        { path: `/live/${tournamentId}/leaderboard`, label: 'Board', icon: BarChart3 },
        { path: `/live/${tournamentId}/stations`, label: 'Stations', icon: MapPin },
      ];
    }
    
    // Admin section navigation
    if (pathname.startsWith('/admin')) {
      return [
        { path: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/admin/tournaments', label: 'Tourneys', icon: Trophy },
        { path: '/admin/competitors', label: 'Baristas', icon: Users },
        { path: '/admin/judges', label: 'Judges', icon: Gavel },
      ];
    }
    
    // Default fallback (shouldn't happen)
    return [];
  };
  
  const navButtons = getNavButtons();
  
  // Don't render if no buttons to show
  if (navButtons.length === 0) {
    return null;
  }
  
  const isActive = (path: string) => {
    // For exact matches (e.g., /admin on /admin page)
    if (pathname === path) return true;
    
    // For sub-routes, check if pathname starts with path (but not for root paths)
    if (path !== '/' && path !== '/admin' && path !== '/live' && path !== '/results') {
      return pathname.startsWith(path);
    }
    
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cinnamon-brown/95 backdrop-blur-md border-t border-light-sand/20 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen px-safe">
        {navButtons.map((button) => {
          const Icon = button.icon;
          const active = isActive(button.path);
          
          return (
            <Link
              key={button.path}
              to={button.path}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
                active
                  ? 'text-light-sand bg-light-sand/10'
                  : 'text-light-sand/70 hover-elevate active-elevate-2'
              }`}
              data-testid={`nav-bottom-${button.label.toLowerCase().replace(/\s+/g, '-')}`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs font-medium">{button.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
