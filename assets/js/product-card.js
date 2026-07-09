/* Sangam Skin — shared product-card renderer (used on Home, Catalog, Quiz result). */
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

  function productCardHTML(p, lang) {
    const name = p.name[lang] || p.name.en;
    const blurb = p.blurb[lang] || p.blurb.en;
    return `
      <a class="product-card" href="/product.html#${encodeURIComponent(p.id)}">
        <div class="tile tile--${p.category} product-card__tile">${initials(p.name.en)}</div>
        <div class="product-card__body">
          <span class="badge badge--${p.time === 'am' ? 'am' : p.time === 'pm' ? 'pm' : 'ok'}">${window.t(TIME_KEY[p.time])}</span>
          <h4>${name}</h4>
          <p>${blurb}</p>
        </div>
      </a>`;
  }

  window.SangamCard = { productCardHTML, initials };
})();
