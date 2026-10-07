import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { unzipSync } from 'fflate';

/* =====================================================================
   Cloudline Express — a sky-fishing tycoon.
   Drop a lantern hook from your flying train, dodge creatures on the
   way down, catch them on the way up, sell the haul, grow the train.
   Art: painted skies and creatures generated with Higgsfield, turned
   into textured 3D models with Higgsfield image-to-3D.
   ===================================================================== */

// ---------- Assets --------------------------------------------------------
const CDN = 'https://d2ol7oe51mr4n9.cloudfront.net/user_3Fu1S7lcqfrypmSlsVrTUVcZvUa/';
const CDN_ORIG = 'https://d8j0ntlcm91z4.cloudfront.net/user_3Fu1S7lcqfrypmSlsVrTUVcZvUa/hf_20261007_';
// one zip holding every optimised GLB (meshopt geometry + webp textures)
const MODEL_PACK = CDN + 'db5a7ee1-8c8a-4b01-8cc9-63be8011a5db.zip';
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
const assetUrls = key => { const [webp, png] = ASSETS[key]; return [CDN + webp + '.webp', CDN_ORIG + png + '.png']; };
const iconUrl = key => CDN + ASSETS[key][0] + '.webp';

// ---------- World data ----------------------------------------------------
// Each layer has its own light: sun colour/strength, sky & ground bounce, rim light.
const BIOMES = [
  { id: 'cloud',  name: 'Cloud Sea',       from: 0,   to: 120,  bg: 'bg_cloud',  fog: 0xf2c3b4, puff: 0xffffff, tint: '#ffd9c2', sun: 0xffd2a0, sunI: 2.4, sky: 0xffe6d2, ground: 0x7a5a7c, rim: 0xffb38a, exp: 0.92 },
  { id: 'storm',  name: 'Storm Belt',      from: 120, to: 300,  bg: 'bg_storm',  fog: 0x2c2a63, puff: 0x8f94d6, tint: '#8f94d6', sun: 0xb4bcff, sunI: 1.3, sky: 0x8a90ff, ground: 0x1a1840, rim: 0x6fa8ff, exp: 1.15, lightning: true },
  { id: 'aurora', name: 'Aurora Reef',     from: 300, to: 550,  bg: 'bg_aurora', fog: 0x0f2f48, puff: 0x63e2d3, tint: '#63e2d3', sun: 0x9fffe8, sunI: 1.5, sky: 0x63e2d3, ground: 0x2a1050, rim: 0xff7bd5, exp: 1.2 },
  { id: 'ruins',  name: 'Sunken Sky City', from: 550, to: 850,  bg: 'bg_ruins',  fog: 0x18265a, puff: 0xf3c46b, tint: '#f3c46b', sun: 0xffc27a, sunI: 1.7, sky: 0xffd08a, ground: 0x152050, rim: 0x7fb4ff, exp: 1.2 },
  { id: 'void',   name: 'The Underneath',  from: 850, to: 1400, bg: 'bg_void',   fog: 0x0b0718, puff: 0xa47bff, tint: '#a47bff', sun: 0xc8a8ff, sunI: 1.1, sky: 0xa47bff, ground: 0x050210, rim: 0x7fe8ff, exp: 1.3 },
];
const biomeAt = d => BIOMES.find(b => d < b.to) || BIOMES[BIOMES.length - 1];

// size = body length in metres; flip = art faced right instead of left
const SPECIES = [
  { id: 'puffling',   name: 'Puffling',          biome: 0, min: 4,    value: 2,     size: 1.3, speed: 0.9, weight: 10, blurb: 'A cloud with ambitions.' },
  { id: 'skyjelly',   name: 'Blush Jelly',       biome: 0, min: 14,   value: 4,     size: 1.0, speed: 0.4, weight: 7,  bob: 1, glow: 0xff9ad0, blurb: 'Drifts on warm updrafts.' },
  { id: 'sunkoi',     name: 'Sunbeam Koi',       biome: 0, min: 45,   value: 14,    size: 2.0, speed: 1.6, weight: 2.5, glow: 0xffd27a, rare: 1, blurb: 'Only swims at golden hour.' },
  { id: 'rainpuffer', name: 'Drizzle Puffer',    biome: 1, min: 120,  value: 22,    size: 1.5, speed: 0.8, weight: 10, blurb: 'Permanently in a mood.' },
  { id: 'stormeel',   name: 'Volt Eel',          biome: 1, min: 145,  value: 38,    size: 2.8, speed: 2.0, weight: 6,  glow: 0x6fa8ff, blurb: 'Hums at 50 hertz.' },
  { id: 'manta',      name: 'Thunder Manta',     biome: 1, min: 200,  value: 75,    size: 2.8, speed: 1.4, weight: 2.5, glow: 0xffe066, rare: 1, blurb: 'Its wingbeat is the thunder.' },
  { id: 'seahorse',   name: 'Aurora Seahorse',   biome: 2, min: 300,  value: 120,   size: 0.9, speed: 0.6, weight: 10, bob: 1, glow: 0x63e2d3, blurb: 'Steers by the northern lights.' },
  { id: 'turtle',     name: 'Geode Turtle',      biome: 2, min: 340,  value: 190,   size: 2.4, speed: 0.7, weight: 6,  glow: 0xb48cff, blurb: 'Two hundred years of crystal.' },
  { id: 'angler',     name: 'Prism Angler',      biome: 2, min: 420,  value: 340,   size: 2.0, speed: 1.3, weight: 2.5, glow: 0xff7bd5, rare: 1, blurb: 'Lures you in with rainbows.' },
  { id: 'lantern',    name: 'Lantern Moth',      biome: 3, min: 550,  value: 580,   size: 1.8, speed: 1.1, weight: 10, glow: 0xffa040, blurb: 'Lit the old city streets.' },
  { id: 'carp',       name: 'Clockwork Carp',    biome: 3, min: 600,  value: 900,   size: 2.0, speed: 1.0, weight: 6,  blurb: 'Still keeps perfect time.' },
  { id: 'whale',      name: 'Gilded Temple Whale', biome: 3, min: 700, value: 1900, size: 4.4, speed: 0.7, weight: 1.6, glow: 0xffd27a, rare: 1, blurb: 'Carries a whole shrine.' },
  { id: 'squid',      name: 'Star Squid',        biome: 4, min: 850,  value: 2900,  size: 1.9, speed: 1.0, weight: 10, flip: 1, glow: 0x7fe8ff, blurb: 'Made of the night sky.' },
  { id: 'nebularay',  name: 'Nebula Ray',        biome: 4, min: 930,  value: 4600,  size: 3.0, speed: 1.6, weight: 6,  glow: 0xff8ad8, blurb: 'Leaves a trail of new stars.' },
  { id: 'leviathan',  name: 'Leviathan of Dusk', biome: 4, min: 1080, value: 12500, size: 5.4, speed: 0.9, weight: 1,  glow: 0xff8040, rare: 1, blurb: 'The end of the line.' },
];
const SP = Object.fromEntries(SPECIES.map(s => [s.id, s]));

const DEPTHS = [30, 50, 75, 100, 130, 170, 220, 270, 330, 400, 480, 570, 670, 780, 900, 1030, 1170, 1320];
// Visible upgrade tiers: every few levels the hook and lantern visibly change.
const HOOK_TIERS = [
  { name: 'Brass',      color: 0xc08a45, emissive: 0x000000, metal: 1, rough: 0.35 },
  { name: 'Silver',     color: 0xe6ebf2, emissive: 0x000000, metal: 1, rough: 0.18 },
  { name: 'Gold',       color: 0xffc94a, emissive: 0x3a2400, metal: 1, rough: 0.15 },
  { name: 'Crystal',    color: 0x7fd8ea, emissive: 0x0e6f86, metal: 0.3, rough: 0.12 },
  { name: 'Starforged', color: 0xb894f0, emissive: 0x5a2dc0, metal: 0.6, rough: 0.15 },
];
const LANTERN_TIERS = [
  { name: 'Candle',   color: 0xffb35c },
  { name: 'Oil lamp', color: 0xffd98a },
  { name: 'Aurora',   color: 0x7ff5e6 },
  { name: 'Nebula',   color: 0xd29bff },
  { name: 'Sunheart', color: 0xfff1c4 },
];
const hookTier = () => Math.min(HOOK_TIERS.length - 1, Math.floor(S.gear.cap / 4));
const lanternTier = () => Math.min(LANTERN_TIERS.length - 1, Math.floor(S.gear.line / 4));
const GEAR = {
  line:   { name: 'Longer line',   tiers: LANTERN_TIERS, tierOf: l => Math.min(4, Math.floor(l / 4)), tierWord: 'lantern', desc: l => `Reach ${DEPTHS[Math.min(l + 1, DEPTHS.length - 1)]} m`, now: l => `${DEPTHS[l]} m`, max: DEPTHS.length - 1, cost: l => Math.round(20 * 1.8 ** l) },
  cap:    { name: 'Bigger hook',   tiers: HOOK_TIERS, tierOf: l => Math.min(4, Math.floor(l / 4)), tierWord: 'hook', desc: l => `Hold ${4 + l} creatures`, now: l => `${3 + l} creatures`, max: 17, cost: l => Math.round(30 * 1.85 ** l) },
  speed:  { name: 'Brass winch',   desc: l => `Drop at ${Math.round(9 + 1.8 * (l + 1))} m/s`, now: l => `${Math.round(9 + 1.8 * l)} m/s`, max: 12, cost: l => Math.round(60 * 2.05 ** l) },
  shield: { name: 'Lantern shield', desc: l => `Shrug off ${l + 1} bump${l ? 's' : ''} on the way down`, now: l => l ? `${l} bump${l > 1 ? 's' : ''}` : 'none', max: 5, cost: l => Math.round(180 * 3.4 ** l) },
};
const CARS = [
  { id: 'tea',    name: 'Tea Car',         blurb: 'Commuters pay for sky-brewed tea.',  base: 25,     growth: 1.15, inc: 0.4, unlock: 0 },
  { id: 'aqua',   name: 'Aquarium Car',    blurb: '+8% sale price per level.',          base: 150,    growth: 1.4,  inc: 1,   unlock: 30 },
  { id: 'obs',    name: 'Observatory',     blurb: 'Stargazing tours, priced to match.', base: 1500,   growth: 1.15, inc: 6,   unlock: 120 },
  { id: 'sleep',  name: 'Sleeper Car',     blurb: 'Earns while you are away: +30 min cap per level.', base: 9000, growth: 1.17, inc: 22, unlock: 300 },
  { id: 'lounge', name: 'Stardust Lounge', blurb: 'Late-night jazz above the storms.',  base: 60000,  growth: 1.15, inc: 95,  unlock: 550 },
  { id: 'royal',  name: 'Royal Carriage',  blurb: 'Nobility rides. Nobility tips.',     base: 500000, growth: 1.15, inc: 520, unlock: 850 },
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
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return String(n);
  const u = ['K', 'M', 'B', 'T', 'Qa'];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return (n >= 100 ? n.toFixed(0) : n >= 10 ? n.toFixed(1) : n.toFixed(2)).replace(/\.0+$/, '') + u[i];
}
function toast(msg, cls = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + cls; el.textContent = msg;
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
function noise(dur = 0.4, vol = 0.08, freq = 900) {
  const a = audio(); if (!a) return;
  const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  f.type = 'lowpass'; f.frequency.value = freq; g.gain.value = vol;
  src.buffer = buf; src.connect(f).connect(g).connect(a.destination); src.start();
}
const sfx = {
  cast: () => { blip(320, 0.35, 'triangle', 0.1, 0.4); noise(0.5, 0.05, 600); },
  splash: () => noise(0.6, 0.09, 1400),
  bump: () => { blip(140, 0.18, 'square', 0.06, 0.6); noise(0.2, 0.06, 500); },
  catch: n => blip(520 * 2 ** (Math.min(n, 14) / 12), 0.14, 'sine', 0.13, 1.3),
  rare: () => [784, 988, 1175, 1568].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'triangle', 0.08, 1), i * 70)),
  coin: () => { blip(988, 0.08, 'square', 0.04, 1); setTimeout(() => blip(1319, 0.14, 'square', 0.04, 1), 70); },
  buy: () => { blip(660, 0.1, 'triangle', 0.1, 1.5); setTimeout(() => blip(990, 0.12, 'triangle', 0.08, 1.2), 80); },
  tier: () => [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => blip(f, 0.3, 'triangle', 0.08, 1), i * 80)),
  biome: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.4, 'sine', 0.07, 1), i * 110)),
  thunder: () => noise(1.6, 0.12, 220),
};

// ---------- Renderer, post-processing, lights ------------------------------
const canvas = $('#scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
const DPR = Math.min(window.devicePixelRatio || 1, 1.75);
renderer.setPixelRatio(DPR);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(BIOMES[0].fog, 20, 75);
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 400);
const CAM_Z = 16;
camera.position.set(0, 2, CAM_Z);
scene.add(camera);

// soft studio reflections so metal and glass actually shine
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

const hemi = new THREE.HemisphereLight(0xffe6d2, 0x9a6f8c, 1.1); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd2a0, 2.6); sun.position.set(6, 10, 8); scene.add(sun); scene.add(sun.target);
const rim = new THREE.DirectionalLight(0xffb38a, 1.6); rim.position.set(-6, 3, -10); scene.add(rim); scene.add(rim.target);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.3, 0.3, 0.94);
composer.addPass(bloom);
composer.addPass(new OutputPass());

let viewH = 1, viewW = 1, halfW = 4;
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  renderer.setSize(w, h, false);
  composer.setSize(w, h);
  bloom.setSize(Math.round(w * DPR / 2), Math.round(h * DPR / 2));
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
const glowTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.22, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']]);
const sparkTex = radialTex([[0, 'rgba(255,255,255,1)'], [0.12, 'rgba(255,255,255,.9)'], [0.35, 'rgba(255,255,255,.15)'], [1, 'rgba(255,255,255,0)']], 64);
const puffTex = (() => {
  const s = 256, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  for (let i = 0; i < 16; i++) {
    const x = s / 2 + rand(-64, 64), y = s / 2 + rand(-28, 28), r = rand(40, 82);
    const grd = g.createRadialGradient(x, y - r * 0.25, 0, x, y, r);
    grd.addColorStop(0, 'rgba(255,255,255,.62)'); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const trailTex = (() => {
  const c = document.createElement('canvas'); c.width = 16; c.height = 128;
  const g = c.getContext('2d'), grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0)'); grd.addColorStop(1, 'rgba(255,255,255,.9)');
  g.fillStyle = grd; g.fillRect(0, 0, 16, 128);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
function fallbackCreatureTex() {
  const s = 128, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d');
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(64, 64, 48, 30, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.moveTo(104, 64); g.lineTo(126, 40); g.lineTo(126, 88); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function flatTex(hex) {
  const t = new THREE.DataTexture(new Uint8Array([(hex >> 16) & 255, (hex >> 8) & 255, hex & 255, 255]), 1, 1);
  t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true; return t;
}

// ---------- Loading: painted skies + the 3D model pack ---------------------
const TEX = {};
const MODELS = {};
const texLoader = new THREE.TextureLoader(); texLoader.setCrossOrigin('anonymous');
function loadTex(key) {
  if (TEX[key] !== undefined) return Promise.resolve(TEX[key]);
  const urls = assetUrls(key);
  return new Promise(res => {
    let i = 0;
    const next = () => {
      if (i >= urls.length) { TEX[key] = null; return res(null); }
      texLoader.load(urls[i++], t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; TEX[key] = t; res(t); }, undefined, next);
    };
    next();
  });
}
const gltfLoader = new GLTFLoader(); gltfLoader.setMeshoptDecoder(MeshoptDecoder);

// Higgsfield image-to-3D lays a model's length along either X or Z, with the
// source picture's left end at -X or +Z respectively. Turn every model so its
// head points down +X and scale its length to 1.
function prepModel(gltf, key) {
  const root = gltf.scene;
  const sp = SP[key];
  root.traverse(o => {
    if (!o.isMesh) return;
    o.frustumCulled = true;
    const m = o.material;
    if (m && m.isMeshStandardMaterial) {
      m.flatShading = true; // low-poly facets
      m.needsUpdate = true;
      m.roughness = clamp(m.roughness ?? 0.8, 0.5, 0.95);
      m.metalness = Math.min(m.metalness ?? 0, key === 'train' || key === 'carriage' || key === 'carp' ? 0.45 : 0.15);
      m.envMapIntensity = 0.6;
      if (sp && sp.glow) { // rare creatures shine with their own colours under bloom
        m.emissive = new THREE.Color(sp.glow);
        m.emissiveMap = m.map;
        m.emissiveIntensity = sp.rare ? 0.55 : 0.3;
      }
    }
  });
  // Low-poly pass: snap every vertex to a coarse grid so the surface collapses into
  // big flat facets (textures and UVs stay intact). The train keeps finer detail.
  const cellsAcross = key === 'train' ? 70 : key === 'carriage' ? 40 : 16;
  root.traverse(o => {
    if (!o.isMesh) return;
    const pos = o.geometry.attributes.position;
    o.geometry.computeBoundingBox();
    const gs = o.geometry.boundingBox.getSize(new THREE.Vector3());
    const step = Math.max(gs.x, gs.y, gs.z) / cellsAcross;
    for (let i = 0; i < pos.count; i++) {
      pos.setXYZ(i, Math.round(pos.getX(i) / step) * step, Math.round(pos.getY(i) / step) * step, Math.round(pos.getZ(i) / step) * step);
    }
    pos.needsUpdate = true;
    o.geometry.computeBoundingBox(); o.geometry.computeBoundingSphere();
  });
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  root.position.sub(c);
  const pivot = new THREE.Group(); pivot.add(root);
  // the train model came out mirrored (locomotive at -X), so it is handled like a left-facing creature
  const facesRight = !!(sp && sp.flip);
  const alongX = size.x > size.z * 1.15;
  if (alongX) pivot.rotation.y = facesRight ? 0 : Math.PI;
  else pivot.rotation.y = facesRight ? -Math.PI / 2 : Math.PI / 2;
  const len = Math.max(size.x, size.z, 0.001);
  const wrap = new THREE.Group(); wrap.add(pivot); wrap.scale.setScalar(1 / len);
  return { obj: wrap, h: size.y / len, d: Math.min(size.x, size.z) / len };
}
async function loadModelPack(onProgress) {
  const res = await fetch(MODEL_PACK, { mode: 'cors' });
  if (!res.ok) throw new Error('pack ' + res.status);
  const total = +res.headers.get('content-length') || 0;
  let buf;
  if (res.body && total) {
    const reader = res.body.getReader(), chunks = []; let got = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; onProgress(got / total); }
    buf = new Uint8Array(got); let o = 0; for (const ch of chunks) { buf.set(ch, o); o += ch.length; }
  } else buf = new Uint8Array(await res.arrayBuffer());
  const files = unzipSync(buf);
  await Promise.all(Object.entries(files).map(([name, bytes]) => new Promise(resolve => {
    const key = name.replace(/\.glb$/, '');
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    gltfLoader.parse(ab, '', g => { MODELS[key] = prepModel(g, key); resolve(); }, err => { console.warn('model', key, err); resolve(); });
  })));
}

// ---------- Backdrop (painted biome art, cross-faded in a shader) ---------
const BACK_Z = -120;
const backMat = new THREE.ShaderMaterial({
  uniforms: { tA: { value: null }, tB: { value: null }, mixv: { value: 0 }, scl: { value: new THREE.Vector2(1, 1) }, scroll: { value: 0 }, dim: { value: 1 }, flash: { value: 0 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tA, tB; uniform float mixv, scroll, dim, flash; uniform vec2 scl; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    vec3 samp(vec2 uv){ uv.y = 1.0 - abs(mod(uv.y, 2.0) - 1.0); return mix(texture2D(tA, uv).rgb, texture2D(tB, uv).rgb, mixv); }
    void main(){
      // the painting, re-cut as a low-poly triangle mesh: every facet takes the colour at its centre
      vec2 uv = (vUv - 0.5) * scl + 0.5; uv.y += scroll;
      vec2 cells = vec2(22.0, 22.0 * 1.786);
      vec2 g = uv * cells; vec2 id = floor(g); vec2 f = fract(g);
      bool flip = mod(id.x + id.y, 2.0) > 0.5;
      if (flip) f.x = 1.0 - f.x;
      bool upper = f.y > f.x;
      vec2 c2 = upper ? vec2(1.0 / 3.0, 2.0 / 3.0) : vec2(2.0 / 3.0, 1.0 / 3.0);
      if (flip) c2.x = 1.0 - c2.x;
      vec3 c = samp((id + c2) / cells) * dim;
      c *= 1.0 + (hash(id + (upper ? 0.37 : 0.71)) - 0.5) * 0.09 + (upper ? 0.03 : -0.03);
      float v = smoothstep(1.1, 0.25, length(vUv - 0.5)); c *= mix(0.5, 1.0, v);
      c += flash * vec3(0.75, 0.8, 1.0) * (0.4 + 0.6 * c);
      gl_FragColor = vec4(pow(c, vec3(1.12)) * 0.78, 1.0);
      #include <colorspace_fragment>
    }`,
  depthWrite: false, fog: false, toneMapped: false,
});
const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), backMat);
backdrop.renderOrder = -10;
backdrop.position.z = BACK_Z;
camera.add(backdrop);
function layoutBackdrop() {
  const h = 2 * -BACK_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.1, w = h * camera.aspect;
  backdrop.scale.set(w, h, 1);
  const A = w / h, T = 720 / 1286;
  if (A > T) backMat.uniforms.scl.value.set(0.9, 0.9 * T / A); else backMat.uniforms.scl.value.set(0.9 * A / T, 0.9);
}

// ---------- Ambient layers: volumetric-ish cloud banks, god rays, motes ----
const MAX_D = 1400;
const decor = new THREE.Group(); scene.add(decor);
// faceted cloud: a few low-detail icosahedra fused together, flat-bottomed
function cloudGeometry() {
  const parts = [];
  const n = 4 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const r = rand(0.38, 0.7);
    const g = new THREE.IcosahedronGeometry(r, 0);
    g.rotateY(rand(0, 6)); g.rotateX(rand(0, 6));
    g.translate((i / (n - 1) - 0.5) * 1.7 + rand(-0.15, 0.15), r * 0.35 + rand(-0.05, 0.12), rand(-0.3, 0.3));
    parts.push(g);
  }
  const m = mergeGeometries(parts); m.scale(1, 0.72, 0.85);
  return m;
}
const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 0.95, metalness: 0, emissive: 0x332a33, envMapIntensity: 0.3 });
const cloudSets = [];
function cloudField(count, place) {
  const geos = [cloudGeometry(), cloudGeometry(), cloudGeometry()];
  geos.forEach(geo => {
    const n = Math.ceil(count / geos.length);
    const im = new THREE.InstancedMesh(geo, cloudMat, n);
    const data = [];
    for (let i = 0; i < n; i++) { const d = place(); data.push(d); im.setColorAt(i, new THREE.Color(d.color)); }
    im.userData.data = data; im.frustumCulled = false;
    scene.add(im); cloudSets.push(im);
  });
}
const tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion(), tmpS = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpE = new THREE.Euler();
function updateClouds(dt) {
  for (const im of cloudSets) {
    const data = im.userData.data;
    for (let i = 0; i < data.length; i++) {
      const d = data[i];
      d.x += d.drift * dt; if (d.x > d.wrap) d.x = -d.wrap; else if (d.x < -d.wrap) d.x = d.wrap;
      tmpE.set(0, d.rot, 0); tmpQ.setFromEuler(tmpE);
      im.setMatrixAt(i, tmpM.compose(tmpP.set(d.x, d.y, d.z), tmpQ, tmpS.set(d.s, d.s * d.sy, d.s * 0.6)));
    }
    im.instanceMatrix.needsUpdate = true;
  }
}
function buildDecor() {
  // far cloud islands, tinted by the layer they float in
  cloudField(300, () => {
    const y = rand(-MAX_D - 20, 4), b = biomeAt(-y), z = rand(-42, -8);
    const wrap = (viewW / 2 + 8) * (CAM_Z - z) / CAM_Z + 4;
    return { x: rand(-wrap, wrap), y, z, s: rand(2.2, 6), sy: rand(0.7, 1.1), rot: rand(-0.6, 0.6), drift: rand(-0.35, 0.35), wrap, color: b.puff };
  });
  // distant 3D silhouettes cruising the far layer
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x15123a, transparent: true, opacity: 0.4, depthWrite: false });
  for (let i = 0; i < 36; i++) {
    const y = -rand(12, MAX_D);
    const choices = SPECIES.filter(s => s.biome === BIOMES.indexOf(biomeAt(-y)));
    const sp = choices[Math.floor(Math.random() * choices.length)];
    const M = MODELS[sp.id]; if (!M) continue;
    const m = M.obj.clone();
    m.traverse(o => { if (o.isMesh) o.material = shadowMat; });
    const s = sp.size * rand(1.8, 3);
    m.scale.multiplyScalar(s);
    const dir = Math.random() < 0.5 ? -1 : 1;
    m.rotation.y = dir > 0 ? 0 : Math.PI;
    m.position.set(rand(-16, 16), y, rand(-34, -24));
    m.userData.silhouette = { dir, speed: rand(0.4, 1) };
    decor.add(m);
  }
}
const triTex = (() => {
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(16, 3); g.lineTo(30, 28); g.lineTo(2, 28); g.closePath(); g.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
})();
const motes = (() => {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos[i * 3] = rand(-11, 11); pos[i * 3 + 1] = rand(-MAX_D, 6); pos[i * 3 + 2] = rand(-5, 6); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const m = new THREE.PointsMaterial({ map: triTex, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false, color: 0xffffff, alphaTest: 0.3 });
  const p = new THREE.Points(g, m); scene.add(p); return p;
})();
// a thick cloud bank under the train that the hook plunges through
function buildSurface() {
  // the cloud deck right under the train, drifting past as the train flies
  cloudField(30, () => {
    const z = rand(-11, -3.5), wrap = 16;
    return { x: rand(-wrap, wrap), y: rand(-3.4, -1.8), z, s: rand(2.4, 4.4), sy: rand(0.8, 1.1), rot: rand(-0.4, 0.4), drift: -rand(0.6, 1.4), wrap, color: 0xffffff };
  });
}

// ---------- Particles ------------------------------------------------------
const FX = [];
const fxGroup = new THREE.Group(); scene.add(fxGroup);
// confetti shards: flat triangles that tumble and fall
const SHARD = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.6, 0, -0.5, -0.35, 0, 0.5, -0.35, 0], 3)); g.computeVertexNormals(); return g; })();
const PUFF = new THREE.IcosahedronGeometry(0.5, 0);
function burst(pos, color = 0xffffff, n = 14, speed = 4, size = 0.35, life = 0.8) {
  for (let i = 0; i < n; i++) {
    const s = new THREE.Mesh(SHARD, new THREE.MeshBasicMaterial({ color: i % 4 === 0 ? 0xffffff : color, transparent: true, side: THREE.DoubleSide, depthWrite: false, fog: false, toneMapped: false }));
    s.position.copy(pos);
    const a = rand(0, Math.PI * 2), v = speed * rand(0.4, 1);
    s.userData = { vx: Math.cos(a) * v, vy: Math.sin(a) * v + 1, vz: rand(-1, 1) * v * 0.4, life: life * rand(0.8, 1.4), max: life * 1.4, size: size * rand(0.5, 1.2), grav: -6, spin: new THREE.Vector3(rand(-9, 9), rand(-9, 9), rand(-9, 9)) };
    s.scale.setScalar(s.userData.size);
    fxGroup.add(s); FX.push(s);
  }
}
function puffBurst(pos, n = 10) {
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(PUFF, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1, transparent: true, emissive: 0x332a33 }));
    m.position.copy(pos);
    const a = rand(0, Math.PI), v = rand(1.5, 4);
    m.userData = { vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6, vz: rand(-1, 1), life: 1.1, max: 1.1, size: rand(0.5, 1), grow: 1.2, grav: 0, spin: new THREE.Vector3(rand(-2, 2), rand(-2, 2), 0) };
    m.scale.setScalar(m.userData.size);
    fxGroup.add(m); FX.push(m);
  }
}
const rings = [];
function ring(pos, color = 0xffffff) {
  const m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 6), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.copy(pos); m.rotation.x = -1.2;
  m.userData = { life: 0.9 };
  scene.add(m); rings.push(m);
}
function updateFX(dt) {
  for (let i = FX.length - 1; i >= 0; i--) {
    const s = FX[i], u = s.userData;
    u.life -= dt;
    if (u.life <= 0) { fxGroup.remove(s); s.material.dispose(); FX.splice(i, 1); continue; }
    u.vy += u.grav * dt;
    s.position.x += u.vx * dt; s.position.y += u.vy * dt; s.position.z += u.vz * dt;
    u.vx *= 0.96; u.vy *= 0.96;
    if (u.spin) { s.rotation.x += u.spin.x * dt; s.rotation.y += u.spin.y * dt; s.rotation.z += u.spin.z * dt; }
    const k = Math.max(0, u.life / u.max);
    s.material.opacity = Math.min(1, k * 1.6);
    s.scale.setScalar(u.size * (u.grow ? 1 + (1 - k) * u.grow : 0.4 + k * 0.6));
  }
  for (let i = rings.length - 1; i >= 0; i--) {
    const r = rings[i]; r.userData.life -= dt;
    if (r.userData.life <= 0) { scene.remove(r); r.geometry.dispose(); r.material.dispose(); rings.splice(i, 1); continue; }
    const k = 1 - r.userData.life / 0.9;
    r.scale.setScalar(0.5 + k * 6); r.material.opacity = 0.9 * (1 - k);
  }
}

// ---------- Train (3D) with themed carriages --------------------------------
const trainGroup = new THREE.Group(); scene.add(trainGroup);
const trainBody = new THREE.Group(); trainGroup.add(trainBody);
let trainModel = null, trainW = 7, trainH = 3;
const carGroups = [];
const TRAIN_Y = 3.6;
const TRAIN_YAW = -0.32;
function labelSprite(text, sub) {
  const c = document.createElement('canvas'); c.width = 320; c.height = 96;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f7f4'; g.fillRect(0, 8, 320, 80);
  g.fillStyle = '#e3241b'; g.fillRect(0, 8, 10, 80);
  g.fillStyle = '#111111'; g.font = '800 32px Archivo, "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText(text.toUpperCase(), 24, 46);
  if (sub) { g.fillStyle = '#e3241b'; g.font = '800 22px Archivo, "Helvetica Neue", Arial, sans-serif'; g.fillText(sub.toUpperCase(), 24, 76); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false }));
  s.scale.set(1.9, 0.57, 1); s.renderOrder = 8;
  return s;
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
const std = (color, o = {}) => new THREE.MeshStandardMaterial(Object.assign({ color, roughness: 0.45, metalness: 0.2, flatShading: true }, o));

// Each carriage type gets a roof prop you can recognise at a glance.
function carriageProp(id) {
  const g = new THREE.Group(); g.userData.anim = [];
  if (id === 'tea') {
    const pot = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 1), std(0xf5efe6, { roughness: 0.25 })); pot.scale.y = 0.8; g.add(pot);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.04, 4, 10), std(0x3aa6a0, { metalness: 0.6 })); band.rotation.x = Math.PI / 2; g.add(band);
    const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.07, 0.4, 5), std(0xf5efe6)); spout.position.set(0.36, 0.08, 0); spout.rotation.z = -0.9; g.add(spout);
    const lid = new THREE.Mesh(new THREE.OctahedronGeometry(0.08), std(0xd7a64a, { metalness: 0.9 })); lid.position.y = 0.28; g.add(lid);
    g.userData.steam = true;
  } else if (id === 'aqua') {
    const tank = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.55, 0.55), new THREE.MeshPhysicalMaterial({ color: 0x8fe4ff, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, clearcoat: 1, envMapIntensity: 1.5 }));
    g.add(tank);
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.06, 0.6), std(0xc08a45, { metalness: 0.9 })); frame.position.y = -0.29; g.add(frame);
    for (let i = 0; i < 3; i++) {
      const M = MODELS[['sunkoi', 'puffling', 'skyjelly'][i]];
      const f = M ? M.obj.clone() : new THREE.Mesh(new THREE.OctahedronGeometry(0.08), std(0xffb35c));
      if (M) f.scale.multiplyScalar(0.28);
      const holder = new THREE.Group(); holder.add(f); g.add(holder);
      g.userData.anim.push((t) => { const a = t * (0.8 + i * 0.3) + i * 2; holder.position.set(Math.cos(a) * 0.35, Math.sin(a * 1.7) * 0.1, Math.sin(a) * 0.12); holder.rotation.y = -a + Math.PI / 2; });
    }
  } else if (id === 'obs') {
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.42, 7, 4, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2b6a6a, { metalness: 0.6, roughness: 0.3 })); g.add(dome);
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.86), std(0x111833)); slit.position.y = 0.15; g.add(slit);
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.9, 5), std(0xd7a64a, { metalness: 1, roughness: 0.2 }));
    scope.position.set(0, 0.35, 0); scope.rotation.z = -0.7; const piv = new THREE.Group(); piv.add(scope); g.add(piv);
    g.userData.anim.push(t => { piv.rotation.y = Math.sin(t * 0.4) * 0.9; });
  } else if (id === 'sleep') {
    const moon = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 4, 9, Math.PI * 1.3), std(0xfff1b0, { emissive: 0xffd86a, emissiveIntensity: 1.6 })); moon.position.y = 0.35; moon.rotation.z = 0.9; g.add(moon);
    for (let i = 0; i < 4; i++) {
      const st = new THREE.Mesh(new THREE.OctahedronGeometry(0.06), std(0xffffff, { emissive: 0xfff4d0, emissiveIntensity: 2 }));
      const h = new THREE.Group(); h.add(st); g.add(h);
      g.userData.anim.push(t => { const a = t * 0.6 + i * 1.6; st.position.set(Math.cos(a) * 0.55, 0.35 + Math.sin(a * 2) * 0.12, Math.sin(a) * 0.3); st.rotation.y = t * 2; });
    }
  } else if (id === 'lounge') {
    const a = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.035, 3, 12), std(0xff6ad5, { emissive: 0xff3fc5, emissiveIntensity: 2.2 }));
    const b = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.03, 3, 9), std(0x6af3ff, { emissive: 0x3fd9ff, emissiveIntensity: 2.2 }));
    a.position.y = b.position.y = 0.38; g.add(a, b);
    const disco = new THREE.Mesh(new THREE.IcosahedronGeometry(0.14, 1), std(0xffffff, { metalness: 1, roughness: 0.05, flatShading: true })); disco.position.y = 0.38; g.add(disco);
    g.userData.anim.push(t => { a.rotation.y = t * 1.2; b.rotation.x = t * 1.6; disco.rotation.y = t * 2; });
  } else if (id === 'royal') {
    const gold = std(0xffc94a, { metalness: 1, roughness: 0.15, emissive: 0x3a2400 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.22, 8, 1, true), gold); base.material.side = THREE.DoubleSide; base.position.y = 0.12; g.add(base);
    for (let i = 0; i < 6; i++) {
      const a = i / 6 * Math.PI * 2;
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.26, 4), gold); sp.position.set(Math.cos(a) * 0.32, 0.34, Math.sin(a) * 0.32); g.add(sp);
      const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.05), std(i % 2 ? 0xff3355 : 0x33aaff, { emissive: i % 2 ? 0xff1133 : 0x1188ff, emissiveIntensity: 1.6 })); gem.position.set(Math.cos(a) * 0.35, 0.12, Math.sin(a) * 0.35); g.add(gem);
    }
    g.userData.anim.push(t => { g.rotation.y = t * 0.5; });
  }
  return g;
}
function buildTrain() {
  trainModel = MODELS.train ? MODELS.train.obj.clone() : null;
  if (trainModel) trainBody.add(trainModel);
  else { // fallback: the painted train as a flat card
    loadTex('train').then(t => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
      m.userData.card = true; trainModel = m; trainBody.add(m); layoutTrain();
    });
  }
  // smoke puffs from the funnel
  rebuildCars();
  layoutTrain();
}
function rebuildCars() {
  carGroups.forEach(g => trainBody.remove(g));
  carGroups.length = 0;
  CARS.forEach(c => {
    const lvl = S.cars[c.id] || 0; if (!lvl) return;
    const g = new THREE.Group(); g.userData.id = c.id;
    const M = MODELS.carriage;
    const body = M ? M.obj.clone() : new THREE.Mesh(new THREE.BoxGeometry(1, 0.45, 0.35), std(0x2b6a6a));
    g.add(body); g.userData.body = body;
    const prop = carriageProp(c.id); g.add(prop); g.userData.prop = prop;
    const label = labelSprite(c.name, `Lv ${lvl}`); g.add(label); g.userData.label = label;
    g.userData.level = lvl;
    trainBody.add(g); carGroups.push(g);
  });
  layoutTrain();
}
function layoutTrain() {
  trainW = Math.min(8.5, viewW * 0.9);
  const M = MODELS.train;
  if (trainModel) {
    if (trainModel.userData.card) { const ar = TEX.train ? TEX.train.image.width / TEX.train.image.height : 1.81; trainModel.scale.set(trainW, trainW / ar, 1); trainH = trainW / ar; }
    else { trainModel.scale.setScalar(M.obj.scale.x * trainW); trainH = trainW * M.h; } // keep the unit-length base scale
  }
  const cx = halfW - trainW / 2 - 0.2;
  trainBody.position.set(0, 0, 0);
  if (trainModel) trainModel.position.set(0, 0, 0);
  trainGroup.position.set(cx, TRAIN_Y, -1.2);
  trainGroup.rotation.y = TRAIN_YAW;
  const CM = MODELS.carriage;
  const cw = trainW * 0.3, ch = cw * (CM ? CM.h : 0.45);
  carGroups.forEach((g, i) => {
    g.userData.body.scale.setScalar(CM ? CM.obj.scale.x * cw : 1);
    if (!CM) g.userData.body.scale.set(cw, ch, cw * 0.35);
    g.position.set(-trainW / 2 - cw * (i + 0.5) * 1.02, -trainH * 0.08, 0);
    const lvl = g.userData.level;
    g.userData.prop.position.set(0, ch / 2 + 0.05, 0);
    g.userData.prop.scale.setScalar(cw * 0.55 * (1 + Math.min(lvl, 25) * 0.015));
    g.userData.label.position.set(0, ch / 2 + 1.05, 0.2);
  });
}
const trainSpan = () => trainW + carGroups.length * trainW * 0.3 * 1.02;
const smoke = [];
function trainSmoke(dt) {
  if (!trainModel || Math.random() > dt * 6) return;
  const p = new THREE.Vector3(trainW * 0.4, trainH * 0.42, 0); trainBody.localToWorld(p);
  const m = new THREE.Mesh(PUFF, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1, transparent: true, opacity: 0.9, emissive: 0x333333 }));
  m.position.copy(p); m.scale.setScalar(0.3); m.rotation.set(rand(0, 6), rand(0, 6), 0);
  m.userData = { life: 2.2 }; scene.add(m); smoke.push(m);
}
function updateSmoke(dt) {
  for (let i = smoke.length - 1; i >= 0; i--) {
    const m = smoke[i]; m.userData.life -= dt;
    if (m.userData.life <= 0) { scene.remove(m); m.material.dispose(); smoke.splice(i, 1); continue; }
    const k = 1 - m.userData.life / 2.2;
    m.position.x -= dt * 2.2; m.position.y += dt * 0.9;
    m.scale.setScalar(0.3 + k * 1.1); m.material.opacity = 0.9 * (1 - k * k); m.rotation.y += dt;
  }
  // steam from the teapot carriage
  carGroups.forEach(g => {
    if (g.userData.id !== 'tea' || Math.random() > dt * 3) return;
    const p = new THREE.Vector3(0.45, 0.4, 0); g.userData.prop.localToWorld(p);
    const m = new THREE.Mesh(PUFF, new THREE.MeshStandardMaterial({ color: 0xffffff, flatShading: true, roughness: 1, transparent: true, opacity: 0.8, emissive: 0x333333 }));
    m.position.copy(p); m.scale.setScalar(0.12); m.userData = { life: 2.2 }; scene.add(m); smoke.push(m);
  });
}

// ---------- Hook: tiered metal, lantern, shield bubble, speed trail ---------
const hook = new THREE.Group(); scene.add(hook);
const hookRig = new THREE.Group(); hook.add(hookRig);
const hookMat = new THREE.MeshStandardMaterial({ color: 0xc08a45, metalness: 1, roughness: 0.3, flatShading: true });
const lanternMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffb35c, emissiveIntensity: 3, flatShading: true });
(function buildHookMesh() {
  const shank = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.55, 5), hookMat); shank.position.y = -0.1; hookRig.add(shank);
  const bend = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.04, 4, 8, Math.PI * 1.15), hookMat);
  bend.position.set(0.15, -0.37, 0); bend.rotation.z = Math.PI; hookRig.add(bend);
  const barb = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), hookMat); barb.position.set(0.3, -0.27, 0); barb.rotation.z = -0.25; hookRig.add(barb);
  const eye = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.018, 3, 6), hookMat); eye.position.y = 0.2; hookRig.add(eye);
  const cage = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.2, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0x3a2a18, metalness: 0.8, roughness: 0.4, wireframe: true }));
  cage.position.y = 0.36; hookRig.add(cage);
  const orb = new THREE.Mesh(new THREE.OctahedronGeometry(0.1), lanternMat); orb.position.y = 0.36; hookRig.add(orb);
})();
// sits in front of the hook so it lights passing creatures without blowing out the hook itself
const lanternLight = new THREE.PointLight(0xffb35c, 3, 8, 1.2); lanternLight.position.set(0, 0.5, 1.4); hook.add(lanternLight);
const hookGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: 0xffb35c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
hookGlow.position.y = 0.36; hookGlow.scale.setScalar(1.2); hookGlow.material.opacity = 0.45; hook.add(hookGlow);
const shieldMat = new THREE.ShaderMaterial({
  uniforms: { color: { value: new THREE.Color(0x7ff5e6) }, strength: { value: 0.6 }, time: { value: 0 }, hit: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix * mv; }`,
  fragmentShader: `uniform vec3 color; uniform float strength, time, hit; varying vec3 vN; varying vec3 vV; varying vec3 vP;
    void main(){ float f = pow(1.0 - abs(dot(vN, vV)), 2.2);
      float hex = 0.0;
      float a = (f + hex * f) * strength + hit * 0.6;
      gl_FragColor = vec4(color * (0.7 + hit * 1.5), a); }`,
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
});
const shield = new THREE.Mesh(new THREE.IcosahedronGeometry(0.62, 1), shieldMat); shield.position.y = -0.05; hook.add(shield);
// geodesic edges make the shield read as a cut gem rather than a soap bubble
const shieldEdges = new THREE.LineSegments(new THREE.EdgesGeometry(shield.geometry), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, fog: false }));
shield.add(shieldEdges);
const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 1), new THREE.MeshBasicMaterial({ map: trailTex, color: 0xffd98a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
scene.add(trail);
const lineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
const lineMat = new THREE.LineBasicMaterial({ color: 0xfff4e2, transparent: true, opacity: 0.6, fog: false });
const line = new THREE.Line(lineGeo, lineMat); scene.add(line);
const HOOK_HOME = new THREE.Vector3(0, 1.0, 0.4);

function applyGearVisuals() {
  const ht = HOOK_TIERS[hookTier()], lt = LANTERN_TIERS[lanternTier()];
  hookMat.color.setHex(ht.color); hookMat.emissive.setHex(ht.emissive); hookMat.metalness = ht.metal; hookMat.roughness = ht.rough;
  hookMat.emissiveIntensity = hookTier() >= 3 ? 0.55 : 0.3;
  hookRig.scale.setScalar(1 + S.gear.cap * 0.035);
  lanternMat.emissive.setHex(lt.color); lanternMat.emissiveIntensity = 1.4 + lanternTier() * 0.25;
  lanternLight.color.setHex(lt.color); lanternLight.intensity = 2.5 + S.gear.line * 0.25; lanternLight.distance = 7 + S.gear.line * 0.3;
  hookGlow.material.color.setHex(lt.color); hookGlow.userData.base = 1 + S.gear.line * 0.04;
  lineMat.color.setHex(lt.color).lerp(new THREE.Color(0xffffff), 0.4).multiplyScalar(0.7);
  trail.material.color.setHex(lt.color);
  shield.visible = S.gear.shield > 0;
  shieldMat.uniforms.strength.value = 0.12 + S.gear.shield * 0.035;
}

// ---------- Creatures -------------------------------------------------------
const swim = new THREE.Group(); scene.add(swim);
let creatures = [];
const SPRITE_MATS = {};
const PLANE = new THREE.PlaneGeometry(1, 1);
function spriteBody(sp) {
  if (!SPRITE_MATS[sp.id]) {
    SPRITE_MATS[sp.id] = new THREE.MeshBasicMaterial({ map: fallbackCreatureTex(), transparent: true, depthWrite: false, alphaTest: 0.02, side: THREE.DoubleSide });
    loadTex(sp.id).then(t => { if (t) { SPRITE_MATS[sp.id].map = t; SPRITE_MATS[sp.id].needsUpdate = true; } });
  }
  const m = new THREE.Mesh(PLANE, SPRITE_MATS[sp.id]);
  m.scale.set(sp.size, sp.size * 0.6, 1);
  // sprite art faces left; rotate so it faces +X like the 3D models
  const g = new THREE.Group(); m.scale.x *= sp.flip ? 1 : -1; g.add(m); return g;
}
const GLOW_MATS = {};
const glowMatFor = sp => GLOW_MATS[sp.id] || (GLOW_MATS[sp.id] = new THREE.SpriteMaterial({ map: glowTex, color: sp.glow, transparent: true, opacity: sp.rare ? 0.35 : 0.18, depthWrite: false, blending: THREE.AdditiveBlending }));
function spawnCreature(sp, y) {
  const g = new THREE.Group();
  const M = MODELS[sp.id];
  let body, w = sp.size, h;
  if (M) { body = M.obj.clone(); body.scale.multiplyScalar(sp.size); h = sp.size * M.h; }
  else { body = spriteBody(sp); h = sp.size * 0.6; }
  const yawHolder = new THREE.Group(); yawHolder.add(body); g.add(yawHolder);
  if (sp.glow) { const gl = new THREE.Sprite(glowMatFor(sp)); gl.scale.setScalar(w * (sp.rare ? 2.2 : 1.5)); g.add(gl); }
  const dir = Math.random() < 0.5 ? -1 : 1;
  const c = { sp, g, yawHolder, w, h, x: rand(-halfW, halfW), y, baseY: y, dir, yaw: dir > 0 ? 0 : Math.PI, speed: sp.speed * rand(0.7, 1.3), phase: rand(0, 6.28), state: 'free', stun: 0, z: rand(-1.4, 0.8) };
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
  for (let d = 5; d < bottom; d += rand(1.8, 3.3)) {
    const sp = pickSpecies(d); if (sp) spawnCreature(sp, -d);
  }
}

// ---------- Game state ------------------------------------------------------
const G = { state: 'idle', t: 0, depth: 0, reached: 0, maxDepth: 0, shields: 0, caught: [], vy: 0, targetX: 0, dragging: false, lastBiome: 0, surfaceT: 0, newSpecies: new Set(), camX: 0, camZ: CAM_Z, panel: null, timeScale: 1, shake: 0, flash: 0, focus: 0, focusOn: null, crossed: false, hitT: 0 };

function cast() {
  if (G.state !== 'idle') return;
  closeSheet();
  audio(); sfx.cast(); buzz(12);
  populate();
  G.state = 'down'; G.t = 0; G.depth = 0; G.vy = 2; G.crossed = false;
  G.maxDepth = lineDepth(); G.reached = 0; G.shields = S.gear.shield; G.caught = []; G.newSpecies = new Set();
  G.targetX = hook.position.x; G.lastBiome = 0;
  S.runs++;
  $('#dock').hidden = true; $('#runhud').hidden = false; $('#meter').hidden = false;
  $('#hint').hidden = S.runs > 3;
  $('#hint').textContent = 'Drag to steer. Dodge on the way down.';
  buildMeter(); updateRunHud();
  try { navigator.wakeLock && navigator.wakeLock.request('screen').catch(() => {}); } catch (e) { /* ignore */ }
}
function startReel(reason) {
  G.state = 'up'; G.t = 0;
  if (reason === 'bumped') { sfx.bump(); buzz(30); G.shake = 0.35; }
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
    el.style.background = b.tint;
    m.appendChild(el);
  });
  for (let i = 0; i <= 10; i++) { const tk = document.createElement('div'); tk.className = 'tick'; tk.style.top = (i * 10) + '%'; if (i % 5 === 0) tk.style.width = '16px'; m.appendChild(tk); }
  const mx = document.createElement('div'); mx.className = 'max'; mx.style.top = (lineDepth() / max * 100) + '%'; m.appendChild(mx);
  const mk = document.createElement('div'); mk.className = 'mark'; m.appendChild(mk);
}
function biomeToast(b) {
  const el = $('#biomeToast');
  el.innerHTML = `<span><b>${String(BIOMES.indexOf(b) + 1).padStart(2, '0')}</b>${b.from} m</span>${b.name}`;
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
  setTimeout(() => showHaul(rows, firstBonus, total + firstBonus, deeper), 1100);
}
function showHaul(rows, firstBonus, payout, deeper) {
  const m = $('#modal');
  const haul = rows.length
    ? `<div class="haul">${rows.map(r => `<div class="${r.sp.rare ? 'rare' : ''}">${r.isNew ? '<span class="new">NEW</span>' : ''}<img src="${iconUrl(r.sp.id)}" alt=""><b>${r.n}× ${r.sp.name}</b><i class="num">${fmt(r.v)}</i></div>`).join('')}</div>`
    : '<p class="sub">The hook came back empty. Steer through creatures on the way up.</p>';
  m.innerHTML = `<div class="card" role="dialog" aria-label="Haul">
      <h2>${rows.length ? (rows.some(r => r.sp.rare) ? 'Legendary haul!' : 'Fine haul!') : 'Nothing biting'}</h2>
      <p class="sub">Reached ${Math.round(G.reached)} m${deeper ? ' · new record' : ''}</p>
      ${haul}
      ${firstBonus ? `<p class="bonusline">+${fmt(firstBonus)} first-catch bonus for the Skydex</p>` : ''}
      <div class="total num"><span class="coin"></span>${fmt(payout)}</div>
      <button class="big" id="bankBtn">Sell the haul</button>
    </div>`;
  m.hidden = false;
  $('#bankBtn').onclick = () => {
    m.hidden = true;
    if (payout) { sfx.coin(); buzz(15); coinRain(payout, $('#bankBtn').getBoundingClientRect()); }
    else bank(0);
    G.caught.forEach(c => swim.remove(c.g));
    G.caught = [];
    G.state = 'idle';
    $('#dock').hidden = false;
    populate();
  };
}
function bank(n) { S.coins += n; save(); refreshHud(); }
// coins arc from the button up into the counter, then the total ticks up
function coinRain(amount, from) {
  const to = $('#coins').getBoundingClientRect();
  const n = clamp(Math.round(Math.log10(amount + 1) * 6), 6, 24);
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) { bank(amount); return; }
  let landed = 0;
  for (let i = 0; i < n; i++) {
    const c = document.createElement('div'); c.className = 'flycoin';
    const sx = from.left + from.width / 2 + rand(-60, 60), sy = from.top + rand(-10, 10);
    c.style.left = sx + 'px'; c.style.top = sy + 'px';
    document.body.appendChild(c);
    const dx = to.left + 14 - sx, dy = to.top + 12 - sy, delay = i * 35;
    c.animate([
      { transform: 'translate(0,0) scale(.6)', opacity: 0 },
      { transform: `translate(${dx * 0.3 + rand(-40, 40)}px, ${dy * 0.2 - 80}px) scale(1.1)`, opacity: 1, offset: 0.35 },
      { transform: `translate(${dx}px, ${dy}px) scale(.7)`, opacity: 1 },
    ], { duration: 750, delay, easing: 'cubic-bezier(.5,0,.3,1)', fill: 'forwards' }).onfinish = () => {
      c.remove(); landed++;
      blip(1200 + landed * 40, 0.05, 'square', 0.02, 1);
      const pill = $('#coinPill'); pill.classList.remove('pulse'); void pill.offsetWidth; pill.classList.add('pulse');
      if (landed === n) bank(amount);
    };
  }
  popText('+' + fmt(amount), to.left + to.width / 2, to.bottom + 30);
}
function popText(text, x, y) {
  const el = document.createElement('div'); el.className = 'pop num'; el.textContent = text;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  document.body.appendChild(el); setTimeout(() => el.remove(), 1100);
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

// ---------- Main loop -------------------------------------------------------
const clock = new THREE.Clock();
let incomeAcc = 0, saveAcc = 0, hudAcc = 0, lightningT = 3;
const cA = new THREE.Color(), cB = new THREE.Color();
const mixHex = (a, b, f) => cA.setHex(a).lerp(cB.setHex(b), f);
const tmpV = new THREE.Vector3();

function frame() {
  const realDt = Math.min(clock.getDelta(), 0.05);
  G.timeScale = damp(G.timeScale, 1, 3, realDt);
  const dt = realDt * G.timeScale;
  const t = clock.elapsedTime;
  G.t += dt;

  incomeAcc += incomePerSec() * realDt;
  if (incomeAcc >= 1) { const n = Math.floor(incomeAcc); S.coins += n; incomeAcc -= n; }
  if ((hudAcc += realDt) > 0.25) { hudAcc = 0; refreshHud(true); }
  if ((saveAcc += realDt) > 5) { saveAcc = 0; save(); }

  // --- hook motion
  const prevY = hook.position.y;
  if (G.state === 'idle') {
    hook.position.x = lerp(hook.position.x, HOOK_HOME.x + Math.sin(t * 1.3) * 0.15, 0.1);
    hook.position.y = HOOK_HOME.y + Math.sin(t * 2) * 0.12;
    hook.position.z = HOOK_HOME.z;
    G.targetX = hook.position.x;
  } else if (G.state === 'down') {
    G.vy = Math.min(dropSpeed(), G.vy + dt * 14);
    hook.position.y -= G.vy * dt;
    hook.position.x = damp(hook.position.x, G.targetX, 10, dt);
    G.depth = Math.max(0, -hook.position.y);
    G.reached = Math.max(G.reached, G.depth);
    if (G.depth >= G.maxDepth) { hook.position.y = -G.maxDepth; G.depth = G.reached = G.maxDepth; startReel('line'); burst(hook.position, LANTERN_TIERS[lanternTier()].color, 16, 3); }
  } else if (G.state === 'up') {
    const full = G.caught.length >= capacity();
    const v = Math.max(13, dropSpeed() * 1.5) * (full ? 2.4 : 1) * Math.min(1, 0.3 + G.t * 1.4);
    hook.position.y += v * dt;
    hook.position.x = damp(hook.position.x, G.targetX, 10, dt);
    G.depth = Math.max(0, -hook.position.y);
    if (hook.position.y >= HOOK_HOME.y) { hook.position.y = HOOK_HOME.y; surface(); }
  } else if (G.state === 'surface') {
    hook.position.x = lerp(hook.position.x, HOOK_HOME.x, 0.08);
    hook.position.y = lerp(hook.position.y, HOOK_HOME.y, 0.1);
  }
  // splash through the cloud surface
  const surfaceY = -1.2;
  if ((prevY > surfaceY) !== (hook.position.y > surfaceY) && G.state !== 'idle') {
    const p = tmpV.set(hook.position.x, surfaceY, 0.5);
    ring(p, 0xffffff); puffBurst(p, 8); sfx.splash();
  }
  const speed = Math.abs(hook.position.y - prevY) / Math.max(dt, 1e-4);
  hookRig.rotation.z = damp(hookRig.rotation.z, clamp((G.targetX - hook.position.x) * -0.25, -0.5, 0.5), 8, dt);
  hookRig.rotation.y += dt * (G.state === 'idle' ? 0.8 : 3);
  const gb = hookGlow.userData.base || 2;
  hookGlow.scale.setScalar(gb * (0.92 + Math.sin(t * 6) * 0.08));
  // winch speed trail
  trail.material.opacity = damp(trail.material.opacity, G.state === 'down' || G.state === 'up' ? clamp(speed / 40, 0, 0.55) : 0, 8, realDt);
  const tl = clamp(speed * 0.12, 0.1, 5);
  trail.scale.y = tl;
  trail.position.set(hook.position.x, hook.position.y + (G.state === 'up' ? -tl / 2 : tl / 2) + 0.2, hook.position.z - 0.05);
  trail.rotation.z = G.state === 'up' ? Math.PI : 0;
  // shield bubble
  shieldMat.uniforms.time.value = t;
  G.hitT = Math.max(0, G.hitT - realDt * 2.5);
  shieldMat.uniforms.hit.value = G.hitT;
  shield.visible = S.gear.shield > 0 && (G.state === 'idle' || G.shields > 0 || G.hitT > 0);
  shield.scale.setScalar(1 + G.hitT * 0.4 + Math.sin(t * 3) * 0.03);

  // --- biome entry
  if (G.state === 'down') {
    const bi = BIOMES.indexOf(biomeAt(G.depth));
    if (bi > G.lastBiome) {
      G.lastBiome = bi;
      biomeToast(BIOMES[bi]);
      if (!S.biomes.includes(bi)) { S.biomes.push(bi); sfx.biome(); toast(`Discovered ${BIOMES[bi].name}!`, 'gold'); G.flash = 0.8; }
    }
  }
  if (G.state === 'down' || G.state === 'up') updateRunHud();

  // --- creatures
  const hx = hook.position.x, hy = hook.position.y;
  for (const c of creatures) {
    if (c.state === 'caught') continue;
    c.x += c.dir * c.speed * dt;
    if (c.x > halfW + 0.8) c.dir = -1; else if (c.x < -halfW - 0.8) c.dir = 1;
    const bobAmt = c.sp.bob ? 0.5 : 0.18;
    c.y = c.baseY + Math.sin(t * (c.sp.bob ? 1.2 : 2) + c.phase) * bobAmt;
    // turn smoothly through the camera when changing direction
    const wantYaw = c.dir > 0 ? 0 : Math.PI;
    c.yaw = damp(c.yaw, wantYaw, 3.5, dt);
    const swish = Math.sin(t * (4 + c.speed * 2) + c.phase) * (c.sp.bob ? 0.25 : 0.14);
    c.yawHolder.rotation.y = c.yaw + swish;
    c.yawHolder.rotation.z = c.sp.bob ? Math.sin(t * 1.2 + c.phase) * 0.12 : Math.cos(t * 2 + c.phase) * 0.06 * (c.dir);
    if (c.stun > 0) { c.stun -= dt; c.g.rotation.x = Math.sin(c.stun * 30) * 0.3; } else c.g.rotation.x = 0;
    c.g.position.set(c.x, c.y, c.z);

    if ((G.state === 'down' || G.state === 'up') && c.stun <= 0) {
      const dx = (hx - c.x) / (c.w * 0.42 + 0.18), dy = (hy - c.y) / (c.h * 0.45 + 0.18);
      if (dx * dx + dy * dy < 1) {
        if (G.state === 'down') {
          if (G.shields > 0) {
            G.shields--; c.stun = 1.2; c.dir = hx > c.x ? -1 : 1; c.speed *= 2;
            G.hitT = 1; burst(hook.position, 0x7ff5e6, 18, 5); sfx.bump(); buzz(10); G.shake = 0.15;
          } else { c.stun = 1.2; startReel('bumped'); burst(hook.position, 0xffffff, 10, 3); }
        } else if (G.caught.length < capacity()) {
          c.state = 'caught'; G.caught.push(c);
          const col = c.sp.glow || 0xfff1c4;
          burst(tmpV.set(c.x, c.y, c.z), col, c.sp.rare ? 40 : 14, c.sp.rare ? 7 : 4, c.sp.rare ? 0.6 : 0.4);
          if (c.sp.rare) { G.timeScale = 0.25; G.shake = 0.4; G.flash = 0.35; sfx.rare(); buzz(40); toast(`${c.sp.name}!`, 'gold'); }
          else { sfx.catch(G.caught.length); buzz(8); }
          if (!S.dex[c.sp.id] && !G.newSpecies.has(c.sp.id)) { G.newSpecies.add(c.sp.id); toast(`New species: ${c.sp.name}!`); }
          if (G.caught.length === capacity()) { $('#hint').hidden = false; $('#hint').textContent = 'Hook full! Racing home.'; }
        }
      }
    }
  }
  // caught creatures dangle in a cluster under the hook
  G.caught.forEach((c, i) => {
    const ang = i * 2.39996, r = 0.25 + Math.sqrt(i) * 0.38;
    const lift = G.state === 'surface' ? G.surfaceT * G.surfaceT * 9 : 0;
    const tx = hx + Math.cos(ang) * r * 0.9, ty = hy - 0.6 - Math.abs(Math.sin(ang)) * r - i * 0.06 + lift;
    c.x = lerp(c.x, tx, 0.25); c.y = lerp(c.y, ty, 0.25);
    const shrink = clamp(1.4 / c.w, 0.35, 0.8);
    c.g.position.set(c.x, c.y, 0.5 + i * 0.02);
    c.g.scale.setScalar(lerp(c.g.scale.x, shrink, 0.2));
    c.yawHolder.rotation.y += dt * 2.5;
    c.g.rotation.z = Math.sin(t * 5 + i) * 0.25;
  });
  if (G.state === 'surface') G.surfaceT += dt;

  // --- line from the winch to the hook
  const p = lineGeo.attributes.position;
  p.setXYZ(0, HOOK_HOME.x, TRAIN_Y - trainH * 0.2, HOOK_HOME.z); p.setXYZ(1, hook.position.x, hook.position.y + 0.42, hook.position.z); p.needsUpdate = true;

  // --- ambient drift
  for (const m of decor.children) {
    const s = m.userData.silhouette; if (!s) continue;
    m.position.x += s.dir * s.speed * dt;
    if (Math.abs(m.position.x) > 20) m.position.x = -Math.sign(m.position.x) * 20;
  }
  updateClouds(dt);
  trainBody.position.y = Math.sin(t * 1.6) * 0.08;
  trainBody.rotation.z = Math.sin(t * 0.9) * 0.01;
  carGroups.forEach((g, i) => { g.position.y = -trainH * 0.08 + Math.sin(t * 1.6 - (i + 1) * 0.5) * 0.06; g.userData.prop.userData.anim.forEach(fn => fn(t)); });
  trainSmoke(realDt); updateSmoke(realDt);
  updateFX(realDt);

  // --- camera
  let camY = 1.9, wantX = 0, wantZ = CAM_Z;
  if (G.state === 'down') camY = hook.position.y - viewH * 0.18;
  else if (G.state === 'up') camY = hook.position.y + viewH * 0.16;
  if (G.state === 'down' || G.state === 'up') wantX = hook.position.x * 0.22;
  // with a panel open the sheet covers the lower screen, so frame the
  // subject in the top quarter where the player can watch it change
  const visH = z => 2 * z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  if (G.panel === 'train') {
    const span = trainSpan() + 3;
    const needZ = span / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    wantZ = Math.max(CAM_Z, needZ);
    wantX = trainGroup.position.x + trainW / 2 + 1 - span / 2;
    camY = TRAIN_Y + 0.9 - visH(wantZ) * 0.3;
  } else if (G.panel === 'gear') {
    wantZ = G.focus > 0 ? 5.6 : 7.5;
    wantX = hook.position.x;
    camY = hook.position.y + 0.9 - visH(wantZ) * 0.08;
  }
  if (G.focus > 0) G.focus -= realDt;
  const k = G.state === 'down' || G.state === 'up' ? 9 : 3;
  camera.position.y = damp(camera.position.y, camY, k, realDt);
  G.camX = damp(G.camX, wantX, 3, realDt); G.camZ = damp(G.camZ, wantZ, 3, realDt);
  G.shake = Math.max(0, G.shake - realDt * 1.5);
  const sh = G.shake * G.shake * 1.2;
  camera.position.x = G.camX + rand(-sh, sh);
  camera.position.z = G.camZ;
  camera.position.y += rand(-sh, sh);
  camera.lookAt(camera.position.x * 0.85, camera.position.y - 0.9, 0);

  // --- per-layer light, sky, fog, lightning
  const camDepth = Math.max(0, -camera.position.y);
  const bi = BIOMES.indexOf(biomeAt(camDepth));
  const b = BIOMES[bi], nb = BIOMES[Math.min(bi + 1, BIOMES.length - 1)];
  const edge = 40, f = clamp((camDepth - (b.to - edge)) / edge, 0, 1);
  backMat.uniforms.tA.value = TEX[b.bg] || flatTex(b.fog);
  backMat.uniforms.tB.value = TEX[nb.bg] || flatTex(nb.fog);
  backMat.uniforms.mixv.value = f;
  backMat.uniforms.scroll.value = -camDepth / 650;
  scene.fog.color.copy(mixHex(b.fog, nb.fog, f));
  scene.fog.near = camera.position.z + 5; scene.fog.far = camera.position.z + 65;
  sun.color.copy(mixHex(b.sun, nb.sun, f)); sun.intensity = lerp(b.sunI, nb.sunI, f);
  hemi.color.copy(mixHex(b.sky, nb.sky, f)); hemi.groundColor.copy(mixHex(b.ground, nb.ground, f));
  rim.color.copy(mixHex(b.rim, nb.rim, f));
  renderer.toneMappingExposure = lerp(b.exp, nb.exp, f);
  sun.position.set(camera.position.x + 6, camera.position.y + 10, 8); sun.target.position.set(camera.position.x, camera.position.y, 0);
  rim.position.set(camera.position.x - 6, camera.position.y + 3, -10); rim.target.position.set(camera.position.x, camera.position.y, 0);
  if (b.lightning) {
    lightningT -= realDt;
    if (lightningT <= 0) { lightningT = rand(2.5, 6); G.flash = 1; setTimeout(sfx.thunder, rand(150, 600)); }
  }
  G.flash = Math.max(0, G.flash - realDt * 2.2);
  backMat.uniforms.flash.value = G.flash * G.flash;
  sun.intensity += G.flash * 4;


  composer.render();
  requestAnimationFrame(frame);
}

// ---------- HUD & panels ----------------------------------------------------
function refreshHud(light) {
  $('#coins').textContent = fmt(S.coins);
  const r = incomePerSec();
  $('#rate').textContent = `+${r >= 10 ? fmt(r) : r.toFixed(1)} / sec`;
  $('#recordVal').textContent = `${S.deepest} m`;
  $('#castDepth').textContent = `${lineDepth()} m line`;
  const gearAff = Object.entries(GEAR).some(([k, g]) => S.gear[k] < g.max && S.coins >= g.cost(S.gear[k]));
  const carAff = CARS.some(c => S.deepest >= c.unlock && S.coins >= carCost(c, S.cars[c.id] || 0));
  document.querySelector('[data-panel="gear"] .dot').hidden = !gearAff;
  document.querySelector('[data-panel="train"] .dot').hidden = !carAff;
  if (G.panel && light) updatePanelButtons();
  if (light) return;
  $('#muteBtn').innerHTML = S.muted
    ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 9l6 6M22 9l-6 6" stroke="currentColor" stroke-width="2.4" fill="none"/></svg>'
    : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4v14l-5-4H3z"/><rect x="15" y="9" width="2.4" height="6"/><rect x="19" y="6" width="2.4" height="12"/></svg>';
}
const ICONS = {
  line: '<path d="M12 2v14"/><path d="M12 16a3 3 0 1 0 3 3"/>',
  cap: '<path d="M6 3v8a6 6 0 0 0 12 0V9"/><path d="M15 9l3-3 3 3"/>',
  speed: '<circle cx="12" cy="12" r="8"/><path d="M12 12l4-3"/><path d="M12 4v2M20 12h-2M4 12h2"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
};
const hexCss = h => '#' + h.toString(16).padStart(6, '0');
function openSheet(panel) {
  if (G.state !== 'idle') return;
  G.panel = panel;
  const titles = { gear: ['Gear', 'Every 4 levels the hook and lantern change form'], train: ['The Train', 'Carriages earn coins even while you are offline'], dex: ['Skydex', `${Object.keys(S.dex).length} of ${SPECIES.length} species caught`], map: ['Sky Layers', 'How deep the sky goes'] };
  $('#sheetTitle').textContent = titles[panel][0];
  $('#sheetSub').textContent = titles[panel][1];
  renderPanel();
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.panel === panel));
  $('#sheet').classList.add('open'); $('#sheet').setAttribute('aria-hidden', 'false');
}
function closeSheet() { G.panel = null; $('#sheet').classList.remove('open'); $('#sheet').setAttribute('aria-hidden', 'true'); document.querySelectorAll('.tab').forEach(t => t.classList.remove('on')); }
function buyBtn(id, cost, maxed, label) {
  if (maxed) return `<button class="buy maxed" disabled>${label || 'Max'}</button>`;
  return `<button class="buy num" data-buy="${id}" data-cost="${cost}" ${S.coins < cost ? 'disabled' : ''}><span class="coin"></span>${fmt(cost)}</button>`;
}
function tierStrip(g, l) {
  if (!g.tiers) return '';
  const cur = g.tierOf(l);
  const nextAt = (cur + 1) * 4;
  return `<div class="tiers">${g.tiers.map((t, i) => `<span class="tier ${i <= cur ? 'on' : ''} ${i === cur ? 'cur' : ''}" style="--c:${hexCss(t.color)}" title="${t.name}"></span>`).join('')}
    <em>${g.tiers[cur].name} ${g.tierWord}${cur < g.tiers.length - 1 ? ` · ${g.tiers[cur + 1].name} at Lv ${nextAt}` : ' · max tier'}</em></div>`;
}
function renderPanel() {
  const body = $('#sheetBody');
  if (G.panel === 'gear') {
    body.innerHTML = Object.entries(GEAR).map(([k, g], i) => {
      const l = S.gear[k], maxed = l >= g.max;
      return `<div class="row"><div class="ico">${String(i + 1).padStart(2, '0')}</div>
        <div><h3>${g.name} <span class="lvl">Lv ${l}</span></h3><p>Now: ${g.now(l)}${maxed ? '' : ` → ${g.desc(l)}`}</p>${tierStrip(g, l)}</div>
        ${buyBtn('gear:' + k, maxed ? 0 : g.cost(l), maxed)}</div>`;
    }).join('');
  } else if (G.panel === 'train') {
    body.innerHTML = CARS.map((c, i) => {
      const l = S.cars[c.id] || 0, locked = S.deepest < c.unlock;
      const earn = c.inc * Math.max(1, l);
      return `<div class="row ${locked ? 'locked' : ''}"><div class="ico">${String(i + 1).padStart(2, '0')}</div>
        <div><h3>${c.name} ${l ? `<span class="lvl">Lv ${l}</span>` : ''}</h3><p>${locked ? `Reach ${c.unlock} m to unlock` : `${c.blurb} ${l ? `Earning ${fmt(earn)}/s` : `+${c.inc}/s per level`}`}</p></div>
        ${locked ? '<button class="buy maxed" disabled>Locked</button>' : buyBtn('car:' + c.id, carCost(c, l), false)}</div>`;
    }).join('') + `<p class="note">Offline earnings cap: ${offlineCapSec() / 3600} h. Close the game at your stop, collect at the next.</p>`;
  } else if (G.panel === 'dex') {
    body.innerHTML = BIOMES.map((b, bi) => `<div class="dexhead"><span><b>${String(bi + 1).padStart(2, '0')}</b> ${b.name}</span><span>${b.from}–${b.to} m</span></div><div class="dex">${SPECIES.filter(s => s.biome === bi).map(s => {
      const n = S.dex[s.id] || 0;
      return `<div class="dexcard ${n ? '' : 'unknown'} ${s.rare ? 'rare' : ''}"><img src="${iconUrl(s.id)}" alt="${n ? s.name : 'Unknown creature'}" loading="lazy"><b>${n ? s.name : '???'}</b><span>${n ? `${n} caught · ${fmt(s.value)} each` : `Found below ${s.min} m`}</span></div>`;
    }).join('')}</div>`).join('');
  } else if (G.panel === 'map') {
    body.innerHTML = BIOMES.map((b, bi) => {
      const seen = S.deepest >= b.from;
      return `<div class="row ${seen ? '' : 'locked'}"><div class="ico">${String(bi + 1).padStart(2, '0')}</div>
        <div><h3>${seen ? b.name : 'Uncharted'}</h3><p>${b.from}–${b.to} m · ${SPECIES.filter(s => s.biome === bi).filter(s => S.dex[s.id]).length}/3 species</p></div>
        <span class="lvl">${lineDepth() > b.from ? 'In reach' : `Need ${b.from} m`}</span></div>`;
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
    const tierBefore = g.tierOf ? g.tierOf(l) : 0;
    S.coins -= g.cost(l); S.gear[key]++;
    applyGearVisuals();
    if (key === 'line' || key === 'cap') populate();
    const tierAfter = g.tierOf ? g.tierOf(S.gear[key]) : 0;
    // show off the change: swoop the camera onto the hook
    G.focus = tierAfter > tierBefore ? 2.2 : 1.1;
    burst(hook.position, key === 'shield' ? 0x7ff5e6 : LANTERN_TIERS[lanternTier()].color, tierAfter > tierBefore ? 50 : 18, tierAfter > tierBefore ? 6 : 3);
    if (key === 'shield') G.hitT = 1;
    if (tierAfter > tierBefore) { sfx.tier(); toast(`${g.tiers[tierAfter].name} ${g.tierWord} unlocked!`, 'gold'); G.flash = 0.4; }
    else sfx.buy();
  } else {
    const c = CARS.find(x => x.id === key), l = S.cars[key] || 0;
    if (S.coins < carCost(c, l)) return;
    S.coins -= carCost(c, l); S.cars[key] = l + 1;
    rebuildCars();
    const g = carGroups.find(x => x.userData.id === key);
    if (g) { g.getWorldPosition(tmpV); burst(tmpV, 0xf3c46b, l ? 16 : 40, l ? 3 : 6); }
    if (!l) { toast(`${c.name} coupled to the train!`, 'gold'); sfx.tier(); } else sfx.buy();
  }
  buzz(10);
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

// ---------- Offline earnings ------------------------------------------------
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
  $('#collectBtn').onclick = () => { m.hidden = true; sfx.coin(); coinRain(earned, $('#collectBtn').getBoundingClientRect()); };
}

// ---------- Boot --------------------------------------------------------------
window.__cloudline = { G, S, hook, camera, scene, line, trail }; // handy for poking at the game from devtools
(async function boot() {
  resize();
  let texDone = 0, packP = 0;
  const bar = () => { $('#loadBar').style.width = (texDone / 5 * 30 + packP * 70) + '%'; };
  const skies = Promise.all(BIOMES.map(b => loadTex(b.bg).then(() => { texDone++; bar(); })));
  $('#loadText').textContent = 'Loading 17 models';
  const models = loadModelPack(p => { packP = p; bar(); }).catch(e => { console.warn('3D models unavailable, using painted cards', e); });
  await Promise.all([skies, models]);
  buildDecor(); buildSurface(); buildTrain();
  applyGearVisuals();
  resize();
  populate();
  hook.position.copy(HOOK_HOME);
  refreshHud();
  $('#loadText').textContent = 'All aboard';
  setTimeout(() => { $('#loader').style.opacity = '0'; setTimeout(() => $('#loader').remove(), 600); }, 250);
  if (S.runs === 0) setTimeout(() => toast('Tap Cast to drop your lantern hook'), 900);
  welcomeBack();
  requestAnimationFrame(frame);
})();
