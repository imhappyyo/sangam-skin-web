/* Sangam Skin — reveal-on-scroll for .reveal elements. Elements already in
 * view when observed (e.g. injected right after a fetch/render, no scroll
 * yet to trigger IntersectionObserver's first callback) are shown
 * immediately via a synchronous bounding-rect check, instead of staying at
 * opacity:0 until the user happens to scroll past them again. */
(function () {
  'use strict';

  let io = null;

  function ensureObserver() {
    if (io || !('IntersectionObserver' in window)) return io;
    io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    return io;
  }

  function init() {
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!els.length) return;

    const observer = ensureObserver();
    const vh = window.innerHeight || 800;

    els.forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < vh * 0.96 && r.bottom > 0) {
        el.classList.add('in');
      } else if (observer) {
        observer.observe(el);
      } else {
        el.classList.add('in');
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // re-scan after dynamic content (e.g. product grids) mounts
  document.addEventListener('sangam:content-mounted', init);
})();
