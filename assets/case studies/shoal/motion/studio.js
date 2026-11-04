/* studio.js: the room the Shoal 3D models are shot in, shared by kit-model.js and pack-model.js.
   A pale quartz counter, a warm wall behind it, and light from a window on the left that throws soft panes
   across both. Also the textures the models share: paper and ceramic grain, the Shoal mark, a glow halo.
   Needs an import map for "three" and "three/addons/". */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// The Shoal mark, as in the brand files (proto/start.js): [piece, center x %, center y %, width %, height %, rotation]
export const MARK = [
  ['top', 50, 18, 29, 18, 0],
  ['right', 79.48, 40.42, 25, 16, 72],
  ['bottom-right', 69.1, 76.3, 30, 19, 144],
  ['bottom-left', 32.07, 74.68, 23, 15, -144],
  ['lit', 20.05, 40.27, 37.53, 27.53, -72],
];
export const ease = (k) => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function tex(c, srgb = true) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// a pale quartz counter: warm white with soft grey veins
export function quartz() {
  const [c, x] = canvas(2048, 2048);
  const g = x.createLinearGradient(0, 0, 2048, 2048); g.addColorStop(0, '#e4ddd2'); g.addColorStop(1, '#d9d1c5');
  x.fillStyle = g; x.fillRect(0, 0, 2048, 2048);
  for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(${Math.random() < 0.5 ? '255,255,255' : '150,140,130'},${Math.random() * 0.05})`; x.fillRect(Math.random() * 2048, Math.random() * 2048, 3, 3); }
  const vein = (w, a, blur) => {
    x.filter = `blur(${blur}px)`; x.strokeStyle = `rgba(128,120,112,${a})`; x.lineWidth = w;
    let px = Math.random() * 2048, py = Math.random() * 300, ang = 1.1 + Math.random() * 0.5;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 40; k++) { ang += (Math.random() - 0.5) * 0.5; px += Math.cos(ang) * 60; py += Math.sin(ang) * 60; x.lineTo(px, py); }
    x.stroke();
  };
  for (let i = 0; i < 7; i++) vein(10 + Math.random() * 18, 0.05, 14);
  for (let i = 0; i < 12; i++) vein(1.2 + Math.random() * 2, 0.16, 1.2);
  x.filter = 'none';
  const t = tex(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// fine grain, for the ceramic, the stones and the paper
export function grain(n = 512, blur = 1) {
  const [c, x] = canvas(n, n), d = x.createImageData(n, n);
  for (let i = 0; i < d.data.length; i += 4) { const v = 118 + Math.random() * 20; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  x.putImageData(d, 0, 0); x.filter = `blur(${blur}px)`; x.drawImage(c, 0, 0);
  const t = tex(c, false); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
// window light: four soft panes, cast by the spot light onto the counter and wall
export function windowLight() {
  const [c, x] = canvas(512, 512);
  x.fillStyle = '#000'; x.fillRect(0, 0, 512, 512);
  x.filter = 'blur(10px)'; x.fillStyle = '#fff';
  [[70, 60], [266, 60], [70, 266], [266, 266]].forEach(([a, b]) => x.fillRect(a, b, 176, 186));
  return tex(c);
}
// loads the five brand stones of the mark, so a canvas can draw them
export function markPieces() {
  return Promise.all(MARK.map(([n]) => new Promise((ok) => {
    const im = new Image(); im.onload = () => ok(im); im.onerror = () => ok(null); im.src = `proto/assets/brand/mark-${n}.svg`;
  })));
}
// draws the mark into a canvas: size s, top left corner at (ox, oy)
export function drawMark(x, pieces, ox, oy, s) {
  MARK.forEach(([, px, py, w, h, r], i) => {
    const im = pieces[i]; if (!im) return;
    x.save(); x.translate(ox + px / 100 * s, oy + py / 100 * s); x.rotate(r * Math.PI / 180);
    x.drawImage(im, -w / 200 * s, -h / 200 * s, w / 100 * s, h / 100 * s); x.restore();
  });
}
// the Shoal mark on its own, for the jars
export function markTexture() {
  const [c, x] = canvas(512, 512), t = tex(c);
  markPieces().then((p) => { drawMark(x, p, 0, 0, 512); t.needsUpdate = true; });
  return t;
}
// the soft glow around a lit stone
export function haloTexture() {
  const [hc, hx] = canvas(128, 128), hg = hx.createRadialGradient(64, 64, 0, 64, 64, 64);
  hg.addColorStop(0, 'rgba(255,255,255,.9)'); hg.addColorStop(0.25, 'rgba(255,255,255,.35)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  hx.fillStyle = hg; hx.fillRect(0, 0, 128, 128);
  return tex(hc);
}

// The renderer, the room and the light. wallZ moves the wall back and angle widens the window light, for bigger things.
export function studio(el, { wallZ = -1.5, target = [0.3, 0.4, -0.6], shadow = 1024, angle = 0.42 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc9bfb1);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 80);

  const counter = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.MeshPhysicalMaterial({
    map: quartz(), roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.18, envMapIntensity: 0.6 }));
  counter.rotation.x = -Math.PI / 2; counter.position.z = 4; counter.receiveShadow = true; scene.add(counter);
  const [wc, wx] = canvas(256, 256), wg = wx.createRadialGradient(80, 60, 10, 128, 128, 260);
  wg.addColorStop(0, '#d9d0c3'); wg.addColorStop(1, '#b9ae9f'); wx.fillStyle = wg; wx.fillRect(0, 0, 256, 256);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(24, 12), new THREE.MeshStandardMaterial({ map: tex(wc), roughness: 0.95, envMapIntensity: 0.4 }));
  wall.position.set(0, 6, wallZ); wall.receiveShadow = true; scene.add(wall);

  scene.add(new THREE.HemisphereLight(0xfff8ef, 0xb8ab99, 0.4));
  const sun = new THREE.SpotLight(0xffe9cf, 3.2, 0, angle, 0.55, 0);
  sun.position.set(-5.5, 6.5, 5); sun.target.position.set(...target); scene.add(sun.target);
  sun.map = windowLight(); sun.castShadow = true;
  sun.shadow.mapSize.set(shadow, shadow); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.camera.near = 3; sun.shadow.camera.far = 24;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xe8f0ff, 0.45); rim.position.set(4, 3, -2); scene.add(rim);

  return { renderer, scene, camera, sun, counter, wall };
}
