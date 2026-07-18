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
.site-nav .nav-logo { width: 30px; height: auto; display: block; overflow: visible; }\
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
  var style = document.createElement('style');
  style.id = 'site-nav-styles';
  style.textContent = css;
  document.head.appendChild(style);

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
  <svg class="nav-logo" viewBox="0 0 46 48" fill="none" aria-hidden="true">\
    <path d="M7 22 Q8 21 23 5 Q24 5 39 22" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" fill="none"/>\
    <path d="M9 22.5 L37 22.5" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" fill="none"/>\
    <path d="M10.5 23 Q10 33 11 43.5" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round" fill="none"/>\
    <path d="M36.5 23 Q37.4 33.5 37 44" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round" fill="none"/>\
    <path d="M11 43.5 Q23 44.8 37 44" stroke="#1a1a1a" stroke-width="2.4" stroke-linecap="round" fill="none"/>\
    <path d="M18.5 44 L18.7 31.5 Q18.7 29 22.3 29 Q26 29 26 31.5 L26.3 44" stroke="#1a1a1a" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>\
    <circle cx="24" cy="38" r="0.95" fill="#1a1a1a"/>\
    <path d="M29 27.5 Q35.4 27.2 35.6 27.7 Q35.9 34 35.5 34.2 Q29.2 34.4 29 33.9 Q28.7 27.9 29 27.5 Z" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none"/>\
    <path d="M32.3 27.8 L32.2 33.9 M29.2 30.8 L35.4 30.6" stroke="#1a1a1a" stroke-width="1.9" stroke-linecap="round" fill="none"/>\
  </svg>\
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
  <a href="about" class="nav-link" data-route="about">About</a>\
  <a href="resume" class="nav-link" data-route="resume">Resume</a>\
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
    // Case studies + marketing are all "Work".
    return 'work';
  }

  function mount() {
    if (document.querySelector('.site-nav')) return; // never mount twice
    var nav = document.createElement('nav');
    nav.className = 'site-nav';
    nav.id = 'site-nav';
    nav.setAttribute('aria-label', 'Primary');
    nav.innerHTML = html;
    document.body.insertBefore(nav, document.body.firstChild);

    // Active state.
    var route = currentRoute();
    var active = nav.querySelector('.nav-link[data-route="' + route + '"]');
    if (active) {
      active.classList.add('is-active');
      active.setAttribute('aria-current', 'page');
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
