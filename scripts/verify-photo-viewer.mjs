import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
const html = await readFile('dist/iceland-roadtrip-top-camping-and-adventure-routes/index.html', 'utf8');
const code = [...html.matchAll(/<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).find(s => s.includes('[data-photo-article]'));
assert(code, 'Viewer script must ship with the article');
const requests = [];
const created = [];
let activeElement = null;
class Element {
  constructor(tag = 'div', attributes = {}) { this.tag = tag; this.attributes = attributes; this.dataset = {}; this.children = []; this.listeners = {}; this.hidden = false; }
  setAttribute(k, v) { this.attributes[k] = v; }
  getAttribute(k) { return this.attributes[k] ?? null; }
  addEventListener(type, listener) { (this.listeners[type] ||= []).push(listener); }
  emit(type, values = {}) { const event = { target: this, preventDefault() { this.defaultPrevented = true; }, ...values }; for (const listener of this.listeners[type] || []) listener(event); return event; }
  append(...nodes) { for (const n of nodes) { n.parent = this; this.children.push(n); } }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(n => n !== this); }
  querySelectorAll(_selector) { return []; }
  showModal() { this.open = true; }
  close() { this.open = false; this.emit('close'); }
  querySelector(selector) { return selector === 'img' ? this.children.find(n => n.tag === 'img') || null : this.parts?.[selector] || null; }
  closest() { return this.linked ? {} : null; }
  replaceWith(button) { this.trigger = button; }
  focus() { activeElement = this; }
  get srcset() { return this.attributes.srcset || ''; }
  get alt() { return this.attributes.alt || ''; }
  set alt(value) { this.attributes.alt = value; }
  get src() { return this.attributes.src || ''; }
  set src(value) { this.attributes.src = value; }
}
const decode = text => text.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
const photos = [...html.matchAll(/<img\b([^>]+)>/g)].map(m => new Element('img', Object.fromEntries([...m[1].matchAll(/([\w-]+)="([^\"]*)"/g)].map(a => [a[1], decode(a[2])]))));
assert(photos.length >= 30, 'Article must exercise its real photo inventory');
const linked = new Element('img', { alt: 'Linked photograph', src: '/linked.webp' }); linked.linked = true;
const dialog = new Element('dialog'); dialog.open = false;
dialog.showModal = () => { dialog.open = true; };
dialog.close = () => { dialog.open = false; dialog.emit('close'); };
const stage = new Element();
const status = new Element();
const caption = new Element();
const counter = new Element();
const close = new Element('button');
const prev = new Element('button');
const next = new Element('button');
dialog.parts = { '[data-photo-stage]': stage, '[data-photo-status]': status, '[data-photo-caption]': caption, '[data-photo-counter]': counter, '[data-photo-close]': close, '[data-photo-prev]': prev, '[data-photo-next]': next };
const scope = new Element(); scope.parts = { '[data-photo-viewer]': dialog };
scope.querySelectorAll = selector => { assert.equal(selector, '.entry-cover img, .entry-layout .prose img'); return [...photos, linked]; };
const classes = new Set();
const document = { documentElement: { classList: { add: s => classes.add(s), remove: s => classes.delete(s) } }, createElement: tag => { const el = new Element(tag); created.push(el); return el; }, querySelectorAll: () => [scope] };
class Image extends Element { constructor() { super('img'); } set src(value) { this.attributes.src = value; requests.push(this); } get src() { return this.attributes.src; } }
runInNewContext(code, { document, Image });
assert.equal(requests.length, 0, 'Larger images must not load during enhancement');
assert(!linked.trigger, 'Existing image links must not be hijacked');
assert(photos.every(photo => photo.trigger?.attributes['aria-haspopup'] === 'dialog'), 'Photographs need accessible button triggers');
photos[0].trigger.emit('click');
assert(dialog.open && classes.has('photo-viewer-open'));
assert.equal(activeElement, close);
assert.equal(requests.length, 1);
assert.equal(requests[0].src, photos[0].srcset.split(',').at(-1).trim().replace(/\s+\d+w$/, ''));
requests[0].emit('load'); assert.equal(stage.querySelector('img'), requests[0]);
next.emit('click'); assert.equal(counter.textContent, `Photograph 2 of ${photos.length}`);
const superseded = requests.at(-1);
const key = dialog.emit('keydown', { key: 'ArrowRight' }); assert(key.defaultPrevented);
const current = requests.at(-1);
superseded.emit('load'); assert.notEqual(stage.querySelector('img'), superseded, 'Late loads must not replace a newer selection');
current.emit('load'); assert.equal(stage.querySelector('img'), current);
assert.equal(caption.textContent, photos[2].alt);
close.emit('click'); assert(!dialog.open && !classes.has('photo-viewer-open')); assert.equal(activeElement, photos[0].trigger);
photos.at(-1).trigger.emit('click'); next.emit('click'); assert.equal(counter.textContent, `Photograph 1 of ${photos.length}`);
prev.emit('click'); assert.equal(counter.textContent, `Photograph ${photos.length} of ${photos.length}`);
requests.at(-1).emit('error'); assert.equal(status.hidden, false); assert.equal(stage.getAttribute('aria-busy'), 'false');
assert(status.textContent.includes('could not load'));
dialog.emit('click'); assert(!dialog.open); assert.equal(activeElement, photos.at(-1).trigger);
photos[0].trigger.emit('click');
stage.emit('pointerdown', { pointerType: 'touch', isPrimary: true, clientX: 200, clientY: 100 });
stage.emit('pointerup', { pointerType: 'touch', clientX: 90, clientY: 105 });
assert.equal(counter.textContent, `Photograph 2 of ${photos.length}`);
dialog.emit('click', { target: stage }); assert(dialog.open, 'A swipe must not accidentally close the viewer through its synthetic click');
dialog.close();
console.log(`Verified shipped viewer: ${photos.length} accessible triggers, no eager large-image requests, open/close, focus restoration, keyboard navigation, wraparound, stale-load protection, errors, touch swipe, and linked-image exclusion. Script: ${Buffer.byteLength(code)} bytes (${(await import('node:zlib')).gzipSync(code).length} bytes gzipped).`);
