import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-8 h-8 flex items-center justify-center hover:bg-white/20 active:bg-white/30 rounded-lg transition-all p-2"
      aria-label="Toggle theme"
      style={{ border: 'none', boxShadow: 'none', outline: 'none' }}
    >
      <Sun className={`absolute h-5 w-5 transition-all text-white ${theme === 'light' ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}`} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 }} />
      <Moon className={`absolute h-5 w-5 transition-all text-white ${theme === 'dark' ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} style={{ fill: 'none', stroke: 'currentColor', strokeWidth: 2.5 }} />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

export default ThemeToggle;