/* ══════════════════════════════════════════════════════════
   SHARED TOP NAV — the single nav implementation for the site.
   Included on every page via <script src="nav.js"></script>.
   Injects its own styles + markup + active state, so a page
   needs nothing but the script tag. There are no per-page nav
   copies anymore.

   Behaviour (agreed): transparent while floating over the home
   hero, then gains a frosted background once you scroll past it.
   Pages without a hero (all subpages) render frosted from the top.
   ══════════════════════════════════════════════════════════ */
(function () {
  // ── Styles ── injected into <head> immediately so the nav is
  // never shown unstyled. Mirrors the original homepage nav.
  var css = '\
.site-nav {\
  position: sticky; top: 0; z-index: 2000;\
  height: var(--nav-h, 60px);\
  display: flex; align-items: center; gap: 20px;\
  padding: 0 24px;\
  background: transparent;\
  border-bottom: 1px solid transparent;\
  transition: background 0.25s ease, backdrop-filter 0.25s ease, border-color 0.25s ease;\
}\
/* Frosted bar — on subpages always, on the homepage once scrolled. */\
.site-nav.is-solid {\
  background: rgba(242,242,240,0.72);\
  -webkit-backdrop-filter: blur(14px) saturate(1.1);\
  backdrop-filter: blur(14px) saturate(1.1);\
  border-bottom-color: rgba(0,0,0,0.06);\
}\
.site-nav .nav-brand { display: flex; align-items: center; gap: 11px; flex-shrink: 0; text-decoration: none; }\
.site-nav .nav-brand { gap: 5px; }\
.site-nav .nav-logo { width: 25px; height: auto; display: block; overflow: visible; color: #1a1a1a; transform-origin: 55% 100%; margin-top: -6px; }\
/* The flower grows up from its stem the first time the site opens, and sways once on hover. */\
@keyframes nav-flower-grow { from { clip-path: inset(100% -20% 0 -20%); } to { clip-path: inset(-10% -20% 0 -20%); } }\
@keyframes nav-flower-sway { 0%, 100% { transform: rotate(0); } 30% { transform: rotate(-7deg); } 65% { transform: rotate(4deg); } }\
.site-nav .nav-logo.is-growing { animation: nav-flower-grow .9s cubic-bezier(.2,.7,.2,1) .15s both, nav-flower-sway .9s ease-in-out .95s; }\
.site-nav .nav-brand:hover .nav-logo { animation: nav-flower-sway .9s ease-in-out; }\
@media (prefers-reduced-motion: reduce) { .site-nav .nav-logo, .site-nav .nav-brand:hover .nav-logo { animation: none !important; } }\
.site-nav .nav-brand-name { font-size: 18px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.01em; white-space: nowrap; }\
.site-nav .nav-contact { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }\
.site-nav .nav-icon-btn { display: flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 50%; color: #555; background: rgba(255,255,255,0.6); border: 1px solid rgba(0,0,0,0.09); transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), background 0.15s, color 0.15s; }\
.site-nav .nav-icon-btn:hover { color: #1a1a1a; background: rgba(0,0,0,0.06); transform: translateY(-1px); }\
.site-nav .nav-links { display: flex; align-items: center; gap: 4px; flex-shrink: 0; margin-left: auto; }\
.site-nav .nav-link { font-size: 14px; font-weight: 600; color: #555; padding: 7px 14px; border-radius: 20px; text-decoration: none; transition: background 0.15s, color 0.15s; }\
.site-nav .nav-link:hover { color: #1a1a1a; background: rgba(0,0,0,0.05); }\
/* Active route — the current page is indicated on every route. */\
.site-nav .nav-link.is-active { color: #1a1a1a; background: rgba(0,0,0,0.06); }\
@media (max-width: 768px) { .site-nav { display: none; } }\
.site-nav .nav-link { position: relative; }\
\
/* ══ Shared hand-drawn hover bubble ══════════════════════════════\
   ONE component, two consumers: these nav bubbles AND the homepage\
   avatar bubble (index.html) both use the .hand-bubble base for the\
   motion + the decorative-overlay contract. What varies per use is the\
   drawn SHAPE, the TEXT, and the arrow/tail DIRECTION — carried by a\
   variant class and the --hb-* custom properties, so nothing about the\
   motion is duplicated. Purely decorative: pointer-events:none (never\
   intercepts a nav tap), aria-hidden, and hover-only so it simply never\
   appears on touch or on mobile (the nav itself is display:none there). */\
.hand-bubble {\
  position: absolute;\
  display: flex; align-items: center; justify-content: center;\
  pointer-events: none;\
  opacity: 0;\
  transform: translate(var(--hb-x, 0px), var(--hb-y, 6px)) scale(0.9);\
  transform-origin: var(--hb-origin, bottom center);\
  transition: opacity 0.25s cubic-bezier(0.16,1,0.3,1),\
              transform 0.25s cubic-bezier(0.16,1,0.3,1);\
}\
.hand-bubble.is-visible {\
  opacity: 1;\
  transform: translate(var(--hb-x, 0px), 0px) scale(1);\
}\
.hand-bubble-shape { position: absolute; left: 0; top: 0; width: 100%; height: auto; overflow: visible; pointer-events: none; z-index: 0; }\
.hand-bubble-text { position: relative; z-index: 1; font-family: \'Manrope\', -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, sans-serif; color: #1a1a1a; text-align: center; white-space: nowrap; line-height: 1.3; }\
/* Nav variant — a puffy cloud that hangs BELOW its own nav item, with a\
   hand-drawn arrow pointing up at the thing it describes. Grows out of\
   the arrow tip (transform-origin near the top). */\
.hand-bubble--nav {\
  top: calc(100% + 1px);\
  left: 50%;\
  z-index: 2500;\
  --hb-y: -6px;\
  /* width, height, --hb-x and --hb-origin are set per-bubble in JS: each cloud\
     is its own drawn shape (different viewBox + arrow position), so the box\
     size and where the arrow tip lands differ between About and Resume. */\
}\
.hand-bubble--nav .hand-bubble-text {\
  position: absolute; left: 50%; top: 60%;\
  transform: translate(-50%, -50%);\
  font-weight: 500; font-size: 12px; letter-spacing: -0.005em;\
  /* left/top are overwritten in JS to sit on each cloud body\'s visual center. */\
}\
@media (prefers-reduced-motion: reduce) {\
  .hand-bubble { transform: translate(var(--hb-x, 0px), 0px); transition: opacity 0.25s linear; }\
  .hand-bubble.is-visible { transform: translate(var(--hb-x, 0px), 0px); }\
}\
\
/* ── Shared site footer ── injected on every scrolling route.\
   Lives in the same wrapper as the nav so there are no per-page\
   copies. Flat grey (inherits the page bg), no shadow, Manrope. */\
body.has-site-footer { min-height: 100vh; display: flex; flex-direction: column; }\
.site-footer { margin-top: auto; background: transparent; box-shadow: none; padding: 12vh 32px 8vh; text-align: center; }\
.site-footer .footer-inner { max-width: 860px; margin: 0 auto; }\
.site-footer .footer-avatar { display: block; width: 40px; height: auto; margin: 0 auto 12px; }\
.site-footer .footer-closing { font-family: \'Manrope\', system-ui, sans-serif; font-weight: 500; font-size: 15px; letter-spacing: -0.01em; color: #1a1a1a; margin: 0 0 12px; }\
.site-footer .footer-closing .footer-hand { font-family: \'Mynerve\', \'Manrope\', system-ui, sans-serif; font-weight: 400; font-size: 18px; letter-spacing: 0; }\
.site-footer .footer-links { display: flex; justify-content: center; align-items: center; gap: 18px; margin: 0 0 12px; }\
.site-footer .footer-link { font-family: \'Manrope\', system-ui, sans-serif; font-weight: 400; font-size: 13px; color: #555; text-decoration: none; transition: color 0.15s; }\
.site-footer .footer-link:hover { color: #1a1a1a; }\
.site-footer .footer-copyright { font-family: \'Manrope\', system-ui, sans-serif; font-weight: 300; font-size: 11px; color: #888; margin: 0; }\
';
  // ── The side menu ── on wide screens the bar becomes a quiet list down the left side, like Rithvika's and
  // Cherry Hu's sites. Under "Work" it holds whatever list the page docks there: the case studies on the home
  // page, a case study's own contents on its page. Below 1180px it's the top bar as before.
  css += [
    '.site-nav .nav-sub { display: none; }',
    '@media (min-width: 1180px) {',
    '  :root { --nav-h: 0px; --rail-x: clamp(24px, 4vw, 72px); --rail-in: 250px; --rail-w: calc(var(--rail-x) + var(--rail-in)); }',
    '  html.rail-narrow { --rail-x: 40px; --rail-in: 190px; }',
    '  html.rail-narrow .site-nav { padding-right: 6px; }',
    '  .site-nav, .site-nav.is-solid { position: fixed; top: 0; left: 0; bottom: 0; width: var(--rail-w); height: auto; flex-direction: column; align-items: stretch; gap: 0;',
    '    padding: 26px 14px 26px var(--rail-x); background: transparent; border: 0; -webkit-backdrop-filter: none; backdrop-filter: none; overflow-y: auto; scrollbar-width: none; }',
    '  .site-nav::-webkit-scrollbar { display: none; }',
    '  .site-nav .nav-brand { order: 0; padding-left: 10px; }',
    '  .site-nav .nav-links { order: 1; flex-direction: column; align-items: stretch; gap: 2px; margin: 18vh 0 0; }',
    '  .site-nav .nav-link { padding: 7px 10px; border-radius: 10px; font-size: 15px; font-weight: 500; color: #9a9a9a; }',
    '  .site-nav .nav-link:hover { color: #1a1a1a; background: transparent; }',
    '  .site-nav .nav-link.is-active { color: #1a1a1a; background: transparent; }',
    '  .site-nav .nav-contact { order: 2; margin-top: auto; padding: 24px 0 0 10px; }',
    '  .site-nav .hand-bubble--nav { display: none; }',
    '  .site-nav .nav-sub { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .45s cubic-bezier(.2,.7,.2,1); }',
    '  .site-nav .nav-sub.is-open { grid-template-rows: 1fr; }',
    '  .site-nav .nav-sub-in { overflow: hidden; min-height: 0; padding: 0 0 0 6px; }',
    '  .site-nav .nav-sub-in > * { margin-bottom: 8px !important; }',
    '  body.rail-pad { padding-left: var(--rail-w); }',
    '  .site-nav .toc { position: static; display: block; width: auto; top: auto; left: auto; margin: 2px 0 0; }',
    '  .site-nav .toc-label { display: none; }',
    '  .site-nav { transition: opacity .4s ease; }',
    '  .site-nav.rail-away { opacity: 0; pointer-events: none; }',
    '}'
  ].join('\n');

  // ── Moving between pages ── pages crossfade instead of flashing white. Opening a case study from the home
  // page grows its cover into that case study's top image (the element marked data-cs-cover). The cover's
  // snapshot fades out early, so what you see growing is the new page's own sharp image, not a stretched copy.
  css += [
    '@view-transition { navigation: auto; }',
    '::view-transition-old(root), ::view-transition-new(root) { animation-duration: .3s; }',
    '::view-transition-group(cs-cover) { animation-duration: .6s; animation-timing-function: cubic-bezier(.22,1,.36,1); }',
    '::view-transition-image-pair(cs-cover) { border-radius: 8px; overflow: hidden; }',
    '::view-transition-old(cs-cover), ::view-transition-new(cs-cover) { height: 100%; object-fit: cover; object-position: top; }',
    '::view-transition-old(cs-cover) { animation: cs-cover-out .14s ease-out both; }',
    '::view-transition-new(cs-cover) { animation: cs-cover-in .18s ease-out both; }',
    '@keyframes cs-cover-out { to { opacity: 0; } }',
    '@keyframes cs-cover-in { from { opacity: 0; } }',
    // When a cover grows, the home page leaves first and the case study arrives once the cover is nearly in place, so
    // the two pages never sit on top of each other.
    'html:active-view-transition-type(cs-open)::view-transition-old(root) { animation: cs-cover-out .16s ease-out both; }',
    'html:active-view-transition-type(cs-open)::view-transition-new(root) { animation: cs-cover-in .35s ease-out .18s both; }',
    '@media (prefers-reduced-motion: reduce) { ::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) { animation: none !important; } }'
  ].join('\n');
  window.addEventListener('pagereveal', function (e) {
    if (!e.viewTransition) return;
    var from = window.navigation && navigation.activation && navigation.activation.from;
    var fromHome = from && /^\/?(index(\.html)?)?$/.test(new URL(from.url).pathname.replace(/^\//, ''));
    if (!fromHome) return;
    // Pages without a marked top image just crossfade.
    var target = document.querySelector('[data-cs-cover]');
    if (!target) return;
    target.style.viewTransitionName = 'cs-cover';
    if (e.viewTransition.types) e.viewTransition.types.add('cs-open');
    e.viewTransition.finished.finally(function () { target.style.viewTransitionName = ''; });
  });
  // Coming back to the home page: the cover that was handed off goes back to normal.
  window.addEventListener('pageshow', function () {
    [].forEach.call(document.querySelectorAll('.csc-img-panel'), function (p) { p.style.viewTransitionName = ''; });
  });

  var style = document.createElement('style');
  style.id = 'site-nav-styles';
  style.textContent = css;
  document.head.appendChild(style);

  // ── Docking a list under "Work" ──
  // A page hands over an element; on wide screens it moves into the side menu under Work, and below 1180px it
  // goes back where it came from. Pages can call this before the nav has mounted.
  var railMQ = window.matchMedia('(min-width: 1180px)');
  var docked = [], workSub = null;
  function placeDocked() {
    docked.forEach(function (d) {
      if (railMQ.matches && workSub) { if (d.el.parentNode !== workSub) workSub.appendChild(d.el); }
      else if (d.ph.parentNode && d.el.previousSibling !== d.ph) d.ph.parentNode.insertBefore(d.el, d.ph.nextSibling);
    });
    document.documentElement.classList.toggle('has-rail', railMQ.matches);
  }
  window.siteRail = {
    dock: function (el) {
      if (!el || !el.parentNode) return;
      var ph = document.createComment('docked in the side menu on wide screens');
      el.parentNode.insertBefore(ph, el);
      docked.push({ el: el, ph: ph });
      placeDocked();
    },
    isOn: function () { return railMQ.matches; },
    onChange: function (fn) { railMQ.addEventListener('change', function () { fn(railMQ.matches); }); }
  };
  railMQ.addEventListener('change', placeDocked);

  // ── Mynerve (handwriting) travels with the footer ──
  // The footer's closing line is set in Mynerve, but only index.html requests
  // that family in its own <head>. Since the footer mounts on every route, pull
  // the font in here too so the handwriting renders everywhere — otherwise the
  // other pages silently fall back to Manrope. Guarded so pages that already
  // load Mynerve don't double-request it.
  if (!document.querySelector('link[href*="Mynerve"]')) {
    var fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Mynerve&display=swap';
    document.head.appendChild(fontLink);
  }

  // ── Markup ── links are page-absolute so they work from any route.
  var html = '\
<a class="nav-brand" href="/#home" aria-label="Home — Sydney Nguyen">\
  <svg class="nav-logo" viewBox="0 0 290.000000 400.000000" aria-hidden="true"><g transform="translate(0.000000,400.000000) scale(0.100000,-0.100000)" fill="currentColor"><path d="M1259 3763 c-102 -52 -205 -235 -315 -561 -68 -202 -68 -202 -99 -173 -49 47 -66 51 -198 51 -141 0 -187 -16 -299 -104 -134 -106 -163 -325 -78 -590 38 -117 206 -380 324 -504 113 -119 401 -285 617 -356 l117 -38 4 -132 c3 -72 4 -132 3 -133 -1 -2 -55 24 -121 57 -168 85 -209 94 -444 94 -218 1 -247 -5 -280 -59 -47 -76 -22 -142 74 -197 63 -36 109 -69 312 -220 159 -119 308 -176 482 -186 123 -8 121 -5 222 -277 86 -230 89 -235 160 -256 142 -43 239 121 106 176 -29 13 -38 29 -109 207 -43 106 -77 200 -77 209 0 22 79 55 163 69 258 41 552 176 618 283 25 41 27 202 4 247 -60 116 -343 106 -613 -22 -78 -37 -183 -114 -238 -175 -41 -46 -41 -46 -53 18 -7 35 -13 114 -14 174 l-2 110 110 6 c117 6 159 20 363 123 39 20 92 40 119 46 26 6 59 19 73 29 14 10 44 28 66 39 54 27 124 87 147 124 10 17 52 65 94 107 91 91 171 210 206 306 14 39 46 123 71 188 61 159 66 195 66 456 0 493 -85 779 -243 822 -193 52 -395 -82 -666 -444 -57 -76 -105 -137 -107 -135 -2 2 -26 73 -53 159 -52 159 -126 323 -179 395 -69 94 -220 124 -333 67z m169 -179 c78 -54 262 -603 262 -779 0 -48 44 -95 90 -95 55 0 76 24 120 138 50 129 57 141 186 313 187 249 308 360 406 374 60 9 75 -12 112 -161 38 -150 48 -275 44 -521 -4 -218 -4 -218 -45 -323 -23 -58 -55 -140 -71 -182 -42 -110 -74 -160 -161 -252 -42 -45 -96 -104 -119 -132 -27 -34 -61 -60 -96 -77 -30 -14 -57 -30 -60 -36 -4 -5 -21 -13 -39 -16 -17 -4 -104 -41 -192 -83 -160 -76 -160 -76 -257 -80 -87 -3 -100 -2 -124 17 -32 25 -71 27 -101 6 -32 -22 -176 28 -368 128 -189 98 -268 162 -362 293 -203 285 -222 329 -230 516 -7 147 0 165 80 218 59 40 62 41 136 38 76 -3 76 -3 111 -68 91 -171 125 -210 183 -210 61 0 87 45 97 169 14 182 207 701 296 796 27 29 69 33 102 9z m842 -2348 c0 -59 -298 -184 -500 -211 -55 -7 -55 -7 -25 25 99 108 325 207 473 209 48 1 52 -1 52 -23z m-1265 -72 c28 -7 95 -39 150 -69 55 -31 133 -72 173 -91 39 -19 72 -40 72 -47 0 -7 3 -22 6 -34 6 -21 3 -23 -34 -23 -109 0 -255 59 -383 154 -41 30 -93 69 -116 87 -24 17 -43 35 -43 39 0 11 116 1 175 -16z M1159 2651 c-41 -41 -40 -90 2 -125 76 -65 180 15 135 103 -31 59 -90 68 -137 22z M1623 2628 c-54 -14 -79 -84 -47 -133 34 -52 121 -49 149 5 39 76 -20 150 -102 128z M1807 2310 c-15 -12 -29 -36 -33 -56 -12 -67 -43 -76 -229 -71 -190 6 -318 29 -355 63 -96 89 -215 1 -155 -115 47 -92 246 -141 571 -141 137 0 142 1 202 31 108 54 163 137 149 226 -13 76 -91 109 -150 63z"/></g></svg>\
  <span class="nav-brand-name">sydney nguyen</span>\
</a>\
<div class="nav-contact">\
  <a href="mailto:sydneynguyyen@gmail.com" class="nav-icon-btn" title="Email" aria-label="Email">\
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>\
  </a>\
  <a href="https://www.linkedin.com/in/sydneyknguyen" target="_blank" rel="noopener" class="nav-icon-btn" title="LinkedIn" aria-label="LinkedIn">\
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>\
  </a>\
</div>\
<div class="nav-links">\
  <a href="/#work" class="nav-link" data-route="work">Work</a>\
  <div class="nav-sub" id="nav-sub-work"><div class="nav-sub-in"></div></div>\
  <a href="resume" class="nav-link" data-route="resume">Experience</a>\
  <a href="about" class="nav-link" data-route="about">About</a>\
  <a href="/#playground" class="nav-link" data-route="more">Playground</a>\
</div>';

  // ── Footer markup ── the closing beat of every scrolling page.
  var footerHtml = '\
<div class="footer-inner">\
  <img class="footer-avatar" src="assets/icons/sydney center icon mail.webp" alt="" aria-hidden="true" width="40" height="40" />\
  <p class="footer-closing">Thanks for visiting. <span class="footer-hand">Let&#39;s get in touch!</span></p>\
  <div class="footer-links">\
    <a class="footer-link" href="mailto:sydneynguyyen@gmail.com">sydneynguyyen@gmail.com</a>\
    <a class="footer-link" href="https://www.linkedin.com/in/sydneyknguyen" target="_blank" rel="noopener noreferrer">LinkedIn</a>\
  </div>\
  <p class="footer-copyright">© Sydney Nguyen 2026</p>\
</div>';

  // ── Nav hover bubbles ──────────────────────────────────────
  // Each nav item gets its OWN hand-drawn cloud — same loose pen as the margin
  // doodles and the avatar bubble (round caps/joins, a little wobble, white
  // fill so it reads over the page), but a different lobe arrangement so the two
  // read as two clouds drawn by the same person, not one cloud duplicated.
  // "About" is compact and round for its short copy; "Resume" is wider and
  // flatter, proportioned for the longer "experience + education" rather than
  // stretched to fit (a stretched path would distort the line weight). A curving
  // arrow at the top-right of each cloud points up at its nav item, so the cloud
  // body can hang to the LEFT of a right-edge item without running off-screen.
  //
  // Text is centered on each cloud's VISUAL BODY — the drawn path's own bbox,
  // which excludes the arrow — not the whole SVG box; otherwise the arrow and
  // top puffs pull the copy high and to one side. A small downward nudge
  // accounts for the top puffs sitting above the body's optical center. It's
  // measured from the real path geometry at mount, so it stays right for each
  // cloud's own shape and copy length.
  var OPTICAL_DY = 3; // viewBox units to drop the text below the bbox center
  var NAV_BUBBLES = {
    about: {
      text: 'get to know me!', vw: 170, vh: 104, boxW: 180,
      cloud: 'M32 90 Q13 90 14 71 Q3 61 16 51 Q10 38 28 41 Q31 28 50 35 Q62 24 78 33 Q95 26 110 35 Q129 28 138 42 Q156 44 152 60 Q162 70 149 78 Q152 92 134 89 Q116 96 100 89 Q82 95 64 89 Q47 95 32 90 Z',
      arrow: 'M140 40 C138 26 141 15 147 9 M147 9 L139 16 M147 9 L153 17',
      tipX: 147, tipY: 9
    },
    resume: {
      text: 'experience + education', vw: 210, vh: 100, boxW: 230,
      cloud: 'M30 84 Q12 85 13 68 Q2 59 14 50 Q8 39 25 42 Q28 30 45 36 Q54 26 69 33 Q82 25 96 33 Q110 26 124 33 Q139 27 152 35 Q170 33 176 46 Q192 49 188 63 Q198 72 184 79 Q186 92 168 88 Q152 95 136 88 Q120 94 104 88 Q88 94 72 88 Q56 94 42 87 Q32 92 30 84 Z',
      arrow: 'M178 42 C176 28 179 17 185 11 M185 11 L177 18 M185 11 L191 19',
      tipX: 185, tipY: 11
    }
  };

  function makeNavBubble(cfg) {
    var scale = cfg.boxW / cfg.vw;      // rendered px per viewBox unit
    var b = document.createElement('span');
    b.className = 'hand-bubble hand-bubble--nav';
    b.setAttribute('aria-hidden', 'true');
    b.style.width = cfg.boxW + 'px';
    b.style.height = (cfg.vh * scale).toFixed(1) + 'px';
    // Land the arrow tip under the nav item, and grow the bubble out of it.
    b.style.setProperty('--hb-x', '-' + (cfg.tipX * scale).toFixed(1) + 'px');
    b.style.setProperty('--hb-origin',
      (cfg.tipX / cfg.vw * 100).toFixed(1) + '% ' +
      (cfg.tipY / cfg.vh * 100).toFixed(1) + '%');
    b.innerHTML =
      '<svg class="hand-bubble-shape" viewBox="0 0 ' + cfg.vw + ' ' + cfg.vh + '" fill="none" aria-hidden="true">' +
        '<path d="' + cfg.cloud + '" fill="#fff" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="' + cfg.arrow + '" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>' +
      '</svg>' +
      '<span class="hand-bubble-text"></span>';
    var txt = b.querySelector('.hand-bubble-text');
    txt.textContent = cfg.text; // textContent → no injection

    // Center the copy on the drawn cloud's body once it's measurable. getBBox
    // needs layout, so retry on the next frame if the node isn't measured yet.
    var cloudPath = b.querySelector('.hand-bubble-shape path');
    function centerText() {
      var bb = cloudPath.getBBox();
      if (!bb.width) return false;
      txt.style.left = ((bb.x + bb.width / 2) / cfg.vw * 100).toFixed(2) + '%';
      txt.style.top = ((bb.y + bb.height / 2 + OPTICAL_DY) / cfg.vh * 100).toFixed(2) + '%';
      return true;
    }
    if (!centerText() && typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(centerText);
    }
    return b;
  }

  // Which nav item represents the current page.
  function currentRoute() {
    var page = (location.pathname.split('/').pop() || '').toLowerCase().replace(/\.html$/, '');
    if (page === '' || page === 'index') return 'home';
    if (page === 'about') return 'about';
    if (page === 'resume') return 'resume';
    if (page === 'marketing') return 'more';
    // Case studies are "Work".
    return 'work';
  }

  function mount() {
    if (document.querySelector('.site-nav')) return; // never mount twice
    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.id = 'site-nav';
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = html;
    // the flower grows in once per visit, not on every page change
    try { if (!sessionStorage.getItem('flowerGrown')) { nav.querySelector('.nav-logo').classList.add('is-growing'); sessionStorage.setItem('flowerGrown', '1'); } } catch (e) {}
    document.body.insertBefore(nav, document.body.firstChild);

    // Active state.
    var route = currentRoute();
    workSub = nav.querySelector('#nav-sub-work .nav-sub-in');
    var sub = nav.querySelector('#nav-sub-work');
    function setActive(r) {
      nav.querySelectorAll('.nav-link').forEach(function (a) {
        var on = a.dataset.route === r;
        a.classList.toggle('is-active', on);
        if (on) a.setAttribute('aria-current', route === 'home' ? 'true' : 'page'); else a.removeAttribute('aria-current');
      });
      sub.classList.toggle('is-open', r === 'work');
    }
    setActive(route);

    // On wider screens About and Resume are sections at the end of the home page, so the links go there.
    // Phones keep the standalone pages (the home page's phone layout doesn't have those sections).
    var wideMQ = window.matchMedia('(min-width: 769px)');
    function pointLinks() {
      [['about', 'about', 'about'], ['resume', 'experience', 'resume']].forEach(function (p) {
        var a = nav.querySelector('.nav-link[data-route="' + p[0] + '"]');
        if (a) a.setAttribute('href', wideMQ.matches ? '/#' + p[1] : p[2]);
      });
    }
    pointLinks();
    wideMQ.addEventListener('change', pointLinks);

    // A case study's contents list sits under Work. Pages without one get room on the left for the menu.
    var toc = document.querySelector('nav.toc');
    if (toc) { document.documentElement.classList.add('rail-narrow'); window.siteRail.dock(toc); }
    else document.body.classList.add('rail-pad');
    placeDocked();

    // Case studies that open on a full-screen title board: the menu waits until you've scrolled past it.
    var pin = document.getElementById('heroPin');
    if (pin) {
      var away = function () { nav.classList.toggle('rail-away', railMQ.matches && pin.getBoundingClientRect().bottom > innerHeight * 1.15); };
      window.addEventListener('scroll', away, { passive: true });
      railMQ.addEventListener('change', away);
      away();
    }

    // Home page: the menu follows the section you're in.
    if (route === 'home') {
      var spots = [['work', document.getElementById('work')], ['more', document.getElementById('playground')], ['about', document.getElementById('about')], ['resume', document.getElementById('experience')]];
      var spy = function () {
        var mid = innerHeight * 0.5, r = 'home';
        spots.forEach(function (sp) { if (sp[1]) { var b = sp[1].getBoundingClientRect(); if (b.top <= mid && b.bottom > mid) r = sp[0]; } });
        setActive(r);
      };
      window.addEventListener('scroll', spy, { passive: true });
      spy();
    }

    // Hover bubbles — each hangs off its OWN nav item and points back at it.
    // pointer-events:none on the bubble means a tap still navigates.
    Object.keys(NAV_BUBBLES).forEach(function (r) {
      var link = nav.querySelector('.nav-link[data-route="' + r + '"]');
      if (!link) return;
      var bubble = makeNavBubble(NAV_BUBBLES[r]);
      link.appendChild(bubble);
      link.addEventListener('mouseenter', function () { bubble.classList.add('is-visible'); });
      link.addEventListener('mouseleave', function () { bubble.classList.remove('is-visible'); });
    });

    // ── Footer ── mounted on every scrolling route with a real page bottom.
    // The desktop homepage canvas now scrolls natively (it used to be a fixed,
    // overflow:hidden overlay that opted out), so it gets the footer too — this
    // also gives the closing "Other Projects" chips the scroll runway their
    // reveal needs. Only the mobile homepage opts out, since it ships its own
    // .mob-footer (its #desktop-canvas is display:none). A min-height flex body
    // keeps the footer pinned to the bottom on short pages instead of floating.
    var dc = document.getElementById('desktop-canvas');
    var canvasHidden = dc && getComputedStyle(dc).display === 'none';
    if (!canvasHidden && !document.querySelector('.site-footer')) {
      var footer = document.createElement('footer');
      footer.className = 'site-footer';
      footer.innerHTML = footerHtml;
      document.body.appendChild(footer);
      document.body.classList.add('has-site-footer');
    }

    // Conditional frosted background. Subpages (no hero) stay solid;
    // the homepage hero starts transparent and frosts once scrolled.
    var hero = document.querySelector('.hero-section');
    if (!hero) {
      nav.classList.add('is-solid');
    } else {
      var onScroll = function () {
        nav.classList.toggle('is-solid', window.scrollY > 24);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
