/* Sangam Skin — routine result page. Reads the routine built by quiz.js
 * from sessionStorage and renders AM/PM step lists with real products.
 * BIO-LUXE pass: count-up hero total (via SangamFX data-countup), staggered
 * data-fx reveals on step rows, mint step-number chips. Keys + links kept. */
(function () {
  'use strict';

  const STORAGE_KEY = 'sangam-skin-web/quiz-result';

  function stepRowHTML(item, lang, idx) {
    const p = window.PRODUCTS.find(x => x.id === item.productId);
    if (!p) return '';
    const name = p.name[lang] || p.name.en;
    const note = item.note ? window.t(item.note) : '';
    const stepNum = p.step || idx + 1;
    return `
      <a class="result-row" href="/product.html#${encodeURIComponent(p.id)}" data-fx="up" data-fx-delay="${Math.min(idx * 90, 540)}">
        <span class="result-row__step" aria-hidden="true">${String(stepNum).padStart(2, '0')}</span>
        <div class="tile tile--${p.category} result-row__tile">${window.SangamCard.initials(p.name.en)}</div>
        <div class="result-row__body">
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

    // hero count-up: hand the real total to SangamFX (counts when scanned);
    // fx.js guards re-counting via .fx-counted, so language switches keep it.
    const totalEl = document.querySelector('[data-result-total]');
    if (totalEl && !totalEl.classList.contains('fx-counted')) {
      totalEl.setAttribute('data-countup', String(total));
      if (!window.SangamFX) totalEl.textContent = String(total); // no-JS-fx fallback
    }

    document.querySelector('[data-result-count]').textContent = window.t('result_sub', { count: total });

    const amEl = document.querySelector('[data-result-am]');
    const pmEl = document.querySelector('[data-result-pm]');
    amEl.innerHTML = routine.am.length
      ? routine.am.map((i, idx) => stepRowHTML(i, lang, idx)).join('')
      : `<p class="result__empty">${window.t('result_empty_am')}</p>`;
    pmEl.innerHTML = routine.pm.length
      ? routine.pm.map((i, idx) => stepRowHTML(i, lang, idx)).join('')
      : `<p class="result__empty">${window.t('result_empty_pm')}</p>`;

    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  window.SangamI18n.ready.then(render);
  document.addEventListener('i18n:applied', render);
})();
