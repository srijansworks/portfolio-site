/* The drumming film: one continuous scene, pinned while the visitor scrolls.

   Like the Tello scene, every frame is a pure function of scroll progress p, so scrolling back
   reverses it exactly. The text lives in the scene's own negative space and changes as the
   viewpoint does.

     0      two sticks crossed above a snare, beside the opening
     .04-.2 they part and roll, so the print turns toward the viewer
     .2-.34 first strokes; the sticks travel to the left side of the head, the frame clears
            to the upper right (the ensemble list lives there)
     .34-.5 steady alternating strokes, camera low and close
     .5-.64 slower, controlled strokes; the camera swings round to show the shape and print
     .64-.8 the sticks lift, cross, and settle on the head
     .8-1   hold, then the stage lights come up into the page

   Sound is synthesized and stays off until the visitor presses the button. */
import { THREE, createStage, track, clamp01, lerp, smooth, smoother, span, readTheme } from "./core.js";
import {
  IN, L, S_F, D_T, R, H, HEAD_Y, FLOOR_Y, studioEnv, stickTexture, buildStick, buildSnare,
  blobTexture, poolTexture, ringHead,
} from "./drumkit.js";

const TAU = Math.PI * 2;
const Y = new THREE.Vector3(0, 1, 0), X = new THREE.Vector3(1, 0, 0);
const qa = new THREE.Quaternion().setFromAxisAngle(X, -Math.PI / 2);          /* lathe axis +y -> aims -z */

/* ------------------------------------------------------------------------ */
/* the stroke                                                                */
/* ------------------------------------------------------------------------ */

/* One stroke is a wrist-driven pendulum, not a keyframed curve:
     fall    constant angular acceleration from rest at the top, so the stick speeds up into the head
     rebound the head returns a fraction E of the speed; the stick coasts up and stops (ballistic)
     lift    the wrist takes it from there, easing back up to the next apex
   Heights vary a little in a repeating accent pattern, so it plays like a rhythm, not a metronome. */
const TF = 0.30;                       /* share of the cycle spent falling */
const E = 0.52;                        /* restitution of stick on head, by speed */
const TR = E * TF;                     /* time the rebound takes to reach its peak */
const ACCENT = [1.0, 0.7, 0.86, 0.7];
const heightOf = (n) => ACCENT[((n % 4) + 4) % 4];

/* u: stroke clock (whole part = which stroke). Returns lift as a fraction of the full stroke angle. */
function strokeLift(u) {
  const n = Math.floor(u), f = u - n;
  const hc = heightOf(n), hn = heightOf(n + 1);
  if (f < TF) { const s = f / TF; return hc * (1 - s * s); }                                 /* falling */
  if (f < TF + TR) { const s = f - TF; return hc * ((2 * E / TF) * s - (s * s) / (TF * TF)); }   /* rebound, coasting */
  const t = (f - TF - TR) / (1 - TF - TR);
  return lerp(hc * E * E, hn, smooth(t));                                                    /* wrist lifts */
}
/* impacts so far, and how long ago the last one was (0..1 of a cycle) */
const hitsOf = (u) => (u < TF ? 0 : Math.floor(u - TF) + 1);
const ageOf = (u) => (u < TF ? 9 : (u - TF) - Math.floor(u - TF));
const speedAtHit = (u) => heightOf(Math.floor(u - TF));

/* ------------------------------------------------------------------------ */
/* timeline                                                                  */
/* ------------------------------------------------------------------------ */

const P_DRUM0 = 0.2, P_DRUM1 = 0.64;
const N = 16;                                       /* strokes each stick plays */

/* tempo envelope -> cumulative stroke clock, tabulated once and scaled to end on a whole stroke */
const rate = (p) => smooth((p - 0.2) / 0.1) * (1 - 0.62 * smooth((p - 0.5) / 0.1)) * (1 - smooth((p - 0.6) / 0.04));
const TAB = (() => {
  const n = 1400, t = new Float32Array(n + 1);
  for (let i = 1; i <= n; i++) t[i] = t[i - 1] + rate((i - 0.5) / n);
  const total = t[n];
  for (let i = 0; i <= n; i++) t[i] = (t[i] / total) * (N + 0.5);                          /* cyc runs 0 .. N + .5 */
  return t;
})();
const cycOf = (p) => { const x = clamp01(p) * 1400, i = Math.min(1399, Math.floor(x)); return lerp(TAB[i], TAB[i + 1], x - i); };
/* the left hand leads by half a stroke; each stops at the top when it has played N */
const clockOf = (i, cyc) => (i === 0 ? Math.min(cyc, N) : Math.min(Math.max(cyc - 0.5, 0), N));

/* where the tips land: the pair travels to the left of the head, then returns for the settle */
const centreX = track([
  [0.00, [0, 0, 0]], [0.20, [0, 0, 0]], [0.34, [-0.82, 0, 0]], [0.50, [-0.82, 0, 0]], [0.64, [-0.05, 0, 0]], [1, [0, 0, 0]],
]);
const SEP = 1.12;                                    /* tip to tip, 11 cm */
const PSI = [-0.3, 0.3];                             /* each stick's yaw: tips converge */
const ALPHA_C = -0.17;                               /* pitch at contact, tip a little below the hand */
const THETA = 0.6;                                   /* the stroke, in radians above contact */
const ROLL_UP = 1.9;                                 /* roll about its own axis that puts the print toward the camera */

const tipOf = (i, cx, out) => out.set(cx + (i === 0 ? -SEP / 2 : SEP / 2), HEAD_Y + 0.012, 0.15 - i * 0.04);
const dirOf = (a, psi, out) => out.set(-Math.cos(a) * Math.sin(psi), Math.sin(a), -Math.cos(a) * Math.cos(psi));

const qy = new THREE.Quaternion(), qp = new THREE.Quaternion(), qr = new THREE.Quaternion();
function drumQ(i, alpha, roll, out) {
  qy.setFromAxisAngle(Y, PSI[i]); qp.setFromAxisAngle(X, alpha); qr.setFromAxisAngle(Y, roll);
  return out.copy(qy).multiply(qp).multiply(qa).multiply(qr);
}

/* crossed in the air, facing the camera */
const CROSS_A = [0, 1].map((i) => {
  const ang = i === 0 ? 0.58 : Math.PI - 0.58;
  const dir = new THREE.Vector3(Math.cos(ang), Math.sin(ang), 0.0).normalize();
  const c = new THREE.Vector3(0.0, 2.75 + i * 0.16, 0.4);
  return { dir, pos: c.clone().addScaledVector(dir, S_F - L / 2), q: new THREE.Quaternion().setFromUnitVectors(Y, dir) };
});
/* crossed on the head: the first lies flat, the second rests on it with its tip on the head */
const R_S = 0.2825 * IN;
const CROSS_Z = [0, 1].map((i) => {
  const psi = i === 0 ? -0.55 : 0.55;
  const tilt = i === 0 ? 0 : -0.075;
  const dir = new THREE.Vector3(-Math.sin(psi) * Math.cos(tilt), Math.sin(tilt), -Math.cos(psi) * Math.cos(tilt)).normalize();
  const c = new THREE.Vector3(i === 0 ? 0.0 : 0.0, HEAD_Y + R_S + 0.012 + i * (2 * R_S - 0.004), 0.25);
  return { dir, pos: c.clone().addScaledVector(dir, S_F - L / 2), q: new THREE.Quaternion().setFromUnitVectors(Y, dir) };
});

const _tip = new THREE.Vector3(), _d = new THREE.Vector3(), _F = new THREE.Vector3();
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _roll = new THREE.Quaternion();

/* the fulcrum for a stick at contact, given where its tip lands */
function fulcrumAt(i, cx, out) {
  tipOf(i, cx, _tip); dirOf(ALPHA_C, PSI[i], _d);
  return out.copy(_tip).addScaledVector(_d, -D_T);
}

/* drum pose for a stick at stroke lift fraction `lift` (0 = on the head, 1 = top) */
function drumPose(i, cx, lift, time, out) {
  fulcrumAt(i, cx, out.pos);
  const a = ALPHA_C + THETA * lift;
  /* the hand rides up with the stick, and the stick sways a hair side to side as the wrist turns */
  out.pos.y += 0.1 * lift;
  const sway = Math.sin(time * 1.3 + i * 2) * 0.01;
  qy.setFromAxisAngle(Y, PSI[i] + sway); qp.setFromAxisAngle(X, a); qr.setFromAxisAngle(Y, ROLL_UP + 0.1 * Math.sin(lift * 3 + i));
  out.q.copy(qy).multiply(qp).multiply(qa).multiply(qr);
  return out;
}

function stickPose(i, p, time, out) {
  const cx = centreX(p).x;
  const cyc = cycOf(p), u = clockOf(i, cyc);

  if (p < P_DRUM0) {
    /* crossed -> parted and rolled to the ready position */
    const A = CROSS_A[i];
    const sep = smoother((p - 0.04) / 0.16);
    drumPose(i, cx, heightOf(0), time, _poseR);
    out.q.copy(A.q).slerp(_poseR.q, sep);
    out.pos.copy(A.pos).lerp(_poseR.pos, sep);
    out.pos.y += Math.sin(Math.PI * sep) * 0.4 + Math.sin(time * 0.9 + i * 1.7) * 0.022 * (1 - sep);
    _roll.setFromAxisAngle(Y, sep * TAU);                /* a full turn about its axis: the print sweeps past */
    out.q.multiply(_roll);
    return out;
  }
  if (p < P_DRUM1 + 0.004) {
    return drumPose(i, cx, strokeLift(u), time, out);
  }
  /* settle: lift, cross, lower */
  const t = smoother((p - P_DRUM1) / 0.14);
  drumPose(i, cx, heightOf(N), time, _poseR);
  const Z = CROSS_Z[i];
  _roll.setFromAxisAngle(Y, ROLL_UP + 1.1);
  _qb.copy(Z.q).multiply(_roll);
  out.q.copy(_poseR.q).slerp(_qb, t);
  out.pos.copy(_poseR.pos).lerp(Z.pos, t);
  out.pos.y += Math.sin(Math.PI * t) * 0.55 * (i === 0 ? 1 : 1.25);
  return out;
}
const _poseR = { pos: new THREE.Vector3(), q: new THREE.Quaternion() };

/* ------------------------------------------------------------------------ */
/* camera                                                                    */
/* ------------------------------------------------------------------------ */

const camPos = track([
  [0.00, [-1.4, 3.3, 12.8]],
  [0.10, [1.2, 3.4, 13.0]],
  [0.22, [3.6, 3.7, 12.6]],
  [0.34, [5.2, 3.8, 12.3]],
  [0.50, [5.0, 3.4, 11.5]],
  [0.58, [3.0, 1.7, 6.0]],
  [0.65, [-3.6, 1.6, 5.2]],
  [0.78, [-3.0, 4.8, 10.4]],
  [1.00, [-1.2, 5.4, 11.8]],
]);
const camLook = track([
  [0.00, [0.0, 1.2, 0.2]],
  [0.10, [0.0, 1.0, 0.2]],
  [0.22, [-0.2, 0.5, 0.0]],
  [0.34, [-0.8, 0.3, -0.1]],
  [0.50, [-0.8, 0.2, -0.2]],
  [0.58, [-0.5, 0.35, -0.5]],
  [0.65, [-0.1, 0.25, -0.3]],
  [0.78, [0.0, -0.3, 0.0]],
  [1.00, [0.0, -0.4, 0.0]],
]);
/* where the subject sits in frame (fractions of the frame; + is right / up) */
const shiftWide = track([
  [0.00, [0.2, -0.02, 0]], [0.16, [0.2, -0.02, 0]], [0.30, [-0.11, -0.07, 0]], [0.52, [-0.11, -0.07, 0]],
  [0.66, [0.0, -0.02, 0]], [0.82, [0.2, 0.0, 0]], [1.0, [0.2, 0.0, 0]],
]);
const shiftNarrow = track([
  [0.00, [0, 0.24, 0]], [0.5, [0, 0.27, 0]], [0.7, [0, 0.22, 0]], [1.0, [0, 0.22, 0]],
]);

/* when each piece of text is up: [in starts, fully in, begins to leave, gone] */
const BEATS = [
  [-1.0, -0.5, 0.15, 0.23],     /* opening */
  [0.25, 0.31, 0.53, 0.59],     /* ensemble */
  [0.61, 0.66, 0.77, 0.82],     /* craft */
  [0.84, 0.89, 2.0, 3.0],       /* close */
];

/* ------------------------------------------------------------------------ */
/* sound: synthesized, only after the visitor asks                           */
/* ------------------------------------------------------------------------ */

function makeAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  const ac = new AC();
  const master = ac.createGain(); master.gain.value = 0.55; master.connect(ac.destination);
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * 0.3), ac.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  let last = 0;
  return {
    ac,
    hit(pan = 0, vel = 1) {
      const t = ac.currentTime;
      if (t - last < 0.045) return;               /* never machine-gun on fast scrolls */
      last = t;
      const p = ac.createStereoPanner ? ac.createStereoPanner() : null;
      const out = p || master; if (p) { p.pan.value = pan; p.connect(master); }
      const n = ac.createBufferSource(); n.buffer = buf;
      const bp = ac.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = 2400; bp.Q.value = 0.7;
      const hp = ac.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 900;
      const ng = ac.createGain(); ng.gain.setValueAtTime(0.5 * vel, t); ng.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
      n.connect(bp); bp.connect(hp); hp.connect(ng); ng.connect(out); n.start(t); n.stop(t + 0.2);
      const o = ac.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(210, t); o.frequency.exponentialRampToValueAtTime(130, t + 0.07);
      const og = ac.createGain(); og.gain.setValueAtTime(0.55 * vel, t); og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      o.connect(og); og.connect(out); o.start(t); o.stop(t + 0.12);
    },
  };
}

/* ------------------------------------------------------------------------ */
/* mount                                                                     */
/* ------------------------------------------------------------------------ */

export async function mount(host, ctx) {
  const { ScrollTrigger, reduced } = ctx;
  const canvas = host.querySelector(".mfilm__canvas");
  const btn = host.querySelector(".mfilm__sound");
  const beats = Array.from(host.querySelectorAll(".mbeat"));
  const theme = readTheme();
  const onDark = !reduced;                           /* live: the stage is dark; the still frame sits on the paper */
  const model = (window.PORTFOLIO?.beyond?.strands || []).map((s) => s.scene).find((s) => s && s.kind === "drumsticks")?.model || "5A";

  if (document.fonts && document.fonts.load) {
    try { await Promise.race([document.fonts.load('800 66px "Archivo"'), new Promise((r) => setTimeout(r, 1200))]); } catch (e) { /* system sans */ }
  }

  const stage = createStage(canvas, { exposure: onDark ? 1.05 : 1.0, envIntensity: onDark ? 1.35 : 0.9, fov: 30, maxDpr: 2, shadow: "soft", makeEnv: studioEnv });
  const { scene, camera } = stage;

  /* light: a warm key from above-left that casts the shadows, a cool kicker behind, a little fill */
  scene.add(new THREE.HemisphereLight("#ffeedd", "#1a1210", 0.18));
  const key = new THREE.SpotLight("#ffe2bd", 6.6, 0, 0.42, 0.85, 0);
  key.position.set(-4.5, 12, 6.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 6; key.shadow.camera.far = 26;
  key.shadow.bias = -0.00012; key.shadow.normalBias = 0.012;
  key.target.position.set(0, -0.3, 0);
  scene.add(key, key.target);
  const kicker = new THREE.DirectionalLight("#cfe0ff", 1.5);
  kicker.position.set(7, 5, -9);
  scene.add(kicker);

  /* floor: catches shadows, plus a warm pool where the light lands (live only; on paper it would read as a stain) */
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ color: "#000000", opacity: onDark ? 0.7 : 0.28 }));
  floor.position.y = FLOOR_Y; floor.receiveShadow = true;
  scene.add(floor);
  if (onDark) {
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(15, 15).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: poolTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.8 }));
    pool.position.y = FLOOR_Y + 0.004; scene.add(pool);
  }

  const snare = buildSnare(stage.renderer);
  scene.add(snare.root);

  const tex = stickTexture(model, stage.renderer);
  const sticks = [buildStick(model, tex), buildStick(model, tex)];
  sticks.forEach((s) => scene.add(s));

  /* where a tip is about to land, a soft contact shadow so the stick never seems to float */
  const blobTex = blobTexture();
  const blobs = [0, 1].map(() => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.position.y = HEAD_Y + 0.003; scene.add(m); return m;
  });

  let fit = 1, narrow = false;
  stage.onResize.push((w, h) => { const a = w / h; narrow = w < 760; fit = a < 0.84 ? Math.min(1.9, 0.84 / a) : 1; });

  /* sound */
  let audio = null, soundOn = false;
  if (btn) {
    const label = btn.querySelector(".snd__t");
    btn.addEventListener("click", () => {
      soundOn = !soundOn;
      if (soundOn) {
        if (!audio) audio = makeAudio();
        if (audio) audio.ac.resume();
        else soundOn = false;
      } else if (audio) audio.ac.suspend();
      btn.setAttribute("aria-pressed", String(soundOn));
      if (label) label.textContent = soundOn ? btn.dataset.on : btn.dataset.off;
    });
  }

  let target_p = 0, shown_p = 0;
  host.__progress = () => ({ shown: shown_p, target: target_p });      /* read by the visual checks */
  const pose = { pos: new THREE.Vector3(), q: new THREE.Quaternion() };
  const prevHits = [0, 0];
  const look = new THREE.Vector3(), cam = new THREE.Vector3();
  const headHits = [{ x: 0, z: 0, amp: 0, age: 9 }, { x: 0, z: 0, amp: 0, age: 9 }];
  let headWasLive = false;

  const setBeats = (p) => {
    beats.forEach((el, k) => {
      const w = BEATS[k]; if (!w) return;
      const o = Math.min(smooth((p - w[0]) / (w[1] - w[0])), 1 - smooth((p - w[2]) / (w[3] - w[2])));
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translateY(${((1 - o) * 14).toFixed(1)}px)`;
      el.style.visibility = o > 0.01 ? "visible" : "hidden";
      el.classList.toggle("is-on", o > 0.5);
    });
  };

  stage.onFrame = (dt, time) => {
    const k = reduced ? 1 : 1 - Math.exp(-dt * 12);
    shown_p += (target_p - shown_p) * k;
    const p = shown_p;
    const cyc = cycOf(p);
    const drumming = p >= P_DRUM0 && p < P_DRUM1 + 0.004;

    for (let i = 0; i < 2; i++) {
      stickPose(i, p, time, pose);
      sticks[i].position.copy(pose.pos);
      sticks[i].quaternion.copy(pose.q);

      const u = clockOf(i, cyc);
      const hits = drumming ? hitsOf(u) : prevHits[i];
      const age = drumming ? ageOf(u) : 9;

      /* contact shadow under the tip, strongest as it comes down */
      const cx = centreX(p).x;
      tipOf(i, cx, _tip);
      const lift = drumming ? strokeLift(u) : 1;
      blobs[i].position.x = _tip.x; blobs[i].position.z = _tip.z;
      blobs[i].material.opacity = drumming ? 0.55 * (1 - smooth(lift / 0.35)) : 0;
      blobs[i].scale.setScalar(0.7 + 0.5 * smooth(lift / 0.35));

      /* the head rings after each hit */
      headHits[i].x = _tip.x; headHits[i].z = _tip.z;
      headHits[i].age = age;
      headHits[i].amp = drumming && age < 1 ? 0.016 * speedAtHit(u) * Math.exp(-age * 3.2) : 0;

      if (hits !== prevHits[i]) {
        if (audio && soundOn && stage.visible && Math.abs(hits - prevHits[i]) === 1) {
          audio.hit(i === 0 ? -0.35 : 0.35, 0.55 + 0.45 * speedAtHit(u));
        }
        prevHits[i] = hits;
      }
    }
    const live = headHits[0].amp > 0.0005 || headHits[1].amp > 0.0005;
    if (live || headWasLive) ringHead(snare.headGeo, headHits);
    headWasLive = live;

    /* camera and framing */
    look.copy(camLook(p));
    cam.copy(camPos(p));
    cam.sub(look).multiplyScalar(fit).add(look);
    camera.position.copy(cam);
    camera.lookAt(look);
    camera.position.y += Math.sin(time * 0.5) * 0.015;
    const sh = (narrow ? shiftNarrow : shiftWide)(p);
    if (Math.abs(stage.shift.x - sh.x) > 1e-4 || Math.abs(stage.shift.y - sh.y) > 1e-4) {
      stage.shift.x = sh.x; stage.shift.y = sh.y; stage.applyView();
    }
    setBeats(p);
    /* the stage lights come up into the page at the very end */
    canvas.style.opacity = String(1 - span(p, 0.95, 1.0) * 0.0);
  };

  if (reduced) {
    /* no scrubbing: the settled composition, once. Beats read as ordinary stacked text. */
    target_p = shown_p = 0.9;
    beats.forEach((el) => { el.style.opacity = ""; el.style.transform = ""; el.style.visibility = ""; });
    stage.onFrame = (dt, time) => { shown_p = 0.9; const p = 0.9; for (let i = 0; i < 2; i++) { stickPose(i, p, 0, pose); sticks[i].position.copy(pose.pos); sticks[i].quaternion.copy(pose.q); blobs[i].material.opacity = 0; }
      look.copy(camLook(p)); cam.copy(camPos(p)); cam.sub(look).multiplyScalar(fit).add(look); camera.position.copy(cam); camera.lookAt(look);
      stage.shift.x = 0.0; stage.shift.y = narrow ? 0.0 : -0.02; stage.applyView(); };
    stage.still();
    return stage;
  }

  ScrollTrigger.create({
    trigger: host, start: "top top", end: "bottom bottom",
    invalidateOnRefresh: true,
    onUpdate: (self) => { target_p = self.progress; },
    onRefresh: (self) => { target_p = self.progress; },
  });
  return stage;
}

/* test hook: sample the choreography without scrolling */
export const _seq = { stickPose, strokeLift, cycOf, clockOf, camPos, camLook, centreX, N };
