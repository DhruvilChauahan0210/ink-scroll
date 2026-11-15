/*
 * GSAP vs svg-scroll-draw benchmark: the code every scenario page shares.
 *
 * One HTML file per scenario takes ?lib=none|gsap|ours|ours-js. This file builds
 * that scenario's DOM from a seeded generator (so every library gets the same
 * paths and cards, byte for byte), loads the library's unmodified dist files
 * (GSAP's UMD files as classic scripts in order; svg-scroll-draw's ES modules
 * through an import map), then runs setups/<scenario>.<lib>.js, the code the
 * results page prints. It also holds the probes the harness reads
 * (apps/demo/scripts/bench-gsap.mjs): frame times, long tasks, input delay,
 * rAF calls while idle, the first correct frame, and each element's state.
 *
 * No library runs on lib=none: the same page, paths drawn and cards visible,
 * which is what the browser pays to scroll and paint it on its own.
 */
(function () {
  'use strict';

  // The versions the harness checks against node_modules and the package.
  var GSAP_VERSION = '3.15.0';
  var OURS_VERSION = '2.27.3';
  var CDN = 'https://cdn.jsdelivr.net/npm/';
  var GSAP = CDN + 'gsap@' + GSAP_VERSION + '/dist/';
  var OURS = CDN + 'svg-scroll-draw@' + OURS_VERSION + '/dist/';
  // svg-scroll-draw's ES modules, so the setups import it as an app would. (Its
  // single-file script build has scrollDraw but not scrollReveal or scrollPin.)
  var IMPORTS = {
    'svg-scroll-draw': OURS + 'index.mjs',
    'svg-scroll-draw/reveal': OURS + 'reveal/index.mjs',
    'svg-scroll-draw/pin': OURS + 'pin/index.mjs',
  };

  // Captured before any library loads, so the probes use the real one and the
  // count below sees only the libraries' own calls.
  var raf = window.requestAnimationFrame.bind(window);
  var rafCalls = 0;
  window.requestAnimationFrame = function (cb) {
    rafCalls++;
    return raf(cb);
  };

  /* ── Seeded generator ───────────────────────────────────────────────────── */

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var rand = mulberry32(20261113);
  var r = function (a, b) { return a + (b - a) * rand(); };
  var f = function (n) { return Math.round(n * 10) / 10; };

  var WORDS = ('scroll path stroke line draw frame paint layout style trigger timeline ' +
    'progress viewport offset length reveal card grid pin section motion ease value ' +
    'browser engine native script render commit raster layer compose measure').split(' ');
  function sentence(n) {
    var w = [];
    for (var i = 0; i < n; i++) w.push(WORDS[Math.floor(rand() * WORDS.length)]);
    w[0] = w[0][0].toUpperCase() + w[0].slice(1);
    return w.join(' ') + '.';
  }
  function paragraph() {
    var s = [];
    for (var i = 0; i < 4; i++) s.push(sentence(8 + Math.floor(rand() * 8)));
    return s.join(' ');
  }

  /** A filler block `vh` viewports tall, of paragraphs. */
  function filler(vh) {
    var div = document.createElement('div');
    div.className = 'filler';
    div.style.height = vh * 100 + 'vh';
    for (var i = 0; i < vh * 3; i++) {
      var p = document.createElement('p');
      p.textContent = paragraph();
      div.appendChild(p);
    }
    return div;
  }

  /** A wandering cubic path across a w × h box, `segs` segments long. */
  function wander(w, h, segs, passes) {
    var pad = 12;
    var x = pad, y = r(pad, h - pad);
    var d = 'M' + f(x) + ' ' + f(y);
    for (var i = 0; i < segs; i++) {
      var pass = Math.floor((i * passes) / segs);
      var dir = pass % 2 === 0 ? 1 : -1;
      var step = ((w - 2 * pad) * passes) / segs;
      var nx = Math.min(w - pad, Math.max(pad, x + dir * step));
      var ny = r(pad, h - pad);
      d += ' C' + f(x + dir * step * 0.4) + ' ' + f(r(pad, h - pad)) + ' ' +
        f(nx - dir * step * 0.4) + ' ' + f(r(pad, h - pad)) + ' ' + f(nx) + ' ' + f(ny);
      x = nx; y = ny;
    }
    return d;
  }

  /** A wave along y0, `segs` segments across a box w wide. */
  function wave(w, y0, amp, segs) {
    var pad = 12, step = (w - 2 * pad) / segs;
    var d = 'M' + pad + ' ' + f(y0);
    for (var i = 0; i < segs; i++) {
      var x = pad + i * step;
      d += ' C' + f(x + step / 3) + ' ' + f(y0 + r(-amp, amp)) + ' ' +
        f(x + (2 * step) / 3) + ' ' + f(y0 + r(-amp, amp)) + ' ' + f(x + step) + ' ' + f(y0);
    }
    return d;
  }

  var NS = 'http://www.w3.org/2000/svg';
  function svg(id, w, h, paths) {
    var s = document.createElementNS(NS, 'svg');
    if (id) s.id = id;
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('width', w);
    s.setAttribute('height', h);
    s.setAttribute('aria-hidden', 'true');
    paths.forEach(function (d) {
      var p = document.createElementNS(NS, 'path');
      p.setAttribute('d', d);
      s.appendChild(p);
    });
    return s;
  }

  function cards(n) {
    var grid = document.createElement('div');
    grid.className = 'grid';
    for (var i = 0; i < n; i++) {
      var c = document.createElement('article');
      c.className = 'card';
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.style.background = 'hsl(' + Math.floor(r(0, 360)) + ' 45% 82%)';
      var h = document.createElement('h3');
      h.textContent = 'Card ' + (i + 1);
      var p = document.createElement('p');
      p.textContent = sentence(14);
      c.appendChild(ph); c.appendChild(h); c.appendChild(p);
      grid.appendChild(c);
    }
    return grid;
  }

  /* ── Scenarios ───────────────────────────────────────────────────────────── */

  var CORE = [GSAP + 'gsap.min.js', GSAP + 'ScrollTrigger.min.js'];
  var DRAW = CORE.concat(GSAP + 'DrawSVGPlugin.min.js');

  var SCENARIOS = {
    'a-draw-one': {
      kind: 'draw', libs: ['none', 'gsap', 'ours', 'ours-js'], gsap: DRAW,
      build: function (main) {
        main.appendChild(filler(3));
        var wrap = document.createElement('div');
        wrap.className = 'stage';
        wrap.appendChild(svg('a', 1200, 600, [wander(1200, 600, 60, 3)]));
        main.appendChild(wrap);
        main.appendChild(filler(3));
      },
      // The path below the fold: undrawn once the library has started.
      probe: function () { return document.querySelectorAll('#a path'); },
    },
    'b1-draw-many': {
      kind: 'draw', libs: ['none', 'gsap', 'ours', 'ours-js'], gsap: DRAW,
      build: function (main) {
        main.appendChild(filler(1));
        var list = document.createElement('div');
        list.className = 'b1 stage';
        for (var i = 0; i < 40; i++) list.appendChild(svg(null, 1200, 160, [wander(1200, 160, 12, 1)]));
        main.appendChild(list);
        main.appendChild(filler(1));
      },
      probe: function () { return document.querySelectorAll('.b1 path'); },
    },
    'b2-draw-stagger': {
      kind: 'draw', libs: ['none', 'gsap', 'ours'], gsap: DRAW,
      build: function (main) {
        main.appendChild(filler(3));
        var wrap = document.createElement('div');
        wrap.className = 'stage';
        var paths = [];
        for (var i = 0; i < 40; i++) paths.push(wave(1200, 30 + i * 60, 22, 10));
        wrap.appendChild(svg('b2', 1200, 2400, paths));
        main.appendChild(wrap);
        // Long enough that the last path's window ends before the page does,
        // so svg-scroll-draw never tightens the stagger (the parity gate checks).
        main.appendChild(filler(5));
      },
      probe: function () { return document.querySelectorAll('#b2 path'); },
    },
    'c1-reveal-idiomatic': {
      kind: 'reveal', libs: ['none', 'gsap', 'ours'], gsap: CORE,
      build: function (main) {
        main.appendChild(filler(1));
        main.appendChild(cards(60));
        main.appendChild(filler(1));
      },
      probe: function () { return document.querySelectorAll('.card'); },
    },
    'c2-reveal-matched': {
      kind: 'reveal', libs: ['none', 'gsap', 'ours'], gsap: CORE,
      build: function (main) {
        main.appendChild(filler(1));
        main.appendChild(cards(60));
        main.appendChild(filler(1));
      },
      probe: function () { return document.querySelectorAll('.card'); },
    },
    'd-pin-scrub': {
      kind: 'draw', libs: ['none', 'gsap', 'ours'], gsap: DRAW,
      build: function (main, lib) {
        main.appendChild(filler(3));
        var panel = document.createElement('section');
        panel.id = 'd';
        var paths = [];
        for (var i = 0; i < 30; i++) paths.push(wander(1200, 700, 8, 1));
        panel.appendChild(svg(null, 1200, 700, paths));
        if (lib === 'none') {
          // The same scroll length as the pinned pages, with nothing pinned.
          var spacer = document.createElement('div');
          spacer.style.height = '300vh';
          spacer.appendChild(panel);
          main.appendChild(spacer);
        } else {
          main.appendChild(panel);
        }
        main.appendChild(filler(3));
      },
      probe: function () { return document.querySelectorAll('#d path'); },
    },
  };

  /* ── Element state, for the parity gate and the first-correct-frame probe ── */

  /** The visible share of a path's length, whichever dash scheme drew it. */
  function drawn(path) {
    var cs = getComputedStyle(path);
    var len = path.getTotalLength();
    var da = cs.strokeDasharray;
    if (!da || da === 'none' || !len) return 1;
    var arr = da.split(/[\s,]+/).map(parseFloat).filter(function (n) { return n === n; });
    if (arr.length % 2) arr = arr.concat(arr);
    var period = arr.reduce(function (a, b) { return a + b; }, 0);
    if (period <= 0) return 1;
    var off = parseFloat(cs.strokeDashoffset) || 0;
    var N = 400, on = 0;
    for (var k = 0; k < N; k++) {
      var pos = ((((k + 0.5) / N) * len + off) % period + period) % period;
      var acc = 0;
      for (var j = 0; j < arr.length; j++) {
        if (pos < acc + arr[j]) { if (j % 2 === 0) on++; break; }
        acc += arr[j];
      }
    }
    return on / N;
  }

  /** translateY in px, from `transform` and the individual `translate` property. */
  function ty(el) {
    var cs = getComputedStyle(el), y = 0;
    if (cs.transform && cs.transform !== 'none') y += new DOMMatrixReadOnly(cs.transform).m42;
    if (cs.translate && cs.translate !== 'none') y += parseFloat(cs.translate.split(' ')[1] || '0');
    return y;
  }

  /* ── Page assembly ───────────────────────────────────────────────────────── */

  var name = document.body.getAttribute('data-scenario');
  var sc = SCENARIOS[name];
  var params = new URLSearchParams(location.search);
  var lib = params.get('lib') || 'ours';
  if (sc.libs.indexOf(lib) < 0) lib = 'none';
  document.documentElement.setAttribute('data-lib', lib);

  var main = document.createElement('main');
  var head = document.createElement('header');
  head.className = 'bench-head';
  head.innerHTML = '<h1>' + document.title + '</h1><p>Library: <strong>' + lib +
    '</strong>. A scenario page of the GSAP vs svg-scroll-draw benchmark; scroll to run it.</p>';
  main.appendChild(head);
  sc.build(main, lib);
  document.body.appendChild(main);

  // The switcher, and the button the harness clicks during the scroll (INP-like).
  var bar = document.createElement('nav');
  bar.className = 'bench-bar';
  bar.setAttribute('aria-label', 'Library');
  sc.libs.forEach(function (l) {
    var a = document.createElement('a');
    a.href = '?lib=' + l;
    a.textContent = l;
    if (l === lib) a.setAttribute('aria-current', 'page');
    bar.appendChild(a);
  });
  var btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'probe-btn';
  btn.textContent = 'tap 0';
  bar.appendChild(btn);
  document.body.appendChild(bar);

  /* ── Probes ──────────────────────────────────────────────────────────────── */

  var bench = (window.bench = {
    scenario: name, lib: lib, kind: sc.kind,
    gsapVersion: GSAP_VERSION, oursVersion: OURS_VERSION,
    initMs: null, firstCorrectMs: null, flash: false,
    longtasks: [], loafs: [], clicks: [],
  });

  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { bench.longtasks.push([e.startTime, e.duration]); });
    }).observe({ type: 'longtask', buffered: true });
  } catch { bench.noLongtask = true; }
  try {
    new PerformanceObserver(function (l) {
      l.getEntries().forEach(function (e) { bench.loafs.push([e.startTime, e.duration, e.blockingDuration || 0]); });
    }).observe({ type: 'long-animation-frame', buffered: true });
  } catch { bench.noLoaf = true; }

  var taps = 0;
  var mc = new MessageChannel();
  btn.addEventListener('click', function (e) {
    var t0 = e.timeStamp, delay = performance.now() - t0;
    taps++;
    btn.textContent = 'tap ' + taps;
    btn.classList.toggle('on');
    // After the next frame: roughly when the result reaches the screen.
    raf(function () {
      mc.port1.onmessage = function () { bench.clicks.push([delay, performance.now() - t0]); };
      mc.port2.postMessage(0);
    });
  });

  bench.sample = function () {
    var els = sc.probe();
    var out = [];
    for (var i = 0; i < els.length; i++) {
      out.push(sc.kind === 'draw' ? drawn(els[i]) : [parseFloat(getComputedStyle(els[i]).opacity), ty(els[i])]);
    }
    return out;
  };

  /** 'native' when a path still follows a CSS view-timeline, 'js' otherwise. */
  bench.path = function () {
    if (lib === 'none' || lib === 'gsap') return null;
    var all = document.querySelectorAll('[class*="svg-scroll-draw-"]');
    for (var i = 0; i < all.length; i++) {
      var cls = all[i].classList;
      for (var j = 0; j < cls.length; j++) if (/^svg-scroll-draw-(?!host-)\S+$/.test(cls[j])) return 'native';
    }
    return 'js';
  };

  // First correct frame: the last probed element (below the fold) in its
  // starting state. A frame before that showing it finished is a flash.
  var watching = lib !== 'none';
  function initialOk() {
    var els = sc.probe(), el = els[els.length - 1];
    if (sc.kind === 'draw') {
      var d = drawn(el);
      if (d > 0.99) bench.flash = true;
      return d < 0.01;
    }
    var o = parseFloat(getComputedStyle(el).opacity);
    if (o > 0.99) bench.flash = true;
    return o < 0.01;
  }
  function watch() {
    if (!watching) return;
    if (initialOk()) {
      bench.firstCorrectMs = performance.now();
      watching = false;
      return;
    }
    raf(watch);
  }
  if (watching) raf(watch);

  var frames = null;
  bench.ready = function () { watching = false; };
  bench.startRecord = function () {
    frames = [];
    bench.recordStart = performance.now();
    performance.mark('bench-gesture-start');
    (function tick(t) {
      if (!frames) return;
      frames.push(t);
      raf(tick);
    })(performance.now());
  };
  bench.stopRecord = function () {
    performance.mark('bench-gesture-end');
    var out = { frames: frames, start: bench.recordStart, end: performance.now() };
    frames = null;
    return out;
  };
  bench.rafCalls = function () { return rafCalls; };
  bench.maxScroll = function () { return document.documentElement.scrollHeight - innerHeight; };

  /* ── Libraries, then the setup ───────────────────────────────────────────── */

  bench.setup = function (fn) {
    performance.mark('init-start');
    var t = performance.now();
    fn();
    bench.initMs = performance.now() - t;
    performance.mark('init-end');
  };

  if (lib === 'gsap') {
    sc.gsap.concat('setups/' + name + '.gsap.js').forEach(function (src) {
      var s = document.createElement('script');
      s.src = src;
      s.async = false; // executes in order, like consecutive script tags
      document.body.appendChild(s);
    });
  } else if (lib !== 'none') {
    var map = document.createElement('script');
    map.type = 'importmap';
    map.textContent = JSON.stringify({ imports: IMPORTS });
    document.head.appendChild(map);
    var mod = document.createElement('script');
    mod.type = 'module';
    mod.src = 'setups/' + name + '.' + lib + '.js';
    document.body.appendChild(mod);
  }
})();
