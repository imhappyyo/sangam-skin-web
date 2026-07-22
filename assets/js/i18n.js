/* Sangam Skin — minimal i18n engine. Loads assets/i18n/<lang>.json, applies
 * data-i18n="key" (textContent) and data-i18n-attr="attr:key" to the DOM,
 * persists the choice, and exposes window.t(key, params) for page scripts. */
(function () {
  'use strict';

  const SUPPORTED = ['en', 'ru'];
  const DEFAULT_LANG = 'en';
  const STORAGE_KEY = 'sangam-skin-web/lang';

  // A ?lang=xx in the URL wins (these are the crawlable per-language URLs the
  // hreflang tags point at); then the saved choice; then the browser.
  function urlLang() {
    try { const p = new URLSearchParams(location.search).get('lang'); return p && SUPPORTED.includes(p) ? p : null; }
    catch { return null; }
  }
  function getLang() {
    const u = urlLang();
    if (u) return u;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED.includes(saved)) return saved;
    const nav = (navigator.language || 'en').slice(0, 2);
    return SUPPORTED.includes(nav) ? nav : DEFAULT_LANG;
  }

  // Keep the canonical + address bar in sync with the active language so each
  // language has one stable, self-referencing URL (default = no ?lang param).
  function syncUrl(lang) {
    const path = location.pathname;
    const rel = lang === DEFAULT_LANG ? path : path + '?lang=' + lang;
    const link = document.querySelector('link[rel="canonical"]');
    if (link) link.setAttribute('href', location.origin + rel);
    if (location.pathname + location.search !== rel) {
      try { history.replaceState(history.state, '', rel); } catch (e) {}
    }
  }

  let catalog = {};
  let currentLang = DEFAULT_LANG;

  function interpolate(str, params) {
    if (!params) return str;
    return str.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in params ? String(params[k]) : `{{${k}}}`));
  }

  function t(key, params) {
    const raw = catalog[key] || key;
    return interpolate(raw, params);
  }

  function applyToDom() {
    document.documentElement.lang = currentLang;
    document.documentElement.dir = 'ltr';
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = t(key);
    });
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      el.innerHTML = t(key);
    });
    document.querySelectorAll('[data-i18n-attr]').forEach(el => {
      // format: "placeholder:key1,aria-label:key2"
      el.getAttribute('data-i18n-attr').split(',').forEach(pair => {
        const [attr, key] = pair.split(':').map(s => s.trim());
        if (attr && key) el.setAttribute(attr, t(key));
      });
    });
    document.querySelectorAll('[data-lang-active]').forEach(el => {
      el.classList.toggle('is-active', el.getAttribute('data-lang-active') === currentLang);
    });
    document.dispatchEvent(new CustomEvent('i18n:applied', { detail: { lang: currentLang } }));
  }

  async function loadCatalog(lang) {
    const res = await fetch(`/assets/i18n/${lang}.json`, { cache: 'no-store' }).catch(() => null);
    return res && res.ok ? res.json() : {};
  }

  async function setLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = DEFAULT_LANG;
    currentLang = lang;
    localStorage.setItem(STORAGE_KEY, lang);
    syncUrl(lang);
    catalog = await loadCatalog(lang);
    applyToDom();
  }

  window.SangamI18n = {
    t, setLang,
    // re-applies the CURRENT catalog to the DOM without re-fetching — needed
    // by chrome.js right after it injects the header/footer, since those
    // arrive after i18n.js's own initial setLang() has already run once.
    reapply: applyToDom,
    get lang() { return currentLang; },
    ready: setLang(getLang()),
  };
  window.t = t;
})();
