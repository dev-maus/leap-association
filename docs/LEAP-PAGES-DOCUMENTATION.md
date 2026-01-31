# LEAP Performance Solutions - Page Documentation

Complete documentation for all major pages including layout, content, and structure.

---

## Table of Contents

1. [About LEAP](#1-about-leap)
2. [Solutions](#2-solutions)
3. [What's In Your Practice](#3-whats-in-your-practice)
4. [Signature Events](#4-signature-events)
5. [LEAP Lounge](#5-leap-lounge)
6. [Resources](#6-resources)
7. [Database Entities](#database-entities)
8. [Design System](#design-system)

---

## 1. About LEAP

**File:** `src/pages/About.jsx`
**Route:** `/About`
**Lines:** 592

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Hero Section (Gradient background)                     │
│  - Back to Home navigation                              │
│  - Title: "Excellence Through Intentional Practice"     │
├─────────────────────────────────────────────────────────┤
│  Mission / Vision / Values (3-column grid)              │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                 │
│  │ Mission │  │ Vision  │  │ Values  │                 │
│  └─────────┘  └─────────┘  └─────────┘                 │
├─────────────────────────────────────────────────────────┤
│  The Thriving Framework (Dark purple gradient)          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Repeatable  │  │  Reliable   │  │  Scalable   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
├─────────────────────────────────────────────────────────┤
│  Practice Philosophy (Side-by-side layout)              │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ "You Are Always  │  │   Visual/Stats   │            │
│  │   Practicing"    │  │     93% stat     │            │
│  └──────────────────┘  └──────────────────┘            │
├─────────────────────────────────────────────────────────┤
│  Meet Coach Aaron (Profile section)                     │
│  - Photo, credentials, NASA story                       │
│  - Leadership background (20+ years)                    │
├─────────────────────────────────────────────────────────┤
│  Trusted by Industry Leaders                            │
│  - 750+ organizations stat                              │
│  - 6 industry icons with counts                         │
│  - 3 scrollable case studies                            │
├─────────────────────────────────────────────────────────┤
│  Testimonials (Dynamic from database)                   │
│  - 4.9/5.0 rating from 500+ reviews                     │
├─────────────────────────────────────────────────────────┤
│  CTA: "Ready to Transform Your Practice?"               │
│  - Discover Button | Schedule Button                    │
└─────────────────────────────────────────────────────────┘
```

### Content Details

#### Mission, Vision, Values

| Section | Content |
|---------|---------|
| **Mission** | Transform through intentional practice |
| **Vision** | Every person and organization understands deliberate practice |
| **Values** | Intentionality over activity, practice over perfection |

#### The Thriving Framework

| Pillar | Description |
|--------|-------------|
| **Repeatable** | Systems that work consistently |
| **Reliable** | Dependable results every time |
| **Scalable** | Growth that maintains quality |

#### Practice Philosophy

- Core concept: "You Are Always Practicing"
- Flow: Practice Creates Patterns → Outcomes
- Key stat: **93%** of behavior is driven by unconscious patterns

#### Coach Aaron Profile

- **Name:** Aaron Wright Jr., BS, RCC
- **Title:** Executive Director
- **Background:** 20+ years in HR development
- **Signature Story:** The NASA Story

#### Industries Served (750+ Organizations)

| Industry | Count |
|----------|-------|
| Technology | 150+ |
| Manufacturing | 80+ |
| Healthcare | 120+ |
| Education | 200+ |
| Finance | 90+ |
| Consulting | 110+ |

#### Case Studies

1. **Manufacturing Excellence** - Operational transformation
2. **Leadership Transformation** - Executive development
3. **Cultural Shift** - Organization-wide change

### Data Sources

```javascript
// Testimonials from database
base44.entities.Testimonial.filter({
  status: 'approved',
  is_featured: true
}, '-created_date', 50)
```

---

## 2. Solutions

**File:** `src/pages/Solutions.jsx`
**Route:** `/Solutions`
**Lines:** 249

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Hero Section                                           │
│  - Breadcrumbs navigation                               │
│  - Title: "Transform Your Organization Through Practice"│
│  - CTAs: Schedule Consultation | Take Assessment        │
├─────────────────────────────────────────────────────────┤
│  Stats Banner (Dark gradient)                           │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │  750+   │ │ 10,000+ │ │   25+   │ │   98%   │       │
│  │  Orgs   │ │ Leaders │ │Industries│ │ Satisf. │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
├─────────────────────────────────────────────────────────┤
│  Solutions Grid (5 cards)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Consulting  │  │  Training   │  │  Coaching   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│       ┌─────────────┐  ┌─────────────┐                 │
│       │  Keynotes   │  │Certification│                 │
│       └─────────────┘  └─────────────┘                 │
├─────────────────────────────────────────────────────────┤
│  CTA: "Not Sure Where to Start?"                        │
│  - Schedule Call | Contact                              │
└─────────────────────────────────────────────────────────┘
```

### Five Solutions Offerings

#### 1. Consulting Services
- **Icon:** Briefcase (blue gradient)
- **Subtitle:** Strategic Organizational Transformation
- **Link:** `/Consulting`
- **Features:**
  - DRP/Operations Alignment
  - Leadership Culture Analysis
  - Performance Management
  - Organizational Readiness

#### 2. Leadership Training & Development
- **Icon:** GraduationCap (purple gradient)
- **Subtitle:** Build Leaders at Every Level
- **Link:** `/LeadershipTraining`
- **Features:**
  - Leading Self
  - Leading Others
  - Leading Projects
  - Leading Change

#### 3. Coaching
- **Icon:** Users (amber gradient)
- **Subtitle:** Personalized Leadership Development
- **Link:** `/Coaching`
- **Features:**
  - Executive Coaching
  - Leadership Coaching
  - Teen Coaching
  - Couples Coaching

#### 4. Keynotes & Speaking
- **Icon:** Mic (green gradient)
- **Subtitle:** Inspire Your Audience
- **Link:** `/Keynotes`
- **Features:**
  - Always LEAP Higher
  - Industry Keynotes
  - Custom Topics
  - Virtual & In-Person

#### 5. LEAP Certification Program
- **Icon:** Award (purple gradient)
- **Subtitle:** Become a Certified LEAP Practitioner
- **Link:** `/Certification`
- **Features:**
  - Practitioner Level
  - Advanced Level
  - Master Level
  - Ongoing Support

### Stats Displayed

| Metric | Value |
|--------|-------|
| Organizations Served | 750+ |
| Leaders Trained | 10,000+ |
| Industries | 25+ |
| Client Satisfaction | 98% |

---

## 3. What's In Your Practice

**File:** `src/pages/Practice.jsx`
**Route:** `/Practice` or `/What-In-Your-Practice`
**Lines:** 843

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Overview State (Default View)                          │
├─────────────────────────────────────────────────────────┤
│  Header: "What's In Your Practice?"                     │
├─────────────────────────────────────────────────────────┤
│  Two Assessment Cards                                   │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ Individual HATS™    │  │ Team HATS™          │      │
│  │ - 8 questions       │  │ - 12 questions      │      │
│  │ - 8 minutes         │  │ - 12 minutes        │      │
│  │ - Instant results   │  │ - Team insights     │      │
│  └─────────────────────┘  └─────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│  Why Practice Matters (Dark gradient)                   │
│  - HATS™ Framework explanation                          │
├─────────────────────────────────────────────────────────┤
│  LEAP Connection Section                                │
│  - Maps HATS™ to LEAP dimensions                        │
├─────────────────────────────────────────────────────────┤
│  Free Resources (4 downloadables)                       │
├─────────────────────────────────────────────────────────┤
│  Final CTA: "Ready to Discover What You're Practicing?" │
└─────────────────────────────────────────────────────────┘
```

### Multi-Step Flow States

| State | Purpose |
|-------|---------|
| `overview` | Main landing view with assessment options |
| `email` | Contact form collection |
| `type` | Assessment type selection |

### Assessment Options

#### Individual HATS™ Assessment
- **Icon:** Single user (blue)
- **Duration:** 8 questions, 8 minutes
- **Results:** Instant
- **Benefits:**
  - Personal practice pattern analysis
  - LEAP dimension mapping
  - Immediate actionable insights
  - Personalized growth recommendations

#### Team HATS™ Assessment
- **Icon:** Multiple users (amber)
- **Duration:** 12 questions, 12 minutes
- **Results:** Team insights
- **Benefits:**
  - Team-wide practice assessment
  - Collective behavior patterns
  - Organizational alignment insights
  - Team development roadmap

### HATS™ Framework

| Letter | Meaning | Description |
|--------|---------|-------------|
| **H** | Habits | Unconscious, automatic behaviors |
| **A** | Abilities | Conscious, repeatable actions |
| **T** | Talents | Natural gifts and strengths |
| **S** | Skills | Developed competencies |

### LEAP Dimensions

| Letter | Meaning | Description |
|--------|---------|-------------|
| **L** | Leadership | How you guide others |
| **E** | Effectiveness | Ability to produce results |
| **A** | Accountability | Taking ownership |
| **P** | Productivity | Consistent value creation |

### Free Resources Available

1. Individual HATS™ PDF
2. Team HATS™ PDF
3. Individual vs Team Comparison
4. LEAP Practice Guide

### Email Collection Form

| Field | Required |
|-------|----------|
| Full Name | Yes |
| Email | Yes |
| Company/Organization | No |
| Your Role | No |
| Phone Number | No |

### Data Flow

```javascript
// Creates Lead on form submission
await base44.entities.Lead.create({
  full_name: contactData.full_name,
  email: contactData.email,
  company: contactData.company,
  role: contactData.role,
  phone: contactData.phone,
  source: 'individual_assessment' // or 'team_assessment'
});
```

---

## 4. Signature Events

**File:** `src/pages/SignatureEvents.jsx`
**Route:** `/SignatureEvents`
**Lines:** 508

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Hero Section                                           │
│  - Title: "Signature Events"                            │
│  - Subtitle: "Transformative leadership experiences"    │
├─────────────────────────────────────────────────────────┤
│  Four Event Cards                                       │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ LEAP Through Lunch  │  │ Team Up             │      │
│  │ FREE - 60 min       │  │ Half-day            │      │
│  └─────────────────────┘  └─────────────────────┘      │
│  ┌─────────────────────┐  ┌─────────────────────┐      │
│  │ Workshops           │  │ Pop-Up Leadership   │      │
│  │ 2-4 hours           │  │ Varies              │      │
│  └─────────────────────┘  └─────────────────────┘      │
├─────────────────────────────────────────────────────────┤
│  CTA: "Ready to Transform Your Leadership Practice?"    │
│  - Schedule Call | Contact                              │
└─────────────────────────────────────────────────────────┘
```

### Four Signature Events

#### 1. LEAP Through Lunch
- **Icon:** Utensils
- **Badge:** FREE
- **Duration:** 60 minutes
- **Format:** At Your Location
- **Capacity:** Up to 5 participants
- **Price:** Complimentary lunch included

**Features:**
- Complimentary lunch for up to 5 participants
- Tailored content featuring 2 of LEAP's 28 competencies
- Hands-on interactive engagement
- Special development considerations
- Great for team building

**Benefits:**
- Tailored LEAP introduction
- Accelerates buy-in
- Brings focus to LEAP development series
- Customizable for training or coaching

**Special:** 100% Results Guaranteed

**Registration:** Uses `LEAPLunchRegistration` component

---

#### 2. Team Up
- **Icon:** Users
- **Duration:** Half-day
- **Format:** In-person
- **Event Type:** Team Alignment Workshop

**Features:**
- Comprehensive team practice assessment
- Interactive collaborative problem-solving
- Real-time team alignment exercises
- Action planning and commitment
- Customized team development roadmap

**Benefits:**
- Strengthens cohesion and trust
- Aligns team practices with goals
- Improves communication
- Creates actionable plan

---

#### 3. Workshops
- **Icon:** Lightbulb
- **Duration:** 2-4 hours
- **Format:** In-person & Virtual
- **Event Type:** Leadership Lab

**Features:**
- Targeted skill development
- Hands-on practice
- Expert facilitation
- Customizable content
- Interactive learning

**Benefits:**
- Builds competencies
- Immediate application
- Flexible delivery
- Measurable improvement

---

#### 4. Pop-Up Leadership Experiences
- **Icon:** Zap
- **Duration:** Varies
- **Format:** Surprise!
- **Event Type:** LEAP Intensive

**Features:**
- Unexpected leadership challenges
- Real-time problem-solving
- Memorable experiences
- Immediate application
- Spontaneous learning

**Benefits:**
- Creates lasting impact
- Builds adaptability
- Enhances decision making
- Drives breakthroughs

---

## 5. LEAP Lounge

**File:** `src/pages/LEAPLounge.jsx`
**Route:** `/LEAPLounge`
**Lines:** 602

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Hero Section                                           │
│  - Badge: "THE ULTIMATE EVENT EXPERIENCE"               │
│  - Title: "LEAP Lounge"                                 │
│  - Tagline: "Where leaders gather, teams transform..."  │
├─────────────────────────────────────────────────────────┤
│  Overview Cards (3 cards)                               │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐       │
│  │ What It Is  │ │Who It Serves│ │The Experience│       │
│  └─────────────┘ └─────────────┘ └─────────────┘       │
├─────────────────────────────────────────────────────────┤
│  Image Gallery                                          │
│  - Main space | Breakout spaces | Collaboration zones   │
├─────────────────────────────────────────────────────────┤
│  Premium Amenities (6 amenities)                        │
├─────────────────────────────────────────────────────────┤
│  Flexible Packages (3 tiers)                            │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Essentials │ │Professional│ │  Premium   │          │
│  │   $500     │ │  $1,200    │ │  $2,500    │          │
│  └────────────┘ └────────────┘ └────────────┘          │
├─────────────────────────────────────────────────────────┤
│  Upcoming Events (Calendar view)                        │
│  - LEAP Lunch sessions                                  │
│  - Signature Event sessions                             │
├─────────────────────────────────────────────────────────┤
│  CTA: "Ready to Transform Your Next Event?"             │
│  - Book Your Event | Schedule a Tour                    │
└─────────────────────────────────────────────────────────┘
```

### Overview Cards

| Card | Description |
|------|-------------|
| **What It Is** | Premium venue for leadership events and team building |
| **Who It Serves** | Executive teams, groups of 10-50 people |
| **The Experience** | Connection, deep work, breakthrough moments |

### Premium Amenities

| Amenity | Description |
|---------|-------------|
| High-Speed WiFi | Reliable connectivity throughout |
| Refreshments | Coffee, tea & snacks |
| AV Equipment | Projector & sound system |
| Sound System | Premium audio setup |
| Catering Ready | Full kitchen access |
| Flexible Space | Configurable layout |

### Pricing Packages

#### Essentials Package - $500
- **Color:** Blue
- **Duration:** 4 hours
- **Capacity:** 15 people
- **Includes:**
  - Private lounge access
  - High-speed WiFi
  - Coffee & tea service
  - Basic AV equipment
  - Whiteboard & markers
  - Comfortable seating

#### Professional Package - $1,200 (MOST POPULAR)
- **Color:** Purple
- **Duration:** 8 hours
- **Capacity:** 30 people
- **Includes:**
  - Everything in Essentials
  - Catered lunch & snacks
  - Premium AV setup
  - Breakout rooms
  - Event coordinator
  - Custom branding
  - Photo documentation

#### Premium Experience - $2,500
- **Color:** Amber
- **Duration:** Full day
- **Capacity:** 50 people
- **Includes:**
  - Everything in Professional
  - Dedicated event manager
  - Premium catering
  - Live entertainment
  - Professional photography
  - Team building activities
  - Custom LEAP workshop
  - Branded takeaways

### Upcoming Events Calendar

**Data Sources:**
```javascript
// LEAP Lunch Sessions
base44.entities.LEAPLunchSession.filter(
  { is_active: true }, 'date', 10
)

// Signature Event Sessions
base44.entities.SignatureEventSession.list('date', 10)
```

**Event Card Display:**
- Event image/thumbnail
- Title and type badge
- Date and time
- Location
- Registration status (spots left / fully booked)
- Paid status indicator

---

## 6. Resources

**File:** `src/pages/Resources.jsx`
**Route:** `/Resources`
**Lines:** 403

### Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│  Header                                                 │
│  - Title: "Resources"                                   │
│  - Subtitle: "Tools, insights, and inspiration..."      │
├─────────────────────────────────────────────────────────┤
│  Blog & Articles Section                                │
│  - Category filter buttons                              │
│  - Blog post cards grid                                 │
├─────────────────────────────────────────────────────────┤
│  Videos Section                                         │
│  - Video thumbnail cards (4-column grid)                │
├─────────────────────────────────────────────────────────┤
│  Downloads Section                                      │
│  - Downloadable resource cards                          │
├─────────────────────────────────────────────────────────┤
│  Books Section                                          │
│  - Book cover + details layout                          │
│  - Inspirational quote                                  │
├─────────────────────────────────────────────────────────┤
│  Newsletter Signup                                      │
│  - Title: "Your Best LEAP Yet"                          │
│  - Email input + Subscribe button                       │
└─────────────────────────────────────────────────────────┘
```

### Four Resource Categories

#### 1. Blog & Articles
- **Icon:** BookOpen
- **Features:**
  - Dynamic category filtering
  - "All Articles" + category buttons
  - Cards show: Title, Category tag, Excerpt, Published date, Read time

**Data Source:**
```javascript
base44.entities.BlogPost.filter(
  { status: 'published' },
  '-published_date',
  50
)
```

**Card Links:** `/BlogPost?slug={post.slug}`

---

#### 2. Videos
- **Icon:** Video (amber)
- **Display:** 4-column grid on large screens
- **Card Elements:**
  - Thumbnail image with play button overlay
  - Duration badge
  - Title and type tag

**Data Source:**
```javascript
base44.entities.Video.filter(
  { status: 'published' },
  '-created_date',
  50
)
```

**Card Links:** `/VideoPlayer?id={video.id}`

---

#### 3. Downloads
- **Icon:** Download
- **Card Elements:**
  - Title, Type, File size
  - Description
  - Configurable icon based on `item.icon` property
  - Download button → `file_url`

**Data Source:**
```javascript
base44.entities.Download.filter(
  { status: 'published' },
  '-created_date',
  50
)
```

---

#### 4. Books
- **Icon:** Book (amber)
- **Layout:** Two-column with cover image on left
- **Card Elements:**
  - Title, Subtitle, Description
  - Price (if available)
  - "Purchase Book" button → external link

**Inspirational Quote:**
> "Create a GREAT day and keep making GREAT even better!"

**Data Source:**
```javascript
base44.entities.Book.filter(
  { status: 'published' },
  '-created_date',
  50
)
```

---

### Newsletter Signup

- **Title:** "Your Best LEAP Yet"
- **Description:** Weekly insights and tools for leaders
- **Form:** Email input + Subscribe button
- **Privacy:** "No spam. Unsubscribe anytime."
- **Success State:** CheckCircle icon confirmation

**Submission:**
```javascript
await base44.entities.Lead.create({
  email: email,
  source: 'newsletter_signup'
});
```

---

## Database Entities

All pages interact with these Supabase tables via the `base44.entities` API:

| Entity | Table | Key Fields |
|--------|-------|------------|
| **Lead** | leads | email, source, full_name, company, role, phone |
| **BlogPost** | blog_posts | title, slug, category, excerpt, published_date, read_time, status |
| **Video** | videos | title, thumbnail_url, duration, type, status, video_url |
| **Download** | downloads | title, type, file_size, description, file_url, icon, status |
| **Book** | books | title, subtitle, description, cover_url, price, purchase_link, status |
| **Testimonial** | testimonials | name, role, company, content, impact, video_url, status, is_featured |
| **LEAPLunchSession** | leap_lunch_sessions | date, time, location, max_participants, current_registrations, is_active, featured_image_url |
| **SignatureEventSession** | signature_event_sessions | event_type, date, start_time, end_time, location, max_participants, current_registrations, is_paid, featured_image_url |

---

## Design System

### Primary Color Scheme

| Color | Hex Code | Usage |
|-------|----------|-------|
| Navy (Primary) | `#76648F` | Brand color, buttons, accents |
| Navy Light | `#8B7BA8` | Hover states, secondary elements |
| Amber/Gold | `#D97706` / `#F59E0B` | Highlights, CTAs, emphasis |

### Gradient Backgrounds

```css
/* Dark Purple (The Thriving Framework, sections) */
from-[#76648F] to-[#5A4A6F]

/* Slate (Page backgrounds) */
from-slate-50 to-white

/* Package Colors */
Blue: from-blue-500 to-blue-600
Purple: from-[#76648F] to-[#5A4A6F]
Amber: from-amber-500 to-amber-600
```

### Technology Stack

- **Framework:** React with Vite
- **Styling:** Tailwind CSS (utility-first)
- **Animations:** Framer Motion
- **Data Fetching:** React Query
- **Database:** Supabase via base44 SDK
- **Icons:** Lucide React
- **Date Formatting:** date-fns

### Navigation Structure

```javascript
const navLinks = [
  { name: 'Home', path: 'Home' },
  { name: 'About LEAP', path: 'About' },
  { name: 'Solutions', path: 'Solutions' },
  { name: "What's In Your Practice?", path: 'Practice' },
  { name: 'Signature Events', path: 'SignatureEvents' },
  { name: 'LEAP Lounge', path: 'LEAPLounge' },
  { name: 'Resources', path: 'Resources' },
];
```

### URL Pattern

Uses `createPageUrl()` utility:
```javascript
export function createPageUrl(pageName) {
  return '/' + pageName.replace(/ /g, '-');
}
```

---

## Summary Table

| Page | File | Route | Lines | Content Type | Data Source |
|------|------|-------|-------|--------------|-------------|
| About LEAP | About.jsx | /About | 592 | Informational | Static + DB (Testimonials) |
| Solutions | Solutions.jsx | /Solutions | 249 | Product showcase | Static |
| What's In Your Practice | Practice.jsx | /Practice | 843 | Interactive assessment | DB (Leads) |
| Signature Events | SignatureEvents.jsx | /SignatureEvents | 508 | Events listing | Static |
| LEAP Lounge | LEAPLounge.jsx | /LEAPLounge | 602 | Venue rental | DB (Events) |
| Resources | Resources.jsx | /Resources | 403 | Learning hub | DB (4 content types) |

---

*Documentation generated for LEAP Performance Solutions*
