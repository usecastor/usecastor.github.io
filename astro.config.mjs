// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// Dual-target deployment:
//   Vercel         → base "/"            (default; ASTRO_BASE unset)
//   GitHub Pages   → base "/"            (ASTRO_BASE=/ in the Pages workflow)
// Every root-relative asset path in src/ is derived from
// `import.meta.env.BASE_URL`, which mirrors this `base` at build time.
// The sitemap plugin emits sitemap-index.xml + sitemap-0.xml with URLs
// derived from `site` + `base`, so both targets get correctly-prefixed
// absolute URLs (root on Vercel and on the GitHub Pages root domain).
export default defineConfig({
  base: process.env.ASTRO_BASE || '/',
  site: process.env.ASTRO_SITE || 'https://usecastor.github.io',
  output: 'static',
  integrations: [react(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
    },
  },
});
