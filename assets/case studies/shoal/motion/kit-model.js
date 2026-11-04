/* kit-model.js: the Shoal kit in three.js, modelled on the Gemini concept images.
   Clear glass jars with frosted lids and a name label, cream ceramic bases that snap together,
   the Shoal logo on each jar, frosted pebbles that glow white, blue or yellow, and a round charging puck,
   sitting on a quartz counter by a wall, lit through a window. Used by kit.html, where the prototype drives it.

   createKit(el, { jars: [{ id, name }], margin }) returns an object (margin: extra room around the whole kit, 1.02 by default):
     add(key, { jar | puck, size, state })   puts a stone in a jar or on the puck
     has(key), alias(from, to), clear()      look up, rename, or empty everything
     state(key, s)                           'open' white, 'progress' blue, 'urgent' yellow, 'done' light off
     blink(key, on)                          blinks, the way Find stone does
     breathe(key, on)                        a slow pulse, the way a stone waits to be paired
     drop(key, jarId, ms)                    the lid opens and the stone goes from the puck into a jar
     focus(what, now)                        'all', 'puck', or a jar id: the camera moves in on it
   Glowing stones get a soft halo sprite rather than a bloom pass, so the bright counter and wall don't bloom too.
   The room and the light come from studio.js. Needs an import map for "three" and "three/addons/". */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvas, tex, grain, markTexture, haloTexture, studio, ease } from './studio.js';

const JW = 0.9, JD = 0.8, JH = 1.3, BASE = 0.16, FLOOR = 0.06, GAP = 1.04;
const SIZE = { 1: 0.12, 2: 0.145, 3: 0.17 };
// each glow: stone color, light color and strength, how rough the surface looks
const LOOK = {
  open:     { c: 0xfdfbf6, e: 0xfff1d8, ei: 1.7, r: 0.32 },
  progress: { c: 0x8cc6ff, e: 0x2f8cff, ei: 1.3, r: 0.32 },
  urgent:   { c: 0xffc85a, e: 0xff8a00, ei: 1.3, r: 0.32 },
  done:     { c: 0x948e86, e: 0x000000, ei: 0, r: 0.62 }
};

export function createKit(el, opts) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || /still/.test(location.search);
  const { renderer, scene, camera } = studio(el);
  const kit = new THREE.Group(); scene.add(kit);

  // materials
  const grainTex = grain();
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xefe5cf, roughness: 0.42, clearcoat: 0.35, clearcoatRoughness: 0.35,
    bumpMap: grainTex, bumpScale: 0.6, sheen: 0.3, sheenColor: new THREE.Color(0xfff6e6) });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.02, metalness: 0, transmission: 1, thickness: 0.03,
    ior: 1.5, specularIntensity: 1, envMapIntensity: 2.2, side: THREE.FrontSide, depthWrite: false });   // no depth, so the halos inside still show
  const frost = new THREE.MeshPhysicalMaterial({ color: 0xf7f9fb, roughness: 0.5, transmission: 0.92, thickness: 0.3, ior: 1.45 });
  const insert = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, transmission: 0.7, thickness: 0.1 });
  const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
  const markMat = new THREE.MeshStandardMaterial({ map: markTexture(), transparent: true, roughness: 0.4, depthWrite: false });

  function label(name) {
    const [c, x] = canvas(512, 128);
    x.fillStyle = '#fbfaf7'; x.beginPath(); x.roundRect(6, 14, 500, 100, 12); x.fill();
    x.fillStyle = '#2b2b2b'; x.font = '500 66px Georgia, "Times New Roman", serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(name, 256, 66);
    return new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.115), new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.85, transparent: true }));
  }

  // jars, left to right, with their bases snapped together
  const jars = {}, n = opts.jars.length, x0 = -((n - 1) * GAP) / 2;
  opts.jars.forEach((p, i) => {
    const jar = new THREE.Group(); jar.position.x = x0 + i * GAP; kit.add(jar);
    const base = new THREE.Mesh(new RoundedBoxGeometry(GAP - 0.012, BASE, JD + 0.14, 4, 0.04), ceramic);
    base.position.y = BASE / 2; base.castShadow = base.receiveShadow = true; jar.add(base);
    const shell = new THREE.Mesh(new RoundedBoxGeometry(JW, JH, JD, 5, 0.06), glass);
    shell.position.y = BASE + JH / 2; jar.add(shell);
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(JW - 0.01, JH - 0.01, JD - 0.01)), edgeMat);
    edge.position.copy(shell.position); jar.add(edge);
    const floor = new THREE.Mesh(new RoundedBoxGeometry(JW - 0.06, FLOOR, JD - 0.06, 2, 0.02), insert);
    floor.position.y = BASE + FLOOR / 2 + 0.01; floor.receiveShadow = true; jar.add(floor);
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), markMat);
    logo.position.set(0.24, BASE + JH - 0.28, JD / 2 + 0.003); logo.renderOrder = 5; jar.add(logo);
    const lid = new THREE.Group(); lid.position.y = BASE + JH + 0.08; jar.add(lid);
    const hinge = new THREE.Group(); hinge.position.z = -(JD + 0.05) / 2; lid.add(hinge);   // the lid tips open from the back
    const top = new THREE.Mesh(new RoundedBoxGeometry(JW + 0.05, 0.16, JD + 0.05, 4, 0.05), frost);
    top.position.z = (JD + 0.05) / 2; hinge.add(top);
    const lab = label(p.name); lab.position.set(0, 0, JD + 0.05 + 0.003); hinge.add(lab);
    jars[p.id] = { group: jar, hinge, slots: 0 };
  });

  // charging puck, in front of the jars, by yours
  const puck = new THREE.Group(); puck.position.set(x0 + GAP * 0.5, 0, JD / 2 + 0.85); kit.add(puck);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.52, 0.12, 96), ceramic);
  disc.position.y = 0.06; disc.castShadow = disc.receiveShadow = true; puck.add(disc);
  const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.006, 96), new THREE.MeshPhysicalMaterial({ color: 0xf4ede0, roughness: 0.7, sheen: 0.4 }));
  pad.position.y = 0.123; pad.receiveShadow = true; puck.add(pad);
  const led = new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.022, 0.02, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0x4aa8ff, emissive: 0x4aa8ff, emissiveIntensity: 2.5 }));
  led.position.set(0, 0.07, 0.515); puck.add(led);
  let puckSlots = 0;
  const PUCK = [[0.02, 0.18], [-0.22, -0.12], [0.2, -0.14], [-0.08, 0.22]];

  function slot(k) {
    const layer = Math.floor(k / 6), i = k % 6, col = i % 3, row = Math.floor(i / 3);
    const jx = Math.sin(k * 12.9) * 0.025, jz = Math.cos(k * 7.3) * 0.025;
    return new THREE.Vector3(-0.24 + col * 0.24 + (layer % 2) * 0.1 + jx, BASE + FLOOR + 0.1 + layer * 0.15, (row ? 0.15 : -0.14) + jz);
  }

  // stones: frosted pebbles, each with a little light inside
  const stones = {};
  const stoneGeo = new THREE.SphereGeometry(1, 48, 32);
  const haloTex = haloTexture();
  const glowLight = new THREE.PointLight(0xffffff, 0, 1.2, 2); scene.add(glowLight);   // lights the puck and jar around the stone you're pairing
  let lightOn = null;
  function make(size, state) {
    const r = SIZE[size] || SIZE[2], L = LOOK[state] || LOOK.open;
    const m = new THREE.MeshPhysicalMaterial({ color: L.c, emissive: L.e, emissiveIntensity: L.ei, roughness: L.r,
      clearcoat: 0.7, clearcoatRoughness: 0.25, sheen: 0.5, sheenColor: new THREE.Color(0xffffff), bumpMap: grainTex, bumpScale: 0.25 });
    const s = new THREE.Mesh(stoneGeo, m);
    s.scale.set(r, r * 0.66, r * 0.82); s.rotation.y = Math.random() * Math.PI; s.castShadow = true; s.receiveShadow = true;
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: L.e, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }));
    halo.scale.set(4.6, 4.6 * 1.3, 1); s.add(halo);   // the sprite sits inside the stone's own scale
    s.userData = { r, state, halo, blink: false, breathe: false, cur: { ei: L.ei, r: L.r } };
    return s;
  }

  // camera: whole kit, or close in on the puck or one jar
  const half = () => Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const left = x0 - GAP / 2, right = x0 + (n - 1) * GAP + GAP / 2;
  const view = { c: new THREE.Vector3((left + right) / 2, 0.5, 0.75), d: 10 }, goal = { c: view.c.clone(), d: 10, what: 'all' };
  function aim(what) {
    goal.what = what;
    const fit = (w, h) => Math.max((w / 2) / (half() * camera.aspect), (h / 2) / half());
    if (what === 'puck') { puck.getWorldPosition(goal.c); goal.c.y = 0.3; goal.c.z -= 0.2; goal.d = fit(2.1, 1.35); }
    else if (jars[what]) { jars[what].group.getWorldPosition(goal.c); goal.c.x += 0.25; goal.c.y = 0.8; goal.c.z += 0.3; goal.d = fit(2.3, 2.1); }
    else { goal.c.set((left + right) / 2, 0.5, 0.75); goal.d = fit(right - left + 0.2, 3.0) * (opts.margin || 1.02); }
  }

  const api = {
    add(key, o) {
      if (!o.puck && !jars[o.jar]) return null;   // people without a jar (a kid, a volunteer) have no stones at home
      const s = make(o.size, o.state || 'open');
      if (o.puck) { const p = PUCK[puckSlots++ % PUCK.length]; s.position.set(p[0], 0.126 + s.userData.r * 0.62, p[1]); puck.add(s); }
      else { const j = jars[o.jar]; s.position.copy(slot(j.slots++)); j.group.add(s); }
      stones[key] = s; return s;
    },
    has: (key) => !!stones[key],
    // empties the jars and the puck, for the next time through
    clear() {
      Object.keys(stones).forEach((k) => { const s = stones[k]; s.parent.remove(s); s.material.dispose(); s.userData.halo.material.dispose(); delete stones[k]; });
      Object.values(jars).forEach((j) => { j.slots = 0; j.hinge.rotation.x = 0; });
      puckSlots = 0; lightOn = null; tweens.splice(0).forEach((tw) => tw.ok());
    },
    alias(from, to) { if (stones[from] && !stones[to]) { stones[to] = stones[from]; delete stones[from]; if (lightOn === from) lightOn = to; } },
    state(key, st) { const s = stones[key]; if (s) s.userData.state = st; },
    blink(key, on) { const s = stones[key]; if (s) s.userData.blink = on; },
    breathe(key, on) { const s = stones[key]; if (s) s.userData.breathe = on; },
    // the little light that spills from one stone onto what's around it
    light(key) { lightOn = key; },
    focus(what, now) { aim(what); if (now || reduce) { view.c.copy(goal.c); view.d = goal.d; } },
    drop(key, jarId, ms = 1500) {
      const s = stones[key], j = jars[jarId]; if (!s || !j) return Promise.resolve();
      const from = s.getWorldPosition(new THREE.Vector3());
      j.group.add(s);
      const to = slot(j.slots++), start = j.group.worldToLocal(from.clone());
      const peak = BASE + JH + 0.38;
      s.position.copy(start);
      return tween(ms, (k) => {
        const lidK = k < 0.22 ? k / 0.22 : k > 0.8 ? (1 - k) / 0.2 : 1;   // the lid tips open, the stone goes in, the lid closes
        j.hinge.rotation.x = -ease(Math.max(0, lidK)) * 0.95;
        const m = ease(Math.min(1, Math.max(0, (k - 0.12) / 0.7)));
        const xz = new THREE.Vector3().lerpVectors(start, to, m);
        const y = m < 0.55 ? THREE.MathUtils.lerp(start.y, peak, ease(m / 0.55)) : THREE.MathUtils.lerp(peak, to.y, ease((m - 0.55) / 0.45));
        s.position.set(xz.x, y, xz.z);
      });
    }
  };

  const tweens = [];
  // Runs on animation frames, but also finishes on a timer: browsers pause animation frames in a background tab
  // or a frame scrolled off screen, and the prototype's timeline waits on this.
  function tween(ms, fn) {
    return new Promise((ok) => {
      if (reduce) { fn(1); ok(); return; }
      const tw = { t0: performance.now(), ms, fn, ok };
      tweens.push(tw);
      setTimeout(() => { const i = tweens.indexOf(tw); if (i >= 0) { tweens.splice(i, 1); fn(1); ok(); } }, ms + 120);
    });
  }

  function size() {
    const w = el.clientWidth, h = el.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    if (opts.shift) camera.setViewOffset(w, h, opts.shift * w, 0, w, h);   // slides the kit left, to leave room beside it
    camera.updateProjectionMatrix();
    const wasAll = view.d === goal.d; aim(goal.what); if (wasAll) view.d = goal.d;
  }
  size(); view.c.copy(goal.c); view.d = goal.d; addEventListener('resize', size);

  const tmp = new THREE.Color(), lp = new THREE.Vector3();
  let last = performance.now();
  function frame(t) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i], k = Math.min(1, (t - tw.t0) / tw.ms);
      tw.fn(k); if (k >= 1) { tweens.splice(i, 1); tw.ok(); }
    }
    const on = Math.sin(t / 150) > 0, pulse = 0.5 + Math.sin(t / 650) * 0.5;
    Object.entries(stones).forEach(([key, s]) => {
      const u = s.userData, L = LOOK[u.state] || LOOK.open, m = s.material, c = u.cur, f = reduce ? 1 : 0.1;
      c.ei += (L.ei - c.ei) * f; c.r += (L.r - c.r) * f;
      m.color.lerp(tmp.setHex(L.c), f); m.emissive.lerp(tmp.setHex(L.e || 0x000000), f);
      let ei = c.ei;
      if (u.breathe && !reduce) ei *= 0.55 + pulse * 0.6;
      if (u.blink && !reduce) ei = on ? Math.max(c.ei, 1.3) * 1.6 : 0.02;
      m.emissiveIntensity = ei; m.roughness = c.r;
      u.halo.material.color.copy(m.emissive); u.halo.material.opacity = Math.min(0.5, ei * 0.24);
      if (key === lightOn) { s.getWorldPosition(lp); glowLight.position.copy(lp); glowLight.color.copy(m.emissive); glowLight.intensity = ei * 0.35; }
    });
    if (!lightOn || !stones[lightOn]) glowLight.intensity = 0;
    // ease the camera toward what it's looking at, with a slow sway so the glass catches the light
    const k = reduce ? 1 : 1 - Math.exp(-dt * 1.6);
    view.c.lerp(goal.c, k); view.d += (goal.d - view.d) * k;
    const az = -0.18 + (reduce ? 0 : Math.sin(t / 5200) * 0.05), elv = 0.36;
    camera.position.set(view.c.x + Math.sin(az) * Math.cos(elv) * view.d, view.c.y + Math.sin(elv) * view.d, view.c.z + Math.cos(az) * Math.cos(elv) * view.d);
    camera.lookAt(view.c);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  return api;
}
