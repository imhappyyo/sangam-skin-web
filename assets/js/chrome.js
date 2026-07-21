/* Sangam Skin — shared header + footer, injected into every page's
 * <div id="site-header"></div> / <div id="site-footer"></div>. Keeps nav
 * and footer in exactly one place instead of duplicated per-page HTML.
 * NOTE: nav links carry data-i18n (i18n.js replaces their textContent), so
 * the active-link mint underline lives on the <a>'s ::after in site.css —
 * never as a child span, or i18n would wipe it. */
(function () {
  'use strict';

  function headerHTML(active) {
    const link = (href, key, id) =>
      `<a class="nav__link${active === id ? ' is-active' : ''}" href="${href}" data-i18n="${key}"></a>`;
    return `
      <div class="header__inner container">
        <a class="header__brand" href="/index.html" aria-label="Sangam Skin">
          <img src="/assets/images/sangam-tree.svg" alt="" width="34" height="44" />
          <span>Sangam <em>Skin</em></span>
        </a>
        <nav class="header__nav">
          ${link('/quiz.html', 'nav_quiz', 'quiz')}
          ${link('/catalog.html', 'nav_catalog', 'catalog')}
          ${link('/ingredients.html', 'nav_ingredients', 'ingredients')}
          ${link('/about.html', 'nav_about', 'about')}
        </nav>
        <div class="header__actions">
          <div class="lang-switch" role="group" aria-label="Language">
            <button type="button" data-lang-active="en" data-set-lang="en">EN</button>
            <button type="button" data-lang-active="ru" data-set-lang="ru">RU</button>
          </div>
          <a class="btn btn--primary btn--sm" href="/quiz.html" data-i18n="nav_cta"></a>
          <button class="header__burger" type="button" aria-label="Menu" aria-expanded="false" data-menu-toggle>
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
      <div class="header__mobile-nav" data-mobile-nav>
        ${link('/quiz.html', 'nav_quiz', 'quiz')}
        ${link('/catalog.html', 'nav_catalog', 'catalog')}
        ${link('/ingredients.html', 'nav_ingredients', 'ingredients')}
        ${link('/about.html', 'nav_about', 'about')}
      </div>`;
  }

  function footerHTML() {
    const year = 2026;
    return `
      <div class="container footer__inner">
        <div class="footer__brand">
          <img src="/assets/images/sangam-tree.svg" alt="" width="28" height="36" />
          <span>Sangam <em>Skin</em></span>
          <p data-i18n="footer_tagline"></p>
        </div>
        <div class="footer__col">
          <p class="footer__head" data-i18n="footer_explore"></p>
          <a href="/quiz.html" data-i18n="nav_quiz"></a>
          <a href="/catalog.html" data-i18n="nav_catalog"></a>
          <a href="/ingredients.html" data-i18n="nav_ingredients"></a>
          <a href="/lens.html" data-i18n="nav_lens"></a>
        </div>
        <div class="footer__col">
          <p class="footer__head" data-i18n="footer_company"></p>
          <a href="/about.html" data-i18n="nav_about"></a>
          <a href="https://sangamherbals.com" target="_blank" rel="noopener" data-i18n="footer_main_site"></a>
          <a href="/about.html#disclaimer" data-i18n="footer_disclaimer_link"></a>
        </div>
        <div class="footer__col">
          <p class="footer__head" data-i18n="footer_get_app"></p>
          <div class="store-badges store-badges--footer">
            <a class="store-badge" href="https://apps.apple.com/app/id6791218190" target="_blank" rel="noopener" aria-label="Download Sangam Skin on the App Store">
              <svg class="store-badge__glyph" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 12.54c-.02-2.06 1.68-3.05 1.76-3.1-.96-1.4-2.45-1.6-2.98-1.62-1.27-.13-2.48.75-3.12.75-.64 0-1.64-.73-2.7-.71-1.39.02-2.67.81-3.38 2.05-1.44 2.5-.37 6.2 1.03 8.23.69.99 1.51 2.11 2.58 2.07 1.04-.04 1.43-.67 2.68-.67 1.25 0 1.6.67 2.7.65 1.11-.02 1.82-1.01 2.5-2.01.79-1.15 1.11-2.27 1.13-2.33-.02-.01-2.17-.83-2.2-3.3zM15.1 6.6c.57-.69.95-1.65.85-2.6-.82.03-1.81.54-2.4 1.23-.53.6-.99 1.58-.87 2.51.91.07 1.85-.46 2.42-1.14z"/></svg>
              <span class="store-badge__text"><small>Download on the</small><strong>App Store</strong></span>
            </a>
            <a class="store-badge" href="https://play.google.com/store/apps/details?id=com.sangamherbals.skin" target="_blank" rel="noopener" aria-label="Get Sangam Skin on Google Play">
              <svg class="store-badge__glyph" viewBox="0 0 24 24" aria-hidden="true"><path fill="#00D3FF" d="M3.6 2.3 13 11.7l2.6-2.6z"/><path fill="#FFCE00" d="m17.1 8.3-3.1 1.8L16.1 12l3-1.7c.8-.5.8-1.5 0-2z"/><path fill="#00F076" d="M3.6 2.3 13.4 12l-9.8 9.7c-.3-.2-.5-.6-.5-1.1V3.4c0-.5.2-.9.5-1.1z"/><path fill="#FF3945" d="M13.4 12 3.6 21.7c.4.2.9.2 1.4-.1l11.1-6.5z"/></svg>
              <span class="store-badge__text"><small>GET IT ON</small><strong>Google Play</strong></span>
            </a>
          </div>
        </div>
      </div>
      <div class="container footer__legal">
        <span>© ${year} Sangam Herbals · <span data-i18n="footer_rights"></span></span>
        <span data-i18n="footer_disclaimer"></span>
      </div>`;
  }

  function mount() {
    const h = document.getElementById('site-header');
    const f = document.getElementById('site-footer');
    if (h) { h.className = 'header'; h.innerHTML = headerHTML(h.dataset.active || ''); }
    if (f) { f.className = 'footer'; f.innerHTML = footerHTML(); }

    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-set-lang]');
      if (btn) window.SangamI18n.setLang(btn.getAttribute('data-set-lang'));
      const burger = e.target.closest('[data-menu-toggle]');
      if (burger) {
        const nav = document.querySelector('[data-mobile-nav]');
        const open = nav ? nav.classList.toggle('is-open') : false;
        burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }
    });

    // i18n.js's own initial setLang() may have already resolved BEFORE this
    // header/footer markup existed (it runs on script load, chrome.js mounts
    // on DOMContentLoaded) — re-apply now that the nodes are actually here,
    // so the language-switch highlight and any data-i18n text is correct
    // on first paint, not just after the user manually switches language.
    window.SangamI18n.ready.then(() => window.SangamI18n.reapply());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
