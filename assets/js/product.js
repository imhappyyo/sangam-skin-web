/* Sangam Skin — product detail page (BIO-LUXE FUTURIST).
 * Hash-routed (#product-id), renders: dark hero band (bottle-stone bg) with a
 * gradient monogram tile, then light body — numbered glass cards for how-to,
 * actives and layering notes — and a dark quiz-CTA panel.
 * Re-renders on hashchange + i18n:applied; dispatches 'sangam:content-mounted'
 * so SangamFX picks up [data-fx]/[data-tilt] in the fresh markup. */
(function () {
  'use strict';

  const TIME_KEY = { am: 'prod_time_am', pm: 'prod_time_pm', both: 'prod_time_both' };

  function getId() {
    // hash-based, not ?id= — query strings can be mangled by static-host
    // URL rewriting; a hash fragment is pure client-side and never touches
    // the server, so it works identically on any static host.
    return decodeURIComponent(window.location.hash.replace(/^#/, ''));
  }

  function ingredientByKey(key) {
    return window.INGREDIENTS.find(i => i.key === key);
  }

  function activeChip(key, lang) {
    const ing = ingredientByKey(key);
    const name = ing ? (ing.name[lang] || ing.name.en) : key;
    return `<a class="ingredient-chip" href="/ingredients.html#${key}">${name}</a>`;
  }

  function pairingList(product, lang) {
    const pairs = new Set(), avoid = new Set();
    product.actives.forEach(key => {
      const ing = ingredientByKey(key);
      if (!ing) return;
      (ing.pairsWith || []).forEach(k => { if (!product.actives.includes(k)) pairs.add(k); });
      (ing.avoidWith || []).forEach(k => avoid.add(k));
    });
    const names = set => [...set].map(k => {
      const ing = ingredientByKey(k);
      return ing ? (ing.name[lang] || ing.name.en) : k;
    });
    return { pairs: names(pairs), avoid: names(avoid) };
  }

  function blockHTML(num, delay, title, inner) {
    return `
      <section class="product-page__block" data-fx="up"${delay ? ` data-fx-delay="${delay}"` : ''}>
        <span class="product-page__num" aria-hidden="true">${num}</span>
        <h3>${title}</h3>
        ${inner}
      </section>`;
  }

  function notFoundHTML() {
    return `
      <div class="container product-page__notfound" data-fx="up">
        <div class="product-page__notfound-mark" aria-hidden="true">?</div>
        <h1>${window.t('prod_not_found_title')}</h1>
        <p>${window.t('prod_not_found_body')}</p>
        <a class="btn btn--primary" href="/catalog.html">${window.t('prod_back_catalog')}</a>
      </div>`;
  }

  function render() {
    const id = getId();
    const p = window.PRODUCTS.find(x => x.id === id);
    const root = document.getElementById('product-root');
    const lang = window.SangamI18n.lang;

    if (!p) {
      root.innerHTML = notFoundHTML();
      document.dispatchEvent(new Event('sangam:content-mounted'));
      return;
    }

    const name = p.name[lang] || p.name.en;
    const blurb = p.blurb[lang] || p.blurb.en;
    const howTo = p.howTo[lang] || p.howTo.en;
    const { pairs, avoid } = pairingList(p, lang);

    document.title = `${name} — Sangam Skin`;

    const badges = `
      <div class="product-page__badges">
        <span class="badge badge--${p.time === 'am' ? 'am' : p.time === 'pm' ? 'pm' : 'ok'}">${window.t(TIME_KEY[p.time])}</span>
        ${p.beginner ? `<span class="badge badge--ok">${window.t('prod_beginner_safe')}</span>` : ''}
        ${p.men ? `<span class="badge badge--ok">${window.t('prod_mens_line')}</span>` : ''}
      </div>`;

    const layeringBlock = (pairs.length || avoid.length) ? blockHTML('03', 160, window.t('prod_safety'), `
      ${pairs.length ? `
        <div class="product-page__pair">
          <span class="product-page__pair-ico" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 12.5l5.5 5.5L20 6.5" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </span>
          <p><strong>${window.t('prod_pairs_well')}</strong> ${pairs.join(', ')}</p>
        </div>` : ''}
      ${avoid.length ? `
        <div class="product-page__avoid">
          <span class="product-page__avoid-ico" aria-hidden="true">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>
          </span>
          <p><strong>${window.t('prod_avoid_pairing')}</strong> ${avoid.join(', ')}</p>
        </div>` : ''}
    `) : '';

    root.innerHTML = `
      <section class="product-hero section--dark">
        <div class="fx-aurora" aria-hidden="true"></div>
        <div class="container product-hero__inner">
          <a class="product-hero__back" href="/catalog.html">← ${window.t('prod_back_catalog')}</a>
          <div class="product-hero__layout" data-fx="up">
            <div class="tile tile--${p.category} product-hero__tile" data-tilt>
              <span>${window.SangamCard.initials(p.name.en)}</span>
            </div>
            <div class="product-hero__copy">
              ${badges}
              <h1>${name}</h1>
              <p class="product-hero__blurb">${blurb}</p>
            </div>
          </div>
        </div>
        <hr class="line-iris product-hero__line" aria-hidden="true" />
      </section>

      <div class="container product-body">
        <div class="product-page__grid">
          ${blockHTML('01', 0, window.t('prod_how_to'), `<p>${howTo}</p>`)}
          ${blockHTML('02', 80, window.t('prod_actives'), `
            <div class="ingredient-chips">
              ${p.actives.length
                ? p.actives.map(k => activeChip(k, lang)).join('')
                : `<p class="product-page__muted">${window.t('prod_no_actives')}</p>`}
            </div>`)}
          ${layeringBlock}
        </div>

        <div class="product-page__cta theme-dark" data-fx="up">
          <div class="fx-aurora" aria-hidden="true"></div>
          <div class="product-page__cta-inner">
            <h3>${window.t('prod_quiz_prompt')}</h3>
            <p>${window.t('prod_quiz_sub')}</p>
            <a class="btn btn--primary fx-glow-pulse" href="/quiz.html">${window.t('hero_cta_quiz')}</a>
          </div>
        </div>
      </div>`;

    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  window.SangamI18n.ready.then(render);
  window.addEventListener('hashchange', render);
  document.addEventListener('i18n:applied', render);
})();
