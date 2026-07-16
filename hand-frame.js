/* ══════════════════════════════════════════════════════════
   HAND-DRAWN IMAGE FRAME — the wobbly ink border used on the
   case-study cards, packaged as a drop-in for image placeholders.
   Included on a page via <script src="hand-frame.js"></script>.

   ── The pen ───────────────────────────────────────────────
   PEN + roundedRectCentreline + handStroke below are the SAME
   algorithm the homepage uses for its card / stack / ring frames
   (script.js, window.__handStroke). It's duplicated here rather
   than imported so this page needs nothing but its own script —
   if you retune the pen on the homepage, mirror the PEN block
   here so the two hands stay identical.

   ── How to use ────────────────────────────────────────────
   Wrap any box you want framed:

     <figure class="hand-frame" data-seed="11" style="--w:150px; --ar:1/1;">
       <img alt="" />          <!-- swap a single src in here later -->
     </figure>

   The script measures the box's live pixel size, draws a filled
   variable-width ribbon just outside its edge, and re-draws on
   resize. `data-seed` varies the wobble per placeholder so they
   read as one hand without looking stamped. The <img> is optional:
   with no src the figure shows its own placeholder fill; drop a
   src in (or replace the whole <figure> contents) and it fills.
   ══════════════════════════════════════════════════════════ */
(function () {
  // ── The shared pen (mirror of script.js PEN) ──
  var PEN = {
    AMPLITUDE:        2.4,
    FREQUENCY:        2.2,
    WEIGHT:           1.7,
    WEIGHT_VARIATION: 1.0,
    WEIGHT_FREQUENCY: 2.6,
    CORNER_OVERSHOOT: 4.5,
    END_OVERSHOOT:    16,
    END_TAPER:        0.2,
    SAMPLES:          140,
  };

  var _dist  = function (a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); };
  var _lerp2 = function (a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; };
  var _quad  = function (q, t) {
    var mt = 1 - t;
    return [ mt*mt*q[0][0] + 2*mt*t*q[1][0] + t*t*q[2][0],
             mt*mt*q[0][1] + 2*mt*t*q[1][1] + t*t*q[2][1] ];
  };
  var _fmt = function (n) { return Math.round(n * 100) / 100; };

  function roundedRectCentreline(x0, y0, x1, y1, r, cornerOver) {
    var rr = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
    var k = 0.7071;
    var o = cornerOver * k;
    var segs = [
      { line: [[x0 + rr, y0], [x1 - rr, y0]] },
      { quad: [[x1 - rr, y0], [x1 + o, y0 - o], [x1, y0 + rr]] },
      { line: [[x1, y0 + rr], [x1, y1 - rr]] },
      { quad: [[x1, y1 - rr], [x1 + o, y1 + o], [x1 - rr, y1]] },
      { line: [[x1 - rr, y1], [x0 + rr, y1]] },
      { quad: [[x0 + rr, y1], [x0 - o, y1 + o], [x0, y1 - rr]] },
      { line: [[x0, y1 - rr], [x0, y0 + rr]] },
      { quad: [[x0, y0 + rr], [x0 - o, y0 - o], [x0 + rr, y0]] },
    ];
    var lens = segs.map(function (s) {
      if (s.line) return _dist(s.line[0], s.line[1]);
      var L = 0, prev = s.quad[0];
      for (var t = 0.25; t <= 1.0001; t += 0.25) { var p = _quad(s.quad, t); L += _dist(prev, p); prev = p; }
      return L;
    });
    var total = lens.reduce(function (a, b) { return a + b; }, 0);
    var cum = [], acc = 0;
    for (var i = 0; i < lens.length; i++) { cum.push(acc); acc += lens[i]; }
    function at(u) {
      u = ((u % 1) + 1) % 1;
      var target = u * total;
      var idx = segs.length - 1;
      for (var j = 0; j < segs.length; j++) { if (target < cum[j] + lens[j]) { idx = j; break; } }
      var lt = lens[idx] ? (target - cum[idx]) / lens[idx] : 0;
      var s = segs[idx];
      return s.line ? _lerp2(s.line[0], s.line[1], lt) : _quad(s.quad, lt);
    }
    return { at: at, total: total };
  }

  function handStroke(seed, w, h, r, ins, over) {
    var P = over ? Object.assign({}, PEN, over) : PEN;
    var t = (seed * 1013904223 + 1) >>> 0;
    var rnd = function () {
      t = (Math.imul(t ^ (t >>> 15), t | 1)) >>> 0;
      t ^= t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    var ph1 = rnd() * 6.283, ph2 = rnd() * 6.283, ph3 = rnd() * 6.283, ph4 = rnd() * 6.283;
    var x0 = ins, y0 = ins, x1 = w - ins, y1 = h - ins;
    var cl = roundedRectCentreline(x0, y0, x1, y1, r, P.CORNER_OVERSHOOT);
    var TAU = 6.283185;
    var wobble = function (u) { return Math.sin(u * TAU * P.FREQUENCY + ph1) * 0.62
                                    + Math.sin(u * TAU * P.FREQUENCY * 1.9 + ph2) * 0.38; };
    var widthN = function (u) { return Math.sin(u * TAU * P.WEIGHT_FREQUENCY + ph3) * 0.6
                                    + Math.sin(u * TAU * P.WEIGHT_FREQUENCY * 1.7 + ph4) * 0.4; };
    var overU = P.END_OVERSHOOT / cl.total;
    var N = P.SAMPLES;
    var pts = [];
    for (var i = 0; i <= N; i++) {
      var f = i / N;
      var u = -overU + f * (1 + 2 * overU);
      var c = cl.at(u);
      var a = cl.at(u - 0.004), b = cl.at(u + 0.004);
      var tx = b[0] - a[0], ty = b[1] - a[1];
      var tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      var nx = -ty, ny = tx;
      var off = P.AMPLITUDE * wobble(u);
      var cx = c[0] + nx * off, cy = c[1] + ny * off;
      var edge = Math.min(f, 1 - f) / (overU + 0.05);
      var taper = P.END_TAPER + (1 - P.END_TAPER) * Math.min(1, edge);
      var wd = Math.max(0.15, (P.WEIGHT + P.WEIGHT_VARIATION * widthN(u)) * taper);
      pts.push([cx, cy, nx, ny, wd]);
    }
    var d = 'M';
    for (var m = 0; m < pts.length; m++) { var p = pts[m]; d += (m ? 'L' : '') + _fmt(p[0] + p[2] * p[4] / 2) + ' ' + _fmt(p[1] + p[3] * p[4] / 2) + ' '; }
    for (var n = pts.length - 1; n >= 0; n--) { var q = pts[n]; d += 'L' + _fmt(q[0] - q[2] * q[4] / 2) + ' ' + _fmt(q[1] - q[3] * q[4] / 2) + ' '; }
    return d + 'Z';
  }

  // ── Base styles ──
  var css = '\
.hand-frame {\
  position: relative;\
  display: block;\
  width: var(--w, 100%);\
  margin: 0;\
}\
.hand-frame::before { content: ""; display: block; padding-top: 0; }\
.hand-frame:not(.hand-frame--inline) > img,\
.hand-frame > .hand-frame-fill {\
  display: block;\
  width: 100%;\
  aspect-ratio: var(--ar, 1 / 1);\
  object-fit: cover;\
  border-radius: 14px;\
  background: #fff;\
}\
.hand-frame:not(.hand-frame--inline) > img[src=""], .hand-frame:not(.hand-frame--inline) > img:not([src]) { background: #fbfaf8; }\
.hand-frame--inline { display: inline-flex; width: auto; }\
.hand-frame-svg {\
  position: absolute; inset: 0;\
  width: 100%; height: 100%;\
  overflow: visible;\
  pointer-events: none;\
  color: var(--ink, #1a1a1a);\
}\
.hand-frame-svg path { fill: currentColor; stroke: none; }\
';
  var style = document.createElement('style');
  style.id = 'hand-frame-styles';
  style.textContent = css;
  document.head.appendChild(style);

  var SVGNS = 'http://www.w3.org/2000/svg';

  function drawFrame(fig) {
    var w = Math.round(fig.offsetWidth), h = Math.round(fig.offsetHeight);
    if (!w || !h) return;
    var svg = fig.querySelector('.hand-frame-svg');
    if (svg && +svg.dataset.w === w && +svg.dataset.h === h) return; // box unchanged
    var seed = +fig.getAttribute('data-seed') || 1;
    // Corner radius: default 14 ≈ the image's rounding; data-r="pill" traces a
    // fully-rounded pill (handStroke clamps the radius to half the box), or a
    // numeric data-r for a custom radius. ins -1 traces just outside the edge.
    var rAttr = fig.getAttribute('data-r');
    var r = rAttr === 'pill' ? h : (rAttr ? +rAttr : 14);
    // Small boxes (resume logos ~40px, skill pills ~28px) can't wear the
    // full-size pen: its amplitude and long end-tails read as frantic at this
    // scale. Below ~90px min dimension, swap in a calmer hand — gentler wobble,
    // fewer waves, tighter corners, short tails — so the ink stays hand-drawn
    // but reads as a clean straight-ish outline. Larger frames keep the full pen.
    var over = null;
    if (Math.min(w, h) < 90) {
      over = {
        AMPLITUDE:        0.9,
        FREQUENCY:        1.5,
        WEIGHT:           1.3,
        WEIGHT_VARIATION: 0.45,
        CORNER_OVERSHOOT: 2.2,
        END_OVERSHOOT:    5,
      };
    }
    var d = handStroke(seed * 7 + 3, w, h, r, -1, over);
    if (!svg) {
      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'hand-frame-svg');
      svg.setAttribute('aria-hidden', 'true');
      fig.appendChild(svg);
    }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.dataset.w = w; svg.dataset.h = h;
    var path = svg.querySelector('path') || svg.appendChild(document.createElementNS(SVGNS, 'path'));
    path.setAttribute('d', d);
  }

  function mount() {
    var figs = document.querySelectorAll('.hand-frame');
    for (var i = 0; i < figs.length; i++) drawFrame(figs[i]);
    if (typeof ResizeObserver === 'function') {
      var ro = new ResizeObserver(function (entries) {
        for (var j = 0; j < entries.length; j++) drawFrame(entries[j].target);
      });
      for (var k = 0; k < figs.length; k++) ro.observe(figs[k]);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
