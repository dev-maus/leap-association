import { createClient } from '@sanity/client'

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

async function removeDuplicates() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required. Set it and run again.')
    process.exit(1)
  }

  const allDocs = await client.fetch<{ _id: string; _type: string; _createdAt: string; title?: string; name?: string; page?: string; key?: string; question?: string; text?: string; assessmentType?: string; category?: string; slug?: { current?: string } }[]>(
    `*[!(_id in path("drafts.**")) && !(_type in ["system.group", "sanity.imageAsset", "sanity.fileAsset"])]
      { _id, _type, _createdAt, title, name, page, key, question, text, assessmentType, category, slug }`
  )

  console.log(`Found ${allDocs.length} total published documents\n`)

  const groups = new Map<string, typeof allDocs>()
  for (const doc of allDocs) {
    const identifier = doc.title ?? doc.name ?? doc.question ?? doc.text ?? doc.page ?? doc.key ?? doc.slug?.current ?? ''
    const extra = doc._type === 'assessmentQuestion' ? `::${doc.assessmentType ?? ''}::${doc.category ?? ''}` : ''
    const groupKey = `${doc._type}::${identifier}${extra}`
    const group = groups.get(groupKey) ?? []
    group.push(doc)
    groups.set(groupKey, group)
  }

  const toDelete: string[] = []
  for (const [key, docs] of groups) {
    if (docs.length <= 1) continue
    docs.sort((a, b) => a._createdAt.localeCompare(b._createdAt))
    const dupes = docs.slice(1)
    console.log(`Duplicate: "${key}" — keeping 1, removing ${dupes.length}`)
    for (const d of dupes) toDelete.push(d._id)
  }

  if (toDelete.length === 0) {
    console.log('\nNo duplicates found.')
    return
  }

  console.log(`\nDeleting ${toDelete.length} duplicate documents...`)
  const batchSize = 50
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize)
    const tx = client.transaction()
    for (const id of batch) tx.delete(id)
    await tx.commit()
    console.log(`  Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} docs)`)
  }

  console.log('\n✅ All duplicates removed.')
}

removeDuplicates().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
