/* ══════════════════════════════════════════════════════════
   sydney's desktop — faithful Figma implementation
   ══════════════════════════════════════════════════════════ */

// ── Canvas Scaling ──────────────────────────────────────────
// Three-column layout — no scaling needed.
// Columns compress toward each other via CSS max()/vw.
function scaleCanvas() {
  const BASE = 1800;
  const scale = Math.min(1.05, Math.max(0.60, window.innerWidth / BASE));
  const canvas = document.getElementById('desktop-canvas');
  if (canvas) canvas.style.zoom = scale;
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
  'iterait':   'assets/case studies/iterait/iterait-thumb.png',
  'room2talk': 'assets/case studies/room2talk/r2t-hero.png',
  'voqa':      'assets/case studies/voqa/voqa-thumb.png',
  'sunright':  'assets/icons/sunright-thumb.png',
  'moove':     'assets/icons/moove-thumb.webp',
  'soundbite': 'assets/case studies/soundbite/soundbite-thumb.png',
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
    link: 'iterait.html',
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
    link: 'room2talk.html',
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
    link: 'voqa.html',
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
    link: 'soundbite.html',
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
      { name: 'Concept Map.png',      thumb: 'assets/graphic design/gd-concept-map.png' },
      { name: 'APO Fall Rush.png',    thumb: 'assets/graphic design/gd-fall-rush.png' },
      { name: 'Product Brochure.png', thumb: 'assets/graphic design/gd-brochure.png' },
      { name: 'APO Spring Rush.png',  thumb: 'assets/graphic design/gd-spring-rush.png' },
      { name: 'UCR ASPB Flyer.png',   thumb: 'assets/graphic design/gd-aspb.png' },
      { name: 'Concert Flyer.png',    thumb: 'assets/graphic design/gd-concert.png' },
      { name: 'Adobe Ambassador Flyer.png', thumb: 'assets/graphic design/adobe ambassador flyer.png' },
      { name: 'Fruit Plate Illustration.png', thumb: 'assets/graphic design/fruit plate illustration.png' },
    ],
    rows: [
      [
        { img: 'assets/graphic design/gd-fall-rush.png', title: 'UCR Alpha Phi Omega Rush Flyer', medium: 'Canva, Procreate, Photoshop', year: '2023' },
        { img: 'assets/graphic design/gd-brochure.png', title: 'Designer Drains Product Brochure', medium: 'Canva, Photoshop', year: '2025' },
      ],
      [
        { img: 'assets/graphic design/gd-spring-rush.png', title: 'UCR Alpha Phi Omega Rush Flyer', medium: 'Canva, Medibang Paint Pro', year: '2022' },
        { img: 'assets/graphic design/gd-aspb.png', title: 'UCR ASPB Spring Quarter Campaign', medium: 'Photoshop', year: '2022' },
        { img: 'assets/graphic design/gd-concert.png', title: 'UCR ASPB Mock Concert Flyer', medium: 'Illustrator', year: '2022' },
      ],
      [
        { img: 'assets/graphic design/adobe ambassador flyer.png', title: 'Adobe Ambassador Flyer', medium: 'Illustrator, Canva', year: '2025' },
        { img: 'assets/graphic design/fruit plate illustration.png', title: 'Fruit Plate Illustration', medium: 'Procreate', year: '2026' },
      ],
    ]
  },
  artwork: {
    title: 'Artwork',
    subtitle: 'Personal, expressive work where I explore mood, color, and storytelling.',
    files: [
      { name: 'Music Album.png',   thumb: 'assets/graphic design/art-music-album.png' },
      { name: 'HALIENE Jersey.png',thumb: 'assets/graphic design/art-haliene.png' },
      { name: 'Tree Illust.png',   thumb: 'assets/graphic design/art-tree.png' },
      { name: '3D Lofi Room.mov',  thumb: null },
    ],
    rows: [
      [
        { img: 'assets/graphic design/art-music-album.png', title: 'Music Album Illustration', medium: 'Medibang Paint Pro', year: '2022', tall: true },
        { img: 'assets/graphic design/art-haliene.png', title: 'Official Jersey for HALIENE Water EP', medium: 'Procreate, Photoshop', year: '2025', tall: true },
      ],
      [
        { img: 'assets/graphic design/art-tree.png', title: 'Tree Illustration', medium: 'Procreate', year: '2025' },
        { img: null, title: 'Cozy Lofi Room — 3D Model Animation', medium: 'Blender, Capcut', year: '2023', empty: true },
      ],
    ]
  },
  photo: {
    title: 'Photography',
    subtitle: 'Capturing people, places, and moments that inspire my design perspective.',
    files: [
      { name: 'Sunset Beach.png',   thumb: 'assets/photography/ph-sunset.png' },
      { name: 'Concert.png',        thumb: 'assets/photography/ph-confetti.png' },
      { name: 'Koi Fish.png',       thumb: 'assets/photography/ph-koi.png' },
      { name: 'Bryant Barnes.png',  thumb: 'assets/photography/ph-bryant.png' },
      { name: 'Joshua Tree.png',    thumb: 'assets/photography/ph-joshua.png' },
      { name: 'Temple.png',         thumb: 'assets/photography/ph-temple.png' },
    ],
    rows1: [
      { src: 'assets/photography/ph-sunset.png',       year: '2022' },
      { src: 'assets/photography/ph-confetti.png',     year: '2023', medium: 'iPhone, Lightroom' },
      { src: 'assets/photography/ph-koi.png',          year: '2025' },
      { src: 'assets/photography/ph-bryant.png',       year: '2025', medium: 'iPhone, Lightroom' },
      { src: 'assets/photography/ph-joshua.png',       year: '2021' },
      { src: 'assets/photography/ph-temple.png',       year: '2025' },
      { src: 'assets/photography/ph-space-needle.png', year: '2024' },
      { src: 'assets/photography/ph-vendor.png',       year: '2025' },
    ],
    rows2: [
      { src: 'assets/photography/ph-couple.png',    year: '2025' },
      { src: 'assets/photography/ph-friends.png',   year: '2025' },
      { src: 'assets/photography/ph-glitter.png',   year: '2023' },
      { src: 'assets/photography/ph-flowers.png',   year: '2024' },
      { src: 'assets/photography/ph-champagne.png', year: '2022' },
      { src: 'assets/photography/ph-grad-conf.png', year: '2022' },
      { src: 'assets/photography/ph-bffs.png',      year: '2023' },
      { src: 'assets/photography/ph-hugs.png',      year: '2021' },
    ]
  }
};

// ── Creative overlay data ────────────────────────────────────
const CR_DATA = {
  graphic: {
    title: 'Graphic Design',
    section: 'Recents',
    files: [
      { name: 'Concept Map.png',     fullname: 'MDes Thesis Concept Map',                  size: 'PNG image · 11.4 MB', img: 'assets/graphic design/gd-concept-map.png' },
      { name: 'APO Fall Rush.png',   fullname: 'Alpha Phi Omega Fall Rush Flyer',           size: 'PNG image · 495 KB',  img: 'assets/graphic design/gd-fall-rush.png' },
      { name: 'Product Brochure.png',fullname: 'Designer Drains Product Brochure',          size: 'PNG image · 239 KB',  img: 'assets/graphic design/gd-brochure.png' },
      { name: 'APO Spring Rush.png', fullname: 'Alpha Phi Omega Spring Rush Flyer',         size: 'PNG image · 439 KB',  img: 'assets/graphic design/gd-spring-rush.png' },
      { name: 'UCR ASPB Flyer.png',  fullname: 'UCR ASPB Spring Quarter Initiative Flyer', size: 'PNG image · 683 KB',  img: 'assets/graphic design/gd-aspb.png' },
      { name: 'Concert Flyer.png',   fullname: 'UCR ASPB Mock Concert Flyer',              size: 'PNG image · 899 KB',  img: 'assets/graphic design/gd-concert.png' },
      { name: 'Adobe Ambassador Flyer.png', fullname: 'Adobe Ambassador Flyer', size: 'PNG image · 512 KB', img: 'assets/graphic design/adobe ambassador flyer.png' },
      { name: 'Fruit Plate Illustration.png', fullname: 'Fruit Plate Illustration', size: 'PNG image · 478 KB', img: 'assets/graphic design/fruit plate illustration.png' },
    ]
  },
  artwork: {
    title: 'Artwork',
    section: 'Recents',
    files: [
      { name: 'Music Album.png',       fullname: 'Music Album Cover Art for LiiO',              size: 'PNG image · 899 KB', img: 'assets/graphic design/art-music-album.png', medium: 'Medibang Paint Pro · 2022' },
      { name: 'HALIENE Jersey.png',    fullname: 'Official Jersey Design for HALIENE Water EP', size: 'PNG image · 3.2 MB', img: 'assets/graphic design/art-haliene.png', medium: 'Procreate, Photoshop · 2025' },
      { name: 'Tree Illustration.png', fullname: 'Tree Illustration',                           size: 'PNG image · 510 KB', img: 'assets/graphic design/art-tree.png' },
      { name: '3D Lofi Room.mov',      fullname: '3D Cozy Lofi Room Animation',                 size: 'Movie · 2.3 MB',    img: null, youtube: 'https://www.youtube.com/embed/ilMLzSr8t4w?autoplay=1' },
    ]
  },
  photo: {
    title: 'Photography',
    sections: [
      {
        label: 'Outside',
        files: [
          { name: 'Sunset Beach.png',     fullname: 'Sunset Beach',     size: 'PNG image · 899 KB', img: 'assets/photography/ph-sunset.png' },
          { name: 'Concert Confetti.png', fullname: 'Concert Confetti', size: 'PNG image · 899 KB', img: 'assets/photography/ph-confetti.png' },
          { name: 'Koi Fish.png',         fullname: 'Koi Fish',         size: 'PNG image · 899 KB', img: 'assets/photography/ph-koi.png' },
          { name: 'Bryant Barnes.png',    fullname: 'Bryant Barnes',    size: 'PNG image · 899 KB', img: 'assets/photography/ph-bryant.png' },
          { name: 'Joshua Tree.png',      fullname: 'Joshua Tree',      size: 'PNG image · 899 KB', img: 'assets/photography/ph-joshua.png' },
          { name: 'Temple.png',           fullname: 'Temple',           size: 'PNG image · 899 KB', img: 'assets/photography/ph-temple.png' },
          { name: 'Space Needle.png',     fullname: 'Space Needle',     size: 'PNG image · 899 KB', img: 'assets/photography/ph-space-needle.png' },
          { name: 'Street Vendor.png',    fullname: 'Street Vendor',    size: 'PNG image · 899 KB', img: 'assets/photography/ph-vendor.png' },
        ]
      },
      {
        label: 'Graduation',
        files: [
          { name: 'Couple.png',        fullname: 'Couple',        size: 'PNG image · 899 KB', img: 'assets/photography/ph-couple.png' },
          { name: 'Friend Group.png',  fullname: 'Friend Group',  size: 'PNG image · 899 KB', img: 'assets/photography/ph-friends.png' },
          { name: 'Glitter.png',       fullname: 'Glitter',       size: 'PNG image · 553 KB', img: 'assets/photography/ph-glitter.png' },
          { name: 'Spring Flowers.png',fullname: 'Spring Flowers',size: 'PNG image · 489 KB', img: 'assets/photography/ph-flowers.png' },
          { name: 'Champagne.png',     fullname: 'Champagne',     size: 'PNG image · 435 KB', img: 'assets/photography/ph-champagne.png' },
          { name: 'Confetti.png',      fullname: 'Confetti',      size: 'PNG image · 497 KB', img: 'assets/photography/ph-grad-conf.png' },
          { name: 'BFFs.png',          fullname: 'BFFs',          size: 'PNG image · 392 KB', img: 'assets/photography/ph-bffs.png' },
          { name: 'Hugs.png',          fullname: 'Hugs',          size: 'PNG image · 497 KB', img: 'assets/photography/ph-hugs.png' },
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
  // Case study inline cards
  const csGrid = document.getElementById('cs-inline-grid');
  if (csGrid) {
    const cards = [
      { key:'voqa',      page:'voqa.html',      title:'VOQA',        meta:'Team · Oct–Dec 2025 · 10 Wks', tags:['Mobile App'],        thumbs:['assets/case studies/voqa/voqa-thumb.png', null, null], hoverVideo:'assets/case studies/voqa/voqa final screen video - home page.mp4', desc:'Making museum experiences more inclusive and accessible.',              accent:'90,  185, 140' },
      { key:'iterait',   page:'iterait.html', title:'iterait', meta:'Solo · 2025', tags:['AI','Software'], tagColor:{bg:'#D9FCFF',text:'#006070'}, thumbs:['assets/case studies/iterait/iterait cover image.png', 'assets/case studies/iterait/iterait case study photo 1.png', 'assets/case studies/iterait/iterait case study photo 2.png'], hoverVideo:'assets/case studies/iterait/iterait cover video.mp4', desc:'Track, compare, and reuse iterations in AI-driven design workflows.', accent:'155, 175, 230' },
      { key:'room2talk', page:'room2talk.html', title:'room2talk',   meta:'Solo · March 2026 · 4 Wks',   tags:['Thesis','Web-Game'], thumbs:['assets/case studies/room2talk/r2t-hero.png',   null, null], hoverVideo:'assets/case studies/room2talk/room2talk cover video.mp4', desc:'Reflection-based card experience for intergenerational communication.', accent:'239, 155, 184' },
      { key:'soundbite', page:'soundbite.html', title:'soundbite', meta:'Solo · Concept', tags:['Concept','Sensory Design'], tagColor:{bg:'#FFF0C4',text:'#7a5010'}, thumbs:['assets/soundbite/6.png', null, null], hoverVideo:'assets/case studies/soundbite/soundbite - customize your soundbite experience video.mp4', desc:'Snack and sound pairings for immersive, mood-based audio experiences.', accent:'240, 180, 90' },
    ];
    csGrid.innerHTML = cards.map((c, i) => {
      const [r, g, b] = c.accent.split(',').map(s => s.trim());
      const colBack  = `rgba(${r},${g},${b},0.22)`;
      const colMid   = `rgba(${r},${g},${b},0.45)`;
      const colFront = `rgba(${r},${g},${b},0.70)`;
      const t0 = (c.thumbs || [])[0];
      const nav = c.page ? `data-page="${c.page}"` : c.url ? `data-url="${c.url}"` : '';
      const hoverMediaAttr = c.hoverVideo ? `data-hover-video="${c.hoverVideo}"` : '';
      return `<div class="cs-card" data-idx="${i}" style="left:0px;top:0px" ${nav}>
        <div class="csc-top">
          <div class="csc-header-row">
            <div class="csc-tags">${(c.tags||[]).map(t=>{const bg=c.tagColor?c.tagColor.bg:`rgba(${r},${g},${b},0.18)`;const col=c.tagColor?c.tagColor.text:`rgb(${Math.round(r*0.55)},${Math.round(g*0.55)},${Math.round(b*0.55)})`;return`<span class="csc-badge" style="background:${bg};color:${col}">${t}</span>`;}).join('')}</div>
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
      </div>`;
    }).join('');

    // Single-row layout — evenly spaced across full grid width
    function layoutCSCards() {
      const CARD_W = 260;
      const GAP    = 36;
      const gridW  = csGrid.offsetWidth;
      if (!gridW) return;
      const cards  = csGrid.querySelectorAll('.cs-card');
      const n      = cards.length;
      const totalW = CARD_W * n + GAP * (n - 1);
      const startX = Math.max(8, (gridW - totalW) / 2);
      cards.forEach((card, i) => {
        card.style.left = (startX + i * (CARD_W + GAP)) + 'px';
        card.style.top  = '20px';
      });
    }
    window.addEventListener('load', layoutCSCards);
    window.addEventListener('resize', layoutCSCards);
    if (document.readyState === 'complete') layoutCSCards();

    // Click to navigate
    csGrid.querySelectorAll('.cs-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.page) window.location = card.dataset.page;
        else if (card.dataset.url) window.open(card.dataset.url, '_blank');
      });
    });

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
    const artItems  = (CREATIVE_ASSETS.artwork.rows  || []).flat().filter(r => r.img);
    const gdItems   = (CREATIVE_ASSETS.graphic.rows  || []).flat().filter(r => r.img);
    const toPhotoItem = ({ src, year, medium }) => ({ img: src, title: src.split('/').pop().replace(/\.[^.]+$/, '').replace(/^ph-/, '').replace(/-/g,' ').replace(/\b\w/g, c => c.toUpperCase()), medium: medium || 'Nikon Z7, Lightroom', year });
    const outsidePhotos = (CREATIVE_ASSETS.photo.rows1 || []).map(toPhotoItem);
    const gradPhotos    = (CREATIVE_ASSETS.photo.rows2 || []).map(toPhotoItem);
    // Interleave all four groups so content types and photo subjects stay mixed
    function interleave(...groups) {
      const out = [];
      const max = Math.max(...groups.map(g => g.length));
      for (let i = 0; i < max; i++) {
        for (const g of groups) if (g[i]) out.push(g[i]);
      }
      return out;
    }
    const ringItems = interleave(gdItems, outsidePhotos, artItems, gradPhotos);

    const tooltip   = document.getElementById('ring-tooltip');
    const ttTitle   = document.getElementById('ring-tt-title');
    const ttMeta    = document.getElementById('ring-tt-meta');

    ringItems.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'ring-card';
      if (item.img) {
        card.innerHTML = `<img src="${item.img}" alt="${item.title}" loading="lazy" />`;
      } else {
        card.style.background = item.color || '#e0dcd8';
      }

      const metaStr = [item.medium, item.year].filter(Boolean).join(' · ');

      card.addEventListener('mouseenter', () => {
        ringPaused = true;
        ttTitle.textContent = item.title || '';
        ttMeta.textContent  = metaStr;
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
        openRingLightbox(item.img, item.title, metaStr);
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

// ── Panel positioning — anchors the panel directly above its trigger button,
// and caps its height so it never overflows above the viewport.
function positionPanelAboveButton(panel, btn) {
  const rect = btn.getBoundingClientRect();
  const gap = 10;
  panel.style.left = rect.left + 'px';
  panel.style.bottom = (window.innerHeight - rect.top + gap) + 'px';
  const available = rect.top - 20; // leave 20px breathing room from the viewport top
  panel.style.setProperty('--panel-max-h', Math.max(200, available) + 'px');
}

let openPanelPair = null; // { panel, btn } of whichever panel is currently open, for resize tracking
window.addEventListener('resize', () => {
  if (openPanelPair) positionPanelAboveButton(openPanelPair.panel, openPanelPair.btn);
});

// Collapse any expanded experience rows and scroll back to the top —
// so the panel resets to its default state every time it's closed.
function resetResumePanel(panel) {
  if (!panel || panel.id !== 'resume-panel') return;
  panel.querySelectorAll('.exp-row.exp-open').forEach(row => row.classList.remove('exp-open'));
  const inner = panel.querySelector('.resume-panel-inner');
  if (inner) inner.scrollTop = 0;
}

// Click anywhere outside the open panel/button pair closes it
document.addEventListener('click', (e) => {
  if (!openPanelPair) return;
  const { panel, btn } = openPanelPair;
  if (panel.contains(e.target) || btn.contains(e.target)) return;
  panel.classList.remove('open');
  btn.classList.remove('panel-open');
  resetResumePanel(panel);
  openPanelPair = null;
}, true);

// ── Experience panel toggle (fixed bottom-right button) ──────
function toggleResumePanel() {
  const panel  = document.getElementById('resume-panel');
  const btn    = document.getElementById('resume-peeker');
  if (!panel || !btn) return;
  // Close about panel if open
  const aboutPanel = document.getElementById('about-panel');
  if (aboutPanel && aboutPanel.classList.contains('open')) {
    aboutPanel.classList.remove('open');
    document.getElementById('about-peeker')?.classList.remove('panel-open');
  }
  const isOpen = panel.classList.toggle('open');
  if (isOpen) positionPanelAboveButton(panel, btn);
  else resetResumePanel(panel);
  openPanelPair = isOpen ? { panel, btn } : null;
  btn.classList.toggle('panel-open', isOpen);
}

function toggleAboutPanel() {
  const panel = document.getElementById('about-panel');
  const btn   = document.getElementById('about-peeker');
  if (!panel || !btn) return;
  // Close resume panel if open
  const resumePanel = document.getElementById('resume-panel');
  if (resumePanel && resumePanel.classList.contains('open')) {
    resumePanel.classList.remove('open');
    document.getElementById('resume-peeker')?.classList.remove('panel-open');
    resetResumePanel(resumePanel);
  }
  const isOpen = panel.classList.toggle('open');
  if (isOpen) positionPanelAboveButton(panel, btn);
  openPanelPair = isOpen ? { panel, btn } : null;
  btn.classList.toggle('panel-open', isOpen);
}

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
  { num:'01', title:'悲しい夢',     artist:'tavc city pop',       src:'assets/music/tavc city pop - 悲しい夢.mp3',      art:'assets/music/song 5 cover.png', color:'#302010' },
  { num:'02', title:'glitch',      artist:'alex morgan',        src:'assets/music/alex morgan - glitch.mp3',          art:'assets/music/song 1 cover.png', color:'#2e4d36' },
  { num:'03', title:'backyard',    artist:'lofium',              src:'assets/music/lofium - backyard.mp3',             art:'assets/music/song 2 cover.png', color:'#1e3050' },
  { num:'04', title:'city tour',   artist:'salaidawtsang11',     src:'assets/music/salaidawtsang11 - city tour.mp3',   art:'assets/music/song 3 cover.png', color:'#4a1e30' },
  { num:'05', title:'jazzy love',  artist:'sonican',             src:'assets/music/sonican - jazzy love.mp3',          art:'assets/music/song 4 cover.png', color:'#2a3a18' },
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
  'cat standing.png',
  'yellow music note.png',
  'blue guy.png',
  'cat wave.png',
  'purple heart.png',
  // row 1
  'pink start.png',
  'cat question.png',
  'cat thinking.png',
  'cat in box.png',
  'pink guy.png',
  // row 2
  'speech bubble.png',
  'green guy.png',
  'cat search.png',
  'orange guy.png',
  'green music note.png',
  // row 3 (4 stickers)
  'cat sitting.png',
  'cat pencil.png',
  'orange sparkle.png',
  'wide aqua guy.png',
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

// ── Ring profile photo — auto-flip through pfp folder ────────
(() => {
  const wrap = document.querySelector('.ring-photo');
  const img = wrap && wrap.querySelector('img');
  if (!wrap || !img) return;
  const pfps = ['pfp 1.jpg', 'pfp 2.png', 'pfp 3.png', 'pfp 4.png', 'pfp 5.png', 'pfp 6.png']
    .map(name => `assets/profile pictures/${name}`);
  let i = 0;
  setInterval(() => {
    i = (i + 1) % pfps.length;
    img.src = pfps[i];
  }, 750);
})();

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
