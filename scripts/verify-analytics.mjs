import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const source = await readFile('src/scripts/analytics-consent.ts', 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function scenario({ hostname = 'jupiterkonnections.com', choice, excluded = false, storageFails = false } = {}) {
  const scripts = [];
  const cookies = [];
  const storage = new Map();
  let reloads = 0;
  if (choice) storage.set('jk-analytics-consent-v1', JSON.stringify({ choice, updated: Date.now() }));
  function button(value) {
    const listeners = {};
    return {
      dataset: { analyticsChoice: value }, hidden: true,
      addEventListener(event, listener) { listeners[event] = listener; },
      click() { listeners.click?.(); },
      focus() {},
    };
  }
  const accept = button('granted');
  const reject = button('denied');
  const settings = button();
  const panel = {
    hidden: true,
    dataset: { containerId: 'GTM-NRPC5X8', measurementId: 'G-V3VLWZG18X', excluded: String(excluded) },
    querySelectorAll() { return [reject, accept]; },
    querySelector() { return { focus() {} }; },
  };
  const document = {
    querySelector(selector) { return selector === '[data-analytics-consent]' ? panel : settings; },
    createElement() { return {}; },
    head: { appendChild(script) { scripts.push(script); } },
    get cookie() { return '_ga=example; _ga_V3VLWZG18X=example; essential=keep'; },
    set cookie(value) { cookies.push(value); },
  };
  const window = {};
  const exports = {};
  runInNewContext(compiled, {
    exports, window, document, Date,
    location: { hostname, pathname: '/journal/', reload() { reloads++; } },
    localStorage: {
      getItem(key) { if (storageFails) throw Error('unavailable'); return storage.get(key) ?? null; },
      setItem(key, value) { if (storageFails) throw Error('unavailable'); storage.set(key, value); },
    },
  });
  exports.initializeAnalyticsConsent();
  return { scripts, cookies, storage, window, panel, accept, reject, settings, reloads: () => reloads };
}

for (const hostname of ['localhost', '127.0.0.1', 'preview.pages.dev', 'jupiterkonnections.com.example.org']) {
  const page = scenario({ hostname, choice: 'granted' });
  assert.equal(page.scripts.length, 0);
  assert.equal(page.settings.hidden, true);
}
const page = scenario();
assert.equal(page.scripts.length, 0, 'No Google request before consent');
assert.equal(page.panel.hidden, false);
assert.equal(page.window.dataLayer[0][0], 'consent');
assert.equal(page.window.dataLayer[0][2].analytics_storage, 'denied');
assert.equal(page.window.dataLayer[0][2].ad_storage, 'denied');
page.accept.click();
page.accept.click();
assert.equal(page.scripts.length, 1, 'Only one GTM loader');
assert.equal(page.scripts[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-NRPC5X8');
assert.equal(page.window.dataLayer[1][2].analytics_storage, 'granted');
assert.equal(page.window.dataLayer[1][2].ad_storage, undefined, 'Advertising consent stays denied');
assert.equal(page.panel.hidden, true);
page.settings.click();
assert.equal(page.panel.hidden, false);
page.reject.click();
assert.equal(page.window['ga-disable-G-V3VLWZG18X'], true);
assert.equal(page.reloads(), 1);
assert(page.cookies.some(cookie => cookie.startsWith('_ga=')));
assert(!page.cookies.some(cookie => cookie.startsWith('essential=')));
assert.equal(JSON.parse(page.storage.get('jk-analytics-consent-v1')).choice, 'denied');
assert.equal(scenario({ choice: 'granted' }).scripts.length, 1);
assert.equal(scenario({ choice: 'denied' }).scripts.length, 0);
const draft = scenario({ excluded: true, choice: 'granted' });
assert.equal(draft.scripts.length, 0, 'No tracking on noindex pages');
const blockedStorage = scenario({ storageFails: true });
blockedStorage.accept.click();
assert.equal(blockedStorage.scripts.length, 1, 'Explicit consent works when storage is unavailable');
console.log('Verified analytics domain gating, defaults, acceptance, rejection, saved choices, withdrawal, draft exclusion, single loading and blocked browser storage.');
