/**
 * Default content for pages when CMS data is not available.
 * Centralizes fallback content to avoid duplication across pages.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface SanityImageSource {
  _type: 'image';
  asset: {
    _ref: string;
    _type: 'reference';
  };
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
}

export interface SignatureEvent {
  _id?: string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string | null;
  badgeColor?: string;
  duration: string;
  format: string;
  capacity?: string;
  price?: string;
  features: string[];
  benefits: string[];
  special?: string;
  color: string;
}

export interface CaseStudy {
  _id?: string;
  title: string;
  category: string;
  description: string;
  result: string;
  image?: SanityImageSource;
}

export interface Book {
  _id?: string;
  title: string;
  subtitle?: string;
  description: string;
  coverUrl?: string | null;
  cover?: SanityImageSource;
  price?: string;
  purchaseLink?: string;
}

export interface Industry {
  name: string;
  count: string;
  icon: string;
}

export interface Statistic {
  value: string;
  label: string;
}

export interface SocialLink {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'youtube' | 'email';
  url: string;
  label?: string;
}

// =============================================================================
// Default Content
// =============================================================================

/**
 * Default hero image URL - used when no hero image is set in CMS
 */
export const DEFAULT_HERO_IMAGE_URL = 
  'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/694200055fe4955e89271fbb/0d4eae03a_whiteshirtwithJacket2.png';

/**
 * Default signature events for the events page
 */
export const DEFAULT_EVENTS: SignatureEvent[] = [
  {
    title: 'LEAP Through Lunch',
    subtitle: 'Complimentary Introduction',
    icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
    badge: 'FREE',
    badgeColor: 'bg-emerald-500',
    duration: '60 minutes',
    format: 'At Your Location',
    capacity: 'Up to 5 participants',
    price: 'Complimentary lunch included',
    features: [
      'Complimentary lunch for up to 5 participants',
      "Tailored content featuring 2 of LEAP's 28 competencies",
      'Hands-on interactive engagement',
      'Special development considerations',
      'Great for team building',
    ],
    benefits: [
      'Tailored LEAP introduction',
      'Accelerates buy-in',
      'Brings focus to LEAP development series',
      'Customizable for training or coaching',
    ],
    special: '100% Results Guaranteed',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    title: 'Team Up',
    subtitle: 'Team Alignment Workshop',
    icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    badge: null,
    duration: 'Half-day',
    format: 'In-person',
    capacity: 'Teams of any size',
    features: [
      'Comprehensive team practice assessment',
      'Interactive collaborative problem-solving',
      'Real-time team alignment exercises',
      'Action planning and commitment',
      'Customized team development roadmap',
    ],
    benefits: [
      'Strengthens cohesion and trust',
      'Aligns team practices with goals',
      'Improves communication',
      'Creates actionable plan',
    ],
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Workshops',
    subtitle: 'Leadership Lab',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
    badge: null,
    duration: '2-4 hours',
    format: 'In-person & Virtual',
    capacity: 'Flexible group sizes',
    features: [
      'Targeted skill development',
      'Hands-on practice',
      'Expert facilitation',
      'Customizable content',
      'Interactive learning',
    ],
    benefits: [
      'Builds competencies',
      'Immediate application',
      'Flexible delivery',
      'Measurable improvement',
    ],
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Pop-Up Leadership Experiences',
    subtitle: 'LEAP Intensive',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    badge: null,
    duration: 'Varies',
    format: 'Surprise!',
    capacity: 'Custom',
    features: [
      'Unexpected leadership challenges',
      'Real-time problem-solving',
      'Memorable experiences',
      'Immediate application',
      'Spontaneous learning',
    ],
    benefits: [
      'Creates lasting impact',
      'Builds adaptability',
      'Enhances decision making',
      'Drives breakthroughs',
    ],
    color: 'from-amber-500 to-amber-600',
  },
];

/**
 * Default case studies for the about page
 */
export const DEFAULT_CASE_STUDIES: CaseStudy[] = [
  {
    title: 'Manufacturing Excellence',
    category: 'Operations',
    description:
      'A Fortune 500 manufacturing company transformed their operational efficiency through intentional practice methodology.',
    result: '40% improvement in team productivity',
  },
  {
    title: 'Leadership Transformation',
    category: 'Executive Development',
    description:
      'C-suite executives developed repeatable leadership behaviors that cascaded throughout the organization.',
    result: '85% leadership effectiveness score',
  },
  {
    title: 'Cultural Shift',
    category: 'Organization Change',
    description:
      'A healthcare system implemented practice-based culture change across 12 facilities.',
    result: '92% employee engagement increase',
  },
];

/**
 * Default books for the resources page
 */
export const DEFAULT_BOOKS: Book[] = [
  {
    title: 'The Practice of Excellence',
    subtitle: 'Building Repeatable Success Through Intentional Action',
    description:
      'Discover how to transform your daily actions into powerful patterns that create lasting excellence. This comprehensive guide walks you through the LEAP methodology with practical exercises and real-world examples.',
    coverUrl: null,
    price: '$24.99',
    purchaseLink: '#',
  },
];

/**
 * Industries served data for the about page
 */
export const DEFAULT_INDUSTRIES: Industry[] = [
  {
    name: 'Technology',
    count: '150+',
    icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
  {
    name: 'Manufacturing',
    count: '80+',
    icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    name: 'Healthcare',
    count: '120+',
    icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  },
  {
    name: 'Education',
    count: '200+',
    icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222',
  },
  {
    name: 'Finance',
    count: '90+',
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  {
    name: 'Consulting',
    count: '110+',
    icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  },
];

/**
 * Default statistics for the solutions page banner
 */
export const DEFAULT_STATS: Statistic[] = [
  { value: '750+', label: 'Organizations Served' },
  { value: '10,000+', label: 'Leaders Trained' },
  { value: '25+', label: 'Industries' },
  { value: '98%', label: 'Client Satisfaction' },
];

/**
 * Default social links for the footer
 */
export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: 'twitter', url: 'https://twitter.com/leapassociation', label: 'Follow us on Twitter' },
  { platform: 'linkedin', url: 'https://linkedin.com/company/leapassociation', label: 'Connect with us on LinkedIn' },
  { platform: 'email', url: 'mailto:service@leapassociation.com', label: 'Email us' },
];
