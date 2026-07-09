/* Sangam Skin — ingredient glossary: search + family filter over 50 actives.
 * Family names come straight from the (already bilingual) ingredient data,
 * so no separate i18n keys are needed for the 17 family labels. */
(function () {
  'use strict';

  const state = { query: '', family: null };

  function ruPlural(n, one, few, many) {
    const n100 = n % 100, n10 = n % 10;
    if (n100 >= 11 && n100 <= 14) return many;
    if (n10 === 1) return one;
    if (n10 >= 2 && n10 <= 4) return few;
    return many;
  }
  function countLabel(n, lang) {
    if (lang === 'ru') return `${n} ${ruPlural(n, 'ингредиент', 'ингредиента', 'ингредиентов')}`;
    return `${n} ${n === 1 ? 'ingredient' : 'ingredients'}`;
  }

  function families(lang) {
    const set = new Set(window.INGREDIENTS.map(i => i.family[lang] || i.family.en));
    return [...set].sort();
  }

  function renderFilters() {
    const lang = window.SangamI18n.lang;
    const fams = families(lang);
    document.getElementById('ing-families').innerHTML = [
      `<button class="chip${state.family === null ? ' is-active' : ''}" data-fam="">${window.t('cat_all')}</button>`,
      ...fams.map(f => `<button class="chip${state.family === f ? ' is-active' : ''}" data-fam="${f}">${f}</button>`),
    ].join('');
    document.querySelectorAll('[data-fam]').forEach(btn => btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-fam');
      state.family = v || null;
      renderFilters(); renderGrid();
    }));
  }

  function filtered(lang) {
    const q = state.query.trim().toLowerCase();
    return window.INGREDIENTS.filter(i => {
      const fam = i.family[lang] || i.family.en;
      if (state.family && fam !== state.family) return false;
      if (q) {
        const hay = `${i.name.en} ${i.name.ru} ${i.what.en}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function cardHTML(ing, lang) {
    const name = ing.name[lang] || ing.name.en;
    const family = ing.family[lang] || ing.family.en;
    const what = ing.what[lang] || ing.what.en;
    const benefits = (ing.benefits[lang] || ing.benefits.en).slice(0, 3);
    const caution = ing.caution[lang] || ing.caution.en;
    return `
      <article class="ing-card" id="${ing.key}">
        <span class="ing-card__family">${family}</span>
        <h3>${name}</h3>
        <p class="ing-card__what">${what}</p>
        <ul class="ing-card__benefits">
          ${benefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
        ${caution ? `<p class="ing-card__caution"><strong>${window.t('ing_caution_label')}</strong> ${caution}</p>` : ''}
      </article>`;
  }

  function renderGrid() {
    const lang = window.SangamI18n.lang;
    const list = filtered(lang);
    document.getElementById('ing-count').textContent = countLabel(list.length, lang);
    document.getElementById('ing-grid').innerHTML = list.map(i => cardHTML(i, lang)).join('');
    document.dispatchEvent(new Event('sangam:content-mounted'));
    // deep-link: scroll to #key if present (e.g. arriving from a product page)
    if (location.hash) {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('ing-card--highlight'); }
    }
  }

  function init() {
    renderFilters();
    renderGrid();
    document.getElementById('ing-search').addEventListener('input', e => {
      state.query = e.target.value;
      renderGrid();
    });
    document.addEventListener('i18n:applied', () => { renderFilters(); renderGrid(); });
  }

  window.SangamI18n.ready.then(init);
})();
