/* Adapted directly from the user's Stale Tip Search demo. Playback and boat tracks are real demo data; no invented motion. */
(() => { const D = window.MARITIME_PREVIEW_DATA; if(!D)return;
document.querySelectorAll('[data-maritime-preview]').forEach(canvas=>{
 const A=D.assumptions, END_S=A.endurance_min*60, DASHES=[[],[7,4],[2,3]];
 const KNOT_KMS=.514444/1000; let t=0;
 const scen=()=>D.scenario, boats=()=>D.boats, nB=()=>D.boats.offset_km.length;
 const isReal=()=>false, arrival=()=>D.age_min*60, total=()=>arrival()+END_S;
 const vmin=()=>scen().truth_kn[0]*KNOT_KMS,vmax=()=>scen().truth_kn[1]*KNOT_KMS;
 const S=()=>['greedy_shared'], pb=()=>({runs:{greedy_shared:D.run}});
 const META={greedy_shared:{c:'--s3'}};
 const css=name=>getComputedStyle(canvas).getPropertyValue(name).trim();
 const readout=canvas.parentElement.querySelector('[data-map-readout]');
 const panels=[{key:'greedy_shared',canvas,num:{textContent:''},of:{textContent:''},bar:{style:{}}}];
  function boatAt(i, tt) {
    const b = boats();
    if (b.track_km) return pointAt(b.track_km[i], tt, b.dt_s);   // real boat: follow its recorded path
    const o = b.offset_km[i], v = b.velocity_kms[i];
    return [o[0] + v[0] * tt, o[1] + v[1] * tt];
  }
  function pointAt(path, s, every = D.path_every_s) {
    const f = Math.max(0, Math.min(s / every, path.length - 1));
    const i = Math.floor(f), k = f - i, a = path[i], b = path[Math.min(i + 1, path.length - 1)];
    return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k];
  }
  function viewRadius(tt) {
    let r = vmax() * tt + 0.4;
    if (isReal()) for (let i = 0; i < nB(); i++) { const p = boatAt(i, tt); r = Math.max(r, Math.hypot(p[0], p[1]) + 0.4); }
    const s = tt - arrival();
    if (s > 0) for (const key of S()) for (const path of pb().runs[key].paths) {
      const n = Math.min(Math.floor(s / D.path_every_s), path.length - 1);
      for (let i = 0; i <= n; i++) r = Math.max(r, Math.hypot(path[i][0], path[i][1]));
    }
    return Math.max(4, r * 1.12);
  }
  function ringStep(R) {
    for (const s of [1, 2, 5, 10, 20, 50]) if (R / s <= 4.5) return s;
    return 100;
  }

  // ---- draw
  function draw() {
    const tt = t, s = tt - arrival(), R = viewRadius(tt);
    const col = { sea: css("--sea"), grid: css("--grid"), boat: css("--boat"), ink: css("--ink"),
                  muted: css("--muted"), panel: css("--panel"), mono: css("--mono") };
    const nBoats = nB();
    const pos = Array.from({ length: nBoats }, (_, i) => boatAt(i, tt));

    for (const p of panels) {
      const run = pb().runs[p.key], c = css(META[p.key].c);
      const cv = p.canvas, dpr = window.devicePixelRatio || 1;
      const w = cv.clientWidth, h = cv.clientHeight;
      if (!w) continue;
      if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
      const ctx = cv.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cx = w / 2, cy = h / 2, k = (Math.min(w, h) / 2 - 6) / R;
      const X = x => cx + x * k, Y = y => cy - y * k;

      ctx.fillStyle = col.sea; ctx.fillRect(0, 0, w, h);

      const step = ringStep(R);
      ctx.strokeStyle = col.grid; ctx.lineWidth = 1;
      ctx.font = `11px ${col.mono}`; ctx.fillStyle = col.muted;
      ctx.textAlign = "left"; ctx.textBaseline = "bottom";
      for (let r = step; r <= R * 1.45; r += step) {
        ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke();
        const a = -Math.PI / 4;
        const lx = cx + Math.cos(a) * r * k + 3, ly = cy + Math.sin(a) * r * k - 2;
        if (lx < w - 34 && ly > 14) ctx.fillText(`${r} km`, lx, ly);
      }

      ctx.setLineDash([4, 4]); ctx.strokeStyle = col.muted; ctx.lineWidth = 1.2;
      if (!isReal()) for (const r of [vmin() * tt, vmax() * tt]) if (r * k > 2) {
        ctx.beginPath(); ctx.arc(cx, cy, r * k, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.setLineDash([]);

      let found = 0;
      const seen = i => s >= 0 && run.found_s[i] !== null && run.found_s[i] <= s;
      ctx.fillStyle = col.boat;
      for (let i = 0; i < nBoats; i++) {
        if (seen(i)) { found++; continue; }
        ctx.beginPath(); ctx.arc(X(pos[i][0]), Y(pos[i][1]), 1.9, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = c; ctx.strokeStyle = col.sea; ctx.lineWidth = 1.5;
      for (let i = 0; i < nBoats; i++) {
        if (!seen(i)) continue;
        ctx.beginPath(); ctx.arc(X(pos[i][0]), Y(pos[i][1]), 3.6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }

      ctx.strokeStyle = col.ink; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 6, cy); ctx.lineTo(cx + 6, cy); ctx.moveTo(cx, cy - 6); ctx.lineTo(cx, cy + 6); ctx.stroke();

      if (s >= 0) run.paths.forEach((path, j) => {
        const n = Math.min(Math.floor(s / D.path_every_s), path.length - 1);
        const here = pointAt(path, s);
        ctx.strokeStyle = c; ctx.lineWidth = 1.8; ctx.lineJoin = "round";
        ctx.setLineDash(DASHES[j % DASHES.length]);
        ctx.beginPath(); ctx.moveTo(X(0), Y(0));
        for (let i = 0; i <= n; i++) ctx.lineTo(X(path[i][0]), Y(path[i][1]));
        ctx.lineTo(X(here[0]), Y(here[1])); ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.18; ctx.fillStyle = c;
        ctx.beginPath(); ctx.arc(X(here[0]), Y(here[1]), Math.max(4, (scen().sweep_radius_km ?? A.sweep_radius_km) * k), 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = c; ctx.strokeStyle = col.panel; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(X(here[0]), Y(here[1]), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      });

      ctx.fillStyle = col.muted; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText(`rings every ${step} km`, w - 8, h - 6);

      p.num.textContent = found;
      p.of.textContent = `of ${nBoats} boats found (${Math.round(100 * found / nBoats)}%)`;
      p.bar.style.width = `${100 * found / nBoats}%`;
    }


 if(readout)readout.textContent=panels[0].num.textContent+' '+panels[0].of.textContent;
 }
 let active=!matchMedia('(prefers-reduced-motion: reduce)').matches,inView=false,raf=0,last=0;
 function frame(ts){raf=0;if(!active||!inView||document.hidden)return;const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;t+=dt*240;if(t>total())t=0;draw();raf=requestAnimationFrame(frame);}
 function refresh(){cancelAnimationFrame(raf);last=0;if(active&&inView&&!document.hidden)raf=requestAnimationFrame(frame);else draw();}
 new IntersectionObserver(es=>{inView=es[0].isIntersecting;refresh();},{threshold:.15}).observe(canvas);
 new ResizeObserver(()=>draw()).observe(canvas);
 document.addEventListener('preview-playback',e=>{active=e.detail;refresh();});
 document.addEventListener('visibilitychange',refresh);
 draw();canvas.classList.add('ready');
});})();
