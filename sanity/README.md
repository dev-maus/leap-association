# Sanity Clean Content Studio

Congratulations, you have now installed the Sanity Content Studio, an open-source real-time content editing environment connected to the Sanity backend.

**Scripts** (from `sanity/`; set `SANITY_API_TOKEN` for write operations):

- **Seed default content (published):** `npx tsx scripts/populate-default-content.ts` — Creates and publishes the same content as `src/lib/defaultContent.ts` (site settings, heroes, LEAP framework, services, FAQs, events, case studies, industries, statistics, books, etc.). Run once on an empty dataset; content is written to the published dataset.
- **Publish drafts:** `npx tsx scripts/publish-drafts.ts` — Publishes all draft documents so they appear on the site.

Now you can do the following things:

- [Read “getting started” in the docs](https://www.sanity.io/docs/introduction/getting-started?utm_source=readme)
- [Join the Sanity community](https://www.sanity.io/community/join?utm_source=readme)
- [Extend and build plugins](https://www.sanity.io/docs/content-studio/extending?utm_source=readme)
