/* The drum set: a Vic Firth American Classic pair and a 14" snare on a stand.

   Everything is built in code (no downloaded model, nothing to license):
   - sticks: a lathe-turned 5A profile, hickory grain painted to a 512x4096 canvas, the print on top
   - snare: a mahogany shell, chrome triple-flange hoops, ten lugs and rods, a strainer, a stand
   - head: a coated drumhead whose surface can ring after each hit
   - studioEnv: a small lit "studio" rendered once into an environment map, so chrome and lacquer
     have something worth reflecting (soft boxes, strip lights), instead of a flat grey room.

   Units: 1 unit = 10 cm. A 5A is 16 in (40.6 cm) long, 0.565 in thick. */
import { THREE, clamp01, lerp } from "./core.js";

export const IN = 0.254;
export const L = 16 * IN;                 /* stick length */
export const S_F = 5.4 * IN;              /* where the hand holds it, from the butt */
export const D_T = L - S_F;               /* fulcrum to tip */
export const R = 1.78;                    /* 14" drum */
export const H = 1.4;                     /* shell depth, 5.5" */
export const HEAD_Y = 0;                  /* top of the head */
export const FLOOR_Y = -3.55;

export function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

/* ------------------------------------------------------------------------ */
/* environment: a tiny studio                                                */
/* ------------------------------------------------------------------------ */
export function studioEnv(pmrem) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(46, 28, 46), new THREE.MeshBasicMaterial({ color: 0x1a1512, side: THREE.BackSide })));
  const panel = (w, h, pos, look, rgb) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(rgb[0], rgb[1], rgb[2]), side: THREE.DoubleSide, toneMapped: false }));
    m.position.set(pos[0], pos[1], pos[2]); m.lookAt(look[0], look[1], look[2]); s.add(m);
  };
  panel(15, 9, [-3, 12.5, 4], [0, 0, 0], [7.5, 7.0, 6.2]);       /* big overhead soft box */
  panel(2.4, 13, [-13, 3, 1], [0, 1, 0], [6.0, 4.8, 3.4]);       /* tall warm strip, left */
  panel(2.8, 11, [13, 3, 5], [0, 1, 0], [2.2, 2.7, 3.6]);        /* cooler strip, right */
  panel(20, 2.2, [0, 4.5, -16], [0, 1, 0], [3.4, 2.8, 2.2]);     /* long bar behind */
  panel(3, 3, [4, 6, 14], [0, 0, 0], [3.2, 3.0, 2.6]);           /* small kicker, front */
  panel(26, 9, [0, 5, -19], [0, 0, 0], [1.7, 1.45, 1.15]);       /* a lit backdrop wall */
  panel(22, 7, [0, 4, 20], [0, 0, 0], [1.5, 1.4, 1.25]);         /* big soft fill behind the camera */
  panel(46, 46, [0, -13, 0], [0, 0, 0], [0.22, 0.17, 0.13]);     /* warm floor bounce */
  return pmrem.fromScene(s, 0.018).texture;
}

/* ------------------------------------------------------------------------ */
/* the stick                                                                 */
/* ------------------------------------------------------------------------ */

/* 5A profile: [distance from butt in inches, radius in inches] */
const PROFILES = {
  "5A": [
    [0.00, 0.000], [0.012, 0.070], [0.05, 0.145], [0.14, 0.215], [0.32, 0.258], [0.7, 0.2790], [1.4, 0.2825],
    [6.0, 0.2825], [8.5, 0.2790], [10.5, 0.2620], [12.0, 0.2220], [13.0, 0.1680], [13.7, 0.1290],
    [14.15, 0.1240], [14.6, 0.1400], [15.05, 0.1660], [15.4, 0.1690], [15.72, 0.1460], [15.92, 0.0900],
    [16.00, 0.000],
  ],
};

export function stickGeometry(model) {
  const ctrl = (PROFILES[model] || PROFILES["5A"]).map(([x, r]) => new THREE.Vector2(x, r));
  const dense = new THREE.SplineCurve(ctrl).getPoints(800);
  const N = 260, pts = [];
  let j = 0;
  for (let i = 0; i <= N; i++) {
    const x = (i / N) * 16;
    while (j < dense.length - 2 && dense[j + 1].x < x) j++;
    const a = dense[j], b = dense[j + 1];
    const t = b.x === a.x ? 0 : (x - a.x) / (b.x - a.x);
    pts.push(new THREE.Vector2(Math.max(0, lerp(a.y, b.y, clamp01(t))) * IN, x * IN - S_F));
  }
  pts[0].x = 0; pts[N].x = 0;
  const g = new THREE.LatheGeometry(pts, 96);
  g.computeVertexNormals();
  return g;
}

/* hickory, long-grained and pale, with the print painted over it */
export function stickTexture(model, renderer) {
  const W = 512, Hh = 4096;
  const c = document.createElement("canvas"); c.width = W; c.height = Hh;
  const g = c.getContext("2d");
  const rand = rng(5);

  g.fillStyle = "#d8b684"; g.fillRect(0, 0, W, Hh);

  /* heartwood and sapwood: soft colour drift across and along */
  for (let k = 0; k < 18; k++) {
    const x = rand() * W, w = 25 + rand() * 120, y0 = rand() * Hh, len = 600 + rand() * 3000;
    const dark = rand() < 0.55;
    for (const off of [-W, 0, W]) {
      const gr = g.createLinearGradient(x + off - w, 0, x + off + w, 0);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(0.5, dark ? `rgba(126,84,40,${0.08 + rand() * 0.12})` : `rgba(246,224,184,${0.12 + rand() * 0.12})`);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(x + off - w, y0, w * 2, len);
    }
  }
  /* growth lines: long, nearly straight, with a slow waver */
  for (let i = 0; i < 520; i++) {
    const x0 = rand() * W, y0 = rand() * Hh, len = 500 + rand() * 3400;
    const dark = rand() < 0.74;
    g.strokeStyle = dark ? `rgba(102,64,26,${0.05 + rand() * 0.2})` : `rgba(250,230,192,${0.06 + rand() * 0.13})`;
    g.lineWidth = 0.5 + rand() * 2.1;
    const ph = rand() * 6.28, amp = 0.6 + rand() * 3.2, fq = 0.002 + rand() * 0.006;
    for (const off of [-W, 0, W]) {
      g.beginPath();
      for (let y = 0; y <= len; y += 24) g.lineTo(x0 + off + Math.sin(ph + y * fq) * amp + Math.sin(y * fq * 3.1 + ph) * amp * 0.25, y0 + y);
      g.stroke();
    }
  }
  /* open pores: short dark dashes along the grain */
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(86,52,20,${0.06 + rand() * 0.16})`;
    g.fillRect(rand() * W, rand() * Hh, 0.7 + rand() * 0.6, 3 + rand() * 15);
  }
  /* fibre: fine speckle so it never looks airbrushed */
  for (let i = 0; i < 26000; i++) {
    const v = rand() < 0.5 ? "rgba(255,240,210," : "rgba(70,40,12,";
    g.fillStyle = v + (0.04 + rand() * 0.1) + ")";
    g.fillRect(rand() * W, rand() * Hh, 1, 1 + rand() * 2);
  }
  /* handled and lacquered at the ends: the tip a little darker, the butt a little warmer */
  const tip = g.createLinearGradient(0, 0, 0, 170);
  tip.addColorStop(0, "rgba(74,46,20,0.55)"); tip.addColorStop(1, "rgba(74,46,20,0)");
  g.fillStyle = tip; g.fillRect(0, 0, W, 170);
  const butt = g.createLinearGradient(0, Hh, 0, Hh - 90);
  butt.addColorStop(0, "rgba(96,60,26,0.4)"); butt.addColorStop(1, "rgba(96,60,26,0)");
  g.fillStyle = butt; g.fillRect(0, Hh - 90, W, 90);

  /* The print. Runs along the stick, butt toward tip. The canvas is denser around the stick
     than along it (289 vs 256 px/in), so the glyphs are squeezed to keep their proportions. */
  g.save();
  g.translate(W * 0.5, Hh * 0.52);
  g.rotate(-Math.PI / 2);
  g.scale(0.886, 1);
  g.textAlign = "center"; g.textBaseline = "middle";
  const face = '"Archivo", "Arial Narrow", "Helvetica Neue", Arial, sans-serif';
  g.fillStyle = "rgba(26,18,12,0.95)";
  g.font = `800 82px ${face}`;
  if ("letterSpacing" in g) g.letterSpacing = "9px";
  g.fillText("VIC FIRTH", 0, -34);
  g.font = `600 44px ${face}`;
  if ("letterSpacing" in g) g.letterSpacing = "6px";
  g.fillText(`AMERICAN CLASSIC ${model}`, 0, 38);
  g.fillRect(-250, 74, 500, 4);
  g.restore();
  /* ink wears: knock a few specks back out so the grain shows through the print */
  g.save();
  g.globalCompositeOperation = "destination-out";
  for (let i = 0; i < 700; i++) {
    g.fillStyle = `rgba(0,0,0,${0.15 + rand() * 0.5})`;
    g.fillRect(W * 0.5 - 70 + rand() * 140, Hh * 0.52 - 340 + rand() * 680, 1 + rand() * 1.4, 1 + rand() * 3.5);
  }
  g.restore();
  /* destination-out punched holes in the whole canvas where the print is; paint wood back under it */
  const under = document.createElement("canvas"); under.width = W; under.height = Hh;
  const ug = under.getContext("2d"); ug.fillStyle = "#c9a56f"; ug.fillRect(0, 0, W, Hh);
  ug.drawImage(c, 0, 0);

  const tex = new THREE.CanvasTexture(under);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

export function buildStick(model, tex) {
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, bumpMap: tex, bumpScale: 0.55, roughness: 0.52, metalness: 0,
    clearcoat: 0.38, clearcoatRoughness: 0.3, sheen: 0.25, sheenRoughness: 0.7, sheenColor: new THREE.Color("#f5deb0"),
  });
  const m = new THREE.Mesh(stickGeometry(model), mat);
  m.castShadow = true; m.receiveShadow = true;
  return m;
}

/* ------------------------------------------------------------------------ */
/* the snare                                                                 */
/* ------------------------------------------------------------------------ */

function shellTexture(renderer) {
  const W = 2048, Hh = 384;
  const c = document.createElement("canvas"); c.width = W; c.height = Hh;
  const g = c.getContext("2d");
  const rand = rng(31);
  const base = g.createLinearGradient(0, 0, 0, Hh);
  base.addColorStop(0, "#5b2b1a"); base.addColorStop(0.5, "#6a3320"); base.addColorStop(1, "#4e2315");
  g.fillStyle = base; g.fillRect(0, 0, W, Hh);
  /* broad figure: flowing bands that run around the shell */
  for (let k = 0; k < 24; k++) {
    const y = rand() * Hh, hgt = 8 + rand() * 46;
    const gr = g.createLinearGradient(0, y - hgt, 0, y + hgt);
    const dark = rand() < 0.55;
    gr.addColorStop(0, "rgba(0,0,0,0)");
    gr.addColorStop(0.5, dark ? `rgba(34,12,6,${0.14 + rand() * 0.18})` : `rgba(176,98,58,${0.12 + rand() * 0.16})`);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, y - hgt, W, hgt * 2);
  }
  for (let i = 0; i < 900; i++) {
    const y0 = rand() * Hh, x0 = rand() * W, len = 120 + rand() * 900;
    const dark = rand() < 0.65;
    g.strokeStyle = dark ? `rgba(30,10,4,${0.06 + rand() * 0.22})` : `rgba(190,110,70,${0.05 + rand() * 0.14})`;
    g.lineWidth = 0.5 + rand() * 1.8;
    const ph = rand() * 6.28, amp = 0.8 + rand() * 4, fq = 0.004 + rand() * 0.012;
    for (const off of [0, -W, W]) {
      g.beginPath();
      for (let x = 0; x <= len; x += 20) g.lineTo(x0 + off + x, y0 + Math.sin(ph + x * fq) * amp);
      g.stroke();
    }
  }
  for (let i = 0; i < 14000; i++) {
    g.fillStyle = `rgba(20,6,2,${0.06 + rand() * 0.16})`;
    g.fillRect(rand() * W, rand() * Hh, 3 + rand() * 12, 0.8);
  }
  /* the seam where the veneer meets */
  g.fillStyle = "rgba(20,8,4,0.5)"; g.fillRect(0, 0, 2, Hh); g.fillRect(W - 1, 0, 1, Hh);
  g.fillStyle = "rgba(210,140,100,0.16)"; g.fillRect(2, 0, 1.5, Hh);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  tex.wrapS = THREE.RepeatWrapping;
  return tex;
}

/* a coated head: fine pitted white, a little worn where it is played */
function headTexture(renderer) {
  const S = 1024;
  const c = document.createElement("canvas"); c.width = c.height = S;
  const g = c.getContext("2d"); const rand = rng(11);
  g.fillStyle = "#d9d5c8"; g.fillRect(0, 0, S, S);
  const wear = g.createRadialGradient(S / 2, S / 2, S * 0.02, S / 2, S / 2, S * 0.36);
  wear.addColorStop(0, "rgba(168,160,142,0.30)"); wear.addColorStop(0.55, "rgba(180,172,154,0.14)"); wear.addColorStop(1, "rgba(180,172,154,0)");
  g.fillStyle = wear; g.fillRect(0, 0, S, S);
  /* tension ring near the edge and the collar */
  const edge = g.createRadialGradient(S / 2, S / 2, S * 0.43, S / 2, S / 2, S * 0.5);
  edge.addColorStop(0, "rgba(120,112,98,0)"); edge.addColorStop(1, "rgba(120,112,98,0.32)");
  g.fillStyle = edge; g.fillRect(0, 0, S, S);
  /* a few faint stick marks and smudges */
  for (let i = 0; i < 90; i++) {
    const a = rand() * 6.28, d = rand() * S * 0.3;
    g.fillStyle = `rgba(110,100,84,${0.03 + rand() * 0.07})`;
    g.beginPath(); g.ellipse(S / 2 + Math.cos(a) * d, S / 2 + Math.sin(a) * d, 2 + rand() * 7, 1.5 + rand() * 3, rand() * 3, 0, 6.28); g.fill();
  }
  /* the coating: a fine pitted grain */
  for (let i = 0; i < 90000; i++) {
    const v = rand() < 0.5 ? "rgba(255,255,250," : "rgba(122,112,96,";
    g.fillStyle = v + (0.04 + rand() * 0.1) + ")";
    g.fillRect(rand() * S, rand() * S, 1 + rand() * 1.2, 1 + rand() * 1.2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(16, renderer.capabilities.getMaxAnisotropy());
  return tex;
}

/* a disc made of rings, so the surface can be moved in the vertical to ring after a hit */
function polarDisc(radius, rings, seg) {
  const pos = new Float32Array((rings * seg + 1) * 3), uv = new Float32Array((rings * seg + 1) * 2);
  let n = 0;
  uv[0] = 0.5; uv[1] = 0.5; n = 1;
  for (let r = 1; r <= rings; r++) {
    const rr = (r / rings) * radius;
    for (let s = 0; s < seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      const x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      pos[n * 3] = x; pos[n * 3 + 1] = 0; pos[n * 3 + 2] = z;
      uv[n * 2] = 0.5 + x / (2 * radius); uv[n * 2 + 1] = 0.5 - z / (2 * radius);
      n++;
    }
  }
  const idx = [];
  for (let s = 0; s < seg; s++) idx.push(0, 1 + ((s + 1) % seg), 1 + s);
  for (let r = 1; r < rings; r++) {
    const a = 1 + (r - 1) * seg, b = 1 + r * seg;
    for (let s = 0; s < seg; s++) {
      const s2 = (s + 1) % seg;
      idx.push(a + s, a + s2, b + s); idx.push(a + s2, b + s2, b + s);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function roundedRect(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/* a triple-flange hoop: thin steel, a lip that rolls out and back down */
function hoopGeometry(radius) {
  const p = [
    [0.035, -0.10], [0.035, 0.05], [0.05, 0.115], [0.10, 0.145], [0.19, 0.145], [0.24, 0.115], [0.255, 0.06], [0.255, 0.02],
    [0.235, 0.02], [0.235, 0.06], [0.222, 0.098], [0.185, 0.118], [0.105, 0.118], [0.068, 0.098], [0.058, 0.055], [0.058, -0.10],
  ].map(([x, y]) => new THREE.Vector2(radius + x, y));
  const g = new THREE.LatheGeometry(new THREE.SplineCurve(p).getPoints(90), 160);
  g.computeVertexNormals();
  return g;
}

export function buildSnare(renderer) {
  const g = new THREE.Group();
  const mats = {
    chrome: new THREE.MeshPhysicalMaterial({ color: "#ffffff", metalness: 1, roughness: 0.07, clearcoat: 0.0, side: THREE.DoubleSide }),
    chromeSoft: new THREE.MeshPhysicalMaterial({ color: "#d9dcdc", metalness: 1, roughness: 0.22 }),
    steel: new THREE.MeshPhysicalMaterial({ color: "#a9aeb0", metalness: 1, roughness: 0.38 }),
    rubber: new THREE.MeshStandardMaterial({ color: "#0f0f10", roughness: 0.85 }),
    black: new THREE.MeshStandardMaterial({ color: "#151516", roughness: 0.45, metalness: 0.4 }),
  };
  const shellMat = new THREE.MeshPhysicalMaterial({
    map: shellTexture(renderer), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08, side: THREE.DoubleSide,
  });
  const inner = new THREE.MeshStandardMaterial({ color: "#c79a62", roughness: 0.7, side: THREE.BackSide });

  const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 160, 1, true), shellMat);
  shell.position.y = -H / 2; shell.castShadow = true; shell.receiveShadow = true;
  g.add(shell);
  const shellIn = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.02, R - 0.02, H, 96, 1, true), inner);
  shellIn.position.y = -H / 2; g.add(shellIn);

  /* head, its collar, and the hoop that holds it */
  const headMat = new THREE.MeshPhysicalMaterial({
    map: headTexture(renderer), roughness: 0.72, metalness: 0, sheen: 0.25, sheenRoughness: 0.6, sheenColor: new THREE.Color("#fff4e0"),
    bumpScale: 0.6,
  });
  headMat.bumpMap = headMat.map;
  const headGeo = polarDisc(R - 0.025, 44, 144);
  const head = new THREE.Mesh(headGeo, headMat);
  head.position.y = HEAD_Y - 0.004; head.receiveShadow = true; head.castShadow = false;
  g.add(head);
  const collar = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.016, R + 0.016, 0.2, 128, 1, true), mats.steel);
  collar.position.y = HEAD_Y - 0.09; g.add(collar);

  const hoopTop = new THREE.Mesh(hoopGeometry(R), mats.chrome);
  hoopTop.position.y = HEAD_Y - 0.02; hoopTop.castShadow = true; hoopTop.receiveShadow = true; g.add(hoopTop);
  const hoopBot = new THREE.Mesh(hoopGeometry(R), mats.chrome);
  hoopBot.rotation.x = Math.PI; hoopBot.position.y = -H + 0.02; hoopBot.castShadow = true; g.add(hoopBot);
  /* resonant head, seen from low angles */
  const under = new THREE.Mesh(new THREE.CircleGeometry(R - 0.03, 64).rotateX(Math.PI / 2),
    new THREE.MeshStandardMaterial({ color: "#d8d3c6", roughness: 0.8 }));
  under.position.y = -H - 0.01; g.add(under);

  /* ten lugs, rods, and the claws that grip the hoop */
  const lugGeo = new THREE.ExtrudeGeometry(roundedRect(0.2, 0.62, 0.07), { depth: 0.2, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 4, curveSegments: 10 });
  lugGeo.translate(0, 0, -0.1);
  const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, H * 0.88, 10);
  const headGeoSq = new THREE.BoxGeometry(0.075, 0.075, 0.075);
  const clawGeo = new THREE.ExtrudeGeometry(roundedRect(0.19, 0.1, 0.03), { depth: 0.12, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 3 });
  clawGeo.translate(0, 0, -0.06);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + Math.PI / 10;
    const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const lug = new THREE.Mesh(lugGeo, mats.chrome);
    lug.position.copy(dir).multiplyScalar(R + 0.1); lug.position.y = -H / 2; lug.rotation.y = a; lug.castShadow = true; g.add(lug);
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16).rotateX(Math.PI / 2), mats.steel);
    bolt.position.copy(dir).multiplyScalar(R + 0.28); bolt.position.y = -H / 2; bolt.rotation.y = a; g.add(bolt);
    const rod = new THREE.Mesh(rodGeo, mats.chromeSoft);
    rod.position.copy(dir).multiplyScalar(R + 0.2); rod.position.y = -H / 2 + 0.06; g.add(rod);
    const claw = new THREE.Mesh(clawGeo, mats.chrome);
    claw.position.copy(dir).multiplyScalar(R + 0.19); claw.position.y = HEAD_Y + 0.07; claw.rotation.y = a; claw.castShadow = true; g.add(claw);
    const cap = new THREE.Mesh(headGeoSq, mats.chromeSoft);
    cap.position.copy(dir).multiplyScalar(R + 0.2); cap.position.y = HEAD_Y + 0.15; cap.rotation.y = a; g.add(cap);
  }

  /* strainer: butt plate on one side, throw-off on the other, a lever you can see from the player's side */
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.34, 0.06), mats.chromeSoft);
  plate.position.set(0, -0.5, R + 0.04); plate.castShadow = true; g.add(plate);
  const lever = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.46, 10).rotateZ(Math.PI / 2), mats.chrome);
  lever.position.set(0, -0.42, R + 0.12); g.add(lever);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mats.black);
  knob.position.set(0.24, -0.42, R + 0.12); g.add(knob);
  const butt = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.3, 0.06), mats.chromeSoft);
  butt.position.set(0, -0.5, -R - 0.04); g.add(butt);

  /* the stand: hub, three legs with rubber feet, three basket arms with grips */
  const hubY = -2.1;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.42, 24), mats.chromeSoft);
  hub.position.y = hubY; g.add(hub);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 18), mats.chromeSoft);
  post.position.y = hubY + 0.4; g.add(post);
  const tube = (a, b, r, mat) => {
    const len = a.distanceTo(b);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 14), mat);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
  };
  for (let i = 0; i < 3; i++) {
    const a = i * Math.PI * 2 / 3 + 0.35;
    const d = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    const top = new THREE.Vector3(d.x * 0.12, hubY - 0.1, d.z * 0.12);
    const bot = new THREE.Vector3(d.x * 2.35, FLOOR_Y + 0.07, d.z * 2.35);
    tube(top, bot, 0.05, mats.chromeSoft);
    const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.075, 0.28, 6, 14).rotateZ(Math.PI / 2), mats.rubber);
    foot.position.copy(bot); foot.position.y = FLOOR_Y + 0.07; foot.rotation.y = a + Math.PI / 2; foot.castShadow = true; g.add(foot);
    /* basket arm */
    const aBase = new THREE.Vector3(d.x * 0.1, hubY + 0.55, d.z * 0.1);
    const aEnd = new THREE.Vector3(d.x * (R - 0.35), -H - 0.02, d.z * (R - 0.35));
    tube(aBase, aEnd, 0.04, mats.chromeSoft);
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.07, 0.2), mats.rubber);
    pad.position.set(d.x * (R - 0.4), -H - 0.07, d.z * (R - 0.4)); pad.rotation.y = a; g.add(pad);
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), mats.black);
    wing.position.copy(top).lerp(bot, 0.22); g.add(wing);
  }
  return { root: g, head, headGeo, mats };
}

/* ------------------------------------------------------------------------ */
/* soft helpers                                                              */
/* ------------------------------------------------------------------------ */

export function blobTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.35, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* a warm pool of light on the floor */
export function poolTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d");
  const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  gr.addColorStop(0, "rgba(255,196,120,0.55)"); gr.addColorStop(0.5, "rgba(255,170,90,0.16)"); gr.addColorStop(1, "rgba(255,160,80,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/* ring the head: summed, decaying radial waves from each recent impact.
   hits: [{ x, z, amp, age }]  age in 0..1 across the rebound */
const _rest = new WeakMap();
export function ringHead(geo, hits) {
  const pos = geo.attributes.position;
  let rest = _rest.get(geo);
  if (!rest) { rest = new Float32Array(pos.array); _rest.set(geo, rest); }
  const n = pos.count;
  let any = false;
  for (const h of hits) if (h.amp > 0.0005) any = true;
  for (let i = 0; i < n; i++) {
    const x = rest[i * 3], z = rest[i * 3 + 2];
    let y = 0;
    if (any) {
      const rr = Math.sqrt(x * x + z * z) / (R - 0.025);
      for (const h of hits) {
        if (h.amp <= 0.0005) continue;
        const d = Math.hypot(x - h.x, z - h.z);
        /* a dent that rebounds, plus a wave running outward and fading with distance and time */
        y += h.amp * (Math.exp(-d * d * 7) * Math.cos(h.age * 9.0) * 0.8 + Math.cos(h.age * 16 - d * 4.2) * Math.exp(-d * 0.9) * 0.22) * (1 - rr * rr * 0.6);
      }
    }
    pos.array[i * 3 + 1] = y;
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
}
