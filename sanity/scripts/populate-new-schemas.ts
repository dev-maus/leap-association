import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

async function populateNewSchemas() {
  console.log('Starting to populate new schema content...\n')

  try {
    // 1. Organization Values
    console.log('Creating organization values...')
    await client.create({
      _type: 'organizationValues',
      mission: 'To transform how individuals and organizations approach excellence by making intentional practice the foundation of all achievement.',
      vision: 'A world where every person and organization understands what they\'re practicing and deliberately builds patterns that lead to repeatable excellence.',
      values: 'Intentionality over activity. Practice over perfection. Progress over comfort. Growth through deliberate action.',
    })
    console.log('✓ Organization values created\n')

    // 2. Thriving Pillars
    console.log('Creating thriving framework pillars...')
    const thrivingPillars = [
      {
        order: 1,
        title: 'Repeatable',
        description: 'Systems that work consistently, day after day. Build processes that don\'t depend on luck or circumstance.',
        icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
        color: 'from-blue-400 to-blue-500',
      },
      {
        order: 2,
        title: 'Reliable',
        description: 'Dependable results every time. Create behaviors your team and clients can count on without question.',
        icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
        color: 'from-emerald-400 to-emerald-500',
      },
      {
        order: 3,
        title: 'Scalable',
        description: 'Growth that maintains quality. Expand your impact without sacrificing the excellence that got you here.',
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
        color: 'from-amber-400 to-amber-500',
      },
    ]

    for (const pillar of thrivingPillars) {
      await client.create({
        _type: 'thrivingPillar',
        ...pillar,
      })
    }
    console.log(`✓ Created ${thrivingPillars.length} thriving framework pillars\n`)

    // 3. Core Philosophy
    console.log('Creating core philosophy...')
    await client.create({
      _type: 'corePhilosophy',
      sectionLabel: 'Core Philosophy',
      heading: 'You Are Always Practicing',
      description: 'Every action you take reinforces a pattern. Every decision builds a habit. The question isn\'t whether you\'re practicing—it\'s whether you\'re practicing what you want to become.',
      principles: [
        {
          _type: 'principle',
          title: 'Practice Creates Patterns',
          description: 'Repeated actions become automatic behaviors that shape your outcomes.',
          color: 'blue',
        },
        {
          _type: 'principle',
          title: 'Patterns Drive Results',
          description: 'Your consistent behaviors determine your consistent outcomes.',
          color: 'purple',
        },
        {
          _type: 'principle',
          title: 'Intentionality Transforms',
          description: 'Awareness of your practice is the first step to changing it.',
          color: 'amber',
        },
      ],
      statValue: '93%',
      statLabel: 'of behavior is driven by unconscious patterns',
      statDescription: 'Most of what we do happens on autopilot. LEAP helps you bring awareness to these patterns so you can intentionally build the behaviors that lead to the outcomes you want.',
    })
    console.log('✓ Core philosophy created\n')

    // 4. Industries Served
    console.log('Creating industries served...')
    const industries = [
      { order: 1, name: 'Technology', count: '150+', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
      { order: 2, name: 'Manufacturing', count: '80+', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
      { order: 3, name: 'Healthcare', count: '120+', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
      { order: 4, name: 'Education', count: '200+', icon: 'M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222' },
      { order: 5, name: 'Finance', count: '90+', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { order: 6, name: 'Consulting', count: '110+', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    ]

    for (const industry of industries) {
      await client.create({
        _type: 'industryServed',
        ...industry,
      })
    }
    console.log(`✓ Created ${industries.length} industries served\n`)

    // 5. Statistics
    console.log('Creating statistics...')
    const statistics = [
      // Solutions page stats
      { page: 'solutions', order: 1, value: '750+', label: 'Organizations Served' },
      { page: 'solutions', order: 2, value: '10,000+', label: 'Leaders Trained' },
      { page: 'solutions', order: 3, value: '25+', label: 'Industries' },
      { page: 'solutions', order: 4, value: '98%', label: 'Client Satisfaction' },
      // About page stats (can be used for "Trusted by Industry Leaders" section)
      { page: 'about', order: 1, value: '750+', label: 'Organizations Served' },
      { page: 'about', order: 2, value: '20+', label: 'Years Experience' },
      { page: 'about', order: 3, value: '10,000+', label: 'Leaders Trained' },
      { page: 'about', order: 4, value: '4.9/5.0', label: 'Average Rating' },
      // Home page stats
      { page: 'home', order: 1, value: '750+', label: 'Organizations' },
      { page: 'home', order: 2, value: '10,000+', label: 'Leaders' },
      { page: 'home', order: 3, value: '25+', label: 'Industries' },
    ]

    for (const stat of statistics) {
      await client.create({
        _type: 'statistic',
        ...stat,
      })
    }
    console.log(`✓ Created ${statistics.length} statistics\n`)

    // 6. Practice Resources
    console.log('Creating practice resources...')
    const practiceResources = [
      {
        order: 1,
        title: 'Individual HATS™ Guide',
        type: 'PDF Guide',
        description: 'Complete guide to understanding your individual practice patterns and how they impact your leadership effectiveness.',
        icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
        requiresEmail: true,
        status: 'published',
      },
      {
        order: 2,
        title: 'Team HATS™ Guide',
        type: 'PDF Guide',
        description: 'Learn how to assess and improve team-wide practice patterns for better collaboration and results.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
        requiresEmail: true,
        status: 'published',
      },
      {
        order: 3,
        title: 'Individual vs Team Comparison',
        type: 'Infographic',
        description: 'Visual comparison of individual and team assessment approaches to help you choose the right path.',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
        requiresEmail: false,
        status: 'published',
      },
      {
        order: 4,
        title: 'LEAP Practice Workbook',
        type: 'Workbook',
        description: 'Practical exercises for building intentional practice habits that create lasting excellence.',
        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
        requiresEmail: true,
        status: 'published',
      },
      {
        order: 5,
        title: 'LEAP Framework Quick Reference',
        type: 'Checklist',
        description: 'A handy reference card for the LEAP framework dimensions and key competencies.',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
        requiresEmail: false,
        status: 'published',
      },
    ]

    for (const resource of practiceResources) {
      await client.create({
        _type: 'practiceResource',
        ...resource,
      })
    }
    console.log(`✓ Created ${practiceResources.length} practice resources\n`)

    // 7. Update Signature Events with new fields
    console.log('Creating enhanced signature events...')
    const signatureEvents = [
      {
        id: 'leap-through-lunch',
        order: 1,
        title: 'LEAP Through Lunch',
        subtitle: 'Complimentary Introduction',
        description: 'Experience the power of LEAP methodology in a casual, engaging lunch session.',
        icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
        badge: 'FREE',
        badgeColor: 'bg-emerald-500',
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
        duration: '60 minutes',
        format: 'At Your Location',
        capacity: 'Up to 5 participants',
        price: 'Complimentary lunch included',
        special: '100% Results Guaranteed',
        color: 'from-emerald-500 to-emerald-600',
      },
      {
        id: 'team-up',
        order: 2,
        title: 'Team Up',
        subtitle: 'Team Alignment Workshop',
        description: 'A half-day intensive designed to align your team around shared practices and goals.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
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
        duration: 'Half-day',
        format: 'In-person',
        capacity: 'Teams of any size',
        color: 'from-blue-500 to-blue-600',
      },
      {
        id: 'leadership-workshops',
        order: 3,
        title: 'Workshops',
        subtitle: 'Leadership Lab',
        description: 'Targeted skill development workshops led by expert facilitators.',
        icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
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
        duration: '2-4 hours',
        format: 'In-person & Virtual',
        capacity: 'Flexible group sizes',
        color: 'from-purple-500 to-purple-600',
      },
      {
        id: 'popup-experiences',
        order: 4,
        title: 'Pop-Up Leadership Experiences',
        subtitle: 'LEAP Intensive',
        description: 'Unexpected leadership challenges that create breakthrough moments.',
        icon: 'M13 10V3L4 14h7v7l9-11h-7z',
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
        duration: 'Varies',
        format: 'Surprise!',
        capacity: 'Custom',
        color: 'from-amber-500 to-amber-600',
      },
    ]

    // First, delete existing signature events to replace with enhanced ones
    const existingEvents = await client.fetch(`*[_type == "signatureEvent"]._id`)
    if (existingEvents.length > 0) {
      console.log(`  Removing ${existingEvents.length} existing signature events...`)
      for (const id of existingEvents) {
        await client.delete(id)
      }
    }

    for (const event of signatureEvents) {
      await client.create({
        _type: 'signatureEvent',
        ...event,
      })
    }
    console.log(`✓ Created ${signatureEvents.length} enhanced signature events\n`)

    console.log('\n✅ All new schema content has been successfully created!')
    console.log('\nSummary:')
    console.log('  - 1 Organization Values document')
    console.log(`  - ${thrivingPillars.length} Thriving Framework Pillars`)
    console.log('  - 1 Core Philosophy document')
    console.log(`  - ${industries.length} Industries Served`)
    console.log(`  - ${statistics.length} Statistics`)
    console.log(`  - ${practiceResources.length} Practice Resources`)
    console.log(`  - ${signatureEvents.length} Enhanced Signature Events`)

  } catch (error) {
    console.error('Error creating content:', error)
    if (error instanceof Error) {
      console.error('Error message:', error.message)
    }
    process.exit(1)
  }
}

// Run the script
populateNewSchemas()
