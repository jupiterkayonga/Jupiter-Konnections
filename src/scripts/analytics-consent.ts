type ConsentChoice = 'granted' | 'denied';
declare global {
  interface Window {
    dataLayer?: unknown[];
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

const consentKey = 'jk-analytics-consent-v1';
const consentLifetime = 180 * 24 * 60 * 60 * 1000;

export function initializeAnalyticsConsent() {
  const panel = document.querySelector<HTMLElement>('[data-analytics-consent]');
  if (!panel) return;

  const settingsButton = document.querySelector<HTMLButtonElement>('[data-analytics-settings]');
  const productionHost = ['jupiterkonnections.com', 'www.jupiterkonnections.com'].includes(location.hostname);
  if (!productionHost) return;

  const containerId = panel.dataset.containerId!;
  const measurementId = panel.dataset.measurementId!;
  const excluded = panel.dataset.excluded === 'true';
  const analyticsWindow = window;
  const dataLayer = analyticsWindow.dataLayer = analyticsWindow.dataLayer || [];
  let loaded = false;
  let returnFocus = false;

  // Google consumes gtag commands as Arguments objects from the data layer.
  function consentCommand(..._args: unknown[]) {
    dataLayer.push(arguments);
  }

  consentCommand('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  function readChoice(): ConsentChoice | null {
    try {
      const saved = JSON.parse(localStorage.getItem(consentKey) || 'null');
      if (!saved || !['granted', 'denied'].includes(saved.choice)) return null;
      if (typeof saved.updated !== 'number' || Date.now() - saved.updated >= consentLifetime) return null;
      return saved.choice;
    } catch {
      return null;
    }
  }

  function saveChoice(choice: ConsentChoice) {
    try {
      localStorage.setItem(consentKey, JSON.stringify({ choice, updated: Date.now() }));
    } catch {
      // The choice still applies to this page when browser storage is unavailable.
    }
  }

  function loadTagManager() {
    if (loaded || excluded) return;
    loaded = true;
    analyticsWindow[`ga-disable-${measurementId}`] = false;
    consentCommand('consent', 'update', { analytics_storage: 'granted' });
    dataLayer.push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    const script = document.createElement('script');
    script.id = 'jk-google-tag-manager';
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(containerId)}`;
    document.head.appendChild(script);
  }

  function clearAnalyticsCookies() {
    const cookieNames = document.cookie.split(';').map(cookie => cookie.trim().split('=')[0]);
    const hostParts = location.hostname.split('.');
    const domains = ['', ...hostParts.map((_, index) => hostParts.slice(index).join('.'))];
    const pathParts = location.pathname.split('/').filter(Boolean);
    const paths = ['/', ...pathParts.map((_, index) => '/' + pathParts.slice(0, index + 1).join('/'))];
    for (const name of cookieNames.filter(name => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(name))) {
      for (const domain of domains) {
        for (const path of paths) {
          document.cookie = `${name}=; Max-Age=0; path=${path}${domain ? '; domain=' + domain : ''}; SameSite=Lax`;
        }
      }
    }
  }

  function applyChoice(choice: ConsentChoice) {
    saveChoice(choice);
    panel!.hidden = true;
    if (returnFocus) settingsButton?.focus();
    if (choice === 'granted') {
      loadTagManager();
      return;
    }
    analyticsWindow[`ga-disable-${measurementId}`] = true;
    consentCommand('consent', 'update', { analytics_storage: 'denied' });
    clearAnalyticsCookies();
    // Reloading ends the lifetime of any container already loaded after acceptance.
    if (loaded) location.reload();
  }

  panel.querySelectorAll<HTMLButtonElement>('[data-analytics-choice]').forEach(button => {
    button.addEventListener('click', () => applyChoice(button.dataset.analyticsChoice as ConsentChoice));
  });
  if (settingsButton) {
    settingsButton.hidden = false;
    settingsButton.addEventListener('click', () => {
      returnFocus = true;
      panel.hidden = false;
      panel.querySelector<HTMLElement>('h2')?.focus();
    });
  }

  const choice = readChoice();
  if (choice === 'granted') loadTagManager();
  else if (choice === 'denied') {
    analyticsWindow[`ga-disable-${measurementId}`] = true;
    clearAnalyticsCookies();
  } else if (!excluded) panel.hidden = false;
}
