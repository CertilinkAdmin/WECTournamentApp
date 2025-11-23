import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Settings, Play, Trophy, LayoutGrid, Award, Crown, FileText, Zap, BarChart3, MapPin, LayoutDashboard, Users, Gavel, Menu, X } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavButton {
  path: string;
  label: string;
  icon: React.ElementType;
}

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Check screen size and orientation
  useEffect(() => {
    const checkScreenSize = () => {
      // Desktop: >= 1024px (lg breakpoint)
      // Tablet: 768px - 1023px (md breakpoint)
      // Mobile: < 768px
      const width = window.innerWidth;
      const isDesktopSize = width >= 1024;
      const isTabletSize = width >= 768 && width < 1024;
      const isLandscape = window.innerWidth > window.innerHeight && window.innerWidth >= 640;
      setIsDesktop(isDesktopSize || isTabletSize || isLandscape);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    window.addEventListener('orientationchange', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
      window.removeEventListener('orientationchange', checkScreenSize);
    };
  }, []);
  
  // Extract tournamentId from pathname if present
  const extractTournamentId = (path: string): string | null => {
    // Match /results/:tournamentId (numeric or string)
    const resultsMatch = path.match(/^\/results\/([^\/]+)/);
    if (resultsMatch) return resultsMatch[1];
    
    // Match /live/:tournamentId (numeric or string)
    const liveMatch = path.match(/^\/live\/([^\/]+)/);
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
        { path: '/live', label: 'Championships', icon: Play },
        { path: '/results', label: 'Results', icon: Trophy },
      ];
    }
    
    // Results section navigation - show for any /results route with tournament slug
    // Handle /results/:tournamentSlug/* routes (like /results/milan2025/bracket)
    const resultsMatch = pathname.match(/^\/results\/([^\/]+)/);
    if (resultsMatch && resultsMatch[1] !== '') {
      const tournamentSlug = resultsMatch[1];
      return [
        { path: `/results/${tournamentSlug}`, label: 'Overview', icon: LayoutGrid },
        { path: `/results/${tournamentSlug}/bracket`, label: 'Bracket', icon: Trophy },
        { path: `/results/${tournamentSlug}/baristas`, label: 'Baristas', icon: Crown },
        { path: `/results/${tournamentSlug}/judges`, label: 'Judges', icon: Award },
        { path: `/results/${tournamentSlug}/scorecards`, label: 'Scorecards', icon: FileText },
      ];
    }
    
    // Fallback for /results route without tournamentId (legacy support)
    if (pathname === '/results' || pathname === '/results/') {
      return [
        { path: '/admin', label: 'Admin', icon: Settings },
        { path: '/live', label: 'Championships', icon: Play },
        { path: '/results', label: 'Results', icon: Trophy },
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
    
    // Special handling for results overview (index route) - check if we're exactly on the tournament results page
    if (tournamentId && path === `/results/${tournamentId}`) {
      return pathname === `/results/${tournamentId}` || pathname === `/results/${tournamentId}/`;
    }
    
    // For sub-routes, check if pathname starts with path (but not for root paths)
    if (path !== '/' && path !== '/admin' && path !== '/live' && path !== '/results') {
      return pathname.startsWith(path);
    }
    
    return false;
  };

  // Render navigation button
  const renderNavButton = (button: NavButton, isDrawer: boolean = false) => {
    const Icon = button.icon;
    const active = isActive(button.path);
    
    const baseClasses = isDrawer
      ? `flex items-center gap-3 w-full px-4 py-3 md:px-5 md:py-4 rounded-lg transition-all ${
          active
            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
            : 'text-foreground hover:bg-muted/50'
        }`
      : `flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all ${
          active
            ? 'text-light-sand bg-light-sand/10'
            : 'text-light-sand/70 hover-elevate active-elevate-2'
        }`;
    
    return (
      <Link
        key={button.path}
        to={button.path}
        onClick={() => setIsDrawerOpen(false)}
        className={baseClasses}
        data-testid={`nav-${isDrawer ? 'drawer' : 'bottom'}-${button.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        <Icon className={isDrawer ? 'h-5 w-5 md:h-6 md:w-6 flex-shrink-0' : 'h-5 w-5'} />
        <span className={isDrawer ? 'text-base md:text-lg font-medium' : 'text-xs font-medium'}>{button.label}</span>
      </Link>
    );
  };

  // Desktop/Tablet/Landscape Mobile: Drawer Navigation
  if (isDesktop) {
    return (
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="fixed z-[60] bg-cinnamon-brown/95 backdrop-blur-md border-light-sand/20 text-light-sand hover:bg-cinnamon-brown hover:text-light-sand shadow-lg
              top-20 right-4 md:top-24 md:right-6 lg:top-6 lg:right-6
              h-10 w-10 md:h-12 md:w-12"
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent 
          side="right" 
          className="w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] bg-background border-l border-border z-[70] pt-6"
        >
          <SheetHeader className="pb-4 border-b border-border">
            <SheetTitle className="text-left text-xl md:text-2xl font-bold text-foreground">Navigation</SheetTitle>
          </SheetHeader>
          <nav className="mt-6 space-y-2">
            {navButtons.map((button) => renderNavButton(button, true))}
          </nav>
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile Portrait: Bottom Navigation
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-cinnamon-brown/95 backdrop-blur-md border-t border-light-sand/20 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-screen px-safe">
        {navButtons.map((button) => renderNavButton(button, false))}
      </div>
    </nav>
  );
}
