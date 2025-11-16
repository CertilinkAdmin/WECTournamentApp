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

  // Cinnamon orange color for light mode: #BD5426
  const headerBgColor = theme === 'light' 
    ? 'bg-[#BD5426]/80' 
    : 'bg-primary/80';

  return (
    <header 
      className={`${headerBgColor} backdrop-blur-sm text-primary-foreground border-b border-primary-border/50 ${className}`}
      style={theme === 'light' ? { backgroundColor: 'rgba(189, 84, 38, 0.8)' } : undefined}
    >
      <div className="px-4 py-4 flex items-center justify-between">
        {/* Left: Home Button */}
        <div className="w-20 flex items-center">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 hover:bg-white/10 rounded-md transition-colors"
            data-testid="link-home"
          >
            <Home className="w-4 h-4" />
            <span className="text-sm font-medium hidden sm:inline">Home</span>
          </Link>
        </div>
        
        {/* Center: White WEC Logo */}
        <div className="flex-1 flex justify-center">
          <img 
            src="/wec_logo_wht.png" 
            alt="WEC Championships" 
            className={`${logoHeight} w-auto`}
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

