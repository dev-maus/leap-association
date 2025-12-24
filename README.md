# LEAP Association - Astro + Sanity + Supabase

A complete migration of the LEAP Performance Solutions web application from React/Vite to Astro with Sanity CMS and Supabase backend.

## Architecture

- **Frontend**: Astro (SSG/SSR hybrid) with React Islands for interactivity
- **CMS**: Sanity Studio for content management
- **Backend**: Supabase for authentication, database, and file storage
- **Styling**: TailwindCSS with custom brand colors

## Features

- ✅ 38+ pages migrated
- ✅ 14 Sanity content schemas
- ✅ HATS Assessment flow with PDF export
- ✅ Calendar booking system
- ✅ Event registration
- ✅ Admin dashboard
- ✅ Site-wide search
- ✅ Authentication system
- ✅ Responsive design

## Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Sanity account
- Supabase project

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01

PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

PUBLIC_SITE_URL=https://leapassociation.com
```

3. Initialize Sanity Studio:
```bash
cd sanity
npm create sanity@latest -- --template clean --create-project "LEAP Association" --dataset production
```

4. Add schemas to Sanity:
Copy the schemas from `sanity/schemas/` to your Sanity Studio's schema directory.

5. Run development server:
```bash
npm run dev
```

## Project Structure

```
leap-association/
├── src/
│   ├── assets/          # Images and static assets
│   ├── components/
│   │   ├── layout/      # Header, Footer, Head
│   │   ├── sections/    # HeroSection, LEAPFramework, etc.
│   │   ├── ui/          # Button, Card, Input, etc.
│   │   ├── islands/     # React components (client:load)
│   │   └── common/      # CTAButtons, Breadcrumbs
│   ├── layouts/         # Layout.astro
│   ├── lib/
│   │   ├── sanity.ts    # Sanity client
│   │   ├── supabase.ts  # Supabase client & entity APIs
│   │   └── utils.ts     # Utility functions
│   ├── pages/           # Astro pages (file-based routing)
│   └── styles/
│       └── global.css   # Global styles
├── sanity/
│   └── schemas/         # Sanity content schemas
└── public/              # Static files
```

## Key Pages

- `/` - Home page
- `/about` - About LEAP Association
- `/solutions` - Service offerings
- `/practice` - HATS Assessment
- `/events` - Signature events
- `/schedule` - Book a strategy call
- `/resources` - Blog, videos, downloads
- `/contact` - Contact form
- `/admin` - Admin dashboard (protected)
- `/auth/login` - Authentication

## React Islands

Interactive components that use `client:load`:
- `ContactForm` - Lead capture
- `AssessmentFlow` - HATS assessment
- `CalendarBooking` - Appointment scheduling
- `EventRegistration` - Event signup
- `SearchResults` - Site search
- `AdminDashboard` - Admin interface
- `SplashScreen` - Loading animation

## Sanity Schemas

1. `siteSettings` - Global site configuration
2. `siteContent` - Editable text blocks
3. `hero` - Hero sections
4. `leapFramework` - LEAP Framework cards
5. `service` - Service offerings
6. `faq` - FAQ items
7. `testimonial` - Client testimonials
8. `blogPost` - Blog articles
9. `video` - Video content
10. `download` - Downloadable resources
11. `book` - Books
12. `signatureEvent` - Events
13. `teamMember` - Team members
14. `caseStudy` - Case studies

## Supabase Tables

- `leads` - Contact/assessment submissions
- `users` - User profiles
- `assessment_responses` - HATS assessment results
- `availability` - Calendar booking slots
- `leap_lunch_registrations` - Event registrations
- `signature_event_registrations` - Event registrations
- `blog_posts`, `videos`, `downloads`, `books` - Content (optional, can use Sanity)
- `site_content` - Editable content (optional, can use Sanity)
- `testimonials` - User testimonials

## Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

The site can be deployed to:
- Vercel (recommended for Astro)
- Netlify
- Cloudflare Pages
- Any static hosting service

Sanity Studio can be deployed separately or embedded in the main site.

## License

Proprietary - LEAP Association
