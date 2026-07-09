/* Sangam Skin — shared header + footer, injected into every page's
 * <div id="site-header"></div> / <div id="site-footer"></div>. Keeps nav
 * and footer in exactly one place instead of duplicated per-page HTML. */
(function () {
  'use strict';

  function headerHTML(active) {
    const link = (href, key, id) =>
      `<a class="nav__link${active === id ? ' is-active' : ''}" href="${href}" data-i18n="${key}"></a>`;
    return `
      <div class="header__inner container">
        <a class="header__brand" href="/index.html" aria-label="Sangam Skin">
          <img src="/assets/images/sangam-tree.svg" alt="" width="32" height="32" />
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
          <button class="header__burger" type="button" aria-label="Menu" data-menu-toggle>
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
          <img src="/assets/images/sangam-tree.svg" alt="" width="28" height="28" />
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
          <p class="footer__app-note" data-i18n="footer_app_note"></p>
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
      if (burger) document.querySelector('[data-mobile-nav]')?.classList.toggle('is-open');
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
