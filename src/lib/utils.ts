const base = import.meta.env.BASE_URL;

export function createPageUrl(pageName: string): string {
  const pageMap: Record<string, string> = {
    'Home': '/',
    'About': '/about',
    'Solutions': '/solutions',
    'Practice': '/practice',
    'SignatureEvents': '/events',
    'LEAPLounge': '/events/lounge',
    'Resources': '/resources',
    'Contact': '/contact',
    'FAQ': '/faq',
    'ScheduleCall': '/schedule',
    'Search': '/search',
  };
  const path = pageMap[pageName] || `/${pageName.toLowerCase()}`;
  // Ensure base path is included (remove trailing slash from base, add path)
  return `${base.replace(/\/$/, '')}${path}`;
}

export function getAssetUrl(path: string): string {
  // Remove leading slash if present, then add base path
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

