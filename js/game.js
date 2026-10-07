import * as THREE from 'three';

/* =====================================================================
   Cloudline Express — a sky-fishing tycoon.
   Drop a lantern hook from your flying train, dodge creatures on the
   way down, catch them on the way up, sell the haul, grow the train.
   Art: generated with Higgsfield (GPT Image 2.5), served from its CDN.
   ===================================================================== */

// ---------- Assets --------------------------------------------------------
const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Fu1S7lcqfrypmSlsVrTUVcZvUa/';
const CDN_ORIG = 'https://d8j0ntlcm91z4.cloudfront.net/user_3Fu1S7lcqfrypmSlsVrTUVcZvUa/hf_20261007_';
// key: [compressed webp id, original png id]
const ASSETS = {
  bg_cloud:   ['9e265c5e-8b5d-4565-b07e-84691aa2474d', '184855_839e17e9-3f88-4d5f-9616-302b4c87f2fc'],
  bg_storm:   ['38356ebd-1869-46c6-abd3-d223e6b133bd', '184812_32b81de3-6de9-4a52-9124-75be17937620'],
  bg_aurora:  ['e07ab915-6e40-405d-9f56-19fdad7e0ccc', '184855_fdd44e10-ddb4-47f3-861b-b6bc4fe72088'],
  bg_ruins:   ['166a1eab-55c2-4f96-b739-bdf62cce8677', '184814_14c541f5-5873-4418-b76e-a8923f3b771a'],
  bg_void:    ['d9b46527-e099-494c-8ae6-66cb5585aa47', '184813_67cfb56c-c383-45f4-bdcf-2b510a2c856a'],
  train:      ['f3d56c70-ecff-4354-90fd-569fe52866cb', '184855_d027b758-4c49-4efa-aaa7-cc2661e81740'],
  puffling:   ['5d7e5b12-303c-4989-b371-a58303091eaf', '184813_22c258ff-a231-4d2e-9eec-506de7205983'],
  skyjelly:   ['a010d879-65f8-4651-b0f0-bcb47cfaf687', '184811_2b65bdf9-ac94-4fb0-a416-8df08357ff36'],
  sunkoi:     ['aaf8e46b-f6c1-43cc-b0b9-43e00813081e', '184812_b3958a16-dab7-422f-a288-ae759b3b65de'],
  rainpuffer: ['552716b2-f755-4f87-be48-872f27e4b2a6', '184813_094b1335-2b8f-497d-85e2-5ccd07bddd01'],
  stormeel:   ['4609301b-dcf3-4870-9d6f-9a96185e6e5b', '184812_0befc99f-bd94-4402-871a-126584600ad0'],
  manta:      ['6dccecf3-f38e-4335-8a24-ebc0bfd7ad0e', '184856_9dc3b80f-ebfe-4355-a7a6-2c13f2bebfd6'],
  seahorse:   ['cdc99175-8983-4535-823a-6a52283576a6', '184918_4ed0c311-be2a-4057-8ec1-d7e93f0cc777'],
  turtle:     ['b0261ed7-98c7-4e6c-aca3-182ae12620d9', '184906_b1820999-f45a-44db-bcdc-5949aa147eee'],
  angler:     ['f94336d1-f500-440f-ba52-39b433925467', '184906_5299d965-3356-408c-ac1a-2dbd66c181f9'],
  lantern:    ['0a35c7cb-1255-448b-a5f5-df307dec0729', '184907_7bab2ce1-3bd3-4489-b07c-af8fc3703385'],
  carp:       ['033e56f1-11c9-4c87-8dae-1fe10ddbeb62', '184920_e5455a08-5e3f-440e-b6f9-fcec9e01f6e5'],
  whale:      ['d558a49a-3295-4ddd-b720-57302e5d2776', '185129_ee8854f9-bd56-4a82-943d-207a069da2d3'],
  squid:      ['217ea702-cf10-498e-b503-6d4ea916fbe4', '185130_4fd18b4d-a8f2-4286-bd92-918feaeb0ee1'],
  nebularay:  ['f9d9ce5e-8fee-4d69-92ee-d839ec233a56', '185222_9c675c31-84a8-4d54-8e94-b65cb9eeb6d3'],
  leviathan:  ['4311a224-f057-4f58-ad34-f714c5f28eb9', '185222_9d91e626-309d-445a-afeb-785282103852'],
};
const assetUrls = key => {
  const [webp, png] = ASSETS[key];
  return [CDN + webp + '.webp', CDN_ORIG + png + '.png'];
};
const iconUrl = key => CDN + ASSETS[key][0] + '.webp';

// ---------- World data ----------------------------------------------------
const BIOMES = [
  { id: 'cloud',  name: 'Cloud Sea',        from: 0,   to: 120,  bg: 'bg_cloud',  fog: 0xf2c3b4, puff: 0xffffff, tint: '#ffd9c2' },
  { id: 'storm',  name: 'Storm Belt',       from: 120, to: 300,  bg: 'bg_storm',  fog: 0x2c2a63, puff: 0x8f94d6, tint: '#8f94d6' },
  { id: 'aurora', name: 'Aurora Reef',      from: 300, to: 550,  bg: 'bg_aurora', fog: 0x0f2f48, puff: 0x63e2d3, tint: '#63e2d3' },
  { id: 'ruins',  name: 'Sunken Sky City',  from: 550, to: 850,  bg: 'bg_ruins',  fog: 0x18265a, puff: 0xf3c46b, tint: '#f3c46b' },
  { id: 'void',   name: 'The Underneath',   from: 850, to: 1400, bg: 'bg_void',   fog: 0x0b0718, puff: 0xa47bff, tint: '#a47bff' },
];
const biomeAt = d => BIOMES.find(b => d < b.to) || BIOMES[BIOMES.length - 1];

// size = on-screen width in metres; flip = art faces right instead of left
const SPECIES = [
  { id: 'puffling',   name: 'Puffling',          biome: 0, min: 4,    value: 2,     size: 1.3, speed: 0.9, weight: 10, blurb: 'A cloud with ambitions.' },
  { id: 'skyjelly',   name: 'Blush Jelly',       biome: 0, min: 14,   value: 4,     size: 1.1, speed: 0.4, weight: 7,  bob: 1, blurb: 'Drifts on warm updrafts.' },
  { id: 'sunkoi',     name: 'Sunbeam Koi',       biome: 0, min: 45,   value: 14,    size: 1.9, speed: 1.6, weight: 2.5, glow: 0xffd27a, blurb: 'Only swims at golden hour.' },
  { id: 'rainpuffer', name: 'Drizzle Puffer',    biome: 1, min: 120,  value: 22,    size: 1.5, speed: 0.8, weight: 10, blurb: 'Permanently in a mood.' },
  { id: 'stormeel',   name: 'Volt Eel',          biome: 1, min: 145,  value: 38,    size: 2.6, speed: 2.0, weight: 6,  glow: 0x6fa8ff, blurb: 'Hums at 50 hertz.' },
  { id: 'manta',      name: 'Thunder Manta',     biome: 1, min: 200,  value: 75,    size: 2.8, speed: 1.4, weight: 2.5, glow: 0xffe066, blurb: 'Its wingbeat is the thunder.' },
  { id: 'seahorse',   name: 'Aurora Seahorse',   biome: 2, min: 300,  value: 120,   size: 1.2, speed: 0.6, weight: 10, bob: 1, glow: 0x63e2d3, blurb: 'Steers by the northern lights.' },
  { id: 'turtle',     name: 'Geode Turtle',      biome: 2, min: 340,  value: 190,   size: 2.4, speed: 0.7, weight: 6,  blurb: 'Two hundred years of crystal.' },
  { id: 'angler',     name: 'Prism Angler',      biome: 2, min: 420,  value: 340,   size: 2.0, speed: 1.3, weight: 2.5, glow: 0xff7bd5, blurb: 'Lures you in with rainbows.' },
  { id: 'lantern',    name: 'Lantern Moth',      biome: 3, min: 550,  value: 580,   size: 1.8, speed: 1.1, weight: 10, glow: 0xffa040, blurb: 'Lit the old city streets.' },
  { id: 'carp',       name: 'Clockwork Carp',    biome: 3, min: 600,  value: 900,   size: 2.0, speed: 1.0, weight: 6,  blurb: 'Still keeps perfect time.' },
  { id: 'whale',      name: 'Gilded Temple Whale', biome: 3, min: 700, value: 1900, size: 4.2, speed: 0.7, weight: 1.6, glow: 0xffd27a, blurb: 'Carries a whole shrine.' },
  { id: 'squid',      name: 'Star Squid',        biome: 4, min: 850,  value: 2900,  size: 2.0, speed: 1.0, weight: 10, flip: 1, glow: 0x7fe8ff, blurb: 'Made of the night sky.' },
  { id: 'nebularay',  name: 'Nebula Ray',        biome: 4, min: 930,  value: 4600,  size: 3.0, speed: 1.6, weight: 6,  glow: 0xff8ad8, blurb: 'Leaves a trail of new stars.' },
  { id: 'leviathan',  name: 'Leviathan of Dusk', biome: 4, min: 1080, value: 12500, size: 5.2, speed: 0.9, weight: 1,  glow: 0xff8040, blurb: 'The end of the line.' },
];
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));

const DEPTHS = [30, 50, 75, 100, 130, 170, 220, 270, 330, 400, 480, 570, 670, 780, 900, 1030, 1170, 1320];
const GEAR = {
  line:   { name: 'Longer line',    desc: l => `Reach ${DEPTHS[Math.min(l + 1, DEPTHS.length - 1)]} m`, now: l => `${DEPTHS[l]} m`, max: DEPTHS.length - 1, cost: l => Math.round(20 * 1.8 ** l) },
  cap:    { name: 'Bigger hook',     desc: l => `Hold ${4 + l} creatures`, now: l => `${3 + l} creatures`, max: 17, cost: l => Math.round(30 * 1.85 ** l) },
  speed:  { name: 'Brass winch',     desc: l => `Drop at ${Math.round(9 + 1.8 * (l + 1))} m/s`, now: l => `${Math.round(9 + 1.8 * l)} m/s`, max: 12, cost: l => Math.round(60 * 2.05 ** l) },
  shield: { name: 'Lantern shield',  desc: l => `Shrug off ${l + 1} bump${l ? 's' : ''} on the way down`, now: l => l ? `${l} bump${l > 1 ? 's' : ''}` : 'none', max: 5, cost: l => Math.round(180 * 3.4 ** l) },
};
const CARS = [
  { id: 'tea',   name: 'Tea Car',          blurb: 'Commuters pay for sky-brewed tea.',  base: 25,     growth: 1.15, inc: 0.4,  unlock: 0 },
  { id: 'aqua',  name: 'Aquarium Car',     blurb: '+8% sale price per level.',          base: 150,    growth: 1.4,  inc: 1,    unlock: 30, bonus: 0.08 },
  { id: 'obs',   name: 'Observatory',      blurb: 'Stargazing tours, priced to match.', base: 1500,   growth: 1.15, inc: 6,    unlock: 120 },
  { id: 'sleep', name: 'Sleeper Car',      blurb: 'Earns while you are away: +30 min cap per level.', base: 9000, growth: 1.17, inc: 22, unlock: 300 },
  { id: 'lounge', name: 'Stardust Lounge', blurb: 'Late-night jazz above the storms.',  base: 60000,  growth: 1.15, inc: 95,   unlock: 550 },
  { id: 'royal', name: 'Royal Carriage',   blurb: 'Nobility rides. Nobility tips.',     base: 500000, growth: 1.15, inc: 520,  unlock: 850 },
];
const carCost = (c, l) => Math.round(c.base * c.growth ** l);

// ---------- Save ----------------------------------------------------------
const SAVE_KEY = 'cloudline-express-v1';
const fresh = () => ({ coins: 0, gear: { line: 0, cap: 0, speed: 0, shield: 0 }, cars: {}, dex: {}, deepest: 0, biomes: [0], lastSeen: Date.now(), muted: false, runs: 0 });
let S = fresh();
try { const raw = localStorage.getItem(SAVE_KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); } catch (e) { /* storage blocked */ }
S.gear = Object.assign(fresh().gear, S.gear);
const save = () => { S.lastSeen = Date.now(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ } };

const lineDepth = () => DEPTHS[S.gear.line];
const capacity = () => 3 + S.gear.cap;
const dropSpeed = () => 9 + 1.8 * S.gear.speed;
const incomePerSec = () => CARS.reduce((t, c) => t + (S.cars[c.id] || 0) * c.inc, 0);
const valueMult = () => 1 + (S.cars.aqua || 0) * 0.08;
const offlineCapSec = () => (2 + 0.5 * (S.cars.sleep || 0)) * 3600;

// ---------- Utilities -----------------------------------------------------
const $ = s => document.querySelector(s);
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T', 'Qa'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.0+$/, '') + u[i];
}
function toast(msg) {
  const el = document.createElement('div');
  el.className = 'toast'; el.textContent = msg;
  $('#toasts').appendChild(el);
  setTimeout(() => el.remove(), 2700);
}
function buzz(ms) { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* ignore */ } }

// ---------- Audio (tiny synth) --------------------------------------------
let actx = null;
function audio() {
  if (S.muted) return null;
  if (!actx) { try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
  if (actx.state === 'suspended') actx.resume();
  return actx;
}
function blip(freq = 660, dur = 0.12, type = 'sine', vol = 0.12, slide = 1.5) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), g = a.createGain(), t = a.currentTime;
  o.type = type; o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  cast: () => { blip(320, 0.35, 'triangle', 0.1, 0.4); },
  bump: () => blip(140, 0.18, 'square', 0.06, 0.6),
  catch: n => blip(520 * 2 ** (Math.min(n, 14) / 12), 0.14, 'sine', 0.13, 1.3),
  coin: () => { blip(988, 0.08, 'square', 0.04, 1); setTimeout(() => blip(1319, 0.14, 'square', 0.04, 1), 70); },
  buy: () => { blip(660, 0.1, 'triangle', 0.1, 1.5); setTimeout(() => blip(990, 0.12, 'triangle', 0.08, 1.2), 80); },
  biome: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.4, 'sine', 0.07, 1), i * 110)); },
};

// ---------- Renderer & scene ----------------------------------------------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BIOMES[0].fog, 20, 75);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
const CAM_Z = 16;
camera.position.set(0, 2, CAM_Z);
scene.add(camera);

let viewH = 1, viewW = 1, halfW = 4;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  viewH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  viewW = viewH * camera.aspect;
  halfW = Math.min(viewW / 2, 6.5) - 0.35;
  layoutBackdrop();
  layoutTrain();
}

// ---------- Procedural textures -------------------------------------------
function radialTex(stops, size = 128) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => grd.addColorStop(o, col));
  g.fillStyle = grd; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.25, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]);
const puffTex = (() => {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  for (let i = 0; i < 14; i++) {
    const x = s / 2 + rand(-60, 60), y = s / 2 + rand(-30, 30), r = rand(40, 80);
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,.55)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function fallbackCreatureTex(color = '#fff') {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = color; g.beginPath(); g.ellipse(64, 64, 48, 30, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(104, 64); g.lineTo(126, 40); g.lineTo(126, 88); g.fill();
  g.fillStyle = '#222'; g.beginPath(); g.arc(38, 58, 6, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function flatTex(hex) {
  const t = new THREE.DataTexture(new Uint8Array([(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, 255]), 1, 1);
  t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

// ---------- Texture loading -----------------------------------------------
const TEX = {};
const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
function loadTex(key) {
  const urls = assetUrls(key);
  return new Promise(res => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) return res(null);
      loader.load(urls[i++], t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; res(t); }, undefined, next);
    };
    next();
  });
}
async function loadAll() {
  const keys = Object.keys(ASSETS);
  let done = 0;
  await Promise.all(keys.map(k => loadTex(k).then(t => {
    TEX[k] = t; done++;
    $('#loadBar').style.width = (done / keys.length * 100) + '%';
  })));
}

// ---------- Backdrop (painted biome art, cross-faded in a shader) ---------
const BACK_Z = -120;
const backMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: null }, tB: { value: null }, mixv: { value: 0 }, scl: { value: new THREE.Vector2(1, 1) }, scroll: { value: 0 }, dim: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tA, tB; uniform float mixv, scroll, dim; uniform vec2 scl; varying vec2 vUv;
    vec2 m(vec2 uv){ uv = (uv - 0.5) * scl + 0.5; uv.y += scroll; uv.y = 1.0 - abs(mod(uv.y, 2.0) - 1.0); return uv; }
    void main(){
      vec2 uv = m(vUv);
      vec3 c = mix(texture2D(tA, uv).rgb, texture2D(tB, uv).rgb, mixv) * dim;
      float v = smoothstep(1.15, 0.35, length(vUv - 0.5)); c *= mix(0.72, 1.0, v);
      gl_FragColor = vec4(c, 1.0);
      #include <colorspace_fragment>
    }`,
  depthWrite: false, fog: false,
});
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backMat);
backdrop.renderOrder = -10;
backdrop.position.z = BACK_Z;
camera.add(backdrop);
function layoutBackdrop() {
  const h = 2 * -BACK_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.02, w = h * camera.aspect;
  backdrop.scale.set(w, h, 1);
  const A = w / h, T = 720 / 1286;
  // cover-fit, slightly zoomed so the scroll has room
  if (A > T) backMat.uniforms.scl.value.set(0.92, 0.92 * T / A); else backMat.uniforms.scl.value.set(0.92 * A / T, 0.92);
}

// ---------- Ambient layers: cloud puffs, distant silhouettes, sparkles -----
const MAX_D = 1400;
const decor = new THREE.Group(); scene.add(decor);
function buildDecor() {
  for (let y = 4; y > -MAX_D - 30; y -= 3.2) {
    const b = biomeAt(-y);
    const z = rand(-38, -7);
    const spread = (viewW / 2 + 6) * (CAM_Z - z) / CAM_Z;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, color: b.puff, transparent: true, opacity: rand(0.25, 0.6), depthWrite: false }));
    const s = rand(6, 16);
    m.scale.set(s, s * 0.55, 1);
    m.position.set(rand(-spread, spread), y + rand(-1.5, 1.5), z);
    m.userData.drift = rand(-0.25, 0.25);
    decor.add(m);
  }
  // distant silhouettes, slow and dark: depth without gameplay
  for (let i = 0; i < 70; i++) {
    const y = -rand(10, MAX_D);
    const choices = SPECIES.filter(s => s.biome === BIOMES.indexOf(biomeAt(-y)));
    const sp = choices[Math.floor(Math.random() * choices.length)];
    const t = TEX[sp.id]; if (!t) continue;
    const mat = new THREE.MeshBasicMaterial({ map: t, color: 0x1b1840, transparent: true, opacity: 0.35, depthWrite: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    const w = sp.size * rand(1.6, 2.6), ar = t.image.height / t.image.width;
    const dir = Math.random() < 0.5 ? -1 : 1;
    m.scale.set(w * (sp.flip ? -dir : dir) * -1, w * ar, 1);
    m.position.set(rand(-14, 14), y, rand(-32, -22));
    m.userData.silhouette = { dir, speed: rand(0.3, 0.8) };
    decor.add(m);
  }
}
// near-camera sparkle motes
const motes = (() => {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(-10, 10); pos[i * 3 + 1] = rand(-MAX_D, 6); pos[i * 3 + 2] = rand(-4, 5); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: glowTex, size: 0.22, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, color: 0xfff4e2 });
  const p = new THREE.Points(g, m); scene.add(p); return p;
})();
// a bank of thick cloud right under the train, so the hook plunges through it
const surfaceBank = new THREE.Group(); scene.add(surfaceBank);
function buildSurface() {
  for (let i = 0; i < 26; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: puffTex, color: 0xfff1e6, transparent: true, opacity: rand(0.55, 0.9), depthWrite: false }));
    const s = rand(5, 10); m.scale.set(s, s * 0.5, 1);
    m.position.set(rand(-12, 12), rand(-2.6, -0.2), rand(-4, 3.5));
    m.userData.drift = rand(0.2, 0.6);
    surfaceBank.add(m);
  }
}

// ---------- Train ---------------------------------------------------------
const trainGroup = new THREE.Group(); scene.add(trainGroup);
let trainMesh = null, trainW = 7, trainH = 3.9;
const carMeshes = [];
const TRAIN_Y = 3.3;
function labelTex(text) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(22,19,58,.82)'; roundRect(g, 4, 8, 248, 48, 24); g.fill();
  g.strokeStyle = 'rgba(243,196,107,.8)'; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#fff4e2'; g.font = '800 26px Nunito, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, 128, 33);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
function buildTrain() {
  const t = TEX.train;
  const mat = new THREE.MeshBasicMaterial({ map: t || flatTex(0x2b6a6a), transparent: true, depthWrite: false, fog: false });
  trainMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  trainMesh.renderOrder = 5;
  trainGroup.add(trainMesh);
  rebuildCars();
  layoutTrain();
}
function rebuildCars() {
  carMeshes.forEach(m => { trainGroup.remove(m); m.traverse(o => o.material && o.material.dispose()); });
  carMeshes.length = 0;
  const t = TEX.train; if (!t) return;
  CARS.forEach(c => {
    const lvl = S.cars[c.id] || 0; if (!lvl) return;
    const ct = t.clone(); ct.repeat.set(0.225, 1); ct.offset.set(0.004, 0); ct.needsUpdate = true;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ct, transparent: true, depthWrite: false, fog: false }));
    m.renderOrder = 5;
    const label = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.25), new THREE.MeshBasicMaterial({ map: labelTex(`${c.name} · ${lvl}`), transparent: true, depthWrite: false, fog: false }));
    label.renderOrder = 6;
    m.add(label); m.userData.label = label;
    trainGroup.add(m); carMeshes.push(m);
  });
  layoutTrain();
}
function layoutTrain() {
  if (!trainMesh) return;
  const ar = TEX.train ? TEX.train.image.width / TEX.train.image.height : 1.81;
  trainW = Math.min(9, viewW * 1.02); trainH = trainW / ar;
  trainMesh.scale.set(trainW, trainH, 1);
  const cx = halfW + 0.35 - trainW / 2 + 0.4;
  trainMesh.position.set(cx, 0, 0);
  const cw = trainW * 0.225, ch = trainH;
  carMeshes.forEach((m, i) => {
    m.scale.set(cw, ch, 1);
    m.position.set(cx - trainW / 2 - cw * (i + 0.5) * 0.97 + 0.05, 0, -0.01);
    const L = m.userData.label;
    L.scale.set(1.5 / cw, 1.5 / ch, 1); // keep label a fixed 1.5m wide
    L.position.set(0, 0.62, 0.01);
  });
  trainGroup.position.y = TRAIN_Y;
}
const trainSpan = () => trainW + carMeshes.length * trainW * 0.225 * 0.97;

// ---------- Hook & line ---------------------------------------------------
const hook = new THREE.Group(); scene.add(hook);
const hookOrb = new THREE.Mesh(new THREE.SphereGeometry(0.16, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe3a3, fog: false }));
const hookGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: glowTex, color: 0xffc66b, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
hookGlow.renderOrder = 4;
hook.add(hookGlow, hookOrb);
const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const line = new THREE.Line(lineGeo, new THREE.LineBasicMaterial({ color: 0xfff4e2, transparent: true, opacity: 0.75, fog: false }));
scene.add(line);
const HOOK_HOME = new THREE.Vector3(0, 0.9, 0.2);

// ---------- Creatures -----------------------------------------------------
const swim = new THREE.Group(); scene.add(swim);
let creatures = [];
const MATS = {};
function matFor(sp) {
  if (!MATS[sp.id]) MATS[sp.id] = new THREE.MeshBasicMaterial({ map: TEX[sp.id] || fallbackCreatureTex(), transparent: true, depthWrite: false, alphaTest: 0.02 });
  return MATS[sp.id];
}
const GLOW_MATS = {};
const glowMatFor = sp => GLOW_MATS[sp.id] || (GLOW_MATS[sp.id] = new THREE.MeshBasicMaterial({ map: glowTex, color: sp.glow, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
const PLANE = new THREE.PlaneGeometry(1, 1);
function spawnCreature(sp, y) {
  const g = new THREE.Group();
  const t = TEX[sp.id];
  const ar = t ? t.image.height / t.image.width : 0.6;
  const w = sp.size, h = sp.size * ar;
  if (sp.glow) { const gl = new THREE.Mesh(PLANE, glowMatFor(sp)); gl.scale.set(w * 1.6, w * 1.6, 1); gl.position.z = -0.05; g.add(gl); }
  const body = new THREE.Mesh(PLANE, matFor(sp)); body.scale.set(w, h, 1); g.add(body);
  const dir = Math.random() < 0.5 ? -1 : 1;
  const c = { sp, g, body, w, h, x: rand(-halfW, halfW), y, baseY: y, dir, speed: sp.speed * rand(0.7, 1.3), phase: rand(0, 6.28), state: 'free', stun: 0, z: rand(-0.6, 0.6) };
  g.position.set(c.x, y, c.z);
  swim.add(g); creatures.push(c);
  return c;
}
function pickSpecies(depth) {
  const b = BIOMES.indexOf(biomeAt(depth));
  const pool = SPECIES.filter(s => s.biome === b && depth >= s.min);
  if (!pool.length) return null;
  let r = Math.random() * pool.reduce((t, s) => t + s.weight, 0);
  for (const s of pool) { if ((r -= s.weight) <= 0) return s; }
  return pool[0];
}
function populate() {
  creatures.forEach(c => swim.remove(c.g));
  creatures = [];
  const bottom = lineDepth() + 18;
  for (let d = 5; d < bottom; d += rand(1.7, 3.2)) {
    const sp = pickSpecies(d); if (sp) spawnCreature(sp, -d);
  }
}

// ---------- Game state ----------------------------------------------------
const G = { state: 'idle', t: 0, depth: 0, maxDepth: 0, shields: 0, caught: [], vy: 0, targetX: 0, dragging: false, lastBiome: 0, surfaceT: 0, newSpecies: new Set(), camX: 0, camZ: CAM_Z, panel: null };

function cast() {
  if (G.state !== 'idle') return;
  closeSheet();
  audio();
  sfx.cast(); buzz(12);
  populate();
  G.state = 'down'; G.t = 0; G.depth = 0; G.vy = 2;
  G.maxDepth = lineDepth(); G.reached = 0; G.shields = S.gear.shield; G.caught = []; G.newSpecies = new Set();
  G.targetX = hook.position.x; G.lastBiome = 0;
  S.runs++;
  $('#dock').hidden = true; $('#runhud').hidden = false; $('#meter').hidden = false;
  $('#hint').hidden = S.runs > 3;
  $('#hint').textContent = 'Drag to steer. Dodge on the way down.';
  buildMeter();
  updateRunHud();
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ }
}
function startReel(reason) {
  G.state = 'up'; G.t = 0;
  if (reason === 'bumped') { sfx.bump(); buzz(30); }
  $('#hint').textContent = 'Reeling in! Sweep through creatures to catch them.';
  if (S.runs > 3) $('#hint').hidden = true;
}
function updateRunHud() {
  $('#depth').innerHTML = `${Math.round(G.depth)}<small> m</small>`;
  $('#haulChip').textContent = `${G.caught.length} / ${capacity()} caught`;
  const sc = $('#shieldChip');
  sc.hidden = !S.gear.shield; sc.textContent = `Shield ${G.shields}`;
  const pct = clamp(G.depth / meterMax(), 0, 1) * 100;
  const mk = $('#meter .mark'); if (mk) mk.style.top = pct + '%';
}
const meterMax = () => Math.max(lineDepth(), 60);
function buildMeter() {
  const m = $('#meter'); m.innerHTML = '';
  const max = meterMax();
  BIOMES.forEach(b => {
    if (b.from >= max) return;
    const el = document.createElement('div'); el.className = 'band';
    el.style.top = (b.from / max * 100) + '%'; el.style.height = ((Math.min(b.to, max) - b.from) / max * 100) + '%';
    el.style.background = b.tint; el.style.opacity = '.55';
    m.appendChild(el);
  });
  const mx = document.createElement('div'); mx.className = 'max'; mx.style.top = (lineDepth() / max * 100) + '%'; m.appendChild(mx);
  const mk = document.createElement('div'); mk.className = 'mark'; m.appendChild(mk);
}
function biomeToast(b) {
  const el = $('#biomeToast');
  el.innerHTML = `<span>${b.from} m</span>${b.name}`;
  el.classList.add('show');
  clearTimeout(biomeToast.t); biomeToast.t = setTimeout(() => el.classList.remove('show'), 1800);
}

function surface() {
  G.state = 'surface'; G.surfaceT = 0;
  $('#runhud').hidden = true; $('#meter').hidden = true;
  const counts = {};
  G.caught.forEach(c => { counts[c.sp.id] = (counts[c.sp.id] || 0) + 1; });
  let total = 0, firstBonus = 0;
  const rows = Object.entries(counts).map(([id, n]) => {
    const sp = SP[id], v = Math.round(sp.value * valueMult()) * n;
    total += v;
    const isNew = !S.dex[id];
    if (isNew) firstBonus += sp.value * 5;
    S.dex[id] = (S.dex[id] || 0) + n;
    return { sp, n, v, isNew };
  }).sort((a, b) => b.v - a.v);
  const deeper = Math.round(G.reached) > S.deepest;
  if (deeper) S.deepest = Math.round(G.reached);
  const payout = total + firstBonus;
  setTimeout(() => showHaul(rows, total, firstBonus, payout, deeper), 900);
}
function showHaul(rows, total, firstBonus, payout, deeper) {
  const m = $('#modal');
  const haul = rows.length
    ? `<div class="haul">${rows.map(r => `<div>${r.isNew ? '<span class="new">NEW</span>' : ''}<img src="${iconUrl(r.sp.id)}" alt=""><b>${r.n}× ${r.sp.name}</b><i class="num">${fmt(r.v)}</i></div>`).join('')}</div>`
    : '<p class="sub">The hook came back empty. Steer through creatures on the way up.</p>';
  m.innerHTML = `<div class="card" role="dialog" aria-label="Haul">
      <h2>${rows.length ? 'Fine haul!' : 'Nothing biting'}</h2>
      <p class="sub">Reached ${Math.round(G.reached)} m${deeper ? ' · new record' : ''}</p>
      ${haul}
      ${firstBonus ? `<p class="bonusline">+${fmt(firstBonus)} first-catch bonus for the Skydex</p>` : ''}
      <div class="total num"><span class="coin"></span>${fmt(payout)}</div>
      <button class="big" id="bankBtn">Sell the haul</button>
    </div>`;
  m.hidden = false;
  $('#bankBtn').onclick = () => {
    m.hidden = true;
    S.coins += payout;
    if (payout) { sfx.coin(); buzz(15); coinBurst(payout); }
    G.caught.forEach(c => swim.remove(c.g));
    G.caught = [];
    G.state = 'idle';
    $('#dock').hidden = false;
    populate();
    save(); refreshHud();
  };
}
function coinBurst(n) {
  const el = document.createElement('div'); el.className = 'pop num';
  el.textContent = '+' + fmt(n);
  const r = $('#coins').getBoundingClientRect();
  el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = (r.bottom + 30) + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1000);
}

// ---------- Input ---------------------------------------------------------
let dragStartX = 0, dragStartHook = 0;
const worldPerPx = () => viewW / window.innerWidth;
canvas.addEventListener('pointerdown', e => {
  if (G.state === 'idle') return;
  G.dragging = true; dragStartX = e.clientX; dragStartHook = G.targetX;
  canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!G.dragging) return;
  G.targetX = clamp(dragStartHook + (e.clientX - dragStartX) * worldPerPx() * 1.35, -halfW, halfW);
});
const endDrag = () => { G.dragging = false; };
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
window.addEventListener('keydown', e => {
  if (e.key === 'ArrowLeft') G.targetX = clamp(G.targetX - 0.9, -halfW, halfW);
  if (e.key === 'ArrowRight') G.targetX = clamp(G.targetX + 0.9, -halfW, halfW);
  if ((e.key === ' ' || e.key === 'Enter') && G.state === 'idle' && !G.panel && $('#modal').hidden) { e.preventDefault(); cast(); }
});

// ---------- Main loop -----------------------------------------------------
const clock = new THREE.Clock();
let incomeAcc = 0, saveAcc = 0, hudAcc = 0;
const fogA = new THREE.Color(), fogB = new THREE.Color();

function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  G.t += dt;

  // passive income
  incomeAcc += incomePerSec() * dt;
  if (incomeAcc >= 1) { const n = Math.floor(incomeAcc); S.coins += n; incomeAcc -= n; }
  if ((hudAcc += dt) > 0.25) { hudAcc = 0; refreshHud(true); }
  if ((saveAcc += dt) > 5) { saveAcc = 0; save(); }

  // hook motion
  if (G.state === 'idle') {
    hook.position.x = lerp(hook.position.x, HOOK_HOME.x + Math.sin(t * 1.3) * 0.15, 0.1);
    hook.position.y = HOOK_HOME.y + Math.sin(t * 2) * 0.12;
    G.targetX = hook.position.x;
  } else if (G.state === 'down') {
    G.vy = Math.min(dropSpeed(), G.vy + dt * 14);
    hook.position.y -= G.vy * dt;
    hook.position.x = lerp(hook.position.x, G.targetX, 1 - Math.exp(-dt * 10));
    G.depth = Math.max(0, -hook.position.y);
    G.reached = Math.max(G.reached, G.depth);
    if (G.depth >= G.maxDepth) { hook.position.y = -G.maxDepth; G.depth = G.reached = G.maxDepth; startReel('line'); }
  } else if (G.state === 'up') {
    const full = G.caught.length >= capacity();
    const v = Math.max(13, dropSpeed() * 1.5) * (full ? 2.4 : 1) * Math.min(1, 0.3 + G.t * 1.4);
    hook.position.y += v * dt;
    hook.position.x = lerp(hook.position.x, G.targetX, 1 - Math.exp(-dt * 10));
    G.depth = Math.max(0, -hook.position.y);
    if (hook.position.y >= HOOK_HOME.y) { hook.position.y = HOOK_HOME.y; surface(); }
  } else if (G.state === 'surface') {
    hook.position.x = lerp(hook.position.x, HOOK_HOME.x, 0.08);
    hook.position.y = lerp(hook.position.y, HOOK_HOME.y, 0.1);
  }
  hookGlow.material.opacity = 0.8 + Math.sin(t * 6) * 0.15;

  // biome entry
  if (G.state === 'down') {
    const bi = BIOMES.indexOf(biomeAt(G.depth));
    if (bi > G.lastBiome) {
      G.lastBiome = bi;
      biomeToast(BIOMES[bi]);
      if (!S.biomes.includes(bi)) { S.biomes.push(bi); sfx.biome(); toast(`Discovered ${BIOMES[bi].name}!`); }
    }
  }
  if (G.state === 'down' || G.state === 'up') updateRunHud();

  // creatures
  const hx = hook.position.x, hy = hook.position.y;
  for (const c of creatures) {
    if (c.state === 'caught') continue;
    c.x += c.dir * c.speed * dt;
    if (c.x > halfW + 0.6) c.dir = -1; else if (c.x < -halfW - 0.6) c.dir = 1;
    const bobAmt = c.sp.bob ? 0.5 : 0.18;
    c.y = c.baseY + Math.sin(t * (c.sp.bob ? 1.2 : 2) + c.phase) * bobAmt;
    if (c.stun > 0) { c.stun -= dt; c.g.rotation.z = Math.sin(c.stun * 30) * 0.2; } else c.g.rotation.z = Math.sin(t * 2 + c.phase) * 0.05;
    c.g.position.set(c.x, c.y, c.z);
    const facing = c.sp.flip ? -c.dir : c.dir; // art faces left by default
    c.body.scale.x = (facing > 0 ? -1 : 1) * c.w;

    if ((G.state === 'down' || G.state === 'up') && c.stun <= 0) {
      const dx = (hx - c.x) / (c.w * 0.42 + 0.18), dy = (hy - c.y) / (c.h * 0.42 + 0.18);
      if (dx * dx + dy * dy < 1) {
        if (G.state === 'down') {
          if (G.shields > 0) { G.shields--; c.stun = 1.2; c.dir = hx > c.x ? -1 : 1; c.speed *= 2; sfx.bump(); buzz(10); }
          else { c.stun = 1.2; startReel('bumped'); }
        } else if (G.caught.length < capacity()) {
          c.state = 'caught'; G.caught.push(c);
          if (!S.dex[c.sp.id] && !G.newSpecies.has(c.sp.id)) { G.newSpecies.add(c.sp.id); toast(`New species: ${c.sp.name}!`); }
          sfx.catch(G.caught.length); buzz(8);
          if (G.caught.length === capacity()) { $('#hint').hidden = false; $('#hint').textContent = 'Hook full! Racing home.'; }
        }
      }
    }
  }
  // caught cluster dangles under the hook
  G.caught.forEach((c, i) => {
    const ang = i * 2.39996, r = 0.25 + Math.sqrt(i) * 0.38;
    const lift = G.state === 'surface' ? G.surfaceT * G.surfaceT * 9 : 0;
    const tx = hx + Math.cos(ang) * r * 0.9, ty = hy - 0.55 - Math.abs(Math.sin(ang)) * r - i * 0.06 + lift;
    c.x = lerp(c.x, tx, 0.25); c.y = lerp(c.y, ty, 0.25);
    const shrink = clamp(1.4 / c.w, 0.35, 0.8);
    c.g.position.set(c.x, c.y, 0.3 + i * 0.01);
    c.g.scale.setScalar(lerp(c.g.scale.x, shrink, 0.2));
    c.g.rotation.z = Math.sin(t * 5 + i) * 0.25;
  });
  if (G.state === 'surface') G.surfaceT += dt;

  // line from the train's winch to the hook
  const p = lineGeo.attributes.position;
  p.setXYZ(0, HOOK_HOME.x, TRAIN_Y - trainH * 0.25, 0.1); p.setXYZ(1, hook.position.x, hook.position.y + 0.12, 0.1); p.needsUpdate = true;

  // decor drift
  for (const m of decor.children) {
    if (m.userData.silhouette) {
      const s = m.userData.silhouette; m.position.x += s.dir * s.speed * dt;
      if (Math.abs(m.position.x) > 18) m.position.x = -Math.sign(m.position.x) * 18;
    } else {
      m.position.x += m.userData.drift * dt;
      if (m.position.x > 22) m.position.x = -22; else if (m.position.x < -22) m.position.x = 22;
    }
  }
  for (const m of surfaceBank.children) { m.position.x -= m.userData.drift * dt; if (m.position.x < -14) m.position.x = 14; }
  trainGroup.position.y = TRAIN_Y + Math.sin(t * 1.6) * 0.08;
  trainGroup.rotation.z = Math.sin(t * 0.9) * 0.008;

  // camera
  let camY = 1.6, wantX = 0, wantZ = CAM_Z;
  if (G.state === 'down') camY = hook.position.y - viewH * 0.18;
  else if (G.state === 'up') camY = hook.position.y + viewH * 0.16;
  else if (G.state === 'surface') camY = 1.6;
  if (G.panel === 'train' && carMeshes.length) {
    const span = trainSpan() + 1.5;
    const needW = span, needZ = needW / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    wantZ = Math.max(CAM_Z, needZ);
    wantX = trainMesh.position.x + trainW / 2 - span / 2 + 0.75;
    camY = TRAIN_Y - (wantZ - CAM_Z) * 0.15;
  }
  const k = 1 - Math.exp(-dt * (G.state === 'down' || G.state === 'up' ? 9 : 3));
  camera.position.y = lerp(camera.position.y, camY, k);
  G.camX = lerp(G.camX, wantX, 1 - Math.exp(-dt * 3)); G.camZ = lerp(G.camZ, wantZ, 1 - Math.exp(-dt * 3));
  camera.position.x = G.camX; camera.position.z = G.camZ;

  // biome-blended backdrop + fog
  const camDepth = Math.max(0, -camera.position.y);
  const bi = BIOMES.indexOf(biomeAt(camDepth));
  const b = BIOMES[bi], nb = BIOMES[Math.min(bi + 1, BIOMES.length - 1)];
  const edge = 40, f = clamp((camDepth - (b.to - edge)) / edge, 0, 1);
  backMat.uniforms.tA.value = TEX[b.bg] || flatTex(b.fog);
  backMat.uniforms.tB.value = TEX[nb.bg] || flatTex(nb.fog);
  backMat.uniforms.mixv.value = f;
  backMat.uniforms.scroll.value = -camDepth / 650;
  fogA.setHex(b.fog); fogB.setHex(nb.fog); scene.fog.color.copy(fogA.lerp(fogB, f));
  scene.fog.near = camera.position.z + 4; scene.fog.far = camera.position.z + 60;

  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

// ---------- HUD & panels --------------------------------------------------
function refreshHud(light) {
  $('#coins').textContent = fmt(S.coins);
  const r = incomePerSec();
  $('#rate').textContent = `+${r >= 10 ? fmt(r) : r.toFixed(1)} / sec`;
  $('#recordVal').textContent = `${S.deepest} m`;
  $('#castDepth').textContent = `${lineDepth()} m line`;
  // notification dots when something is affordable
  const gearAff = Object.entries(GEAR).some(([k, g]) => S.gear[k] < g.max && S.coins >= g.cost(S.gear[k]));
  const carAff = CARS.some(c => S.deepest >= c.unlock && S.coins >= carCost(c, S.cars[c.id] || 0));
  document.querySelector('[data-panel="gear"] .dot').hidden = !gearAff;
  document.querySelector('[data-panel="train"] .dot').hidden = !carAff;
  if (G.panel && light) updatePanelButtons();
  if (light) return;
  $('#muteBtn').innerHTML = S.muted
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M23 9l-6 6M17 9l6 6"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';
}
const ICONS = {
  line: '<path d="M12 2v14"/><path d="M12 16a3 3 0 1 0 3 3"/>',
  cap: '<path d="M6 3v8a6 6 0 0 0 12 0V9"/><path d="M15 9l3-3 3 3"/>',
  speed: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-3"/><path d="M12 4v2M20 12h-2M4 12h2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
};
function openSheet(panel) {
  if (G.state !== 'idle') return;
  G.panel = panel;
  const titles = { gear: ['Gear', 'Upgrades for the hook and winch'], train: ['The Train', 'Carriages earn coins even while you are offline'], dex: ['Skydex', `${Object.keys(S.dex).length} of ${SPECIES.length} species caught`], map: ['Sky Layers', 'How deep the sky goes'] };
  $('#sheetTitle').textContent = titles[panel][0];
  $('#sheetSub').textContent = titles[panel][1];
  renderPanel();
  $('#sheet').classList.add('open'); $('#sheet').setAttribute('aria-hidden', 'false');
}
function closeSheet() { G.panel = null; $('#sheet').classList.remove('open'); $('#sheet').setAttribute('aria-hidden', 'true'); }
function buyBtn(id, cost, maxed, label) {
  if (maxed) return `<button class="buy maxed" disabled>${label || 'Max'}</button>`;
  return `<button class="buy num" data-buy="${id}" data-cost="${cost}" ${S.coins < cost ? 'disabled' : ''}><span class="coin"></span>${fmt(cost)}</button>`;
}
function renderPanel() {
  const body = $('#sheetBody');
  if (G.panel === 'gear') {
    body.innerHTML = Object.entries(GEAR).map(([k, g]) => {
      const l = S.gear[k], maxed = l >= g.max;
      return `<div class="row"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#f3c46b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg></div>
        <div><h3>${g.name} <span class="lvl">Lv ${l}</span></h3><p>Now: ${g.now(l)}${maxed ? '' : ` → ${g.desc(l)}`}</p></div>
        ${buyBtn('gear:' + k, maxed ? 0 : g.cost(l), maxed)}</div>`;
    }).join('');
  } else if (G.panel === 'train') {
    body.innerHTML = CARS.map(c => {
      const l = S.cars[c.id] || 0, locked = S.deepest < c.unlock;
      const earn = c.inc * Math.max(1, l);
      return `<div class="row ${locked ? 'locked' : ''}"><div class="ico"><svg viewBox="0 0 24 24" fill="none" stroke="#f3c46b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="11" rx="2"/><path d="M3 10h18M8 5v5M16 5v5"/><circle cx="7.5" cy="19" r="1.5"/><circle cx="16.5" cy="19" r="1.5"/></svg></div>
        <div><h3>${c.name} ${l ? `<span class="lvl">Lv ${l}</span>` : ''}</h3><p>${locked ? `Reach ${c.unlock} m to unlock` : `${c.blurb} ${l ? `Earning ${fmt(earn)}/s` : `+${c.inc}/s per level`}`}</p></div>
        ${locked ? '<button class="buy maxed" disabled>Locked</button>' : buyBtn('car:' + c.id, carCost(c, l), false)}</div>`;
    }).join('') + `<p style="margin:2px 4px;color:var(--muted);font-size:12px;font-weight:600">Offline earnings cap: ${offlineCapSec() / 3600} h. Close the game at your stop, collect at the next.</p>`;
  } else if (G.panel === 'dex') {
    body.innerHTML = BIOMES.map((b, bi) => `<div class="dexhead">${b.name} · ${b.from}–${b.to} m</div><div class="dex">${SPECIES.filter(s => s.biome === bi).map(s => {
      const n = S.dex[s.id] || 0;
      return `<div class="dexcard ${n ? '' : 'unknown'}"><img src="${iconUrl(s.id)}" alt="${n ? s.name : 'Unknown creature'}" loading="lazy"><b>${n ? s.name : '???'}</b><span>${n ? `${n} caught · ${fmt(s.value)} each` : `Found below ${s.min} m`}</span></div>`;
    }).join('')}</div>`).join('');
  } else if (G.panel === 'map') {
    body.innerHTML = BIOMES.map((b, bi) => {
      const seen = S.deepest >= b.from;
      return `<div class="row ${seen ? '' : 'locked'}"><div class="ico" style="background:${b.tint}33"><img src="${iconUrl(b.bg)}" alt="" style="object-fit:cover"></div>
        <div><h3>${seen ? b.name : 'Uncharted'}</h3><p>${b.from}–${b.to} m · ${SPECIES.filter(s => s.biome === bi).filter(s => S.dex[s.id]).length}/3 species</p></div>
        <span class="lvl" style="font-size:13px">${lineDepth() > b.from ? 'In reach' : `Need ${b.from} m`}</span></div>`;
    }).join('');
  }
  body.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => buy(btn.dataset.buy)));
}
function updatePanelButtons() {
  document.querySelectorAll('#sheetBody [data-buy]').forEach(b => { b.disabled = S.coins < +b.dataset.cost; });
}
function buy(id) {
  const [kind, key] = id.split(':');
  if (kind === 'gear') {
    const g = GEAR[key], l = S.gear[key];
    if (l >= g.max || S.coins < g.cost(l)) return;
    S.coins -= g.cost(l); S.gear[key]++;
    if (key === 'line' || key === 'cap') populate();
  } else {
    const c = CARS.find(x => x.id === key), l = S.cars[key] || 0;
    if (S.coins < carCost(c, l)) return;
    S.coins -= carCost(c, l); S.cars[key] = l + 1;
    rebuildCars();
    if (!l) toast(`${c.name} coupled to the train!`);
  }
  sfx.buy(); buzz(10);
  save(); refreshHud(); renderPanel();
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  audio();
  if (G.panel === t.dataset.panel) closeSheet(); else openSheet(t.dataset.panel);
}));
$('#sheetClose').addEventListener('click', closeSheet);
$('#castBtn').addEventListener('click', cast);
$('#muteBtn').addEventListener('click', () => { S.muted = !S.muted; save(); refreshHud(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) save(); else welcomeBack(); });
window.addEventListener('pagehide', save);
window.addEventListener('resize', resize);

// ---------- Offline earnings ----------------------------------------------
function welcomeBack() {
  const away = Math.min((Date.now() - (S.lastSeen || Date.now())) / 1000, offlineCapSec());
  const earned = Math.floor(away * incomePerSec());
  S.lastSeen = Date.now();
  if (away < 60 || earned < 1 || !$('#modal').hidden || G.state !== 'idle') return;
  const mins = Math.round(away / 60);
  const m = $('#modal');
  m.innerHTML = `<div class="card" role="dialog" aria-label="Welcome back">
    <h2>Welcome back aboard</h2>
    <p class="sub">The carriages kept working for ${mins >= 60 ? `${Math.floor(mins / 60)} h ${mins % 60} min` : `${mins} min`}.</p>
    <div class="total num"><span class="coin"></span>${fmt(earned)}</div>
    <button class="big" id="collectBtn">Collect</button></div>`;
  m.hidden = false;
  $('#collectBtn').onclick = () => { m.hidden = true; S.coins += earned; sfx.coin(); coinBurst(earned); save(); refreshHud(); };
}

// ---------- Boot ----------------------------------------------------------
(async function boot() {
  resize();
  await loadAll();
  const missing = Object.keys(ASSETS).filter(k => !TEX[k]);
  if (missing.length) console.warn('Missing art, using fallbacks:', missing);
  buildDecor(); buildSurface(); buildTrain();
  resize();
  populate();
  hook.position.copy(HOOK_HOME);
  refreshHud();
  $('#loadText').textContent = 'All aboard!';
  setTimeout(() => { $('#loader').style.opacity = '0'; setTimeout(() => $('#loader').remove(), 600); }, 250);
  if (S.runs === 0) setTimeout(() => toast('Tap Cast to drop your lantern hook'), 900);
  welcomeBack();
  requestAnimationFrame(frame);
})();
