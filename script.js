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
      { name: '3D Lofi Room.mov',      fullname: '3D Cozy Lofi Room Animation',                 size: 'Movie · 2.3 MB',    img: null, youtube: 'https://www.youtube.com/embed/ilMLzSr8t4w?autoplay=1' },
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
  if (f.youtube) {
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
      { key:'bedside',   page:'bedside-wip', title:'Bedside', meta:'Team · 2nd Place', tags:['Agentic AI','Healthcare','Privacy'], tagColor:{bg:'#f4e7e1',text:'#7a3d29'}, thumbs:['assets/case studies/bedside/cover.png', null, null], desc:'A voice-first, privacy-first handoff tool for the hospice bedside.', accent:'165, 88, 63', hackathon:{ place:'2nd place overall', name:'MLH x Digital Ocean AI Hack 2026' } },
      { key:'voqa',      page:'voqa',      title:'VOQA',        meta:'Team · Oct–Dec 2025 · 10 Wks', tags:['Mobile','Museum','UX Research'],        thumbs:['assets/case studies/voqa/voqa-thumb.webp', null, null], hoverVideo:'assets/case studies/voqa/voqa final screen video - home page.mp4', desc:'Making museum experiences more inclusive and accessible.',              accent:'90,  185, 140' },
      { key:'iterait',   page:'iterait', title:'iterait', meta:'Team · 2025', tags:['AI','Software','Design'], tagColor:{bg:'#D9FCFF',text:'#006070'}, thumbs:['assets/case studies/iterait/iterait cover image.webp', 'assets/case studies/iterait/iterait case study photo 1.webp', 'assets/case studies/iterait/iterait case study photo 2.webp'], hoverVideo:'assets/case studies/iterait/iterait cover video.mp4', desc:'Track, compare, and reuse iterations in AI-driven design workflows.', accent:'155, 175, 230', hackathon:{ place:'top 3 track finalist', name:'SJHacks 2026' } },
      { key:'room2talk', page:'room2talk', title:'room2talk',   meta:'Solo · March 2026 · 4 Wks',   tags:['Thesis','Web-Game','UX Research'], thumbs:['assets/case studies/room2talk/r2t-hero.webp',   null, null], hoverVideo:'assets/case studies/room2talk/room2talk cover video.mp4', desc:'Reflection-based card experience for intergenerational communication.', accent:'239, 155, 184' },
      { key:'tour-finder', page:'tour-finder', title:'Tour Finder', meta:'Solo · July 2026 · 2 Days', tags:['Music','Data','Dashboard'], thumbs:['assets/case studies/tour-finder/hero.webp', null, null], desc:'Surfacing artists likely to tour, before anyone else notices.', accent:'224, 122, 95' },
    ];
    // Hackathon indicator — a hand-drawn crown badge (bottom-right of the card
    // image) that flags a hackathon project. On card hover, a speech bubble
    // (same hand-drawn style as the avatar's) pops up with the placement + event.
    const crownSVG = `<svg class="csc-crown-icon" width="54" height="54" viewBox="0 0 96 96" fill="none" aria-hidden="true"><circle cx="48" cy="48" r="44.5" fill="#fff"/><path d="M48 5 Q90 6 91 47 Q93 90 49 91 Q6 92 5 49 Q3 6 48 5 Z" fill="none" stroke="#1a1a1a" stroke-width="2.4" stroke-linejoin="round"/><path d="M28 62 L25 40 L34 29 L43.5 45 L48 25 L52.5 45 L62 29 L71 40 L68 62 Z" fill="none" stroke="#1a1a1a" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/><path d="M30.5 57 Q48 60 65.5 57" fill="none" stroke="#1a1a1a" stroke-width="3" stroke-linecap="round"/></svg>`;
    const bubbleSVG = `<svg class="csc-bubble-shape" viewBox="0 0 260 96" fill="none" aria-hidden="true"><path d="M16 4 Q130 2 244 4 Q256 5 256 18 Q257 37 256 56 Q256 70 243 71 Q232 71.5 221 71.4 Q214 84 208 90 Q203 85 197 71.6 Q106 72 16.5 71 Q4 70.5 4 56 Q3 37 4 18 Q4 5 16 4 Z" fill="#fff" stroke="#1a1a1a" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
    const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const crownHTML = h => `<div class="csc-crown" aria-label="${esc(h.place)} — ${esc(h.name)}">${crownSVG}<div class="csc-crown-bubble">${bubbleSVG}<div class="csc-bubble-text"><span class="csc-bubble-place">${esc(h.place)}</span><span class="csc-bubble-name">${esc(h.name)}</span></div></div></div>`;

    csGrid.innerHTML = cards.map((c, i) => {
      const [r, g, b] = c.accent.split(',').map(s => s.trim());
      const colBack  = `rgba(${r},${g},${b},0.22)`;
      const colMid   = `rgba(${r},${g},${b},0.45)`;
      const colFront = `rgba(${r},${g},${b},0.70)`;
      const t0 = (c.thumbs || [])[0];
      const nav = c.page ? `data-page="${c.page}"` : c.url ? `data-url="${c.url}"` : '';
      const hoverMediaAttr = c.hoverVideo ? `data-hover-video="${c.hoverVideo}"` : '';
      return `<div class="cs-card" data-idx="${i}" style="left:0px;top:0px" data-reveal data-reveal-delay="${(i * 0.08).toFixed(2)}" ${nav}>
        <div class="csc-top">
          <div class="csc-header-row">
            <div class="csc-tags">${(c.tags||[]).map(t=>`<span class="csc-badge" style="background:#f0ede8;color:#666">${t}</span>`).join('')}</div>
            <span class="csc-meta">${c.meta.split('·')[0].trim()}</span>
          </div>
          <div class="csc-title">${c.title}</div>
          <div class="csc-desc">${c.desc}</div>
        </div>
        <div class="csc-img-panel" style="background:${c.panelBg || `rgba(${r},${g},${b},0.18)`}" ${hoverMediaAttr}>
          ${t0 ? `<img class="csc-static" src="${t0}" alt="${c.title}" loading="lazy" />` : ''}
          ${c.hoverVideo ? (c.videoFit === 'contain'
            ? `<video class="csc-vid csc-vid-contain" src="${c.hoverVideo}" muted playsinline loop preload="none"></video>`
            : `<video class="csc-vid" src="${c.hoverVideo}" muted playsinline loop preload="none" style="object-fit:${c.videoFit || 'cover'};${c.videoScale ? `transform:scale(${c.videoScale});` : ''}"></video>`) : ''}
        </div>
        ${c.hackathon ? crownHTML(c.hackathon) : ''}
      </div>`;
    }).join('');

    // Layout is handled by CSS (2×2 grid — see .cs-zone .cs-inline-grid).

    // Click to navigate.
    csGrid.querySelectorAll('.cs-card').forEach((card) => {
      card.addEventListener('click', () => {
        if (card.dataset.page) window.location = card.dataset.page;
        else if (card.dataset.url) window.open(card.dataset.url, '_blank');
      });
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

    // Hover video: play on mouseenter, pause+reset on mouseleave
    csGrid.querySelectorAll('.csc-img-panel[data-hover-video]').forEach(panel => {
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
  }

  // Art Ring — continuously rotating orbit of art cards
  const ringStage = document.getElementById('ring-stage');
  if (ringStage) {
    // Personal photos for the hero arc — kept separate from CREATIVE_ASSETS (which
    // feeds the Archive) so the two change independently. Order is intentional; the
    // arc holds exactly these 15, evenly spaced. Optimized copies live in
    // assets/hero-arc/ (milk-tea, salt-bread, and the four .webp were converted
    // from .HEIC); the full-res originals stay in assets/other pictures/ for re-cropping.
    const ARC_PHOTOS = [
      { img: 'assets/hero-arc/adobe-symposium.webp',       caption: 'adobe ai symposium, 2025' },
      { img: 'assets/hero-arc/desolation-wilderness.webp', caption: 'desolation wilderness, no signal' },
      { img: 'assets/hero-arc/mdes-cohort.webp',           caption: 'mdes cohort all together' },
      { img: 'assets/hero-arc/elastic-mind.webp',          caption: 'design and the elastic mind' },
      { img: 'assets/hero-arc/materials-library.webp',     caption: 'the materials library @ sjsu' },
      { img: 'assets/hero-arc/mdes-at-adobe.webp',         caption: 'mdes cohort @ adobe' },
      { img: 'assets/hero-arc/mdes-bffs.webp',             caption: 'found my people' },
      { img: 'assets/hero-arc/milk-tea.webp',              caption: 'the most peak tea ever' },
      { img: 'assets/hero-arc/salt-bread.webp',            caption: 'homemade salt bread!!' },
      { img: 'assets/hero-arc/sjhacks.webp',               caption: 'sjhacks 2026' },
      { img: 'assets/hero-arc/torii-gates.webp',           caption: 'torii gates, japan' },
      { img: 'assets/hero-arc/hotpot.webp',               caption: 'i love hotpot' },
      { img: 'assets/hero-arc/if-ykyk.webp',              caption: 'if ykyk' },
      { img: 'assets/hero-arc/baby-suna.webp',            caption: 'my baby suna' },
      { img: 'assets/hero-arc/pokemon-card.webp',         caption: 'my prized piplup' },
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
    bgAudio.play().catch(() => { musicPlaying = false; disc?.classList.remove('spinning'); waveform?.classList.remove('playing'); tonearm?.classList.remove('playing'); });
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
      const px = 100 + Math.random() * (window.innerWidth  - 250);
      const py = 100 + Math.random() * (window.innerHeight - 250);
      placeSticker(file, px, py);
      // tiny pop on the thumbnail
      cell.style.transform = 'scale(0.88)';
      setTimeout(() => cell.style.transform = '', 150);
    });
    grid.appendChild(cell);
  });
}

function placeSticker(file, x, y) {
  const el = document.createElement('div');
  el.className = 'desktop-sticker-placed';
  el.style.left = Math.round(x) + 'px';
  el.style.top  = Math.round(y) + 'px';

  const sImg = document.createElement('img');
  sImg.src = 'assets/stickers/' + file;
  sImg.draggable = false;
  el.appendChild(sImg);

  el.addEventListener('dblclick', () => el.remove());

  let dx=0, dy=0, dragging=false;
  el.addEventListener('mousedown', ev => {
    if (ev.button !== 0) return;
    dragging = true;
    dx = ev.clientX - el.offsetLeft;
    dy = ev.clientY - el.offsetTop;
    el.classList.add('dragging');
    ev.preventDefault();
  });
  document.addEventListener('mousemove', ev => {
    if (!dragging) return;
    el.style.left = (ev.clientX - dx) + 'px';
    el.style.top  = (ev.clientY - dy) + 'px';
  });
  document.addEventListener('mouseup', () => {
    if (dragging) { dragging = false; el.classList.remove('dragging'); }
  });

  document.body.appendChild(el);

  el.style.transform = 'scale(0) rotate(-12deg)';
  el.style.transition = 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)';
  requestAnimationFrame(() => requestAnimationFrame(() => { el.style.transform = ''; }));
}


// ── Custom Cursor ────────────────────────────────────────────
(function() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let ringX = 0, ringY = 0;

  document.addEventListener('mousemove', e => {
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
  if (e.target.closest('#cdplayer') || e.target.closest('#music-peeker')) return;
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
    const onGesture = () => {           // otherwise resume on first interaction
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
  // Delegated globally so it works for the stack item cards (built by
  // initStacks) as well as any other [data-mkw-open] trigger on the page.
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


// ── Archive of Work — stack browser (#marketing section) ──────────────────
// Builds the four stacks and their item drawer. EDIT CONTENT HERE: the STACKS
// array is the single source of truth for covers, titles, subtitles and items.
//   • cover  — swappable top-card asset (assets/stacks/<id>-cover.*)
//   • item.type 'link'  → external new tab, gets the ↗ badge
//   • item.type 'page'  → internal case-study page, same tab, no badge (item.href)
//   • item.type 'modal' → opens in place; item.key names an #mkw-panels panel
//     (panel-<key>). A modal item with key:null is a not-yet-wired placeholder.
//   • item.img null → neutral placeholder tile until a real image is dropped in.
// Subtitles marked PLACEHOLDER need final copy.
(function initStacks() {
  const stacksEl = document.getElementById('stacks');
  const drawer   = document.getElementById('stack-drawer');
  if (!stacksEl || !drawer) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Under-layers always render at this depth, regardless of how many items a
  // stack holds — so all four piles read as equally thick.
  const LAYER_DEPTH = 4;
  // First two indices are the "top row" of the ≤720px 2×2 fallback (used only
  // to place the drawer row-aware there; on desktop it's one flat row of four).
  const PER_ROW = 2;

  const STACKS = [
    {
      id: 'design',
      title: 'Design',
      subtitle: 'Product design & UX/UI case studies', // PLACEHOLDER copy
      cover: 'assets/product design stack cover.webp',
      items: [
        { title: 'soundbite', sub: 'Physical snack paired with audio', type: 'page',
          img: 'assets/case studies/soundbite/soundbite-thumb.webp',
          href: 'soundbite' },
        { title: 'Pantry Pop!', sub: 'Vibe-coded food blindbox simulator', type: 'link',
          img: 'assets/pantry pop widget cover.png',
          href: 'https://pantry-pop.netlify.app/' },
        { title: 'moove', sub: 'Mobility & flexibility app', type: 'link',
          img: 'assets/icons/moove-thumb.webp',
          href: 'https://www.figma.com/deck/3zplTzhPjCf7GXCt6mZaHF/Moove-Slide-Deck?node-id=1-259&t=Rtj5TUFG31wYuwHL-1&scaling=min-zoom&content-scaling=fixed&page-id=0%3A1' },
        { title: 'Past / Present / Future', sub: 'Tech across three generations', type: 'link',
          img: 'assets/icons/ppf-thumb.webp',
          href: 'https://www.figma.com/proto/MDJjsmm2Hyi5fHFBFJLIBn/m3-past-present-future-site?node-id=1-2&t=km5SQGWGHu2ioRcs-1&scaling=contain&content-scaling=fixed&page-id=0%3A1&starting-point-node-id=1%3A2&show-proto-sidebar=1' },
      ],
    },
    {
      id: 'marketing',
      title: 'Marketing & Branding',
      subtitle: 'Campaigns, brand identity & content', // PLACEHOLDER copy
      cover: 'assets/marketing & brand stack cover.webp',
      items: [
        // Item thumbnails ("covers") pulled from each item's OWN modal content —
        // swappable slots: drop custom cover art in here to override.
        { title: 'Little Wins Bakehouse', sub: 'Brand identity & packaging', type: 'modal', key: 'lwb', img: 'assets/little wins bakehouse/new flavor announcements/5.webp' },
        { title: 'Nora AI', sub: 'UX/UI & marketing content', type: 'modal', key: 'nora', img: 'assets/thumbs/nora-yt-thumb.jpg' },
        { title: 'HALIENE', sub: 'Concert content & merch', type: 'modal', key: 'haliene', img: 'assets/thumbs/haliene jersey.webp' },
        { title: 'Alpha Phi Omega', sub: 'Rush graphics & event media', type: 'modal', key: 'apo', img: 'assets/stacks/art/gd-fall-rush.webp' },
        // @visualsbyskn moved to the Photo & Video stack (below) — modal unchanged.
        { title: 'Designer Drains', sub: 'Storefront UI & email', type: 'modal', key: 'designer-drains', img: 'assets/thumbs/designer drains amazon storefront.webp' },
      ],
    },
    {
      id: 'photo-video',
      title: 'Photo & Video',
      subtitle: 'Photography & videography',
      cover: 'assets/photos & videos stack cover.webp',
      // @visualsbyskn (moved from Marketing, modal unchanged) + photos migrated
      // from the hero arc.
      items: [
        // Cover pulled from content — swappable slot. Note: every ph-* photo is
        // also a Photo item below, so this thumbnail duplicates one; swap in a
        // unique cover (e.g. the @visualsbyskn avatar) here to avoid that.
        { title: '@visualsbyskn', sub: 'Graduation & portrait photography', type: 'modal', key: 'photography', img: 'assets/stacks/photo-video/ph-couple.webp' },
        { title: 'Sunset', sub: 'Nikon Z7, Lightroom · 2022', type: 'modal', key: 'pv-01', img: 'assets/stacks/photo-video/ph-sunset.webp' },
        { title: 'Confetti', sub: 'iPhone, Lightroom · 2023', type: 'modal', key: 'pv-02', img: 'assets/stacks/photo-video/ph-confetti.webp' },
        { title: 'Koi', sub: 'Nikon Z7, Lightroom · 2025', type: 'modal', key: 'pv-03', img: 'assets/stacks/photo-video/ph-koi.webp' },
        { title: 'Bryant', sub: 'iPhone, Lightroom · 2025', type: 'modal', key: 'pv-04', img: 'assets/stacks/photo-video/ph-bryant.webp' },
        { title: 'Joshua', sub: 'Canon, Lightroom · 2021', type: 'modal', key: 'pv-05', img: 'assets/stacks/photo-video/ph-joshua.webp' },
        { title: 'Temple', sub: 'Nikon Z7, Lightroom · 2025', type: 'modal', key: 'pv-06', img: 'assets/stacks/photo-video/ph-temple.webp' },
        { title: 'Space Needle', sub: 'Nikon Z7, Lightroom · 2024', type: 'modal', key: 'pv-07', img: 'assets/stacks/photo-video/ph-space-needle.webp' },
        { title: 'Vendor', sub: 'Nikon Z7, Lightroom · 2025', type: 'modal', key: 'pv-08', img: 'assets/stacks/photo-video/ph-vendor.webp' },
        { title: 'Friends', sub: 'Nikon Z7, Lightroom · 2025', type: 'modal', key: 'pv-10', img: 'assets/stacks/photo-video/ph-friends.webp' },
        { title: 'Glitter', sub: 'Nikon Z7, Lightroom · 2023', type: 'modal', key: 'pv-11', img: 'assets/stacks/photo-video/ph-glitter.webp' },
        { title: 'Flowers', sub: 'Nikon Z7, Lightroom · 2024', type: 'modal', key: 'pv-12', img: 'assets/stacks/photo-video/ph-flowers.webp' },
        { title: 'Champagne', sub: 'Nikon Z7, Lightroom · 2022', type: 'modal', key: 'pv-13', img: 'assets/stacks/photo-video/ph-champagne.webp' },
        { title: 'Celebrate', sub: 'Nikon Z7, Lightroom · 2022', type: 'modal', key: 'pv-14', img: 'assets/stacks/photo-video/ph-grad-conf.webp' },
        { title: 'Bffs', sub: 'Nikon Z7, Lightroom · 2023', type: 'modal', key: 'pv-15', img: 'assets/stacks/photo-video/ph-bffs.webp' },
        { title: 'Hugs', sub: 'Nikon Z7, Lightroom · 2021', type: 'modal', key: 'pv-16', img: 'assets/stacks/photo-video/ph-hugs.webp' },
      ],
    },
    {
      id: 'art',
      title: 'Art & Graphic Design',
      subtitle: 'Illustration & graphic design',
      cover: 'assets/art & graphics stack cover.webp',
      // Graphic design + artwork migrated from the hero arc.
      items: [
        { title: 'UCR Alpha Phi Omega Rush Flyer', sub: 'Canva, Procreate, Photoshop · 2023', type: 'modal', key: 'ag-01', img: 'assets/stacks/art/gd-fall-rush.webp' },
        { title: 'Designer Drains Product Brochure', sub: 'Canva, Photoshop · 2025', type: 'modal', key: 'ag-02', img: 'assets/stacks/art/gd-brochure.webp' },
        { title: 'UCR Alpha Phi Omega Rush Flyer', sub: 'Canva, Medibang Paint Pro · 2022', type: 'modal', key: 'ag-03', img: 'assets/stacks/art/gd-spring-rush.webp' },
        { title: 'UCR ASPB Spring Quarter Campaign', sub: 'Photoshop · 2022', type: 'modal', key: 'ag-04', img: 'assets/stacks/art/gd-aspb.webp' },
        { title: 'UCR ASPB Mock Concert Flyer', sub: 'Illustrator · 2022', type: 'modal', key: 'ag-05', img: 'assets/stacks/art/gd-concert.webp' },
        { title: 'Adobe Ambassador Flyer', sub: 'Illustrator, Canva · 2025', type: 'modal', key: 'ag-06', img: 'assets/stacks/art/adobe ambassador flyer.webp' },
        { title: 'Fruit Plate Illustration', sub: 'Procreate · 2026', type: 'modal', key: 'ag-07', img: 'assets/stacks/art/fruit plate illustration.webp' },
        { title: 'Music Album Illustration', sub: 'Medibang Paint Pro · 2022', type: 'modal', key: 'ag-08', img: 'assets/stacks/art/art-music-album.webp' },
        { title: 'Official Jersey for HALIENE Water EP', sub: 'Procreate, Photoshop · 2025', type: 'modal', key: 'ag-09', img: 'assets/stacks/art/art-haliene.webp' },
        { title: 'Tree Illustration', sub: 'Procreate · 2025', type: 'modal', key: 'ag-10', img: 'assets/stacks/art/art-tree.webp' },
      ],
    },
  ];

  let activeId = null;

  // Under-layer markup — pulled from the stack's OWN item thumbnails so the
  // spread-on-hover reveals real work, not neutral fills. The four DOM slots map
  // to fixed scatter/z-index classes (see CSS); we always emit LAYER_DEPTH of
  // them, cycling the available images if a stack has fewer, so every pile reads
  // at equal depth. The <img> is inside an absolutely-positioned, transform-only
  // layer → it can never affect the stack's box size. Non-interactive: the whole
  // stack is one hit target (pointer-events on the layers is off in CSS).
  const LAYER_CLASS = ['stack-layer-3', 'stack-layer-4', 'stack-layer-1', 'stack-layer-2'];
  function buildLayers(stack) {
    const imgs = stack.items.map(it => it.img).filter(Boolean);
    let html = '';
    for (let n = 0; n < LAYER_DEPTH; n++) {
      const src = imgs.length ? imgs[n % imgs.length] : null;
      html += '<div class="stack-layer ' + LAYER_CLASS[n] + '" aria-hidden="true">' +
                (src ? '<img src="' + src + '" alt="" loading="lazy" />' : '') +
              '</div>';
    }
    return html;
  }

  // ── Build the single row of four stacks ──
  STACKS.forEach((stack, idx) => {
    const el = document.createElement('div');
    el.className = 'stack';
    el.dataset.stack = stack.id;
    el.dataset.index = idx;
    el.style.order = idx + 1;   // keeps the drawer's CSS order slot deterministic
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-pressed', 'false');
    el.setAttribute('aria-label', 'Open ' + stack.title);
    el.innerHTML =
      '<div class="stack-pile">' +
        buildLayers(stack) +
        '<div class="stack-cover"><img src="' + stack.cover + '" alt="' + stack.title + '" /></div>' +
      '</div>' +
      '<div class="stack-label"></div>';
    // Titles removed — the cover art carries the category name now. The label
    // (former subtitle) is the only text; the accessible name lives on the
    // stack's aria-label + the cover img alt, so screen readers still get it.
    el.querySelector('.stack-label').textContent = stack.subtitle;
    el.addEventListener('click', () => toggleStack(stack.id));
    el.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStack(stack.id); }
    });
    stacksEl.insertBefore(el, drawer);   // stacks before the drawer → drawer stays last
  });

  // ── Hand-drawn outline on each stack COVER ──
  // The SAME shared pen as the case-study cards (window.__handStroke). The covers
  // are much smaller than the cards (~176px vs ~388px), and the pen's amplitudes
  // are absolute px, so the raw hand reads ~2× heavier/wobblier here. To keep the
  // CHARACTER but the cards' restraint, we scale only the size-dependent amplitudes
  // (wobble, weight, weight-swell, corner + end overshoot) by cover/card size —
  // i.e. the cover reads like the same hand "photographed smaller." The frequency
  // and taper ratios are scale-invariant and stay put, so the number of wobbles and
  // the tapering ends are unchanged. Only the per-stack seed differs so the four
  // don't look stamped.
  //
  // Covers ONLY — the under-layers stay bare (real images at lowered opacity).
  // The SVG lives in .stack-pile (overflow:visible) rather than inside .stack-cover
  // (overflow:hidden would clip the overshoot + non-closure), pinned to the cover's
  // box at inset:0 and sitting just above it. The cover doesn't move on hover — only
  // the layers spread — so an inset:0 SVG rides with the cover automatically.
  //
  // Authored at the cover's OWN live pixel size with a 1:1 viewBox and refit on
  // load/resize — same approach as buildCardOutline; the scale tracks --stack-size
  // (176px desktop / 132px on the ≤720px 2×2) so the restraint holds at any size.
  const SVGNS = 'http://www.w3.org/2000/svg';
  const CARD_REF = 388;   // representative case-study card size the pen was tuned at
  function buildStackOutline(stackEl) {
    const pen = window.__handStroke;
    const pile = stackEl && stackEl.querySelector('.stack-pile');
    if (!pen || !pile) return;
    const w = Math.round(pile.offsetWidth), h = Math.round(pile.offsetHeight);
    if (!w || !h) return;                          // hidden (e.g. mobile canvas) — skip
    let svg = pile.querySelector('.stack-outline');
    if (svg && +svg.dataset.w === w && +svg.dataset.h === h) return; // box unchanged
    // Scale the absolute-px amplitudes down to the cover's proportion of a card.
    const B = pen.PEN, s = w / CARD_REF;
    const over = {
      AMPLITUDE:        B.AMPLITUDE * s,
      WEIGHT:           B.WEIGHT * s,
      WEIGHT_VARIATION: B.WEIGHT_VARIATION * s,
      CORNER_OVERSHOOT: B.CORNER_OVERSHOOT * s,
      END_OVERSHOOT:    B.END_OVERSHOOT * s,
    };
    // r 18 ≈ the cover's own --cover-radius; ins -1 traces just outside the edge.
    const d = pen((+stackEl.dataset.index || 0) * 13 + 7, w, h, 18, -1, over);
    if (!svg) {
      svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'stack-outline');
      svg.setAttribute('aria-hidden', 'true');
      pile.appendChild(svg);                       // last child → above the cover
    }
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.width = w + 'px';
    svg.style.height = h + 'px';
    svg.dataset.w = w; svg.dataset.h = h;
    svg.innerHTML = `<path d="${d}" fill="#1a1a1a"/>`;
  }
  const stackEls = stacksEl.querySelectorAll('.stack');
  const buildAllOutlines = () => stackEls.forEach(buildStackOutline);
  buildAllOutlines();                              // reading offsetWidth forces layout
  window.addEventListener('load', buildAllOutlines);
  if ('ResizeObserver' in window) {
    const ro = new ResizeObserver(entries => entries.forEach(e => {
      const st = e.target.closest('.stack'); if (st) buildStackOutline(st);
    }));
    stackEls.forEach(st => { const p = st.querySelector('.stack-pile'); if (p) ro.observe(p); });
  }
  window.addEventListener('resize', buildAllOutlines);

  // ── Item card ──
  function itemCard(item, i) {
    const isAnchor = item.type === 'link' || item.type === 'page';
    const el = isAnchor ? document.createElement('a') : document.createElement('div');
    el.className = 'stack-item pcard';
    el.style.setProperty('--i', i);

    const imgWrap = document.createElement('div');
    imgWrap.className = 'pcard-img';
    if (item.img) {
      const img = document.createElement('img');
      img.src = item.img; img.alt = item.title; img.loading = 'lazy';
      imgWrap.appendChild(img);
    } else {
      const ph = document.createElement('div');
      ph.className = 'stack-item-ph';
      ph.style.width = '100%'; ph.style.height = '100%';
      ph.textContent = item.title;
      imgWrap.appendChild(ph);
    }

    const titleEl = document.createElement('div');
    titleEl.className = 'pcard-title'; titleEl.textContent = item.title;
    const subEl = document.createElement('div');
    subEl.className = 'pcard-sub'; subEl.textContent = item.sub;

    if (item.type === 'link') {
      // ↗ badge — external links only. New-tab intent shown before the click.
      const arrow = document.createElement('span');
      arrow.className = 'stack-item-arrow'; arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = '↗';
      imgWrap.appendChild(arrow);
      el.setAttribute('href', item.href);
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    } else if (item.type === 'page') {
      // Internal case-study page — same-tab navigation, no ↗ badge.
      el.setAttribute('href', item.href);
    } else if (item.key) {
      // Modal — reuses the #mkw-panels system via document-delegated handler.
      el.setAttribute('role', 'button');
      el.setAttribute('tabindex', '0');
      el.setAttribute('data-mkw-open', item.key);
      el.setAttribute('aria-haspopup', 'dialog');
      el.setAttribute('aria-controls', 'panel-' + item.key);
      el.setAttribute('aria-label', 'Open ' + item.title);
    }
    // (modal item with key:null → inert placeholder, no handler)

    el.appendChild(imgWrap);
    el.appendChild(titleEl);
    el.appendChild(subEl);
    return el;
  }

  // ── Drawer render — spill the stack's items as a wrapping grid ──
  // One drawer, always directly below the single row. On the ≤720px 2×2 the
  // drawer is slotted row-aware in CSS via [data-active-row]; the JS just says
  // which row the active stack sits in.
  function renderDrawer(stack, index) {
    drawer.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'stack-grid';
    stack.items.forEach((it, i) => grid.appendChild(itemCard(it, i)));
    drawer.appendChild(grid);
    stacksEl.dataset.activeRow = index < PER_ROW ? 'top' : 'bottom';

    // enter animation (capped stagger, handled in CSS)
    drawer.classList.remove('is-leaving');
    if (!reduceMotion) {
      drawer.classList.add('is-entering');
      // Longest card: delay(≈0.48s) + duration(0.32s); clear the flag after.
      setTimeout(() => drawer.classList.remove('is-entering'), 1000);
    }
  }

  // ── Open / close / switch (AnimatePresence-style) ──
  function toggleStack(id) {
    if (activeId === id) { closeStack(); return; }
    const prevActive = activeId;
    activeId = id;
    const index = STACKS.findIndex(s => s.id === id);
    STACKS.forEach(s => {
      const el = stacksEl.querySelector('[data-stack="' + s.id + '"]');
      const on = s.id === id;
      el.classList.toggle('is-active', on);
      el.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const stack = STACKS[index];
    if (prevActive && !reduceMotion) {
      if (drawer.children.length) drawer.classList.add('is-leaving');  // animate outgoing grid out
      setTimeout(() => renderDrawer(stack, index), 200);               // then swap in the new one
    } else {
      renderDrawer(stack, index);
    }
  }

  function closeStack() {
    activeId = null;
    STACKS.forEach(s => {
      const el = stacksEl.querySelector('[data-stack="' + s.id + '"]');
      el.classList.remove('is-active');
      el.setAttribute('aria-pressed', 'false');
    });
    if (!drawer.children.length) return;
    if (!reduceMotion) {
      drawer.classList.add('is-leaving');
      setTimeout(() => { drawer.innerHTML = ''; drawer.classList.remove('is-leaving'); }, 200);
    } else {
      drawer.innerHTML = '';
    }
    delete stacksEl.dataset.activeRow;
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
