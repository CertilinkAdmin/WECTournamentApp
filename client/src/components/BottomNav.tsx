import { Link, useLocation } from 'react-router-dom';
import { Settings, Play, Trophy } from 'lucide-react';

export default function BottomNav() {
  const location = useLocation();
  
  // Don't show bottom nav on landing page
  if (location.pathname === '/') {
    return null;
  }
  
  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname.startsWith('/admin');
    if (path === '/live') return location.pathname.startsWith('/live');
    if (path === '/results') return location.pathname.startsWith('/results');
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-cinnamon-brown/95 backdrop-blur-md border-t border-light-sand/20 md:hidden safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen px-safe">
        {/* Admin Button */}
        <Link
          to="/admin"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            isActive('/admin')
              ? 'text-light-sand bg-light-sand/10'
              : 'text-light-sand/70 hover-elevate active-elevate-2'
          }`}
          data-testid="nav-bottom-admin"
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs font-medium">Admin</span>
        </Link>

        {/* Live Button */}
        <Link
          to="/live"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            isActive('/live')
              ? 'text-light-sand bg-light-sand/10'
              : 'text-light-sand/70 hover-elevate active-elevate-2'
          }`}
          data-testid="nav-bottom-live"
        >
          <Play className="h-5 w-5" />
          <span className="text-xs font-medium">Live</span>
        </Link>

        {/* Results Button */}
        <Link
          to="/results"
          className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
            isActive('/results')
              ? 'text-light-sand bg-light-sand/10'
              : 'text-light-sand/70 hover-elevate active-elevate-2'
          }`}
          data-testid="nav-bottom-results"
        >
          <Trophy className="h-5 w-5" />
          <span className="text-xs font-medium">Results</span>
        </Link>
      </div>
    </nav>
  );
}
