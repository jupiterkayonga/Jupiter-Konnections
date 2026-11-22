import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { relatedArticles, companionArticles } from '../src/data/article-connections.ts';
const sources = await readdir('src/content/entries');
const slugs = [];
for (const file of sources.filter(f => f.endsWith('.md'))) {
  const text = await readFile(`src/content/entries/${file}`, 'utf8');
  const slug = text.match(/^slug: "([^"]+)"/m)?.[1];
  assert(slug, `Missing slug: ${file}`);
  slugs.push(slug);
  assert(!/Pin This|No spam, notifications|<h[234]>Most Popular/.test(text), `Archive clutter: ${slug}`);
}
const sitemap = await readFile('dist/sitemap.xml', 'utf8');
const redirects = await readFile('dist/_redirects', 'utf8');
for (const slug of slugs) {
  const html = await readFile(`dist/${slug}/index.html`, 'utf8');
  const canonicals = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.deepEqual(canonicals.map(m => m[1]), [`https://jupiterkonnections.com/${slug}/`]);
  const links = new Set([...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(m => m[1]));
  assert(relatedArticles[slug]?.length, `No reading path: ${slug}`);
  for (const target of [...(relatedArticles[slug] || []), ...(companionArticles[slug] || [])]) {
    assert(slugs.includes(target), `Unknown target: ${slug} → ${target}`);
    assert.notEqual(target, slug, `Self recommendation: ${slug}`);
    assert(links.has(`/${target}/`), `Missing rendered connection: ${slug} → ${target}`);
  }
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(m => JSON.parse(m[1]));
  assert(schemas.some(s => s['@type'] === 'BreadcrumbList'), `Missing breadcrumb schema: ${slug}`);
  assert(!links.has('/a-leap-of-faith/') && !links.has('/portfolio/kumbh-mela-2019/'), `Retired duplicate linked from ${slug}`);
  const isDraft = /name="robots" content="noindex/.test(html);
  assert.equal(sitemap.includes(`<loc>https://jupiterkonnections.com/${slug}/</loc>`), !isDraft, `Sitemap publication state mismatch: ${slug}`);
}
for (const retired of ['/a-leap-of-faith/', '/portfolio/kumbh-mela-2019/']) {
  assert(redirects.includes(`${retired} /kumbh-mela/ 301`));
  assert(!sitemap.includes(`<loc>https://jupiterkonnections.com${retired}</loc>`));
}
console.log(`Verified ${slugs.length} articles: intentional reading paths, companion links, unique canonicals, breadcrumb data, sitemap membership and retired duplicate redirects.`);

// Every Cuba page exposes the whole collection, with no competing journal URL.
const cubaSlugs = ['eight-days-in-cuba', 'todo-bien-en-habana', 'portfolio/almendrones', 'portfolio/cuban-sports'];
for (const slug of cubaSlugs) {
  const html = await readFile(`dist/${slug}/index.html`, 'utf8');
  const nav = html.match(/<nav\b[^>]*aria-label="Cuba stories and photo essays"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert(nav, `Missing Cuba collection navigation: ${slug}`);
  for (const target of cubaSlugs.filter(target => target !== slug)) assert(nav.includes(`href="/${target}/"`), `Missing Cuba connection: ${slug} → ${target}`);
  assert(!html.includes('href="/cuban-passion/"'), `Retired Cuba journal linked: ${slug}`);
}
assert(redirects.includes('/cuban-passion/ /portfolio/cuban-sports/ 301'));
assert(!sitemap.includes('<loc>https://jupiterkonnections.com/cuban-passion/</loc>'));
const rss = await readFile('dist/rss.xml', 'utf8');
assert(!rss.includes('https://jupiterkonnections.com/eight-days-in-cuba/'), 'Unfinished Cuba draft leaked into RSS');
console.log('Verified four-way Cuba navigation, duplicate redirect, and draft RSS exclusion.');
