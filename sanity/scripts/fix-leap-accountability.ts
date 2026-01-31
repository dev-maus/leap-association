import {createClient} from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

async function fixLeapAccountability() {
  console.log('Updating LEAP Framework entry for "A"...\n')

  try {
    // Find the LEAP Framework entry with letter "A" or title "Achievement"
    const entries = await client.fetch(`*[_type == "leapFramework" && (letter == "A" || title == "Achievement")]`)

    if (entries.length === 0) {
      console.log('No LEAP Framework entry found for "A" or "Achievement"')
      return
    }

    for (const entry of entries) {
      console.log(`Found entry: ${entry.title} (${entry._id})`)

      await client
        .patch(entry._id)
        .set({
          title: 'Accountability',
          subtitle: 'The practice of ownership and trust.',
          description: 'Teams rise or fall on their ability to follow through and hold each other up.',
        })
        .commit()

      console.log(`✓ Updated to "Accountability"`)
    }

    console.log('\n✅ LEAP Framework entry updated successfully!')
  } catch (error) {
    console.error('Error updating content:', error)
    process.exit(1)
  }
}

fixLeapAccountability()
