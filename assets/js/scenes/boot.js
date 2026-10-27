/* Starts the 3D scenes. Everything here is progressive enhancement:
   if WebGL, import maps or the scene code fail, the page falls back to the same
   content laid out as ordinary sections. Libraries are local (assets/vendor),
   and load only when a scene is about to be seen. */
import { webglAvailable } from "./core.js";

const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

const loadScript = (src) => new Promise((res, rej) => {
  const s = document.createElement("script");
  s.src = src; s.async = true;
  s.onload = res; s.onerror = () => rej(new Error("failed to load " + src));
  document.head.appendChild(s);
});

let gsapReady = null;
function loadGsap() {
  if (!gsapReady) {
    gsapReady = loadScript("assets/vendor/gsap/gsap.min.js")
      .then(() => loadScript("assets/vendor/gsap/ScrollTrigger.min.js"))
      .then(() => { window.gsap.registerPlugin(window.ScrollTrigger); return { gsap: window.gsap, ScrollTrigger: window.ScrollTrigger }; });
  }
  return gsapReady;
}

const scenes = {
  tello: () => import("./tello.js"),
  drumsticks: () => import("./drumsticks.js"),
  belt: () => import("./belt.js"),
};

function fallback(host, why) {
  host.classList.remove("is-live", "is-still");
  host.classList.add("is-static");
  if (why) console.info("[scene] static layout:", why);
  if (window.ScrollTrigger) window.ScrollTrigger.refresh();
}

async function start(host) {
  const kind = host.dataset.scene;
  if (!scenes[kind]) return fallback(host, "unknown scene " + kind);
  try {
    const [{ gsap, ScrollTrigger }, mod] = await Promise.all([loadGsap(), scenes[kind]()]);
    const ctx = { gsap, ScrollTrigger, reduced };
    const stage = await mod.mount(host, ctx);
    host.classList.add("is-ready");
    /* layout changes once the canvas is live; measure again */
    ScrollTrigger.refresh();
    window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    return stage;
  } catch (err) {
    console.warn("[scene] failed:", err);
    fallback(host, "error");
  }
}

function run() {
  const hosts = Array.from(document.querySelectorAll("[data-scene]"));
  if (!hosts.length) return;

  if (!webglAvailable()) { hosts.forEach((h) => fallback(h, "no WebGL2")); return; }

  hosts.forEach((h) => { if (reduced) h.classList.replace("is-live", "is-still"); });

  /* start each scene when it is within about a screen of view */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      start(e.target);
    });
  }, { rootMargin: "100% 0px 100% 0px" });
  hosts.forEach((h) => io.observe(h));
}

if (window.PORTFOLIO_RENDERED) run();
else document.addEventListener("portfolio:rendered", run, { once: true });
