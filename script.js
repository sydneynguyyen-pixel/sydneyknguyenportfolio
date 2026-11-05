// Old links (/#archive, /#resume) go to the renamed sections. Swapping the hash this early lets the
// browser make its own jump, which it keeps in place while the page above finishes loading.
(function () {
  var renamed = { '#archive': '#playground', '#resume': '#experience' }[location.hash];
  if (renamed) location.replace(renamed);
})();

// A box outline drawn by hand, in the style of the nav's hover clouds: an even 2px ink line with a little wobble,
// round corners, and an end that runs slightly past its start. Returns the closed fill path and the open ink
// path for a w × h box with corner radius r. The same seed always draws the same line.
function wobblyBox(w, h, r, seed) {
  let t = (seed * 2654435761) >>> 0;
  const rnd = () => { t ^= t << 13; t >>>= 0; t ^= t >>> 17; t ^= t << 5; t >>>= 0; return t / 4294967296; };
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const edge = (x0, y0, x1, y1) => {
    const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 34));
    for (let i = 0; i < n; i++) pts.push([x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n]);
  };
  const arc = (cx, cy, a0) => { for (let i = 0; i < 3; i++) { const a = a0 + (i / 3) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  edge(r, 0, w - r, 0); arc(w - r, r, -Math.PI / 2);
  edge(w, r, w, h - r); arc(w - r, h - r, 0);
  edge(w - r, h, r, h); arc(r, h - r, Math.PI / 2);
  edge(0, h - r, 0, r); arc(r, r, Math.PI);
  const j = pts.map(([x, y]) => [x + (rnd() - 0.5) * 1.8, y + (rnd() - 0.5) * 1.8]);
  const f = (n) => n.toFixed(1);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const N = j.length;
  let fill = 'M' + f(mid(j[N - 1], j[0])[0]) + ' ' + f(mid(j[N - 1], j[0])[1]);
  for (let i = 0; i < N; i++) { const m = mid(j[i], j[(i + 1) % N]); fill += ' Q' + f(j[i][0]) + ' ' + f(j[i][1]) + ' ' + f(m[0]) + ' ' + f(m[1]); }
  // the ink line starts a little into the top edge and runs on past where it began
  let ink = 'M' + f(j[0][0] + 4) + ' ' + f(j[0][1] + 1.5);
  for (let i = 1; i <= N; i++) { const m = mid(j[i % N], j[(i + 1) % N]); ink += ' Q' + f(j[i % N][0]) + ' ' + f(j[i % N][1]) + ' ' + f(m[0]) + ' ' + f(m[1]); }
  ink += ' L' + f(j[1][0] + 8) + ' ' + f(j[1][1] - 1.2);
  return { fill, ink };
}
// Draws (or redraws) that outline into an <svg> inside `host`, sized to the host. Returns the svg.
function drawWobbly(host, cls, r, seed, arrow) {
  const w = Math.round(host.offsetWidth), h = Math.round(host.offsetHeight);
  let svg = host.querySelector(':scope > .' + cls);
  if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', cls); svg.setAttribute('aria-hidden', 'true'); host.prepend(svg); }
  if (!w || !h || (+svg.dataset.w === w && +svg.dataset.h === h && svg.dataset.seed === String(seed))) return svg;
  const p = wobblyBox(w, h, r, seed);
  svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
  svg.style.width = w + 'px'; svg.style.height = h + 'px';
  svg.dataset.w = w; svg.dataset.h = h; svg.dataset.seed = seed;
  svg.innerHTML = '<path d="' + p.fill + '" fill="#fff"/><path d="' + p.ink + '" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    (arrow ? '<path d="' + arrow + '" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' : '');
  return svg;
}

/* ══════════════════════════════════════════════════════════
   sydney's desktop — faithful Figma implementation
   ══════════════════════════════════════════════════════════ */

// ── Canvas Scaling ──────────────────────────────────────────
// The page now scrolls vertically, so the old viewport `zoom` is
// disabled — zooming a scrolling page breaks 100vh sizing and the
// sticky nav. Kept as a no-op (and clears any stale zoom) so any
// existing callers/listeners stay valid.
function scaleCanvas() {
  const canvas = document.getElementById('desktop-canvas');
  if (canvas) canvas.style.zoom = '';
}
window.addEventListener('resize', scaleCanvas);
scaleCanvas();


// ── Live Clock ──────────────────────────────────────────────
function updateClock() {
  const now    = new Date();
  const days   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const day    = days[now.getDay()];
  const month  = months[now.getMonth()];
  const date   = now.getDate();
  let hours    = now.getHours();
  const mins   = String(now.getMinutes()).padStart(2, '0');
  const ampm   = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const el = document.getElementById('clock');
  if (el) el.textContent = `${day} ${month} ${date}   ${hours}:${mins} ${ampm}`;
}
updateClock();
setInterval(updateClock, 1000);


// ── Overlay Management ──────────────────────────────────────
const openOverlays = new Set();

function openOverlay(name) {
  const el = document.getElementById(`overlay-${name}`);
  if (!el) return;

  // Init on first open
  if (name === 'casestudies' && !el.dataset.initialized) {
    selectCase('voqa');
    el.dataset.initialized = '1';
  }
  if (name === 'creative' && !el.dataset.initialized) {
    initCreativeOverlay();
    el.dataset.initialized = '1';
  }

  el.classList.add('open');
  openOverlays.add(name);
  document.getElementById('backdrop').classList.add('active');

  // Slight random offset for natural stacking
  const ox = (Math.random() - 0.5) * 30;
  const oy = (Math.random() - 0.5) * 20;
  el.style.marginLeft = `${ox}px`;
  el.style.marginTop  = `${oy}px`;
}

function closeOverlay(name) {
  const el = document.getElementById(`overlay-${name}`);
  if (!el) return;
  el.classList.remove('open');
  openOverlays.delete(name);
  if (openOverlays.size === 0) {
    document.getElementById('backdrop').classList.remove('active');
  }
}

function closeAllOverlays() {
  document.querySelectorAll('.overlay-window').forEach(el => el.classList.remove('open'));
  openOverlays.clear();
  document.getElementById('backdrop').classList.remove('active');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllOverlays();
});


// ── Case Study Data ─────────────────────────────────────────
const CS_ASSETS = {
  'iterait':   'assets/case studies/iterait/iterait-thumb.webp',
  'room2talk': 'assets/case studies/room2talk/r2t-hero.webp',
  'voqa':      'assets/case studies/voqa/voqa-thumb.webp',
  'sunright':  'assets/icons/sunright-thumb.webp',
  'moove':     'assets/icons/moove-thumb.webp',
  'soundbite': 'assets/case studies/soundbite/soundbite-thumb.webp',
};

const caseStudies = {
  'iterait': {
    label: 'CASE STUDY',
    labelClass: '',
    title: 'iterait',
    fileInfo: 'Figma File · 14.8 MB',
    meta: {
      'Role': 'UX/UI Designer, Brand Designer',
      'Timeline': 'SJHacks 2026 · 24 Hours',
      'Category': 'Top 3 Finalist — Digital Content Creation',
    },
    tags: ['Figma', 'Claude', 'Lovable'],
    link: 'iterait',
    linkLabel: 'View case study →',
    description: 'A visual workflow system that turns AI design chaos into clear, controllable progress. Designed and prototyped a structured layer between raw AI output and organized design work — built as a Top 3 finalist at SJHacks 2026.'
  },
  'room2talk': {
    label: 'CASE STUDY',
    labelClass: '',
    title: 'room2talk',
    fileInfo: 'Figma File · 25.4 MB',
    meta: {
      'Role': 'UX/UI Designer, UX Researcher',
      'Timeline': 'March 2026  ·  4 Weeks',
      'Category': 'Solo Project, Thesis Research',
    },
    tags: ['Figma', 'Claude', 'Netlify'],
    link: 'room2talk',
    linkLabel: 'View case study →',
    description: 'A reflection-based card experience designed for Vietnamese American intergenerational emotional communication. Explored how low-stakes parallel activities can open dialogue between generations who struggle to talk about mental health directly. Built as part of my thesis research on how UX design can support emotional wellbeing across cultural barriers.'
  },
  'voqa': {
    label: 'CASE STUDY',
    labelClass: 'green',
    title: 'VOQA',
    fileInfo: 'Figma File · 18.2 MB',
    meta: {
      'Role': 'Team UX Designer, UX Researcher',
      'Timeline': 'Oct–Dec 2025  ·  10 Weeks',
      'Category': 'Team Project, Graduate Research',
    },
    tags: ['Figma', 'Google Docs'],
    link: 'voqa',
    linkLabel: 'View case study →',
    description: 'A mobile app designed to make museum experiences more inclusive, accessible, and community-driven for diverse visitors. Focused on accessibility-first design thinking and participatory research methods to surface the needs of underrepresented museum audiences.'
  },
  'sunright': {
    comingSoon: true,
    title: 'sunright-tea',
    description: 'Case study in progress…'
  },
  'moove': {
    comingSoon: true,
    title: 'moove',
    description: 'Case study in progress…'
  },
  'soundbite': {
    label: 'CASE STUDY',
    labelClass: '',
    title: 'soundbite',
    fileInfo: 'Concept Project',
    meta: {
      'Role': 'UX/UI Designer, Packaging & Brand Designer',
      'Context': 'Solo Concept Project',
      'Tools': 'Figma, Procreate, Canva, CapCut',
    },
    tags: ['Concept', 'Sensory Design'],
    link: 'soundbite',
    linkLabel: 'View case study →',
    description: 'A sensory-enhanced snack concept pairing mood-based flavors with QR-triggered 3D spatial audio. Scan the wrapper, put on headphones, and a soundscape matched to that flavor\'s mood plays while you eat.'
  },
};

function selectCase(key) {
  // Update sidebar highlights
  document.querySelectorAll('.cs-file').forEach(el => el.classList.remove('active-file'));
  const fileEl = document.querySelector(`.cs-file[onclick="selectCase('${key}')"]`);
  if (fileEl) fileEl.classList.add('active-file');

  const preview = document.getElementById('cs-preview');
  if (!preview) return;


  const cs = caseStudies[key];
  if (!cs) return;

  if (cs.comingSoon) {
    preview.innerHTML = `
      <div class="cs-coming-soon">
        <strong>${cs.title}</strong>
        ${cs.description}
      </div>`;
    return;
  }

  const heroSrc = CS_ASSETS[key] || '';
  const linkDisabled = cs.link === '#' ? ' style="opacity:0.5;pointer-events:none;"' : '';

  const metaBlocksHTML = Object.entries(cs.meta).map(([k, v]) => `
    <div class="cs-meta-block">
      <div class="cs-meta-key">${k}</div>
      <div class="cs-meta-val">${v}</div>
    </div>
  `).join('');

  const tagsHTML = cs.tags.map(t => `<div class="cs-tag">${t}</div>`).join('');

  preview.innerHTML = `
    <div class="cs-view">
      ${heroSrc ? `<div class="cs-view-hero"><img src="${heroSrc}" alt="${cs.title}" /></div>` : ''}
      <div class="cs-view-body">
        <div class="cs-view-header">
          <div class="cs-view-header-left">
            <div class="cs-label ${cs.labelClass || ''}">${cs.label}</div>
            <div class="cs-view-title">${cs.title}</div>
            <div class="cs-file-info">${cs.fileInfo || 'Figma File'}</div>
          </div>
          <a href="${cs.link}" target="_blank" class="cs-link-btn"${linkDisabled}>${cs.linkLabel}</a>
        </div>
        <div class="cs-view-cols">
          <div class="cs-view-meta-col">
            ${metaBlocksHTML}
            <div class="cs-tags">${tagsHTML}</div>
          </div>
          <div class="cs-view-desc-col">
            <p class="cs-desc-text">${cs.description}</p>
          </div>
        </div>
      </div>
    </div>
  `;
}


// ── Creative Overlay ────────────────────────────────────────
const CREATIVE_ASSETS = {
  graphic: {
    title: 'Graphic Design',
    subtitle: 'Visual systems, branding, and playful explorations across digital and print.',
    files: [
      { name: 'Concept Map.png',      thumb: 'assets/graphic design/gd-concept-map.webp' },
      { name: 'APO Fall Rush.png',    thumb: 'assets/stacks/art/gd-fall-rush.webp' },
      { name: 'Product Brochure.png', thumb: 'assets/stacks/art/gd-brochure.webp' },
      { name: 'APO Spring Rush.png',  thumb: 'assets/stacks/art/gd-spring-rush.webp' },
      { name: 'UCR ASPB Flyer.png',   thumb: 'assets/stacks/art/gd-aspb.webp' },
      { name: 'Concert Flyer.png',    thumb: 'assets/stacks/art/gd-concert.webp' },
      { name: 'Adobe Ambassador Flyer.png', thumb: 'assets/stacks/art/adobe ambassador flyer.webp' },
      { name: 'Fruit Plate Illustration.png', thumb: 'assets/stacks/art/fruit plate illustration.webp' },
    ],
    rows: [
      [
        { img: 'assets/stacks/art/gd-fall-rush.webp', title: 'UCR Alpha Phi Omega Rush Flyer', medium: 'Canva, Procreate, Photoshop', year: '2023' },
        { img: 'assets/stacks/art/gd-brochure.webp', title: 'Designer Drains Product Brochure', medium: 'Canva, Photoshop', year: '2025' },
      ],
      [
        { img: 'assets/stacks/art/gd-spring-rush.webp', title: 'UCR Alpha Phi Omega Rush Flyer', medium: 'Canva, Medibang Paint Pro', year: '2022' },
        { img: 'assets/stacks/art/gd-aspb.webp', title: 'UCR ASPB Spring Quarter Campaign', medium: 'Photoshop', year: '2022' },
        { img: 'assets/stacks/art/gd-concert.webp', title: 'UCR ASPB Mock Concert Flyer', medium: 'Illustrator', year: '2022' },
      ],
      [
        { img: 'assets/stacks/art/adobe ambassador flyer.webp', title: 'Adobe Ambassador Flyer', medium: 'Illustrator, Canva', year: '2025' },
        { img: 'assets/stacks/art/fruit plate illustration.webp', title: 'Fruit Plate Illustration', medium: 'Procreate', year: '2026' },
      ],
    ]
  },
  artwork: {
    title: 'Artwork',
    subtitle: 'Personal, expressive work where I explore mood, color, and storytelling.',
    files: [
      { name: 'Music Album.png',   thumb: 'assets/stacks/art/art-music-album.webp' },
      { name: 'HALIENE Jersey.png',thumb: 'assets/stacks/art/art-haliene.webp' },
      { name: 'Tree Illust.png',   thumb: 'assets/stacks/art/art-tree.webp' },
      { name: '3D Lofi Room.mov',  thumb: null },
    ],
    rows: [
      [
        { img: 'assets/stacks/art/art-music-album.webp', title: 'Music Album Illustration', medium: 'Medibang Paint Pro', year: '2022', tall: true },
        { img: 'assets/stacks/art/art-haliene.webp', title: 'Official Jersey for HALIENE Water EP', medium: 'Procreate, Photoshop', year: '2025', tall: true },
      ],
      [
        { img: 'assets/stacks/art/art-tree.webp', title: 'Tree Illustration', medium: 'Procreate', year: '2025' },
        { img: null, title: 'Cozy Lofi Room — 3D Model Animation', medium: 'Blender, Capcut', year: '2023', empty: true },
      ],
    ]
  },
  photo: {
    title: 'Photography',
    subtitle: 'Capturing people, places, and moments that inspire my design perspective.',
    files: [
      { name: 'Sunset Beach.png',   thumb: 'assets/stacks/photo-video/ph-sunset.webp' },
      { name: 'Concert.png',        thumb: 'assets/stacks/photo-video/ph-confetti.webp' },
      { name: 'Koi Fish.png',       thumb: 'assets/stacks/photo-video/ph-koi.webp' },
      { name: 'Bryant Barnes.png',  thumb: 'assets/stacks/photo-video/ph-bryant.webp' },
      { name: 'Joshua Tree.png',    thumb: 'assets/stacks/photo-video/ph-joshua.webp' },
      { name: 'Temple.png',         thumb: 'assets/stacks/photo-video/ph-temple.webp' },
    ],
    rows1: [
      { src: 'assets/stacks/photo-video/ph-sunset.webp',       year: '2022' },
      { src: 'assets/stacks/photo-video/ph-confetti.webp',     year: '2023', medium: 'iPhone, Lightroom' },
      { src: 'assets/stacks/photo-video/ph-koi.webp',          year: '2025' },
      { src: 'assets/stacks/photo-video/ph-bryant.webp',       year: '2025', medium: 'iPhone, Lightroom' },
      { src: 'assets/stacks/photo-video/ph-joshua.webp',       year: '2021' },
      { src: 'assets/stacks/photo-video/ph-temple.webp',       year: '2025' },
      { src: 'assets/stacks/photo-video/ph-space-needle.webp', year: '2024' },
      { src: 'assets/stacks/photo-video/ph-vendor.webp',       year: '2025' },
    ],
    rows2: [
      { src: 'assets/stacks/photo-video/ph-couple.webp',    year: '2025' },
      { src: 'assets/stacks/photo-video/ph-friends.webp',   year: '2025' },
      { src: 'assets/stacks/photo-video/ph-glitter.webp',   year: '2023' },
      { src: 'assets/stacks/photo-video/ph-flowers.webp',   year: '2024' },
      { src: 'assets/stacks/photo-video/ph-champagne.webp', year: '2022' },
      { src: 'assets/stacks/photo-video/ph-grad-conf.webp', year: '2022' },
      { src: 'assets/stacks/photo-video/ph-bffs.webp',      year: '2023' },
      { src: 'assets/stacks/photo-video/ph-hugs.webp',      year: '2021' },
    ]
  }
};

// ── Creative overlay data ────────────────────────────────────
const CR_DATA = {
  graphic: {
    title: 'Graphic Design',
    section: 'Recents',
    files: [
      { name: 'Concept Map.png',     fullname: 'MDes Thesis Concept Map',                  size: 'PNG image · 11.4 MB', img: 'assets/graphic design/gd-concept-map.webp' },
      { name: 'APO Fall Rush.png',   fullname: 'Alpha Phi Omega Fall Rush Flyer',           size: 'PNG image · 495 KB',  img: 'assets/stacks/art/gd-fall-rush.webp' },
      { name: 'Product Brochure.png',fullname: 'Designer Drains Product Brochure',          size: 'PNG image · 239 KB',  img: 'assets/stacks/art/gd-brochure.webp' },
      { name: 'APO Spring Rush.png', fullname: 'Alpha Phi Omega Spring Rush Flyer',         size: 'PNG image · 439 KB',  img: 'assets/stacks/art/gd-spring-rush.webp' },
      { name: 'UCR ASPB Flyer.png',  fullname: 'UCR ASPB Spring Quarter Initiative Flyer', size: 'PNG image · 683 KB',  img: 'assets/stacks/art/gd-aspb.webp' },
      { name: 'Concert Flyer.png',   fullname: 'UCR ASPB Mock Concert Flyer',              size: 'PNG image · 899 KB',  img: 'assets/stacks/art/gd-concert.webp' },
      { name: 'Adobe Ambassador Flyer.png', fullname: 'Adobe Ambassador Flyer', size: 'PNG image · 512 KB', img: 'assets/stacks/art/adobe ambassador flyer.webp' },
      { name: 'Fruit Plate Illustration.png', fullname: 'Fruit Plate Illustration', size: 'PNG image · 478 KB', img: 'assets/stacks/art/fruit plate illustration.webp' },
    ]
  },
  artwork: {
    title: 'Artwork',
    section: 'Recents',
    files: [
      { name: 'Music Album.png',       fullname: 'Music Album Cover Art for LiiO',              size: 'PNG image · 899 KB', img: 'assets/stacks/art/art-music-album.webp', medium: 'Medibang Paint Pro · 2022' },
      { name: 'HALIENE Jersey.png',    fullname: 'Official Jersey Design for HALIENE Water EP', size: 'PNG image · 3.2 MB', img: 'assets/stacks/art/art-haliene.webp', medium: 'Procreate, Photoshop · 2025' },
      { name: 'Tree Illustration.png', fullname: 'Tree Illustration',                           size: 'PNG image · 510 KB', img: 'assets/stacks/art/art-tree.webp' },
      { name: '3D Lofi Room.mov',      fullname: '3D Cozy Lofi Room Animation',                 size: 'Movie · 2.3 MB',    img: null, video: 'assets/playground/lofi-room.mp4' },
    ]
  },
  photo: {
    title: 'Photography',
    sections: [
      {
        label: 'Outside',
        files: [
          { name: 'Sunset Beach.png',     fullname: 'Sunset Beach',     size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-sunset.webp' },
          { name: 'Concert Confetti.png', fullname: 'Concert Confetti', size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-confetti.webp' },
          { name: 'Koi Fish.png',         fullname: 'Koi Fish',         size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-koi.webp' },
          { name: 'Bryant Barnes.png',    fullname: 'Bryant Barnes',    size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-bryant.webp' },
          { name: 'Joshua Tree.png',      fullname: 'Joshua Tree',      size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-joshua.webp' },
          { name: 'Temple.png',           fullname: 'Temple',           size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-temple.webp' },
          { name: 'Space Needle.png',     fullname: 'Space Needle',     size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-space-needle.webp' },
          { name: 'Street Vendor.png',    fullname: 'Street Vendor',    size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-vendor.webp' },
        ]
      },
      {
        label: 'Graduation',
        files: [
          { name: 'Couple.png',        fullname: 'Couple',        size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-couple.webp' },
          { name: 'Friend Group.png',  fullname: 'Friend Group',  size: 'PNG image · 899 KB', img: 'assets/stacks/photo-video/ph-friends.webp' },
          { name: 'Glitter.png',       fullname: 'Glitter',       size: 'PNG image · 553 KB', img: 'assets/stacks/photo-video/ph-glitter.webp' },
          { name: 'Spring Flowers.png',fullname: 'Spring Flowers',size: 'PNG image · 489 KB', img: 'assets/stacks/photo-video/ph-flowers.webp' },
          { name: 'Champagne.png',     fullname: 'Champagne',     size: 'PNG image · 435 KB', img: 'assets/stacks/photo-video/ph-champagne.webp' },
          { name: 'Confetti.png',      fullname: 'Confetti',      size: 'PNG image · 497 KB', img: 'assets/stacks/photo-video/ph-grad-conf.webp' },
          { name: 'BFFs.png',          fullname: 'BFFs',          size: 'PNG image · 392 KB', img: 'assets/stacks/photo-video/ph-bffs.webp' },
          { name: 'Hugs.png',          fullname: 'Hugs',          size: 'PNG image · 497 KB', img: 'assets/stacks/photo-video/ph-hugs.webp' },
        ]
      }
    ]
  }
};

function switchCreativeTab(tab) {
  // Update sidebar active tab
  ['graphic', 'artwork', 'photo'].forEach(t => {
    const el = document.getElementById(`tab-${t}`);
    if (el) {
      el.classList.toggle('cr-tab-active', t === tab);
      el.classList.toggle('cr-tab', true);
    }
  });

  const data = CR_DATA[tab];
  if (!data) return;

  // Update chrome title
  const titleEl = document.getElementById('creative-title');
  if (titleEl) titleEl.textContent = data.title;

  // Build file list
  const filesEl = document.getElementById('creative-files');
  if (!filesEl) return;

  let html = '';

  if (tab === 'photo') {
    data.sections.forEach(sec => {
      html += `<div class="cr-section-label">${sec.label}</div>`;
      sec.files.forEach(f => {
        html += fileItemHtml(f);
      });
    });
  } else {
    html += `<div class="cr-section-label">${data.section}</div>`;
    data.files.forEach(f => { html += fileItemHtml(f); });
  }

  filesEl.innerHTML = html;

  // Clear preview
  const preview = document.getElementById('creative-preview');
  if (preview) preview.innerHTML = `<div class="cr-preview-empty">Select a file to preview</div>`;
}

function fileItemHtml(f) {
  const encodedF = encodeURIComponent(JSON.stringify(f));
  const thumb = f.img
    ? `<img src="${f.img}" class="cr-thumb" alt="" />`
    : `<div class="cr-thumb cr-thumb-video"></div>`;
  return `
    <div class="cr-file-item" onclick="selectCreativeFile(this, '${encodedF}')">
      ${thumb}
      <span class="cr-file-name">${f.name}</span>
    </div>`;
}

function selectCreativeFile(el, encodedF) {
  document.querySelectorAll('#creative-files .cr-file-item').forEach(f => f.classList.remove('cr-active'));
  el.classList.add('cr-active');

  const f = JSON.parse(decodeURIComponent(encodedF));
  const preview = document.getElementById('creative-preview');
  if (!preview) return;

  let mediaHtml;
  if (f.video) {
    mediaHtml = `<video src="${f.video}" muted loop autoplay playsinline style="width:100%;height:auto;display:block;"></video>`;
  } else if (f.youtube) {
    mediaHtml = `<iframe src="${f.youtube}" class="cr-youtube" frameborder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowfullscreen></iframe>`;
  } else if (f.img) {
    mediaHtml = `<img src="${f.img}" alt="${f.fullname}" />`;
  } else {
    mediaHtml = `<div class="cr-preview-empty">Preview not available</div>`;
  }

  preview.innerHTML = `
    <div class="cr-preview-content">
      <div class="cr-img-area">${mediaHtml}</div>
      <div class="cr-info-panel">
        <div class="cr-info-filename">${f.fullname}</div>
        <div class="cr-info-filesize">${f.size}</div>
        <div class="cr-info-header">Information</div>
        <div class="cr-info-row"><span>Created</span><span>2025–2026</span></div>
        <div class="cr-info-row"><span>Modified</span><span>Recently</span></div>
        <div style="margin-top:16px" class="cr-info-header">Tags</div>
        <div class="cr-tags" style="margin-top:8px">
          <div class="cr-tag">Design</div>
          <div class="cr-tag">Sydney</div>
        </div>
      </div>
    </div>`;
}

// Initialise on open
function initCreativeOverlay() {
  switchCreativeTab('graphic');
}


// ── Portfolio Content Builder ────────────────────────────────
(function buildPortfolio() {
  // The pen: traces one wobbly stroke, clockwise from the top-left, around a
  // w×h rounded rect and returns the path `d`. Shared so the hero-arc photo
  // frames and the case-study hover marks are literally the same hand — callers
  // pass the box, corner radius, inset (negative = draw just outside the edge)
  // and the point/corner/edge-bow wobble amplitudes. Seeded per element so no
  // two strokes are identical but they read as one set.
  function handFramePath(seed, w, h, r, ins, PJ, CJ, BOW) {
    let t = (seed * 1013904223 + 1) >>> 0;        // seeded RNG (deterministic per element)
    const rnd = () => {
      t = (Math.imul(t ^ (t >>> 15), t | 1)) >>> 0;
      t ^= t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const j = (amp) => (rnd() * 2 - 1) * amp;
    const x0 = ins, y0 = ins, x1 = w - ins, y1 = h - ins;
    const p = (x, y) => [ +(x + j(PJ)).toFixed(2), +(y + j(PJ)).toFixed(2) ];
    const c = (x, y) => [ +(x + j(CJ)).toFixed(2), +(y + j(CJ)).toFixed(2) ];   // corner control pts
    // Eight edge-tangent points, clockwise from the top-left of the top edge.
    const tTopL = p(x0 + r, y0), tTopR = p(x1 - r, y0),
          tRT   = p(x1, y0 + r), tRB   = p(x1, y1 - r),
          tBR   = p(x1 - r, y1), tBL   = p(x0 + r, y1),
          tLB   = p(x0, y1 - r), tLT   = p(x0, y0 + r);
    const cTR = c(x1, y0), cBR = c(x1, y1), cBL = c(x0, y1), cTL = c(x0, y0);
    const eMid = (a, b) => [ +((a[0]+b[0])/2 + j(BOW)).toFixed(2), +((a[1]+b[1])/2 + j(BOW)).toFixed(2) ]; // bowed edge midpoint
    const over = [ +(tTopL[0] + 1.6 + j(0.4)).toFixed(2), +(tTopL[1] - 0.3 + j(0.4)).toFixed(2) ];        // overshoot the start (open, hand-drawn corner)
    return `M${tTopL} Q${eMid(tTopL,tTopR)} ${tTopR} Q${cTR} ${tRT}` +
      ` Q${eMid(tRT,tRB)} ${tRB} Q${cBR} ${tBR}` +
      ` Q${eMid(tBR,tBL)} ${tBL} Q${cBL} ${tLB}` +
      ` Q${eMid(tLB,tLT)} ${tLT} Q${cTL} ${over}`;
  }

  // ── The pen (v2) ─────────────────────────────────────────────────────────
  // One hand shared by every hand-drawn frame — the case-study card outlines,
  // the Archive stack covers, and the hero arc photo frames. Tuned to match the
  // mascot avatar's line: a brush stroke whose WIDTH swells and tapers (thin at
  // the jaw, heavy on the hair), with confident LOW-frequency wobble, ends that
  // taper to a point, and corners that OVERSHOOT — the lines cross past each
  // other instead of meeting cleanly.
  //
  // Rendered as a filled ribbon (not a constant stroke-width) so the width can
  // actually vary along the length — a constant width is the biggest tell.
  //
  // Tune here; every frame updates together and the CHARACTER stays identical
  // (only the per-element seed differs). Amplitudes are in px, i.e. one physical
  // hand: a small frame overshoots proportionally more, like a real pen. Small
  // frames may pass scaled overrides (see handStroke's `over` arg).
  const PEN = {
    AMPLITUDE:        2.4,  // px — how far the line strays from the ideal edge (moderate)
    FREQUENCY:        2.2,  // deviation cycles around the whole perimeter (LOW = confident, not shaky)
    WEIGHT:           1.7,  // px — base line weight (matches the avatar contour, ~1.5–1.8)
    WEIGHT_VARIATION: 1.0,  // px — how much the width swells/thins along the stroke (±)
    WEIGHT_FREQUENCY: 2.6,  // width-change cycles around the perimeter (LOW)
    CORNER_OVERSHOOT: 4.5,  // px each corner bulges past the ideal corner (the cross)
    END_OVERSHOOT:    16,   // px the finishing tail runs past the start — crossing, non-closed
    END_TAPER:        0.2,  // the two ends narrow to this fraction of WEIGHT (fine points)
    SAMPLES:          140,  // centreline resolution (higher = smoother ribbon)
  };

  const _dist  = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const _lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const _quad  = (q, t) => {                       // quadratic Bézier point at t
    const mt = 1 - t;
    return [ mt*mt*q[0][0] + 2*mt*t*q[1][0] + t*t*q[2][0],
             mt*mt*q[0][1] + 2*mt*t*q[1][1] + t*t*q[2][1] ];
  };
  const _fmt = (n) => Math.round(n * 100) / 100;

  // Ideal (un-wobbled) centreline of a rounded rect whose corners bulge OUTWARD
  // past the true corner by `cornerOver`, so adjacent edges cross. Returns an
  // arc-length sampler at(u), u∈[0,1) clockwise from the top edge, wrapping.
  function roundedRectCentreline(x0, y0, x1, y1, r, cornerOver) {
    const rr = Math.max(0, Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2));
    const k = 0.7071;                              // 1/√2 → outward diagonal
    const o = cornerOver * k;
    const segs = [
      { line: [[x0 + rr, y0], [x1 - rr, y0]] },                                 // top
      { quad: [[x1 - rr, y0], [x1 + o, y0 - o], [x1, y0 + rr]] },               // TR (bulge out)
      { line: [[x1, y0 + rr], [x1, y1 - rr]] },                                 // right
      { quad: [[x1, y1 - rr], [x1 + o, y1 + o], [x1 - rr, y1]] },               // BR
      { line: [[x1 - rr, y1], [x0 + rr, y1]] },                                 // bottom
      { quad: [[x0 + rr, y1], [x0 - o, y1 + o], [x0, y1 - rr]] },               // BL
      { line: [[x0, y1 - rr], [x0, y0 + rr]] },                                 // left
      { quad: [[x0, y0 + rr], [x0 - o, y0 - o], [x0 + rr, y0]] },               // TL (closes to top)
    ];
    const lens = segs.map(s => {
      if (s.line) return _dist(s.line[0], s.line[1]);
      let L = 0, prev = s.quad[0];
      for (let t = 0.25; t <= 1.0001; t += 0.25) { const p = _quad(s.quad, t); L += _dist(prev, p); prev = p; }
      return L;
    });
    const total = lens.reduce((a, b) => a + b, 0);
    const cum = []; let acc = 0;
    for (const l of lens) { cum.push(acc); acc += l; }
    function at(u) {
      u = ((u % 1) + 1) % 1;
      const target = u * total;
      let i = segs.length - 1;
      for (let j = 0; j < segs.length; j++) { if (target < cum[j] + lens[j]) { i = j; break; } }
      const lt = lens[i] ? (target - cum[i]) / lens[i] : 0;
      const s = segs[i];
      return s.line ? _lerp2(s.line[0], s.line[1], lt) : _quad(s.quad, lt);
    }
    return { at, total };
  }

  // Build the filled-ribbon path `d` for one hand-drawn frame.
  function handStroke(seed, w, h, r, ins, over) {
    const P = over ? Object.assign({}, PEN, over) : PEN;
    let t = (seed * 1013904223 + 1) >>> 0;
    const rnd = () => {
      t = (Math.imul(t ^ (t >>> 15), t | 1)) >>> 0;
      t ^= t + (Math.imul(t ^ (t >>> 7), t | 61) >>> 0);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const ph1 = rnd() * 6.283, ph2 = rnd() * 6.283, ph3 = rnd() * 6.283, ph4 = rnd() * 6.283;
    const x0 = ins, y0 = ins, x1 = w - ins, y1 = h - ins;
    const cl = roundedRectCentreline(x0, y0, x1, y1, r, P.CORNER_OVERSHOOT);
    const TAU = 6.283185;
    // Two summed sines → organic low-frequency deviation, never an obvious cycle.
    const wobble = (u) => Math.sin(u * TAU * P.FREQUENCY + ph1) * 0.62
                        + Math.sin(u * TAU * P.FREQUENCY * 1.9 + ph2) * 0.38;
    const widthN = (u) => Math.sin(u * TAU * P.WEIGHT_FREQUENCY + ph3) * 0.6
                        + Math.sin(u * TAU * P.WEIGHT_FREQUENCY * 1.7 + ph4) * 0.4;

    const overU = P.END_OVERSHOOT / cl.total;      // overshoot as a fraction of the perimeter
    const N = P.SAMPLES;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const f = i / N;
      const u = -overU + f * (1 + 2 * overU);      // start just before the seam, end just past it
      const c = cl.at(u);
      const a = cl.at(u - 0.004), b = cl.at(u + 0.004);
      let tx = b[0] - a[0], ty = b[1] - a[1];
      const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl;
      const nx = -ty, ny = tx;                     // unit normal
      const off = P.AMPLITUDE * wobble(u);
      const cx = c[0] + nx * off, cy = c[1] + ny * off;
      // Taper the two overshoot tails to fine points; full weight everywhere else.
      const edge = Math.min(f, 1 - f) / (overU + 0.05);
      const taper = P.END_TAPER + (1 - P.END_TAPER) * Math.min(1, edge);
      const wd = Math.max(0.15, (P.WEIGHT + P.WEIGHT_VARIATION * widthN(u)) * taper);
      pts.push([cx, cy, nx, ny, wd]);
    }
    // Filled ribbon: down the left offset, back up the right offset.
    let d = 'M';
    for (let i = 0; i < pts.length; i++) { const p = pts[i]; d += (i ? 'L' : '') + _fmt(p[0] + p[2] * p[4] / 2) + ' ' + _fmt(p[1] + p[3] * p[4] / 2) + ' '; }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; d += 'L' + _fmt(p[0] - p[2] * p[4] / 2) + ' ' + _fmt(p[1] - p[3] * p[4] / 2) + ' '; }
    return d + 'Z';
  }

  // Expose the pen so the Archive stacks (a separate IIFE) draw with the exact
  // same hand. The stacks pass a per-call scale override (built from PEN, attached
  // here) so the much smaller covers read with the same PROPORTIONAL restraint as
  // the cards — same character, not re-authored; see buildStackOutline.
  handStroke.PEN = PEN;
  window.__handStroke = handStroke;

  // Case study inline cards
  const csGrid = document.getElementById('cs-inline-grid');
  if (csGrid) {
    const cards = [
      { key:'shoal',     page:'shoal', title:'Shoal', logo:'assets/case studies/shoal/cover/app-icon.png', meta:'Team · Fall 2026', done:'Fall 2026', tags:['Healthcare','Hardware + App','Research'], tagColor:{bg:'#e6eefb',text:'#1d3f7a'}, thumbs:['assets/case studies/shoal/shoal-thumb.jpg', null, null], desc:'A kit and app that helps a family share the work of end-of-life care.', tint:'52, 118, 240', accent:'74, 125, 214',
        // The cover is four tiles that fit together with even gaps: the kit, the "Refill Dad's prescription" task, the
        // family jars, and the app on a navy tile playing the "hand it off" recording. When the card lands, the tiles
        // rearrange inside the cover: the kit slides right and the task grows up into its place to show "Who should take
        // it?" (the step after tapping it). Then two pieces that aren't part of the four come out past the top edge:
        // the notification from the recording ("Mom said yes…") rises out of the app tile, and Pebble peeks over the
        // task tile. They go back in first when the card leaves, then the tiles return.
        layered: true, panelBg: 'radial-gradient(120% 90% at 100% 0%, #c9dcfb 0%, rgba(201,220,251,0) 60%), radial-gradient(90% 80% at 0% 100%, #f5e6c6 0%, rgba(245,230,198,0) 60%), #e4eaf3',
        pop: `<img class="sb sb-pebble" src="assets/case studies/shoal/motion/proto/assets/pebble/pebble_peer_down.png" alt="">
          <div class="sb sb-note"><i class="sb-icon"></i><span><b>Shoal <small>now</small></b>Mom said yes to “Ask hospice about a bed”</span></div>
          <div class="st st-kit"><img src="assets/case studies/shoal/cover/kit-jars.jpg" alt=""></div>
          <div class="st st-task">
            <i class="st-gem"></i>
            <p class="st-title">Refill Dad's prescription</p>
            <p class="st-sub">Due tomorrow · urgent</p>
            <div class="st-more">
              <p class="st-q">Who should take it?</p>
              <div class="st-row on"><img src="assets/case studies/shoal/motion/proto/assets/avatar-bill.png" alt=""><span><b>Bill</b><small>Free tonight · 4 tasks</small></span><u></u></div>
              <div class="st-row"><img src="assets/case studies/shoal/motion/proto/assets/avatar-nora.png" alt=""><span><b>Nora</b><small>Busy until Fri · remote</small></span><u></u></div>
              <div class="st-row"><img src="assets/case studies/shoal/motion/proto/assets/avatar-sam.png" alt=""><span><b>Sam</b><small>Not on the app · gets a text</small></span><u></u></div>
              <span class="st-btn">Ask Bill</span>
            </div>
          </div>
          <div class="st st-jars"><p class="st-h">Family jars <small>People ›</small></p><img src="assets/case studies/shoal/cover/jars.jpg" alt=""></div>
          <div class="st st-app">
            <div class="sp-phone"><div class="sp-scr"><video src="assets/case studies/shoal/app-myjar.mp4" poster="assets/case studies/shoal/app-myjar.jpg" muted playsinline loop preload="none"></video></div><img class="sp-frame" src="assets/case studies/shoal/motion/proto/assets/phone-frame.png" alt=""></div></div>` },
      { key:'tour-finder', page:'tour-finder', title:'Tour Finder', logo:'assets/case studies/tour-finder/logo-icon.png', logoTile:true, meta:'Solo · July 2026 · 2 Days', done:'July 2026', tags:['Music','Data','Dashboard'], thumbs:['assets/case studies/tour-finder/hero.webp', null, null], desc:'Surfacing artists likely to tour, before anyone else notices.', tint:'58, 58, 62', accent:'224, 122, 95',
        // Rest: the dashboard scan plays at its full width, the top lead (Jvke) sits in a row under it, and a concert
        // photo and a newly detected tour fill the right column. When the card lands the new tour opens up (its genre,
        // roster status and first show) and the photo gets shorter to make room. Then a tour bus drives along the top
        // edge and a "New tour detected" alert rises out of the right column.
        layered: true, panelBg: 'radial-gradient(110% 90% at 0% 0%, #ffffff 0%, rgba(255,255,255,0) 55%), radial-gradient(90% 80% at 100% 100%, #f4ddd3 0%, rgba(244,221,211,0) 60%), #ececef',
        pop: `<div class="pb tf-bus"><svg viewBox="0 0 120 56" aria-hidden="true"><path class="ln" d="M-13 15.5C-9 15.3-5.5 15.6-2.5 15.2M-17 23.5C-12 23.2-7 23.6-3 23.3"/><path class="bk" d="M10 4.6C40 3.6 80 4.4 110 3.8C114.5 3.9 117.2 6.6 117 11C117.4 20 116.6 30 117.2 38.5C117 41 115 42.3 112 42C80 42.8 40 41.6 9 42.4C5.4 42.3 3.2 40.4 3.4 37C2.8 28 3.6 18 3.1 10.5C3.3 6.6 6 4.4 10 4.6Z"/><path class="wn" d="M96.5 10.2L107.6 9.8C110.6 10 111.8 11.6 111.6 14.4L111.9 25.8L96.2 26.3Z"/><path class="ln thin" d="M99.5 22.5L104 13.5M103.5 24L108.5 14"/><path class="wn" d="M10.4 10.6L22.6 10.2L22.9 21.8L10.2 22.2Z"/><path class="wn" d="M27.3 10.3L39.6 10.5L39.4 22L27.1 21.7Z"/><path class="wn" d="M44.2 10.6L56.8 10.2L57.1 21.9L44.4 22.1Z"/><path class="wn" d="M61.4 10.2L73.6 10.6L73.3 21.8L61.2 22Z"/><path class="wn" d="M80.3 10.4L90.6 10.1L90.9 37.9L80.1 38.2Z"/><path class="ln" d="M85.5 11L85.6 37.4M4 28.8C30 27.9 55 29.3 79.6 28.5"/><path class="ln" d="M110.6 33.6C112.4 32.9 114.4 33.2 114.6 34.8C114.7 36.2 112.6 36.7 111 36.3"/><path class="wh" d="M26.3 35.6C31.4 35.8 34.6 39.6 34.4 44.3C34.2 49 30.4 52.7 25.6 52.5C21 52.3 17.4 48.6 17.6 43.8C17.8 39.1 21.6 35.4 26.3 35.6Z"/><circle class="hb" cx="26" cy="44" r="3"/><path class="wh" d="M96.3 35.5C101.3 35.7 104.6 39.5 104.4 44.2C104.2 49 100.3 52.6 95.6 52.5C90.9 52.4 87.4 48.6 87.6 43.9C87.8 39.2 91.5 35.3 96.3 35.5Z"/><circle class="hb" cx="96" cy="44" r="3"/></svg></div>
          <div class="pb pb-note tf-alert"><img src="assets/case studies/tour-finder/logo-icon.png" alt=""><span><b>New tour detected <small>now</small></b>Billy Strings · 20 dates in 11 cities</span></div>
          <div class="pt tf-vid"><video src="assets/case studies/tour-finder/cover/scan.mp4" poster="assets/case studies/tour-finder/cover/scan.jpg" muted playsinline loop preload="none"></video></div>
          <div class="pt tf-lead"><img src="assets/case studies/tour-finder/cover/jvke.jpg" alt=""><span class="tf-ln"><small>Top lead</small><b>Jvke</b><em>Strong Match</em></span><p class="tf-stats"><span><b>8/27/25</b><small>Last tour</small></span><span><b>6,226</b><small>Avg. venue cap</small></span><span><b>1.7M</b><small>Monthly listeners</small></span></p><i>100</i></div>
          <div class="pt tf-photo"><img src="assets/case studies/tour-finder/concert.webp" alt=""></div>
          <div class="pt tf-new"><b>Brit Floyd</b><small>Rock artist</small><p class="tf-dc"><span><b>22</b><small>Dates</small></span><span><b>21</b><small>Cities</small></span></p><div class="pm tf-more"><p class="tf-tags"><span class="g">Rock</span><span>Not in your roster</span></p><p class="tf-first"><b>First Show:</b> Jul 21, 2026 · VBC Mark C Smith Concert Hall · Huntsville</p></div></div>` },
      { key:'iterait',   page:'iterait', title:'iterait', logo:'assets/case studies/iterait/logo-icon.png', meta:'Team · 2026', done:'2026', tags:['AI','Software','Design'], tagColor:{bg:'#D9FCFF',text:'#006070'}, thumbs:['assets/case studies/iterait/iterait cover image.webp', 'assets/case studies/iterait/iterait case study photo 1.webp', 'assets/case studies/iterait/iterait case study photo 2.webp'], desc:'Track, compare, and reuse iterations in AI-driven design workflows.', tint:'18, 160, 165', accent:'155, 175, 230', hackathon:{ place:'top 3 track finalist', name:'SJHacks 2026' },
        // Rest: the recording plays at its full width with the four detected changes in a row under it, and the
        // "Before" landing page fills the right column. When the card lands the page turns into the "After" version
        // (hero centered, gradient, white headline, new footer) while numbered pins land on it and the matching changes
        // tick off. Then a design-tool cursor hovers over the page and "Prompt copied to clipboard" rises out of the
        // recording.
        layered: true, panelBg: 'radial-gradient(100% 90% at 100% 0%, #c6eff0 0%, rgba(198,239,240,0) 60%), radial-gradient(90% 80% at 0% 100%, #e1e3fa 0%, rgba(225,227,250,0) 60%), #eef6f7',
        pop: `<div class="pb it-cursor"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 2.5 20.5 10l-7.4 2.3L10 20z"/></svg><span>Sydney</span></div>
          <div class="pb it-toast"><i></i>Prompt copied to clipboard</div>
          <div class="pt it-vid"><video src="assets/case studies/iterait/cover/actions.mp4" poster="assets/case studies/iterait/cover/actions.jpg" muted playsinline loop preload="none"></video></div>
          <div class="pt it-changes"><p class="it-h"><b>Changes</b><small>4 detected</small></p><ul><li class="c1"><i>1</i><span><small>Layout</small><b>Hero layout centered</b></span><u></u></li><li class="c2"><i>2</i><span><small>Visual</small><b>Gradient hero background</b></span><u></u></li><li class="c3"><i>3</i><span><small>Typography</small><b>Headline color inverted</b></span><u></u></li><li class="c4"><i>4</i><span><small>Visual</small><b>Footer background updated</b></span><u></u></li></ul></div>
          <div class="pt it-frame"><p class="it-lbl"><span class="it-b4">Before — Marketing Landing Page</span><span class="it-af">After — Marketing Landing Page</span></p><div class="it-page"><p class="it-nav"><b>nov<i>a</i></b><span>Features</span><span>Pricing</span></p><div class="it-hero"><div class="it-v1"><i class="it-eye"></i><p>Write better, faster, together.</p><i class="it-line"></i><i class="it-line s"></i><i class="it-cta"></i></div><div class="it-v2"><i class="it-eye"></i><p>Write better, faster, together.</p><i class="it-line"></i><i class="it-line s"></i><i class="it-cta"></i></div></div><div class="it-body"><i></i><i></i><i></i><i></i></div><p class="it-foot"><i></i><i></i></p><u class="it-pin p1">1</u><u class="it-pin p2">2</u><u class="it-pin p3">3</u><u class="it-pin p4">4</u></div></div>` },
      { key:'voqa',      page:'voqa',      title:'VOQA', logo:'assets/case studies/voqa/logo-icon.png',        meta:'Team · Oct–Dec 2025 · 10 Wks', done:'December 2025', tags:['Mobile','Museum','Accessibility'],        thumbs:['assets/case studies/voqa/voqa-thumb.webp', null, null], desc:'Making museum experiences more inclusive and accessible.',              tint:'148, 188, 52', accent:'90,  185, 140',
        // Rest: the phone (Camera Scan recording) on the left, a gallery photo across the top and the museum in a row
        // under it. When the card lands the cover settles into three columns: the museum opens up to full height (a
        // photo, crowd level, who has visited) and the gallery photo stands up tall on the right while scan brackets
        // close on it. Then the audio description rises out of the phone and a folded museum map peeks over the photo.
        layered: true, panelBg: 'radial-gradient(100% 80% at 0% 0%, #e3f2d3 0%, rgba(227,242,211,0) 60%), radial-gradient(90% 90% at 100% 100%, #cfe8da 0%, rgba(207,232,218,0) 60%), #eef3ec',
        pop: `<div class="pb pb-peek vq-map"><svg viewBox="0 0 120 84" aria-hidden="true"><path class="p1" d="M4 10 40 4v72L4 82z"/><path class="p2" d="M40 4l40 6v72l-40-6z"/><path class="p3" d="M80 10l36-6v72l-36 6z"/><rect class="rm" x="12" y="18" width="20" height="14" rx="2"/><rect class="rm" x="50" y="44" width="22" height="16" rx="2"/><rect class="rm" x="88" y="16" width="20" height="20" rx="2"/><path class="path" d="M20 66c10-10 18-2 30-8s14-16 26-14 16-16 22-26"/><circle class="dot" cx="20" cy="66" r="3"/><path class="pin" d="M98 6c-5 0-8.5 3.6-8.5 8.2 0 6 8.5 13.8 8.5 13.8s8.5-7.8 8.5-13.8C106.5 9.6 103 6 98 6z"/><circle cx="98" cy="14.2" r="3" fill="#fff"/></svg></div>
          <div class="pb pb-note vq-audio"><i></i><span><b>Soda Lake</b><small>Listen to audio description</small></span><u class="vq-wave"><i></i><i></i><i></i><i></i><i></i><i></i></u></div>
          <div class="pt vq-app"><video src="assets/case studies/voqa/cover/scan.mp4" poster="assets/case studies/voqa/cover/scan.jpg" muted playsinline loop preload="none"></video></div>
          <div class="pt vq-photo"><img src="assets/case studies/voqa/san jose museum of art - exhibit.webp" alt=""><i class="vq-br"></i></div>
          <div class="pt vq-museum"><p class="vq-head"><img src="assets/case studies/voqa/childrens discovery musuem - exhibit.webp" alt=""><span><b>Children's Discovery Museum</b><small>3.5 mi away</small><em>Crowd Level: Low</em></span></p><p class="vq-seen vq-seen-row"><span class="vq-faces"><i></i><i></i><i></i></span>Amy Long and 33 others have visited here</p><div class="pm vq-more"><img src="assets/case studies/voqa/childrens discovery musuem - children running outside.webp" alt=""><p class="vq-seen"><span class="vq-faces"><i></i><i></i><i></i></span>Amy Long and 33 others have visited here</p></div></div>` },
      { key:'room2talk', page:'room2talk', title:'room2talk', logo:'assets/case studies/room2talk/logo-rings.svg', logoTile:true,   meta:'Solo · March 2026 · 4 Wks', done:'March 2026',   tags:['Thesis','Web-Game','Mental Health'], thumbs:['assets/case studies/room2talk/r2t-hero.webp',   null, null], desc:'Reflection-based card experience for intergenerational communication.', tint:'239, 155, 184', accent:'239, 155, 184',
        // Rest: Sydney's Individual card flipping (recording) on the left, Sydney's chosen image cards across the top,
        // and Mom's Supporter card along the bottom with her picks still face down. When the card lands Sydney's cards
        // fan out over the top edge, the Supporter card grows taller, and Mom's picks flip face up, like the reveal in
        // the game. Then the app's "you chose Kitchen" question rises as a chat bubble with Mom typing.
        layered: true, panelBg: 'radial-gradient(100% 90% at 0% 0%, #fbe0e8 0%, rgba(251,224,232,0) 60%), radial-gradient(90% 90% at 100% 100%, #d3efea 0%, rgba(211,239,234,0) 60%), #faf5f0',
        pop: `<div class="pb r2-chat"><p>Mom, you chose <b>Kitchen</b> — what was going through your mind when you picked it?</p><p class="r2-typing"><i></i><i></i><i></i></p></div>
          <div class="pt r2-ind"><video src="assets/case studies/room2talk/cover/card.mp4" poster="assets/case studies/room2talk/cover/card.jpg" muted playsinline loop preload="none"></video></div>
          <div class="pt r2-spread"><div class="r2-row"><span class="r2-card"><img src="assets/case studies/room2talk/cover/parent.jpg" alt=""><b>Parent</b><small>Cha/Mẹ</small></span><span class="r2-card"><img src="assets/case studies/room2talk/cover/dining-table.jpg" alt=""><b>Dining Table</b><small>Bàn ăn</small></span><span class="r2-card"><img src="assets/case studies/room2talk/cover/quiet-presence.jpg" alt=""><b>Quiet Presence</b><small>Hiện diện im lặng</small></span></div><p class="r2-who"><em class="r2-s">Sydney</em>Individual · 4 cards</p></div>
          <div class="pt r2-sup"><p class="r2-head">Supporter</p><div class="r2-body"><div class="r2-l"><p class="r2-q">When someone comes to me with something difficult, what I do first — before offering advice — is...</p><p class="pm r2-vi">Khi ai đó tìm đến tôi với điều gì đó khó khăn, điều đầu tiên tôi làm — trước khi đưa ra lời khuyên — là...</p></div><div class="r2-r"><p class="r2-who"><em>Mom</em>Supporter · 5 cards</p><div class="r2-picks"><span class="r2-flip"><span class="r2-back"><img src="assets/case studies/room2talk/logo-rings.svg" alt=""></span><span class="r2-card"><img src="assets/case studies/room2talk/cover/kitchen.jpg" alt=""><b>Kitchen</b><small>Nhà bếp</small></span></span><span class="r2-flip"><span class="r2-back"><img src="assets/case studies/room2talk/logo-rings.svg" alt=""></span><span class="r2-card"><img src="assets/case studies/room2talk/cover/grocery-store.jpg" alt=""><b>Grocery Store</b><small>Cửa hàng tạp hóa</small></span></span><span class="r2-flip"><span class="r2-back"><img src="assets/case studies/room2talk/logo-rings.svg" alt=""></span><span class="r2-card"><img src="assets/case studies/room2talk/cover/sharing-food.jpg" alt=""><b>Sharing Food</b><small>Chia sẻ đồ ăn</small></span></span></div></div></div></div>` },
    ];
    // Hackathon indicator — a hand-drawn crown badge (bottom-right of the card
    // image) that flags a hackathon project. On card hover, a speech bubble
    // (same hand-drawn style as the avatar's) pops up with the placement + event.
    // In the scrolling deck the covers are busy, so the award moves to the project's
    // item in the side list instead (see .csi-award) and the badge is hidden.
    const crownSVG = `<svg class="csc-crown-icon" width="54" height="54" viewBox="0 0 96 96" fill="none" aria-hidden="true"><circle cx="48" cy="48" r="44.5" fill="#fff"/><path d="M48 5 Q90 6 91 47 Q93 90 49 91 Q6 92 5 49 Q3 6 48 5 Z" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 62 L25 40 L34 29 L43.5 45 L48 25 L52.5 45 L62 29 L71 40 L68 62 Z" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M30.5 57 Q48 60 65.5 57" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/></svg>`;
    const bubbleSVG = `<svg class="csc-bubble-shape" viewBox="0 0 260 96" fill="none" aria-hidden="true"><path d="M16 4 Q130 2 244 4 Q256 5 256 18 Q257 37 256 56 Q256 70 243 71 Q232 71.5 221 71.4 Q214 84 208 90 Q203 85 197 71.6 Q106 72 16.5 71 Q4 70.5 4 56 Q3 37 4 18 Q4 5 16 4 Z" fill="#fff" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const crownHTML = h => `<div class="csc-crown" aria-label="${esc(h.place)} — ${esc(h.name)}">${crownSVG}<div class="csc-crown-bubble">${bubbleSVG}<div class="csc-bubble-text"><span class="csc-bubble-place">${esc(h.place)}</span><span class="csc-bubble-name">${esc(h.name)}</span></div></div></div>`;

    // The deck: on desktop, with motion allowed, the cards stack and are dealt in as you scroll (see the end of this block).
    const csZone = csGrid.closest('.cs-zone');
    const stackMode = !!csZone && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (csZone) csZone.classList.add(stackMode ? 'is-stack' : 'is-list');

    csGrid.innerHTML = cards.map((c, i) => {
      const [r, g, b] = c.accent.split(',').map(s => s.trim());
      const colBack  = `rgba(${r},${g},${b},0.22)`;
      const colMid   = `rgba(${r},${g},${b},0.45)`;
      const colFront = `rgba(${r},${g},${b},0.70)`;
      const t0 = (c.thumbs || [])[0];
      const nav = c.page ? `data-page="${c.page}"` : c.url ? `data-url="${c.url}"` : '';
      const hoverMediaAttr = c.hoverVideo ? `data-hover-video="${c.hoverVideo}"` : '';
      const reveal = stackMode ? '' : `data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}"`;
      return `<div class="cs-card" data-idx="${i}" style="left:0px;top:0px" ${reveal} ${nav} role="link" tabindex="0" aria-label="${esc(c.title)}: ${esc(c.desc)}">
        <div class="csc-top">
          <div class="csc-header-row">
            <div class="csc-tags">${(c.tags||[]).map(t=>`<span class="csc-badge" style="background:#f0ede8;color:#666">${t}</span>`).join('')}</div>
            <span class="csc-meta">${c.meta.split('·')[0].trim()}</span>
          </div>
          <div class="csc-title">${c.title}</div>
          <div class="csc-desc">${c.desc}</div>
        </div>
        <div class="csc-media${c.pop ? ' has-pop' : ''}">
        <div class="csc-img-panel" style="background:${c.panelBg || `rgba(${r},${g},${b},0.18)`}" ${hoverMediaAttr}>
          ${t0 && !c.layered ? `<img class="csc-static" src="${t0}" alt="${c.title}" loading="lazy" />` : ''}
          ${c.hoverVideo ? (c.videoFit === 'contain'
            ? `<video class="csc-vid csc-vid-contain" src="${c.hoverVideo}" muted playsinline loop preload="none"></video>`
            : `<video class="csc-vid" src="${c.hoverVideo}" muted playsinline loop preload="none" style="object-fit:${c.videoFit || 'cover'};${c.videoScale ? `transform:scale(${c.videoScale});` : ''}"></video>`) : ''}
        </div>
        ${c.pop ? `<div class="csc-pop csc-pop--${c.key}" aria-hidden="true">${c.pop}</div>` : ''}
        </div>
        ${c.hackathon ? crownHTML(c.hackathon) : ''}
      </div>`;
    }).join('');

    // Layout is handled by CSS (2×2 grid — see .cs-zone .cs-inline-grid).

    // Click (or Enter) to open the case study.
    csGrid.querySelectorAll('.cs-card').forEach((card) => {
      const open = () => {
        // The cover is handed to the next page, where it grows into the case study's first image (nav.js).
        const panel = card.querySelector('.csc-media') || card.querySelector('.csc-img-panel');
        if (panel && card.dataset.page) panel.style.viewTransitionName = 'cs-cover';
        if (card.dataset.page) window.location = card.dataset.page;
        else if (card.dataset.url) window.open(card.dataset.url, '_blank');
      };
      card.addEventListener('click', open);
      card.addEventListener('keydown', (e) => { if (e.key === 'Enter') open(); });
    });

    // Hand-drawn outline around the WHOLE card — the shared pen (handStroke), a
    // filled variable-width ribbon, not a CSS border. Wraps the tags, title,
    // description and thumbnail together as one unit. Shown on HOVER only (CSS
    // fades .csc-outline in), so it's built up-front for correct sizing but hidden
    // at rest.
    //
    // Fitting varying-height cards: each card's ribbon is authored at that card's
    // OWN live pixel size (offsetWidth × offsetHeight) with a 1:1 viewBox, so the
    // weight, wobble and overshoot are identical in absolute pixels on every card
    // regardless of height — never a single path stretched to fit (which would
    // squash the wobble on shorter cards and stretch it on taller ones, e.g.
    // room2talk whose description wraps to two lines). A ResizeObserver re-derives
    // the path whenever a card's box actually changes — image load, text reflow,
    // or responsive resize. The seed varies per card so the four read as one hand
    // without looking stamped.
    const SVGNS = 'http://www.w3.org/2000/svg';
    function buildCardOutline(card) {
      const i = +card.dataset.idx || 0;
      const w = Math.round(card.offsetWidth), h = Math.round(card.offsetHeight);
      if (!w || !h) return;
      let svg = card.querySelector('.csc-outline');
      if (svg && +svg.dataset.w === w && +svg.dataset.h === h) return; // box unchanged
      // r 16 ≈ the card's own corner radius; ins -1 traces just outside the edge
      // so the white hover fill never peeks past the ink (card is overflow:visible).
      const d = handStroke(i * 7 + 3, w, h, 16, -1);
      if (!svg) {
        svg = document.createElementNS(SVGNS, 'svg');
        svg.setAttribute('class', 'csc-outline');
        svg.setAttribute('aria-hidden', 'true');
        card.appendChild(svg);
      }
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
      svg.style.width = w + 'px';
      svg.style.height = h + 'px';
      svg.dataset.w = w; svg.dataset.h = h;
      svg.innerHTML = `<path d="${d}" fill="#1a1a1a"/>`;
    }
    const csCards = csGrid.querySelectorAll('.cs-card');
    const buildAll = () => csCards.forEach(buildCardOutline);
    // Initial build now — reading offsetWidth/Height forces layout, so the boxes
    // measure correctly even this early. Also re-run on `load` (fonts/images may
    // reflow a card) rather than leaning on ResizeObserver's first callback,
    // which isn't reliably delivered everywhere. buildCardOutline no-ops when a
    // card's box is unchanged, so the repeats are cheap.
    buildAll();
    window.addEventListener('load', buildAll);
    // Refit on genuine box changes afterwards — image load, text reflow, resize.
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(entries => entries.forEach(e => buildCardOutline(e.target)));
      csCards.forEach(card => ro.observe(card));
    }
    window.addEventListener('resize', buildAll);

    // Video: in the deck, the top card's cover turns into its video once it has sat there for a second (see draw()).
    // In the plain list, it plays on hover.
    const playVid = (card, on) => {
      const panel = card && card.querySelector('.csc-img-panel[data-hover-video]');
      if (!panel) return;
      const vid = panel.querySelector('.csc-vid');
      if (on) { vid.currentTime = 0; vid.play().catch(() => {}); }
      else { vid.pause(); vid.currentTime = 0; }
      panel.classList.toggle('csc-vid-active', on);
    };
    // A video inside the cover's pieces (Shoal's phone screen) plays while the pieces are out.
    const popVid = (card, on) => card && card.querySelectorAll('.csc-pop video').forEach(v => {
      if (on) v.play().catch(() => {}); else v.pause();
    });
    // In the plain list the pieces come out on hover.
    if (!stackMode) csCards.forEach(card => {
      card.addEventListener('mouseenter', () => { card.classList.add('is-popped'); popVid(card, true); });
      card.addEventListener('mouseleave', () => { card.classList.remove('is-popped'); popVid(card, false); });
    });
    if (!stackMode) csGrid.querySelectorAll('.csc-img-panel[data-hover-video]').forEach(panel => {
      const vid = panel.querySelector('.csc-vid');
      panel.closest('.cs-card').addEventListener('mouseenter', () => {
        vid.currentTime = 0;
        vid.play();
        panel.classList.add('csc-vid-active');
      });
      panel.closest('.cs-card').addEventListener('mouseleave', () => {
        vid.pause();
        vid.currentTime = 0;
        panel.classList.remove('csc-vid-active');
      });
    });

    // ── The deck ──────────────────────────────────────────────
    // The stage pins while the zone scrolls past. The first card sits on the table; each scroll step deals the next
    // one up from below, turning as it lands on the pile at its own slight tilt. Cards underneath settle a little
    // lower and smaller. The list on the left shows which case study is on top, and jumps to any of them.
    const csIndex = document.getElementById('cs-index');
    if (csIndex) {
      // Each item opens when its case study is on top: the project's logo (if it has one), when it was finished, its tags,
      // what it is, and a button to the case study.
      csIndex.innerHTML = cards.map((c, i) => `<li><button type="button" data-i="${i}" style="--acc:${(c.tint || c.accent).replace(/\s+/g, '')}">
        <span class="csi-n">${String(i + 1).padStart(2, '0')}</span><span class="csi-t">${c.logo ? `<img class="csi-logo${c.logoTile ? ' csi-logo--tile' : ''}" src="${c.logo}" alt="">` : ''}${esc(c.title)}</span><span class="csi-m">${esc(c.meta.split('·')[0].trim())}</span>
        <span class="csi-more"><span class="csi-more-in">
          <span class="csi-date">${esc(c.done || '')}</span>
          ${c.hackathon ? `<span class="csi-award">${crownSVG}<span><b>${esc(c.hackathon.place.charAt(0).toUpperCase() + c.hackathon.place.slice(1))}</b> ${esc(c.hackathon.name)}</span></span>` : ''}
          <span class="csi-tags">${(c.tags || []).map(t => `<span class="csi-tag">${esc(t)}</span>`).join('')}</span>
          <span class="csi-d">${esc(c.desc)}</span>
          <span class="csi-go">View case study <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2.6 9.6C4.4 7.9 6.6 5.4 9.3 2.7M4.7 2.5C6.3 2.9 7.9 2.6 9.4 2.5C9.2 4.1 9.4 5.7 9.7 7.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        </span></span>
      </button></li>`).join('');
      // The open item's button is drawn by hand: an uneven, slightly tilted solid shape (no pill underneath) and a
      // hand-drawn arrow. Each tag gets a white fill with a thin pen line around it.
      // Redrawn whenever the item changes size (it grows open and shrinks shut).
      const pen = window.__handStroke;
      if (pen && 'ResizeObserver' in window) {
        const SVGNS = 'http://www.w3.org/2000/svg';
        const layer = (host, cls, w, h) => {
          let s = host.querySelector(':scope > .' + cls);
          if (!s) { s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); host.prepend(s); }
          s.setAttribute('viewBox', '0 0 ' + w + ' ' + h); s.style.width = w + 'px'; s.style.height = h + 'px';
          return s;
        };
        // a hand-drawn button: corners of different roundness, edges that bow a little, the whole thing a touch skewed
        const handButton = (w, h, seed) => {
          let t = (seed * 2654435761) >>> 0;
          const rnd = () => { t ^= t << 13; t >>>= 0; t ^= t >>> 17; t ^= t << 5; t >>>= 0; return t / 4294967296; };
          const J = (a) => (rnd() - .5) * 2 * a;
          const i = 1.5, x0 = i, y0 = i + 1.2, x1 = w - i, y1 = h - i;           // the top edge sits a little lower on the left
          const R = [9 + J(4), 13 + J(4), 8 + J(3), 15 + J(4)];                  // corner radii: tl, tr, br, bl
          const c = [[x0, y0 + J(1)], [x1, i + J(.8)], [x1 - J(.8), y1], [x0 + 1 + J(.8), y1 - J(.8)]];
          const f = (n) => n.toFixed(1);
          const bow = (a, b, amt) => [(a[0] + b[0]) / 2 + J(amt), (a[1] + b[1]) / 2 + J(amt)];
          const along = (a, b, d) => { const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1; return [a[0] + (b[0] - a[0]) * d / L, a[1] + (b[1] - a[1]) * d / L]; };
          let d = '';
          for (let k = 0; k < 4; k++) {
            const p = c[k], n = c[(k + 1) % 4], q = c[(k + 3) % 4];
            const s0 = along(p, q, R[k]), s1 = along(p, n, R[k]);
            const e1 = along(n, p, R[(k + 1) % 4]);
            d += (k ? ' L' : 'M') + f(s0[0]) + ' ' + f(s0[1]) + ' Q' + f(p[0]) + ' ' + f(p[1]) + ' ' + f(s1[0]) + ' ' + f(s1[1]);
            const m = bow(s1, e1, 1.6);
            d += ' Q' + f(m[0]) + ' ' + f(m[1]) + ' ' + f(e1[0]) + ' ' + f(e1[1]);
          }
          return { d: d + ' Z' };
        };
        const inkItem = (b, i) => {
          if (!b.classList.contains('is-on')) { b.querySelectorAll('.csi-go-ink, .csi-tag-ink').forEach(s => s.remove()); return; }
          const go = b.querySelector('.csi-go'), gw = Math.round(go.offsetWidth), gh = Math.round(go.offsetHeight);
          if (gw && gh) {
            const hb = handButton(gw, gh, 51 + i);
            layer(go, 'csi-go-ink', gw, gh).innerHTML = '<path class="csi-go-fill" d="' + hb.d + '"/>';
          }
          b.querySelectorAll('.csi-tag').forEach((t, k) => {
            const tw = Math.round(t.offsetWidth), th = Math.round(t.offsetHeight);
            if (tw && th) layer(t, 'csi-tag-ink', tw, th).innerHTML =
              '<path class="csi-tag-fill" d="' + wobblyBox(tw, th, th / 2, 71 + i * 5 + k).fill + '"/>' +
              '<path d="' + pen(71 + i * 5 + k, tw, th, th / 2, .5, { AMPLITUDE: .7, WEIGHT: 1, WEIGHT_VARIATION: .4, SAMPLES: 60, END_OVERSHOOT: 7, CORNER_OVERSHOOT: 1.5 }) + '"/>';
          });
        };
        const btns = [...csIndex.querySelectorAll('button')];
        const ro = new ResizeObserver(es => es.forEach(e => inkItem(e.target, btns.indexOf(e.target))));
        btns.forEach(b => ro.observe(b));
      }
    }
    if (stackMode) {
      const deck = [...csCards], N = deck.length;
      const stage = csZone.querySelector('.cs-stage');
      const items = csIndex ? [...csIndex.querySelectorAll('button')] : [];
      const REST = [-2.5, 2, -1.5, 2.5, -1, 1.5, -2];          // each card's tilt on the pile
      const SPIN = [0, 14, -12, 16, -14, 12, -16];             // extra turn while it's being dealt
      csZone.style.setProperty('--n', N);
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      const smooth = t => t * t * (3 - 2 * t);
      let topNow = -1, ticking = false, settled = -1, playing = -1, vidTimer = 0, popTimer = 0;
      // How far through the deck the page is, from 0 (first card) to N-1 (last card dealt).
      const progress = () => {
        const r = csZone.getBoundingClientRect(), run = csZone.offsetHeight - stage.offsetHeight;
        return run > 0 ? clamp(-r.top / run, 0, 1) * (N - 1) : 0;
      };
      const draw = () => {
        ticking = false;
        const p = progress(), H = stage.offsetHeight;
        let top = 0, topT = 1;
        deck.forEach((card, i) => {
          const t = i === 0 ? 1 : smooth(clamp(p - (i - 1), 0, 1));   // 0 = still below, 1 = on the pile
          const under = clamp(p - i, 0, 3);                            // how many cards have landed on top of it
          if (t > 0.5) { top = i; topT = t; }
          const y = (1 - t) * H * 0.95 + under * 14;
          const rot = REST[i % REST.length] + (1 - t) * SPIN[i % SPIN.length];
          const sc = 1 - under * 0.04;
          card.style.transform = `translate(-50%, -50%) translateY(${y.toFixed(1)}px) rotate(${rot.toFixed(2)}deg) scale(${sc.toFixed(3)})`;
          card.style.visibility = t > 0.001 ? 'visible' : 'hidden';
          card.style.zIndex = String(i + 1);
        });
        if (top !== topNow) {
          topNow = top;
          deck.forEach((card, i) => {
            card.classList.toggle('is-top', i === top);
            card.tabIndex = i === top ? 0 : -1;
            card.setAttribute('aria-hidden', i === top ? 'false' : 'true');
          });
          items.forEach((b, i) => { b.classList.toggle('is-on', i === top); b.setAttribute('aria-current', i === top ? 'true' : 'false'); });
          // the side menu takes on the open project's color (see .rail-wash in style.css)
          if (items[top]) document.documentElement.style.setProperty('--page-acc', items[top].style.getPropertyValue('--acc'));
        }
        // The video starts once the top card has landed and stayed for a second, and stops when it leaves the top
        // or the section leaves the screen.
        const zr = csZone.getBoundingClientRect();
        document.documentElement.classList.toggle('deck-on', zr.top < innerHeight * 0.5 && zr.bottom > innerHeight * 0.5);
        const landed = topT > 0.97 && zr.bottom > 120 && zr.top < innerHeight - 120 ? top : -1;
        if (landed !== settled) {
          settled = landed;
          clearTimeout(vidTimer); clearTimeout(popTimer);
          // The cover's pieces come out a moment after it lands, and tuck back in as soon as it stops being on top.
          deck.forEach((card, i) => { if (i !== landed) { card.classList.remove('is-popped'); popVid(card, false); } });
          if (landed !== -1) popTimer = setTimeout(() => { deck[landed].classList.add('is-popped'); popVid(deck[landed], true); }, 250);
          if (playing !== -1 && playing !== landed) { playVid(deck[playing], false); playing = -1; }
          if (landed !== -1 && playing !== landed) vidTimer = setTimeout(() => { playing = landed; playVid(deck[landed], true); }, 1000);
        }
      };
      const ask = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
      window.addEventListener('scroll', ask, { passive: true });
      window.addEventListener('resize', ask);
      draw();
      // A firm stop on each card: inside the deck, one wheel or trackpad gesture moves exactly one card, however hard
      // the flick. The page glides to that card's landing point and ignores the rest of the gesture (the trackpad's
      // momentum keeps sending events), so every cover gets to land and open. Coming from above or below, the deck
      // pulls you onto its first or last card. Scrollbar drags and keys scroll as normal.
      const stops = () => {
        const run = csZone.offsetHeight - stage.offsetHeight, top = csZone.getBoundingClientRect().top + window.scrollY;
        return deck.map((_, i) => Math.round(top + (N > 1 ? i / (N - 1) : 0) * run + 2));
      };
      // A new swipe is told apart from the old one's momentum by its speed: momentum only ever slows down, so a pause
      // or a jump in speed means the person scrolled again, even while the old momentum is still arriving.
      let wheelAt = 0, wheelAbs = 0, wheelDir = 0, glideEnd = 0;
      window.addEventListener('wheel', (e) => {
        if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;   // pinch zoom, sideways scroll
        const s = stops(), y = window.scrollY, dir = Math.sign(e.deltaY), reach = innerHeight * 0.6;
        if (!dir) return;
        const inside = dir > 0 ? (y >= s[0] - reach && y < s[N - 1] - 3) : (y > s[0] + 3 && y <= s[N - 1] + reach);
        if (!inside) return;
        e.preventDefault();
        const now = performance.now(), abs = Math.abs(e.deltaY);
        const fresh = now - wheelAt > 120 || dir !== wheelDir || (abs > wheelAbs * 1.4 + 2 && abs > 8);
        wheelAt = now; wheelAbs = abs; wheelDir = dir;
        if (now < glideEnd || !fresh) return;     // still gliding, or the same swipe's momentum
        const to = dir > 0 ? s.find(v => v > y + 3) : [...s].reverse().find(v => v < y - 3);
        if (to == null) return;
        glideEnd = now + 420;
        window.scrollTo({ top: to, behavior: 'smooth' });
      }, { passive: false });
      // The list: scroll to the point where that case study lands on top.
      items.forEach((b) => b.addEventListener('click', () => {
        // the project that's already open goes to its case study; any other one is brought to the top of the deck
        if (b.classList.contains('is-on') && deck[+b.dataset.i]) { deck[+b.dataset.i].click(); return; }
        const i = +b.dataset.i, run = csZone.offsetHeight - stage.offsetHeight;
        const zoneTop = csZone.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: zoneTop + (N > 1 ? i / (N - 1) : 0) * run + 2, behavior: 'smooth' });
      }));
      // On wide screens the list lives in the side menu, under "Work".
      if (csIndex && window.siteRail) window.siteRail.dock(csIndex);
    } else if (csIndex) {
      csIndex.hidden = true;   // reduced motion: the cards show as a plain list, so the side list isn't needed
    }
  }

  // Art Ring — continuously rotating orbit of art cards
  const ringStage = document.getElementById('ring-stage');
  if (ringStage) {
    // Personal photos for the hero arc — kept separate from CREATIVE_ASSETS (which
    // feeds the Archive) so the two change independently. Order is intentional; the
    // arc holds exactly these 15, evenly spaced. Optimized copies live in
    // assets/hero-arc/ (milk-tea, salt-bread, and the four .webp were converted
    // from .HEIC); the full-res originals stay in assets/other pictures/ for re-cropping.
    const ARC_PHOTOS = window.ARC_PHOTOS = [
      { img: 'assets/hero-arc/adobe-symposium.webp',       caption: 'adobe ai symposium, 2025' },
      { img: 'assets/hero-arc/desolation-wilderness.webp', caption: 'desolation wilderness, no signal' },
      { img: 'assets/hero-arc/mdes-cohort.webp',           caption: 'mdes cohort all together' },
      { img: 'assets/hero-arc/elastic-mind.webp',          caption: 'design and the elastic mind' },
      { img: 'assets/hero-arc/materials-library.webp',     caption: 'the materials library @ sjsu' },
      { img: 'assets/hero-arc/mdes-at-adobe.webp',         caption: 'mdes cohort @ adobe' },
      { img: 'assets/hero-arc/mdes-bffs.webp',             caption: 'found my people' },
      { img: 'assets/hero-arc/milk-tea.jpg',              caption: 'the most peak tea ever' },
      { img: 'assets/hero-arc/salt-bread.webp',            caption: 'homemade salt bread!!' },
      { img: 'assets/hero-arc/sjhacks.webp',               caption: 'sjhacks 2026' },
      { img: 'assets/hero-arc/torii-gates.webp',           caption: 'torii gates, japan' },
      { img: 'assets/hero-arc/hotpot.jpg',               caption: 'i love hotpot' },
      { img: 'assets/hero-arc/if-ykyk.jpg',              caption: 'if ykyk' },
      { img: 'assets/hero-arc/baby-suna.webp',            caption: 'my baby suna' },
      { img: 'assets/hero-arc/pokemon-card.jpg',         caption: 'my prized piplup' },
    ];
    const ringItems = ARC_PHOTOS;

    const tooltip   = document.getElementById('ring-tooltip');
    const ttTitle   = document.getElementById('ring-tt-title');
    const ttMeta    = document.getElementById('ring-tt-meta');
    if (ttMeta) ttMeta.style.display = 'none';  // arc shows the caption only — no medium/year line

    // ── Hand-drawn photo frame ────────────────────────────────────────────
    // One wobbly SVG stroke traced around each arc photo, in place of a crisp
    // geometric border — same pen as the hand-drawn avatar (see handFramePath
    // at the top of buildPortfolio). The line weight (1.5) matches the avatar's
    // main contour: ~12–16px in its 2000px source, ×0.1 render scale ≈ 1.5px on
    // screen. Each card seeds its own jitter from its index, so no two frames
    // are identical but they read as one set. The viewBox matches the 64px card
    // 1:1 (stroke-width in units = px on screen); it scales with the card on
    // hover, like a drawn frame growing with the photo.
    function handFrameSVG(seed) {
      // 64px square, inset 2.4, r 11 — sits right at the photo edge.
      const d = handFramePath(seed, 64, 64, 11, 2.4, 0.9, 1.2, 1.1);
      return `<svg class="ring-card-frame" viewBox="0 0 64 64" fill="none" aria-hidden="true">` +
             `<path d="${d}" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    }

    ringItems.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'ring-card';
      // Eager, not lazy: all sit above the fold in the hero, so lazy-loading
      // gives no benefit and would risk blank cards before the arc paints.
      // Photo lives in an inner clip (keeps the square crop + rounded corners);
      // the hand-drawn frame overlays it and is free to wobble past the edge.
      card.innerHTML =
        `<div class="ring-card-photo"><img src="${item.img}" alt="${item.caption}" /></div>` +
        handFrameSVG(i + 1);

      card.addEventListener('mouseenter', () => {
        ringPaused = true;
        ttTitle.textContent = item.caption || '';
        tooltip.classList.add('visible');
      });
      card.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.clientX + 'px';
        tooltip.style.top  = (e.clientY - 6) + 'px';
      });
      card.addEventListener('mouseleave', () => {
        ringPaused = false;
        tooltip.classList.remove('visible');
      });
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        openRingLightbox(item.img, item.caption, '');
      });

      ringStage.appendChild(card);
    });

    const cards = Array.from(ringStage.querySelectorAll('.ring-card'));
    const n = cards.length;
    let theta = 0;
    let ringPaused = false;

    function getRadius() {
      const section = document.getElementById('ring-section');
      if (!section) return 280;
      return Math.max(220, Math.min(section.offsetWidth * 0.49, section.offsetHeight * 0.42, 420));
    }

    // ── Drag to spin ──────────────────────────────────────────
    // Listens on #ring-drag-zone (not #ring-section) — that zone is scoped to
    // start below the case-study cards so dragging never blocks their hover/click.
    const ringDragZone = document.getElementById('ring-drag-zone');
    let dragging = false;
    let coasting = false; // true after release, while momentum is still decaying
    let dragLastX = 0;
    let dragVelocity = 0; // radians/frame, decays after release for a momentum feel

    if (ringDragZone) {
      ringDragZone.style.cursor = 'grab';
      ringDragZone.addEventListener('pointerdown', (e) => {
        dragging = true;
        coasting = false;
        dragLastX = e.clientX;
        dragVelocity = 0;
        ringDragZone.style.cursor = 'grabbing';
        ringDragZone.setPointerCapture?.(e.pointerId);
      });
      ringDragZone.addEventListener('pointermove', (e) => {
        if (!dragging) return;
        const dx = e.clientX - dragLastX;
        dragLastX = e.clientX;
        const delta = dx * 0.004;
        theta += delta;
        // Smooth the velocity estimate so a flick's speed isn't lost to one noisy last-frame delta
        dragVelocity = dragVelocity * 0.7 + delta * 0.3;
      });
      function endDrag() {
        if (!dragging) return;
        dragging = false;
        coasting = true;
        ringDragZone.style.cursor = 'grab';
      }
      ringDragZone.addEventListener('pointerup', endDrag);
      ringDragZone.addEventListener('pointerleave', endDrag);
      ringDragZone.addEventListener('pointercancel', endDrag);
    }

    // ── Center icon: flip through expressions on its own ──────
    // The ring of images is always visible/rotating; the center drawing cycles
    // its expression variants autonomously (no hover) — a hard cut every 1s.
    const ringIconImg = document.querySelector('.ring-photo.ring-icon img');
    if (ringIconImg) {
      const ICONS = [
        'assets/icons/center-icon.webp',           // default / first frame
        'assets/icons/center-icon-wink.webp',
        'assets/icons/center-icon-sleep.webp',
        'assets/icons/center-icon-confused.webp',
      ];
      // Preload the whole set up front so the first swap has no blank frame.
      ICONS.forEach(src => { new Image().src = src; });

      const HOLD_MS = 1000; // instant swap, one second per expression

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      // Expression cycle, pausable so the hover bubble can take the stage.
      let idx = 0, cycleTimer = null;
      function startCycle() {
        if (reduceMotion || cycleTimer) return;
        cycleTimer = setInterval(() => {
          idx = (idx + 1) % ICONS.length;
          ringIconImg.src = ICONS[idx]; // preloaded, so this is a clean cut
        }, HOLD_MS);
      }
      function stopCycle() { clearInterval(cycleTimer); cycleTimer = null; }
      // The boot loader (see index.html) sets __introBootActive while it plays
      // its munch beat. Hold the expression cycle until it hands off ('intro:done')
      // so this starts clean at the first frame — no visible seam. If there's no
      // boot (returning session / reduced motion), start immediately.
      if (window.__introBootActive) {
        document.addEventListener('intro:done', startCycle, { once: true });
      } else {
        startCycle();
      }
      window.addEventListener('pagehide', stopCycle, { once: true });

      // ── Hover speech bubble ──────────────────────────────────
      // Shows a random line on hover (never the same one twice in a row) and
      // pauses the expression cycle so only one thing moves at a time.
      const avatar = ringIconImg.closest('.ring-photo.ring-icon');
      const bubble = avatar && avatar.querySelector('.avatar-bubble');
      const bubbleText = bubble && bubble.querySelector('.avatar-bubble-text');
      const BUBBLE_LINES = [
        'hi, i’m sydney 👋',
        'watching youtube 📺',
        'running a 5k 🏃‍♀️',
        'baking focaccia bread 🍞',
        'trying new cafes ☕',
        'joining hackathons 💻',
      ];
      if (bubble && bubbleText) {
        let lastLine = -1;
        const pickLine = () => {
          if (BUBBLE_LINES.length < 2) return 0;
          let n;
          do { n = Math.floor(Math.random() * BUBBLE_LINES.length); } while (n === lastLine);
          return (lastLine = n);
        };
        avatar.addEventListener('mouseenter', () => {
          bubbleText.textContent = BUBBLE_LINES[pickLine()];
          bubble.classList.add('is-visible');
          stopCycle(); // one thing at a time
        });
        avatar.addEventListener('mouseleave', () => {
          bubble.classList.remove('is-visible');
          startCycle();
        });
      }
    }

    function tick() {
      if (dragging) {
        // momentum applied live while dragging is just the direct delta above
      } else if (ringPaused) {
        // hovering a card — fully frozen so the tooltip stays put
      } else if (coasting) {
        if (Math.abs(dragVelocity) > 0.00005) {
          theta += dragVelocity;
          dragVelocity *= 0.975;
        } else {
          coasting = false;
          dragVelocity = 0;
        }
      } else {
        theta += 0.0008;
      }
      const R = getRadius();
      cards.forEach((card, i) => {
        const a = theta + (2 * Math.PI / n) * i;
        const x = Math.cos(a) * R;
        const y = Math.sin(a) * R;

        card.style.left = x + 'px';
        card.style.top  = y + 'px';

        const rotDeg = (a * 180 / Math.PI + 90).toFixed(2);
        card.style.setProperty('--card-rot', rotDeg + 'deg');

        const raw = -Math.sin(a);
        const opacity = Math.max(0, Math.min(1, raw * 2 + 0.15));
        card.style.opacity = String(opacity.toFixed(3));
        card.style.pointerEvents = opacity > 0.25 ? 'all' : 'none';
        card.style.zIndex = opacity > 0.1 ? String(Math.round(raw * 5 + 50)) : '1';
      });
      requestAnimationFrame(tick);
    }
    tick();
  }
})();

// ── Hero scroll nudge ────────────────────────────────────────
// Fade the ↓ in ~1s AFTER load (it's for someone who's stopped, not a
// greeting). It then tracks scroll position: it holds visible until you've
// scrolled past HIDE_AT, fades out, and fades back in once you return near the
// top. The gap between SHOW_AT and HIDE_AT is a hysteresis band so it doesn't
// flicker while you hover around the threshold.
(function () {
  const el = document.getElementById('scroll-indicator');
  if (!el) return;

  const HIDE_AT = 160; // px scrolled before it fades out — the "hold"
  const SHOW_AT = 40;  // back within this of the top → fade it back in

  let introReady = false; // don't show until the ~1s landing delay has passed
  let shown = false;

  function show() {
    if (shown) return;
    shown = true;
    el.classList.add('is-in');
    el.classList.remove('is-out');
  }
  function hide() {
    if (!shown) return;
    shown = false;
    el.classList.remove('is-in');
    el.classList.add('is-out');
  }

  // Initial landing: reveal ~1s in, but only if they're actually at the top.
  setTimeout(() => {
    introReady = true;
    if (window.scrollY <= SHOW_AT) show();
  }, 1000);

  window.addEventListener('scroll', () => {
    if (!introReady) return;
    const y = window.scrollY;
    if (y > HIDE_AT) hide();
    else if (y <= SHOW_AT) show();
  }, { passive: true });
})();

// ── Ring lightbox ────────────────────────────────────────────
function openRingLightbox(src, title, meta) {
  document.getElementById('ring-lb-img').src   = src;
  document.getElementById('ring-lb-title').textContent = title || '';
  document.getElementById('ring-lb-meta').textContent  = meta  || '';
  document.getElementById('ring-lightbox').classList.add('open');
}

function closeRingLightbox(e) {
  if (!e || e.target !== document.getElementById('ring-lb-img')) {
    document.getElementById('ring-lightbox').classList.remove('open');
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('ring-lightbox')?.classList.remove('open');
  }
});

// ── Experience accordion toggle ──────────────────────────────
function toggleExp(el) {
  el.classList.toggle('exp-open');
}


// ── Minecraft Lightbox ──────────────────────────────────────
function openMcLightbox(src) {
  const lb = document.getElementById('mc-lightbox');
  const img = document.getElementById('mc-lightbox-img');
  if (!lb || !img) return;
  img.src = src;
  lb.classList.add('open');
}

function closeMcLightbox() {
  const lb = document.getElementById('mc-lightbox');
  if (lb) lb.classList.remove('open');
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMcLightbox();
});


// ── Live Calendar ───────────────────────────────────────────
function buildCalendar() {
  const now    = new Date();
  const year   = now.getFullYear();
  const month  = now.getMonth();    // 0-indexed
  const today  = now.getDate();
  const todayDow = now.getDay();    // 0=Sun…6=Sat

  const MONTH_NAMES = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  const DAY_LETTERS = ['S','M','T','W','T','F','S'];

  const firstDow    = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<div class="cal-month">${MONTH_NAMES[month]}</div>`;

  // Header row — bold today's column
  html += '<div class="cal-row cal-header">';
  DAY_LETTERS.forEach((d, i) => {
    html += `<span class="${i === todayDow ? 'cal-bold' : 'cal-dim'}">${d}</span>`;
  });
  html += '</div>';

  // Build flat cell array
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Render rows
  for (let r = 0; r < cells.length; r += 7) {
    html += '<div class="cal-row">';
    for (let c = 0; c < 7; c++) {
      const d = cells[r + c];
      if (d === null) {
        html += '<span class="cal-dim"></span>';
      } else if (d === today) {
        html += `<span class="cal-today">${d}</span>`;
      } else {
        html += `<span class="cal-dim">${d}</span>`;
      }
    }
    html += '</div>';
  }

  const widget = document.getElementById('calendarWidget');
  if (widget) widget.innerHTML = html;
}
buildCalendar();


// ── CD PLAYER ────────────────────────────────────────────────
const CDP_TRACKS = [
  { num:'01', title:'悲しい夢',     artist:'tavc city pop',       src:'assets/music/tavc city pop - 悲しい夢.mp3',      art:'assets/music/song 5 cover.webp', color:'#302010' },
  { num:'02', title:'glitch',      artist:'alex morgan',        src:'assets/music/alex morgan - glitch.mp3',          art:'assets/music/song 1 cover.webp', color:'#2e4d36' },
  { num:'03', title:'backyard',    artist:'lofium',              src:'assets/music/lofium - backyard.mp3',             art:'assets/music/song 2 cover.webp', color:'#1e3050' },
  { num:'04', title:'city tour',   artist:'salaidawtsang11',     src:'assets/music/salaidawtsang11 - city tour.mp3',   art:'assets/music/song 3 cover.webp', color:'#4a1e30' },
  { num:'05', title:'jazzy love',  artist:'sonican',             src:'assets/music/sonican - jazzy love.mp3',          art:'assets/music/song 4 cover.webp', color:'#2a3a18' },
];

const bgAudio = new Audio(CDP_TRACKS[0].src);
bgAudio.loop = false;
let musicPlaying = false;
let cdpCurrentTrack = 0;

function fmt(s) {
  if (!isFinite(s)) return '0:00';
  const m = Math.floor(s/60), sec = Math.floor(s%60);
  return `${m}:${sec.toString().padStart(2,'0')}`;
}

bgAudio.addEventListener('timeupdate', () => {
  const cur = bgAudio.currentTime, dur = bgAudio.duration || 0;
  const timeCur = document.getElementById('cdp-time-cur');
  const timeTotal = document.getElementById('cdp-time-total');
  const fill = document.getElementById('cdp-progress-fill');
  if (timeCur) timeCur.textContent = fmt(cur);
  if (timeTotal) timeTotal.textContent = fmt(dur);
  if (fill && dur > 0) fill.style.width = `${(cur / dur) * 100}%`;
});

bgAudio.addEventListener('ended', () => {
  musicPlaying = false;
  const btn = document.getElementById('cdp-play-btn');
  if (btn) btn.innerHTML = '<svg class="cdp-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
  document.getElementById('cdp-disc')?.classList.remove('spinning');
  document.getElementById('cdp-waveform')?.classList.remove('playing');
  document.getElementById('cdp-tonearm')?.classList.remove('playing');
  const fill = document.getElementById('cdp-progress-fill');
  if (fill) fill.style.width = '0%';
});

function cdpSelectTrack(i) {
  cdpCurrentTrack = i;
  const t = CDP_TRACKS[i];
  // Update track dots
  document.querySelectorAll('.cdp-td').forEach((el, idx) => el.classList.toggle('active', idx === i));
  // Update disc art
  const art = document.getElementById('cdp-disc-art');
  const col = document.getElementById('cdp-disc-color');
  if (t.art) {
    art.src = t.art;
    art.style.display = 'block';
  } else {
    art.style.display = 'none';
  }
  if (col) col.style.background = t.color;
  // Update info
  document.getElementById('cdp-track-name').textContent  = t.title;
  document.getElementById('cdp-track-artist').textContent = t.artist;
  // Reset progress
  const fill2 = document.getElementById('cdp-progress-fill');
  const timeCur2 = document.getElementById('cdp-time-cur');
  if (fill2) fill2.style.width = '0%';
  if (timeCur2) timeCur2.textContent = '0:00';
  // Swap audio
  const wasPlaying = musicPlaying;
  bgAudio.pause();
  musicPlaying = false;
  document.getElementById('cdp-disc')?.classList.remove('spinning');
  document.getElementById('cdp-waveform')?.classList.remove('playing');
  document.getElementById('cdp-tonearm')?.classList.remove('playing');
  document.getElementById('cdp-play-btn').textContent = '▶';
  if (t.src) {
    bgAudio.src = t.src;
    bgAudio.load();
    if (wasPlaying) cdpTogglePlay();
  } else {
    bgAudio.src = '';
  }
}

function cdpTogglePlay() {
  const t = CDP_TRACKS[cdpCurrentTrack];
  if (!t.src) return; // no audio for this slot
  musicPlaying = !musicPlaying;
  const btn  = document.getElementById('cdp-play-btn');
  const disc = document.getElementById('cdp-disc');
  const waveform = document.getElementById('cdp-waveform');
  const tonearm = document.getElementById('cdp-tonearm');
  if (musicPlaying) {
    bgAudio.play().catch(() => { musicPlaying = false; disc?.classList.remove('spinning'); waveform?.classList.remove('playing'); tonearm?.classList.remove('playing'); window.railNpSync?.(); });
    if (btn) btn.innerHTML = '<svg class="cdp-icon-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    disc?.classList.add('spinning');
    waveform?.classList.add('playing');
    tonearm?.classList.add('playing');
  } else {
    bgAudio.pause();
    if (btn) btn.innerHTML = '<svg class="cdp-icon-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    disc?.classList.remove('spinning');
    waveform?.classList.remove('playing');
    tonearm?.classList.remove('playing');
  }
}

function cdpNext() {
  cdpSelectTrack((cdpCurrentTrack + 1) % CDP_TRACKS.length);
}
function cdpPrev() {
  cdpSelectTrack((cdpCurrentTrack - 1 + CDP_TRACKS.length) % CDP_TRACKS.length);
}
// Keep old name as alias so any leftover references don't break
function toggleMusicPlayer() { cdpTogglePlay(); }


// ── Draggable — positions saved to localStorage automatically ─
const LAYOUT_KEY = 'sydney_desktop_layout';
const LAYOUT_VERSION = '16'; // bump to push new default positions to all visitors

// ── Two-widget layout — canyon photo + music player side by side ──
// dc-left is 500px wide. Both widgets are 182px wide.
// Left:  frosted (canyon)  x=16,  y=16  → 182×246 → bottom 262
// Right: miniplay          x=214, y=32  (slightly lower for visual rhythm)
const DEFAULT_LAYOUT = {
  "frosted":  { "left": "16px",  "top": "16px" },
  "miniplay": { "left": "214px", "top": "32px" },
};


// Press Ctrl+Shift+L to copy layout JSON to clipboard
document.addEventListener('keydown', e => {
  if (e.ctrlKey && e.shiftKey && e.key === 'L') {
    const data = localStorage.getItem(LAYOUT_KEY) || '{}';
    navigator.clipboard.writeText(data).then(() => alert('Layout copied! Paste it in the chat.'));
  }
});

function saveLayout(id, left, top) {
  try {
    const layout = JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
    // Save top as px, left as column-relative px (already relative since drag
    // uses getBoundingClientRect then sets left within the column's context)
    layout[id] = { left, top };
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
  } catch(e) {}
}

function loadLayout() {
  try {
    return JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}');
  } catch(e) { return {}; }
}

// On page load, apply default positions — resets on every refresh.
(function restoreLayout() {
  document.querySelectorAll('[data-layout-id]').forEach(el => {
    const id = el.dataset.layoutId;
    if (!id || !DEFAULT_LAYOUT[id]) return;
    const { left, top } = DEFAULT_LAYOUT[id];
    if (left) {
      el.style.left  = left;
      el.style.right = 'auto';
    }
    if (top) el.style.top = top;
  });
})();

function makeDraggable(el) {
  let startX, startY, startLeft, startTop, isDragging = false;
  const id = el.dataset.layoutId;

  el.addEventListener('mousedown', e => {
    if (['BUTTON','A','INPUT'].includes(e.target.tagName) && e.target !== el) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = el.getBoundingClientRect();
    // Subtract the column's offset so left/top are column-relative, not viewport-relative
    const col = el.closest('.dc-left, .dc-middle, .dc-right');
    const colRect = col ? col.getBoundingClientRect() : { left: 0, top: 0 };
    startLeft = rect.left - colRect.left;
    startTop  = rect.top  - colRect.top;
    el.style.left  = startLeft + 'px';
    el.style.right = 'auto';
    el.style.top   = startTop  + 'px';
    el.classList.add('dragging');
    e.preventDefault();
  });

  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    el.style.left = `${startLeft + dx}px`;
    el.style.top  = `${startTop  + dy}px`;
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    el.classList.remove('dragging');
    if (id) saveLayout(id, el.style.left, el.style.top);
  });
}

document.querySelectorAll('.draggable').forEach(makeDraggable);


// ── Sticker Sheet ────────────────────────────────────────────
// Individual sticker files — mapped to grid positions on the sheet
// Sheet is 5 cols × 4 rows; stickers read left→right, top→bottom
const STICKER_MAP = [
  // row 0
  'cat standing.webp',
  'yellow music note.webp',
  'blue guy.webp',
  'cat wave.webp',
  'purple heart.webp',
  // row 1
  'pink start.webp',
  'cat question.webp',
  'cat thinking.webp',
  'cat in box.webp',
  'pink guy.webp',
  // row 2
  'speech bubble.webp',
  'green guy.webp',
  'cat search.webp',
  'orange guy.webp',
  'green music note.webp',
  // row 3 (4 stickers)
  'cat sitting.webp',
  'cat pencil.webp',
  'orange sparkle.webp',
  'wide aqua guy.webp',
];

const SHEET_COLS = 5, SHEET_ROWS = 4;
let stickerWindowOpen = false;

function toggleStickerWindow() {
  const overlay  = document.getElementById('sticker-overlay');
  const backdrop = document.getElementById('backdrop');
  stickerWindowOpen = !stickerWindowOpen;
  if (stickerWindowOpen) {
    buildStickerGrid();
    overlay.classList.add('open');
    if (backdrop) { backdrop.classList.add('active'); backdrop.onclick = toggleStickerWindow; }
  } else {
    overlay.classList.remove('open');
    if (backdrop) backdrop.classList.remove('active');
  }
}

function buildStickerGrid() {
  const grid = document.getElementById('sticker-grid');
  if (!grid || grid.children.length) return; // only build once
  STICKER_MAP.forEach(file => {
    const cell = document.createElement('div');
    cell.className = 'sticker-thumb';
    cell.title = file.replace('.png','');
    const img = document.createElement('img');
    img.src = 'assets/stickers/' + file;
    img.alt = file;
    cell.appendChild(img);
    cell.addEventListener('click', () => {
      // stickers land somewhere in the visible part of the hero, clear of the side menu
      const hero = document.getElementById('home'), nav = document.getElementById('site-nav');
      const minX = document.documentElement.classList.contains('has-rail') && nav ? nav.getBoundingClientRect().right + 20 : 60;
      const maxY = hero ? Math.min(innerHeight, hero.getBoundingClientRect().bottom) : innerHeight;
      const px = minX + Math.random() * Math.max(40, innerWidth - minX - 180);
      const py = 80 + Math.random() * Math.max(40, maxY - 240);
      placeSticker(file, px, py);
      // tiny pop on the thumbnail
      cell.style.transform = 'scale(0.88)';
      setTimeout(() => cell.style.transform = '', 150);
    });
    grid.appendChild(cell);
  });
}

// Stickers live in the hero only: they're placed inside it (so they scroll away with it and never sit on the case
// studies), and can't be dragged under the side menu, where they'd be stuck. x, y are screen coordinates.
function placeSticker(file, x, y) {
  const host = document.getElementById('home') || document.body;
  const inHero = host !== document.body;
  const el = document.createElement('div');
  el.className = 'desktop-sticker-placed' + (inHero ? ' in-hero' : '');
  const bounds = () => {
    const r = host.getBoundingClientRect(), nav = document.getElementById('site-nav');
    const railRight = document.documentElement.classList.contains('has-rail') && nav ? nav.getBoundingClientRect().right : 0;
    return { r, minX: Math.max(0, railRight - r.left), maxX: host.clientWidth - 76, maxY: host.clientHeight - 80 };
  };
  const put = (cx, cy) => {        // cx, cy: screen coordinates of the sticker's top left
    if (!inHero) { el.style.left = Math.round(cx) + 'px'; el.style.top = Math.round(cy) + 'px'; return; }
    const b = bounds();
    el.style.left = Math.round(Math.min(Math.max(cx - b.r.left, b.minX), b.maxX)) + 'px';
    el.style.top  = Math.round(Math.min(Math.max(cy - b.r.top, 0), b.maxY)) + 'px';
  };
  put(x, y);

  const sImg = document.createElement('img');
  sImg.src = 'assets/stickers/' + file;
  sImg.draggable = false;
  el.appendChild(sImg);

  el.addEventListener('dblclick', () => el.remove());

  let dx=0, dy=0, dragging=false;
  el.addEventListener('mousedown', ev => {
    if (ev.button !== 0) return;
    dragging = true;
    const er = el.getBoundingClientRect();
    dx = ev.clientX - er.left;
    dy = ev.clientY - er.top;
    el.classList.add('dragging');
    ev.preventDefault();
    ev.stopPropagation();          // don't spin the photo ring underneath
  });
  document.addEventListener('mousemove', ev => {
    if (!dragging) return;
    put(ev.clientX - dx, ev.clientY - dy);
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; el.classList.remove('dragging'); }
  });

  host.appendChild(el);

  el.style.transform = 'scale(0) rotate(-12deg)';
  el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = ''; el.style.transition = ''; }));
}

// The sticker button only shows while the hero is on screen; past it the sheet closes.
(function stickerHeroOnly() {
  const hero = document.getElementById('home');
  if (!hero || !document.getElementById('sticker-peeker')) return;
  const check = () => {
    const past = hero.getBoundingClientRect().bottom < innerHeight * 0.35;
    document.documentElement.classList.toggle('past-hero', past);
    if (past && stickerWindowOpen) toggleStickerWindow();
  };
  addEventListener('scroll', check, { passive: true });
  check();
})();


// ── Custom Cursor ────────────────────────────────────────────
(function() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
    // Inside #home the photo trail takes over (unless reduced-motion disabled
    // it, in which case __heroTrailActive is unset and the dot/ring stay live).
    if (window.__heroTrailActive && e.target.closest('#home')) return;
    dot.style.left  = e.clientX + 'px';
    dot.style.top   = e.clientY + 'px';
    // Ring follows with slight lag via requestAnimationFrame
    ringX += (e.clientX - ringX) * 0.18;
    ringY += (e.clientY - ringY) * 0.18;
    ring.style.left = e.clientX + 'px';
    ring.style.top  = e.clientY + 'px';
  });

  // Expand ring on hover over interactive elements
  const HOVER_SEL = 'a, button, .dock-icon, [onclick], .draggable, .cr-tab, .cs-file, .sticker-thumb, #sticker-peeker, .desktop-icon';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(HOVER_SEL)) document.body.classList.add('cursor-hover');
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(HOVER_SEL)) document.body.classList.remove('cursor-hover');
  });

  // Over a case study cover the dot becomes a "View case study" label, so it's clear the cover opens the case study.
  const view = document.createElement('div');
  view.className = 'cursor-view'; view.setAttribute('aria-hidden', 'true');
  view.innerHTML = '<span class="cv-in">View case study <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 9l6-6M4.5 3H9v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
  document.body.appendChild(view);
  const VIEW_SEL = '.cs-zone.is-list .cs-card, .cs-card.is-top';
  const viewIn = view.querySelector('.cv-in');
  const caseLabel = viewIn.innerHTML;
  // The label is a hand-drawn bubble with a small arrow from its corner back to the cursor, like the nav's
  // hover clouds. It's redrawn only when the text (and so the size) changes.
  const CV_ARROW = 'M12 3 C6 -2 0 -5 -7 -8 M-7 -8 L1 -9.5 M-7 -8 L-2 -1.5';
  const drawView = () => {
    let seed = 7; for (const ch of viewIn.textContent) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    drawWobbly(view, 'cv-ink', view.classList.contains('is-piece') ? 12 : 18, seed % 9973, CV_ARROW);
  };
  const setView = (html) => { viewIn.innerHTML = html; drawView(); };
  drawView();
  if (document.fonts) document.fonts.ready.then(drawView);
  const arrow = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 9l6-6M4.5 3H9v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const escText = (t) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  let shown = caseLabel, pending = caseLabel, swapT = 0, lastPiece = null;
  // Over a playground piece the same pill shows the piece's name and medium instead.
  document.addEventListener('mousemove', e => {
    view.style.left = e.clientX + 'px'; view.style.top = e.clientY + 'px';
    const t = e.target.closest ? e.target : null;
    const pg = t && t.closest('.pg-tile');
    const html = pg
      ? '<b>' + escText(pg.dataset.title) + (pg.classList.contains('is-link') ? arrow : '') + '</b>' + (pg.dataset.medium ? '<span class="cv-m">' + escText(pg.dataset.medium) + '</span>' : '')
      : caseLabel;
    // Moving straight from one piece to another: the box shrinks into the cursor, swaps its text, then grows
    // back out, so the change is easy to see.
    if (html !== shown || swapT) {
      pending = html;
      if (pg && lastPiece && lastPiece !== pg && view.classList.contains('is-piece') && document.body.classList.contains('cursor-view-on')) {
        if (!swapT) {
          view.classList.add('is-swap');
          swapT = setTimeout(() => { swapT = 0; shown = pending; view.classList.remove('is-swap'); setView(shown); }, 170);
        }
      } else if (!swapT) { shown = html; view.classList.toggle('is-piece', !!pg); setView(html); }
    }
    if (pg) lastPiece = pg; else if (!swapT) lastPiece = null;
    view.classList.toggle('is-piece', !!pg || !!swapT);
    document.body.classList.toggle('cursor-view-on', !!(t && (pg || t.closest(VIEW_SEL))));
  });
  document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-view-on'));

  // Click flash
  document.addEventListener('mousedown', () => document.body.classList.add('cursor-click'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-click'));
})();


// ── Cursor Sparkle ───────────────────────────────────────────
(function() {
  const COLORS  = ['#f5afbc','#80d5cf','#ffd166','#c3b1e1','#ff8c69','#87ceeb','#b8f0b8','#ffb347','#a8d8ea','#f6c6ea'];
  const SHAPES  = ['✦','✧','★','◆','✿','⬥','✺','⟡','✵','❋'];

  // Subtle hand-drawn edge: displace each filled glyph over fractal noise so its
  // outline wobbles like the arc frames — an imperfect edge on the same solid
  // shape (fill/colour/size untouched), not a re-drawn object. Injected once so
  // it's available to `.cursor-sparkle` on every page that loads this script.
  if (!document.getElementById('sparkle-wobble')) {
    const holder = document.createElement('div');
    holder.setAttribute('aria-hidden', 'true');
    holder.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
    holder.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<filter id="sparkle-wobble" x="-40%" y="-40%" width="180%" height="180%">' +
          '<feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="1" seed="4" result="n"/>' +
          '<feDisplacementMap in="SourceGraphic" in2="n" scale="2" xChannelSelector="R" yChannelSelector="G"/>' +
        '</filter>' +
      '</svg>';
    (document.body || document.documentElement).appendChild(holder);
  }

  let lastTime = 0;

  document.addEventListener('mousemove', e => {
    // Suppress sparkles inside #home while the photo trail is active.
    if (window.__heroTrailActive && e.target.closest('#home')) return;
    const now = Date.now();
    if (now - lastTime < 30) return; // max ~33 sparkles/sec
    lastTime = now;
    if (Math.random() > 0.55) return; // ~45% spawn rate

    const el = document.createElement('span');
    el.className = 'cursor-sparkle';
    el.textContent = SHAPES[Math.floor(Math.random() * SHAPES.length)];

    const tx = (Math.random() - 0.5) * 36;
    const ty = -(Math.random() * 28 + 10);
    const size = Math.random() * 14 + 9;
    const dur  = Math.random() * 300 + 500;

    el.style.cssText = `
      left:${e.clientX}px;
      top:${e.clientY}px;
      color:${COLORS[Math.floor(Math.random() * COLORS.length)]};
      font-size:${size}px;
      --tx:${tx}px;
      --ty:${ty}px;
      animation-duration:${dur}ms;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove(), { once: true });
  });
})();


// ── Hero Cursor Trail ────────────────────────────────────────
// Inside #home only, moving the mouse leaves a trail of small raw photos.
// It replaces the dot/ring + sparkle in the hero: when this trail is active
// (window.__heroTrailActive), those two IIFEs early-return over #home. Under
// prefers-reduced-motion the trail is disabled and never sets that flag, so
// the normal dot/ring + sparkle keep working in the hero too.
(function() {
  const hero = document.getElementById('home');
  if (!hero) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Filenames must match assets/cursor-trail/ exactly (GitHub Pages is
  // case-sensitive). 24 photos; the reference screenshot + clover-spiral are
  // intentionally not in the pool.
  const POOL = [
    'apple-stars.jpg', 'flower-stars.jpg', 'clover.jpg', 'swirl-pastel.jpg',
    'rain-dots-blue.jpg', 'confetti-street.jpg', 'kiwi-stars.jpg', 'pixel-ghost.jpg',
    'red-dots.jpg', 'diagonal-landscape.jpg', 'water-beads.jpg', 'star-spiral.jpg',
    'meadow-bokeh.jpg', 'dot-collage.jpg', 'garden-cutout.jpg', 'gummy-bears.jpg',
    'sparkle-grass.jpg', 'dance-figures.jpg', 'sheet-music-bokeh.jpg', 'ocean-sparkle.jpg',
    'soda-bottles.jpg', 'file-icons-sky.jpg', 'moss-pixel.jpg', 'orchid-pastel.jpg',
  ];
  const BASE = 'assets/cursor-trail/';
  const MOVE_THRESHOLD = 42;   // px the pointer must travel before another spawn
  const MAX_TRAILS = 22;       // hard cap on concurrent trail photos
  let lastX = null, lastY = null, lastIdx = -1, count = 0;

  // Signal the dot/ring + sparkle IIFEs to stand down over #home.
  window.__heroTrailActive = true;

  hero.addEventListener('mousemove', (e) => {
    if (lastX !== null) {
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (dx * dx + dy * dy < MOVE_THRESHOLD * MOVE_THRESHOLD) return;
    }
    lastX = e.clientX; lastY = e.clientY;
    if (count >= MAX_TRAILS) return;   // skip (don't queue) past the cap

    // random photo, never the immediately previous one
    let idx = Math.floor(Math.random() * POOL.length);
    if (POOL.length > 1 && idx === lastIdx) idx = (idx + 1) % POOL.length;
    lastIdx = idx;

    const size = Math.random() * 16 + 30;      // 30–46px
    const rot  = (Math.random() - 0.5) * 24;   // ±12deg
    const jx   = (Math.random() - 0.5) * 10;   // ±5px position jitter
    const jy   = (Math.random() - 0.5) * 10;

    const img = document.createElement('img');
    img.className = 'hero-cursor-trail';
    img.src = BASE + POOL[idx];
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.style.left  = (e.clientX + jx) + 'px';
    img.style.top   = (e.clientY + jy) + 'px';
    img.style.width = size + 'px';
    img.style.setProperty('--rot', rot + 'deg');

    document.body.appendChild(img);
    count++;
    img.addEventListener('animationend', () => { img.remove(); count--; }, { once: true });
  });
})();


// ── Bounce Animations ────────────────────────────────────────
function triggerBounce(el, cls = 'bounce-active') {
  el.classList.remove(cls);
  void el.offsetWidth; // reflow to restart animation
  el.classList.add(cls);
  el.addEventListener('animationend', () => el.classList.remove(cls), { once: true });
}

// Dock icons bounce on click
document.querySelectorAll('.dock-icon').forEach(el => {
  el.addEventListener('click', () => triggerBounce(el, 'bounce-active'));
});

// Make overlay windows draggable by their chrome
document.querySelectorAll('.overlay-window').forEach(win => {
  const chrome = win.querySelector('.window-chrome, .cr-chrome');
  if (!chrome) return;
  let isDragging = false, startX, startY, startMarginL, startMarginT;
  chrome.style.cursor = 'grab';
  chrome.addEventListener('mousedown', e => {
    if (e.target.closest('.traffic-lights-wrap')) return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startMarginL = parseFloat(win.style.marginLeft) || 0;
    startMarginT = parseFloat(win.style.marginTop)  || 0;
    chrome.style.cursor = 'grabbing';
    e.preventDefault();
  });
  document.addEventListener('mousemove', e => {
    if (!isDragging) return;
    win.style.marginLeft = `${startMarginL + (e.clientX - startX)}px`;
    win.style.marginTop  = `${startMarginT + (e.clientY - startY)}px`;
  });
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      chrome.style.cursor = 'grab';
    }
  });
});

// ── Mobile helpers ───────────────────────────────────────────
function mobToggle(bodyId, chevId) {
  const body = document.getElementById(bodyId);
  const chev = document.getElementById(chevId);
  if (!body) return;
  body.classList.toggle('open');
  if (chev) chev.classList.toggle('open');
}

function mobDrawerOpen() {
  document.getElementById('mob-drawer')?.classList.add('open');
  document.getElementById('mob-drawer-backdrop')?.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function mobDrawerClose() {
  document.getElementById('mob-drawer')?.classList.remove('open');
  document.getElementById('mob-drawer-backdrop')?.classList.remove('open');
  document.body.style.overflow = '';
}

(function initMobGallery() {
  const el = document.getElementById('mob-gallery');
  if (!el) return;

  const gdItems = (CREATIVE_ASSETS.graphic.rows || []).flat().filter(r => r.img);
  const artItems = (CREATIVE_ASSETS.artwork.rows || []).flat().filter(r => r.img && !r.empty);
  const photoItems = [
    ...(CREATIVE_ASSETS.photo.rows1 || []),
    ...(CREATIVE_ASSETS.photo.rows2 || []),
  ].map(({ src, year }) => ({
    img: src,
    title: src.split('/').pop().replace(/\.[^.]+$/, '').replace(/^ph-/, '').replace(/-/g, ' ')
  }));

  const all = [];
  const max = Math.max(gdItems.length, artItems.length, photoItems.length);
  for (let i = 0; i < max; i++) {
    if (gdItems[i]) all.push(gdItems[i]);
    if (photoItems[i]) all.push(photoItems[i]);
    if (artItems[i]) all.push(artItems[i]);
  }

  all.slice(0, 18).forEach(item => {
    const div = document.createElement('div');
    div.className = 'mob-gallery-item';
    const label = (item.title || '').replace(/\b\w/g, c => c.toUpperCase());
    div.innerHTML = `<img src="${item.img}" alt="${label}" loading="lazy" /><div class="mob-gallery-label">${label}</div>`;
    el.appendChild(div);
  });
})();


// ── Scroll-triggered reveal ──────────────────────────────────
// Watches any [data-reveal] element; when it scrolls into view, adds
// .is-visible (CSS handles the fade + rise) then stops watching it so it
// never re-animates. Honors [data-reveal-delay] (seconds) for staggered
// cascades, and respects prefers-reduced-motion by showing everything at once.
(function initReveal() {
  const els = document.querySelectorAll('[data-reveal]');
  if (!els.length) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = el.getAttribute('data-reveal-delay');
      if (delay) el.style.transitionDelay = `${delay}s`;
      el.classList.add('is-visible');
      obs.unobserve(el); // reveal once, never again
    });
  }, { rootMargin: '0px 0px -100px 0px', threshold: 0 });

  els.forEach(el => observer.observe(el));
})();


// ── Music player popup — launched from #music-peeker, dismissible ────────
// #cdplayer is hidden by default (see style.css); this only toggles its
// `.open` class. The play/pause + track controls inside are untouched.
// Works with mouse and touch (onclick fires on tap; dismiss uses pointerdown).
function toggleMusicPopup(e) {
  if (e) e.stopPropagation();
  const player = document.getElementById('cdplayer');
  if (!player) return;
  const opening = !player.classList.contains('open');
  player.classList.toggle('open', opening);
  document.getElementById('music-peeker')
    ?.setAttribute('aria-expanded', opening ? 'true' : 'false');
}

function closeMusicPopup() {
  const player = document.getElementById('cdplayer');
  if (!player || !player.classList.contains('open')) return;
  player.classList.remove('open');
  document.getElementById('music-peeker')?.setAttribute('aria-expanded', 'false');
}

// Dismiss on outside tap/click (pointerdown covers mouse + touch); ignore taps
// on the player itself or its launcher button. Escape also closes it.
document.addEventListener('pointerdown', (e) => {
  const player = document.getElementById('cdplayer');
  if (!player || !player.classList.contains('open')) return;
  if (e.target.closest('#cdplayer') || e.target.closest('#music-peeker') || e.target.closest('.rx-np-art')) return;
  closeMusicPopup();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeMusicPopup();
});

// ── Cross-page persistence — save playback so it resumes on other pages.
// Shares the 'sydney_music_v1' schema with music-player.js (the shared module
// on non-homepage pages). Additive: does not change the player's own logic.
// Robustness mirrors music-player.js: pause-on-leave + bfcache resync +
// ownership guard so stale/cached page instances can't clobber the live one.
const MUSIC_STORE_KEY = 'sydney_music_v1';
const MUSIC_SESSION = Math.random().toString(36).slice(2);
let _musicLeaving = false;
let _musicRestoring = false;
let _lastMusicSave = 0;
function readMusicState() {
  try { return JSON.parse(localStorage.getItem(MUSIC_STORE_KEY)); } catch (e) { return null; }
}
function saveMusicState() {
  if (_musicRestoring) return; // suppress transient saves while seeking to restored spot
  // Only the visible page may write; backgrounded/bfcached instances stay out
  // (the _musicLeaving exception allows the pagehide handoff save). See
  // music-player.js for the full rationale.
  if (document.visibilityState !== 'visible' && !_musicLeaving) return;
  const playing = !bgAudio.paused;
  const prev = readMusicState();
  // Ownership: only the actively-playing page writes; another page owns while
  // its heartbeat stays fresh (<1.5s). See music-player.js for the rationale.
  const mayWrite = !prev || !prev.owner || prev.owner === MUSIC_SESSION ||
                   !prev.playing || (Date.now() - prev.ts) > 1500;
  if (!mayWrite) return;
  try {
    localStorage.setItem(MUSIC_STORE_KEY, JSON.stringify({
      track: cdpCurrentTrack, time: bgAudio.currentTime || 0, playing: playing,
      vol: bgAudio.volume, ts: Date.now(),
      owner: playing ? MUSIC_SESSION : (prev ? prev.owner : MUSIC_SESSION)
    }));
  } catch (e) {}
}
bgAudio.addEventListener('play', saveMusicState);
bgAudio.addEventListener('pause', () => { if (!_musicLeaving) saveMusicState(); });
bgAudio.addEventListener('ended', saveMusicState);
bgAudio.addEventListener('volumechange', saveMusicState);
bgAudio.addEventListener('timeupdate', () => {
  const now = Date.now();
  if (now - _lastMusicSave > 1000) { _lastMusicSave = now; saveMusicState(); }
});
window.addEventListener('pagehide', () => { _musicLeaving = true; if (!bgAudio.paused) saveMusicState(); bgAudio.pause(); });
window.addEventListener('pageshow', (e) => { if (e.persisted) { _musicLeaving = false; applyMusicState(readMusicState()); } });

function applyMusicState(saved) {
  if (!saved || typeof saved.track !== 'number' || !CDP_TRACKS[saved.track]) return;
  _musicRestoring = true;
  cdpSelectTrack(saved.track);
  if (typeof saved.vol === 'number') {
    bgAudio.volume = saved.vol;
    const vol = document.querySelector('.cdp-vol-slider');
    if (vol) vol.value = saved.vol;
  }
  const seekTo = saved.time || 0;
  const startResume = () => {
    if (!saved.playing) return;
    const tryResume = () => { if (bgAudio.paused) { musicPlaying = false; cdpTogglePlay(); } };
    tryResume(); // often allowed after the user has already played media here
    const onGesture = (e) => {          // otherwise resume on first interaction
      // a press on a play button already toggles playback itself, so resuming here would start and then stop it
      if (e.target?.closest?.('#cdp-play-btn, .rx-np-play')) { document.removeEventListener('pointerdown', onGesture); document.removeEventListener('keydown', onGesture); return; }
      tryResume();
      if (!bgAudio.paused) {
        document.removeEventListener('pointerdown', onGesture);
        document.removeEventListener('keydown', onGesture);
      }
    };
    document.addEventListener('pointerdown', onGesture);
    document.addEventListener('keydown', onGesture);
  };
  const seek = () => { try { bgAudio.currentTime = seekTo; } catch (e) {} _musicRestoring = false; startResume(); };
  if (bgAudio.readyState >= 1) seek();
  else bgAudio.addEventListener('loadedmetadata', seek, { once: true });
}

(function () {
  const run = () => applyMusicState(readMusicState());
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run);
  else run();
})();


// ── Marketing bento — open a card's write-up as a modal ───────────────────
// The panel is a portal: it lives in #mkw-panels (out of the grid) and is
// moved into the body-level .mkw-modal on open, so the grid never reserves
// space or shifts. One modal at a time; scrim + dialog animate in/out; the
// body is scroll-locked (scrollbar compensated) and focus is trapped, then
// returned to the triggering card on close.
(function initMktgModal() {
  const overlay = document.getElementById('mkw-modal-overlay');
  const store = document.getElementById('mkw-panels');
  if (!overlay || !store) return;

  const modal = overlay.querySelector('.mkw-modal');
  const scroll = overlay.querySelector('.mkw-modal-scroll');
  const closeBtn = overlay.querySelector('.mkw-modal-close');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

  let currentPanel = null; // the .mkw-panel currently portaled into the modal
  let lastTrigger = null;  // element to restore focus to on close
  let openKey = null;
  let animating = false;

  function keyFromTrigger(t) {
    if (t.hasAttribute('data-mkw-open')) return t.getAttribute('data-mkw-open');
    const card = t.closest('.mkw');
    return card && card.id.startsWith('mkw-') ? card.id.slice(4) : null;
  }

  function lockScroll() {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--mkw-sbw', sbw + 'px');
    document.documentElement.classList.add('mkw-modal-lock');
  }
  function unlockScroll() {
    document.documentElement.classList.remove('mkw-modal-lock');
    document.documentElement.style.removeProperty('--mkw-sbw');
  }

  function open(key, trigger) {
    const panel = document.getElementById('panel-' + key);
    if (!panel || openKey === key || animating) return; // no panel yet → no-op
    if (currentPanel) store.appendChild(currentPanel); // enforce one at a time
    scroll.appendChild(panel);
    scroll.scrollTop = 0;
    currentPanel = panel;
    openKey = key;
    lastTrigger = trigger || null;

    const name = panel.querySelector('.mkw-panel-name');
    modal.setAttribute('aria-label', name ? name.textContent.trim() : 'Details');

    lockScroll();
    overlay.hidden = false;
    // paint the closed state, then transition to open on the next frame
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('is-open')));
    modal.focus();
    document.addEventListener('keydown', onKeydown, true);
  }

  function close() {
    if (openKey === null || animating) return;
    const trigger = lastTrigger;
    animating = true;
    overlay.classList.remove('is-open');

    const finish = () => {
      if (!animating) return;
      animating = false;
      overlay.hidden = true;
      if (currentPanel) { store.appendChild(currentPanel); currentPanel = null; }
      openKey = null;
      unlockScroll();
      document.removeEventListener('keydown', onKeydown, true);
      if (trigger && trigger.focus) trigger.focus();
      lastTrigger = null;
    };

    if (reduce) { finish(); return; }
    let done = false;
    const onEnd = (e) => {
      if (e.target !== modal || done) return;
      done = true;
      modal.removeEventListener('transitionend', onEnd);
      finish();
    };
    modal.addEventListener('transitionend', onEnd);
    setTimeout(() => { if (!done) { done = true; modal.removeEventListener('transitionend', onEnd); finish(); } }, 400);
  }

  function onKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); close(); return; }
    if (e.key === 'Tab') trapTab(e);
  }

  function trapTab(e) {
    const items = [...modal.querySelectorAll(FOCUSABLE)].filter(el => el.offsetParent !== null);
    if (!items.length) { e.preventDefault(); modal.focus(); return; }
    const first = items[0], last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === modal)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
  }

  // ── Triggers (delegated on the document) ──
  // Delegated globally so it works for the archive Branding & Marketing prints
  // (built by initArchive) as well as any other [data-mkw-open] trigger.
  document.addEventListener('click', e => {
    const trigger = e.target.closest('.mkw-summary, [data-mkw-open]');
    if (!trigger) return;
    const key = keyFromTrigger(trigger);
    if (key) open(key, trigger);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const trigger = e.target.closest('.mkw-summary, [data-mkw-open]');
    if (!trigger) return;
    e.preventDefault();
    const key = keyFromTrigger(trigger);
    if (key) open(key, trigger);
  });

  // ── Close: × button and backdrop (anything outside the dialog box) ──
  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', e => {
    if (!e.target.closest('.mkw-modal')) close();
  });
})();


// ── "playground" — a photo feed (#playground) ────────────────
// Everything Sydney has made outside the case studies, in one masonry feed: projects (playing their
// recordings), design work and photos. Hovering a piece shows its name and medium. Projects open their
// live link; everything else opens larger in the ring lightbox.
// `ar` is each piece's height / width, so the columns can be balanced before anything loads.
(function initFeed() {
  const root = document.getElementById('playground');
  const feed = root && root.querySelector('[data-feed]');
  if (!feed) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const P = 'assets/stacks/photo-video/', A = 'assets/stacks/art/';
  // Listed here oldest to newest; the feed shows them newest first (reversed below). `band: 'wide'` = the
  // horizontal recordings, two to a row (`row` names the row); runs of other pieces between them form a
  // masonry block. Photography lives in one `stack` tile that deals through the photos.
  const ITEMS = [
    { stack: [
        { img: P + 'ph-joshua.webp', title: 'Joshua Tree', medium: 'Photography · Nikon Z7, Lightroom · 2021' },
        { img: P + 'ph-sunset.webp', title: 'Sunset Beach', medium: 'Photography · Nikon Z7, Lightroom · 2022' },
        { img: P + 'ph-confetti.webp', title: 'Concert Confetti', medium: 'Photography · iPhone, Lightroom · 2023' },
        { img: P + 'ph-space-needle.webp', title: 'Space Needle', medium: 'Photography · Nikon Z7, Lightroom · 2024' },
        { img: P + 'ph-flowers.webp', title: 'Spring Flowers', medium: 'Photography · Nikon Z7, Lightroom · 2024' },
        { img: P + 'ph-koi.webp', title: 'Koi Fish', medium: 'Photography · Nikon Z7, Lightroom · 2025' },
        { img: P + 'ph-temple.webp', title: 'Temple', medium: 'Photography · Nikon Z7, Lightroom · 2025' },
        { img: P + 'ph-bryant.webp', title: 'Bryant Barnes', medium: 'Photography · iPhone, Lightroom · 2025' },
        { img: P + 'ph-vendor.webp', title: 'Street Vendor', medium: 'Photography · Nikon Z7, Lightroom · 2025' },
      ], ar: 1.3, title: 'Photography', medium: '' },
    { img: A + 'art-music-album.webp', ar: 514 / 525, title: 'Music Album Illustration', medium: 'Illustration · Medibang Paint Pro · 2022',
      desc: 'Cover art I illustrated for LiiO\'s album Bright Skies.' },
    { img: A + 'gd-fall-rush.webp', ar: 514 / 529, title: 'UCR Alpha Phi Omega Rush Flyer', medium: 'Graphic design · Canva, Procreate, Photoshop · 2023',
      desc: 'The fall 2023 recruitment flyer for UCR\'s Alpha Phi Omega chapter. As chapter historian I designed the rush flyers, social media graphics and event photos.' },

    { band: 'wide', row: 'yt', video: 'assets/playground/seattle.mp4', img: 'assets/playground/seattle.jpg?v=2', ar: 360 / 640,
      title: 'seattle', medium: 'Video · 2024',
      desc: 'A personal video project.' },
    { band: 'wide', row: 'yt', video: 'assets/playground/lofi-room.mp4', img: 'assets/playground/lofi-room.jpg?v=2', ar: 720 / 1280,
      title: 'Lofi Room', medium: '3D model · Video · 2024',
      desc: 'A cozy lofi room I modeled and animated in Blender, then edited in CapCut.' },

    { img: A + 'art-haliene.webp', ar: 514 / 384, title: 'Official Jersey for HALIENE Water EP', medium: 'Merch design · Procreate, Photoshop · 2025',
      desc: 'Official merch for HALIENE, a touring EDM artist: a jersey for the Water EP, sold on the artist\'s site. I designed it while working with Next Step Management on HALIENE\'s artwork and visual identity.' },
    { img: A + 'art-tree.webp', ar: 514 / 476, title: 'Tree Illustration', medium: 'Illustration · Procreate · 2025',
      desc: 'A personal illustration project.' },
    { img: A + 'fruit plate illustration.webp', ar: 2360 / 1640, title: 'Fruit Plate Illustration', medium: 'Illustration · Procreate · 2026',
      desc: 'A personal illustration project.' },
    { img: 'assets/little wins bakehouse/physical and print/menu.webp', ar: 1014 / 901,
      title: 'Little Wins Bakehouse Menu', medium: 'Print design · 2026',
      desc: 'A printed menu for Little Wins Bakehouse, a micro-bakery in San Francisco. I designed the bakery\'s full brand identity: logo system, stickers, business cards and packaging.' },
    { video: 'assets/case studies/soundbite/soundbite screens - scanning qr code.mp4', img: 'assets/case studies/soundbite/soundbite-thumb.webp', ar: 1616 / 910,
      title: 'soundbite', medium: 'Product concept · Figma', href: 'soundbite', same: true, go: 'Read the case study',
      desc: 'A sensory-enhanced snack concept pairing mood-based flavors with QR-triggered 3D spatial audio. Scan the wrapper, put on headphones, and a soundscape matched to that flavor\'s mood plays while you eat.' },
    { img: 'assets/icons/ppf-thumb.webp', ar: 662 / 1024,
      title: 'past / present / future', medium: 'Website · Figma', href: 'https://www.figma.com/proto/MDJjsmm2Hyi5fHFBFJLIBn/m3-past-present-future-site?node-id=1-2&t=km5SQGWGHu2ioRcs-1&scaling=contain&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2&show-proto-sidebar=1',
      desc: 'Technology visualized across three generations.', go: 'Open the prototype' },
    { img: 'assets/graphic design/gd-concept-map.webp', ar: 514 / 345, title: 'MDes Thesis Concept Map', medium: 'Information design',
      desc: 'Made for a class in my MDes program: a map of my thesis concept and the subjects and fields related to it.' },
    { video: 'assets/playground/pantry-pop.mp4', img: 'assets/playground/pantry-pop-cover.jpg', ar: 810 / 1440,
      title: 'pantry pop', medium: 'Blind box game · Web', href: 'https://pantry-pop.netlify.app/',
      desc: 'A vibe-coded food blind box simulator.' },

    { band: 'wide', row: 'aug', video: 'assets/playground/keeb-sim.mp4', img: 'assets/playground/keeb-sim.jpg', ar: 810 / 1440,
      title: 'keeb sim', medium: 'Keyboard simulator · Web', href: 'https://keebsim.netlify.app/',
      desc: 'A mechanical keyboard simulator. Pick a switch, paint the keycaps, hear every keypress, then type a test on the board you just built.' },
    { band: 'wide', row: 'aug', video: 'assets/playground/soundtrails.mp4', img: 'assets/playground/soundtrails.jpg', ar: 810 / 1440,
      title: 'soundtrails', medium: 'Data visualization · Web', href: 'https://soundtrails.netlify.app/',
      desc: 'A week of my listening history mapped onto the places I was in. Every song leaves a colored trail across the city, and zooming all the way in lands you in the floor plan of my room.' },
    { band: 'wide', row: 'sep', video: 'assets/playground/same-me-different-place.mp4', img: 'assets/playground/same-me-different-place.jpg', ar: 1080 / 1920,
      title: 'Same Me, Different Place', medium: 'Data visualization · Animation',
      desc: 'A data visualization project I made for a class.' },
    { band: 'wide', row: 'sep', video: 'assets/playground/szn-group-chat.mp4?v=2', img: 'assets/playground/szn-group-chat.jpg?v=2', ar: 1080 / 840,
      title: 'szn in the Group Chat', medium: 'Product video · szn',
      desc: 'A product video for szn, the AI personal assistant that works through iMessage, showing it in a group chat. I lead brand and growth design at szn.' },
    { band: 'wide', row: 'new', video: 'assets/playground/szn-lanyard.mp4', img: 'assets/playground/szn-lanyard.jpg', ar: 1440 / 1080,
      title: 'szn Team Lanyard', medium: 'Brand design · szn',
      desc: 'The team lanyard I designed for szn, the AI personal assistant that works through iMessage. I lead brand and growth design at szn.' },
    { band: 'wide', row: 'new', video: 'assets/playground/mismatcha.mp4', img: 'assets/playground/mismatcha.jpg', ar: 810 / 1440,
      title: 'mismatcha', medium: 'Data visualization · Web', href: 'https://mismatcha.netlify.app/',
      desc: 'Japan\'s green tea exports from 2016 to 2025, stacked as piles of boxes on a world map. Why the field can\'t keep up with your latte.' },
  ];
  // every photo in the stack shares one line
  ITEMS.forEach((it) => { if (it.stack) it.stack.forEach((ph) => { ph.desc = ph.desc || 'From my photography. I also do photoshoots as @visualsbyskn.'; }); });
  ITEMS.reverse();
  ITEMS.forEach((it) => { if (it.stack) it.stack.reverse(); });
  // Each piece's overall look, so the masonry can keep similar ones apart (no blue next to blue, dark next
  // to dark, and so on).
  const TONE = {
    'soundbite': 'blue', 'pantry pop': 'blue', 'Fruit Plate Illustration': 'blue',
    'Official Jersey for HALIENE Water EP': 'blue', 'Music Album Illustration': 'dark', 'UCR Alpha Phi Omega Rush Flyer': 'dark',
    'Tree Illustration': 'dark', 'Little Wins Bakehouse Menu': 'light', 'past / present / future': 'light',
    'MDes Thesis Concept Map': 'light', 'Photography': 'photo',
  };
  // Very tall pieces are cropped from the top so one tile can't run the length of a column.
  const MAX_AR = 1.6;

  const tiles = ITEMS.map((it) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'pg-tile' + (it.href ? ' is-link' : '');
    const ar = Math.min(it.ar, it.video ? 9 : MAX_AR);
    el.style.aspectRatio = '1 / ' + ar.toFixed(4);
    el.dataset.title = it.title; el.dataset.medium = it.medium;
    el.setAttribute('aria-label', it.title + ', ' + it.medium + (it.href ? ' (opens details and a link)' : it.youtube ? ' (plays the video)' : ' (opens larger)'));
    if (it.stack) return stackTile(el, it, ar);
    el.innerHTML =
      (it.video
        ? '<video src="' + esc(it.video) + '" poster="' + esc(it.img) + '" muted loop playsinline preload="none"></video>'
        : '<img src="' + esc(it.img) + '" alt="" loading="lazy" decoding="async">') +
      (it.youtube ? '<span class="pg-play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 14 14"><path d="M4 2.5v9l7.5-4.5z" fill="currentColor"/></svg></span>' : '') +
      '<span class="pg-cap"><b>' + esc(it.title) + (it.href ? ' <i aria-hidden="true">↗</i>' : '') + '</b><small>' + esc(it.medium) + '</small></span>';
    el.addEventListener('click', () => openPop(it, el));
    return { el, ar, band: it.band || 'design', row: it.row || null, tone: TONE[it.title] };
  });

  // The photography stack: prints at their own shapes, slightly turned. Every few seconds the top print
  // slides off and goes to the back. Hover pauses it; the caption and the lightbox follow the top print.
  function stackTile(el, it, ar) {
    el.classList.add('pg-stack');
    el.setAttribute('aria-label', 'Photography, ' + it.stack.length + ' photos. Opens the photo on top.');
    el.innerHTML = it.stack.map((ph) => '<img class="pg-print" src="' + esc(ph.img) + '" alt="" loading="lazy" decoding="async">').join('') +
      '<span class="pg-cap"><b></b><small></small></span>';
    const prints = [...el.querySelectorAll('.pg-print')];
    const cap = el.querySelector('.pg-cap');
    let top = 0, timer = 0, hovering = false, onScreen = false;
    function label() {
      const ph = it.stack[top];
      cap.querySelector('b').textContent = el.dataset.title = ph.title;
      cap.querySelector('small').textContent = el.dataset.medium = ph.medium;
    }
    function paint() {
      prints.forEach((p, i) => { const pos = (i - top + prints.length) % prints.length; p.dataset.pos = Math.min(pos, 3); });
      label();
    }
    function next() {
      const out = prints[top];
      out.dataset.pos = 'out';
      top = (top + 1) % prints.length;
      setTimeout(paint, 420);
      prints.forEach((p, i) => { if (p !== out) p.dataset.pos = Math.min((i - top + prints.length) % prints.length, 3); });
      label();
    }
    function run() { clearInterval(timer); if (onScreen && !hovering && !reduceMotion) timer = setInterval(next, 2600); }
    el.addEventListener('mouseenter', () => { hovering = true; run(); });
    el.addEventListener('mouseleave', () => { hovering = false; run(); });
    if ('IntersectionObserver' in window) new IntersectionObserver((es) => { onScreen = es[0].isIntersecting; run(); }, { threshold: 0.3 }).observe(el);
    el.addEventListener('click', () => {
      if (reduceMotion) { next(); return; }
      openPop(it.stack[top], el, { list: it.stack, index: top });
    });
    paint();
    return { el, ar, band: 'design', row: null, tone: TONE[it.title] };
  }

  // ── The pop-up: a piece opens as a polaroid over a blurred page, growing out of its tile. Pieces with
  // a link open the same card with a short description and the link inside, so leaving the site is a
  // choice, never a surprise. Photos from the stack can be stepped through with the arrows.
  const pop = document.createElement('div');
  pop.className = 'pg-pop'; pop.hidden = true;
  pop.innerHTML =
    '<div class="pg-pop-bg" data-close></div>' +
    '<figure class="pg-pop-card" role="dialog" aria-modal="true" aria-labelledby="pg-pop-title" tabindex="-1">' +
      '<div class="pg-pop-media"></div>' +
      '<figcaption class="pg-pop-cap"><b id="pg-pop-title"></b><small></small><p></p>' +
        '<a class="pg-pop-go"><span></span><svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M3 9l6-6M4.5 3H9v4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></a></figcaption>' +
      '<button class="pg-pop-x" type="button" aria-label="Close" data-close><svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></button>' +
      '<button class="pg-pop-nav is-prev" type="button" aria-label="Previous photo"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
      '<button class="pg-pop-nav is-next" type="button" aria-label="Next photo"><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 3l5 5-5 5" stroke="currentColor" stroke-width="1.7" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></button>' +
    '</figure>';
  document.body.appendChild(pop);
  const card = pop.querySelector('.pg-pop-card'), media = pop.querySelector('.pg-pop-media');
  const go = pop.querySelector('.pg-pop-go');
  let from = null, group = null, closing = false;
  const SPRING = 'cubic-bezier(.3,1.32,.5,1)';

  function fill(it) {
    const ar = it.ar || (it.img && natural[it.img]) || 1.32;
    const linked = !!it.href;
    // Tall pieces with a description put the text beside the media, so a narrow video doesn't leave the card
    // half empty. Everything else keeps the caption underneath, never wider than the media.
    const side = !!it.desc && ar > 1.15 && innerWidth > 760;
    card.classList.toggle('is-linked', linked);
    card.classList.toggle('is-side', side);
    const maxW = side ? Math.min(innerWidth * 0.5, 520) : Math.min(innerWidth * 0.82, linked ? 720 : 860);
    const maxH = innerHeight * (side ? 0.74 : linked ? 0.5 : 0.62);
    const w = Math.round(Math.min(maxW, maxH / ar));
    media.style.width = w + 'px'; media.style.height = Math.round(w * ar) + 'px';
    pop.querySelector('.pg-pop-cap').style.maxWidth = side ? '' : w + 'px';
    media.innerHTML = it.youtube
      ? '<iframe src="https://www.youtube-nocookie.com/embed/' + esc(it.youtube) + '?autoplay=1&mute=1&rel=0&playsinline=1" title="' + esc(it.title) + '" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>'
      : it.video
      ? '<video src="' + esc(it.video) + '" poster="' + esc(it.img) + '" muted loop playsinline autoplay></video>'
      : '<img src="' + esc(it.img) + '" alt="' + esc(it.title) + '">';
    pop.querySelector('.pg-pop-cap b').textContent = it.title;
    pop.querySelector('.pg-pop-cap small').textContent = it.medium;
    pop.querySelector('.pg-pop-cap p').textContent = it.desc || '';
    go.hidden = !linked;
    if (linked) {
      go.href = it.href;
      if (it.same) { go.removeAttribute('target'); go.removeAttribute('rel'); } else { go.target = '_blank'; go.rel = 'noopener'; }
      go.querySelector('span').textContent = it.go || ('Open ' + it.title);
    }
  }
  // The card and its round buttons get the hand-drawn outline (wobblyBox), like the nav's hover clouds.
  let inkSeed = 3;
  function inkCard() {
    drawWobbly(card, 'pg-pop-ink', card.classList.contains('is-linked') ? 16 : 7, inkSeed++ % 50 + 11);
    pop.querySelectorAll('.pg-pop-x, .pg-pop-nav').forEach((b, i) => drawWobbly(b, 'pg-pop-ink', 99, 40 + i));
  }
  // Photos in the stack have no `ar`; read it once each image loads.
  const natural = {};
  function openPop(it, tile, grp) {
    if (it.img && !it.ar && !natural[it.img]) {
      const im = new Image(); im.onload = () => { natural[it.img] = im.naturalHeight / im.naturalWidth; openPop(it, tile, grp); }; im.src = it.img; return;
    }
    from = tile; group = grp || null; closing = false;
    fill(it);
    card.classList.toggle('has-nav', !!group);
    pop.hidden = false;
    inkCard();
    pop.getBoundingClientRect();
    pop.classList.add('is-open');
    if (!reduceMotion && tile) {
      const a = tile.getBoundingClientRect(), b = card.getBoundingClientRect();
      const dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
      card.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(0.15, a.width / b.width).toFixed(3) + ') rotate(0deg)', opacity: 0.4 },
        { transform: 'translate(0,0) scale(1) rotate(var(--tilt))', opacity: 1 },
      ], { duration: 560, easing: SPRING });
    }
    card.focus({ preventScroll: true });
  }
  function closePop() {
    if (pop.hidden || closing) return;
    closing = true;
    pop.classList.remove('is-open');
    const done = () => { pop.hidden = true; media.innerHTML = ''; closing = false; if (from) from.focus({ preventScroll: true }); };
    const a = from && from.getBoundingClientRect();
    if (reduceMotion || !a || a.bottom < 0 || a.top > innerHeight) { card.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160 }).onfinish = done; return; }
    const b = card.getBoundingClientRect();
    const dx = (a.left + a.width / 2) - (b.left + b.width / 2), dy = (a.top + a.height / 2) - (b.top + b.height / 2);
    card.animate([
      { transform: 'translate(0,0) scale(1) rotate(var(--tilt))', opacity: 1 },
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + Math.max(0.15, a.width / b.width).toFixed(3) + ') rotate(0deg)', opacity: 0 },
    ], { duration: 320, easing: 'cubic-bezier(.5,0,.75,0)' }).onfinish = done;
  }
  function step(d) {
    if (!group) return;
    group.index = (group.index + d + group.list.length) % group.list.length;
    const it = group.list[group.index];
    const show = () => {
      fill(it);
      inkCard();
      if (!reduceMotion) card.animate([{ transform: 'translateX(' + (d * 28) + 'px) rotate(calc(var(--tilt) + ' + (d * 3) + 'deg))', opacity: 0 }, { transform: 'translateX(0) rotate(var(--tilt))', opacity: 1 }], { duration: 380, easing: SPRING });
    };
    if (it.img && !natural[it.img]) { const im = new Image(); im.onload = () => { natural[it.img] = im.naturalHeight / im.naturalWidth; show(); }; im.src = it.img; } else show();
  }
  pop.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) closePop(); });
  pop.querySelector('.is-prev').addEventListener('click', () => step(-1));
  pop.querySelector('.is-next').addEventListener('click', () => step(1));
  pop.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });
  document.addEventListener('keydown', (e) => {
    if (pop.hidden) return;
    if (e.key === 'Escape') closePop();
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'Tab') {
      const f = [...card.querySelectorAll('a:not([hidden]), button')].filter((x) => x.offsetParent);
      if (!f.length) return;
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  const div = (cls) => { const d = document.createElement('div'); d.className = cls; return d; };
  // A justified row: every tile gets the same height, so widths follow each piece's own shape.
  function row(list) {
    const r = div('pg-row');
    list.forEach((t) => { t.el.style.flex = (1 / t.ar).toFixed(4) + ' 1 0'; r.appendChild(t.el); });
    return r;
  }
  // Masonry: the biggest pieces are placed first, each in the shortest column, then pieces are moved or swapped between
  // columns until the heights nearly match (each column keeps the feed's order). Tiles in a shorter
  // column grow a few px each (cropping a little) so the columns end level with no holes.
  function masonry(list, n, cls) {
    const wrap = div('pg-cols' + (cls ? ' ' + cls : ''));
    const cs = Array.from({ length: n }, () => wrap.appendChild(div('pg-col')));
    const sz = (t) => t.ar + 0.05;
    const g = Array.from({ length: n }, () => []);
    const h = new Array(n).fill(0);
    list.forEach((t) => { const k = h.indexOf(Math.min(...h)); g[k].push(t); h[k] += sz(t); });
    const spread = () => Math.max(...h) - Math.min(...h);
    for (let pass = 0; pass < 60; pass++) {
      let best = null, bestS = spread() - 1e-6;
      for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
        if (a === b) continue;
        g[a].forEach((x, i) => {
          const tryIt = (dA, dB, y) => {
            h[a] += dA; h[b] += dB; const s = spread(); h[a] -= dA; h[b] -= dB;
            if (s < bestS) { bestS = s; best = [a, b, i, y]; }
          };
          if (g[a].length > 1) tryIt(-sz(x), sz(x), -1);           // move x from a to b
          g[b].forEach((y, j) => tryIt(sz(y) - sz(x), sz(x) - sz(y), j)); // swap x and y
        });
      }
      if (!best) break;
      const [a, b, i, j] = best, x = g[a][i];
      if (j < 0) { g[a].splice(i, 1); g[b].push(x); h[a] -= sz(x); h[b] += sz(x); }
      else { const y = g[b][j]; g[a][i] = y; g[b][j] = x; h[a] += sz(y) - sz(x); h[b] += sz(x) - sz(y); }
    }
    g.forEach((col) => col.sort((p, q) => list.indexOf(p) - list.indexOf(q)));
    // Colour mix: reorder within columns, and swap near-equal pieces across columns, so that pieces with the
    // same tone don't touch above/below (costs more) or sit side by side in neighbouring columns.
    const byDate = (col) => [...col].sort((p, q) => list.indexOf(p) - list.indexOf(q));
    const clash = () => {
      let c = 0;
      const spans = g.map((col) => byDate(col)).map((col) => { let y = 0; return col.map((t) => { const r = [y, y + sz(t), t.tone]; y += sz(t); return r; }); });
      spans.forEach((col, k) => col.forEach((r, i) => {
        if (i && col[i - 1][2] === r[2]) c += 3;
        if (k + 1 < n) spans[k + 1].forEach((q) => { const o = Math.min(r[1], q[1]) - Math.max(r[0], q[0]); if (o > 0.15 && q[2] === r[2]) c += o; });
      }));
      return c;
    };
    const tol = Math.max(spread(), 0.08);
    for (let pass = 0; pass < 80; pass++) {
      let best = null, bestC = clash() - 1e-6;
      const tryMove = (apply, undo) => { apply(); const c = clash(); const ok = spread() <= tol + 1e-9; undo(); if (ok && c < bestC) { bestC = c; best = apply; } };
      for (let a = 0; a < n; a++) for (let b = a + 1; b < n; b++) g[a].forEach((x, i) => g[b].forEach((y, j) => {
        const d = sz(y) - sz(x);
        const sw = () => { [g[a][i], g[b][j]] = [g[b][j], g[a][i]]; h[a] += d; h[b] -= d; };
        const un = () => { [g[a][i], g[b][j]] = [g[b][j], g[a][i]]; h[a] -= d; h[b] += d; };
        tryMove(sw, un);
      }));
      if (!best) break;
      best();
    }
    g.forEach((col, k) => byDate(col).forEach((t) => { t.el.style.flex = ''; cs[k].appendChild(t.el); }));
    return wrap;
  }
  let key = '';
  function layout() {
    const W = feed.clientWidth;
    const narrow = W <= 640;
    const n = W > 1000 ? 4 : narrow ? 2 : 3;
    const k = n + (narrow ? 'n' : 'w') + Math.round(W / 80);
    if (k === key) return;
    key = k;
    feed.innerHTML = '';
    // Walk the feed in date order: wide pieces that share a `row` sit side by side (one per row on
    // narrow screens), and each run of other pieces becomes its own masonry block.
    const secs = [];
    tiles.forEach((t) => {
      const last = secs[secs.length - 1];
      if (t.band === 'wide') {
        if (!narrow && last && last.row === t.row) last.list.push(t);
        else secs.push({ row: t.row, list: [t] });
      } else if (last && !last.row) last.list.push(t);
      else secs.push({ row: null, list: [t] });
    });
    secs.forEach((sec) => feed.appendChild(sec.row ? row(sec.list) : masonry(sec.list, Math.min(n, sec.list.length))));
  }
  layout();
  new ResizeObserver(layout).observe(feed);

  // ── The sandbox frame is drawn with the same pen as the case-study covers; the pieces inside stay plain.
  // The path is drawn at the frame's own pixel size and redrawn when it changes.
  const arch = root.querySelector('.arch');
  function drawFrame() {
    const pen = window.__handStroke;
    const w = Math.round(arch.offsetWidth), h = Math.round(arch.offsetHeight);
    if (!pen || !w || !h) return;
    let svg = arch.querySelector(':scope > .arch-ink');
    if (svg && +svg.dataset.w === w && +svg.dataset.h === h) return;
    if (!svg) { svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('class', 'arch-ink'); svg.setAttribute('aria-hidden', 'true'); arch.appendChild(svg); }
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.width = w + 'px'; svg.style.height = h + 'px';
    svg.dataset.w = w; svg.dataset.h = h;
    svg.innerHTML = '<path d="' + pen(5, w, h, 24, 1, { AMPLITUDE: 2, WEIGHT: 1.8, SAMPLES: Math.round(140 * Math.max(1, (w + h) / 1200)) }) + '" fill="#1a1a1a"/>';
  }
  if (arch) { drawFrame(); addEventListener('load', drawFrame); new ResizeObserver(drawFrame).observe(arch); }

  // Pieces fade up into place as they scroll into view, a few at a time, top to bottom.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    root.classList.add('pg-drop');
    const dropIO = new IntersectionObserver((es) => {
      const hits = es.filter((e) => e.isIntersecting).map((e) => e.target)
        .sort((a, b) => { const p = a.getBoundingClientRect(), q = b.getBoundingClientRect(); return (p.top - q.top) || (p.left - q.left); });
      hits.forEach((el, i) => {
        dropIO.unobserve(el);
        el.style.transitionDelay = Math.min(i * 60, 360) + 'ms';
        el.classList.add('is-in');
        setTimeout(() => { el.style.transitionDelay = ''; }, 1200);
      });
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.1 });
    tiles.forEach((t) => dropIO.observe(t.el));
  }

  // Recordings play while they're on screen.
  const vids = tiles.map((t) => t.el.querySelector('video')).filter(Boolean);
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.preload = 'auto'; e.target.play().catch(() => {}); } else e.target.pause();
    }), { threshold: 0.25 });
    vids.forEach((v) => io.observe(v));
  }
})();


// ── Panel slideshows — migrated from marketing.html (Designer Drains, etc.) ──
// Cycles the .ss-slide/.ss-dot pairs inside an .ig-slideshow by id.
function _slideStep(id, dir) {
  const ss = document.getElementById(id);
  if (!ss) return;
  const slides = ss.querySelectorAll('.ss-slide');
  const dots = ss.querySelectorAll('.ss-dot');
  let i = [...slides].findIndex(s => s.classList.contains('active'));
  slides[i].classList.remove('active');
  dots[i].classList.remove('active');
  i = (i + dir + slides.length) % slides.length;
  slides[i].classList.add('active');
  dots[i].classList.add('active');
}
function prevSlide(id) { _slideStep(id, -1); }
function nextSlide(id) { _slideStep(id, 1); }


// ── Hero name — typing animation ─────────────────────────────
// Cycles the hero heading: type a phrase, hold 3s, backspace, next.
// The real name lives in a visually-hidden sibling for screen readers;
// this animated text is aria-hidden. Under prefers-reduced-motion it
// simply shows "Sydney Nguyen" static with no cursor.
(function initRingNameType() {
  // Every .rn-text on the page runs its own independent typewriter. There are up
  // to two: the desktop ring name and the mobile hero wordmark — only one is
  // visible at a time, but both are cheap to drive.
  const textEls = document.querySelectorAll('.rn-text');
  if (!textEls.length) return;

  const PHRASES = ['sydney nguyen', 'product designer', 'ux/ui', 'mdes @ sjsu', 'creative thinker', 'matcha lover'];
  const TYPE_MS = 60;    // per character while typing
  const DELETE_MS = 35;  // per character while deleting (reads faster)
  const HOLD_MS = 2000;  // pause on a completed phrase

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function startTyping(textEl) {
    if (reduceMotion) { textEl.textContent = 'sydney nguyen'; return; }

    let phrase = 0, chars = 0, deleting = false, timer = null;

    function step() {
      const target = PHRASES[phrase];
      if (!deleting) {
        textEl.textContent = target.slice(0, ++chars);
        if (chars === target.length) { deleting = true; timer = setTimeout(step, HOLD_MS); return; }
        timer = setTimeout(step, TYPE_MS);
      } else {
        textEl.textContent = target.slice(0, --chars);
        if (chars === 0) { deleting = false; phrase = (phrase + 1) % PHRASES.length; }
        timer = setTimeout(step, DELETE_MS);
      }
    }

    timer = setTimeout(step, TYPE_MS);
    // Clean up the pending timer if the page is torn down.
    window.addEventListener('pagehide', () => clearTimeout(timer), { once: true });
  }

  textEls.forEach(startTyping);
})();

// ── Mobile hero mascot — expression cycle ────────────────────
// The desktop center icon flips expressions inside buildPortfolio's ring init
// (which targets a single, first-in-DOM element). The mobile hero has its own
// mascot below that in the DOM, so it gets this small independent cycler —
// same four frames, same 1s beat, paused under reduced motion.
(function initMobileHeroIcon() {
  const img = document.getElementById('mob-hero-icon');
  if (!img) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ICONS = [
    'assets/icons/center-icon.webp',           // default / first frame
    'assets/icons/center-icon-wink.webp',
    'assets/icons/center-icon-sleep.webp',
    'assets/icons/center-icon-confused.webp',
  ];
  ICONS.forEach(src => { new Image().src = src; });   // preload for clean swaps

  let idx = 0;
  const timer = setInterval(() => {
    idx = (idx + 1) % ICONS.length;
    img.src = ICONS[idx];
  }, 1000);
  window.addEventListener('pagehide', () => clearInterval(timer), { once: true });
})();


// ── Side menu extras (home page, wide screens) ──
// Under the menu: a stack of personal photos (click for the next one) and the song that's playing, with its cover.
// The photos and captions are the ones from the hero arc. Below 1180px the menu is a top bar and these are hidden.
(function railExtras() {
  const start = () => {
    const nav = document.getElementById('site-nav');
    const photos = window.ARC_PHOTOS;
    if (!nav || !photos || !document.getElementById('cs-inline-grid') || nav.querySelector('.rail-extra')) return;
    document.documentElement.classList.add('is-home');
    // the sticker sheet button sits with the email and LinkedIn buttons while the menu is a sidebar,
    // and goes back to the bottom-right corner when the window gets narrow
    const peeker = document.getElementById('sticker-peeker'), corner = document.getElementById('corner-controls');
    const contact = nav.querySelector('.nav-contact'), railMQ = matchMedia('(min-width: 1180px)');
    const placePeeker = () => { if (peeker && contact && corner) (railMQ.matches ? contact : corner).appendChild(peeker); };
    placePeeker(); railMQ.addEventListener('change', placePeeker);
    const wash = document.createElement('div');
    wash.className = 'rail-wash'; wash.setAttribute('aria-hidden', 'true');
    nav.insertBefore(wash, nav.firstChild);

    // three at a time, grouped: suna and friends, food, the MDes people, design events, places
    const groups = [[13, 14, 12], [7, 8, 11], [2, 5, 6], [0, 9, 3], [1, 10, 4]].map(g => g.filter(n => photos[n])).filter(g => g.length);
    const box = document.createElement('div');
    box.className = 'rail-extra';
    box.innerHTML = `
      <button type="button" class="rx-stack" aria-label="Photos of Sydney's life. Show the next three.">
        ${groups.map((g, gi) => g.map((n, p) => `<figure class="rx-photo" data-g="${gi}" data-p="${p}"><img data-src="${photos[n].img}" alt=""><figcaption>${photos[n].caption}</figcaption></figure>`).join('')).join('')}
      </button>
      <div class="rx-np">
        <button type="button" class="rx-np-art" aria-label="Open the music player"><img alt=""></button>
        <span class="rx-np-text"><b></b><small></small></span>
        <span class="rx-np-ctl">
          <button type="button" class="rx-np-skip rx-np-prev" aria-label="Previous song"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/></svg></button>
          <button type="button" class="rx-np-play" aria-label="Play"></button>
          <button type="button" class="rx-np-skip rx-np-next" aria-label="Next song"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6z"/></svg></button>
        </span>
      </div>`;
    nav.insertBefore(box, nav.querySelector('.nav-contact'));

    // the photos: one group of three shows, spread in a row; clicking deals the next group in
    const stack = box.querySelector('.rx-stack');
    const figs = [...stack.querySelectorAll('.rx-photo')];
    let cur = 0, busy = false;
    const load = (gi) => figs.forEach(f => {
      const img = f.querySelector('img');
      if (+f.dataset.g === gi && img.dataset.src) { img.src = img.dataset.src; delete img.dataset.src; }
    });
    const show = () => {
      figs.forEach(f => { if (+f.dataset.g === cur) f.dataset.s = 'on'; else if (f.dataset.s !== 'out') f.dataset.s = 'wait'; });
      load(cur); load((cur + 1) % groups.length);
    };
    show();
    stack.addEventListener('click', () => {
      if (busy || groups.length < 2) return; busy = true;
      figs.forEach(f => { if (+f.dataset.g === cur) f.dataset.s = 'out'; });
      cur = (cur + 1) % groups.length;
      show();
      setTimeout(() => { figs.forEach(f => { if (f.dataset.s === 'out') f.dataset.s = 'wait'; }); busy = false; }, 560);
    });

    // now playing: follows the CD player (CDP_TRACKS, bgAudio and cdpCurrentTrack live above)
    const art = box.querySelector('.rx-np-art img'), title = box.querySelector('.rx-np-text b'),
      artist = box.querySelector('.rx-np-text small'), play = box.querySelector('.rx-np-play');
    const ICON_PLAY = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    const ICON_PAUSE = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';
    const sync = () => {
      const t = CDP_TRACKS[cdpCurrentTrack];
      if (art.getAttribute('src') !== t.art) art.src = t.art;
      title.textContent = t.title; artist.textContent = t.artist;
      play.innerHTML = musicPlaying ? ICON_PAUSE : ICON_PLAY;
      play.setAttribute('aria-label', musicPlaying ? 'Pause' : 'Play');
      box.classList.toggle('is-playing', musicPlaying);
    };
    sync(); window.railNpSync = sync;
    ['play', 'pause', 'ended', 'loadstart'].forEach(ev => bgAudio.addEventListener(ev, () => setTimeout(sync, 0)));
    play.addEventListener('click', () => { cdpTogglePlay(); sync(); });
    box.querySelector('.rx-np-prev').addEventListener('click', () => { cdpPrev(); sync(); });
    box.querySelector('.rx-np-next').addEventListener('click', () => { cdpNext(); sync(); });

    // The photos shrink to fit whatever room the menu leaves (it grows when a project's description opens), and only
    // hide when there's no room for a readable stack.
    const fit = () => {
      if (!matchMedia('(min-width: 1180px)').matches) return;
      stack.style.zoom = 1; stack.hidden = false;
      const over = nav.scrollHeight - nav.clientHeight;
      if (over > 0) {
        const z = (stack.offsetHeight - over) / stack.offsetHeight;
        if (z < 0.5) stack.hidden = true; else stack.style.zoom = z.toFixed(3);
      }
      // still too tall without the photos: let the menu scroll (the open project then stays inside the menu)
      nav.classList.toggle('rail-scroll', nav.scrollHeight - nav.clientHeight > 1);
    };
    fit();
    addEventListener('resize', fit);
    const links = nav.querySelector('.nav-links');
    if (links && 'ResizeObserver' in window) new ResizeObserver(() => requestAnimationFrame(fit)).observe(links);
    box.querySelector('.rx-np-art').addEventListener('click', e => { if (typeof toggleMusicPopup === 'function') toggleMusicPopup(e); });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 0));
  else setTimeout(start, 0);
})();

// ── About and Resume on the home page ──
// The two sections at the end of the home page read their content from about.html and resume.html, so it lives in
// one place. The page titles become section headings, the margin doodles stay on the standalone pages, and the
// rows show at once instead of waiting for the standalone pages' scroll reveal. If a page can't be read, its section
// links to the page instead.
// ── Experience and About on the home page: motion that sets them apart from Work and Playground.
// Experience: an ink line draws itself down past the role logos as you scroll, the cat wakes up when the
// section comes into view, and the skill chips land one by one like stickers. About: the photo stacks fan out
// and settle as you reach them, and a thin ink line draws itself from photo to photo in the order of the story.
function homeMotion() {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); return n; };
  const rel = (el, host) => { const a = el.getBoundingClientRect(), b = host.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };
  const once = (els, fn, opts) => {
    if (!('IntersectionObserver' in window)) { els.forEach(fn); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { io.unobserve(e.target); fn(e.target); } }), opts || { threshold: 0.4 });
    els.forEach((el) => io.observe(el));
  };

  // Lines that draw themselves down to a "reading line" 70% of the way down the screen. Each entry is
  // { svg, paths: [path], samples } where samples map length along the path to its y in the page.
  const drawn = [];
  function sample(path) {
    const L = path.getTotalLength(), pts = [];
    for (let i = 0; i <= 120; i++) { const l = L * i / 120; pts.push([l, path.getPointAtLength(l).y]); }
    return { L, pts };
  }
  function paint() {
    const read = innerHeight * 0.7;
    drawn.forEach((d) => {
      const top = d.svg.getBoundingClientRect().top;
      d.paths.forEach((p) => {
        const s = p._s; if (!s) return;
        let len = 0;
        for (const [l, y] of s.pts) { if (top + y <= read) len = l; else break; }
        if (reduce) len = s.L;
        p.style.strokeDashoffset = (s.L - len).toFixed(1);
      });
    });
  }
  function track(svg, paths) {
    paths.forEach((p) => { p._s = sample(p); p.style.strokeDasharray = p._s.L.toFixed(1); });
    const i = drawn.findIndex((d) => d.svg === svg);
    if (i >= 0) drawn[i].paths = paths; else drawn.push({ svg, paths });
    paint();
  }
  addEventListener('scroll', paint, { passive: true });
  addEventListener('resize', paint);

  // ── Experience ──
  const res = document.querySelector('.hp-resume');
  if (res) {
    // the line between the role logos: one short wobbly stroke from each logo to the next, so it reads as a
    // single line passing behind them
    const body = res.querySelector('.role-body');
    const logos = body ? [...body.querySelectorAll('.exp-header > .hand-frame')] : [];
    if (logos.length > 1) {
      const svg = mk('svg', { class: 'exp-line', 'aria-hidden': 'true' });
      body.prepend(svg);
      const build = () => {
        const W = body.offsetWidth, H = body.offsetHeight;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.width = W + 'px'; svg.style.height = H + 'px';
        svg.innerHTML = '';
        const paths = [];
        logos.forEach((lg, i) => {
          if (!i) return;
          const a = rel(logos[i - 1], body), b = rel(lg, body);
          const x = a.x + a.w / 2, y0 = a.y + a.h + 6, y1 = b.y - 6;
          if (y1 - y0 < 8) return;
          const n = Math.max(2, Math.round((y1 - y0) / 26));
          let d = 'M' + x.toFixed(1) + ' ' + y0.toFixed(1);
          for (let k = 1; k <= n; k++) {
            const yk = y0 + (y1 - y0) * k / n, ym = y0 + (y1 - y0) * (k - 0.5) / n;
            d += ' Q' + (x + (k % 2 ? 1.6 : -1.6) + Math.sin(i * 3 + k) * 0.8).toFixed(1) + ' ' + ym.toFixed(1) + ' ' + x.toFixed(1) + ' ' + yk.toFixed(1);
          }
          paths.push(svg.appendChild(mk('path', { d, class: 'exp-line-seg' })));
        });
        track(svg, paths);
      };
      build();
      new ResizeObserver(build).observe(body);
    }
    // the cat wakes up while the section is on screen and dozes off again once it's gone
    const cat = res.querySelector('.resume-cat');
    if (cat && 'IntersectionObserver' in window) {
      let t = 0;
      new IntersectionObserver((es) => {
        clearTimeout(t);
        if (es[0].isIntersecting) t = setTimeout(() => cat.classList.add('is-awake'), reduce ? 0 : 650);
        else cat.classList.remove('is-awake');
      }, { threshold: 0.9 }).observe(cat);
    }
    // the skill chips land one at a time like stickers, each at a slight angle
    const chips = [...res.querySelectorAll('.skill-chip')];
    chips.forEach((c, i) => c.style.setProperty('--r', (((i * 53) % 9) / 2 - 2).toFixed(1) + 'deg'));
    if (!reduce && chips.length) {
      res.classList.add('chips-wait');
      once([...res.querySelectorAll('.skills-wrap')], (wrap) => {
        const offset = wrap.previousElementSibling && wrap.previousElementSibling.classList.contains('skills-wrap') ? 3 : 0;
        [...wrap.querySelectorAll('.skill-chip')].forEach((c, i) => setTimeout(() => c.classList.add('is-stuck'), (i + offset) * 55));
      }, { threshold: 0.3 });
    }
  }

  // ── About ──
  const ab = document.querySelector('.hp-about');
  if (ab) {
    // the flower sketch beside the closing line, as on the About page (its doodles are stripped on the way in)
    const close = ab.querySelector('.about-closing');
    if (close && !close.querySelector('.about-flowers')) {
      const fl = document.createElement('img');
      fl.src = 'assets/about-dual-flowers.svg'; fl.alt = ''; fl.className = 'about-flowers';
      close.appendChild(fl);
      if (reduce) fl.classList.add('is-in'); else once([close], () => fl.classList.add('is-in'), { threshold: 0.6 });
    }

    // the photo stacks fan out once as you reach them, then settle back
    if (!reduce) once([...ab.querySelectorAll('.about-media--fan')], (m) => {
      setTimeout(() => m.classList.add('is-peek'), 250);
      setTimeout(() => m.classList.remove('is-peek'), 1500);
    }, { threshold: 0.6 });

    // a thin ink line from photo to photo, in the order of the story, that draws itself as you scroll.
    // One gentle curve per step, through the space between the rows, so it never crosses the copy.
    const media = [...ab.querySelectorAll('.about-row .about-media')];
    if (media.length > 1) {
      const svg = mk('svg', { class: 'about-path', 'aria-hidden': 'true' });
      ab.prepend(svg);
      const build = () => {
        const W = ab.offsetWidth, H = ab.offsetHeight;
        svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.style.width = W + 'px'; svg.style.height = H + 'px';
        svg.innerHTML = '';
        const f = (n) => n.toFixed(1);
        const front = (m) => m.querySelector('.fan-front, .hand-frame') || m;
        const paths = [];
        media.forEach((m, i) => {
          if (!i) return;
          const a = rel(front(media[i - 1]), ab), b = rel(front(m), ab);
          const sx = a.x + a.w / 2, sy = a.y + a.h + 12, ex = b.x + b.w / 2, ey = b.y - 12;
          const k = (ey - sy) * 0.9;
          const d = 'M' + f(sx) + ' ' + f(sy) + ' C' + f(sx) + ' ' + f(sy + k) + ' ' + f(ex) + ' ' + f(ey - k) + ' ' + f(ex) + ' ' + f(ey);
          paths.push(svg.appendChild(mk('path', { d, class: 'about-path-line' })));
        });
        track(svg, paths);
      };
      build();
      new ResizeObserver(build).observe(ab);
    }
  }
}

(function homePages() {
  const secs = [...document.querySelectorAll('[data-page-src]')];
  const canvas = document.getElementById('desktop-canvas');
  if (!secs.length || !canvas) return;
  // phones don't show these sections (they use the standalone pages), so read the pages only once the canvas shows
  if (getComputedStyle(canvas).display === 'none') {
    const later = () => { if (getComputedStyle(canvas).display !== 'none') { removeEventListener('resize', later); homePages(); } };
    addEventListener('resize', later);
    return;
  }
  window.toggleExp = window.toggleExp || (el => el.classList.toggle('exp-open'));
  const fill = sec => fetch(sec.dataset.pageSrc)
    .then(r => r.ok ? r.text() : Promise.reject(r.status))
    .then(html => {
      const src = new DOMParser().parseFromString(html, 'text/html').querySelector(sec.dataset.pagePick);
      if (!src) throw new Error('missing');
      src.querySelectorAll('.doodle').forEach(d => d.remove());
      src.querySelectorAll('[data-reveal]').forEach(el => el.removeAttribute('data-reveal'));
      const h1 = src.querySelector('h1');
      if (h1) { const h2 = document.createElement('h2'); h2.className = 'arch-title'; h2.textContent = h1.textContent; h1.replaceWith(h2); }
      sec.querySelector('.hp-body').append(...src.childNodes);
    })
    .catch(() => {
      const name = sec.id === 'about' ? 'About' : 'Resume';
      sec.querySelector('.hp-body').innerHTML = `<h2 class="arch-title">${name}</h2><p><a href="${sec.dataset.pageSrc}">Open the ${name} page</a></p>`;
    });
  Promise.all(secs.map(fill)).then(() => {
    // the ink outlines around the photos, logos and skill chips
    const hf = document.createElement('script'); hf.src = 'hand-frame.js'; document.body.appendChild(hf);
    // the closing line's last word types itself out, as on the About page
    const tw = document.querySelector('.hp-about .typeword-text');
    if (tw && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const words = ['kindness', 'passion', 'love', 'empathy', 'generosity', 'reflection'];
      let wi = 0, ci = words[0].length, del = true;
      const tick = () => {
        const w = words[wi];
        if (del) { ci--; tw.textContent = w.slice(0, ci); if (ci === 0) { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 400); } else setTimeout(tick, 45); }
        else { ci++; tw.textContent = w.slice(0, ci); if (ci === w.length) { del = true; setTimeout(tick, 1600); } else setTimeout(tick, 85); }
      };
      setTimeout(tick, 1600);
    }
    homeMotion();
    // arriving from another page at /#about or /#experience: the sections were empty when the browser jumped, so jump again
    const target = location.hash && document.querySelector(location.hash);
    if (target && target.classList.contains('hp-sec')) target.scrollIntoView();
  });
})();
