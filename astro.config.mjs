import { defineConfig } from 'astro/config';
import { satteri } from '@astrojs/markdown-satteri';
import photoPairs from './scripts/markdown-photo-pairs.mjs';
export default defineConfig({
  site: 'https://jupiterkonnections.com',
  output: 'static',
  markdown: { processor: satteri({ hastPlugins: [photoPairs] }) },
  image: { layout: 'constrained', responsiveStyles: true, breakpoints: [480, 768, 1200, 1600, 2000] },
  trailingSlash: 'always',
  build: { format: 'directory' }
});
