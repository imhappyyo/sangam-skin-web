/* Sangam Skin — product detail page. Reads ?id= from the URL. */
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

  function notFoundHTML() {
    return `
      <div class="container product-page__notfound reveal in">
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

    document.title = `${p.name.en} — Sangam Skin`;

    const name = p.name[lang] || p.name.en;
    const blurb = p.blurb[lang] || p.blurb.en;
    const howTo = p.howTo[lang] || p.howTo.en;
    const { pairs, avoid } = pairingList(p, lang);

    root.innerHTML = `
      <div class="container product-page__inner">
        <a class="product-page__back" href="/catalog.html">← ${window.t('prod_back_catalog')}</a>
        <div class="product-page__hero reveal in">
          <div class="tile tile--${p.category} product-page__tile">${window.SangamCard.initials(p.name.en)}</div>
          <div>
            <div class="product-page__badges">
              <span class="badge badge--${p.time === 'am' ? 'am' : p.time === 'pm' ? 'pm' : 'ok'}">${window.t(TIME_KEY[p.time])}</span>
              ${p.beginner ? `<span class="badge badge--ok">${window.t('prod_beginner_safe')}</span>` : ''}
              ${p.men ? `<span class="badge badge--ok">${window.t('prod_mens_line')}</span>` : ''}
            </div>
            <h1>${name}</h1>
            <p class="product-page__blurb">${blurb}</p>
          </div>
        </div>

        <div class="product-page__grid">
          <section class="product-page__block reveal">
            <h3>${window.t('prod_how_to')}</h3>
            <p>${howTo}</p>
          </section>

          <section class="product-page__block reveal">
            <h3>${window.t('prod_actives')}</h3>
            <div class="ingredient-chips">
              ${p.actives.length ? p.actives.map(k => activeChip(k, lang)).join('') : `<p class="product-page__muted">${window.t('prod_no_actives')}</p>`}
            </div>
          </section>

          ${(pairs.length || avoid.length) ? `
          <section class="product-page__block reveal">
            <h3>${window.t('prod_safety')}</h3>
            ${pairs.length ? `<p class="product-page__pair"><strong>${window.t('prod_pairs_well')}</strong> ${pairs.join(', ')}</p>` : ''}
            ${avoid.length ? `<p class="product-page__avoid"><strong>${window.t('prod_avoid_pairing')}</strong> ${avoid.join(', ')}</p>` : ''}
          </section>` : ''}
        </div>

        <div class="product-page__cta reveal">
          <p>${window.t('prod_quiz_prompt')}</p>
          <a class="btn btn--primary" href="/quiz.html">${window.t('hero_cta_quiz')}</a>
        </div>
      </div>`;

    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  window.SangamI18n.ready.then(render);
  window.addEventListener('hashchange', render);
  document.addEventListener('i18n:applied', render);
})();
