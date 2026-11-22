import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root = path.resolve('dist');
async function walk(dir) {
  const results = await Promise.all((await readdir(dir, { withFileTypes: true })).map(e => e.isDirectory() ? walk(path.join(dir,e.name)) : [path.join(dir,e.name)]));
  return results.flat();
}
const files = await walk(root);
const pages = files.filter(f => f.endsWith('.html'));
const errors = [];
const routeFor = file => '/' + path.relative(root,file).split(path.sep).join('/').replace(/index\.html$/, '');
const exists = async file => { try { return (await stat(file)).isFile(); } catch { return false; } };
for (const file of pages) {
  const html = await readFile(file,'utf8');
  const route = routeFor(file);
  if (!/<html lang="en"/.test(html)) errors.push(`${route}: missing document language`);
  if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${route}: expected one h1`);
  if (!/<meta name="description" content="[^\"]+"/.test(html)) errors.push(`${route}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/jupiterkonnections.com\//.test(html)) errors.push(`${route}: missing canonical`);
  for (const img of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/alt="[^\"]+"/.test(img[0])) errors.push(`${route}: image needs descriptive alt text`);
    if (!/width="\d+"/.test(img[0]) || !/height="\d+"/.test(img[0])) errors.push(`${route}: image needs intrinsic dimensions`);
  }
  for (const match of html.matchAll(/(?:href|src)="([^\"]+)"/g)) {
    const href = match[1].replace(/&amp;/g,'&');
    if (!href.startsWith('/') || href.startsWith('//')) continue;
    const url = new URL(href, 'https://jupiterkonnections.com');
    const target = path.join(root, decodeURIComponent(url.pathname));
    const found = await exists(target) || await exists(path.join(target,'index.html'));
    if (!found) errors.push(`${route}: broken local link ${href}`);
  }
}
const legacy = JSON.parse(await readFile('src/data/legacy-routes.json','utf8'));
for (const route of legacy) assert(await exists(path.join(root,route,'index.html')), `Missing retained route: ${route}`);
assert(!files.some(f => /\/(shop|product-tag|product-category)\//.test(f)), 'Shop routes must be excluded');
for (const name of ['_headers','_redirects','404.html','robots.txt','sitemap.xml','rss.xml']) assert(await exists(path.join(root,name)), `Missing deployment file ${name}`);
const sitemap = await readFile(path.join(root,'sitemap.xml'),'utf8');
for (const file of pages) {
  const html = await readFile(file,'utf8');
  if (/name="robots" content="noindex/.test(html)) assert(!sitemap.includes(`<loc>https://jupiterkonnections.com${routeFor(file)}</loc>`), `Noindex route in sitemap: ${routeFor(file)}`);
}
const rss = await readFile(path.join(root,'rss.xml'),'utf8');
assert(rss.includes('<rss version="2.0">') && rss.includes('<item>'), 'RSS must contain restored articles');
assert.equal(errors.length, 0, errors.join('\n'));
console.log(`Verified ${pages.length} HTML pages, ${legacy.length} retained routes, internal links, metadata, noindex exclusions, feeds, and Cloudflare files. Shop routes are absent; image dimensions and alt text are present.`);

// Exercise the actual shipped journal script against built entry metadata.
const { runInNewContext } = await import('node:vm');
const journal = await readFile(path.join(root,'journal/index.html'),'utf8');
const moduleScript = [...journal.matchAll(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('data-listing'));
assert(moduleScript, 'Missing journal filter script');
const cards = [...journal.matchAll(/<div data-entry data-destination="([^\"]+)" data-search-text="([^\"]+)"/g)].map(m => ({ dataset: { destination: m[1], searchText: m[2] }, hidden: false }));
assert(cards.length >= 10, 'Journal should include the original article inventory');
function eventTarget(dataset = {}) { return { dataset, listeners: {}, attributes: {}, addEventListener(event, fn) { this.listeners[event] = fn; }, setAttribute(key,value) { this.attributes[key] = value; } }; }
const buttons = [...journal.matchAll(/data-filter="([^\"]+)"/g)].map(m => eventTarget({ filter: m[1] }));
const search = Object.assign(eventTarget(), { value: '' });
const count = { textContent: '' };
const empty = { hidden: true };
const listing = {
  querySelector(selector) { return ({ '[data-search]': search, '[data-count]': count, '[data-empty]': empty })[selector] || null; },
  querySelectorAll(selector) { return selector === '[data-filter]' ? buttons : cards; },
};
runInNewContext(moduleScript, { document: { querySelectorAll: () => [listing] } });
const indiaButton = buttons.find(button => button.dataset.filter === 'india');
assert(indiaButton, 'Missing India filter');
indiaButton.listeners.click();
assert(cards.filter(c => !c.hidden).every(c => c.dataset.destination === 'india'), 'India filter must exclude other destinations');
assert.equal(cards.filter(c => !c.hidden).length, cards.filter(c => c.dataset.destination === 'india').length);
assert.equal(indiaButton.attributes['aria-pressed'], 'true');
search.value = '  10 THINGS TO DO  '; search.listeners.input();
assert.equal(cards.filter(c => !c.hidden).length, 1, 'Search should trim input and ignore case while retaining the destination filter');
search.value = 'no matching destination or story'; search.listeners.input();
assert.equal(count.textContent, '0 entries'); assert.equal(empty.hidden, false);
search.value = ''; search.listeners.input(); buttons[0].listeners.click();
assert.equal(cards.filter(c => !c.hidden).length, cards.length, 'Reset should restore all entries');
assert.equal(empty.hidden, true);
console.log('Verified shipped journal filtering, combined search, no-results announcement, and reset.');

for (const destination of ['iceland','antarctica']) {
  const button = buttons.find(b => b.dataset.filter === destination);
  assert(button, `Missing destination filter: ${destination}`);
  button.listeners.click();
  const expected = cards.filter(c => c.dataset.destination === destination);
  assert(expected.length > 0, `Missing entries for ${destination}`);
  assert.equal(cards.filter(c => !c.hidden).length, expected.length);
  assert(cards.filter(c => !c.hidden).every(c => c.dataset.destination === destination));
}
console.log('Verified Iceland and Antarctica filters.');
