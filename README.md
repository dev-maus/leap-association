# LEAP Association - Astro + Sanity + Supabase

A modern web application for LEAP Performance Solutions built with Astro, Sanity CMS, and Supabase.

## Architecture

- **Frontend**: Astro (Static Site Generation/SSG) with React Islands for interactivity
- **CMS**: Sanity Studio for content management
- **Backend**: Supabase for authentication, database, and file storage
- **Styling**: TailwindCSS with custom brand colors
- **Type Safety**: TypeScript throughout the codebase

### Rendering Mode

This project uses **Static Site Generation (SSG)**, meaning:
- All pages are pre-rendered at build time into static HTML files
- Pages are served as static files (no server-side rendering at request time)
- React components are hydrated on the client only where needed (via `client:load` directives)
- This provides fast page loads and excellent SEO, while still allowing interactive React components where required

**Note**: Astro is a server-side framework that generates static files. It's not a client-side-only framework like traditional SPAs. The site is built server-side, then served as static HTML with optional client-side JavaScript for interactivity.

## Platforms & Technologies

This solution uses the following platforms and technologies:

1. **Astro** - Static site generator and web framework (server-side rendering at build time, not client-side)
2. **Sanity** - Headless CMS for content management
3. **Supabase** - Backend-as-a-Service (authentication, PostgreSQL database, edge functions)
4. **React** - UI library for interactive components
5. **TypeScript** - Type-safe JavaScript
6. **Tailwind CSS** - Utility-first CSS framework
7. **Node.js** - JavaScript runtime environment
8. **hCaptcha** - Bot protection and spam prevention

## Features

- ✅ 38+ pages
- ✅ 14 Sanity content schemas
- ✅ HATS Assessment flow with PDF export
- ✅ Calendar booking system
- ✅ Event registration
- ✅ Admin dashboard
- ✅ Site-wide search
- ✅ Authentication system
- ✅ Responsive design

## Local Development Setup

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **npm** (comes with Node.js) or **yarn**
- **Git** ([Download](https://git-scm.com/))

You'll also need accounts for:
- **Sanity** - [Sign up](https://www.sanity.io/)
- **Supabase** - [Sign up](https://supabase.com/)

### Step 1: Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd leap-association

# Install root project dependencies
npm install

# Install Sanity Studio dependencies
cd sanity
npm install
cd ..
```

### Step 2: Set Up Supabase

1. **Create a Supabase Project**:
   - Go to [Supabase Dashboard](https://app.supabase.com/)
   - Click "New Project"
   - Choose your organization, name your project, set a database password, and select a region
   - Wait for the project to be provisioned

2. **Get Your Supabase Credentials**:
   - In your Supabase project dashboard, go to **Settings** → **API**
   - Copy the following values:
     - **Project URL** (under "Project URL")
     - **anon/public key** (under "Project API keys")

3. **Run Database Migrations**:
   ```bash
   # Install Supabase CLI (if not already installed)
   npm install -g supabase
   
   # Link your local project to your Supabase project
   supabase link --project-ref <your-project-ref>
   
   # Run migrations to set up database tables
   supabase db push
   ```
   
   Alternatively, you can run the SQL migrations manually:
   - Go to **SQL Editor** in your Supabase dashboard
   - Run the SQL files from `supabase/migrations/` in order:
     - `000_create_assessment_responses.sql`
     - `001_create_user_profiles.sql`
     - `002_allow_public_read_assessment_responses.sql`

4. **Set Up Edge Functions** (Optional, for production features):
   - The project includes edge functions in `supabase/functions/`
   - Deploy them using: `supabase functions deploy <function-name>`

### Step 3: Set Up Sanity

1. **Create a Sanity Project**:
   - Go to [Sanity Manage](https://www.sanity.io/manage)
   - Click "Create project"
   - Name it "LEAP Association" (or your preferred name)
   - Choose a dataset name (e.g., "production" or "development")

2. **Get Your Sanity Credentials**:
   - In your Sanity project dashboard, go to **API** → **CORS origins**
   - Note your **Project ID** (visible in the URL or project settings)
   - The dataset name you chose during creation

3. **Deploy Sanity Schemas**:
   ```bash
   cd sanity
   
   # Deploy schemas to your Sanity project
   npx sanity schema deploy
   
   # Or start the Sanity Studio locally to manage content
   npm run dev
   ```
   
   The schemas are already defined in `sanity/schemaTypes/`. The Studio will be available at `http://localhost:3333` when running `npm run dev` from the `sanity/` directory.

### Step 4: Configure Environment Variables

1. **Create `.env` file**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` with your credentials**:
   ```env
   # Sanity Configuration
   SANITY_PROJECT_ID=your_sanity_project_id
   SANITY_DATASET=production
   SANITY_API_VERSION=2025-01-01

   # Supabase Configuration
   PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Site Configuration
   PUBLIC_SITE_URL=http://localhost:4321
   ```

   Replace:
   - `your_sanity_project_id` with your Sanity Project ID
   - `production` with your Sanity dataset name (if different)
   - `https://your-project-ref.supabase.co` with your Supabase Project URL
   - `your_supabase_anon_key` with your Supabase anon/public key
   - `http://localhost:4321` is the default Astro dev server URL (adjust if needed)

### Step 5: Start Development Servers

**Option A: Run Astro and Sanity separately** (Recommended for development):

```bash
# Terminal 1: Start Astro development server
npm run dev

# Terminal 2: Start Sanity Studio (optional, for content management)
cd sanity
npm run dev
```

**Option B: Run only Astro** (if you're not editing content):

```bash
npm run dev
```

The Astro site will be available at:
- **Main site**: `http://localhost:4321`

The Sanity Studio will be available at:
- **Sanity Studio**: `http://localhost:3333` (when running from `sanity/` directory)

### Step 6: Verify Setup

1. **Check Astro Site**:
   - Open `http://localhost:4321` in your browser
   - You should see the LEAP Association homepage

2. **Check Sanity Studio**:
   - Open `http://localhost:3333` in your browser
   - You should see the Sanity Studio interface
   - You can create and manage content here

3. **Test Authentication**:
   - Navigate to `/auth/login` on your Astro site
   - Try creating an account or logging in (requires Supabase auth to be configured)

4. **Test Database Connection**:
   - Try submitting a form or assessment
   - Check your Supabase dashboard → **Table Editor** to verify data is being saved

## Troubleshooting

### Common Issues

**"Supabase configuration is missing" error**:
- Ensure your `.env` file has `PUBLIC_SUPABASE_URL` and `PUBLIC_SUPABASE_ANON_KEY` set correctly
- Restart your development server after changing `.env` files

**"Sanity project not found" error**:
- Verify your `SANITY_PROJECT_ID` in `.env` matches your Sanity project ID
- Check that your Sanity dataset name is correct

**Database connection errors**:
- Ensure your Supabase project is active and not paused
- Verify you've run the database migrations
- Check that Row Level Security (RLS) policies allow your operations

**Port already in use**:
- Astro defaults to port `4321`, Sanity Studio to `3333`
- Change ports in `astro.config.mjs` or `sanity/sanity.config.ts` if needed

### Getting Help

- Check the [Astro Documentation](https://docs.astro.build/)
- Review [Sanity Documentation](https://www.sanity.io/docs)
- Consult [Supabase Documentation](https://supabase.com/docs)

## Development Commands

### Root Project (Astro)

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run Astro CLI commands
npm run astro
```

### Sanity Studio

```bash
cd sanity

# Start Sanity Studio development server
npm run dev

# Build Sanity Studio for production
npm run build

# Deploy Sanity Studio
npm run deploy

# Deploy GraphQL API
npm run deploy-graphql
```

## Project Structure

```
leap-association/
├── src/
│   ├── assets/              # Images and static assets
│   ├── components/
│   │   ├── layout/         # Header, Footer, Head
│   │   ├── sections/       # HeroSection, LEAPFramework, etc.
│   │   ├── ui/             # Button, Card, Input, etc.
│   │   ├── islands/        # React components (client:load)
│   │   └── common/         # CTAButtons, Breadcrumbs
│   ├── layouts/            # Layout.astro
│   ├── lib/
│   │   ├── sanity.ts       # Sanity client configuration
│   │   ├── supabase.ts     # Supabase client & entity APIs
│   │   ├── assessmentScoring.ts  # Assessment calculation logic
│   │   ├── assessmentStorage.ts  # Local storage for assessments
│   │   ├── userStorage.ts  # User data storage
│   │   ├── booking.ts      # Calendar booking logic
│   │   ├── utils.ts        # Utility functions
│   │   └── validation.ts   # Form validation
│   ├── pages/              # Astro pages (file-based routing)
│   └── styles/
│       └── global.css      # Global styles and Tailwind imports
├── sanity/
│   ├── schemaTypes/        # Sanity content schemas
│   ├── scripts/            # Sanity scripts (e.g., populate content)
│   ├── sanity.config.ts    # Sanity Studio configuration
│   └── sanity.cli.ts       # Sanity CLI configuration
├── supabase/
│   ├── functions/          # Supabase Edge Functions
│   │   ├── check-user-exists/
│   │   ├── get-assessment-results/
│   │   └── verify-captcha-and-create/
│   └── migrations/         # Database migration SQL files
├── public/                 # Static files (favicon, logos, etc.)
├── astro.config.mjs        # Astro configuration
├── tailwind.config.mjs     # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
└── package.json            # Project dependencies
```

## Key Pages & Routes

- `/` - Home page
- `/about` - About LEAP Association
- `/solutions` - Service offerings
- `/practice` - HATS Assessment (individual and team)
- `/practice/results` - Assessment results
- `/practice/team-debrief` - Team debrief form
- `/events` - Signature events listing
- `/events/lounge` - LEAP Lounge events
- `/schedule` - Book a strategy call
- `/resources` - Resources index
- `/resources/blog/[slug]` - Blog post pages
- `/resources/video/[id]` - Video pages
- `/contact` - Contact form
- `/admin` - Admin dashboard (protected)
- `/auth/login` - User authentication
- `/auth/magic-link` - Passwordless login
- `/auth/forgot-password` - Password reset
- `/search` - Site-wide search

## React Islands (Interactive Components)

Interactive components that use `client:load` for hydration:
- `ContactForm` - Lead capture form
- `AssessmentFlow` - HATS assessment questionnaire
- `AssessmentResults` - Assessment results display
- `CalendarBooking` - Appointment scheduling
- `EventRegistration` - Event signup form
- `SearchResults` - Site search interface
- `AdminDashboard` - Admin interface
- `SplashScreen` - Loading animation
- `AuthCallback` - Authentication callback handler
- `LoginForm`, `MagicLinkForm`, `ForgotPasswordForm`, `ResetPasswordForm` - Auth forms
- `TeamDebriefForm` - Team assessment debrief

## Sanity Content Schemas

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
15. `assessmentQuestion` - Assessment questions
16. `assessmentSettings` - Assessment configuration

## Supabase Database Tables

- `user_profiles` - User profile information and roles
- `assessment_responses` - HATS assessment results
- `auth.users` - Supabase authentication users (managed by Supabase)

## Deployment

### Astro Site

The site can be deployed to:
- **Vercel** (recommended for Astro) - [Deploy Guide](https://docs.astro.build/en/guides/deploy/vercel/)
- **Netlify** - [Deploy Guide](https://docs.astro.build/en/guides/deploy/netlify/)
- **Cloudflare Pages** - [Deploy Guide](https://docs.astro.build/en/guides/deploy/cloudflare/)
- Any static hosting service that supports Node.js

### Sanity Studio

Sanity Studio can be deployed separately:
- Use `npm run deploy` from the `sanity/` directory
- Or embed it in the main Astro site
- Or host it on [sanity.io/manage](https://www.sanity.io/manage)

### Environment Variables for Production

Ensure all environment variables are set in your hosting platform:
- `SANITY_PROJECT_ID`
- `SANITY_DATASET`
- `SANITY_API_VERSION`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `PUBLIC_SITE_URL` (your production domain)

## License

Proprietary - LEAP Association
