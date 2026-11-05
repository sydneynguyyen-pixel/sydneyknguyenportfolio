/* Shared case-study behavior, taken from the Shoal page so every case study works the same way.
   Load at the end of <body>. Page-specific scripts stay in each page. */

/* Side contents: highlight the section on screen, and keep it in view when the bar scrolls sideways */
(function () {
  var links = [].slice.call(document.querySelectorAll('.toc a'));
  var sections = links.map(function (a) { return document.querySelector(a.getAttribute('href')); }).filter(Boolean);
  if (!sections.length) return;
  var last = null;
  function update() {
    var current = sections[0];
    sections.forEach(function (s) { if (s.getBoundingClientRect().top <= window.innerHeight * 0.35) current = s; });
    links.forEach(function (a) { a.classList.toggle('active', a.getAttribute('href') === '#' + current.id); });
    var bar = document.querySelector('.toc'), act = bar && bar.querySelector('a.active');
    if (act && act !== last && bar.scrollWidth > bar.clientWidth) {
      bar.scrollTo({ left: act.offsetLeft - (bar.clientWidth - act.offsetWidth) / 2, behavior: 'smooth' });
    }
    last = act;
  }
  addEventListener('scroll', update, { passive: true });
  setInterval(update, 400);
  update();
})();

/* Custom cursor dot and sparkle trail */
(function () {
  var dot = document.getElementById('cursor-dot');
  if (dot) {
    document.addEventListener('mousemove', function (e) { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px'; });
    var HOVER = 'a, button, [onclick]';
    document.addEventListener('mouseover', function (e) { if (e.target.closest(HOVER)) document.body.classList.add('cursor-hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest(HOVER)) document.body.classList.remove('cursor-hover'); });
    document.addEventListener('mousedown', function () { document.body.classList.add('cursor-click'); });
    document.addEventListener('mouseup', function () { document.body.classList.remove('cursor-click'); });
  }
  // a page can set its own sparkle colors: <body data-sparkle="#111,#777,...">
  var own = (document.body.getAttribute('data-sparkle') || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
  var COLORS = own.length ? own : ['#2c5fb4', '#8fb4ee', '#e3b94a', '#a9c6f2', '#5b8bd6', '#d6e3f8', '#7ea6e6', '#f2e2a8'];
  var SHAPES = ['✦', '✧', '★', '◆', '✿', '⬥', '✺', '⟡'];
  var lastTime = 0;
  document.addEventListener('mousemove', function (e) {
    var now = Date.now();
    if (now - lastTime < 30) return;
    lastTime = now;
    if (Math.random() > 0.55) return;
    var el = document.createElement('span');
    el.className = 'cursor-sparkle';
    el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];
    var tx = (Math.random() - 0.5) * 36, ty = -(Math.random() * 28 + 10);
    var size = Math.random() * 14 + 9, dur = Math.random() * 300 + 500;
    el.style.cssText = 'left:' + e.clientX + 'px;top:' + e.clientY + 'px;color:' + COLORS[Math.floor(Math.random() * COLORS.length)] +
      ';font-size:' + size + 'px;--tx:' + tx + 'px;--ty:' + ty + 'px;animation-duration:' + dur + 'ms;';
    document.body.appendChild(el);
    el.addEventListener('animationend', function () { el.remove(); }, { once: true });
  });
})();

/* Mobile menu drawer */
function mobDrawerOpen() {
  document.getElementById('mobDrawer').classList.add('open');
  document.getElementById('mobBackdrop').classList.add('open');
  document.body.style.overflow = 'hidden';
}
function mobDrawerClose() {
  document.getElementById('mobDrawer').classList.remove('open');
  document.getElementById('mobBackdrop').classList.remove('open');
  document.body.style.overflow = '';
}

/* Scroll reveal: [data-reveal] fades in once when it comes on screen */
(function () {
  var els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }
  var io = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var d = en.target.getAttribute('data-reveal-delay');
      if (d) en.target.style.transitionDelay = d + 's';
      en.target.classList.add('is-visible');
      obs.unobserve(en.target);
    });
  }, { rootMargin: '0px 0px -100px 0px', threshold: 0 });
  els.forEach(function (el) { io.observe(el); });
})();

/* Click an image in a figure to see it larger (.no-zoom opts out) */
(function () {
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay'; overlay.id = 'lightbox';
  overlay.setAttribute('aria-hidden', 'true'); overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = '<button class="lightbox-close" aria-label="Close image">✕</button><img alt="" /><div class="lightbox-hint">Click anywhere or press Esc to close</div>';
  document.body.appendChild(overlay);
  var img = overlay.querySelector('img');
  document.querySelectorAll('figure:not(.no-zoom)').forEach(function (fig) { if (fig.querySelector('img')) fig.classList.add('has-zoom'); });
  function open(src, alt) { img.src = src; img.alt = alt || ''; overlay.classList.add('open'); overlay.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function close() { overlay.classList.remove('open'); overlay.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('figure:not(.no-zoom) img');
    if (t) { e.preventDefault(); open(t.currentSrc || t.src, t.alt); }
  });
  overlay.addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && overlay.classList.contains('open')) close(); });
})();

/* Screen recordings marked data-lazyplay play only while on screen; reduced motion gets controls instead */
(function () {
  var vids = [].slice.call(document.querySelectorAll('video[data-lazyplay]'));
  if (!vids.length) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) {
    vids.forEach(function (v) { v.controls = true; });
    return;
  }
  // a video that zooms inside a frame (data-lazybox) is watched through that frame, since its own scaled box looks mostly off screen
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var v = e.target.matches('video') ? e.target : e.target.querySelector('video[data-lazyplay]');
      if (e.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } else v.pause();
    });
  }, { threshold: 0.35 });
  vids.forEach(function (v) { io.observe(v.closest('[data-lazybox]') || v); });
})();

/* Section sketches: each line draws itself the first time its heading comes on screen */
(function () {
  var sk = [].slice.call(document.querySelectorAll('.sec-sk'));
  sk.forEach(function (v) { [].forEach.call(v.querySelectorAll('path,rect,circle,ellipse'), function (n) { if (!n.classList.contains('dash')) n.setAttribute('pathLength', '1'); }); });
  if (!('IntersectionObserver' in window)) { sk.forEach(function (v) { v.classList.add('drawn'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('drawn'); io.unobserve(e.target); } }); }, { threshold: 0.6 });
  sk.forEach(function (v) { io.observe(v); });
})();

/* Hand-drawn markup: a thin pen line under each section heading and each .mk-ul phrase */
(function () {
  var NS = 'http://www.w3.org/2000/svg';
  var LINES = ['M2 6C40 3 90 8 140 5S186 4 198 6M14 9C70 7 130 10 190 8', 'M2 5C50 8 100 3 150 6S190 7 198 4M10 8C60 10 120 6 184 9', 'M3 7C44 4 80 6 128 4S182 5 197 7M18 9C80 7 140 10 192 8'];
  var k = 0;
  function pen(host, cls) {
    var v = document.createElementNS(NS, 'svg'); v.setAttribute('class', 'mk-svg ' + cls); v.setAttribute('viewBox', '0 0 200 12'); v.setAttribute('preserveAspectRatio', 'none'); v.setAttribute('aria-hidden', 'true');
    var p = document.createElementNS(NS, 'path'); p.setAttribute('d', LINES[k++ % LINES.length]); p.setAttribute('pathLength', '1'); p.setAttribute('vector-effect', 'non-scaling-stroke');
    v.appendChild(p); host.appendChild(v);
  }
  var heads = [].slice.call(document.querySelectorAll('.sec-head h2')), ul = [].slice.call(document.querySelectorAll('.mk-ul'));
  heads.forEach(function (h) { pen(h, 'mk-under'); }); ul.forEach(function (u) { pen(u, ''); });
  var all = heads.concat(ul);
  if (!('IntersectionObserver' in window)) { all.forEach(function (e) { e.classList.add('mk-on'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('mk-on'); io.unobserve(e.target); } }); }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
  all.forEach(function (e) { io.observe(e); });
})();
