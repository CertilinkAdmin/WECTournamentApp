import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Menu } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface AppHeaderProps {
  className?: string;
  logoSize?: 'small' | 'medium' | 'large';
}

const AppHeader: React.FC<AppHeaderProps> = ({ className = '', logoSize = 'small' }) => {
  const { theme } = useTheme();
  const location = useLocation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  
  // Check screen size
  useEffect(() => {
    const checkScreenSize = () => {
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

  // Get navigation buttons based on current route
  const getNavButtons = () => {
    const pathname = location.pathname;
    
    if (pathname === '/') {
      return [
        { path: '/admin', label: 'Admin', icon: '/icons/briefcase.png' },
        { path: '/live', label: 'Championships', icon: '/icons/trophy.png' },
        { path: '/results', label: 'Results', icon: '/icons/scores.png' },
      ];
    }
    
    const resultsMatch = pathname.match(/^\/results\/([^\/]+)/);
    if (resultsMatch && resultsMatch[1] !== '') {
      const tournamentSlug = resultsMatch[1];
      return [
        { path: `/results/${tournamentSlug}`, label: 'Overview', icon: '/icons/square.png' },
        { path: `/results/${tournamentSlug}/bracket`, label: 'Bracket', icon: '/icons/trophy.png' },
        { path: `/results/${tournamentSlug}/baristas`, label: 'Baristas', icon: '/icons/coffee tap.png' },
        { path: `/results/${tournamentSlug}/judges`, label: 'Judges', icon: '/icons/handcheck.png' },
        { path: `/results/${tournamentSlug}/scorecards`, label: 'Scorecards', icon: '/icons/scores.png' },
      ];
    }
    
    if (pathname === '/results' || pathname === '/results/') {
      return [
        { path: '/admin', label: 'Admin', icon: '/icons/briefcase.png' },
        { path: '/live', label: 'Championships', icon: '/icons/trophy.png' },
        { path: '/results', label: 'Results', icon: '/icons/scores.png' },
      ];
    }
    
    const liveMatch = pathname.match(/^\/live\/([^\/]+)/);
    if (liveMatch) {
      const tournamentId = liveMatch[1];
      return [
        { path: `/live/${tournamentId}/bracket`, label: 'Bracket', icon: '/icons/square.png' },
        { path: `/live/${tournamentId}/heats`, label: 'Heats', icon: '/icons/coffee tap.png' },
        { path: `/live/${tournamentId}/leaderboard`, label: 'Board', icon: '/icons/scores.png' },
        { path: `/live/${tournamentId}/stations`, label: 'Stations', icon: '/icons/pot.png' },
      ];
    }
    
    if (pathname.startsWith('/admin')) {
      return [
        { path: '/admin', label: 'Dashboard', icon: '/icons/square.png' },
        { path: '/admin/tournaments', label: 'Tourneys', icon: '/icons/trophy.png' },
        { path: '/admin/competitors', label: 'Baristas', icon: '/icons/coffee tap.png' },
        { path: '/admin/judges', label: 'Judges', icon: '/icons/handcheck.png' },
      ];
    }
    
    return [];
  };

  const navButtons = getNavButtons();
  const logoHeight = {
    small: 'h-12',
    medium: 'h-16',
    large: 'h-20'
  }[logoSize];

  // Sand beige for light mode, cinnamon brown for dark mode
  const headerBgColor = theme === 'light' 
    ? 'bg-secondary' 
    : 'bg-primary/80';

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-[50] ${headerBgColor} backdrop-blur-sm ${theme === 'light' ? 'text-secondary-foreground' : 'text-primary-foreground'} border-b border-primary-border/50 ${className}`}
      >
        <div className="px-4 py-3 md:py-4 flex items-center justify-between w-full">
          {/* Left: Home Button */}
          <div className="flex items-center flex-shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2 px-3 py-2 hover:bg-white/20 active:bg-white/30 rounded-lg transition-all border border-white/20 hover:border-white/30"
              data-testid="link-home"
            >
              <Home className="w-5 h-5 text-white" />
              <span className="text-sm font-semibold hidden sm:inline text-white">Home</span>
            </Link>
          </div>
          
          {/* Center: Logo with Hamburger Menu Button (Desktop) */}
          <div className="flex-1 flex justify-center items-center px-4 relative group">
            {isDesktop && navButtons.length > 0 ? (
              <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <div className="flex items-center gap-3">
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 hover:bg-white/20 rounded-lg transition-all border border-white/20 hover:border-white/30"
                      aria-label="Open navigation menu"
                    >
                      <Menu className="h-5 w-5 text-white" />
                    </Button>
                  </SheetTrigger>
                  <img 
                    src="/wec_logo_wht.png" 
                    alt="WEC Championships" 
                    className={`${logoSize === 'small' ? 'h-16' : logoSize === 'medium' ? 'h-20' : 'h-24'} w-auto cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => setIsDrawerOpen(true)}
                  />
                </div>
                <SheetContent 
                  side="right" 
                  className={`w-[280px] sm:w-[320px] md:w-[360px] lg:w-[400px] border-l pt-6 z-[160] ${
                    theme === 'light' 
                      ? 'bg-secondary/95 backdrop-blur-md border-primary-border/30' 
                      : 'bg-primary/95 backdrop-blur-md border-primary-border/30'
                  }`}
                >
                  <SheetHeader className="pb-4 border-b border-primary-border/30">
                    <SheetTitle className={`text-left text-xl md:text-2xl font-bold ${
                      theme === 'light' ? 'text-secondary-foreground' : 'text-primary-foreground'
                    }`}>
                      Navigation
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="mt-6 space-y-2">
                    {navButtons.map((button) => (
                      <Link
                        key={button.path}
                        to={button.path}
                        onClick={() => setIsDrawerOpen(false)}
                        className={`flex items-center gap-4 w-full px-4 py-3 md:px-5 md:py-4 rounded-lg transition-all ${
                          theme === 'light'
                            ? 'text-secondary-foreground hover:bg-primary/10 hover:border-primary-border/20 border border-transparent'
                            : 'text-primary-foreground hover:bg-primary/20 hover:border-primary-border/30 border border-transparent'
                        }`}
                      >
                        <img 
                          src={button.icon} 
                          alt={button.label}
                          className="w-6 h-6 md:w-7 md:h-7 flex-shrink-0 object-contain"
                        />
                        <span className="text-base md:text-lg font-medium">{button.label}</span>
                      </Link>
                    ))}
                  </nav>
                </SheetContent>
              </Sheet>
            ) : (
              <img 
                src="/wec_logo_wht.png" 
                alt="WEC Championships" 
                className={`${logoSize === 'small' ? 'h-16' : logoSize === 'medium' ? 'h-20' : 'h-24'} w-auto`}
              />
            )}
          </div>
          
          {/* Right: Theme Toggle */}
          <div className="flex items-center justify-end flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-[73px] md:h-[81px] lg:h-[89px]" />
    </>
  );
};

export default AppHeader;

