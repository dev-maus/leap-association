import { useState, useEffect, useCallback } from 'react';
import { X, LogOut, LogIn, User } from 'lucide-react';
import { createPageUrl } from '../../lib/utils';
import { useAuth } from '../../lib/useAuth';

const NAV_LINKS = [
  { name: 'Home', pageName: 'Home' },
  { name: 'About LEAP', pageName: 'About' },
  { name: 'Solutions', pageName: 'Solutions' },
  { name: "What's In Your Practice?", pageName: 'Practice' },
  { name: 'Signature Events', pageName: 'SignatureEvents' },
  { name: 'LEAP Lounge', pageName: 'LEAPLounge' },
  { name: 'Resources', pageName: 'Resources' },
] as const;

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated, userEmail, isLoading, isSigningOut, signOut, signIn } = useAuth();

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const button = document.getElementById('mobile-menu-button');
    
    if (button) {
      button.addEventListener('click', handleToggle);
    }

    return () => {
      if (button) {
        button.removeEventListener('click', handleToggle);
      }
    };
  }, [handleToggle]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleSignIn = () => {
    setIsOpen(false);
    signIn();
  };

  const closeMenu = () => setIsOpen(false);

  if (!isOpen) return null;

  return (
    <div
      id="mobile-menu"
      className="md:hidden fixed inset-0 z-50 bg-white"
      style={{ marginTop: '88px' }}
    >
      <div className="px-6 py-4 flex flex-col h-full">
        <button
          onClick={closeMenu}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.name}
              href={createPageUrl(link.pageName)}
              className="block py-2 text-slate-700 font-medium hover:text-primary transition-colors"
              onClick={closeMenu}
            >
              {link.name}
            </a>
          ))}
        </nav>

        {/* Auth Section */}
        <div className="pt-4 border-t border-slate-200">
          {isLoading ? (
            <div className="flex items-center gap-3 py-2 text-slate-500">
              <User className="w-5 h-5 opacity-50" />
              <span className="text-sm">Loading...</span>
            </div>
          ) : isAuthenticated ? (
            <>
              <div className="px-2 py-2 mb-2">
                <p className="text-xs text-slate-500 mb-1">Signed in as</p>
                <p className="text-sm font-medium text-slate-900 truncate">{userEmail || 'User'}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white bg-primary hover:bg-primary-dark transition-colors rounded-lg font-medium"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
