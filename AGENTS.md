# AGENTS.md — AI Agent Guide for LEAP Association

## Project Overview

LEAP Association is a web application for **LEAP Performance Solutions**, a leadership development organization. The site provides content about their methodology, an interactive HATS assessment tool, event registration, appointment booking, blog/video resources, and an admin dashboard.

**Live site**: `https://leapassociation.com`
**Repository**: `https://github.com/dev-maus/leap-association`

---

## Architecture

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | **Astro 5** (SSG mode) | Static site generation with file-based routing |
| Interactive UI | **React 18** (islands) | Client-side interactivity via `client:load` hydration |
| CMS | **Sanity** (headless) | Content management with GROQ queries at build time |
| Backend | **Supabase** | Auth (magic link + password), PostgreSQL database, edge functions, file storage |
| Styling | **Tailwind CSS 3** | Utility-first CSS with custom brand tokens |
| Language | **TypeScript** (strict mode) | Full type safety throughout |
| Bot Protection | **hCaptcha** | Captcha verification on assessment submissions |

### Rendering Strategy

All pages are **statically generated at build time** (`output: 'static'` in Astro config). There is no server-side rendering at request time. React components ("islands") hydrate on the client where interactivity is needed via Astro's `client:load` directive.

### Base URL

The site uses a configurable base URL (`/leap-association/` for GitHub Pages, `/` for production). All internal URLs must use the `createPageUrl()` or `buildUrl()` helpers from `src/lib/utils.ts` — never hardcode paths.

---

## Business Domain

### LEAP Framework

LEAP is an acronym for the four performance dimensions:
- **L**eadership = Habits + Talents
- **E**ffectiveness = Habits + Abilities
- **A**ccountability = Abilities + Skills
- **P**roductivity = Habits + Skills

### HATS Assessment

HATS is an acronym for the four assessment categories:
- **H**abits — Repeatable behaviors
- **A**bilities — Learned competencies
- **T**alents — Natural strengths
- **S**kills — Technical proficiencies

The assessment comes in two modes: **individual** (8 questions, 2 per category) and **team** (12 questions, 3 per category). Each question scores 1–4 points. Category scores feed into LEAP dimension scores via the formulas above.

Scoring logic lives in `src/lib/assessmentScoring.ts` with comprehensive tests in `src/lib/__tests__/assessmentScoring.test.ts`.

---

## Project Structure

```
leap-association/
├── src/
│   ├── assets/images/          # Optimized images (AVIF format)
│   ├── components/
│   │   ├── common/             # Shared components (Breadcrumbs, CTAButtons)
│   │   ├── islands/            # React components hydrated client-side
│   │   ├── layout/             # Header, Footer, Head (Astro)
│   │   ├── sections/           # Page sections (HeroSection, LEAPFramework, CTASection)
│   │   └── ui/                 # Primitives (Button, Card, Input, Label, etc.)
│   ├── layouts/
│   │   └── Layout.astro        # Base HTML layout with scroll reveal + auth redirect
│   ├── lib/                    # Shared utilities and data layer
│   │   ├── __tests__/          # Vitest unit tests
│   │   ├── assessmentScoring.ts    # HATS/LEAP score calculation (pure functions)
│   │   ├── assessmentStorage.ts    # localStorage wrapper for assessment data
│   │   ├── booking.ts              # Booking URL builder with user prepopulation
│   │   ├── defaultContent.ts       # Fallback content when CMS is unavailable
│   │   ├── sanity.ts               # Sanity client, image URL builder, file URL builder
│   │   ├── supabase.ts             # Supabase client, entity API, auth helpers
│   │   ├── useAuth.ts              # React hook for auth state management
│   │   ├── userStorage.ts          # localStorage wrapper for user details
│   │   ├── utils.ts                # URL helpers (createPageUrl, buildUrl, getAssetUrl)
│   │   └── validation.ts           # Email and phone validation
│   ├── middleware.ts           # Security headers (CSP, HSTS, X-Frame-Options)
│   ├── pages/                  # File-based routing (see Routes section)
│   └── styles/
│       └── global.css          # Tailwind imports, animations, scroll reveal system
├── sanity/
│   ├── schemaTypes/            # 22 Sanity document/object schemas
│   ├── scripts/                # Content population and migration scripts
│   ├── sanity.config.ts        # Sanity Studio configuration
│   └── sanity.cli.ts           # Sanity CLI configuration
├── supabase/
│   ├── functions/              # Deno edge functions
│   │   ├── check-user-exists/      # Email existence check
│   │   ├── get-assessment-results/ # Assessment retrieval
│   │   └── verify-captcha-and-create/ # Captcha verification + user/assessment creation
│   └── migrations/             # SQL migration files (run in order 000–003)
├── public/                     # Static assets (favicon, logo, images)
├── astro.config.mjs            # Astro config (SSG, Tailwind, React, sitemap, compress)
├── tailwind.config.mjs         # Brand colors, fonts, content paths
├── tsconfig.json               # Extends astro/tsconfigs/strict
├── postcss.config.cjs          # PostCSS with Tailwind + Autoprefixer
└── package.json                # Dependencies and npm scripts
```

---

## Routes (File-Based)

| Path | Page | Notes |
|------|------|-------|
| `/` | Home | Hero, LEAP Framework, CTA |
| `/about` | About LEAP | Team, case studies, industries |
| `/solutions` | Solutions | Service offerings |
| `/who-we-serve` | Audiences | Target markets |
| `/leadership` | Leadership dimension | LEAP L detail |
| `/effectiveness` | Effectiveness dimension | LEAP E detail |
| `/accountability` | Accountability dimension | LEAP A detail |
| `/productivity` | Productivity dimension | LEAP P detail |
| `/practice` | Practice hub | Assessment entry point |
| `/practice/individual` | Individual assessment | HATS assessment flow |
| `/practice/team` | Team assessment | Team HATS assessment flow |
| `/practice/results` | Assessment results | Score display + PDF export |
| `/practice/team-debrief` | Team debrief | Post-assessment form |
| `/events` | Signature events | Event listings |
| `/events/lounge` | LEAP Lounge | Recurring event |
| `/services/training` | Training | Training services |
| `/services/coaching` | Coaching | Coaching services |
| `/services/consulting` | Consulting | Consulting services |
| `/services/certification` | Certification | Certification program |
| `/services/keynotes` | Keynotes | Speaking engagements |
| `/resources` | Resources hub | Blog, videos, downloads, books |
| `/resources/blog/[slug]` | Blog post | Dynamic route from Sanity |
| `/resources/video/[id]` | Video page | Dynamic route from Sanity |
| `/schedule` | Schedule a call | Calendar booking |
| `/contact` | Contact | Contact form |
| `/search` | Search | Site-wide search |
| `/faq` | FAQ | Frequently asked questions |
| `/auth/login` | Login | Email + password login |
| `/auth/magic-link` | Magic link | Passwordless login |
| `/auth/callback` | Auth callback | Handles auth redirects |
| `/auth/forgot-password` | Forgot password | Password reset request |
| `/auth/reset-password` | Reset password | New password form |
| `/admin` | Admin dashboard | Protected, requires admin role |
| `/404` | Not found | Custom 404 page |

---

## Component Architecture

### Astro Components (`.astro`)

Server-rendered at build time. Used for:
- **Layout** (`Layout.astro`) — Base HTML shell with scroll reveal initialization
- **Page sections** (`HeroSection`, `LEAPFramework`, `CTASection`)
- **UI primitives** (`Button`, `Card`, `Input`, `Label`, `Textarea`, `Accordion`, `Badge`)
- **Layout parts** (`Header`, `Footer`, `Head` — includes SEO meta, structured data, fonts)

### React Islands (`.tsx` in `components/islands/`)

Client-hydrated with `client:load`. Used for anything requiring:
- User interaction (forms, assessments)
- Client-side state (auth status, search)
- Browser APIs (localStorage, navigation)

Key islands:
- `AssessmentFlow` — Full HATS assessment questionnaire (largest component, ~1000 lines)
- `AssessmentResults` — Score visualization with PDF export (jsPDF)
- `AdminDashboard` — Protected admin interface
- `LoginForm`, `MagicLinkForm`, `ForgotPasswordForm`, `ResetPasswordForm` — Auth forms
- `ContactForm`, `NewsletterForm`, `TeamDebriefForm` — Lead capture forms
- `CalendarBooking` — Appointment scheduling
- `EventRegistration` — Event signup
- `SearchResults` — Site-wide search
- `AuthStatusIndicator` — Header auth state display
- `MobileNav` — Responsive navigation
- `SplashScreen` — Loading animation

### UI Components

There are duplicate `Button` components — `ui/Button.astro` (Astro, server-rendered) and `ui/button.tsx` (React, for use in islands). Similarly, `common/CTAButtons.tsx` is a React component for CTA button groups.

---

## Data Layer

### Sanity CMS

**Client**: `src/lib/sanity.ts` — Creates a Sanity client with CDN enabled. Returns `null` if `SANITY_PROJECT_ID` is not configured (graceful degradation).

**Image/file URLs**: Use `urlFor(source)` for images and `urlForFile(file)` for file assets. Both handle various Sanity reference formats.

**Fallback content**: `src/lib/defaultContent.ts` provides hardcoded defaults for all CMS-driven content (events, case studies, books, industries, stats, social links). Pages first try Sanity, then fall back to defaults.

**Schemas** (22 types in `sanity/schemaTypes/`):
- `siteSettings` — Global configuration
- `siteContent` — Editable text blocks
- `hero` — Hero sections
- `leapFramework` — LEAP Framework cards
- `service` — Service offerings
- `faq` — FAQ items
- `testimonial` — Client testimonials
- `blogPost` — Blog articles (with slugs for routing)
- `video` — Video content
- `download` — Downloadable resources
- `book` — Books
- `signatureEvent` — Events
- `teamMember` — Team members
- `caseStudy` — Case studies
- `assessmentQuestion` — Assessment questions
- `assessmentSettings` — Assessment configuration
- `socialLink` — Social media links
- `organizationValues` — Organization values
- `thrivingPillar` — Thriving pillar content
- `corePhilosophy` — Core philosophy content
- `industryServed` — Industries served
- `statistic` — Statistics/metrics
- `practiceResource` — Practice resources

**GROQ queries** are written inline in Astro page frontmatter. Pattern:

```typescript
const data = sanity ? await sanity.fetch(`*[_type == "blogPost"] | order(publishedAt desc)`) : [];
```

### Supabase

**Client**: `src/lib/supabase.ts` — Creates a Supabase client. If env vars are missing, creates a mock client that returns graceful errors (prevents crashes during development).

**Entity API**: A generic CRUD API (`entities.*`) wrapping Supabase queries:
```typescript
entities.AssessmentResponse.list(orderBy, limit)
entities.AssessmentResponse.filter(filters, orderBy, limit)
entities.AssessmentResponse.get(id)
entities.AssessmentResponse.create(record)
entities.AssessmentResponse.update(id, updates)
entities.AssessmentResponse.delete(id)
entities.UserProfile.listPaginated({ page, pageSize, orderBy, search, searchColumns })
```

Available entities: `User`, `UserProfile`, `AssessmentResponse`, `Availability`, `LEAPLunchRegistration`, `LEAPLunchSession`, `SignatureEventRegistration`, `SignatureEventSession`, `BlogPost`, `Video`, `Download`, `Book`, `SiteContent`, `Testimonial`.

**Auth**: `auth.me()`, `auth.signInWithPassword()`, `auth.signUp()`, `auth.signInWithMagicLink()`, `auth.logout()`, `auth.redirectToLogin()`.

**Database tables** (defined in `supabase/migrations/`):
- `user_profiles` — id (UUID, FK to auth.users), email, full_name, company, role, phone, user_role (`'user'`|`'admin'`), timestamps
- `assessment_responses` — id (UUID), user_id (FK), assessment_type (`'individual'`|`'team'`), scores (JSONB), habit/ability/talent/skill_score (INT), answers (JSONB), timestamps

**RLS policies**: Users can read/write their own data. Admins can read/write all data. Service role (edge functions) can insert freely. Users cannot change their own `user_role`.

**Edge functions** (Deno, in `supabase/functions/`):
- `verify-captcha-and-create` — Verifies hCaptcha, creates or finds user, saves assessment response. Includes rate limiting (20 req/min).
- `check-user-exists` — Checks if email is already registered
- `get-assessment-results` — Retrieves assessment results

### Client-Side Storage

- `assessmentStorage.ts` — Manages assessment state in `localStorage` (key: `leap_assessment_data`): submitted email, response ID, call scheduled flag, submission timestamp.
- `userStorage.ts` — Manages user details in `localStorage` (key: `leap_user_details`): name, email, company, role, phone. Syncs from Supabase on auth state change. Used to prepopulate forms.

---

## Styling

### Brand Tokens (Tailwind)

```
primary:      #76648F (purple)
primary-dark: #5A4A6F
primary-light:#8B7BA8
accent:       #D97706 (amber)
accent-light: #F59E0B
ink:          #0F172A (near-black text)
```

### Fonts

- **Body**: Inter (sans-serif) — `font-sans`
- **Headings**: Outfit (display) — `font-display`
- Loaded via Google Fonts in `Head.astro`

### CSS Classes (global.css)

- **Layout**: `.section`, `.section-py`, `.section-py-sm`, `.section-py-lg`
- **Buttons**: `.btn-primary`, `.btn-secondary`, `.btn-outline`
- **Animations**: `.animate-fadeUp`, `.animate-fadeIn`, `.animate-fadeInLeft`, `.animate-fadeInRight`, `.animate-scaleIn`, `.animate-float`, `.animate-pulse-soft`
- **Scroll reveal**: `.reveal`, `.reveal-left`, `.reveal-right`, `.reveal-scale` (triggered by IntersectionObserver in `Layout.astro`; add `.show` to activate)
- **Stagger**: `.stagger-1` through `.stagger-6` (transition delays for sequential reveals)
- **Gradient text**: `.gradient-text` (amber gradient)
- All animations respect `prefers-reduced-motion: reduce`

---

## Environment Variables

```env
# Sanity CMS (required for content)
SANITY_PROJECT_ID=<project-id>
SANITY_DATASET=production
SANITY_API_VERSION=2025-01-01

# Supabase (required for auth, database, edge functions)
PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Site (used for auth redirects, canonical URLs)
PUBLIC_SITE_URL=https://leapassociation.com

# Base URL (configured in astro.config.mjs, not .env)
# BASE_URL=/leap-association/   (GitHub Pages)
# BASE_URL=/                    (production)
```

`PUBLIC_` prefix makes variables available client-side. Non-prefixed variables are server/build-time only. The app gracefully degrades when Sanity or Supabase env vars are missing (uses fallback content and mock client).

---

## Security

### Middleware (`src/middleware.ts`)

Adds security headers to all responses:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- CSP allowing Supabase, hCaptcha, Google Fonts
- HSTS in production
- `upgrade-insecure-requests` in production only

### Auth Flow

1. **Magic link** (primary): User enters email → Supabase sends magic link → User clicks → `AuthCallback` handles token → redirects to destination
2. **Password**: Traditional email/password sign-in
3. **Auto-creation**: First-time assessment submitters get an auto-confirmed auth account (via edge function with service role)
4. Auth tokens landing on non-callback pages are auto-redirected to `/auth/callback` (script in `Layout.astro`)

### Role System

- `user` — Default role, can access own data
- `admin` — Can access all data and the admin dashboard
- Role stored in `user_profiles.user_role`; enforced by RLS policies and a DB trigger that prevents self-promotion

---

## Coding Conventions

### General

- **Pure functions** preferred — modify return values, not inputs or global state
- **Strict TypeScript** — use specific types, avoid `any` where possible
- **DRY and KISS** — avoid unnecessary complexity and redundancy
- **Minimal code** — do not produce more code than necessary

### Astro Pages

Standard page pattern:

```astro
---
import Layout from '../layouts/Layout.astro';
import Head from '../components/layout/Head.astro';
import Header from '../components/layout/Header.astro';
import Footer from '../components/layout/Footer.astro';

// Fetch CMS data at build time
const data = sanity ? await sanity.fetch(`*[_type == "..."]`) : [];
---

<Layout>
  <Head slot="head" title="Page Title" />
  <Header />
  <main id="main-content">
    <!-- Page content -->
  </main>
  <Footer />
</Layout>
```

### React Islands

- Always placed in `src/components/islands/`
- Use `client:load` directive in Astro templates
- Access Supabase via `supabaseClient` from `src/lib/supabase.ts`
- Use `useAuth()` hook for auth state
- Use `lucide-react` for icons

### URL Handling

Never hardcode URLs. Always use helpers:
```typescript
import { createPageUrl, buildUrl, getAssetUrl } from '../lib/utils';
createPageUrl('Home')       // → /leap-association/
buildUrl('/auth/login')     // → /leap-association/auth/login
getAssetUrl('logo.png')     // → /leap-association/logo.png
```

### Error Handling

- Sanity client returns `null` when unconfigured — always check before using
- Supabase mock client returns `{ data: null, error: { message: 'Supabase not configured' } }`
- Edge functions include rate limiting and request timeouts
- localStorage operations wrapped in try/catch with `typeof window !== 'undefined'` guards

---

## NPM Scripts

```bash
npm run dev       # Start Astro dev server (localhost:4321)
npm run build     # Build static site to dist/
npm run preview   # Preview production build locally
npm run astro     # Run Astro CLI
```

Sanity Studio (from `sanity/` directory):
```bash
npm run dev       # Start Sanity Studio (localhost:3333)
npm run build     # Build Studio for deployment
npm run deploy    # Deploy Studio to sanity.io
```

---

## Testing

- **Framework**: Vitest
- **Location**: `src/lib/__tests__/`
- **Coverage**: Assessment scoring logic (`assessmentScoring.test.ts`) with tests for category score calculation, LEAP dimension formulas, max score validation for both individual and team assessments, and document example validation

---

## Deployment

- **Output**: Static files (`dist/`)
- **Current hosting**: GitHub Pages (`base: '/leap-association/'`)
- **Production target**: Any static host (Vercel, Netlify, Cloudflare Pages)
- **Sanity Studio**: Deployed separately via `npm run deploy` from `sanity/`
- **Supabase Edge Functions**: Deployed via `supabase functions deploy <name>`
- **Database migrations**: Run via `supabase db push` or manually in SQL Editor (files in `supabase/migrations/` numbered 000–003)

---

## Key Dependencies

| Package | Purpose |
|---------|---------|
| `astro` | Static site generator framework |
| `@astrojs/react` | React integration for Astro islands |
| `@astrojs/tailwind` | Tailwind CSS integration |
| `@astrojs/sitemap` | Auto-generates sitemap.xml |
| `astro-compress` | Compresses JS, CSS, HTML, SVG in build |
| `@sanity/client` | Sanity CMS client for GROQ queries |
| `@sanity/image-url` | Sanity image URL builder |
| `@supabase/supabase-js` | Supabase client (auth, DB, storage) |
| `@hcaptcha/react-hcaptcha` | hCaptcha React component |
| `lucide-react` | Icon library for React components |
| `date-fns` | Date formatting and manipulation |
| `jspdf` | Client-side PDF generation (assessment results) |
| `marked` | Markdown to HTML rendering |
| `tailwindcss` | Utility-first CSS framework |

---

## Common Tasks

### Adding a new page
1. Create `src/pages/<name>.astro`
2. Follow the standard page pattern (Layout, Head, Header, Footer)
3. Add the route to `createPageUrl()` map in `src/lib/utils.ts` if needed for programmatic navigation
4. Add navigation link in `Header.astro` and/or `MobileNav.tsx`

### Adding a new React island
1. Create `src/components/islands/<Name>.tsx`
2. Use in an Astro page with `<Name client:load />`
3. Import Supabase, auth, and storage utilities from `src/lib/`

### Adding a new Sanity schema
1. Create `sanity/schemaTypes/<name>.ts`
2. Export and register in `sanity/schemaTypes/index.ts`
3. Deploy schema via `npx sanity schema deploy` from `sanity/`
4. Add corresponding fallback content in `src/lib/defaultContent.ts`

### Adding a new Supabase table
1. Create a migration file in `supabase/migrations/` (increment the number prefix)
2. Include table definition, indexes, RLS policies
3. Add an entity API entry in `src/lib/supabase.ts` → `entities` object
4. Run migration via `supabase db push`

### Modifying assessment scoring
1. Update formulas in `src/lib/assessmentScoring.ts`
2. Update and run tests in `src/lib/__tests__/assessmentScoring.test.ts`
3. Verify the AssessmentFlow and AssessmentResults components still work correctly
