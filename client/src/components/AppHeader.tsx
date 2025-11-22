import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';

interface AppHeaderProps {
  className?: string;
  logoSize?: 'small' | 'medium' | 'large';
}

const AppHeader: React.FC<AppHeaderProps> = ({ className = '', logoSize = 'small' }) => {
  const { theme } = useTheme();
  const logoHeight = {
    small: 'h-12',
    medium: 'h-16',
    large: 'h-20'
  }[logoSize];

  // More vibrant orange for light mode - using primary color
  const headerBgColor = theme === 'light' 
    ? 'bg-primary' 
    : 'bg-primary/80';

  return (
    <header 
      className={`${headerBgColor} backdrop-blur-sm text-primary-foreground border-b border-primary-border/50 ${className}`}
    >
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Left: Home Button */}
        <div className="w-20 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2.5 hover:bg-white/20 active:bg-white/30 rounded-lg transition-all border border-white/20 hover:border-white/30"
            data-testid="link-home"
          >
            <Home className="w-5 h-5 text-white" />
            <span className="text-sm font-semibold hidden sm:inline text-white">Home</span>
          </Link>
        </div>
        
        {/* Center: White WEC Logo - Bigger */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/wec_logo_wht.png" 
            alt="WEC Championships" 
            className={`${logoSize === 'small' ? 'h-16' : logoSize === 'medium' ? 'h-20' : 'h-24'} w-auto`}
          />
        </div>
        
        {/* Right: Theme Toggle */}
        <div className="w-20 flex items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;

