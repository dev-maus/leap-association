import { useState, useEffect } from 'react';

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary via-primary-dark to-primary-dark"
      style={{
        animation: 'fadeOut 0.5s ease-out 1.5s forwards',
      }}
    >
      <div className="text-center">
        <div className="mb-6">
          <img
            src="/logo.png"
            alt="LEAP Association"
            className="h-24 w-auto mx-auto animate-pulse"
          />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">LEAP Association</h1>
        <p className="text-white/80">Excellence Through Intentional Practice</p>
      </div>

      <style jsx>{`
        @keyframes fadeOut {
          to {
            opacity: 0;
            visibility: hidden;
          }
        }
      `}</style>
    </div>
  );
}

