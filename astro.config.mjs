import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';
import compress from 'astro-compress';

// https://astro.build/config
export default defineConfig({
  site: 'https://dev-maus.github.io',
  base: '/leap-association/', // Remove this for custom domain
  integrations: [
    tailwind({ configFile: './tailwind.config.mjs' }),
    sitemap(),
    react(),
    compress({ JavaScript: true, CSS: true, HTML: true, SVG: true })
  ],
  output: 'static'  // Static Site Generation - all pages pre-rendered at build time
});
