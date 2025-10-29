import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={toggleMenu}
        className="fixed top-4 right-4 z-[150] p-2 rounded-lg bg-cinnamon-brown/90 backdrop-blur-md border border-light-sand/20 hover-elevate active-elevate-2 md:hidden"
        aria-label="Toggle menu"
        data-testid="button-hamburger-menu"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-light-sand" />
        ) : (
          <Menu className="h-6 w-6 text-light-sand" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[140] md:hidden"
          onClick={closeMenu}
          data-testid="overlay-mobile-menu"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-gradient-to-b from-cinnamon-brown to-cinnamon-brown/95 backdrop-blur-lg z-[145] transform transition-transform duration-300 ease-in-out md:hidden ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        data-testid="drawer-mobile-menu"
      >
        {/* Menu Header */}
        <div className="p-6 border-b border-light-sand/20">
          <h2 className="text-xl font-bold text-light-sand">Navigation</h2>
        </div>

        {/* Menu Items */}
        <nav className="flex flex-col p-4 gap-2">
          <Link
            to="/admin"
            onClick={closeMenu}
            className="flex items-center gap-3 p-4 rounded-lg bg-light-sand/10 border border-light-sand/20 text-light-sand hover-elevate active-elevate-2 transition-all"
            data-testid="link-menu-admin"
          >
            <span className="text-2xl">🏗️</span>
            <div>
              <div className="font-semibold">Admin</div>
              <div className="text-xs text-light-sand/70">Bracket Builder</div>
            </div>
          </Link>

          <Link
            to="/live"
            onClick={closeMenu}
            className="flex items-center gap-3 p-4 rounded-lg bg-light-sand/15 border border-light-sand/30 text-light-sand hover-elevate active-elevate-2 transition-all"
            data-testid="link-menu-live"
          >
            <span className="text-2xl">📺</span>
            <div>
              <div className="font-semibold">Live</div>
              <div className="text-xs text-light-sand/70">Tournament Monitor</div>
            </div>
          </Link>

          <Link
            to="/results"
            onClick={closeMenu}
            className="flex items-center gap-3 p-4 rounded-lg bg-light-sand/10 border border-light-sand/20 text-light-sand hover-elevate active-elevate-2 transition-all"
            data-testid="link-menu-results"
          >
            <span className="text-2xl">🏆</span>
            <div>
              <div className="font-semibold">Results</div>
              <div className="text-xs text-light-sand/70">Competition Recap</div>
            </div>
          </Link>
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-light-sand/20">
          <p className="text-xs text-light-sand/60 text-center">
            WEC 2025 Milano
          </p>
        </div>
      </div>
    </>
  );
}
