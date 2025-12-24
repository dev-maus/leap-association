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
  return pageMap[pageName] || `/${pageName.toLowerCase()}`;
}

