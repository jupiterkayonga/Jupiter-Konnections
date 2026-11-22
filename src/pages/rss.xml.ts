import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
const escape = (s: string) => s.replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c]!);
export const GET: APIRoute = async ({ site }) => {
  const entries = (await getCollection('entries')).filter(e => !['pending', 'draft'].includes(e.data.status) && e.data.kind !== 'project').sort((a,b) => (b.data.date || '').localeCompare(a.data.date || ''));
  const items = entries.map(e => { const url = new URL(`/${e.data.slug}/`, site).href; return `<item><title>${escape(e.data.title)}</title><description>${escape(e.data.description)}</description><link>${url}</link><guid isPermaLink="true">${url}</guid>${e.data.date ? `<pubDate>${new Date(e.data.date).toUTCString()}</pubDate>` : ''}</item>`; }).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Jupiter Konnections</title><link>${site}</link><description>Travel stories, guides, and human connections.</description><language>en</language>${items}</channel></rss>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
