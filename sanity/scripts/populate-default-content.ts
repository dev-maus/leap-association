import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

async function populateDefaultContent() {
  console.log('Starting to populate default content...\n')

  try {
    // 1. Site Settings
    console.log('Creating site settings...')
    const siteSettings = await client.create({
      _type: 'siteSettings',
      title: 'LEAP Association',
      description: 'Empowering leaders to achieve breakthrough performance through the LEAP framework.',
      phone: '+1 (555) 123-4567',
      email: 'info@leapassociation.org',
      address: '123 Leadership Drive, Suite 100\nSan Francisco, CA 94105',
      socialLinks: {
        twitter: 'https://twitter.com/leapassociation',
        linkedin: 'https://linkedin.com/company/leapassociation',
        facebook: 'https://facebook.com/leapassociation',
      },
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
      {
        page: 'home',
        heading: 'Transform Your Leadership',
        subheading: 'Discover the LEAP framework and unlock your full potential as a leader.',
        ctaLabel: 'Get Started',
      },
      {
        page: 'about',
        heading: 'About LEAP Association',
        subheading: 'We are dedicated to empowering leaders through evidence-based methodologies.',
        ctaLabel: 'Learn More',
      },
      {
        page: 'services',
        heading: 'Our Services',
        subheading: 'Comprehensive leadership development solutions tailored to your needs.',
        ctaLabel: 'Explore Services',
      },
    ]

    for (const hero of heroSections) {
      await client.create({
        _type: 'hero',
        ...hero,
      })
    }
    console.log(`✓ Created ${heroSections.length} hero sections\n`)

    // 4. LEAP Framework
    console.log('Creating LEAP framework entries...')
    const leapFramework = [
      {
        letter: 'L',
        title: 'Leadership',
        subtitle: 'The practice of influence.',
        description: 'How you show up determines how others follow, align, and collaborate.',
        color: '#3B82F6',
      },
      {
        letter: 'E',
        title: 'Effectiveness',
        subtitle: 'Meaningful Progress',
        description: 'Advancing the right priorities through disciplined, focused, and aligned execution.',
        color: '#10B981',
      },
      {
        letter: 'A',
        title: 'Accountability',
        subtitle: 'Practice Accountability',
        description: 'Own commitments, follow through on priorities, and take responsibility for outcomes that drive organizational success.',
        color: '#8B5CF6',
      },
      {
        letter: 'P',
        title: 'Productivity',
        subtitle: 'Create Systems',
        description: 'Optimize rhythms and priorities that enable consistent progress and long-term organizational impact.',
        color: '#F59E0B',
      },
    ]

    for (const framework of leapFramework) {
      await client.create({
        _type: 'leapFramework',
        ...framework,
      })
    }
    console.log(`✓ Created ${leapFramework.length} LEAP framework entries\n`)

    // 5. Services
    console.log('Creating services...')
    const services = [
      {
        title: 'Leadership Training',
        subtitle: 'Comprehensive Leadership Development',
        description: 'Transform your leadership capabilities through our evidence-based training programs.',
        features: ['Interactive workshops', 'Real-world case studies', 'Personalized coaching', 'Ongoing support'],
        icon: 'training',
      },
      {
        title: 'Executive Coaching',
        subtitle: 'One-on-One Leadership Coaching',
        description: 'Work with experienced coaches to accelerate your leadership journey.',
        features: ['Personalized approach', 'Confidential sessions', 'Goal-oriented', 'Flexible scheduling'],
        icon: 'coaching',
      },
      {
        title: 'Team Development',
        subtitle: 'Build High-Performing Teams',
        description: 'Develop cohesive, high-performing teams that deliver exceptional results.',
        features: ['Team assessments', 'Customized programs', 'Facilitated sessions', 'Performance tracking'],
        icon: 'team',
      },
      {
        title: 'Organizational Consulting',
        subtitle: 'Strategic Organizational Development',
        description: 'Partner with us to transform your organization\'s culture and performance.',
        features: ['Strategic planning', 'Culture assessment', 'Change management', 'Implementation support'],
        icon: 'consulting',
      },
    ]

    for (const service of services) {
      await client.create({
        _type: 'service',
        slug: {current: service.title.toLowerCase().replace(/\s+/g, '-')},
        ...service,
      })
    }
    console.log(`✓ Created ${services.length} services\n`)

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

    // 9. Signature Events
    console.log('Creating signature events...')
    const signatureEvents = [
      {
        id: 'annual-summit',
        title: 'Annual Leadership Summit',
        subtitle: 'The Premier Leadership Event',
        description: 'Join us for our annual gathering of leaders, featuring keynote speakers, workshops, and networking opportunities.',
        features: ['Keynote presentations', 'Interactive workshops', 'Networking sessions', 'Case study discussions'],
        benefits: ['Learn from industry leaders', 'Network with peers', 'Gain new insights', 'Earn continuing education credits'],
        duration: '3 days',
        format: 'In-person and virtual',
      },
      {
        id: 'leadership-retreat',
        title: 'Executive Leadership Retreat',
        subtitle: 'Intensive Leadership Development',
        description: 'An immersive retreat designed for senior executives to deepen their leadership capabilities.',
        features: ['Intensive workshops', 'One-on-one coaching', 'Peer learning circles', 'Strategic planning sessions'],
        benefits: ['Deep personal development', 'Strategic insights', 'Peer connections', 'Actionable plans'],
        duration: '5 days',
        format: 'In-person',
      },
    ]

    for (const event of signatureEvents) {
      await client.create({
        _type: 'signatureEvent',
        ...event,
      })
    }
    console.log(`✓ Created ${signatureEvents.length} signature events\n`)

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

    // 13. Case Studies
    console.log('Creating case studies...')
    const caseStudies = [
      {
        title: 'Transforming Leadership at TechCorp',
        company: 'TechCorp Industries',
        challenge: 'TechCorp was experiencing high turnover and low employee engagement, particularly in middle management.',
        solution: 'We implemented a comprehensive LEAP framework program, including leadership training, executive coaching, and team development initiatives.',
        results: [
          'Reduced turnover by 35%',
          'Increased employee engagement scores by 45%',
          'Improved leadership effectiveness ratings by 50%',
        ],
      },
      {
        title: 'Building a Culture of Excellence',
        company: 'Global Solutions Inc.',
        challenge: 'The organization needed to align its leadership team around a common vision and improve cross-functional collaboration.',
        solution: 'Through our team development program and strategic consulting, we helped establish clear communication channels and shared goals.',
        results: [
          'Improved cross-functional collaboration by 60%',
          'Achieved 95% alignment on organizational vision',
          'Increased project success rate by 40%',
        ],
      },
    ]

    for (const caseStudy of caseStudies) {
      await client.create({
        _type: 'caseStudy',
        ...caseStudy,
      })
    }
    console.log(`✓ Created ${caseStudies.length} case studies\n`)

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

    // 16. Books
    console.log('Creating sample books...')
    const books = [
      {
        title: 'Leadership Excellence: The LEAP Framework',
        subtitle: 'A Practical Guide to Transformational Leadership',
        description: 'This comprehensive book explores the LEAP framework in detail, providing practical tools and insights for leaders at all levels.',
        coverUrl: 'https://example.com/book-cover.jpg',
        price: '$29.99',
        purchaseLink: 'https://example.com/purchase',
        status: 'published',
      },
    ]

    for (const book of books) {
      await client.create({
        _type: 'book',
        ...book,
      })
    }
    console.log(`✓ Created ${books.length} books\n`)

    console.log('\n✅ All default content has been successfully created!')
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

