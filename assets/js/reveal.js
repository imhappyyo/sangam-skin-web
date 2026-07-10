/* Sangam Skin — legacy shim. The reveal-on-scroll system now lives in
 * assets/js/fx.js (window.SangamFX), which also handles .reveal elements.
 * This file remains so existing <script src="/assets/js/reveal.js"> tags on
 * older pages keep working: it makes sure fx.js is present and scanned. */
(function () {
  'use strict';

  function scanWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { window.SangamFX.scan(); });
    } else {
      window.SangamFX.scan();
    }
  }

  if (window.SangamFX) { scanWhenReady(); return; }

  // fx.js isn't on this page — inject it (it auto-inits and scans by itself).
  var s = document.createElement('script');
  s.src = '/assets/js/fx.js';
  s.onerror = function () {
    // last resort: never leave content invisible
    document.documentElement.classList.remove('sangam-fx');
    Array.prototype.forEach.call(document.querySelectorAll('.reveal'), function (el) {
      el.classList.add('in');
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-fx]'), function (el) {
      el.classList.add('fx-in');
    });
  };
  document.head.appendChild(s);
})();
