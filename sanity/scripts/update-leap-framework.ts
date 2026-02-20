import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

const updates = [
  {
    match: { letter: 'E', oldTitles: ['Excellence', 'Effectiveness'] },
    set: {
      title: 'Effectiveness',
      subtitle: 'Meaningful Progress',
      description: 'Advancing the right priorities through disciplined, focused, and aligned execution.',
    },
  },
  {
    match: { letter: 'A', oldTitles: ['Achievement', 'Accountability'] },
    set: {
      title: 'Accountability',
      subtitle: 'Practice Accountability',
      description: 'Own commitments, follow through on priorities, and take responsibility for outcomes that drive organizational success.',
    },
  },
  {
    match: { letter: 'P', oldTitles: ['Performance', 'Productivity'] },
    set: {
      title: 'Productivity',
      subtitle: 'Create Systems',
      description: 'Optimize rhythms and priorities that enable consistent progress and long-term organizational impact.',
    },
  },
]

async function updateLeapFramework() {
  console.log('Updating LEAP Framework entries in Sanity...\n')

  try {
    for (const update of updates) {
      const titleFilter = update.match.oldTitles.map((t) => `title == "${t}"`).join(' || ')
      const query = `*[_type == "leapFramework" && (letter == "${update.match.letter}" || ${titleFilter})]`
      const entries = await client.fetch(query)

      if (entries.length === 0) {
        console.log(`No entry found for letter "${update.match.letter}" — skipping`)
        continue
      }

      for (const entry of entries) {
        console.log(`Found: "${entry.title}" (${entry._id}) → updating to "${update.set.title}"`)
        await client.patch(entry._id).set(update.set).commit()
        console.log(`✓ Updated to "${update.set.title}" — ${update.set.subtitle}\n`)
      }
    }

    console.log('✅ All LEAP Framework entries updated successfully!')
  } catch (error) {
    console.error('Error updating content:', error)
    process.exit(1)
  }
}

updateLeapFramework()
