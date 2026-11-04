/* pack-model.js: the Shoal box in three.js, in the same room and light as the kit (studio.js).
   A white paperboard box with a lid that lifts off and leans against the wall behind it. Inside, five glass jars
   lie in a row at the back, logo up. In front of them a card insert holds the five ceramic bases, the charging puck
   with a stone glowing on it, and a pulp tray of stones. An open setup guide lies on the counter.
   The print follows the packaging concept: the mark and wordmark, two soft blue rings, "Care, carried together."

   createPack(el, { open }) returns { open(on), toggle(), isOpen(), onchange, paused }.
   Drag to turn the box; a tap without dragging lifts or closes the lid. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, tex, grain, markTexture, markPieces, drawMark, haloTexture, studio, ease } from './studio.js';

// the kit, at the same scale as kit-model.js
const JW = 0.9, JD = 0.8, JH = 1.3, BASE = 0.16, GAP = 1.04;
// the box: board thickness, inside size, outside size
const JL = JH + 0.24;             // a jar lying down, bottom to lid
const T = 0.035, IW = 5.22, ID = JL + 0.12 + 0.02 + 1.32, BW = IW + 2 * T, BD = ID + 2 * T, BH = 1.05;
// the lid: a little bigger than the box, with a skirt that comes partway down
const LW = BW + 0.05, LD = BD + 0.05, LS = 0.42;
const DIV = -ID / 2 + JL + 0.12;  // the card wall between the jars and the front insert
const TOP = BH - 0.1;             // height of the front insert, near the rim so you can see in
const NAVY = '#13315d', BLUE = '#0f4c93';
// where the lid goes: on the box, lifted, swung back and tipped up, then leaning on the wall
const TILT = THREE.MathUtils.degToRad(72);
const REST = { y: LS * Math.cos(TILT) + (LD / 2) * Math.sin(TILT) + 0.004, z: -BD / 2 - 0.1 - (LD / 2) * Math.cos(TILT) };
const KEYS = [
  { y: BH + T, z: 0, r: 0 },
  { y: BH + T + 1.0, z: 0.1, r: 0 },
  { y: 2.8, z: REST.z, r: TILT },
  { y: REST.y, z: REST.z, r: TILT },
];
const WALL = REST.z - LS * Math.sin(TILT) - (LD / 2) * Math.cos(TILT) - 0.01;   // the wall sits just behind the leaning lid
const SPANS = [0, 0.24, 0.68, 1];

const fonts = () => Promise.all(['400 100px Fraunces', 'italic 400 100px Fraunces', '400 40px Figtree', '600 40px Figtree']
  .map((f) => document.fonts ? document.fonts.load(f).catch(() => {}) : null));

export function createPack(el, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /still/.test(location.search);
  const { renderer, scene, camera, sun } = studio(el, { wallZ: WALL, target: [0, 0.8, -0.6], shadow: 2048, angle: 0.5 });
  sun.penumbra = 0.9; sun.intensity = 2.8;   // a softer pool of light, since this frame shows more of the counter
  const box = new THREE.Group(); scene.add(box);

  // materials
  const paperGrain = grain(512, 0.6); paperGrain.repeat.set(3, 3);
  const paper = new THREE.MeshPhysicalMaterial({ color: 0xf6f5f1, roughness: 0.82, sheen: 0.4, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff),
    bumpMap: paperGrain, bumpScale: 0.12, envMapIntensity: 0.7 });
  const lining = new THREE.MeshPhysicalMaterial({ color: 0xd3e5f5, roughness: 0.8, sheen: 0.3, sheenColor: new THREE.Color(0xffffff),
    bumpMap: paperGrain, bumpScale: 0.12, envMapIntensity: 0.7 });   // the inside of the box is printed a pale Shoal blue
  const pulpGrain = grain(256, 1.4); pulpGrain.repeat.set(6, 4);
  const pulp = new THREE.MeshPhysicalMaterial({ color: 0xe3ddd1, roughness: 0.96, bumpMap: pulpGrain, bumpScale: 1.4, envMapIntensity: 0.5 });
  const grainTex = grain();
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xefe5cf, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35,
    bumpMap: grainTex, bumpScale: 0.6, sheen: 0.3, sheenColor: new THREE.Color(0xfff6e6) });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.03,
    ior: 1.5, specularIntensity: 1, envMapIntensity: 2.2, side: THREE.FrontSide, depthWrite: false });
  const frost = new THREE.MeshPhysicalMaterial({ color: 0xf7f9fb, roughness: 0.5, transmission: 0.92, thickness: 0.3, ior: 1.45 });
  const insert = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, transmission: 0.7, thickness: 0.1 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const markMat = new THREE.MeshStandardMaterial({ map: markTexture(), transparent: true, roughness: 0.4, depthWrite: false });

  // a flat piece of board, w wide, h tall, d deep, its bottom at y
  function slab(w, h, d, x, y, z, mat = paper, parent = box) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y + h / 2, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  // a printed card: white board with the canvas on its top face
  function printed(c) {
    const t = tex(c);
    return new THREE.MeshPhysicalMaterial({ map: t, roughness: 0.8, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xffffff),
      bumpMap: paperGrain, bumpScale: 0.1, envMapIntensity: 0.7 });
  }
  const topOnly = (m) => [paper, paper, m, paper, paper, paper];
  const inside = (face) => { const a = [paper, paper, paper, paper, paper, paper]; a[face] = lining; return a; };   // face: +x -x +y -y +z -z

  // a sheet of card with holes cut in it, its top at y. holes: { x, z, w, d } or { x, z, r }
  function sheet(x0, x1, z0, z1, y, holes) {
    const s = new THREE.Shape();
    s.moveTo(x0, -z0); s.lineTo(x1, -z0); s.lineTo(x1, -z1); s.lineTo(x0, -z1); s.closePath();
    holes.forEach((h) => {
      const p = new THREE.Path();
      if (h.r) p.absarc(h.x, -h.z, h.r, 0, Math.PI * 2, true);
      else {
        const r = 0.05, a = h.x - h.w / 2, b = h.x + h.w / 2, c = -h.z - h.d / 2, d = -h.z + h.d / 2;
        p.moveTo(a + r, c); p.lineTo(b - r, c); p.quadraticCurveTo(b, c, b, c + r); p.lineTo(b, d - r); p.quadraticCurveTo(b, d, b - r, d);
        p.lineTo(a + r, d); p.quadraticCurveTo(a, d, a, d - r); p.lineTo(a, c + r); p.quadraticCurveTo(a, c, a + r, c);
      }
      s.holes.push(p);
    });
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.025, bevelEnabled: false, curveSegments: 48 });
    const m = new THREE.Mesh(g, paper); m.rotation.x = -Math.PI / 2; m.position.y = y - 0.025;
    m.castShadow = m.receiveShadow = true; box.add(m); return m;
  }
  // the four card walls around a well, from the floor up to the insert
  function well(x, z, w, d) {
    const h = TOP - T, t = 0.012;
    slab(w, h, t, x, T, z - d / 2); slab(w, h, t, x, T, z + d / 2);
    slab(t, h, d, x - w / 2, T, z); slab(t, h, d, x + w / 2, T, z);
  }

  // the box: a floor and four walls
  slab(BW, T, BD, 0, 0, 0, inside(2));
  slab(BW, BH - T, T, 0, T, BD / 2 - T / 2, inside(5));
  slab(BW, BH - T, T, 0, T, -BD / 2 + T / 2, inside(4));
  slab(T, BH - T, BD - 2 * T, BW / 2 - T / 2, T, 0, inside(1));
  slab(T, BH - T, BD - 2 * T, -BW / 2 + T / 2, T, 0, inside(0));

  // the back: five jars lying in slots, lid to the back and logo up, held by card dividers and a collar
  const pitch = IW / 5, zJar = (-ID / 2 + DIV) / 2, yJar = T + 0.03 + (JD + 0.05) / 2;
  slab(IW, TOP - T, 0.02, 0, T, DIV);
  for (let i = 1; i < 5; i++) slab(0.02, 0.5, DIV + ID / 2, -IW / 2 + i * pitch, T, zJar);
  sheet(-IW / 2, IW / 2, -ID / 2, DIV, yJar,
    [0, 1, 2, 3, 4].map((i) => ({ x: -IW / 2 + (i + 0.5) * pitch, z: zJar, w: JW + 0.06, d: JL + 0.04 })));
  for (let i = 0; i < 5; i++) {
    const jar = new THREE.Group(); jar.position.set(-IW / 2 + (i + 0.5) * pitch, yJar, zJar + JL / 2); jar.rotation.x = -Math.PI / 2; box.add(jar);
    const shell = new THREE.Mesh(new RoundedBoxGeometry(JW, JH, JD, 5, 0.06), glass);
    shell.position.y = JH / 2; jar.add(shell);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(JW - 0.01, JH - 0.01, JD - 0.01)), edgeMat);
    edge.position.copy(shell.position); jar.add(edge);
    const floor = new THREE.Mesh(new RoundedBoxGeometry(JW - 0.06, 0.06, JD - 0.06, 2, 0.02), insert);
    floor.position.y = 0.04; floor.receiveShadow = true; jar.add(floor);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), markMat);
    logo.position.set(0.24, JH - 0.28, JD / 2 + 0.003); logo.renderOrder = 5; jar.add(logo);
    const top = new THREE.Mesh(new RoundedBoxGeometry(JW + 0.05, 0.16, JD + 0.05, 4, 0.05), frost);
    top.position.y = JH + 0.08; top.castShadow = true; jar.add(top);
  }

  // the front insert: the bases on the left, the puck in the middle, the tray of stones on the right
  const zF = (DIV + ID / 2) / 2;
  const B = { x: -1.82, w: GAP + 0.08, d: JD + 0.14 + 0.1 };
  const P = { x: -0.42, r: 0.58 };
  const S = { x: 1.4, w: 2.1, d: 1.26 };
  sheet(-IW / 2, IW / 2, DIV, ID / 2, TOP, [
    { x: B.x, z: zF, w: B.w, d: B.d }, { x: P.x, z: zF, r: P.r }, { x: S.x, z: zF, w: S.w, d: S.d }]);
  well(B.x, zF, B.w, B.d);
  const bStep = TOP - 0.1 - 5 * (BASE + 0.002);
  if (bStep - T > 0.005) slab(B.w, bStep - T, B.d, B.x, T, zF);
  for (let k = 0; k < 5; k++) {
    const b = new THREE.Mesh(new RoundedBoxGeometry(GAP - 0.012, BASE, JD + 0.14, 4, 0.04), ceramic);
    b.position.set(B.x + Math.sin(k * 3.1) * 0.012, bStep + BASE / 2 + k * (BASE + 0.002), zF + Math.cos(k * 2.3) * 0.012);
    b.castShadow = b.receiveShadow = true; box.add(b);
  }
  // the puck sits on a round card step
  const step = TOP - 0.25;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(P.r, P.r, TOP - step, 64, 1, true), paper.clone());
  tube.material.side = THREE.DoubleSide; tube.position.set(P.x, (TOP + step) / 2, zF); tube.receiveShadow = true; box.add(tube);
  const stepDisc = new THREE.Mesh(new THREE.CircleGeometry(P.r, 64), paper); stepDisc.rotation.x = -Math.PI / 2;
  stepDisc.position.set(P.x, step, zF); stepDisc.receiveShadow = true; box.add(stepDisc);
  const puck = new THREE.Group(); puck.position.set(P.x, step, zF); box.add(puck);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.12, 96), ceramic);
  disc.position.y = 0.06; disc.castShadow = disc.receiveShadow = true; puck.add(disc);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.006, 96), new THREE.MeshPhysicalMaterial({ color: 0xf4ede0, roughness: 0.7, sheen: 0.4 }));
  pad.position.y = 0.123; pad.receiveShadow = true; puck.add(pad);
  const led = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.022, 0.02, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x4aa8ff, emissive: 0x4aa8ff, emissiveIntensity: 2.5 }));
  led.position.set(0, 0.07, 0.515); puck.add(led);

  // the pulp tray: a sheet pressed into five by three cups
  const COLS = 5, ROWS = 3, CUP = 0.16, DEEP = 0.12;
  const tg = new THREE.PlaneGeometry(S.w - 0.02, S.d - 0.02, 200, 120); tg.rotateX(-Math.PI / 2);
  const cx = (S.w - 0.02) / COLS, cz = (S.d - 0.02) / ROWS, pos = tg.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + (S.w - 0.02) / 2, z = pos.getZ(i) + (S.d - 0.02) / 2;
    const dx = (x % cx) - cx / 2, dz = (z % cz) - cz / 2, r = Math.hypot(dx, dz) / CUP;
    pos.setY(i, r < 1 ? -DEEP * (0.5 + 0.5 * Math.cos(Math.PI * r)) : 0.012 * Math.cos(dx * 18) * Math.cos(dz * 18));
  }
  tg.computeVertexNormals();
  const tray = new THREE.Mesh(tg, pulp); tray.position.set(S.x, TOP - 0.03, zF); tray.castShadow = tray.receiveShadow = true; box.add(tray);
  well(S.x, zF, S.w, S.d);

  // stones: frosted pebbles. The ones in the tray are off; one on the puck glows, charged and ready
  const stoneGeo = new THREE.SphereGeometry(1, 48, 32), haloTex = haloTexture();
  function stone(r, lit) {
    const m = new THREE.MeshPhysicalMaterial({ color: lit ? 0xfdfbf6 : 0xe2ddd4, emissive: lit ? 0xfff1d8 : 0x000000, emissiveIntensity: lit ? 1.6 : 0,
      roughness: lit ? 0.32 : 0.42, clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: new THREE.Color(0xffffff), bumpMap: grainTex, bumpScale: 0.25 });
    const s = new THREE.Mesh(stoneGeo, m);
    s.scale.set(r, r * 0.66, r * 0.82); s.rotation.y = Math.random() * Math.PI; s.castShadow = s.receiveShadow = true;
    if (lit) {
      const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: 0xfff1d8, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 }));
      halo.scale.set(4.6, 4.6 * 1.3, 1); s.add(halo);
    }
    return s;
  }
  const SIZES = [0.145, 0.12, 0.17, 0.145, 0.12, 0.17, 0.145, 0.145, 0.12, 0.17, 0.12, 0.145, 0.17, 0.145, 0.12];
  for (let row = 0; row < ROWS; row++) for (let col = 0; col < COLS; col++) {
    const r = SIZES[row * COLS + col], s = stone(r, false);
    s.position.set(S.x - (S.w - 0.02) / 2 + (col + 0.5) * cx, TOP - 0.03 - DEEP + r * 0.66 * 0.92, zF - (S.d - 0.02) / 2 + (row + 0.5) * cz);
    box.add(s);
  }
  const glowStone = stone(0.145, true); glowStone.position.set(0.04, 0.126 + 0.145 * 0.62, 0.12); puck.add(glowStone);
  [[-0.22, -0.14, 0.12], [0.2, -0.16, 0.17]].forEach(([x, z, r]) => { const s = stone(r, false); s.position.set(x, 0.126 + r * 0.62, z); puck.add(s); });
  const glow = new THREE.PointLight(0xfff1d8, 0.55, 1.4, 2); glow.position.set(P.x + 0.04, step + 0.35, zF + 0.12); box.add(glow);

  // the lid: a top and a skirt. Its top is printed.
  const lid = new THREE.Group(); box.add(lid);
  const [lc, lx] = canvas(2048, Math.round(2048 * LD / LW));
  const lidPrint = printed(lc);
  slab(LW, T, LD, 0, -T, 0, [paper, paper, lidPrint, lining, paper, paper], lid);
  slab(LW, LS - T, T, 0, -LS, LD / 2 - T / 2, inside(5), lid);
  slab(LW, LS - T, T, 0, -LS, -LD / 2 + T / 2, inside(4), lid);
  slab(T, LS - T, LD - 2 * T, LW / 2 - T / 2, -LS, 0, inside(1), lid);
  slab(T, LS - T, LD - 2 * T, -LW / 2 + T / 2, -LS, 0, inside(0), lid);

  // the setup guide, open on the counter
  const guide = new THREE.Group(); guide.position.set(-1.5, 0, BD / 2 + 0.78); guide.rotation.y = 0.2; box.add(guide);
  const PW = 0.72, PD = 1.0;
  const [gl, glx] = canvas(1024, Math.round(1024 * PD / PW)), [gr, grx] = canvas(1024, Math.round(1024 * PD / PW));
  const pageL = new THREE.Group(), pageR = new THREE.Group(); guide.add(pageL, pageR);
  pageL.rotation.z = -0.03; pageR.rotation.z = 0.03; pageL.position.y = pageR.position.y = 0.006;   // the pages bow up a little from the fold
  slab(PW, 0.008, PD, -PW / 2, -0.004, 0, topOnly(printed(gl)), pageL);
  slab(PW, 0.008, PD, PW / 2, -0.004, 0, topOnly(printed(gr)), pageR);

  // plain paper until the print is drawn, once the brand type has loaded
  [[lc, lx, '#f7f7f6'], [gl, glx, '#fbfaf6'], [gr, grx, '#fbfaf6']].forEach(([c, x, f]) => { x.fillStyle = f; x.fillRect(0, 0, c.width, c.height); });
  Promise.all([fonts(), markPieces()]).then(([, pieces]) => {
    const W = lc.width, H = lc.height;
    lx.fillStyle = '#f7f7f6'; lx.fillRect(0, 0, W, H);
    // two soft blue rings, overlapping, to the right of center
    lx.filter = 'blur(26px)'; lx.lineWidth = 64;
    [[W * 0.62, H * 0.38, 210, 'rgba(130,190,255,.55)'], [W * 0.66, H * 0.62, 190, 'rgba(110,170,250,.5)']].forEach(([x, y, r, c]) => {
      lx.strokeStyle = c; lx.beginPath(); lx.arc(x, y, r, 0, Math.PI * 2); lx.stroke();
    });
    lx.filter = 'none';
    drawMark(lx, pieces, W * 0.07, H * 0.33, 170);
    lx.fillStyle = BLUE; lx.font = '400 168px Fraunces, Georgia, serif'; lx.textBaseline = 'middle';
    lx.fillText('shoal', W * 0.07 + 210, H * 0.33 + 78);
    lx.fillStyle = NAVY; lx.font = 'italic 400 76px Fraunces, Georgia, serif'; lx.textBaseline = 'alphabetic';
    lx.fillText('Care, carried together.', W * 0.07, H * 0.88);
    lx.font = '500 34px Figtree, system-ui, sans-serif'; lx.textAlign = 'right';
    if ('letterSpacing' in lx) lx.letterSpacing = '7px';
    lx.fillText('FIVE JARS · FORTY STONES', W * 0.93, H * 0.8); lx.fillText('MAGNETIC BASE · CHARGING END', W * 0.93, H * 0.8 + 52);
    lidPrint.map.needsUpdate = true;

    // the guide: a cover page, and the four steps
    const page = (x, c) => { x.fillStyle = '#fbfaf6'; x.fillRect(0, 0, c.width, c.height); };
    page(glx, gl); page(grx, gr);
    const gw = gl.width, gh = gl.height;
    drawMark(glx, pieces, gw / 2 - 150, gh * 0.18, 300);
    glx.fillStyle = BLUE; glx.textAlign = 'center'; glx.font = '400 104px Fraunces, Georgia, serif';
    glx.fillText('Set up', gw / 2, gh * 0.58); glx.fillText('your Shoal', gw / 2, gh * 0.58 + 118);
    glx.fillStyle = NAVY; glx.font = '400 40px Figtree, system-ui, sans-serif';
    ['Five jars, five bases,', 'a charging puck', 'and a tray of stones.'].forEach((l, i) => glx.fillText(l, gw / 2, gh * 0.8 + i * 54));
    const steps = ['Snap the bases together.', 'Set a jar on each base.', 'Charge the stones on the puck.', 'Pair each stone in the app.'];
    grx.lineWidth = 6; grx.strokeStyle = BLUE; grx.lineJoin = grx.lineCap = 'round';
    steps.forEach((t, i) => {
      const y = 110 + i * (gh - 160) / 4, ix = 90, iy = y + 40;
      grx.fillStyle = BLUE; grx.font = '400 92px Fraunces, Georgia, serif'; grx.textAlign = 'left'; grx.fillText(String(i + 1), ix, iy + 60);
      const ax = 210;   // a little drawing of each step
      grx.beginPath();
      if (i === 0) { [0, 1, 2].forEach((k) => grx.roundRect(ax + k * 92, iy + 30, 86, 44, 10)); }
      if (i === 1) { grx.roundRect(ax, iy + 64, 150, 30, 8); grx.roundRect(ax + 12, iy - 30, 126, 94, 10); grx.roundRect(ax + 6, iy - 46, 138, 18, 6); }
      if (i === 2) { grx.ellipse(ax + 120, iy + 60, 120, 34, 0, 0, Math.PI * 2); grx.moveTo(ax + 100, iy + 40); grx.ellipse(ax + 120, iy + 40, 24, 15, 0, 0, Math.PI * 2); }
      if (i === 3) { grx.roundRect(ax + 30, iy - 40, 84, 150, 16); grx.moveTo(ax + 200, iy + 60); grx.ellipse(ax + 180, iy + 60, 24, 15, 0, 0, Math.PI * 2); grx.moveTo(ax + 126, iy + 34); grx.lineTo(ax + 146, iy + 46); }
      grx.stroke();
      grx.fillStyle = NAVY; grx.font = '400 40px Figtree, system-ui, sans-serif';
      const words = t.split(' '), lines = [''];
      words.forEach((w) => { const l = lines[lines.length - 1]; if (grx.measureText(l + ' ' + w).width > 360 && l) lines.push(w); else lines[lines.length - 1] = (l ? l + ' ' : '') + w; });
      lines.forEach((l, k) => grx.fillText(l, 520, iy + 30 + k * 50));
    });
    pageL.children[0].material[2].map.needsUpdate = true; pageR.children[0].material[2].map.needsUpdate = true;
  });

  // the lid's place, k from 0 (on the box) to 1 (leaning on the wall)
  function pose(k) {
    let i = 0; while (i < SPANS.length - 2 && k > SPANS[i + 1]) i++;
    const a = KEYS[i], b = KEYS[i + 1], u = ease(Math.min(1, Math.max(0, (k - SPANS[i]) / (SPANS[i + 1] - SPANS[i]))));
    lid.position.set(0, a.y + (b.y - a.y) * u, a.z + (b.z - a.z) * u); lid.rotation.x = a.r + (b.r - a.r) * u;
  }
  const lidState = { k: opts.open ? 1 : 0, goal: opts.open ? 1 : 0 };
  pose(lidState.k);

  // the camera: drag to turn it around the box. It frames whatever is there, so nothing is cut off.
  const orbit = { az: -0.32, elv: 0.66, goalAz: -0.32, goalElv: 0.66 };
  const view = { c: new THREE.Vector3(0, 0.8, 0), d: 14 };
  const pts = [];
  const add = (x0, x1, y0, y1, z0, z1) => { for (const x of [x0, x1]) for (const y of [y0, y1]) for (const z of [z0, z1]) pts.push(new THREE.Vector3(x, y, z)); };
  add(-BW / 2 - 0.03, BW / 2 + 0.03, 0, BH + 0.05, -BD / 2, BD / 2);
  add(-2.05, -0.95, 0, 0.05, BD / 2 + 0.2, BD / 2 + 1.35);   // the guide
  const lidCorners = []; for (const x of [-LW / 2, LW / 2]) for (const y of [0, -LS]) for (const z of [-LD / 2, LD / 2]) lidCorners.push(new THREE.Vector3(x, y, z));
  const right = new THREE.Vector3(), up = new THREE.Vector3(), back = new THREE.Vector3(), rel = new THREE.Vector3(), w = new THREE.Vector3();
  function frameFor(az, elv, out) {
    back.set(Math.sin(az) * Math.cos(elv), Math.sin(elv), Math.cos(az) * Math.cos(elv));
    right.set(Math.cos(az), 0, -Math.sin(az)); up.crossVectors(back, right);
    lid.updateMatrixWorld();
    const all = pts.concat(lidCorners.map((p) => p.clone().applyMatrix4(lid.matrixWorld)));
    const ty = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 0.86, tx = ty * camera.aspect * 0.94 / 0.86;
    const c = new THREE.Vector3(); const bb = new THREE.Box3().setFromPoints(all); bb.getCenter(c);
    let d = 0;
    for (let pass = 0; pass < 3; pass++) {
      d = 0;
      all.forEach((p) => { rel.subVectors(p, c); const zr = rel.dot(back); d = Math.max(d, zr + Math.abs(rel.dot(right)) / tx, zr + Math.abs(rel.dot(up)) / ty); });
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      all.forEach((p) => { rel.subVectors(p, c); const k = d / (d - rel.dot(back)); const sx = rel.dot(right) * k, sy = rel.dot(up) * k; x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); });
      c.addScaledVector(right, (x0 + x1) / 2).addScaledVector(up, (y0 + y1) / 2);
    }
    out.c.copy(c); out.d = d;
  }
  const goal = { c: new THREE.Vector3(), d: 14 };

  // dragging turns the box; a tap without a drag lifts or closes the lid
  let drag = null;
  const cv = renderer.domElement;
  cv.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, moved: 0 }; el.classList.add('drag'); try { cv.setPointerCapture(e.pointerId); } catch (_) {} });
  cv.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y; drag.x = e.clientX; drag.y = e.clientY; drag.moved += Math.abs(dx) + Math.abs(dy);
    orbit.goalAz = Math.max(-1.15, Math.min(1.15, orbit.goalAz - dx * 0.006));
    orbit.goalElv = Math.max(0.2, Math.min(1.05, orbit.goalElv + dy * 0.004));
    touched = true;
  });
  const end = () => { if (drag && drag.moved < 6) api.toggle(); drag = null; el.classList.remove('drag'); };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', () => { drag = null; el.classList.remove('drag'); });
  let touched = false;

  const api = {
    paused: false, onchange: null,
    isOpen: () => lidState.goal === 1,
    open(on) { lidState.goal = on ? 1 : 0; if (reduce) { lidState.k = lidState.goal; pose(lidState.k); } if (api.onchange) api.onchange(api.isOpen()); },
    toggle() { api.open(!api.isOpen()); },
  };

  function size() {
    const wd = el.clientWidth, ht = el.clientHeight;
    renderer.setSize(wd, ht, false);
    camera.aspect = wd / ht; camera.updateProjectionMatrix();
    frameFor(orbit.az, orbit.elv, view);
  }
  size(); addEventListener('resize', size);

  let last = performance.now();
  function frame(t) {
    requestAnimationFrame(frame);
    if (api.paused) { last = t; return; }
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    if (lidState.k !== lidState.goal) {
      const dir = Math.sign(lidState.goal - lidState.k);
      lidState.k = dir > 0 ? Math.min(1, lidState.k + dt / 2.6) : Math.max(0, lidState.k - dt / 2.2);
      pose(lidState.k);
    }
    const sway = reduce || touched ? 0 : Math.sin(t / 5200) * 0.06;
    const k = reduce ? 1 : 1 - Math.exp(-dt * 6);
    orbit.az += (orbit.goalAz + sway - orbit.az) * k; orbit.elv += (orbit.goalElv - orbit.elv) * k;
    frameFor(orbit.az, orbit.elv, goal);
    const kc = reduce ? 1 : 1 - Math.exp(-dt * 2.2);
    view.c.lerp(goal.c, kc); view.d += (goal.d - view.d) * kc;
    const a = orbit.az, e = orbit.elv;
    camera.position.set(view.c.x + Math.sin(a) * Math.cos(e) * view.d, view.c.y + Math.sin(e) * view.d, view.c.z + Math.cos(a) * Math.cos(e) * view.d);
    camera.lookAt(view.c);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return api;
}
