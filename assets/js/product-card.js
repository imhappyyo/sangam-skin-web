/* Sangam Skin — shared product-card renderer (BIO-LUXE FUTURIST).
 * Consumers: catalog.js (grid) and result.js (initials() only).
 * API is stable: window.SangamCard = { productCardHTML(p, lang), initials(nameEn) }.
 * Card styles live in assets/css/catalog.css. */
(function () {
  'use strict';

  function initials(nameEn) {
    return nameEn
      .replace(/[^A-Za-z0-9 %+.]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join('')
      .toUpperCase();
  }

  const TIME_KEY = { am: 'prod_time_am', pm: 'prod_time_pm', both: 'prod_time_both' };
  const CAT_KEY = { skin: 'cat_skin', hair: 'cat_hair', lips: 'cat_lips', lash: 'cat_lash' };

  function productCardHTML(p, lang) {
    const name = p.name[lang] || p.name.en;
    const blurb = p.blurb[lang] || p.blurb.en;
    const badge = p.time === 'am' ? 'am' : p.time === 'pm' ? 'pm' : 'ok';
    return `
      <a class="product-card" data-tilt href="/product.html#${encodeURIComponent(p.id)}">
        <div class="tile tile--${p.category} product-card__tile">
          <span class="product-card__monogram">${initials(p.name.en)}</span>
        </div>
        <span class="product-card__arrow" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
        <div class="product-card__body">
          <div class="product-card__meta">
            <span class="badge badge--${badge}">${window.t(TIME_KEY[p.time])}</span>
            <span class="product-card__cat">${window.t(CAT_KEY[p.category] || 'cat_skin')}</span>
          </div>
          <h4 class="product-card__name">${name}</h4>
          <p class="product-card__blurb">${blurb}</p>
        </div>
      </a>`;
  }

  window.SangamCard = { productCardHTML, initials };
})();
