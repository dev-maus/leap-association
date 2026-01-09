import { useState, useEffect, useCallback } from 'react';
import { X, Menu } from 'lucide-react';
import { createPageUrl } from '../../lib/utils';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

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

  const navLinks = [
    { name: 'Home', pageName: 'Home' },
    { name: 'About LEAP', pageName: 'About' },
    { name: 'Solutions', pageName: 'Solutions' },
    { name: "What's In Your Practice?", pageName: 'Practice' },
    { name: 'Signature Events', pageName: 'SignatureEvents' },
    { name: 'LEAP Lounge', pageName: 'LEAPLounge' },
    { name: 'Resources', pageName: 'Resources' },
  ];

  return (
    <>
      {isOpen && (
        <div
          id="mobile-menu"
          className="md:hidden fixed inset-0 z-50 bg-white"
          style={{ marginTop: '88px' }}
        >
          <div className="px-6 py-4 space-y-3">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6" />
            </button>
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={createPageUrl(link.pageName)}
                className="block py-2 text-slate-700 font-medium hover:text-primary transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

