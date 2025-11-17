import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-6 h-6 flex items-center justify-center hover:opacity-80 transition-opacity bg-transparent border-none p-0 outline-none"
      aria-label="Toggle theme"
      style={{ background: 'transparent', border: 'none', boxShadow: 'none' }}
    >
      <Sun className={`absolute h-5 w-5 transition-all ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} />
      <Moon className={`absolute h-5 w-5 transition-all ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;