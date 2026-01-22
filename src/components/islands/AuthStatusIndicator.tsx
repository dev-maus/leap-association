import { useState, useEffect, useRef } from 'react';
import { LogOut, User, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/useAuth';

export default function AuthStatusIndicator() {
  const { isAuthenticated, userEmail, isLoading, isSigningOut, signOut, signIn } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
  };

  const handleSignIn = () => {
    setIsOpen(false);
    signIn();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={isLoading ? 'Loading...' : (isAuthenticated ? 'User menu' : 'Sign in')}
      >
        <User className={`w-5 h-5 ${isLoading ? 'opacity-50' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50">
          {isAuthenticated ? (
            <>
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Signed in as</p>
                <p className="text-sm font-medium text-slate-900 truncate">{userEmail || 'User'}</p>
              </div>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </>
          ) : (
            <button
              onClick={handleSignIn}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </button>
          )}
        </div>
      )}
    </div>
  );
}
