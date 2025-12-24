import { useState, useEffect } from 'react';
import { X, Menu } from 'lucide-react';

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const button = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    
    if (button) {
      button.addEventListener('click', () => setIsOpen(!isOpen));
    }

    return () => {
      if (button) {
        button.removeEventListener('click', () => setIsOpen(!isOpen));
      }
    };
  }, [isOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About LEAP', path: '/about' },
    { name: 'Solutions', path: '/solutions' },
    { name: "What's In Your Practice?", path: '/practice' },
    { name: 'Signature Events', path: '/events' },
    { name: 'LEAP Lounge', path: '/events/lounge' },
    { name: 'Resources', path: '/resources' },
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
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.path}
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

