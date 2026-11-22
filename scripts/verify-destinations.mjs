import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { destinations } from '../src/data/catalog.ts';
import { countryJourneys } from '../src/data/destination-journeys.ts';
const directory = await readFile('dist/destinations/index.html', 'utf8');
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const slugs = destinations.map(destination => destination.slug);
assert.equal(new Set(slugs).size, slugs.length, 'Duplicate destinations');
for (const destination of destinations) {
  const route = `/destinations/${destination.slug}/`;
  const html = await readFile(`dist${route}index.html`, 'utf8');
  assert.equal(directory.split(`href="${route}"`).length - 1, 1, `Missing or duplicated directory tile: ${route}`);
  assert(html.includes(`<link rel="canonical" href="https://jupiterkonnections.com${route}"`));
  assert(sitemap.includes(`<loc>https://jupiterkonnections.com${route}</loc>`));
  assert(!html.includes('0 entries'), `Empty listing on destination: ${route}`);
  if (countryJourneys[destination.slug]) assert(html.includes('id="country-journey-heading"'), `Missing journey overview: ${route}`);
}
for (const slug of Object.keys(countryJourneys)) assert(slugs.includes(slug), `Journey without destination: ${slug}`);
assert(directory.includes('Journey overview') && directory.includes('Stories &amp; photography'));
console.log(`Verified ${slugs.length} unique destinations: regional directory tiles, working pages, journey overviews, canonicals and sitemap entries.`);
