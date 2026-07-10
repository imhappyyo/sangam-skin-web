/* Sangam Skin — SangamFX motion engine (BIO-LUXE FUTURIST).
 *
 * Declarative grammar (styles live in tokens.css):
 *   [data-fx="up|fade|clip|scale|left|right"] (+ data-fx-delay="120")
 *       → IntersectionObserver reveal. Elements already in view when scanned
 *         are shown immediately (no stuck-invisible bug).
 *   [data-countup="118"] (+ data-countup-suffix="%")
 *       → counts 0→value over ~1.2s when scrolled into view.
 *   [data-tilt]
 *       → 3D perspective tilt (max 7deg) + sheen sweep; disabled on touch.
 *   .fx-marquee > .fx-marquee__track
 *       → seamless infinite marquee (content duplicated here in JS).
 *   canvas[data-particles] or SangamFX.particles(canvas, {color})
 *       → molecule-network canvas, devicePixelRatio-aware, paused offscreen.
 *   .reveal (legacy) → treated exactly like data-fx="up" (adds .in).
 *
 * API: window.SangamFX = { scan, countUp, tilt, particles }
 * Auto-inits on DOMContentLoaded AND on 'sangam:content-mounted'.
 * All motion respects prefers-reduced-motion (everything visible, static).
 */
(function () {
  'use strict';

  if (window.SangamFX) return; // idempotent (reveal.js shim may inject us too)

  // Gate CSS hidden-states on this class so content is never invisible
  // when JS doesn't run.
  document.documentElement.classList.add('sangam-fx');

  var EASE = 'cubic-bezier(.16,1,.3,1)';

  function reduced() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function isTouch() {
    return !!(window.matchMedia && window.matchMedia('(hover: none), (pointer: coarse)').matches);
  }
  function inView(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    return r.top < vh * 0.96 && r.bottom > 0;
  }

  /* ============================ reveal ============================ */
  var io = null;
  function ensureIO() {
    if (io || !('IntersectionObserver' in window)) return io;
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        revealNow(en.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' });
    return io;
  }

  function revealNow(el) {
    if (el.hasAttribute('data-fx')) {
      var delay = parseInt(el.getAttribute('data-fx-delay') || '0', 10) || 0;
      if (delay > 0 && !reduced()) {
        el.style.transitionDelay = delay + 'ms';
        // clear once fired so later hover/i18n transitions aren't lagged
        setTimeout(function () { el.style.transitionDelay = ''; }, delay + 800);
      }
      el.classList.add('fx-in');
    }
    if (el.classList.contains('reveal')) el.classList.add('in');
    if (el.hasAttribute('data-countup')) countUp(el);
  }

  /* ============================ count-up ============================ */
  function countUp(el) {
    if (!el || el.classList.contains('fx-counted')) return;
    var raw = el.getAttribute('data-countup');
    var target = parseFloat(raw);
    if (isNaN(target)) return;
    el.classList.add('fx-counted');
    var suffix = el.getAttribute('data-countup-suffix') || '';
    var decimals = (String(raw).split('.')[1] || '').length;
    function fmt(v) { return (decimals ? v.toFixed(decimals) : String(Math.round(v))) + suffix; }

    if (reduced() || !window.requestAnimationFrame) { el.textContent = fmt(target); return; }

    var dur = 1200, start = null, done = false;
    function frame(ts) {
      if (done) return;
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(frame);
      else { done = true; el.textContent = fmt(target); }
    }
    requestAnimationFrame(frame);
    // rAF pauses in hidden tabs — make sure the real number is never lost
    setTimeout(function () {
      if (!done && document.hidden) { done = true; el.textContent = fmt(target); }
    }, dur + 600);
  }

  /* ============================ tilt ============================ */
  function tilt(el) {
    if (!el || el.__fxTilt) return;
    el.__fxTilt = true;
    if (isTouch()) { el.classList.add('fx-tilt-off'); return; }

    var MAX = 7; // deg

    function move(e) {
      if (reduced()) return;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = (e.clientX - r.left) / r.width;   // 0..1
      var py = (e.clientY - r.top) / r.height;   // 0..1
      var rx = (0.5 - py) * (MAX * 2);           // rotateX: ±7deg
      var ry = (px - 0.5) * (MAX * 2);           // rotateY: ±7deg
      el.style.transition = 'transform .12s ease-out';
      el.style.transform =
        'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
      el.style.setProperty('--sheen-x', (px * 100).toFixed(1) + '%');
      el.style.setProperty('--sheen-y', (py * 100).toFixed(1) + '%');
      el.style.setProperty('--sheen-o', '1');
    }
    function leave() {
      el.style.transition = 'transform .6s ' + EASE;
      el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      el.style.setProperty('--sheen-o', '0');
    }

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
  }

  /* ============================ marquee ============================ */
  function setupMarquee(m) {
    if (!m || m.__fxMarquee) return;
    var track = m.querySelector('.fx-marquee__track');
    if (!track) return;
    m.__fxMarquee = true;
    if (reduced()) return; // tokens.css keeps it static + wrapped

    // Wrap the original items in a sequence …
    var seq = document.createElement('div');
    seq.className = 'fx-marquee__seq';
    while (track.firstChild) seq.appendChild(track.firstChild);
    track.appendChild(seq);

    // … transfer the track's item gap onto the sequence (as gap + trailing
    // padding) so translateX(-50%) lands exactly one sequence over — seamless.
    var gap = getComputedStyle(track).columnGap;
    if (!gap || gap === 'normal' || !(parseFloat(gap) >= 0)) gap = '48px';
    seq.style.gap = gap;
    seq.style.paddingRight = gap;
    track.style.gap = '0px';

    // Repeat the items until the sequence at least fills the viewport strip.
    var guard = 0;
    var baseChildren = Array.prototype.slice.call(seq.children);
    while (m.clientWidth > 0 && seq.scrollWidth < m.clientWidth && guard++ < 8) {
      baseChildren.forEach(function (c) {
        var copy = c.cloneNode(true);
        copy.setAttribute('aria-hidden', 'true');
        seq.appendChild(copy);
      });
    }

    // Then duplicate the whole sequence once → track = 2 identical halves.
    var clone = seq.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    track.appendChild(clone);
    track.classList.add('fx-marquee__track--run');
  }

  /* ============================ particles ============================ */
  /* Molecule-network canvas: ~60 drifting dots + lines between near pairs. */
  function particles(canvas, opts) {
    if (!canvas || typeof canvas.getContext !== 'function') return null;
    if (canvas.__fxParticles) return canvas.__fxParticles;
    opts = opts || {};
    var color = opts.color || '#4AF0B8';
    var count = opts.count || 60;
    var linkDist = opts.linkDist || 120;
    var ctx = canvas.getContext('2d');
    if (!ctx) return null;

    var m = /^#?([0-9a-f]{6})$/i.exec(color);
    var rgb = m
      ? [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)]
      : [74, 240, 184];

    var w = 0, h = 0, pts = [], raf = null, running = false, visible = true;

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.6
        });
      }
    }
    function step() {
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
      }
    }
    function draw() {
      ctx.clearRect(0, 0, w, h);
      var base = 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',';
      for (var i = 0; i < pts.length; i++) {
        for (var j = i + 1; j < pts.length; j++) {
          var dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < linkDist) {
            ctx.strokeStyle = base + ((1 - d / linkDist) * 0.28).toFixed(3) + ')';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
      for (var k = 0; k < pts.length; k++) {
        ctx.fillStyle = base + '0.8)';
        ctx.beginPath();
        ctx.arc(pts[k].x, pts[k].y, pts[k].r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    function loop() {
      if (!running) return;
      step(); draw();
      raf = requestAnimationFrame(loop);
    }
    function start() {
      if (running || reduced()) return;
      running = true;
      raf = requestAnimationFrame(loop);
    }
    function stop() {
      running = false;
      if (raf) { cancelAnimationFrame(raf); raf = null; }
    }

    size(); seed(); draw(); // static first frame (this is all reduced-motion gets)

    if (!reduced()) {
      // pause when offscreen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          visible = entries[0] ? entries[0].isIntersecting : true;
          if (visible && !document.hidden) start(); else stop();
        }, { threshold: 0 }).observe(canvas);
      } else {
        start();
      }
      // pause when the tab is hidden
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) stop(); else if (visible) start();
      });
      // keep DPR/size honest on resize
      var rt = null;
      window.addEventListener('resize', function () {
        clearTimeout(rt);
        rt = setTimeout(function () {
          size();
          for (var i = 0; i < pts.length; i++) {
            pts[i].x = Math.min(pts[i].x, w);
            pts[i].y = Math.min(pts[i].y, h);
          }
          if (!running) draw();
        }, 150);
      });
    }

    var handle = { start: start, stop: stop, canvas: canvas };
    canvas.__fxParticles = handle;
    return handle;
  }

  /* ============================ scan ============================ */
  function scan(rootEl) {
    var scope = (rootEl && typeof rootEl.querySelectorAll === 'function') ? rootEl : document;

    // reveals + countups (legacy .reveal treated as data-fx="up")
    var targets = scope.querySelectorAll(
      '[data-fx]:not(.fx-in), .reveal:not(.in), [data-countup]:not(.fx-counted)'
    );
    var observer = ensureIO();
    Array.prototype.forEach.call(targets, function (el) {
      // empty count-up targets have a zero-size rect that IntersectionObserver
      // (threshold .08) would never report as intersecting — seed a "0" so
      // they measure, and reveal anything still zero-sized immediately.
      if (el.hasAttribute('data-countup') && !el.textContent) el.textContent = '0';
      var r = el.getBoundingClientRect();
      var zeroSize = r.width === 0 && r.height === 0;
      if (reduced() || !observer || zeroSize || inView(el)) revealNow(el);
      else observer.observe(el);
    });

    // marquees
    Array.prototype.forEach.call(scope.querySelectorAll('.fx-marquee'), setupMarquee);

    // tilts
    Array.prototype.forEach.call(scope.querySelectorAll('[data-tilt]'), tilt);

    // declarative particle canvases:
    // <canvas data-particles data-particles-color="#4AF0B8" data-particles-count="60">
    Array.prototype.forEach.call(scope.querySelectorAll('canvas[data-particles]'), function (c) {
      particles(c, {
        color: c.getAttribute('data-particles-color') || undefined,
        count: parseInt(c.getAttribute('data-particles-count') || '', 10) || undefined,
        linkDist: parseInt(c.getAttribute('data-particles-linkdist') || '', 10) || undefined
      });
    });
  }

  window.SangamFX = { scan: scan, countUp: countUp, tilt: tilt, particles: particles };

  function init() { scan(document); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
  // re-scan after dynamic content (product grids, results) mounts
  document.addEventListener('sangam:content-mounted', function () { scan(document); });
})();
