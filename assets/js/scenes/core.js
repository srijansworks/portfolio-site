/* Shared plumbing for the two 3D scenes.
   - one renderer per canvas, transparent so the paper shows through
   - colours read from the site's CSS tokens, so dark mode just works
   - renders only while its stage is on screen
   - scroll progress comes in from outside (GSAP ScrollTrigger), scenes are
     pure functions of that number, which is what makes scrolling back reverse them */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export { THREE };

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };
export const smoother = (t) => { t = clamp01(t); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp01(t), 3);
export const easeInQuad = (t) => { t = clamp01(t); return t * t; };
/* 0 before a, 1 after b, smooth between */
export const span = (p, a, b) => smooth((p - a) / (b - a));

/* ---- keyframe splines: Hermite through (time, value) pairs --------------- */
export function track(keys) {
  /* keys: [[t, [x,y,z]], ...] sorted by t. Returns f(t) -> THREE.Vector3 */
  const n = keys.length;
  const T = keys.map((k) => k[0]);
  const V = keys.map((k) => new THREE.Vector3().fromArray(k[1]));
  const M = V.map((v, i) => {
    const a = V[Math.max(0, i - 1)], b = V[Math.min(n - 1, i + 1)];
    const ta = T[Math.max(0, i - 1)], tb = T[Math.min(n - 1, i + 1)];
    return b.clone().sub(a).divideScalar(Math.max(1e-6, tb - ta)); /* velocity per unit t */
  });
  const out = new THREE.Vector3();
  return (t) => {
    if (t <= T[0]) return out.copy(V[0]);
    if (t >= T[n - 1]) return out.copy(V[n - 1]);
    let i = 0;
    while (i < n - 2 && t > T[i + 1]) i++;
    const h = T[i + 1] - T[i], s = (t - T[i]) / h;
    const s2 = s * s, s3 = s2 * s;
    const h00 = 2 * s3 - 3 * s2 + 1, h10 = s3 - 2 * s2 + s, h01 = -2 * s3 + 3 * s2, h11 = s3 - s2;
    return out.set(0, 0, 0)
      .addScaledVector(V[i], h00).addScaledVector(M[i], h10 * h)
      .addScaledVector(V[i + 1], h01).addScaledVector(M[i + 1], h11 * h);
  };
}

/* ---- theme: read CSS tokens so the scene matches light and dark ---------- */
export function readTheme() {
  const cs = getComputedStyle(document.documentElement);
  const get = (n, d) => (cs.getPropertyValue(n).trim() || d);
  return {
    paper: get("--paper", "#E9EBE4"),
    ink: get("--ink", "#141B16"),
    inkSoft: get("--ink-soft", "#545E55"),
    rule: get("--rule", "#C7CCC0"),
    signal: get("--signal", "#B4C800"),
    dark: window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches,
  };
}

export function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && c.getContext("webgl2"));
  } catch (e) { return false; }
}

/* ---- the stage ------------------------------------------------------------ */
export function createStage(canvas, opts = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas, antialias: true, alpha: true, powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = opts.exposure ?? 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = opts.shadow === "soft" ? THREE.PCFShadowMap : THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = opts.makeEnv ? opts.makeEnv(pmrem) : pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = opts.envIntensity ?? 0.8;

  const camera = new THREE.PerspectiveCamera(opts.fov ?? 32, 1, 0.1, 200);

  const stage = {
    renderer, scene, camera, canvas,
    w: 1, h: 1,
    /* where the subject sits in frame: fractions of width/height, +x right, +y up */
    shift: { x: 0, y: 0 },
    onResize: [],
    onFrame: null,
    onAfterRender: null,
    visible: false,
    running: false,
    time: 0, last: 0,
    dispose() {
      stop();
      ro.disconnect(); io.disconnect();
      envTex.dispose(); pmrem.dispose(); renderer.dispose();
    },
    applyView() {
      const { w, h, shift } = stage;
      if (shift.x || shift.y) camera.setViewOffset(w, h, -shift.x * w, shift.y * h, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
    resize() {
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width)), h = Math.max(1, Math.round(rect.height));
      stage.w = w; stage.h = h;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 2));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      stage.applyView();
      stage.onResize.forEach((f) => f(w, h));
      stage.draw();
    },
    draw() {
      const now = performance.now() / 1000;
      const dt = Math.min(0.05, stage.last ? now - stage.last : 0.016);
      stage.last = now;
      stage.time += dt;
      if (stage.onFrame) stage.onFrame(dt, stage.time);
      renderer.render(scene, camera);
      if (stage.onAfterRender) stage.onAfterRender();
    },
  };

  let raf = 0;
  const loop = () => { raf = requestAnimationFrame(loop); stage.draw(); };
  function start() { if (stage.running || !stage.visible || document.hidden) return; stage.running = true; stage.last = 0; raf = requestAnimationFrame(loop); }
  function stop() { stage.running = false; cancelAnimationFrame(raf); }

  const ro = new ResizeObserver(() => stage.resize());
  ro.observe(canvas);
  const io = new IntersectionObserver((es) => {
    stage.visible = es[0].isIntersecting;
    stage.visible ? start() : stop();
  }, { rootMargin: "80px 0px 80px 0px" });
  io.observe(canvas);
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  /* a static frame only, for reduced motion */
  stage.still = () => { stop(); stage.draw(); io.disconnect(); };

  /* context loss: stop quietly, the page still reads without the canvas */
  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); stop(); stage.lost = true; });
  canvas.addEventListener("webglcontextrestored", () => { stage.lost = false; start(); });

  stage.resize();
  return stage;
}

/* ---- a soft ground: fading grid + shadow catcher ------------------------- */
export function makeGround(theme, { size = 40, cell = 1, shadowOpacity = 0.22, y = 0 } = {}) {
  const g = new THREE.Group();
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.ShadowMaterial({ color: new THREE.Color(theme.dark ? "#000000" : "#1a241c"), opacity: theme.dark ? shadowOpacity * 1.4 : shadowOpacity })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.receiveShadow = true;
  g.add(shadow);

  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(theme.dark ? theme.inkSoft : theme.ink) },
      uAlpha: { value: theme.dark ? 0.22 : 0.16 },
      uCell: { value: cell },
      uFade: { value: size * 0.34 },
      uCenter: { value: new THREE.Vector2(0, 0) },
    },
    vertexShader: "varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }",
    fragmentShader: `
      varying vec3 vW; uniform vec3 uColor; uniform float uAlpha, uCell, uFade; uniform vec2 uCenter;
      void main(){
        vec2 c = vW.xz / uCell;
        vec2 g = abs(fract(c - 0.5) - 0.5) / fwidth(c);
        float line = 1.0 - min(min(g.x, g.y), 1.0);
        float d = distance(vW.xz, uCenter) / uFade;
        float a = line * uAlpha * (1.0 - smoothstep(0.25, 1.0, d));
        if (a < 0.002) discard;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(size, size), mat);
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = 0.002;
  g.add(grid);
  g.position.y = y;
  g.userData = { grid: mat, shadow: shadow.material };
  return g;
}
