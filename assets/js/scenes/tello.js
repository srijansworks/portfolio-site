/* DJI Tello scroll sequence for the person-following project page.

   Everything on screen is a pure function of one number, p (0..1), the scroll
   progress through the stage. Nothing is stateful, so scrolling backwards plays
   the sequence in reverse.

   Beats sit at p = 0, .25, .5, .75, 1 (the text slots are one viewport each):
     0     hover beside the project introduction
     .25   close-up, camera has orbited and approached
     .5    a target appears; the drone turns to face it; the box locks on
     .75   following
     1     the drone leaves; the recorded flight takes over

   Units: 1 unit is roughly one drone width. The person is drawn about 4 units
   tall so both fit in frame, which is why the page says "not to scale". */
import {
  THREE, createStage, makeGround, readTheme, track, clamp01, lerp, smooth, span,
} from "./core.js";

/* ------------------------------------------------------------------------ */
/* geometry helpers                                                          */
/* ------------------------------------------------------------------------ */

/* polygon with rounded corners, points in (x, z) world coordinates.
   Built in XY then rotated so shape-y maps to -z. */
function roundedPolyShape(pts, r) {
  const n = pts.length, s = new THREE.Shape();
  const P = pts.map(([x, z]) => new THREE.Vector2(x, -z));
  const cuts = P.map((p, i) => {
    const a = P[(i + n - 1) % n], b = P[(i + 1) % n];
    const da = p.distanceTo(a), db = p.distanceTo(b);
    const ra = Math.min(r, da * 0.5), rb = Math.min(r, db * 0.5);
    return { v: p, in: p.clone().lerp(a, ra / da), out: p.clone().lerp(b, rb / db) };
  });
  s.moveTo(cuts[0].out.x, cuts[0].out.y);
  for (let k = 1; k <= n; k++) {
    const c = cuts[k % n];
    s.lineTo(c.in.x, c.in.y);
    s.quadraticCurveTo(c.v.x, c.v.y, c.out.x, c.out.y);
  }
  return s;
}

function slab(pts, r, height, bevel = 0.03, seg = 5) {
  const g = new THREE.ExtrudeGeometry(roundedPolyShape(pts, r), {
    depth: Math.max(0.001, height - bevel * 2), bevelEnabled: true,
    bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 14,
  });
  g.rotateX(-Math.PI / 2);       /* extrusion now runs along +y */
  g.translate(0, -(height - bevel * 2) / 2, 0);
  g.computeVertexNormals();
  return g;
}

/* rounded box facing +z (shape in XY, extruded along z) */
function roundBox(w, h, d, r, bevel = 0.012) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(0.001, d - bevel * 2), bevelEnabled: true, bevelThickness: bevel,
    bevelSize: bevel * 0.8, bevelSegments: 3, curveSegments: 10,
  });
  g.translate(0, 0, -(d - bevel * 2) / 2);
  return g;
}

/* hoop wall: rounded rectangular section revolved around y */
function hoop(rIn, rOut, h, round = 0.008, seg = 72) {
  const pts = [], cx = [[rIn, -h / 2], [rOut, -h / 2], [rOut, h / 2], [rIn, h / 2]];
  const k = 4;
  /* walk the rectangle, rounding each corner with a few points */
  const corners = [
    [rOut - round, -h / 2 + round, -Math.PI / 2, 0],
    [rOut - round, h / 2 - round, 0, Math.PI / 2],
    [rIn + round, h / 2 - round, Math.PI / 2, Math.PI],
    [rIn + round, -h / 2 + round, Math.PI, Math.PI * 1.5],
  ];
  corners.forEach(([cxx, cyy, a0, a1]) => {
    for (let i = 0; i <= k; i++) {
      const a = lerp(a0, a1, i / k);
      pts.push(new THREE.Vector2(cxx + Math.cos(a) * round, cyy + Math.sin(a) * round));
    }
  });
  pts.push(pts[0].clone());
  return new THREE.LatheGeometry(pts, seg);
}

function mesh(geo, mat, { cast = true, receive = false } = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}

/* ------------------------------------------------------------------------ */
/* the drone                                                                 */
/* ------------------------------------------------------------------------ */

function buildDrone() {
  const root = new THREE.Group();     /* origin at the centre; nose points +z */
  const white = new THREE.MeshPhysicalMaterial({ color: "#f3f4f0", roughness: 0.36, clearcoat: 0.4, clearcoatRoughness: 0.32 });
  const grey = new THREE.MeshPhysicalMaterial({ color: "#d9dcd7", roughness: 0.46, clearcoat: 0.2, clearcoatRoughness: 0.4 });
  const black = new THREE.MeshPhysicalMaterial({ color: "#0b0d0e", roughness: 0.26, metalness: 0.15, clearcoat: 0.9, clearcoatRoughness: 0.1 });
  const graphite = new THREE.MeshStandardMaterial({ color: "#272b2c", roughness: 0.55, metalness: 0.2 });
  const glass = new THREE.MeshPhysicalMaterial({ color: "#04060a", roughness: 0.03, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 2.0 });
  const lensTint = new THREE.MeshPhysicalMaterial({ color: "#16284a", roughness: 0.06, metalness: 0.7, clearcoat: 1, envMapIntensity: 2.2 });
  const propMat = new THREE.MeshStandardMaterial({ color: "#2d3233", roughness: 0.42, metalness: 0.1 });
  const ledMat = new THREE.MeshBasicMaterial({ color: "#b8d800" });

  /* fuselage */
  const fus = mesh(slab([[-0.185, -0.40], [0.185, -0.40], [0.2, 0.18], [0.165, 0.42], [-0.165, 0.42], [-0.2, 0.18]], 0.1, 0.17, 0.045, 6), white, { receive: true });
  fus.position.y = 0.05;
  root.add(fus);

  /* battery door on top, slightly proud, with finger grooves */
  const door = mesh(slab([[-0.115, -0.3], [0.115, -0.3], [0.115, 0.1], [-0.115, 0.1]], 0.06, 0.03, 0.01, 3), grey, { receive: true });
  door.position.set(0, 0.145, -0.1);
  root.add(door);
  for (let i = 0; i < 4; i++) {
    const g = mesh(new THREE.BoxGeometry(0.15, 0.004, 0.012), graphite, { cast: false });
    g.position.set(0, 0.163, -0.26 + i * 0.03);
    root.add(g);
  }

  /* front camera module, tilted slightly down */
  const cam = new THREE.Group();
  cam.position.set(0, 0.055, 0.4);
  cam.rotation.x = 0.16;
  const housing = mesh(roundBox(0.3, 0.14, 0.1, 0.05, 0.016), black);
  cam.add(housing);
  const bezel = mesh(new THREE.CylinderGeometry(0.062, 0.068, 0.024, 40).rotateX(Math.PI / 2), graphite);
  bezel.position.z = 0.05; cam.add(bezel);
  const lens = mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 40).rotateX(Math.PI / 2), glass, { cast: false });
  lens.position.z = 0.062; cam.add(lens);
  const tint = mesh(new THREE.CircleGeometry(0.028, 32), lensTint, { cast: false });
  tint.position.z = 0.0725; cam.add(tint);
  root.add(cam);

  /* status LED under the camera */
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.014, 16, 12), ledMat);
  led.position.set(0, -0.032, 0.425);
  root.add(led);

  /* underside: vision-positioning plate with two small lenses */
  const under = mesh(slab([[-0.09, -0.04], [0.09, -0.04], [0.09, 0.12], [-0.09, 0.12]], 0.03, 0.018, 0.006, 2), graphite, { cast: false });
  under.position.set(0, -0.045, 0.18);
  root.add(under);
  [-0.035, 0.035].forEach((x) => {
    const l = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 20), glass, { cast: false });
    l.position.set(x, -0.056, 0.2); root.add(l);
  });

  /* rear vent strip */
  const vent = mesh(new THREE.BoxGeometry(0.15, 0.03, 0.01), graphite, { cast: false });
  vent.position.set(0, 0.06, -0.425); root.add(vent);

  /* four arms, guard hoops, motors and props */
  const props = [];
  const R_IN = 0.185, R_OUT = 0.207;
  [[1, 1], [-1, 1], [1, -1], [-1, -1]].forEach(([sx, sz], idx) => {
    const cx = sx * 0.3, cz = sz * 0.27;
    const ring = mesh(hoop(R_IN, R_OUT, 0.1), grey, { receive: true });
    ring.position.set(cx, 0.045, cz); root.add(ring);

    /* arm: capsule from fuselage corner to the motor */
    const a = new THREE.Vector3(sx * 0.14, 0.04, sz * 0.2), b = new THREE.Vector3(cx, 0.04, cz);
    const len = a.distanceTo(b);
    const arm = mesh(new THREE.CapsuleGeometry(0.03, len, 6, 14), white, { receive: true });
    arm.position.copy(a).add(b).multiplyScalar(0.5);
    arm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    root.add(arm);

    /* two thin struts tie each hoop to its motor mount */
    [0.75, 2.4].forEach((ang) => {
      const strut = mesh(new THREE.BoxGeometry(R_IN - 0.03, 0.012, 0.012), white, { cast: false });
      const dir = new THREE.Vector3(Math.cos(ang) * sx, 0, Math.sin(ang) * sz).normalize();
      strut.position.set(cx + dir.x * (R_IN - 0.02) * 0.5, 0.04, cz + dir.z * (R_IN - 0.02) * 0.5);
      strut.rotation.y = -Math.atan2(dir.z, dir.x);
      root.add(strut);
    });

    const motor = mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.07, 28), graphite);
    motor.position.set(cx, 0.045, cz); root.add(motor);

    /* prop: two blades with pitch, a hub, and a faint blur disc */
    const prop = new THREE.Group();
    prop.position.set(cx, 0.1, cz);
    const bl = new THREE.Shape();
    bl.moveTo(0.02, -0.012); bl.bezierCurveTo(0.08, -0.03, 0.14, -0.03, 0.172, -0.01);
    bl.bezierCurveTo(0.182, 0.004, 0.17, 0.02, 0.15, 0.022);
    bl.bezierCurveTo(0.1, 0.03, 0.05, 0.02, 0.02, 0.012); bl.closePath();
    const bg = new THREE.ExtrudeGeometry(bl, { depth: 0.004, bevelEnabled: false });
    bg.rotateX(-Math.PI / 2);
    for (let k = 0; k < 2; k++) {
      const blade = mesh(bg, propMat, { cast: true });
      blade.rotation.x = 0.22 * (k ? -1 : 1);       /* pitch */
      blade.rotation.y = k * Math.PI;
      const holder = new THREE.Group(); holder.add(blade); prop.add(holder);
    }
    const hub = mesh(new THREE.CylinderGeometry(0.026, 0.03, 0.022, 24), graphite);
    prop.add(hub);
    const blur = new THREE.Mesh(new THREE.CircleGeometry(0.178, 48).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: "#10151a", transparent: true, opacity: 0.1, depthWrite: false }));
    blur.position.y = 0.002; prop.add(blur);
    root.add(prop);
    props.push({ node: prop, dir: idx === 0 || idx === 3 ? 1 : -1, blur });
  });

  return { root, props, led, ledMat, cam };
}

/* optional real model: drop a GLB at assets/models/tello.glb and it is used
   instead of the procedural one (see README for the attribution to keep). */
async function tryLoadGLB(url) {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (!head.ok) return null;
    const type = head.headers.get("content-type") || "";
    if (/text\/html/.test(type)) return null;          /* SPA fallbacks answer 200 with html */
    const { GLTFLoader } = await import("three/addons/loaders/GLTFLoader.js");
    const gltf = await new GLTFLoader().loadAsync(url);
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const k = 1.0 / Math.max(size.x, size.z);          /* about one unit across */
    const wrap = new THREE.Group();
    model.scale.setScalar(k);
    const c = box.getCenter(new THREE.Vector3()).multiplyScalar(k);
    model.position.sub(c);
    model.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    wrap.add(model);
    return { root: wrap, props: [], led: null, ledMat: null, cam: null };
  } catch (e) { return null; }
}

/* ------------------------------------------------------------------------ */
/* the target                                                                */
/* ------------------------------------------------------------------------ */

function buildTarget(theme) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({
    color: theme.dark ? "#c9d1c9" : "#2a342d", roughness: 0.62, metalness: 0.05, transparent: true,
  });
  /* torso: shoulders wider than hips, drawn as a lathe so it reads as a person, not a pill */
  const prof = [[0.0, 1.62], [0.3, 1.64], [0.37, 1.9], [0.4, 2.5], [0.46, 3.05], [0.4, 3.32], [0.2, 3.44], [0.0, 3.46]]
    .map(([x, y]) => new THREE.Vector2(x, y));
  const torso = mesh(new THREE.LatheGeometry(prof, 36), bodyMat);
  const head = mesh(new THREE.SphereGeometry(0.32, 32, 24), bodyMat);
  head.position.y = 3.86;
  const neck = mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.2, 16), bodyMat);
  neck.position.y = 3.52;
  g.add(torso, head, neck);

  /* limbs hang from pivots so they can swing with the walk */
  const limb = (r, len, x, y) => {
    const piv = new THREE.Group(); piv.position.set(x, y, 0);
    const m = mesh(new THREE.CapsuleGeometry(r, len, 6, 12), bodyMat);
    m.position.y = -(len / 2 + r);
    piv.add(m); g.add(piv); return piv;
  };
  const legs = [limb(0.17, 1.2, -0.2, 1.7), limb(0.17, 1.2, 0.2, 1.7)];
  const arms = [limb(0.12, 1.15, -0.56, 3.12), limb(0.12, 1.15, 0.56, 3.12)];

  /* ground ring: the target mark */
  const ringMat = new THREE.MeshBasicMaterial({ color: theme.signal, transparent: true, depthWrite: false });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 0.98, 64).rotateX(-Math.PI / 2), ringMat);
  ring.position.y = 0.01;
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.38, 64).rotateX(-Math.PI / 2), ringMat.clone());
  ring2.position.y = 0.01;
  g.add(ring, ring2);
  return { root: g, mats: [bodyMat, ringMat, ring2.material], ring, ring2, torso, head, legs, arms, height: 4.2 };
}

/* ------------------------------------------------------------------------ */
/* the sequence                                                              */
/* ------------------------------------------------------------------------ */

const P0 = 0.4, P1 = 0.9;                       /* person walks between these */
const personPath = track([
  [0.0, [2.6, 0, -1.2]], [0.25, [1.0, 0, -3.4]], [0.5, [-1.2, 0, -4.9]],
  [0.75, [-3.9, 0, -4.6]], [1.0, [-6.2, 0, -6.4]],
]);
const personAt = (p) => personPath(clamp01((p - P0) / (P1 - P0))).clone();
/* Heading comes from the path itself, sampled in path-time and clamped inside it. The earlier
   version differenced personAt(p±0.01), which is zero once p passes P1 (the path is clamped there),
   so the direction collapsed to (0,0,0) and the chase camera dropped to a bird's-eye view. */
const _pd = new THREE.Vector3();
const personDir = (p) => {
  const t = Math.min(0.97, Math.max(0.03, (p - P0) / (P1 - P0)));
  _pd.copy(personPath(t + 0.03)); const a = _pd.x, b = _pd.z;
  personPath(t - 0.03);
  return new THREE.Vector3(a - personPath(t - 0.03).x, 0, b - personPath(t - 0.03).z).normalize();
};

/* free flight before the target appears: hover, then sweep through the scene */
const flight = track([
  [0.00, [1.6, 1.9, 0.0]],
  [0.09, [1.6, 1.9, 0.0]],
  [0.17, [0.9, 2.1, 0.5]],
  [0.25, [-0.6, 2.0, -0.2]],
  [0.33, [-1.6, 2.5, -1.8]],
  [0.41, [0.8, 3.1, -1.0]],
]);

/* Camera, part 1: an orbit measured from the drone (azimuth from its nose, elevation, distance).
   The camera swings round it and closes in, so the nose camera and guards come into view. */
const orbit = track([
  [0.00, [0.75, 0.16, 6.3]],
  [0.09, [0.80, 0.17, 6.0]],
  [0.18, [0.45, 0.28, 4.0]],
  [0.25, [0.42, 0.30, 2.5]],
  [0.33, [1.9, 0.26, 3.6]],
  [0.41, [2.9, 0.30, 7.0]],
]);
/* Camera, part 2: a tracking shot of the chase. It stays level with the midpoint between drone
   and person, off to the side so both read, and drifts round from the front to behind.
   Keys are [azimuth from the walking direction, distance, height]. */
const chase = track([
  [0.40, [1.05, 12.0, 3.6]],
  [0.50, [0.95, 11.4, 3.8]],
  [0.62, [0.75, 10.6, 4.1]],
  [0.75, [0.50, 10.2, 4.7]],
  [0.90, [0.15, 11.0, 5.5]],
  [1.00, [0.00, 11.4, 5.8]],
]);

function angleLerp(a, b, t) {
  const d = ((b - a + Math.PI) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2) - Math.PI;
  return a + d * t;
}

/* the drone's path before the exit move: free flight, blending into following the person */
function baseAt(p) {
  const free = flight(p).clone();
  const dir = personDir(p);
  const lagged = personAt(p - 0.045);                 /* tracks a slightly old copy of the person */
  const follow = new THREE.Vector3(lagged.x - dir.x * 4.0, 2.9, lagged.z - dir.z * 4.0);
  return free.lerp(follow, smooth((p - 0.38) / 0.12));
}

/* drone state at p */
function droneAt(p) {
  const dir = personDir(p);
  const b = smooth((p - 0.38) / 0.12);
  const base = baseAt(p);
  const pos = base.clone();

  /* leaving: it climbs and slips off into the distance as the recorded flight takes over */
  const out = span(p, 0.84, 0.98);
  if (out > 0) {
    /* screen-right is against the walking direction, "away" is the far side of it */
    pos.x += (-dir.x * 11 + dir.z * 3) * out;
    pos.z += (-dir.z * 11 - dir.x * 3) * out;
    pos.y += out * 2.2 + out * out * 5.5;
  }

  /* yaw: turned a little toward the viewer while hovering, along its heading while it flies,
     then onto the person */
  /* heading from the blended path (not the free-flight spline alone, which ends at p=.41 and
     used to zero the speed there and snap the yaw) */
  const v = baseAt(p + 0.05).sub(baseAt(p - 0.05)).setY(0);   /* wide window: the path turns back at p≈.33 */
  const speed = v.length() / 0.1;
  const travel = speed > 0.01 ? Math.atan2(v.x, v.z) : 0.5;
  const mv = smooth((speed - 2) / 14);                 /* dead-band: a spline's tiny drift is not flight */
  let yaw = angleLerp(0.5, travel, mv);
  const toward = personAt(p - 0.03).sub(pos);
  yaw = angleLerp(yaw, Math.atan2(toward.x, toward.z), smooth((p - 0.44) / 0.1));

  const pitch = 0.1 * mv * (1 - smooth((p - 0.46) / 0.1)) + 0.05 * b;
  return { pos, base, yaw, pitch };
}

/* test hook: lets a script sample the camera path without scrolling */
export const _seq = { droneAt: (p) => droneAt(p), cameraAt: (p, d) => cameraAt(p, d), personDir: (p) => personDir(p) };

const _o = new THREE.Vector3(), _l = new THREE.Vector3(), _m = new THREE.Vector3(), _c = new THREE.Vector3();
function cameraAt(p, d) {
  /* part 1: orbit around the drone */
  const o = orbit(Math.min(p, 0.41));
  const az = d.yaw + o.x, el = o.y, r = o.z;
  _o.set(Math.sin(az) * Math.cos(el) * r, Math.sin(el) * r, Math.cos(az) * Math.cos(el) * r).add(d.pos);
  /* look at the drone, nudged toward the middle of the stage so its travel reads across the frame */
  _l.copy(d.pos).lerp(_c.set(0.2, 1.9, -0.6), 0.3 * (1 - span(p, 0.0, 0.1)));

  /* part 2: the chase */
  const k = span(p, 0.36, 0.46);
  if (k > 0) {
    const q = Math.max(p, 0.4);
    const person = personAt(q), dir = personDir(q);
    _m.copy(person).setY(1.9).lerp(d.base, 0.5);         /* midpoint of person chest and drone */
    const c = chase(q);
    const side = _c.set(dir.z, 0, -dir.x);               /* to the walker's left, toward the viewer */
    const cp = new THREE.Vector3()
      .addScaledVector(side, Math.cos(c.x) * c.y)
      .addScaledVector(new THREE.Vector3(dir.x, 0, dir.z), Math.sin(c.x) * c.y)
      .add(_m); cp.y += c.z;
    _o.lerp(cp, k);
    _l.lerp(_m, k);
  }
  /* keep the lens well outside the drone, whatever the path does: ease out along the line of sight */
  const clear = 1.7 * (1 + 0.4 * span(p, 0.38, 0.55));
  const gap = _o.distanceTo(d.pos);
  if (gap < clear) _o.sub(d.pos).setLength(clear).add(d.pos);
  return { pos: _o, look: _l };
}

/* ------------------------------------------------------------------------ */
/* mount                                                                     */
/* ------------------------------------------------------------------------ */

export async function mount(host, ctx) {
  const { ScrollTrigger, reduced } = ctx;
  const canvas = host.querySelector(".tstage__canvas");
  const theme = readTheme();

  const stage = createStage(canvas, { exposure: theme.dark ? 0.95 : 1.05, envIntensity: theme.dark ? 0.55 : 0.85, fov: 30 });
  const { scene, camera, renderer } = stage;

  /* light: a soft key from upper left, a cool rim, and the room environment for reflections */
  scene.add(new THREE.HemisphereLight("#ffffff", theme.dark ? "#1a221c" : "#cfd5c8", 0.45));
  const key = new THREE.DirectionalLight("#fff6ea", theme.dark ? 2.2 : 2.6);
  key.position.set(-6, 14, 8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -12; key.shadow.camera.right = 12;
  key.shadow.camera.top = 12; key.shadow.camera.bottom = -12;
  key.shadow.camera.near = 1; key.shadow.camera.far = 40;
  key.shadow.bias = -0.0006; key.shadow.normalBias = 0.03;
  key.shadow.radius = 7; key.shadow.blurSamples = 20;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight("#dfe9ff", 0.9);
  rim.position.set(7, 5, -8);
  scene.add(rim);

  const ground = makeGround(theme, { size: 60, cell: 2, shadowOpacity: 0.3 });
  scene.add(ground);

  /* drone: a real GLB only if one is configured (scene.model in content/projects.js),
     otherwise the procedural build. Nothing is requested unless you opt in. */
  const modelUrl = host.dataset.model;
  const glb = modelUrl ? await tryLoadGLB(modelUrl) : null;
  const drone = glb || buildDrone();
  const droneRig = new THREE.Group();
  droneRig.add(drone.root);
  scene.add(droneRig);

  const target = buildTarget(theme);
  scene.add(target.root);

  /* the drone's own camera, drawn as an inset (960x720, like the real stream) */
  const insetCam = new THREE.PerspectiveCamera(56, 4 / 3, 0.2, 80);
  const inset = host.querySelector(".tstage__inset");
  const frameEl = host.querySelector(".tstage__frame");
  const insetBox = host.querySelector(".tbox--inset");
  const mainBox = host.querySelector(".tbox--main");
  const offsetLine = host.querySelector(".tstage__offset");
  const tagEl = host.querySelector(".tstage__tag");
  let insetRect = null;

  const layout = () => {
    const narrow = stage.w < 760;
    /* subject beside the text on wide screens, above it on phones */
    stage.shift.x = narrow ? 0 : 0.17;
    stage.shift.y = narrow ? 0.2 : 0;
    stage.applyView();
    if (frameEl && inset && getComputedStyle(inset).display !== "none") {
      const c = canvas.getBoundingClientRect(), r = frameEl.getBoundingClientRect();
      insetRect = { x: r.left - c.left + 1, y: r.top - c.top + 1, w: r.width - 2, h: r.height - 2 };
    } else insetRect = null;
  };
  stage.onResize.push(layout);
  layout();

  let target_p = 0, shown_p = 0;
  host.__progress = () => ({ shown: shown_p, target: target_p });      /* read by the visual checks */
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const bbox = (cam, w, h) => {
    const hx = 0.62 * 0.86, hz = 0.5 * 0.86, hy = target.height * 0.86;
    let n = 0;
    for (const x of [-hx, hx]) for (const y of [0, hy]) for (const z of [-hz, hz]) {
      corners[n++].set(x, y, z).applyMatrix4(target.root.matrixWorld).project(cam);
    }
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, behind = false;
    corners.forEach((c) => {
      if (c.z > 1) behind = true;
      x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y);
    });
    return { behind, x: (x0 + 1) / 2 * w, y: (1 - (y1 + 1) / 2) * h, w: (x1 - x0) / 2 * w, h: (y1 - y0) / 2 * h };
  };
  const setBox = (el, b, lock, show) => {
    if (!el) return;
    if (!show || b.behind) { el.style.opacity = "0"; return; }
    const grow = 1 + (1 - lock) * 1.1;                       /* the corners close in as it locks */
    const cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    const w = (b.w + 16) * grow, hh = (b.h + 16) * grow;
    el.style.opacity = String(Math.min(1, lock * 2.2));
    el.style.transform = `translate(${cx - w / 2}px, ${cy - hh / 2}px)`;
    el.style.width = w + "px"; el.style.height = hh + "px";
  };

  let st = { p: 0, d: null, lock: 0, insetOn: 0 };
  const fwd = new THREE.Vector3();

  stage.onFrame = (dt, time) => {
    /* glide toward the scroll position with a short even lag, so jumps still read */
    const k = reduced ? 1 : 1 - Math.exp(-dt * 11);
    shown_p += (target_p - shown_p) * k;
    const p = shown_p;

    /* the drone: path from p, plus a little hover so it never looks pinned */
    const d = droneAt(p);
    droneRig.position.copy(d.pos);
    droneRig.position.y += Math.sin(time * 1.9) * 0.035 + Math.sin(time * 3.1) * 0.012;
    droneRig.scale.setScalar(1 + 0.4 * span(p, 0.38, 0.55));   /* a drawing: allowed to cheat the scale */
    droneRig.rotation.set(0, 0, 0);
    droneRig.rotateY(d.yaw);
    droneRig.rotateX(d.pitch + Math.sin(time * 1.3) * 0.012);
    droneRig.rotateZ(Math.sin(time * 1.1) * 0.01);
    drone.props.forEach((pr) => { pr.node.rotation.y += pr.dir * dt * 62; });
    if (drone.ledMat) {
      const on = 0.55 + 0.45 * Math.sin(time * 4.2);
      drone.ledMat.color.set(theme.signal).multiplyScalar(0.35 + on * 0.9);
    }

    /* the target: rises in, then walks. Limbs swing with the walk. */
    const appear = span(p, 0.385, 0.455);
    const walk = clamp01((p - P0) / (P1 - P0));
    const here = personAt(p), dir = personDir(p);
    const tr = target.root;
    tr.visible = appear > 0.001;
    tr.position.copy(here);
    tr.position.y = (1 - appear) * -0.6;
    tr.rotation.y = Math.atan2(dir.x, dir.z);
    tr.scale.setScalar((0.88 + appear * 0.12) * 0.86);
    target.mats[0].opacity = appear;
    target.mats[1].opacity = appear * 0.95;
    target.mats[2].opacity = appear * (0.45 + 0.3 * Math.sin(time * 3.0));
    target.ring2.scale.setScalar(1 + (1 - appear) * 0.8 + Math.sin(time * 3.0) * 0.03);
    const stride = Math.sin(walk * 64) * 0.5 * span(p, 0.44, 0.5);
    target.legs[0].rotation.x = stride;  target.legs[1].rotation.x = -stride;
    target.arms[0].rotation.x = -stride * 0.7; target.arms[1].rotation.x = stride * 0.7;
    tr.updateMatrixWorld(true);

    /* the main camera */
    const c = cameraAt(p, d);
    camera.position.copy(c.pos);
    camera.position.y += Math.sin(time * 0.6) * 0.03 * (1 - span(p, 0.1, 0.2));
    camera.lookAt(c.look);
    const fov = 30 + 7 * span(p, 0.36, 0.5);
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld(true);

    /* keep the key light's shadow over the action */
    key.target.position.set(d.pos.x * 0.6, 0, d.pos.z * 0.6 - 1);
    key.position.set(key.target.position.x - 6, 14, key.target.position.z + 8);
    ground.userData.grid.uniforms.uCenter.value.set(d.pos.x * 0.6, d.pos.z * 0.6 - 1);

    /* lock-on box, closing in on the target */
    const lock = span(p, 0.47, 0.56) * (1 - span(p, 0.93, 0.98));
    const showMain = p > 0.455 && p < 0.985;
    setBox(mainBox, bbox(camera, stage.w, stage.h), lock, showMain);

    /* the canvas fades out at the end so the recorded flight takes over */
    canvas.style.opacity = String(1 - span(p, 0.95, 1.0));
    if (tagEl) tagEl.style.opacity = String(1 - span(p, 0.92, 0.98));

    const insetOn = span(p, 0.48, 0.56) * (1 - span(p, 0.9, 0.95));
    if (inset) {
      inset.style.visibility = insetOn > 0.01 ? "visible" : "hidden";
      inset.style.setProperty("--veil", (1 - insetOn).toFixed(3));
    }
    st = { p, d, lock, insetOn };
  };

  /* the drone-camera pass runs after the main one, into a scissored corner of the same canvas */
  stage.onAfterRender = () => {
    const { d, lock, insetOn } = st;
    if (!d || !insetRect || insetOn < 0.01) return;
    fwd.set(Math.sin(d.yaw), 0, Math.cos(d.yaw));
    insetCam.position.copy(droneRig.position).addScaledVector(fwd, 0.5);
    insetCam.position.y += 0.02;
    insetCam.rotation.set(0, d.yaw + Math.PI, 0);   /* cameras look down -z; the nose is +z */
    insetCam.rotateX(-0.17);
    insetCam.updateMatrixWorld(true);

    droneRig.visible = false;                         /* the camera sits inside the drone */
    const vx = insetRect.x, vy = stage.h - insetRect.y - insetRect.h;
    renderer.setScissorTest(true);
    renderer.setViewport(vx, vy, insetRect.w, insetRect.h);
    renderer.setScissor(vx, vy, insetRect.w, insetRect.h);
    renderer.setClearColor(new THREE.Color(theme.paper), 1);
    renderer.clear(true, true, false);
    renderer.render(scene, insetCam);
    renderer.setClearColor(0x000000, 0);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, stage.w, stage.h);
    droneRig.visible = true;

    const ib = bbox(insetCam, insetRect.w, insetRect.h);
    setBox(insetBox, ib, lock, true);
    if (offsetLine) {
      const cx = insetRect.w / 2, cy = insetRect.h / 2, bx = ib.x + ib.w / 2;
      offsetLine.setAttribute("x1", cx); offsetLine.setAttribute("y1", cy);
      offsetLine.setAttribute("x2", bx); offsetLine.setAttribute("y2", cy);
    }
  };

  /* ---- scroll wiring ---- */
  if (reduced) {
    /* no scrubbing: one composed frame, text stacked normally */
    target_p = shown_p = 0.62;
    stage.still();
    return stage;
  }
  ScrollTrigger.create({
    trigger: host, start: "top top", end: "bottom bottom",
    onUpdate: (self) => { target_p = self.progress; },
    onRefresh: (self) => { target_p = self.progress; },
  });
  host.querySelectorAll(".tbeat").forEach((el) => {
    ScrollTrigger.create({
      trigger: el, start: "top 62%", end: "bottom 38%",
      toggleClass: { targets: el, className: "is-active" },
    });
  });
  return stage;
}
