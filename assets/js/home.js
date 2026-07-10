/* Sangam Skin — homepage (BIO-LUXE FUTURIST):
 *   · ingredient marquee populated from window.INGREDIENTS (localized, no keys)
 *   · featured product grid with its own photo-less data-card markup ([data-tilt])
 *   · dispatches 'sangam:content-mounted' after injections so SangamFX re-scans
 *   · re-renders on 'i18n:applied' (language switch), guarded against
 *     duplicate renders for the same language (chrome.js re-applies i18n once
 *     after injecting the header, which would otherwise restart the marquee).
 */
(function () {
  'use strict';

  var MARQUEE_KEYS = [
    'niacinamide', 'retinol', 'bakuchiol', 'vitamin-c', 'hyaluronic-acid',
    'peptides', 'ceramides', 'azelaic-acid', 'spf-filters'
  ];

  var TIME_KEY = { am: 'prod_time_am', pm: 'prod_time_pm', both: 'prod_time_both' };
  var TIME_BADGE = { am: 'am', pm: 'pm', both: 'ok' };

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function initials(nameEn) {
    return nameEn
      .replace(/[^A-Za-z0-9 %+.]/g, '')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(function (w) { return w[0]; })
      .join('')
      .toUpperCase();
  }

  function ingredientName(key, lang) {
    var list = window.INGREDIENTS || [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].key === key) return list[i].name[lang] || list[i].name.en;
    }
    return null;
  }

  /* ------------------------- ingredient marquee ------------------------- */
  function renderMarquee(lang) {
    var host = document.getElementById('ingredient-marquee');
    if (!host) return;
    var names = MARQUEE_KEYS
      .map(function (k) { return ingredientName(k, lang); })
      .filter(Boolean);
    if (!names.length) {
      names = (window.INGREDIENTS || []).slice(0, 9).map(function (i) {
        return i.name[lang] || i.name.en;
      });
    }
    var items = names.map(function (n) {
      return '<span class="marquee__item">' + esc(n) + '</span>' +
             '<span class="marquee__dot" aria-hidden="true"></span>';
    }).join('');
    // A fresh .fx-marquee element each render → SangamFX sets it up cleanly
    // again after a language switch (setup is once-per-element).
    host.innerHTML =
      '<div class="fx-marquee"><div class="fx-marquee__track">' + items + '</div></div>';
  }

  /* -------------------------- featured products ------------------------- */
  function pickFeatured() {
    var all = window.PRODUCTS || [];
    var pool = all.filter(function (p) { return !p.men && p.beginner; });
    var wanted = [
      { category: 'skin', concern: 'aging' },
      { category: 'skin', concern: 'dryness' },
      { category: 'skin', concern: 'dark-spots' },
      { category: 'skin', concern: 'acne' },
      { category: 'skin', concern: 'dullness' },
      { category: 'hair' },
      { category: 'lips' },
      { category: 'lash' }
    ];
    var chosen = [];
    var used = {};
    wanted.forEach(function (w) {
      var match = null, fallback = null;
      for (var i = 0; i < pool.length; i++) {
        var p = pool[i];
        if (used[p.id] || p.category !== w.category) continue;
        if (!w.concern || (p.concerns && p.concerns.indexOf(w.concern) !== -1)) { match = p; break; }
        if (!fallback) fallback = p;
      }
      var pick = match || fallback;
      if (pick) { chosen.push(pick); used[pick.id] = true; }
    });
    return chosen;
  }

  function featuredCardHTML(p, lang, index) {
    var name = p.name[lang] || p.name.en;
    var blurb = p.blurb[lang] || p.blurb.en;
    var actives = (p.actives || []).slice(0, 3)
      .map(function (k) { return ingredientName(k, lang); })
      .filter(Boolean);
    var badge = TIME_BADGE[p.time] || 'ok';
    var timeLabel = window.t(TIME_KEY[p.time] || 'prod_time_both');
    return (
      '<a class="fcard" href="/product.html#' + encodeURIComponent(p.id) + '"' +
        ' data-tilt data-fx="up" data-fx-delay="' + ((index % 4) * 80) + '">' +
        '<div class="fcard__top">' +
          '<div class="tile tile--' + esc(p.category) + ' fcard__tile">' + esc(initials(p.name.en)) + '</div>' +
          '<span class="badge badge--' + badge + '">' + esc(timeLabel) + '</span>' +
        '</div>' +
        '<h3 class="fcard__name">' + esc(name) + '</h3>' +
        '<p class="fcard__blurb">' + esc(blurb) + '</p>' +
        (actives.length
          ? '<div class="fcard__actives">' +
              actives.map(function (a) { return '<span>' + esc(a) + '</span>'; }).join('') +
            '</div>'
          : '') +
      '</a>'
    );
  }

  function renderFeatured(lang) {
    var grid = document.getElementById('featured-grid');
    if (!grid) return;
    grid.innerHTML = pickFeatured()
      .map(function (p, i) { return featuredCardHTML(p, lang, i); })
      .join('');
  }

  /* ------------------------------ lifecycle ----------------------------- */
  var renderedLang = null;

  function render() {
    if (!window.SangamI18n) return;
    var lang = window.SangamI18n.lang;
    if (lang === renderedLang) return; // chrome.js reapply fires i18n:applied again
    renderedLang = lang;
    renderMarquee(lang);
    renderFeatured(lang);
    document.dispatchEvent(new Event('sangam:content-mounted'));
  }

  if (window.SangamI18n && window.SangamI18n.ready) {
    window.SangamI18n.ready.then(render);
  }
  document.addEventListener('i18n:applied', render);
})();
