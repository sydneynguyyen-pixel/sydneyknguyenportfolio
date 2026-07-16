/* ══════════════════════════════════════════════════════════
   MARGINAL DOODLES — hand-drawn grace notes for the margins.
   Included on a page via <script src="doodles.js"></script>.

   The idea: little rough line drawings — a plant, the cat, a
   figure of Sydney doing something — tucked into the WHITESPACE
   and GUTTERS around the work. They're characters, not ornament.
   Never over thumbnails, cards, stacks, or text someone reads.

   ── How to place one ──────────────────────────────────────
   Drop an anchor anywhere inside a positioned container (every
   .page-section is position:relative; .page-wrap is too). The
   anchor names a drawing and carries its own position:

     <div class="doodle" data-doodle="cat"
          style="right:3vw; top:10vh; width:120px;"></div>

   That's it — this script fills it with the SVG, hides it from
   assistive tech, and makes it non-interactive. Move it by
   editing the inline position; the layout never shifts because
   every doodle is absolutely positioned and pointer-events:none.

   ── How to swap in a real drawing ─────────────────────────
   Each drawing lives in ONE place: the DOODLES registry below.
   Replace a value with your own single-path SVG (keep
   stroke="currentColor" so it inherits the ink colour) and it
   updates everywhere it's used. No markup changes needed.

   Pen: matches the avatar — one loose black ink line, round
   caps, a little wobble. Not refined. That's the point.
   ══════════════════════════════════════════════════════════ */
(function () {

  // ── The drawings ── each is a self-contained, swappable SVG.
  // Loose single strokes; stroke:currentColor so the anchor's
  // colour drives them. viewBoxes are sized to each subject so
  // `width` on the anchor is the only knob you need.
  var DOODLES = {

    /* Potted sprout — a few leaves reaching up out of a little pot. */
    plant: '\
<svg viewBox="0 0 80 116" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M23 78 L28 106 Q40 111 52 106 L57 78" />\
  <path d="M18 78 Q40 85 62 78" />\
  <path d="M40 78 Q39 58 40 40" />\
  <path d="M40 50 Q29 43 20 48 Q29 57 40 53" />\
  <path d="M40 55 Q51 48 60 53 Q51 62 40 58" />\
  <path d="M40 42 Q30 31 33 19 Q43 27 42 40" />\
  <path d="M40 40 Q50 30 48 18 Q39 26 39 39" />\
</svg>',

    /* Sitting cat — the crude 5-stroke face grown a body and a\
       curled tail. Dots for eyes, a few whiskers. */
    cat: '\
<svg viewBox="0 0 98 108" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M34 33 Q30 16 25 13 Q39 16 45 26" />\
  <path d="M64 33 Q68 16 73 13 Q59 16 53 26" />\
  <path d="M45 26 Q49 24 53 26 Q71 32 70 52 Q69 66 49 67 Q29 66 28 52 Q27 32 45 26 Z" />\
  <path d="M28 51 Q17 49 10 52 M29 57 Q18 60 13 64" />\
  <path d="M70 51 Q81 49 88 52 M69 57 Q80 60 85 64" />\
  <path d="M49 55 q-3 3 -6 1 M49 55 q3 3 6 1" />\
  <circle cx="41" cy="48" r="2.1" fill="currentColor" stroke="none" />\
  <circle cx="57" cy="48" r="2.1" fill="currentColor" stroke="none" />\
  <path d="M33 65 Q22 79 27 93 Q37 100 49 100 Q61 100 71 93 Q76 79 65 65" />\
  <path d="M71 92 Q88 91 85 78 Q84 71 77 73" />\
  <path d="M43 100 q0 -4 0 -6 M55 100 q0 -4 0 -6" />\
</svg>',

    /* Shooting star — a wonky 5-point star at lower-right with three\
       streak lines trailing up-left. Round joins soften the points. */
    star: '\
<svg viewBox="0 0 122 100" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M84 40 Q88 55 90 56 Q97 57 102 58 Q97 63 93 67 Q94 74 95 80 Q88 76 84 74 Q78 78 73 81 Q73 74 73 68 Q68 63 63 59 Q70 57 77 56 Q80 48 84 40 Z" />\
  <path d="M63 47 Q44 36 20 30" />\
  <path d="M66 40 Q50 26 34 16" />\
  <path d="M71 51 Q52 46 30 44" />\
</svg>',

    /* Butterfly — two round upper wings, two lower, a thin body and\
       a pair of curling antennae. Loose and symmetric-ish. */
    butterfly: '\
<svg viewBox="0 0 94 80" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M47 28 Q46 42 47 56" />\
  <path d="M47 30 Q26 9 14 22 Q10 37 33 42 Q43 44 46 40" />\
  <path d="M47 30 Q68 9 80 22 Q84 37 61 42 Q51 44 48 40" />\
  <path d="M46 42 Q30 48 27 65 Q34 74 44 56" />\
  <path d="M48 42 Q64 48 67 65 Q60 74 50 56" />\
  <path d="M47 28 Q42 17 35 13 M47 28 Q52 17 59 13" />\
  <circle cx="34" cy="12" r="1.8" fill="currentColor" stroke="none" />\
  <circle cx="60" cy="12" r="1.8" fill="currentColor" stroke="none" />\
</svg>',

    /* Coffee cup — cup + handle on a saucer, a dark pool of coffee\
       at the rim and a wisp of steam. Object register, like the pot. */
    coffee: '\
<svg viewBox="0 0 98 86" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M25 34 Q28 56 40 61 Q51 65 60 61 Q72 56 75 34" />\
  <path d="M23 33 Q49 44 77 33 Q49 23 23 33 Z" />\
  <ellipse cx="50" cy="33" rx="21" ry="6.5" fill="currentColor" stroke="none" />\
  <path d="M76 38 Q90 37 88 48 Q86 57 72 55" />\
  <path d="M16 64 Q49 76 84 64 Q49 55 16 64 Z" />\
</svg>',

    /* Pen pot — a little cup with pens, a pencil and a brush fanning\
       out. One pencil gets a tip; the rest are single strokes. */
    pens: '\
<svg viewBox="0 0 86 102" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M22 60 Q24 90 32 95 Q43 99 54 95 Q62 90 64 60" />\
  <path d="M20 59 Q43 68 66 59 Q43 51 20 59 Z" />\
  <path d="M35 60 L26 16" />\
  <path d="M22 22 L26 16 L31 20" />\
  <path d="M43 61 L44 12" />\
  <path d="M40 60 L33 24" />\
  <path d="M50 60 L60 22" />\
  <path d="M47 61 L55 30" />\
</svg>',

    /* Pencil — my interpretation, loose + crude to match the hand: a
       diagonal pencil, sharpened graphite tip lower-left, ferrule band
       and rounded eraser upper-right, one shading tick on the body. */
    pencil: '\
<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M40 82 Q64 56 92 32" />\
  <path d="M50 92 Q74 66 101 42" />\
  <path d="M40 82 Q35 90 33 99" />\
  <path d="M50 92 Q42 96 33 99" />\
  <path d="M35 95 Q41 96 46 99" />\
  <path d="M85 39 Q90 44 95 48" />\
  <path d="M92 32 Q99 30 104 35 Q106 40 101 42" />\
  <path d="M58 74 Q62 72 65 74" />\
</svg>',

    /* Scribble ball — a tangled knot of overlapping loops. My
       interpretation: one continuous chaotic stroke wound into a rough
       ball, same pen weight as the rest. */
    scribble: '\
<svg viewBox="0 0 128 108" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M99.9 54 L106 61.2 L107.8 68.7 L104.6 74.4 L97.5 76.8 L88.9 75.8 L80.9 72.5 L75 69.1 L71.1 67.4 L67.9 68.2 L64.4 70.9 L60 74 L55.4 75.9 L51.8 75.7 L49.9 73.4 L49.8 69.8 L50.4 66 L50.5 62.4 L49.1 59 L46.4 55.3 L43.3 51.5 L40.9 47.8 L40 44.6 L40.2 42.4 L40.8 40.5 L41.2 38.2 L41.7 34.2 L43.2 28.2 L47 21.3 L53.4 15.2 L61.6 12.2 L69.5 13.6 L75 19.2 L76.8 27.4 L75.6 35.9 L73.3 42.7 L72.4 47.1 L74.5 49.7 L79.4 51.7 L85.4 53.9 L90.3 56.7 L92.4 59.4 L91.6 61.3 L89.1 62.3 L86.3 63 L84.2 64.6 L82.9 68 L81.2 73.5 L78.2 80 L73.3 85.9 L67.1 89.7 L60.6 90.9 L54.4 89.8 L48.5 87.5 L42.3 84.6 L35.3 81.2 L28.2 76.9 L22.6 71.2 L20.8 64.7 L24.2 58.4 L32.6 54 L43.6 52.5 L53.8 53.8 L59.8 55.9 L60.4 56.3 L56.8 52.9 L51.6 45.3 L48.1 34.9 L48.3 24.2 L52.4 16.2 L59 12.2 L66.4 12.3 L73.5 15.2 L80.1 19.2 L86.7 23.3 L93.6 27.2 L100 31.5 L104.8 36.2 L106.6 41.2 L105.3 45.8 L101.8 49.4 L98 52.3 L95.5 55.1 L94.8 59 L94.7 64.5 L93.4 70.9 L89.6 76.3 L83.2 78.9 L75.9 77.6 L69.7 73.2 L65.8 67.8 L63.8 64.5 L61.4 65.1 L56.2 69.7 L46.7 76.4 L33.7 82.4 L19.8 85.1 L8.5 83.7 L2.4 78.7 L2 71.8 L5.8 64.5 L11.5 57.7 L17.1 51.3 L22 45 L26.8 38.8 L32.4 33.7 L39.3 30.9 L46.5 30.8 L52.8 33 L57.4 35.8 L60.6 37.4 L63.8 36.7 L68.3 34 L74.6 30.7 L81.8 28.8 L87.9 29.2 L91.3 31.9 L91.8 35.7 L91 39.4 L91.4 42.4 L95.4 45.7 L103.2 50.6 L112.9 58.4 L120.7 68.7 L123.5 79.5 L119.6 88.2 L110 92.4 L97.5 91.2 L85.3 85.8 L75.7 78.5 L69.1 72 L64.9 67.8 L61.6 66.1 L58.7 66.2 L56 66.7 L53.8 67.2 L51.7 67.4 L48.9 67.5 L44.2 67 L37 65.4 L28 61.6 L19.2 55.4 L13.6 47.5 L12.9 39.6 L17.5 33.7 L25.5 31.1 L34.5 31.4 L41.9 32.9 L47.1 33.4 L50.9 31.3 L55.1 26.7 L60.9 21.3 L68.2 17.5 L75.4 17.1 L80.4 20.8 L81.8 27.5 L80 35.1 L76.7 41.8 L74.2 46.9 L74.1 50.4 L76.8 53.3 L81 56.2 L85.3 59.2 L88.4 62.1 L90.2 64.8 L90.9 67.3 L91.1 70.5 L90.6 75.1 L88.7 81.2 L84.4 87.8 L77.5 93.1 L69.2 95.4 L61.3 93.6 L55.6 88.3 L52.8 81.1 L52.3 74 L52 68.6 L50.1 65 L45.9 62.4 L40.3 59.7 L35.4 56.4 L33.4 52.9 L35.2 50.2 L40.1 49 L45.9 49.6 L50.6 50.7 L52.8 50.8 L53 48.5 L52.4 43.3 L52.7 36.2 L55.1 29 L59.4 23.2 L65 20 L71.1 19.4 L77.2 20.8 L83.2 23.8 L89.3 27.8 L94.6 32.8 L98 38.6 L98.1 44.7 L94.3 49.9 L87.3 53.1 L79.2 54 L72.6 53.1 L69.3 51.9 L69.9 52.5 L73.1 55.9 L76.6 62.1 L78.2 69.6 L76.9 76.2 L73.3 80.2" />\
</svg>',

    /* Lightbulb — my interpretation: round bulb, a little filament loop,\
       a screw base of stacked threads, and three short rays on top. */
    lightbulb: '\
<svg viewBox="0 0 90 108" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M32 72 Q12 62 14 40 Q16 16 45 15 Q74 16 76 40 Q78 62 58 72" />\
  <path d="M32 72 Q33 78 35 82" /><path d="M58 72 Q57 78 55 82" />\
  <path d="M34 83 Q45 87 56 83" /><path d="M35 89 Q45 93 55 89" />\
  <path d="M38 95 Q45 101 52 95" />\
  <path d="M40 72 Q40 60 41 56 Q45 47 49 56 Q50 60 50 72" />\
  <path d="M45 8 Q45 3 45 0" /><path d="M21 16 Q16 11 13 8" /><path d="M69 16 Q74 11 77 8" />\
</svg>',

    /* Two flowers with faces — Sydney\'s own drawing (a Figma SVG that wraps a
       raster PNG), saved to assets/about-dual-flowers.svg. Referenced as an
       <img> rather than inlined so its ~340KB of base64 never bloats this
       site-wide script; swap that file to change the drawing. Not tintable
       (it\'s a raster), so it ignores the anchor\'s currentColor. */
    flowers: '<img src="assets/about-dual-flowers.svg" alt="" style="width:100%;height:auto;display:block;" />',

    /* Flower — a little tulip: three-lobed bloom on a curved stem\
       with one leaf. Placed twice on the resume (right one mirrored). */
    flower: '\
<svg viewBox="0 0 60 98" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">\
  <path d="M30 44 Q28 70 31 95" />\
  <path d="M31 72 Q16 67 12 52 Q25 57 31 70" />\
  <path d="M17 44 Q12 25 25 17 Q28 30 30 44" />\
  <path d="M43 44 Q48 25 35 17 Q32 30 30 44" />\
  <path d="M25 17 Q30 9 35 17" />\
  <path d="M17 44 Q30 51 43 44" />\
</svg>',

  };

  // ── Base styles ── absolutely positioned, non-interactive,
  // inherits the ink colour. Hidden where the margins collapse
  // (narrow desktop → mobile) so a drawing never crowds the work
  // or pushes the page into a horizontal scroll.
  var css = '\
.doodle {\
  position: absolute;\
  width: 120px;\
  z-index: 1;\
  color: var(--ink, #1a1a1a);\
  pointer-events: none;\
  user-select: none;\
  opacity: 0.9;\
}\
.doodle svg { display: block; width: 100%; height: auto; overflow: visible; }\
/* The About-page line doodles are drawn at different viewBox-to-display\
   scales, so a shared user-unit stroke-width would render at different\
   on-screen weights. non-scaling-stroke pins the stroke to screen px, so\
   stroke-width:2.8 reads as a consistent ~2.8px on all three — matched to\
   the weight of the hand-drawn bottom flowers (assets/about-dual-flowers.svg). */\
.doodle[data-doodle="pencil"] svg *,\
.doodle[data-doodle="scribble"] svg *,\
.doodle[data-doodle="lightbulb"] svg * { vector-effect: non-scaling-stroke; }\
@media (max-width: 1080px) { .doodle { display: none !important; } }\
@media (prefers-reduced-motion: no-preference) {}\
';
  var style = document.createElement('style');
  style.id = 'site-doodle-styles';
  style.textContent = css;
  document.head.appendChild(style);

  function mount() {
    var anchors = document.querySelectorAll('.doodle[data-doodle]');
    for (var i = 0; i < anchors.length; i++) {
      var el = anchors[i];
      if (el.getAttribute('data-doodle-ready')) continue; // never fill twice
      var svg = DOODLES[el.getAttribute('data-doodle')];
      if (!svg) continue;                                 // unknown name → leave empty
      el.innerHTML = svg;
      el.setAttribute('aria-hidden', 'true');             // purely decorative
      el.setAttribute('data-doodle-ready', '1');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
