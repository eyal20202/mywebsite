import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://eyal20202.github.io',
  base: '/mywebsite',
  output: 'static',
  trailingSlash: 'always',
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    mdx()
  ],
  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true
    }
  }
});
