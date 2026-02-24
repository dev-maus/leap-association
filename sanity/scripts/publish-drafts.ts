/**
 * Publishes all draft documents to the published dataset.
 * Run from sanity/ with: npx tsx scripts/publish-drafts.ts
 * Requires SANITY_API_TOKEN with write access.
 */
import { createClient } from '@sanity/client';

const client = createClient({
  projectId: '327wp4ja',
  dataset: 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
});

async function publishDrafts() {
  if (!process.env.SANITY_API_TOKEN) {
    console.error('SANITY_API_TOKEN is required. Set it and run again.');
    process.exit(1);
  }

  const drafts = await client.fetch<{ _id: string; _type: string }[]>(
    `*[_id in path("drafts.**")]{ _id, _type }`
  );

  if (drafts.length === 0) {
    console.log('No draft documents to publish.');
    return;
  }

  console.log(`Found ${drafts.length} draft(s). Publishing...\n`);

  const transaction = client.transaction();

  for (const draft of drafts) {
    const publishedId = draft._id.replace(/^drafts\./, '');
    const fullDoc = await client.getDocument(draft._id);
    if (!fullDoc) continue;
    const { _id, _rev, ...rest } = fullDoc as Record<string, unknown>;
    transaction.createOrReplace({
      ...rest,
      _id: publishedId,
      _type: draft._type,
    } as Parameters<typeof transaction.createOrReplace>[0]);
    console.log(`  ${draft._type}: ${publishedId}`);
  }

  await transaction.commit();
  console.log(`\n✓ Published ${drafts.length} document(s).`);
}

publishDrafts().catch((err) => {
  console.error(err);
  process.exit(1);
});
