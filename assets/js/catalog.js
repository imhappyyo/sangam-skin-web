/* Sangam Skin — catalogue: search + category/concern filters over all 118 products. */
(function () {
  'use strict';

  const CATEGORIES = [
    { value: null, key: 'cat_all' },
    { value: 'skin', key: 'cat_skin' },
    { value: 'hair', key: 'cat_hair' },
    { value: 'lips', key: 'cat_lips' },
    { value: 'lash', key: 'cat_lash' },
  ];
  const CONCERNS = ['acne', 'aging', 'dark-spots', 'dryness', 'sensitivity', 'oil-control', 'texture', 'hair-loss'];

  const state = { query: '', category: null, concern: null };

  function ruPlural(n, one, few, many) {
    const n100 = n % 100, n10 = n % 10;
    if (n100 >= 11 && n100 <= 14) return many;
    if (n10 === 1) return one;
    if (n10 >= 2 && n10 <= 4) return few;
    return many;
  }

  function countLabel(n, lang) {
    if (lang === 'ru') return `${n} ${ruPlural(n, 'продукт', 'продукта', 'продуктов')}`;
    return `${n} ${n === 1 ? 'product' : 'products'}`;
  }

  function renderFilters() {
    const lang = window.SangamI18n.lang;
    document.getElementById('catalog-categories').innerHTML = CATEGORIES.map(c => `
      <button class="chip${state.category === c.value ? ' is-active' : ''}" data-cat="${c.value ?? ''}">${window.t(c.key)}</button>
    `).join('');
    document.getElementById('catalog-concerns').innerHTML = CONCERNS.map(c => `
      <button class="chip${state.concern === c ? ' is-active' : ''}" data-concern="${c}">${window.t('cat_concern_' + c)}</button>
    `).join('');

    document.querySelectorAll('[data-cat]').forEach(btn => btn.addEventListener('click', () => {
      state.category = btn.getAttribute('data-cat') || null;
      renderFilters(); renderGrid();
    }));
    document.querySelectorAll('[data-concern]').forEach(btn => btn.addEventListener('click', () => {
      const v = btn.getAttribute('data-concern');
      state.concern = state.concern === v ? null : v;
      renderFilters(); renderGrid();
    }));
  }

  function filtered() {
    const q = state.query.trim().toLowerCase();
    return window.PRODUCTS.filter(p => {
      if (state.category && p.category !== state.category) return false;
      if (state.concern && !p.concerns.includes(state.concern)) return false;
      if (q) {
        const hay = `${p.name.en} ${p.name.ru} ${p.blurb.en} ${p.actives.join(' ')}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function renderGrid() {
    const lang = window.SangamI18n.lang;
    const list = filtered();
    const grid = document.getElementById('catalog-grid');
    const empty = document.getElementById('catalog-empty');
    const hasFilters = !!(state.category || state.concern || state.query.trim());

    document.getElementById('catalog-count').textContent = countLabel(list.length, lang);
    document.getElementById('catalog-clear').hidden = !hasFilters;

    if (!list.length) {
      grid.innerHTML = '';
      empty.hidden = false;
    } else {
      empty.hidden = true;
      grid.innerHTML = list.map(p => window.SangamCard.productCardHTML(p, lang)).join('');
    }
    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  function clearFilters() {
    state.category = null; state.concern = null; state.query = '';
    document.getElementById('catalog-search').value = '';
    renderFilters(); renderGrid();
  }

  function init() {
    renderFilters();
    renderGrid();
    document.getElementById('catalog-search').addEventListener('input', e => {
      state.query = e.target.value;
      renderGrid();
    });
    document.getElementById('catalog-clear').addEventListener('click', clearFilters);
    document.getElementById('catalog-empty-clear').addEventListener('click', clearFilters);
    document.addEventListener('i18n:applied', () => { renderFilters(); renderGrid(); });
  }

  window.SangamI18n.ready.then(init);
})();
