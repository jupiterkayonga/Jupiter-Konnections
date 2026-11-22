import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import legacy from '../data/legacy-routes.json';
import { destinations } from '../data/catalog';
export const GET: APIRoute = async ({ site }) => {
  const entries = await getCollection('entries');
  const pending = new Set(entries.filter(e => ['pending', 'draft'].includes(e.data.status)).map(e => `/${e.data.slug}/`));
  const excluded = new Set(['/cuban-passion/', '/portfolio/kumbh-mela-2019/', '/a-leap-of-faith/', '/privacy-policy/', '/terms-and-conditions/', '/content-creation/', '/project-type/travel/']);
  const paths = [...new Set([...legacy, ...entries.map(e => `/${e.data.slug}/`), '/destinations/', '/travel-guides/', '/work-with-me/', ...destinations.map(d => `/destinations/${d.slug}/`)])].filter(p => !pending.has(p) && !excluded.has(p));
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map(p => `<url><loc>${new URL(p, site).href}</loc></url>`).join('')}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
