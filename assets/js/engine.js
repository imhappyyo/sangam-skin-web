/* Sangam Skin — routine recommendation engine (ported from the app's
 * src/engine/recommend.ts). Same scoring, same safety filters, same
 * conflict-avoidance logic — operates on window.PRODUCTS / window.CONFLICTS. */
(function () {
  'use strict';

  const RETINOIDS = ['retinol', 'retinal'];
  const EXFOLIATING_ACIDS = ['salicylic-acid', 'glycolic-acid', 'lactic-acid', 'mandelic-acid', 'pha'];
  const PREGNANCY_BLOCKED = ['retinol', 'retinal', 'salicylic-acid'];
  const BARRIER_ACTIVES = ['ceramides', 'squalane', 'panthenol', 'hyaluronic-acid', 'allantoin', 'glycerin', 'shea-butter'];

  const FAMILY_ALIASES = {
    retinol: ['retinoid', 'retinoids'],
    retinal: ['retinoid', 'retinoids'],
    'glycolic-acid': ['aha', 'acids', 'exfoliating-acids'],
    'lactic-acid': ['aha', 'acids', 'exfoliating-acids'],
    'mandelic-acid': ['aha', 'acids', 'exfoliating-acids'],
    pha: ['aha', 'pha', 'acids', 'exfoliating-acids'],
    'salicylic-acid': ['bha', 'acids', 'exfoliating-acids'],
  };

  const STRENGTH_RANK = { gentle: 0, moderate: 1, potent: 2 };
  const SIZE_CAP = { minimal: 2, standard: 3, full: 4 };

  const hasAny = (p, keys) => p.actives.some(a => keys.includes(a));
  const isRetinoid = p => hasAny(p, RETINOIDS);
  const isExfoliatingAcid = p => hasAny(p, EXFOLIATING_ACIDS);
  const isSpf = p => p.actives.includes('spf-filters');
  const pregnancySafe = p => !hasAny(p, PREGNANCY_BLOCKED);

  function conflictKeys(p) {
    const keys = new Set();
    for (const a of p.actives) {
      keys.add(a);
      (FAMILY_ALIASES[a] || []).forEach(alias => keys.add(alias));
    }
    return keys;
  }

  function avoidRules() {
    return window.CONFLICTS.filter(r => r.severity === 'avoid');
  }

  function conflictsWith(a, b) {
    const ka = conflictKeys(a), kb = conflictKeys(b);
    return avoidRules().some(r =>
      (ka.has(r.a) && kb.has(r.b)) || (ka.has(r.b) && kb.has(r.a)));
  }

  function scoreProduct(p, a) {
    let s = 0;
    a.concerns.forEach((c, i) => { if (p.concerns.includes(c)) s += 6 - Math.min(i, 2); });

    switch (a.skinType) {
      case 'oily':
        if (p.concerns.includes('oil-control')) s += 2;
        if (p.concerns.includes('pores')) s += 2;
        break;
      case 'dry':
        if (p.concerns.includes('dryness')) s += 2;
        if (hasAny(p, BARRIER_ACTIVES)) s += 1;
        break;
      case 'combo':
        if (p.concerns.includes('oil-control') || p.concerns.includes('pores')) s += 1;
        break;
      case 'sensitive':
        if (p.strength === 'gentle') s += 2;
        if (p.concerns.includes('sensitivity') || p.concerns.includes('redness')) s += 2;
        break;
    }

    if (a.age === 'under20' && p.concerns.includes('acne')) s += 1;
    if ((a.age === '40s' || a.age === '50plus') && p.concerns.includes('aging')) s += 1;
    if (a.experience === 'new' && p.beginner) s += 1;
    if (p.men) s -= 1;
    return s;
  }

  function rank(pool, a) {
    return pool
      .map(p => ({ p, s: scoreProduct(p, a) }))
      .sort((x, y) => y.s - x.s || x.p.id.localeCompare(y.p.id))
      .map(x => x.p);
  }

  function faceCandidates(a) {
    let pool = window.PRODUCTS.filter(p => p.category === 'skin' && !p.body && !isSpf(p));
    if (a.gender === 'female') pool = pool.filter(p => !p.men);
    if (a.pregnancy) pool = pool.filter(pregnancySafe);
    if (a.skinType === 'sensitive') pool = pool.filter(p => p.strength !== 'potent');
    if (a.experience !== 'advanced') pool = pool.filter(p => p.strength !== 'potent');

    if (a.experience === 'new') {
      pool = pool.filter(p => p.actives.length === 0 || p.beginner);
      const retinoidRanks = pool.filter(isRetinoid).map(p => STRENGTH_RANK[p.strength]);
      if (retinoidRanks.length > 0) {
        const lowest = Math.min(...retinoidRanks);
        pool = pool.filter(p => !isRetinoid(p) || STRENGTH_RANK[p.strength] === lowest);
      }
    }
    return pool;
  }

  function fillSession(ranked, time, cap, used) {
    const chosen = [];
    let strongCount = 0, potentCount = 0;

    for (const p of ranked) {
      if (chosen.length >= cap) break;
      if (used.has(p.id)) continue;
      if (p.time !== 'both' && p.time !== time) continue;

      const strong = isRetinoid(p) || isExfoliatingAcid(p);
      if (time === 'am' && strong) continue;
      if (time === 'pm' && strong && strongCount >= 1) continue;
      if (p.strength === 'potent' && potentCount >= 1) continue;
      if (chosen.some(c => conflictsWith(c, p))) continue;

      const primary = p.actives[0];
      if (primary && chosen.some(c => c.actives[0] === primary)) continue;

      chosen.push(p);
      used.add(p.id);
      if (strong) strongCount += 1;
      if (p.strength === 'potent') potentCount += 1;
    }
    return chosen;
  }

  function hairPicks(a, used) {
    if (!a.wantsHair) return [];
    let pool = window.PRODUCTS.filter(p => p.category === 'hair' && !used.has(p.id));
    if (a.gender === 'female') pool = pool.filter(p => !p.men);
    if (a.pregnancy) pool = pool.filter(pregnancySafe);

    const hairScore = p => (p.concerns.includes('hair-loss') ? 4 : 0) +
      (p.concerns.includes('scalp') ? 3 : 0) + (p.beginner ? 1 : 0);
    const ranked = [...pool].sort((x, y) => hairScore(y) - hairScore(x) || x.id.localeCompare(y.id));
    return ranked.slice(0, a.routineSize === 'full' ? 2 : 1);
  }

  function lipPick(a, used) {
    if (!a.wantsLips) return [];
    let pool = window.PRODUCTS.filter(p => p.category === 'lips' && !used.has(p.id));
    if (a.gender === 'female') pool = pool.filter(p => !p.men);
    if (a.pregnancy) pool = pool.filter(pregnancySafe);

    const lipScore = p => (p.concerns.includes('lip-care') ? 2 : 0) + (p.beginner ? 1 : 0);
    const ranked = [...pool].sort((x, y) => lipScore(y) - lipScore(x) || x.id.localeCompare(y.id));
    return ranked.slice(0, 1);
  }

  function noteFor(p, time) {
    if (isRetinoid(p)) return 'note_retinoid';
    if (isExfoliatingAcid(p)) return 'note_acid';
    if (p.strength === 'potent') return 'note_potent';
    if (time === 'am' && p.actives.includes('vitamin-c')) return 'note_vitc';
    return null;
  }

  /** answers: {gender, skinType, concerns[], age, experience, routineSize,
   *  pregnancy, wantsHair, wantsLips} -> {am: [...items], pm: [...items]} */
  function buildRoutine(answers) {
    const cap = SIZE_CAP[answers.routineSize];
    const ranked = rank(faceCandidates(answers), answers);
    const used = new Set();

    const amProducts = fillSession(ranked, 'am', cap, used);
    const pmProducts = fillSession(ranked, 'pm', cap, used);

    const spfPool = window.PRODUCTS.filter(p => isSpf(p) && !p.body && !used.has(p.id) &&
      (answers.gender !== 'female' || !p.men));
    const spf = rank(spfPool, answers)[0];
    if (spf) { amProducts.push(spf); used.add(spf.id); }

    for (const extra of [...hairPicks(answers, used), ...lipPick(answers, used)]) {
      if (pmProducts.some(c => conflictsWith(c, extra))) continue;
      pmProducts.push(extra);
      used.add(extra.id);
    }

    const toItem = (p, time) => {
      const note = noteFor(p, time);
      const item = { productId: p.id, time, step: p.step };
      if (note) item.note = note;
      return item;
    };
    const byStep = (x, y) => x.step - y.step || x.productId.localeCompare(y.productId);

    return {
      am: amProducts.map(p => toItem(p, 'am')).sort(byStep),
      pm: pmProducts.map(p => toItem(p, 'pm')).sort(byStep),
    };
  }

  window.SangamEngine = { buildRoutine, conflictsWith, conflictKeys };
})();
