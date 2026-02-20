// Base URL from Astro config - available at build time
export const BASE_URL = import.meta.env.BASE_URL;

export function getBaseUrl(): string {
  return BASE_URL;
}

export function createPageUrl(pageName: string): string {
  const pageMap: Record<string, string> = {
    'Home': '/',
    'About': '/about',
    'Solutions': '/solutions',
    'WhoWeServe': '/who-we-serve',
    'Practice': '/practice',
    'SignatureEvents': '/events',
    'LEAPLounge': '/events/lounge',
    'Resources': '/resources',
    'Contact': '/contact',
    'FAQ': '/faq',
    'ScheduleCall': '/schedule',
    'Search': '/search',
    'Leadership': '/leadership',
    'Effectiveness': '/effectiveness',
    'Accountability': '/accountability',
    'Productivity': '/productivity',
    'TeamDebrief': '/practice/team-debrief',
  };
  const path = pageMap[pageName] || `/${pageName.toLowerCase()}`;
  // Ensure base path is included (remove trailing slash from base, add path)
  return `${BASE_URL.replace(/\/$/, '')}${path}`;
}

export function getAssetUrl(path: string): string {
  // Remove leading slash if present, then add base path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}${cleanPath}`;
}

// Helper to build a full URL path with base
export function buildUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${BASE_URL}${cleanPath}`;
}

