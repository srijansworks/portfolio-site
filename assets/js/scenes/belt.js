/* The black belt: swept through as the music section ends, then moved off to open the space
   for a short reflection.

   Built in code, nothing downloaded:
   - a ribbon with real thickness (4.5 mm), a crowned top, rolled edges and closed ends
   - black cotton twill woven into a small tiling texture, with seven rows of stitching down it
   - a fabric ripple on the surface, a few half-twists that read as folds
   - the name in gold satin stitch, as its own raised mesh laid on the top face, so the thread
     catches the light and casts a hair of shadow instead of being printed on

   Like the other scenes, every frame is a pure function of scroll progress p, so scrolling back
   reverses it exactly. Units: 1 unit = 10 cm; a belt is about 2.8 m. */
import { THREE, createStage, track, clamp01, lerp, smooth, smoother, span, readTheme } from "./core.js";
import { studioEnv, rng } from "./drumkit.js";

const BELT_LEN = 28, BELT_W = 0.46, BELT_T = 0.05;
const SEG = 420;                                     /* stations along the belt */
const EMB_S0 = 5.8, EMB_S1 = 8.5;                    /* where the name sits, measured along the belt */

/* ------------------------------------------------------------------------ */
/* textures                                                                  */
/* ------------------------------------------------------------------------ */

/* one tile of cloth: 1024 across the belt (45 mm), 128 along it (5.8 mm); 22 px per millimetre */
function clothTile(renderer) {
  const W = 1024, H = 128;
  const col = document.createElement("canvas"); col.width = W; col.height = H;
  const bmp = document.createElement("canvas"); bmp.width = W; bmp.height = H;
  const c = col.getContext("2d"), b = bmp.getContext("2d");
  const rand = rng(77);
  c.fillStyle = "#0b0b0d"; c.fillRect(0, 0, W, H);
  b.fillStyle = "#6e6e6e"; b.fillRect(0, 0, W, H);

  /* twill: diagonal ridges, 16 px apart. Each thread is a little different. */
  for (let k = -H / 16 - 1; k < W / 16 + 1; k++) {
    const x0 = k * 16;
    const tone = 0.5 + rand() * 0.5;
    for (const wrap of [-W, 0, W]) { /* nothing to wrap across; the tile only repeats along its height */ }
    for (const dy of [-H, 0, H]) {
      c.strokeStyle = `rgba(${22 + tone * 16},${22 + tone * 16},${27 + tone * 18},0.85)`;
      c.lineWidth = 7.5;
      c.beginPath(); c.moveTo(x0, dy); c.lineTo(x0 + H, dy + H); c.stroke();
      c.strokeStyle = "rgba(0,0,0,0.6)"; c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(x0 + 8, dy); c.lineTo(x0 + 8 + H, dy + H); c.stroke();
      b.strokeStyle = `rgba(255,255,255,${0.55 + tone * 0.35})`; b.lineWidth = 8;
      b.beginPath(); b.moveTo(x0, dy); b.lineTo(x0 + H, dy + H); b.stroke();
      b.strokeStyle = "rgba(0,0,0,0.75)"; b.lineWidth = 3.2;
      b.beginPath(); b.moveTo(x0 + 8, dy); b.lineTo(x0 + 8 + H, dy + H); b.stroke();
    }
  }
  /* fibre fuzz */
  for (let i = 0; i < 9000; i++) {
    c.fillStyle = `rgba(${rand() < 0.5 ? "70,70,78" : "0,0,0"},${0.05 + rand() * 0.12})`;
    c.fillRect(rand() * W, rand() * H, 1 + rand() * 1.5, 1 + rand() * 3);
  }
  /* seven rows of stitching, each a run of small dashes, lighter and sunk into the cloth */
  for (let r = 0; r < 7; r++) {
    const x = Math.round(W * (r + 0.5) / 7);
    for (let d = 0; d < 2; d++) {
      const y0 = d * 64 + 4;
      c.fillStyle = "rgba(26,27,32,0.95)"; c.fillRect(x - 3, y0, 6, 46);
      c.fillStyle = "rgba(50,52,60,0.5)"; c.fillRect(x - 1, y0 + 2, 2, 40);
      b.fillStyle = "rgba(0,0,0,0.85)"; b.fillRect(x - 5, y0 - 4, 10, 54);
      b.fillStyle = "rgba(255,255,255,0.25)"; b.fillRect(x - 1.5, y0 + 2, 3, 42);
    }
  }
  const map = new THREE.CanvasTexture(col), bump = new THREE.CanvasTexture(bmp);
  for (const t of [map, bump]) {
    t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump };
}

/* the name in satin stitch: short slanted runs of thread, packed edge to edge, with a border */
function embroideryTexture(name, renderer) {
  const W = 1728, H = 270;
  const col = document.createElement("canvas"); col.width = W; col.height = H;
  const hgt = document.createElement("canvas"); hgt.width = W; hgt.height = H;
  const c = col.getContext("2d"), h = hgt.getContext("2d");
  const rand = rng(404);
  const face = '"Archivo", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
  const font = `800 196px ${face}`;
  const setup = (g) => { g.font = font; g.textAlign = "center"; g.textBaseline = "middle"; if ("letterSpacing" in g) g.letterSpacing = "4px"; };

  /* a mask of the lettering, to clip the thread to */
  const mask = document.createElement("canvas"); mask.width = W; mask.height = H;
  const m = mask.getContext("2d"); setup(m); m.fillStyle = "#fff"; m.fillText(name, W / 2, H / 2 + 6);

  h.fillStyle = "#000"; h.fillRect(0, 0, W, H);
  c.clearRect(0, 0, W, H);

  const gold = ["#f6d977", "#e6bd4a", "#d2a232", "#fff1ac", "#bd8a20", "#e9c45a"];
  /* the thread: draw runs, then keep only what falls inside the letters */
  const thread = document.createElement("canvas"); thread.width = W; thread.height = H;
  const t = thread.getContext("2d");
  const th = document.createElement("canvas"); th.width = W; th.height = H;
  const tg = th.getContext("2d"); tg.fillStyle = "#000"; tg.fillRect(0, 0, W, H);
  for (let x = -60; x < W + 60; x += 2.4) {
    const slant = 46;
    const k = rand();
    t.strokeStyle = gold[(rand() * gold.length) | 0];
    t.globalAlpha = 0.85 + k * 0.15;
    t.lineWidth = 2.2 + rand() * 0.9;
    t.beginPath(); t.moveTo(x, 0); t.lineTo(x + slant, H); t.stroke();
    tg.strokeStyle = `rgba(255,255,255,${0.55 + k * 0.45})`; tg.lineWidth = 2.4;
    tg.beginPath(); tg.moveTo(x, 0); tg.lineTo(x + slant, H); tg.stroke();
  }
  /* each run catches light along one edge */
  t.globalAlpha = 1;
  for (let x = -60; x < W + 60; x += 7) {
    t.strokeStyle = "rgba(255,246,196,0.30)"; t.lineWidth = 0.9;
    t.beginPath(); t.moveTo(x + 1, 0); t.lineTo(x + 47, H); t.stroke();
  }
  /* clip to the lettering */
  t.globalCompositeOperation = "destination-in"; t.drawImage(mask, 0, 0);
  tg.globalCompositeOperation = "destination-in"; tg.drawImage(mask, 0, 0);
  c.drawImage(thread, 0, 0);
  h.drawImage(th, 0, 0);

  /* the border stitch: a darker, tighter satin line round every letter */
  setup(c); c.globalCompositeOperation = "source-over";
  c.lineJoin = "round"; c.lineWidth = 5; c.strokeStyle = "rgba(150,104,22,0.9)"; c.strokeText(name, W / 2, H / 2 + 6);
  c.lineWidth = 1.6; c.strokeStyle = "rgba(255,230,140,0.55)"; c.strokeText(name, W / 2, H / 2 + 6);
  setup(h); h.lineJoin = "round"; h.lineWidth = 6; h.strokeStyle = "#fff"; h.strokeText(name, W / 2, H / 2 + 6);

  const map = new THREE.CanvasTexture(col), bump = new THREE.CanvasTexture(hgt);
  for (const tx of [map, bump]) { tx.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy()); tx.wrapS = tx.wrapT = THREE.ClampToEdgeWrapping; }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump };
}

/* ------------------------------------------------------------------------ */
/* the path the belt travels along                                           */
/* ------------------------------------------------------------------------ */

const GUIDE_PTS = [
  [-18, -7.0, 2.8], [-10, -3.6, 2.0], [-3.6, -1.1, 1.0], [0.0, 0.05, 0.5],
  [3.8, 1.0, -0.6], [9.5, 3.5, -3.2], [17, 7.8, -8.5], [27, 14, -18], [40, 22, -30],
];
const GUIDE = (() => {
  const curve = new THREE.CatmullRomCurve3(GUIDE_PTS.map((p) => new THREE.Vector3(...p)), false, "centripetal");
  const pts = curve.getSpacedPoints(1600);
  const total = curve.getLength();
  /* arclength at the point nearest the middle of the frame */
  let best = 0, bd = 1e9;
  pts.forEach((p, i) => { const d = Math.hypot(p.x, p.y); if (d < bd) { bd = d; best = i; } });
  const step = total / 1600;
  return { pts, step, total, aCenter: best * step };
})();
const _g = new THREE.Vector3();
function guideAt(a, out) {
  const f = Math.max(0, Math.min(GUIDE.pts.length - 1.001, a / GUIDE.step));
  const i = Math.floor(f), t = f - i;
  return out.copy(GUIDE.pts[i]).lerp(GUIDE.pts[i + 1], t);
}

/* how far the belt has travelled along the path: the name crosses the middle of the frame
   slowly, around p = .3 to .5; before and after, the belt moves fast */
const travel = track([
  [0.00, [-17.5, 0, 0]], [0.18, [-8.5, 0, 0]], [0.30, [-2.6, 0, 0]], [0.50, [2.6, 0, 0]],
  [0.66, [7.3, 0, 0]], [0.80, [8.2, 0, 0]], [1.00, [8.7, 0, 0]],
]);
const travelSpeed = (p) => Math.abs(travel(Math.min(1, p + 0.01)).x - travel(Math.max(0, p - 0.01)).x) / 0.02;

/* ------------------------------------------------------------------------ */
/* the ribbon                                                                */
/* ------------------------------------------------------------------------ */

const RING = (() => {
  /* cross-section: crowned top, rolled edge, flat bottom. [x across, y thickness, u across the face, face] */
  const pts = [];
  const N = 10;
  for (let i = 0; i <= N; i++) { const c = -1 + (2 * i) / N; pts.push({ x: c * BELT_W / 2, y: BELT_T / 2 + 0.22 * BELT_T * (1 - c * c), u: (c + 1) / 2, top: 1, c }); }
  pts.push({ x: BELT_W / 2 + 0.003, y: BELT_T * 0.22, u: 1, top: 0, c: 1 });
  pts.push({ x: BELT_W / 2 + 0.005, y: 0, u: 1, top: 0, c: 1 });
  pts.push({ x: BELT_W / 2 + 0.003, y: -BELT_T * 0.22, u: 1, top: 0, c: 1 });
  for (let i = N; i >= 0; i--) { const c = -1 + (2 * i) / N; pts.push({ x: c * BELT_W / 2, y: -BELT_T / 2 - 0.12 * BELT_T * (1 - c * c), u: (c + 1) / 2, top: -1, c }); }
  pts.push({ x: -BELT_W / 2 - 0.003, y: -BELT_T * 0.22, u: 0, top: 0, c: -1 });
  pts.push({ x: -BELT_W / 2 - 0.005, y: 0, u: 0, top: 0, c: -1 });
  pts.push({ x: -BELT_W / 2 - 0.003, y: BELT_T * 0.22, u: 0, top: 0, c: -1 });
  return pts;
})();
const NR = RING.length;

function buildRibbon(mat) {
  const nv = (SEG + 1) * NR + 2;
  const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2);
  for (let i = 0; i <= SEG; i++) {
    for (let j = 0; j < NR; j++) {
      const k = i * NR + j;
      uv[k * 2] = RING[j].u; uv[k * 2 + 1] = (i / SEG) * BELT_LEN / 0.058;
    }
  }
  const idx = [];
  for (let i = 0; i < SEG; i++) {
    for (let j = 0; j < NR; j++) {
      const a = i * NR + j, b = i * NR + ((j + 1) % NR), c = (i + 1) * NR + j, d = (i + 1) * NR + ((j + 1) % NR);
      idx.push(a, c, b, b, c, d);
    }
  }
  /* closed ends: a flat cap at each end */
  const capA = (SEG + 1) * NR, capB = capA + 1;
  for (let j = 0; j < NR; j++) {
    const j2 = (j + 1) % NR;
    idx.push(capA, j2, j);                                         /* start end */
    idx.push(capB, SEG * NR + j, SEG * NR + j2);                   /* far end */
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  return m;
}

/* the embroidered patch: a thin sheet laid on the top face between EMB_S0 and EMB_S1 */
const EMB_I0 = Math.round(EMB_S0 / BELT_LEN * SEG), EMB_I1 = Math.round(EMB_S1 / BELT_LEN * SEG);
const EMB_COLS = 12, EMB_W = (EMB_S1 - EMB_S0) / 6.4;   /* 6.4 : 1, the aspect of the canvas */
function buildPatch(mat) {
  const rows = EMB_I1 - EMB_I0 + 1;
  const pos = new Float32Array(rows * EMB_COLS * 3), uv = new Float32Array(rows * EMB_COLS * 2);
  for (let i = 0; i < rows; i++) for (let j = 0; j < EMB_COLS; j++) {
    const k = i * EMB_COLS + j;
    uv[k * 2] = i / (rows - 1); uv[k * 2 + 1] = j / (EMB_COLS - 1);     /* u along the text, v across */
  }
  const idx = [];
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < EMB_COLS - 1; j++) {
    const a = i * EMB_COLS + j, b = a + 1, c = a + EMB_COLS, d = c + 1;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
  return { mesh: m, rows };
}

/* ------------------------------------------------------------------------ */
/* the pose of the belt at progress p                                        */
/* ------------------------------------------------------------------------ */

const C = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
const Wv = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
const Nv = Array.from({ length: SEG + 1 }, () => new THREE.Vector3());
const Tv = new THREE.Vector3(), Wt = new THREE.Vector3(), Nt = new THREE.Vector3();
const NREF = new THREE.Vector3(0, 0, 1);

/* half-twists along the belt: the cloth turns over and shows its back. Kept off the name. */
const twistAt = (s) => Math.PI * (smoother((s - 11.2) / 1.6) - smoother((s - 15.5) / 1.8)) + Math.PI * smoother((s - 20.5) / 2.0)
  + 0.16 * Math.sin(s * 0.9 + 1.3) * smooth((s - 9.5) / 1.5);

function poseBelt(p, time) {
  const aTrail = GUIDE.aCenter - EMB_S0 - (EMB_S1 - EMB_S0) / 2 + travel(p).x;
  const v = travelSpeed(p);
  const amp = 0.07 + 0.36 * smooth((v - 18) / 60);                  /* flutter picks up with speed */
  const ph = travel(p).x * 0.62;
  /* centreline, rippled across the view */
  for (let i = 0; i <= SEG; i++) {
    const s = (i / SEG) * BELT_LEN, a = aTrail + s;
    guideAt(Math.max(0, a), C[i]);
    const env = Math.min(1, s / 3, (BELT_LEN - s) / 3 + 0.2);
    /* the name stays calm; the rest of the cloth moves */
    const calm = 1 - 0.78 * smooth(1 - Math.abs(s - (EMB_S0 + EMB_S1) / 2) / 3.2);
    C[i].y += amp * calm * env * Math.sin(s * 0.95 - ph) + 0.03 * Math.sin(s * 2.7 + time * 0.8);
    C[i].z += amp * 0.8 * calm * env * Math.sin(s * 0.62 - ph * 0.8 + 1.1);
  }
  /* frames: face toward the camera, then the twists */
  for (let i = 0; i <= SEG; i++) {
    const a = C[Math.max(0, i - 1)], b = C[Math.min(SEG, i + 1)];
    Tv.copy(b).sub(a).normalize();
    Wt.crossVectors(NREF, Tv); if (Wt.lengthSq() < 1e-6) Wt.set(0, 1, 0); Wt.normalize();
    Nt.crossVectors(Tv, Wt).normalize();
    const th = twistAt((i / SEG) * BELT_LEN), ct = Math.cos(th), st = Math.sin(th);
    Wv[i].copy(Wt).multiplyScalar(ct).addScaledVector(Nt, st);
    Nv[i].copy(Nt).multiplyScalar(ct).addScaledVector(Wt, -st);
  }
}

/* fine ripple of the cloth surface */
const ripple = (s, x) => 0.0042 * Math.sin(s * 8.3 + x * 17) + 0.0028 * Math.sin(s * 19.5 - x * 9 + 1.7) + 0.0016 * Math.sin(s * 41 + x * 31);

function writeRibbon(g) {
  const pos = g.attributes.position.array;
  for (let i = 0; i <= SEG; i++) {
    const s = (i / SEG) * BELT_LEN;
    for (let j = 0; j < NR; j++) {
      const r = RING[j];
      const rp = r.top === 0 ? 0 : ripple(s, r.x) * r.top * 1.0;
      const k = (i * NR + j) * 3;
      pos[k]     = C[i].x + Wv[i].x * r.x + Nv[i].x * (r.y + rp);
      pos[k + 1] = C[i].y + Wv[i].y * r.x + Nv[i].y * (r.y + rp);
      pos[k + 2] = C[i].z + Wv[i].z * r.x + Nv[i].z * (r.y + rp);
    }
  }
  /* cap centres */
  const capA = (SEG + 1) * NR * 3, capB = capA + 3;
  pos[capA] = C[0].x; pos[capA + 1] = C[0].y; pos[capA + 2] = C[0].z;
  pos[capB] = C[SEG].x; pos[capB + 1] = C[SEG].y; pos[capB + 2] = C[SEG].z;
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
}
function writePatch(patch) {
  const g = patch.mesh.geometry, pos = g.attributes.position.array;
  for (let i = 0; i < patch.rows; i++) {
    const si = EMB_I0 + i, s = (si / SEG) * BELT_LEN;
    for (let j = 0; j < EMB_COLS; j++) {
      const x = (j / (EMB_COLS - 1) - 0.5) * EMB_W, c = x / (BELT_W / 2);
      const y = BELT_T / 2 + 0.22 * BELT_T * (1 - c * c) + ripple(s, x) + 0.0035;
      const k = (i * EMB_COLS + j) * 3;
      pos[k]     = C[si].x + Wv[si].x * x + Nv[si].x * y;
      pos[k + 1] = C[si].y + Wv[si].y * x + Nv[si].y * y;
      pos[k + 2] = C[si].z + Wv[si].z * x + Nv[si].z * y;
    }
  }
  g.attributes.position.needsUpdate = true;
  g.computeVertexNormals();
}

/* camera: a slow push in during the pass, then back out */
const camPos = track([[0, [-0.5, 0.25, 7.4]], [0.3, [-0.2, 0.15, 6.0]], [0.5, [0.2, 0.05, 5.7]], [0.8, [0.6, -0.2, 7.4]], [1, [0.8, -0.3, 8.2]]]);
const camLook = track([[0, [0.6, 0.2, 0]], [0.5, [0.0, 0.0, 0]], [1, [0.0, 0.0, 0]]]);

/* when the reflection is up */
const BEAT = [0.68, 0.78, 2.0, 3.0];

/* ------------------------------------------------------------------------ */
/* mount                                                                     */
/* ------------------------------------------------------------------------ */

export async function mount(host, ctx) {
  const { ScrollTrigger, reduced } = ctx;
  const canvas = host.querySelector(".bfilm__canvas");
  const beat = host.querySelector(".bbeat");
  const name = host.dataset.name || "Srijan Saha";
  const theme = readTheme();

  if (document.fonts && document.fonts.load) {
    try { await Promise.race([document.fonts.load('800 196px "Archivo"'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* system sans */ }
  }

  const stage = createStage(canvas, { exposure: theme.dark ? 1.15 : 1.05, envIntensity: theme.dark ? 1.5 : 1.25, fov: 30, maxDpr: 2, shadow: "soft", makeEnv: studioEnv });
  const { scene, camera } = stage;

  scene.add(new THREE.HemisphereLight("#fff4e6", "#2a2622", 0.25));
  const key = new THREE.SpotLight("#fff0da", 7.5, 0, 0.62, 0.9, 0);
  key.position.set(-5.5, 5.5, 7.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 4; key.shadow.camera.far = 30;
  key.shadow.bias = -0.0002; key.shadow.normalBias = 0.01; key.shadow.radius = 7;
  key.target.position.set(0, 0, 0);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight("#cfe0ff", 2.2);
  rim.position.set(6, 4, -3);
  scene.add(rim);

  /* the belt's shadow falls on an unseen wall behind it, which is what lets it sit on the page */
  const wallOpacity = theme.dark ? 0.5 : 0.2;
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(60, 40), new THREE.ShadowMaterial({ color: "#000", opacity: wallOpacity }));
  wall.position.set(0, 0, -2.2); wall.receiveShadow = true; scene.add(wall);

  const cloth = clothTile(stage.renderer);
  const beltMat = new THREE.MeshPhysicalMaterial({
    map: cloth.map, bumpMap: cloth.bump, bumpScale: 1.6, color: "#8d8d92", roughness: 0.9, metalness: 0,
    sheen: 0.9, sheenRoughness: 0.5, sheenColor: new THREE.Color("#3a3b44"), side: THREE.FrontSide,
  });
  cloth.map.repeat.set(1, 1);
  const ribbon = buildRibbon(beltMat);
  scene.add(ribbon);

  const emb = embroideryTexture(name, stage.renderer);
  const threadMat = new THREE.MeshPhysicalMaterial({
    map: emb.map, bumpMap: emb.bump, bumpScale: 3.2, color: "#ffffff", roughness: 0.34, metalness: 0.85,
    alphaTest: 0.35, side: THREE.DoubleSide, clearcoat: 0.0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const patch = buildPatch(threadMat);
  scene.add(patch.mesh);

  let target_p = 0, shown_p = 0;
  host.__progress = () => ({ shown: shown_p, target: target_p });
  const look = new THREE.Vector3(), cam = new THREE.Vector3();
  let narrow = false;
  stage.onResize.push((w) => { narrow = w < 760; stage.shift.x = narrow ? 0 : 0.0; stage.shift.y = narrow ? 0.12 : 0.0; stage.applyView(); });

  const setBeat = (p) => {
    if (!beat) return;
    const o = smooth((p - BEAT[0]) / (BEAT[1] - BEAT[0]));
    beat.style.opacity = o.toFixed(3);
    beat.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
    beat.style.visibility = o > 0.01 ? "visible" : "hidden";
  };

  stage.onFrame = (dt, time) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 12);
    shown_p += (target_p - shown_p) * k;
    const p = shown_p;
    poseBelt(p, time);
    writeRibbon(ribbon.geometry);
    writePatch(patch);
    look.copy(camLook(p)); cam.copy(camPos(p));
    if (narrow) cam.sub(look).multiplyScalar(2.0).add(look);      /* a narrow frame needs the belt further back to fit the name */
    camera.position.copy(cam); camera.lookAt(look);
    camera.position.y += Math.sin(time * 0.45) * 0.01;
    wall.material.opacity = wallOpacity * (1 - 0.9 * span(p, 0.62, 0.82));
    setBeat(p);
  };

  if (reduced) {
    /* one composed frame: the name across the middle */
    stage.onFrame = (dt, time) => {
      poseBelt(0.4, 0); writeRibbon(ribbon.geometry); writePatch(patch);
      const c0 = camPos(0.4).clone(), l0 = camLook(0.4).clone();
      if (narrow) c0.sub(l0).multiplyScalar(2.0).add(l0);
      camera.position.copy(c0); camera.lookAt(l0);
    };
    if (beat) { beat.style.opacity = ""; beat.style.transform = ""; beat.style.visibility = ""; }
    stage.still();
    return stage;
  }

  ScrollTrigger.create({
    trigger: host, start: "top top", end: "bottom bottom", invalidateOnRefresh: true,
    onUpdate: (self) => { target_p = self.progress; },
    onRefresh: (self) => { target_p = self.progress; },
  });
  return stage;
}

export const _seq = { poseBelt, travel, travelSpeed };
