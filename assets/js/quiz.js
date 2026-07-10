/* Sangam Skin — interactive quiz controller. Renders window.QUIZ one
 * question per screen, single-select auto-advances, multi-select needs
 * Continue; on the last answer it builds a routine via SangamEngine and
 * hands off to result.html via sessionStorage.
 * BIO-LUXE pass: directional question transitions (fade/slide via a class
 * toggle), immediate check-morph feedback, smoother multi-select updates —
 * data flow and i18n keys unchanged. */
(function () {
  'use strict';

  const STORAGE_KEY = 'sangam-skin-web/quiz-result';
  let step = 0;
  let pending = null;   // auto-advance timer (single-select)
  let finished = false;
  const answers = {};

  function lang() { return window.SangamI18n.lang; }
  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* dir: 'fwd' | 'back' | undefined (in-place re-render, e.g. language switch) */
  function render(dir) {
    const stage = document.querySelector('[data-quiz-stage]');
    const q = window.QUIZ[step];
    const total = window.QUIZ.length;
    const l = lang();

    document.querySelector('[data-quiz-progress]').style.width = `${(step / total) * 100}%`;
    document.querySelector('[data-quiz-counter]').textContent =
      window.t('quiz_counter', { n: step + 1, total });
    document.querySelector('[data-quiz-back]').style.visibility = step === 0 ? 'hidden' : 'visible';

    const selected = new Set(
      q.multi ? (answers[q.key] || []) : [answers[q.key]].filter(v => v !== undefined)
    );

    const optionsHTML = q.options.map(o => {
      const val = JSON.stringify(o.value);
      const active = q.multi ? selected.has(o.value) : answers[q.key] === o.value;
      return `
        <button type="button" class="quiz-option${active ? ' is-active' : ''}" data-quiz-option='${val.replace(/'/g, '&#39;')}'>
          <span class="quiz-option__check" aria-hidden="true"></span>
          <span class="quiz-option__text">
            <strong>${o.label[l] || o.label.en}</strong>
            <small>${o.sub[l] || o.sub.en}</small>
          </span>
        </button>`;
    }).join('');

    const continueBtn = q.multi
      ? `<button class="btn btn--primary quiz__continue fx-glow-pulse" type="button" data-quiz-continue disabled>
           <span data-quiz-continue-label></span>
         </button>`
      : '';

    const dirClass = dir === 'fwd' ? ' quiz-question--fwd' : dir === 'back' ? ' quiz-question--back' : '';
    stage.innerHTML = `
      <div class="quiz-question${dirClass}" key="${q.key}">
        <h2>${q.title[l] || q.title.en}</h2>
        <p class="quiz-question__sub">${q.sub[l] || q.sub.en}</p>
        <div class="quiz-options${q.multi ? ' quiz-options--multi' : ''}">${optionsHTML}</div>
        ${continueBtn}
      </div>`;

    if (q.multi) updateContinueLabel(q);

    stage.querySelectorAll('[data-quiz-option]').forEach(btn => {
      btn.addEventListener('click', () =>
        onSelect(q, JSON.parse(btn.getAttribute('data-quiz-option')), btn));
    });
    const cont = stage.querySelector('[data-quiz-continue]');
    if (cont) cont.addEventListener('click', () => advance());
  }

  function updateContinueLabel(q) {
    const picked = (answers[q.key] || []).length;
    const label = document.querySelector('[data-quiz-continue-label]');
    const btn = document.querySelector('[data-quiz-continue]');
    if (!label || !btn) return;
    label.textContent = picked > 0
      ? window.t('quiz_pick_up_to', { max: q.max, picked })
      : window.t('quiz_continue');
    btn.disabled = picked === 0;
  }

  function onSelect(q, value, btn) {
    if (q.multi) {
      // toggle in place — no full re-render, so the check morph animates
      const list = answers[q.key] || (answers[q.key] = []);
      const idx = list.indexOf(value);
      if (idx >= 0) { list.splice(idx, 1); btn.classList.remove('is-active'); }
      else if (list.length < q.max) { list.push(value); btn.classList.add('is-active'); }
      updateContinueLabel(q);
    } else {
      if (pending) return; // an advance is already queued
      answers[q.key] = value;
      const stage = document.querySelector('[data-quiz-stage]');
      stage.querySelectorAll('.quiz-option').forEach(b =>
        b.classList.toggle('is-active', b === btn));
      pending = setTimeout(() => { pending = null; advance(); }, 300);
    }
  }

  /* slide the old question out, then render the next one sliding in */
  function transition(dir) {
    const stage = document.querySelector('[data-quiz-stage]');
    const current = stage.querySelector('.quiz-question');
    if (reduced() || !current) { render(dir); return; }
    current.classList.add(dir === 'back' ? 'quiz-question--exit-back' : 'quiz-question--exit');
    setTimeout(() => render(dir), 180);
  }

  function advance() {
    if (step < window.QUIZ.length - 1) {
      step += 1;
      transition('fwd');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      finish();
    }
  }

  function goBack() {
    if (step === 0) return;
    if (pending) { clearTimeout(pending); pending = null; }
    step -= 1;
    transition('back');
  }

  function finish() {
    finished = true;
    const stage = document.querySelector('[data-quiz-stage]');
    document.querySelector('[data-quiz-progress]').style.width = '100%';
    stage.innerHTML = `
      <div class="quiz-building">
        <div class="quiz-building__pulse" aria-hidden="true"><span></span><span></span></div>
        <p>${window.t('quiz_building')}</p>
      </div>`;

    setTimeout(() => {
      const routine = window.SangamEngine.buildRoutine(answers);
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, routine }));
      window.location.href = '/result.html';
    }, 700);
  }

  function init() {
    document.querySelector('[data-quiz-back]').addEventListener('click', goBack);
    render();
  }

  window.SangamI18n.ready.then(init);
  document.addEventListener('i18n:applied', () => {
    if (finished) {
      const p = document.querySelector('.quiz-building p');
      if (p) p.textContent = window.t('quiz_building');
      return;
    }
    render();
  });
})();
