import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

// Default content aligned with src/lib/defaultContent.ts so Studio and app stay in sync.
// client.create() writes to the published dataset (content is live immediately).

const DEFAULT_SOCIAL_LINKS = [
  { _type: 'socialLink' as const, platform: 'twitter' as const, url: 'https://twitter.com/leapassociation', label: 'Follow us on Twitter' },
  { _type: 'socialLink' as const, platform: 'linkedin' as const, url: 'https://linkedin.com/company/leapassociation', label: 'Connect with us on LinkedIn' },
  { _type: 'socialLink' as const, platform: 'email' as const, url: 'mailto:service@leapassociation.com', label: 'Email us' },
]

const DEFAULT_STATS = [
  { value: '750+', label: 'Organizations Served' },
  { value: '10,000+', label: 'Leaders Trained' },
  { value: '25+', label: 'Industries' },
  { value: '98%', label: 'Client Satisfaction' },
]

const DEFAULT_INDUSTRIES = [
  { name: 'Technology', count: '150+', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { name: 'Manufacturing', count: '80+', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { name: 'Healthcare', count: '120+', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
  { name: 'Education', count: '200+', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
  { name: 'Finance', count: '90+', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { name: 'Consulting', count: '110+', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
]

const DEFAULT_EVENTS = [
  { order: 0, title: 'LEAP Through Lunch', subtitle: 'Complimentary Introduction', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7', badge: 'FREE', badgeColor: 'bg-emerald-500', duration: '60 minutes', format: 'At Your Location', capacity: 'Up to 5 participants', price: 'Complimentary lunch included', features: ['Complimentary lunch for up to 5 participants', "Tailored content featuring 2 of LEAP's 28 competencies", 'Hands-on interactive engagement', 'Special development considerations', 'Great for team building'], benefits: ['Tailored LEAP introduction', 'Accelerates buy-in', 'Brings focus to LEAP development series', 'Customizable for training or coaching'], special: '100% Results Guaranteed', color: 'from-emerald-500 to-emerald-600' },
  { order: 1, title: 'Team Up', subtitle: 'Team Alignment Workshop', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', badge: null, badgeColor: undefined, duration: 'Half-day', format: 'In-person', capacity: 'Teams of any size', price: undefined, features: ['Comprehensive team practice assessment', 'Interactive collaborative problem-solving', 'Real-time team alignment exercises', 'Action planning and commitment', 'Customized team development roadmap'], benefits: ['Strengthens cohesion and trust', 'Aligns team practices with goals', 'Improves communication', 'Creates actionable plan'], special: undefined, color: 'from-blue-500 to-blue-600' },
  { order: 2, title: 'Workshops', subtitle: 'Leadership Lab', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z', badge: null, badgeColor: undefined, duration: '2-4 hours', format: 'In-person & Virtual', capacity: 'Flexible group sizes', price: undefined, features: ['Targeted skill development', 'Hands-on practice', 'Expert facilitation', 'Customizable content', 'Interactive learning'], benefits: ['Builds competencies', 'Immediate application', 'Flexible delivery', 'Measurable improvement'], special: undefined, color: 'from-purple-500 to-purple-600' },
  { order: 3, title: 'Pop-Up Leadership Experiences', subtitle: 'LEAP Intensive', icon: 'M13 10V3L4 14h7v7l9-11h-7z', badge: null, badgeColor: undefined, duration: 'Varies', format: 'Surprise!', capacity: 'Custom', price: undefined, features: ['Unexpected leadership challenges', 'Real-time problem-solving', 'Memorable experiences', 'Immediate application', 'Spontaneous learning'], benefits: ['Creates lasting impact', 'Builds adaptability', 'Enhances decision making', 'Drives breakthroughs'], special: undefined, color: 'from-amber-500 to-amber-600' },
]

const DEFAULT_CASE_STUDIES = [
  { title: 'Manufacturing Excellence', company: 'Operations', challenge: 'A Fortune 500 manufacturing company transformed their operational efficiency through intentional practice methodology.', solution: 'Same.', results: ['40% improvement in team productivity'] },
  { title: 'Leadership Transformation', company: 'Executive Development', challenge: 'C-suite executives developed repeatable leadership behaviors that cascaded throughout the organization.', solution: 'Same.', results: ['85% leadership effectiveness score'] },
  { title: 'Cultural Shift', company: 'Organization Change', challenge: 'A healthcare system implemented practice-based culture change across 12 facilities.', solution: 'Same.', results: ['92% employee engagement increase'] },
]

const DEFAULT_BOOKS = [
  { title: 'The Practice of Excellence', subtitle: 'Building Repeatable Success Through Intentional Action', description: 'Discover how to transform your daily actions into powerful patterns that create lasting excellence. This comprehensive guide walks you through the LEAP methodology with practical exercises and real-world examples.', coverUrl: null, price: '$24.99', purchaseLink: '#', status: 'published' as const },
]

async function populateDefaultContent() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required. Set it and run: npx tsx scripts/populate-default-content.ts')
    process.exit(1)
  }

  console.log('Starting to populate default content (published in Studio)...\n')

  try {
    // 1. Site Settings (matches defaultContent + schema: socialLinks array)
    console.log('Creating site settings...')
    await client.create({
      _type: 'siteSettings',
      title: 'LEAP Association',
      description: 'Empowering leaders to achieve breakthrough performance through the LEAP framework.',
      phone: '+1 (555) 123-4567',
      email: 'info@leapassociation.org',
      address: '123 Leadership Drive, Suite 100\nSan Francisco, CA 94105',
      socialLinks: DEFAULT_SOCIAL_LINKS,
    })
    console.log('✓ Site settings created\n')

    // 2. Site Content
    console.log('Creating site content...')
    const siteContentEntries = [
      {page: 'home', key: 'welcome', value: 'Welcome to LEAP Association', label: 'Welcome Message'},
      {page: 'about', key: 'mission', value: 'Our mission is to transform leadership through evidence-based practices.', label: 'Mission'},
      {page: 'about', key: 'vision', value: 'A world where every leader achieves their full potential.', label: 'Vision'},
      {page: 'contact', key: 'intro', value: 'Get in touch with us to learn more about our programs.', label: 'Contact Introduction'},
    ]

    for (const content of siteContentEntries) {
      await client.create({
        _type: 'siteContent',
        ...content,
      })
    }
    console.log(`✓ Created ${siteContentEntries.length} site content entries\n`)

    // 3. Hero Sections
    console.log('Creating hero sections...')
    const heroSections = [
      { page: 'home', heading: 'Transform Your Leadership', subheading: 'Discover the LEAP framework and unlock your full potential as a leader.', ctaLabel: 'Get Started' },
      { page: 'about', heading: 'Excellence Through Intentional Practice', subheading: "We help leaders and organizations build repeatable, reliable, scalable behaviors that create lasting excellence, not through theory, but through practice.", ctaLabel: 'Learn More' },
      { page: 'solutions', heading: 'Transform Your Organization Through Practice', subheading: 'From strategic consulting to leadership development, we provide comprehensive solutions that help organizations build repeatable, reliable, scalable practices that create excellence.', ctaLabel: 'Schedule a Consultation' },
      { page: 'events', heading: 'Transformative Leadership Experiences', subheading: "Join our signature events designed to deepen your practice and connect with other leaders committed to excellence.", ctaLabel: 'View Events' },
      { page: 'contact', heading: "Let's Start a Conversation", subheading: "Have a question about our services, speaking engagements, or LEAP programs? We're here to help.", ctaLabel: 'Get in Touch' },
      { page: 'resources', heading: 'Resources', subheading: 'Tools, insights, and inspiration to fuel your leadership journey', ctaLabel: 'Explore' },
      { page: 'practice', heading: "What's In Your Practice?", subheading: "You are always practicing something, whether you know it or not. The HATS™ Assessment reveals exactly what you're practicing and how it connects to excellence.", ctaLabel: 'Take the Assessment' },
      { page: 'faq', heading: 'Frequently Asked Questions', subheading: 'Find answers to common questions about our services, programs, and the LEAP Framework.', ctaLabel: 'Learn More' },
    ]

    for (const hero of heroSections) {
      await client.create({
        _type: 'hero',
        ...hero,
      })
    }
    console.log(`✓ Created ${heroSections.length} hero sections\n`)

    // 4. LEAP Framework (Tailwind gradient classes to match LEAPFramework.astro defaultItems)
    console.log('Creating LEAP framework entries...')
    const leapFramework = [
      { order: 0, letter: 'L', title: 'Leadership', subtitle: 'The practice of influence.', description: 'How you show up determines how others follow, align, and collaborate.', color: 'from-blue-500 to-blue-600' },
      { order: 1, letter: 'E', title: 'Effectiveness', subtitle: 'Meaningful Progress', description: 'Advancing the right priorities through disciplined, focused, and aligned execution.', color: 'from-emerald-500 to-emerald-600' },
      { order: 2, letter: 'A', title: 'Accountability', subtitle: 'Practice Accountability', description: 'Own commitments, follow through on priorities, and take responsibility for outcomes that drive organizational success.', color: 'from-purple-500 to-purple-600' },
      { order: 3, letter: 'P', title: 'Productivity', subtitle: 'Create Systems', description: 'Optimize rhythms and priorities that enable consistent progress and long-term organizational impact.', color: 'from-amber-500 to-amber-600' },
    ]
    for (const framework of leapFramework) {
      await client.create({
        _type: 'leapFramework',
        ...framework,
      })
    }
    console.log(`✓ Created ${leapFramework.length} LEAP framework entries\n`)

    // 5. Services (match solutions.astro defaultServices; training + consulting get subItems)
    console.log('Creating services...')
    const defaultServices = [
      { slug: 'consulting', title: 'Consulting Services', subtitle: 'Strategic Organizational Transformation', description: 'From power utility operations to leadership culture, we help organizations build practices that create measurable, sustainable results.', features: ['DRP/Operations Alignment', 'Leadership Culture Analysis', 'Performance Management', 'Organizational Readiness'], icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', subItems: [{ title: 'DRP Consulting', description: 'Disaster Recovery Planning and organizational resilience', slug: 'drp' }, { title: 'Readiness Assessment', description: 'Evaluate organizational readiness for change and growth', slug: 'readiness' }, { title: 'Team Alignment', description: 'Align teams around shared practices and goals', slug: 'team-alignment' }], ctaHeading: 'Ready to Transform Your Organization?', ctaDescription: 'Schedule a consultation to discuss how LEAP consulting can help your organization build excellence.' },
      { slug: 'training', title: 'Leadership Training & Development', subtitle: 'Build Leaders at Every Level', description: 'Comprehensive leadership development tracks, from leading yourself to leading organizational change. Build practices that create excellence.', features: ['Leading Self', 'Leading Others', 'Leading Projects', 'Leading Change'], icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222', subItems: [{ title: 'Leading Self', description: 'Master personal leadership practices', slug: 'leading-self' }, { title: 'Leading Others', description: 'Develop team leadership capabilities', slug: 'leading-others' }, { title: 'Leading Projects', description: 'Excel at project and program leadership', slug: 'leading-projects' }, { title: 'Leading Change', description: 'Drive organizational transformation', slug: 'leading-change' }], ctaHeading: 'Ready to Develop Your Leaders?', ctaDescription: "Discover which training program fits your organization's needs." },
      { slug: 'coaching', title: 'Coaching', subtitle: 'Personalized Leadership Development', description: "One-on-one coaching for executives, leaders, teens, and couples. Discover what you're practicing and build patterns that create the results you want.", features: ['Executive Coaching', 'Leadership Coaching', 'Teen Coaching', 'Couples Coaching'], icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
      { slug: 'keynotes', title: 'Keynotes & Speaking', subtitle: 'Inspire Your Audience', description: 'High-impact keynotes that challenge thinking, inspire action, and provide practical tools. From "Always LEAP Higher" to industry-specific talks.', features: ['Always LEAP Higher', 'Industry Keynotes', 'Custom Topics', 'Virtual & In-Person'], icon: 'M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z' },
      { slug: 'certification', title: 'LEAP Certification Program', subtitle: 'Become a Certified LEAP Practitioner', description: 'Join a growing network of certified practitioners bringing the LEAP Framework to organizations worldwide. Multiple certification levels available.', features: ['Practitioner Level', 'Advanced Level', 'Master Level', 'Ongoing Support'], icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
    ]
    for (const service of defaultServices) {
      const { slug, subItems, ctaHeading, ctaDescription, ...rest } = service
      await client.create({
        _type: 'service',
        slug: { current: slug },
        ...rest,
        ...(subItems && { subItems }),
        ...(ctaHeading && { ctaHeading }),
        ...(ctaDescription && { ctaDescription }),
      })
    }
    console.log(`✓ Created ${defaultServices.length} services\n`)

    // 6. FAQs
    console.log('Creating FAQs...')
    const faqs = [
      {
        question: 'What is the LEAP framework?',
        answer: 'The LEAP framework is a comprehensive leadership development model that focuses on Leadership, Effectiveness, Accountability, and Productivity. It provides a structured approach to developing leaders at all levels.',
        category: 'General',
      },
      {
        question: 'How long are the training programs?',
        answer: 'Our training programs vary in length depending on the specific program. Most programs range from one-day workshops to multi-month comprehensive development programs.',
        category: 'Programs',
      },
      {
        question: 'Do you offer online training?',
        answer: 'Yes, we offer both in-person and online training options to accommodate different learning preferences and schedules.',
        category: 'Programs',
      },
      {
        question: 'What is included in executive coaching?',
        answer: 'Executive coaching includes one-on-one sessions with experienced coaches, personalized development plans, goal setting, and ongoing support to help you achieve your leadership objectives.',
        category: 'Coaching',
      },
      {
        question: 'How do I get started?',
        answer: 'You can get started by contacting us through our website, scheduling a consultation, or attending one of our introductory workshops.',
        category: 'General',
      },
    ]

    for (const faq of faqs) {
      await client.create({
        _type: 'faq',
        ...faq,
      })
    }
    console.log(`✓ Created ${faqs.length} FAQs\n`)

    // 7. Testimonials
    console.log('Creating testimonials...')
    const testimonials = [
      {
        name: 'Sarah Johnson',
        role: 'CEO',
        company: 'Tech Innovations Inc.',
        content: 'The LEAP framework transformed how I lead my organization. The practical tools and insights have been invaluable.',
        impact: 'Increased team engagement by 40% and improved overall organizational performance.',
        featured: true,
      },
      {
        name: 'Michael Chen',
        role: 'VP of Operations',
        company: 'Global Solutions',
        content: 'The executive coaching program exceeded my expectations. My coach helped me develop skills I didn\'t know I needed.',
        impact: 'Successfully led a major organizational transformation initiative.',
        featured: true,
      },
      {
        name: 'Emily Rodriguez',
        role: 'Director of Human Resources',
        company: 'Enterprise Corp',
        content: 'Our team development program was outstanding. We saw immediate improvements in collaboration and communication.',
        impact: 'Reduced team conflict by 60% and improved project delivery times.',
        featured: false,
      },
    ]

    for (const testimonial of testimonials) {
      await client.create({
        _type: 'testimonial',
        ...testimonial,
      })
    }
    console.log(`✓ Created ${testimonials.length} testimonials\n`)

    // 8. Team Members
    console.log('Creating team members...')
    const teamMembers = [
      {
        name: 'Dr. James Wilson',
        title: 'Founder & Lead Consultant',
        bio: 'With over 20 years of experience in leadership development, Dr. Wilson has helped hundreds of leaders achieve breakthrough performance.',
        credentials: ['Ph.D. in Organizational Psychology', 'Certified Executive Coach', 'Author of "Leadership Excellence"'],
      },
      {
        name: 'Maria Garcia',
        title: 'Senior Leadership Coach',
        bio: 'Maria specializes in executive coaching and team development, bringing a wealth of experience from Fortune 500 companies.',
        credentials: ['M.A. in Leadership Studies', 'ICF Certified Coach', 'Certified Team Facilitator'],
      },
      {
        name: 'David Thompson',
        title: 'Training Director',
        bio: 'David designs and delivers innovative training programs that combine theory with practical application.',
        credentials: ['M.B.A. in Organizational Development', 'Certified Training Professional', 'LEAP Framework Expert'],
      },
    ]

    for (const member of teamMembers) {
      await client.create({
        _type: 'teamMember',
        ...member,
      })
    }
    console.log(`✓ Created ${teamMembers.length} team members\n`)

    // 9. Signature Events (matches defaultContent.ts DEFAULT_EVENTS)
    console.log('Creating signature events...')
    for (const event of DEFAULT_EVENTS) {
      await client.create({
        _type: 'signatureEvent',
        order: event.order,
        title: event.title,
        subtitle: event.subtitle,
        icon: event.icon,
        badge: event.badge ?? undefined,
        badgeColor: event.badgeColor,
        duration: event.duration,
        format: event.format,
        capacity: event.capacity,
        price: event.price,
        features: event.features,
        benefits: event.benefits,
        special: event.special,
        color: event.color,
      })
    }
    console.log(`✓ Created ${DEFAULT_EVENTS.length} signature events\n`)

    // 10. Assessment Settings
    console.log('Creating assessment settings...')
    const assessmentSettings = await client.create({
      _type: 'assessmentSettings',
      captchaEnabled: false,
      scheduling: {
        individualScheduling: {
          buttonText: 'Schedule Coaching Session',
          url: 'https://calendly.com/leap-coaching',
        },
        teamScheduling: {
          buttonText: 'Schedule Team Debrief',
          url: 'https://calendly.com/leap-team-debrief',
        },
      },
    })
    console.log('✓ Assessment settings created\n')

    // 11. Assessment Questions
    console.log('Creating assessment questions...')
    const assessmentQuestions = [
      // Individual Assessment - Habit questions
      {
        category: 'habit',
        assessmentType: 'individual',
        text: 'When challenges arise:',
        order: 1,
        ratingOptions: [
          { label: 'I react immediately', points: 4 },
          { label: 'I pause and consider options', points: 3 },
          { label: 'I wait until pressure builds', points: 2 },
          { label: 'I avoid the challenge until necessary', points: 1 },
        ],
      },
      {
        category: 'habit',
        assessmentType: 'individual',
        text: 'Daily routines:',
        order: 2,
        ratingOptions: [
          { label: 'Structured', points: 4 },
          { label: 'Semi-organized', points: 3 },
          { label: 'Flexible but unpredictable', points: 2 },
          { label: 'Mostly reactive', points: 1 },
        ],
      },
      // Individual Assessment - Ability questions
      {
        category: 'ability',
        assessmentType: 'individual',
        text: 'When leading others:',
        order: 3,
        ratingOptions: [
          { label: 'I communicate expectations clearly', points: 4 },
          { label: 'I try, but clarity is inconsistent', points: 3 },
          { label: 'I rely on others to interpret', points: 2 },
          { label: 'I avoid over-directing', points: 1 },
        ],
      },
      {
        category: 'ability',
        assessmentType: 'individual',
        text: 'When facing tasks:',
        order: 4,
        ratingOptions: [
          { label: 'I follow through consistently', points: 4 },
          { label: 'I follow through when motivated', points: 3 },
          { label: 'I need reminders', points: 2 },
          { label: 'I tend to procrastinate', points: 1 },
        ],
      },
      // Individual Assessment - Talent questions
      {
        category: 'talent',
        assessmentType: 'individual',
        text: 'In group settings, I naturally:',
        order: 5,
        ratingOptions: [
          { label: 'Facilitate', points: 4 },
          { label: 'Support', points: 3 },
          { label: 'Analyze', points: 2 },
          { label: 'Observe quietly', points: 1 },
        ],
      },
      {
        category: 'talent',
        assessmentType: 'individual',
        text: 'When solving problems, I:',
        order: 6,
        ratingOptions: [
          { label: 'Get creative', points: 4 },
          { label: 'Stay practical', points: 3 },
          { label: 'Research deeply', points: 2 },
          { label: 'Seek collaboration', points: 1 },
        ],
      },
      // Individual Assessment - Skill questions
      {
        category: 'skill',
        assessmentType: 'individual',
        text: 'My skill development approach:',
        order: 7,
        ratingOptions: [
          { label: 'I learn proactively', points: 4 },
          { label: 'I learn as needed', points: 3 },
          { label: 'I learn when required', points: 2 },
          { label: 'I seldom invest time in skill growth', points: 1 },
        ],
      },
      {
        category: 'skill',
        assessmentType: 'individual',
        text: 'In communication skills:',
        order: 8,
        ratingOptions: [
          { label: 'I train and refine regularly', points: 4 },
          { label: "I've learned enough to get by", points: 3 },
          { label: 'I know I need improvement', points: 2 },
          { label: 'I avoid difficult communication', points: 1 },
        ],
      },
      // Team Assessment - Habit questions
      {
        category: 'habit',
        assessmentType: 'team',
        text: 'When new challenges arise, our team typically...',
        order: 1,
        ratingOptions: [
          { label: 'Responds quickly with clarity and alignment', points: 4 },
          { label: 'Responds, but not always with shared understanding', points: 3 },
          { label: 'Waits until issues escalate', points: 2 },
          { label: 'Avoids or delays addressing the challenge', points: 1 },
        ],
      },
      {
        category: 'habit',
        assessmentType: 'team',
        text: "Our team's daily work rhythm is best described as...",
        order: 2,
        ratingOptions: [
          { label: 'Structured and priority-driven', points: 4 },
          { label: 'Somewhat consistent, with disruptions', points: 3 },
          { label: 'Mostly reactive', points: 2 },
          { label: 'Chaotic or unclear', points: 1 },
        ],
      },
      {
        category: 'habit',
        assessmentType: 'team',
        text: 'As a team, we consistently practice...',
        order: 3,
        ratingOptions: [
          { label: 'Preparation before decisions and meetings', points: 4 },
          { label: 'Some preparation, not universal', points: 3 },
          { label: 'Minimal preparation', points: 2 },
          { label: 'Frequent improvisation', points: 1 },
        ],
      },
      // Team Assessment - Ability questions
      {
        category: 'ability',
        assessmentType: 'team',
        text: 'When commitments are made, our team...',
        order: 4,
        ratingOptions: [
          { label: 'Follows through consistently', points: 4 },
          { label: 'Follows through most of the time', points: 3 },
          { label: 'Often needs reminders', points: 2 },
          { label: 'Frequently misses deadlines', points: 1 },
        ],
      },
      {
        category: 'ability',
        assessmentType: 'team',
        text: 'Team expectations are...',
        order: 5,
        ratingOptions: [
          { label: 'Clear, shared, and communicated', points: 4 },
          { label: 'Mostly clear but inconsistent', points: 3 },
          { label: 'Often assumed and unclear', points: 2 },
          { label: 'Rarely aligned', points: 1 },
        ],
      },
      {
        category: 'ability',
        assessmentType: 'team',
        text: 'When roles or responsibilities shift, our team...',
        order: 6,
        ratingOptions: [
          { label: 'Adapts quickly and effectively', points: 4 },
          { label: 'Adjusts over time', points: 3 },
          { label: 'Experiences confusion', points: 2 },
          { label: 'Struggles significantly', points: 1 },
        ],
      },
      // Team Assessment - Talent questions
      {
        category: 'talent',
        assessmentType: 'team',
        text: 'Our team naturally excels at...',
        order: 7,
        ratingOptions: [
          { label: 'Collaboration and shared problem-solving', points: 4 },
          { label: 'Supporting each other and morale', points: 3 },
          { label: 'Analyzing data and risks', points: 2 },
          { label: 'Observing and responding once directed', points: 1 },
        ],
      },
      {
        category: 'talent',
        assessmentType: 'team',
        text: 'Team talents are...',
        order: 8,
        ratingOptions: [
          { label: 'Identified and intentionally used', points: 4 },
          { label: 'Recognized but inconsistently applied', points: 3 },
          { label: 'Only partially known', points: 2 },
          { label: 'Largely unknown', points: 1 },
        ],
      },
      {
        category: 'talent',
        assessmentType: 'team',
        text: 'When facing new challenges, our team naturally...',
        order: 9,
        ratingOptions: [
          { label: 'Innovates', points: 4 },
          { label: 'Applies previous knowledge', points: 3 },
          { label: 'Waits for direction', points: 2 },
          { label: 'Sticks to old patterns', points: 1 },
        ],
      },
      // Team Assessment - Skill questions
      {
        category: 'skill',
        assessmentType: 'team',
        text: 'Our team invests in developing new skills...',
        order: 10,
        ratingOptions: [
          { label: 'Proactively', points: 4 },
          { label: 'When needed', points: 3 },
          { label: 'Only when required', points: 2 },
          { label: 'Rarely', points: 1 },
        ],
      },
      {
        category: 'skill',
        assessmentType: 'team',
        text: 'Team communication skills are...',
        order: 11,
        ratingOptions: [
          { label: 'Strong and improving', points: 4 },
          { label: 'Adequate but uneven', points: 3 },
          { label: 'Inconsistent', points: 2 },
          { label: 'A major challenge', points: 1 },
        ],
      },
      {
        category: 'skill',
        assessmentType: 'team',
        text: 'When new tools or processes are introduced, our team...',
        order: 12,
        ratingOptions: [
          { label: 'Adapts quickly', points: 4 },
          { label: 'Adapts with support', points: 3 },
          { label: 'Struggles to apply changes', points: 2 },
          { label: 'Resists change', points: 1 },
        ],
      },
    ]

    for (const question of assessmentQuestions) {
      await client.create({
        _type: 'assessmentQuestion',
        ...question,
      })
    }
    console.log(`✓ Created ${assessmentQuestions.length} assessment questions\n`)

    // 12. Blog Posts
    console.log('Creating sample blog posts...')
    const blogPosts = [
      {
        title: 'The Power of the LEAP Framework',
        excerpt: 'Discover how the LEAP framework can transform your leadership approach and drive organizational success.',
        content: 'The LEAP framework represents a comprehensive approach to leadership development...',
        category: 'Leadership',
        author: 'Dr. James Wilson',
        publishedAt: new Date().toISOString(),
        readTime: 5,
        status: 'published',
      },
      {
        title: 'Building High-Performing Teams',
        excerpt: 'Learn the key principles for developing teams that consistently deliver exceptional results.',
        content: 'High-performing teams don\'t happen by accident. They require intentional development...',
        category: 'Team Development',
        author: 'Maria Garcia',
        publishedAt: new Date().toISOString(),
        readTime: 7,
        status: 'published',
      },
    ]

    for (const post of blogPosts) {
      await client.create({
        _type: 'blogPost',
        slug: {current: post.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')},
        ...post,
      })
    }
    console.log(`✓ Created ${blogPosts.length} blog posts\n`)

    // 13. Case Studies (matches defaultContent.ts DEFAULT_CASE_STUDIES)
    console.log('Creating case studies...')
    for (const study of DEFAULT_CASE_STUDIES) {
      await client.create({
        _type: 'caseStudy',
        title: study.title,
        company: study.company,
        challenge: study.challenge,
        solution: study.solution,
        results: study.results,
      })
    }
    console.log(`✓ Created ${DEFAULT_CASE_STUDIES.length} case studies\n`)

    // 14. Videos
    console.log('Creating sample videos...')
    const videos = [
      {
        title: 'Introduction to the LEAP Framework',
        url: 'https://www.youtube.com/watch?v=example1',
        duration: '5:30',
        type: 'Educational',
        description: 'An overview of the LEAP framework and how it can transform your leadership approach.',
        status: 'published',
      },
      {
        title: 'Success Stories: Leadership Transformation',
        url: 'https://www.youtube.com/watch?v=example2',
        duration: '8:15',
        type: 'Testimonial',
        description: 'Hear from leaders who have transformed their organizations using the LEAP framework.',
        status: 'published',
      },
    ]

    for (const video of videos) {
      await client.create({
        _type: 'video',
        ...video,
      })
    }
    console.log(`✓ Created ${videos.length} videos\n`)

    // 15. Downloads
    console.log('Creating sample downloads...')
    const downloads = [
      {
        title: 'LEAP Framework Guide',
        description: 'A comprehensive guide to understanding and implementing the LEAP framework.',
        type: 'PDF Guide',
        fileSize: '2.5 MB',
        status: 'published',
      },
      {
        title: 'Leadership Assessment Tool',
        description: 'Use this tool to assess your current leadership capabilities.',
        type: 'Assessment',
        fileSize: '1.2 MB',
        status: 'published',
      },
    ]

    for (const download of downloads) {
      await client.create({
        _type: 'download',
        ...download,
      })
    }
    console.log(`✓ Created ${downloads.length} downloads\n`)

    // 16. Books (matches defaultContent.ts DEFAULT_BOOKS)
    console.log('Creating books...')
    for (const book of DEFAULT_BOOKS) {
      await client.create({
        _type: 'book',
        title: book.title,
        subtitle: book.subtitle,
        description: book.description,
        coverUrl: book.coverUrl ?? undefined,
        price: book.price,
        purchaseLink: book.purchaseLink,
        status: book.status,
      })
    }
    console.log(`✓ Created ${DEFAULT_BOOKS.length} books\n`)

    // 17. Industries (matches defaultContent.ts DEFAULT_INDUSTRIES)
    console.log('Creating industries served...')
    for (let i = 0; i < DEFAULT_INDUSTRIES.length; i++) {
      const ind = DEFAULT_INDUSTRIES[i]
      await client.create({
        _type: 'industryServed',
        order: i,
        name: ind.name,
        count: ind.count,
        icon: ind.icon,
      })
    }
    console.log(`✓ Created ${DEFAULT_INDUSTRIES.length} industries\n`)

    // 18. Statistics for solutions page (matches defaultContent.ts DEFAULT_STATS)
    console.log('Creating statistics...')
    for (let i = 0; i < DEFAULT_STATS.length; i++) {
      const stat = DEFAULT_STATS[i]
      await client.create({
        _type: 'statistic',
        page: 'solutions',
        order: i,
        value: stat.value,
        label: stat.label,
      })
    }
    console.log(`✓ Created ${DEFAULT_STATS.length} statistics\n`)

    // 19. Organization Values (about page Mission/Vision/Values)
    console.log('Creating organization values...')
    await client.create({
      _type: 'organizationValues',
      mission: 'To transform how individuals and organizations approach excellence by making intentional practice the foundation of all achievement.',
      vision: "A world where every person and organization understands what they're practicing and deliberately builds patterns that lead to repeatable excellence.",
      values: 'Intentionality over activity. Practice over perfection. Progress over comfort. Growth through deliberate action.',
    })
    console.log('✓ Organization values created\n')

    // 20. Thriving Pillars (about page Thriving Framework)
    console.log('Creating thriving pillars...')
    const defaultPillars = [
      { order: 0, title: 'Repeatable', description: "Systems that work consistently, day after day. Build processes that don't depend on luck or circumstance.", color: 'from-blue-400 to-blue-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
      { order: 1, title: 'Reliable', description: 'Dependable results every time. Create behaviors your team and clients can count on without question.', color: 'from-emerald-400 to-emerald-500', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { order: 2, title: 'Scalable', description: 'Growth that maintains quality. Expand your impact without sacrificing the excellence that got you here.', color: 'from-amber-400 to-amber-500', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    ]
    for (const pillar of defaultPillars) {
      await client.create({ _type: 'thrivingPillar', ...pillar })
    }
    console.log(`✓ Created ${defaultPillars.length} thriving pillars\n`)

    // 21. Core Philosophy (about page)
    console.log('Creating core philosophy...')
    await client.create({
      _type: 'corePhilosophy',
      sectionLabel: 'Core Philosophy',
      heading: 'You Are Always Practicing',
      description: "Every action you take reinforces a pattern. Every decision builds a habit. The question isn't whether you're practicing—it's whether you're practicing what you want to become.",
      principles: [
        { title: 'Practice Creates Patterns', description: 'Repeated actions become automatic behaviors that shape your outcomes.', color: 'blue' },
        { title: 'Patterns Drive Results', description: 'Your consistent behaviors determine your consistent outcomes.', color: 'purple' },
        { title: 'Intentionality Transforms', description: 'Awareness of your practice is the first step to changing it.', color: 'amber' },
      ],
      statValue: '93%',
      statLabel: 'of behavior is driven by unconscious patterns',
      statDescription: "Most of what we do happens on autopilot. LEAP helps you bring awareness to these patterns so you can intentionally build the behaviors that lead to the outcomes you want.",
    })
    console.log('✓ Core philosophy created\n')

    // 22. Practice Resources (practice page Free Resources)
    console.log('Creating practice resources...')
    const defaultPracticeResources = [
      { order: 0, title: 'Individual HATS™ Guide', type: 'PDF Guide', description: 'Complete guide to understanding your individual practice patterns.', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', status: 'published' as const },
      { order: 1, title: 'Team HATS™ Guide', type: 'PDF Guide', description: 'Learn how to assess and improve team-wide practice patterns.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', status: 'published' as const },
      { order: 2, title: 'Individual vs Team Comparison', type: 'Infographic', description: 'Visual comparison of individual and team assessment approaches.', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', status: 'published' as const },
      { order: 3, title: 'LEAP Practice Guide', type: 'Workbook', description: 'Practical exercises for building intentional practice habits.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', status: 'published' as const },
    ]
    for (const res of defaultPracticeResources) {
      await client.create({ _type: 'practiceResource', ...res })
    }
    console.log(`✓ Created ${defaultPracticeResources.length} practice resources\n`)

    // 23. Lounge Page (events/lounge.astro)
    console.log('Creating lounge page content...')
    await client.create({
      _type: 'loungePage',
      heroBadge: 'The Ultimate Event Experience',
      heroHeading: 'LEAP Lounge',
      heroDescription: 'Where leaders gather, teams transform, and breakthrough moments happen. Our premier venue in Atlanta is designed for excellence.',
      overviewCards: [
        { title: 'What It Is', description: 'A premium venue designed specifically for leadership events, team building, and transformative experiences. Every detail is crafted to facilitate growth and connection.', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', color: 'from-blue-500 to-blue-600' },
        { title: 'Who It Serves', description: 'Executive teams seeking breakthrough sessions, groups of 10-50 people, organizations investing in their people, and leaders ready for transformation.', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z', color: 'from-purple-500 to-purple-600' },
        { title: 'The Experience', description: 'Deep work, meaningful connection, and breakthrough moments. An environment that inspires creativity, fosters collaboration, and drives lasting change.', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', color: 'from-amber-500 to-amber-600' },
      ],
      amenities: [
        { name: 'High-Speed WiFi', description: 'Reliable connectivity throughout', icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
        { name: 'Refreshments', description: 'Coffee, tea & snacks', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
        { name: 'AV Equipment', description: 'Projector & sound system', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' },
        { name: 'Sound System', description: 'Premium audio setup', icon: 'M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z' },
        { name: 'Catering Ready', description: 'Full kitchen access', icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7' },
        { name: 'Flexible Space', description: 'Configurable layout', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm0 8a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zm12 0a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z' },
      ],
      packages: [
        { name: 'Essentials', price: '$500', duration: '4 hours', capacity: '15 people', color: 'from-blue-500 to-blue-600', popular: false, includes: ['Private lounge access', 'High-speed WiFi', 'Coffee & tea service', 'Basic AV equipment', 'Whiteboard & markers', 'Comfortable seating'] },
        { name: 'Professional', price: '$1,200', duration: '8 hours', capacity: '30 people', color: 'from-primary to-primary-dark', popular: true, includes: ['Everything in Essentials', 'Catered lunch & snacks', 'Premium AV setup', 'Breakout rooms', 'Event coordinator', 'Custom branding', 'Photo documentation'] },
        { name: 'Premium Experience', price: '$2,500', duration: 'Full day', capacity: '50 people', color: 'from-amber-500 to-amber-600', popular: false, includes: ['Everything in Professional', 'Dedicated event manager', 'Premium catering', 'Live entertainment options', 'Professional photography', 'Team building activities', 'Custom LEAP workshop', 'Branded takeaways'] },
      ],
      ctaHeading: 'Ready to Transform Your Next Event?',
      ctaDescription: "Let's create an unforgettable experience for your team. Book the LEAP Lounge for your next workshop, meeting, or leadership event.",
    })
    console.log('✓ Lounge page content created\n')

    console.log('\n✅ All default content has been created and is published in Sanity.')
  } catch (error) {
    console.error('Error creating content:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
populateDefaultContent()

