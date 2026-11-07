import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import compress from 'astro-compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://leapassociation.com',
  // Tailwind 3 runs through postcss.config.cjs; @astrojs/tailwind does not support Astro 7
  integrations: [
    // Leadership Insights (/resources/) is hidden from navigation and search engines
    sitemap({ filter: (page) => !page.endsWith('/resources/') }),
    react(),
    compress({ JavaScript: true, CSS: true, HTML: true, SVG: true })
  ],
  output: 'static'  // Static Site Generation - all pages pre-rendered at build time
});
