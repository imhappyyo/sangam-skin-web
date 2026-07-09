/* Sangam Skin — homepage: featured product grid. */
(function () {
  'use strict';

  function pickFeatured() {
    const pool = window.PRODUCTS.filter(p => !p.men && p.beginner);
    const wanted = [
      { category: 'skin', concern: 'aging' },
      { category: 'skin', concern: 'dryness' },
      { category: 'skin', concern: 'dark-spots' },
      { category: 'skin', concern: 'acne' },
      { category: 'skin', concern: 'dullness' },
      { category: 'hair' },
      { category: 'lips' },
      { category: 'lash' },
    ];
    const chosen = [];
    const used = new Set();
    wanted.forEach(w => {
      const match = pool.find(p =>
        !used.has(p.id) && p.category === w.category &&
        (!w.concern || p.concerns.includes(w.concern)));
      const fallback = !match ? pool.find(p => !used.has(p.id) && p.category === w.category) : null;
      const pick = match || fallback;
      if (pick) { chosen.push(pick); used.add(pick.id); }
    });
    return chosen;
  }

  function render() {
    const grid = document.getElementById('featured-grid');
    if (!grid) return;
    const lang = window.SangamI18n.lang;
    grid.innerHTML = pickFeatured().map(p => window.SangamCard.productCardHTML(p, lang)).join('');
    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  window.SangamI18n.ready.then(render);
  document.addEventListener('i18n:applied', render);
})();
