/* Scene page engine.
   One smoothed scroll value (p) drives the 3D glasses, every line of text, the panels and the HUD.
   No libraries. */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { a = a === undefined ? 0 : a; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var sm = function (t) { t = clamp(t); return t * t * (3 - 2 * t); };
  var eo = function (t) { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
  var eio = function (t) { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  window.scrollTo(0, 0);

  var PER = 0.9;    /* viewport heights of scrolling per unit of p */
  var END = 15.2;   /* last value of p */

  /* where the lens flythrough happens */
  var FLASH = { a: 13.7, peak: 14.15, b: 14.6 };

  var rig = $('#rig'), glasses = $('#glasses'), gloss = $('#gloss'), glow = $('#glow'), floorEl = $('#floor');
  var veil = $('#veil'), flash = $('#flash'), waves = $$('#waves i');
  var rings = [$('.r1'), $('.r2'), $('.r3')];
  var scroller = $('#scroller'), bar = $('#bar'), hint = $('#hint'), cNow = $('#cNow'), dotsEl = $('#dots');

  scroller.style.height = ((END * PER + 1) * 100) + 'vh';

  /* ---------- the glasses: a few spaced copies give depth when it turns ---------- */

  var LAYERS = 7, STEP = 4.5;
  function addLayer(src, z, scale, opacity, cls) {
    var im = new Image();
    im.src = src;
    im.alt = '';
    im.draggable = false;
    im.className = 'layer ' + (cls || '');
    im.style.transform = 'translateZ(calc(var(--gap) * ' + z + ')) scale(' + scale + ')';
    if (opacity < 1) im.style.opacity = opacity;
    glasses.insertBefore(im, gloss);
  }
  var deep = LAYERS * STEP + 4;
  var BASE = 'assets/scene/';
  addLayer(BASE + 'rayban-rim.png', -(deep + 3), 1.05, 0.22, 'rim');
  addLayer(BASE + 'rayban-rim.png', -(deep + 2), 1.03, 0.4, 'rim');
  addLayer(BASE + 'rayban-rim.png', -(deep + 1), 1.012, 0.9, 'rim');
  for (var i = 0; i < LAYERS; i++) addLayer(BASE + 'rayban-body.png', -(deep - i * STEP), 1, 1, 'body');
  var front = new Image();
  front.src = BASE + 'rayban.png';
  front.alt = 'Meta Ray-Ban smart glasses';
  front.draggable = false;
  front.className = 'front';
  front.style.transform = 'translateZ(0)';
  glasses.insertBefore(front, gloss);

  /* glasses pose at each scroll position. x, y in vw / vh, z in px, rotations in degrees */
  var KF = [
    { p: 0,    x: 20, y: 1,   z: 0,    rx: 8,  ry: -22, rz: -5, s: 0.92 },
    { p: 0.9,  x: 24, y: -3,  z: -60,  rx: 12, ry: -44, rz: -7, s: 0.8 },
    { p: 1.45, x: 22, y: -8,  z: 0,    rx: 9,  ry: -30, rz: -3, s: 0.8 },
    { p: 2.05, x: 22, y: -8,  z: 40,   rx: -5, ry: 12,  rz: 3,  s: 0.82 },
    { p: 2.65, x: 22, y: -8,  z: 20,   rx: 5,  ry: -14, rz: -2, s: 0.8 },
    { p: 3.5,  x: 34, y: -31, z: -150, rx: 10, ry: -34, rz: -6, s: 0.42 },
    { p: 4.6,  x: 34, y: -31, z: -150, rx: 12, ry: -22, rz: -4, s: 0.42 },
    { p: 5.6,  x: 34, y: -31, z: -150, rx: 8,  ry: -38, rz: -5, s: 0.42 },
    { p: 6.4,  x: 34, y: -31, z: -150, rx: 12, ry: -20, rz: -3, s: 0.42 },
    { p: 7.1,  x: 34, y: -31, z: -150, rx: 8,  ry: -36, rz: -6, s: 0.42 },
    { p: 8.0,  x: 34, y: -31, z: -150, rx: 10, ry: -26, rz: -4, s: 0.42 },
    { p: 9.6,  x: 34, y: -31, z: -150, rx: 10, ry: -30, rz: -5, s: 0.42 },
    { p: 12.9, x: 34, y: -31, z: -150, rx: 10, ry: -28, rz: -5, s: 0.42 },
    { p: 13.5, x: 6,  y: 0,   z: 0,    rx: 4,  ry: -12, rz: -2, s: 1.15 },
    { p: 14.1, x: 0,  y: 0,   z: 520,  rx: 0,  ry: 0,   rz: 0,  s: 3.0 },
    { p: 14.16, x: 30, y: 2,  z: -260, rx: 8,  ry: -24, rz: -4, s: 0.7 },
    { p: 15.2, x: 29, y: 2,   z: 0,    rx: 8,  ry: -22, rz: -4, s: 0.8 }
  ];
  var KEYS = ['x', 'y', 'z', 'rx', 'ry', 'rz', 's'];

  function pose(p) {
    var n = KF.length, a = KF[0], b = KF[0], t = 0, k;
    if (p <= KF[0].p) { a = b = KF[0]; }
    else if (p >= KF[n - 1].p) { a = b = KF[n - 1]; }
    else {
      for (k = 0; k < n - 1; k++) {
        if (p >= KF[k].p && p <= KF[k + 1].p) { a = KF[k]; b = KF[k + 1]; t = sm((p - a.p) / (b.p - a.p)); break; }
      }
    }
    var o = {};
    for (k = 0; k < KEYS.length; k++) o[KEYS[k]] = lerp(a[KEYS[k]], b[KEYS[k]], t);
    return o;
  }

  /* ---------- text: split into words and letters, then animate each piece ---------- */

  function split(el, mode) {
    var out = [];
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
        if (ch.nodeType === 3) {
          var frag = document.createDocumentFragment();
          if (mode === 'chars') {
            Array.from(ch.textContent).forEach(function (c) {
              if (/\s/.test(c)) { frag.appendChild(document.createTextNode(c)); return; }
              var s = document.createElement('span'); s.className = 'u'; s.textContent = c; frag.appendChild(s); out.push(s);
            });
          } else {
            ch.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var s = document.createElement('span'); s.className = 'u'; s.textContent = part; frag.appendChild(s); out.push(s);
            });
          }
          ch.parentNode.replaceChild(frag, ch);
        } else if (ch.nodeType === 1) { walk(ch); }
      });
    })(el);
    return out;
  }

  var PARAMS = {
    char:  { y: 130, rx: -80, z: -260, b: 14 },
    word:  { y: 42,  rx: -60, z: -90,  b: 10 },
    block: { y: 44,  rx: -25, z: -60,  b: 8 },
    card:  { y: 110, rx: -38, z: -220, b: 6 },
    step:  { y: 30,  rx: -20, z: -40,  b: 6 }
  };

  var slides = $$('.slide').map(function (el, idx) {
    var units = [];
    $$('[data-u]', el).forEach(function (node) {
      var mode = node.getAttribute('data-u');
      if (mode === 'words' || mode === 'chars') {
        split(node, mode).forEach(function (s) { units.push({ el: s, kind: mode === 'chars' ? 'char' : 'word', last: '' }); });
      } else {
        units.push({ el: node, kind: mode, act: parseFloat(node.getAttribute('data-act')), last: '', tx: 0, ty: 0, ttx: 0, tty: 0 });
      }
    });
    var tin = el.getAttribute('data-in').split(',').map(parseFloat);
    var tout = el.getAttribute('data-out').split(',').map(parseFloat);
    var stepUnits = units.filter(function (u) { return u.kind === 'step'; });
    return {
      el: el, idx: idx, units: units, vis: false, in: tin, out: tout, v: 0,
      steps: stepUnits,
      strength: stepUnits.map(function () { return 0; }),
      dock: $('.dock', el),
      rail: $('.rail', el),
      stepsEl: $('.steps', el)
    };
  });

  /* card tilt follows the mouse */
  slides.forEach(function (s) {
    s.units.forEach(function (u) {
      if (u.kind !== 'card') return;
      u.el.addEventListener('mousemove', function (e) {
        var r = u.el.getBoundingClientRect();
        u.tty = ((e.clientX - r.left) / r.width - 0.5) * 12;
        u.ttx = -((e.clientY - r.top) / r.height - 0.5) * 10;
      });
      u.el.addEventListener('mouseleave', function () { u.ttx = 0; u.tty = 0; });
    });
  });

  function paint(u, r, o, extra, factor) {
    var P = PARAMS[u.kind] || PARAMS.block;
    var v = r * (1 - o);
    if (factor !== undefined) v *= factor;
    var er = eo(r);
    var y = (1 - er) * P.y - o * P.y * 0.5;
    var z = (1 - er) * P.z - o * 40;
    var rx = (1 - er) * P.rx + o * 16;
    var b = (1 - er) * P.b + o * 6;
    var key = v.toFixed(3) + y.toFixed(1) + z.toFixed(0) + rx.toFixed(1) + b.toFixed(1) + (extra || '');
    if (key === u.last) return;
    u.last = key;
    var st = u.el.style;
    st.opacity = v.toFixed(3);
    st.transform = 'translate3d(0,' + y.toFixed(1) + 'px,' + z.toFixed(0) + 'px) rotateX(' + rx.toFixed(1) + 'deg)' + (extra || '');
    st.filter = b > 0.3 ? 'blur(' + b.toFixed(1) + 'px)' : 'none';
  }

  var intro = 0;

  function updateSlide(s, p, dt) {
    var e = s.idx === 0 ? intro : clamp((p - s.in[0]) / (s.in[1] - s.in[0]));
    var x = clamp((p - s.out[0]) / (s.out[1] - s.out[0]));
    var vis = e > 0 && x < 1;
    if (vis !== s.vis) { s.el.style.visibility = vis ? 'visible' : 'hidden'; s.vis = vis; }
    s.v = vis ? eo(e / 0.6) * (1 - eio(x)) : 0;
    if (!vis) return;

    var n = s.units.length, step = Math.min(0.045, 0.5 / n), k, u;
    for (k = 0; k < n; k++) {
      u = s.units[k];
      var r = eo((e - k * step) / 0.45);
      var o = eio((x - k * step * 0.6) / 0.5);
      if (u.kind === 'step') {
        var j = s.steps.indexOf(u);
        var a0 = u.act, a1 = j < s.steps.length - 1 ? s.steps[j + 1].act : 99;
        var str = clamp(sm((p - a0) / 0.3) - 0.72 * sm((p - a1) / 0.3));
        s.strength[j] = str;
        paint(u, r, o, ' translateX(' + (str * 10).toFixed(1) + 'px)', 0.26 + 0.74 * str);
      } else if (u.kind === 'card') {
        u.tx += (u.ttx - u.tx) * Math.min(1, dt * 9);
        u.ty += (u.tty - u.ty) * Math.min(1, dt * 9);
        paint(u, r, o, ' rotateX(' + u.tx.toFixed(2) + 'deg) rotateY(' + u.ty.toFixed(2) + 'deg)');
      } else {
        paint(u, r, o);
      }
    }
  }

  /* ---------- panels and rails on the step slides ---------- */

  slides.forEach(function (s) {
    s.panels = s.dock ? $$('.panel', s.dock) : [];
    s.railFill = s.rail ? $('b', s.rail) : null;
  });

  function layoutRails() {
    slides.forEach(function (s) {
      if (!s.rail || !s.stepsEl) return;
      var r = s.stepsEl.getBoundingClientRect();
      s.rail.style.top = r.top + 'px';
      s.rail.style.height = r.height + 'px';
    });
  }

  function updatePanels(p) {
    slides.forEach(function (s) {
      if (!s.steps.length) return;
      var sv = s.v, n = s.steps.length, j;
      for (j = 0; j < s.panels.length; j++) {
        var a0 = s.steps[j].act, a1 = j < n - 1 ? s.steps[j + 1].act : 99;
        var v = clamp(sm((p - a0 - 0.05) / 0.3) - sm((p - a1 + 0.02) / 0.22)) * sv;
        var st = s.panels[j].style;
        st.opacity = v.toFixed(3);
        st.transform = 'translate3d(0,' + ((1 - v) * 26).toFixed(1) + 'px,' + (-(1 - v) * 120).toFixed(0) + 'px) rotateX(' + ((1 - v) * -18).toFixed(1) + 'deg)';
        st.visibility = v > 0.01 ? 'visible' : 'hidden';
      }
      if (s.railFill) {
        var first = s.steps[0].act, last = s.steps[n - 1].act + 0.35;
        s.railFill.style.height = (clamp((p - first) / (last - first)) * 100).toFixed(1) + '%';
        s.rail.style.opacity = sv.toFixed(3);
      }
    });
  }

  /* ---------- HUD ---------- */

  var STARTS = [-99, 0.9, 3.6, 5.5, 8.9, 10.9, 13.9];
  var DOT_STOPS = [0, 1.45, 4.5, 6.4, 10.05, 11.9, 14.7];
  var KEY_STOPS = [0, 1.45, 2.05, 2.65, 4.5, 6.25, 6.75, 7.25, 7.75, 10.05, 11.9, 14.7];
  $('#cAll').textContent = '0' + STARTS.length;
  var dots = DOT_STOPS.map(function (stop, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Go to part ' + (i + 1));
    b.addEventListener('click', function () { goTo(stop); });
    dotsEl.appendChild(b);
    return b;
  });
  var curIdx = -1;

  function goTo(p) { window.scrollTo({ top: p * window.innerHeight * PER, behavior: 'auto' }); }

  window.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1;
    else if (e.key === 'f' || e.key === 'F') { if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen(); return; }
    else if (e.key === 'Home') { e.preventDefault(); goTo(0); return; }
    else if (e.key === 'End') { e.preventDefault(); goTo(END); return; }
    if (!dir) return;
    e.preventDefault();
    var cp = window.scrollY / (window.innerHeight * PER), tgt = null, i;
    if (dir > 0) { for (i = 0; i < KEY_STOPS.length; i++) if (KEY_STOPS[i] > cp + 0.12) { tgt = KEY_STOPS[i]; break; } if (tgt === null) tgt = KEY_STOPS[KEY_STOPS.length - 1]; }
    else { for (i = KEY_STOPS.length - 1; i >= 0; i--) if (KEY_STOPS[i] < cp - 0.12) { tgt = KEY_STOPS[i]; break; } if (tgt === null) tgt = 0; }
    goTo(tgt);
  });

  /* ---------- background particles ---------- */

  var cv = $('#fx'), ctx = cv.getContext('2d'), W = 0, H = 0, DPR = 1, pts = [];

  function sizeCanvas() {
    DPR = Math.min(2, window.devicePixelRatio || 1);
    W = cv.width = Math.round(window.innerWidth * DPR);
    H = cv.height = Math.round(window.innerHeight * DPR);
    var n = Math.min(110, Math.round(window.innerWidth * window.innerHeight / 15000));
    pts = [];
    for (var i = 0; i < n; i++) pts.push({ x: Math.random(), y: Math.random(), z: 0.25 + Math.random() * 0.75, vx: (Math.random() - 0.5) * 0.012, vy: (Math.random() - 0.5) * 0.012, b: Math.random() < 0.3 });
  }

  function drawParticles(t, cur) {
    ctx.clearRect(0, 0, W, H);
    var i, j, a, n = pts.length, xs = new Array(n), ys = new Array(n);
    for (i = 0; i < n; i++) {
      a = pts[i];
      xs[i] = (((a.x + a.vx * t) % 1 + 1) % 1) * W;
      ys[i] = (((a.y + a.vy * t - cur * 0.00018 * a.z) % 1 + 1) % 1) * H;
    }
    ctx.lineWidth = 1 * DPR;
    var lim = 120 * DPR;
    for (i = 0; i < n; i++) {
      for (j = i + 1; j < n; j++) {
        var dx = xs[i] - xs[j], dy = ys[i] - ys[j], d = dx * dx + dy * dy;
        if (d < lim * lim) {
          ctx.strokeStyle = 'rgba(42,85,255,' + (0.22 * (1 - Math.sqrt(d) / lim)).toFixed(3) + ')';
          ctx.beginPath(); ctx.moveTo(xs[i], ys[i]); ctx.lineTo(xs[j], ys[j]); ctx.stroke();
        }
      }
    }
    for (i = 0; i < n; i++) {
      a = pts[i];
      ctx.fillStyle = a.b ? 'rgba(80,120,255,' + (0.35 + a.z * 0.5).toFixed(2) + ')' : 'rgba(244,247,255,' + (0.12 + a.z * 0.4).toFixed(2) + ')';
      ctx.beginPath(); ctx.arc(xs[i], ys[i], (0.8 + a.z * 1.6) * DPR, 0, 6.2832); ctx.fill();
    }
  }

  /* ---------- main loop ---------- */

  var cur = window.scrollY, last = performance.now(), t = 0;
  var mx = 0, my = 0, mxT = 0, myT = 0, gx = 0, gy = 0, started = false, t0 = 0;
  var maxScroll = 1;

  window.addEventListener('mousemove', function (e) {
    mxT = (e.clientX / window.innerWidth - 0.5) * 2;
    myT = (e.clientY / window.innerHeight - 0.5) * 2;
  }, { passive: true });

  function resize() {
    sizeCanvas();
    maxScroll = Math.max(1, END * PER * window.innerHeight);
    layoutRails();
  }
  window.addEventListener('resize', resize);

  function frame(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now; t += dt;

    var target = window.scrollY;
    cur += (target - cur) * (reduce ? 1 : 1 - Math.exp(-dt * 6.5));
    if (Math.abs(target - cur) < 0.05) cur = target;
    var vh = window.innerHeight, vw = window.innerWidth;
    var p = cur / (vh * PER);

    if (started) intro = clamp((now - t0) / 2600);

    mx += (mxT - mx) * Math.min(1, dt * 3);
    my += (myT - my) * Math.min(1, dt * 3);

    /* glasses */
    var ps = pose(p);
    if (vw < 820) { ps.x *= 0.12; ps.y = ps.y * 0.55 - 26; ps.s *= 0.9; }
    var bob = reduce ? 0 : Math.sin(t * 1.3) * 0.8;
    var sway = reduce ? 0 : Math.sin(t * 0.7) * 2;
    rig.style.transform =
      'translate3d(' + (ps.x + mx * 1.2).toFixed(2) + 'vw,' + (ps.y + bob).toFixed(2) + 'vh,' + ps.z.toFixed(0) + 'px) ' +
      'rotateX(' + (ps.rx - my * 5 + (reduce ? 0 : Math.sin(t * 0.9) * 1.5)).toFixed(2) + 'deg) ' +
      'rotateY(' + (ps.ry + mx * 8 + sway).toFixed(2) + 'deg) ' +
      'rotateZ(' + ps.rz.toFixed(2) + 'deg) scale(' + ps.s.toFixed(3) + ')';

    gloss.style.backgroundPosition = (160 - ((cur * 0.07 + t * 16) % 320)).toFixed(1) + '% 0';

    var spin = reduce ? 0 : t;
    rings[0].style.transform = 'rotateX(74deg) rotateZ(' + (spin * 24).toFixed(1) + 'deg)';
    rings[1].style.transform = 'translateZ(-30px) rotateX(74deg) rotateZ(' + (-spin * 16).toFixed(1) + 'deg)';
    rings[2].style.transform = 'translateZ(-60px) rotateX(64deg) rotateY(16deg) rotateZ(' + (spin * 10).toFixed(1) + 'deg)';

    /* light follows the glasses */
    var tgx = vw / 2 + (ps.x / 100) * vw, tgy = vh / 2 + (ps.y / 100) * vh;
    if (!gx) { gx = tgx; gy = tgy; }
    gx += (tgx - gx) * Math.min(1, dt * 3); gy += (tgy - gy) * Math.min(1, dt * 3);
    glow.style.transform = 'translate3d(' + gx.toFixed(0) + 'px,' + gy.toFixed(0) + 'px,0)';
    floorEl.style.backgroundPosition = '0px ' + (cur * 0.35 + (reduce ? 0 : t * 18)).toFixed(1) + 'px';

    /* the trip through the lens */
    var fl = p < FLASH.a ? 0 : p < FLASH.peak ? sm((p - FLASH.a) / (FLASH.peak - FLASH.a)) : p < FLASH.b ? 1 - sm((p - FLASH.peak) / (FLASH.b - FLASH.peak)) : 0;
    flash.style.opacity = (fl * 0.95).toFixed(3);
    veil.style.opacity = sm((p - (FLASH.peak - 0.15)) / 0.8).toFixed(3);
    for (var w = 0; w < 3; w++) {
      var q = clamp((p - (FLASH.a - 0.35 + w * 0.18)) / 0.9);
      waves[w].style.opacity = (Math.sin(Math.PI * q) * 0.9).toFixed(3);
      waves[w].style.transform = 'scale(' + (0.2 + q * 3.4).toFixed(3) + ')';
    }

    /* text and panels */
    for (var s = 0; s < slides.length; s++) updateSlide(slides[s], p, dt);
    updatePanels(p);

    /* HUD */
    var idx = 0;
    for (var h = 0; h < STARTS.length; h++) if (p >= STARTS[h]) idx = h;
    if (idx !== curIdx) {
      curIdx = idx;
      cNow.textContent = '0' + (idx + 1);
      dots.forEach(function (d, i) { d.classList.toggle('on', i === idx); });
    }
    bar.style.width = (clamp(cur / maxScroll) * 100).toFixed(2) + '%';
    hint.style.opacity = (started && intro > 0.8 ? 1 - clamp(p / 0.25) : 0).toFixed(2);

    drawParticles(t, cur);
    requestAnimationFrame(frame);
  }

  resize();
  requestAnimationFrame(frame);

  var ready = [document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve(),
    front.decode ? front.decode().catch(function () {}) : Promise.resolve()];
  Promise.all(ready).then(function () {
    layoutRails();
    setTimeout(function () { started = true; t0 = performance.now(); }, 250);
  });
  setTimeout(function () { if (!started) { started = true; t0 = performance.now(); } }, 2500);

  /* handy for testing: window.__scene.jump(6.4) */
  window.__scene = { jump: function (p) { window.scrollTo(0, p * window.innerHeight * PER); cur = window.scrollY; }, intro: function () { return intro; } };
})();
