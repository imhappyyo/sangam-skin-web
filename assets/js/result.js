/* Sangam Skin — routine result page. Reads the routine built by quiz.js
 * from sessionStorage and renders AM/PM step lists with real products. */
(function () {
  'use strict';

  const STORAGE_KEY = 'sangam-skin-web/quiz-result';

  function stepRowHTML(item, lang) {
    const p = window.PRODUCTS.find(x => x.id === item.productId);
    if (!p) return '';
    const name = p.name[lang] || p.name.en;
    const note = item.note ? window.t(item.note) : '';
    return `
      <a class="result-row" href="/product.html#${encodeURIComponent(p.id)}">
        <div class="tile tile--${p.category} result-row__tile">${window.SangamCard.initials(p.name.en)}</div>
        <div class="result-row__body">
          <span class="result-row__step">${p.step ? '0' + p.step : ''}</span>
          <h4>${name}</h4>
          ${note ? `<p class="result-row__note">${note}</p>` : ''}
        </div>
      </a>`;
  }

  function render() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) { window.location.href = '/quiz.html'; return; }
    const { routine } = JSON.parse(raw);
    const lang = window.SangamI18n.lang;
    const total = routine.am.length + routine.pm.length;

    document.querySelector('[data-result-count]').textContent = window.t('result_sub', { count: total });

    const amEl = document.querySelector('[data-result-am]');
    const pmEl = document.querySelector('[data-result-pm]');
    amEl.innerHTML = routine.am.length
      ? routine.am.map(i => stepRowHTML(i, lang)).join('')
      : `<p class="result__empty">${window.t('result_empty_am')}</p>`;
    pmEl.innerHTML = routine.pm.length
      ? routine.pm.map(i => stepRowHTML(i, lang)).join('')
      : `<p class="result__empty">${window.t('result_empty_pm')}</p>`;

    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  window.SangamI18n.ready.then(render);
  document.addEventListener('i18n:applied', render);
})();
