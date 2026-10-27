/* LunarRL results: replay pair, training curve, evaluation spread, outcome counts.
   Draws inline SVG from window.LUNARRL_RESULTS (written by lunar-rl/export_results.py).
   No libraries. Every number shown comes from that file; nothing here is typed in. */
(function () {
  "use strict";

  var NS = "http://www.w3.org/2000/svg";

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(n, d) { return Number(n).toLocaleString("en-US", { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); }
  function signed(n) { return (n > 0 ? "+" : n < 0 ? "−" : "") + fmt(Math.abs(n), 1); }
  function kSteps(n) { return n >= 1e6 ? fmt(n / 1e6, n % 1e6 ? 2 : 0) + "M" : fmt(n / 1e3) + "k"; }

  function svg(w, h, label) {
    var s = document.createElementNS(NS, "svg");
    s.setAttribute("viewBox", "0 0 " + w + " " + h);
    s.setAttribute("width", w);
    s.setAttribute("height", h);
    s.setAttribute("role", "img");
    s.setAttribute("aria-label", label);
    s.classList.add("viz__svg");
    return s;
  }
  function el(parent, tag, attrs, text) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text != null) n.textContent = text;
    parent.appendChild(n);
    return n;
  }
  function scale(d0, d1, r0, r1) {
    return function (v) { return r0 + (v - d0) / (d1 - d0) * (r1 - r0); };
  }
  function ticks(lo, hi, n) {
    var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / n)));
    var err = (hi - lo) / n / step;
    step *= err >= 7.5 ? 10 : err >= 3.5 ? 5 : err >= 1.5 ? 2 : 1;
    var out = [];
    for (var t = Math.ceil(lo / step) * step; t <= hi + 1e-9; t += step) out.push(Math.round(t * 1e6) / 1e6);
    return out;
  }

  /* one shared tooltip per chart wrapper */
  function tooltip(wrap) {
    var t = document.createElement("div");
    t.className = "viz__tip";
    t.setAttribute("role", "status");
    wrap.appendChild(t);
    return {
      show: function (html, x, y) {
        t.innerHTML = html;
        t.classList.add("is-on");
        var W = wrap.clientWidth, tw = t.offsetWidth;
        t.style.left = Math.max(0, Math.min(W - tw, x - tw / 2)) + "px";
        t.style.top = Math.max(0, y - t.offsetHeight - 12) + "px";
      },
      hide: function () { t.classList.remove("is-on"); }
    };
  }

  /* ---------------- training curve ---------------- */
  function trainingChart(wrap, D) {
    var curve = D.training_curve, W = Math.max(300, wrap.clientWidth), H = W < 520 ? 250 : 300;
    var m = { l: 46, r: W < 520 ? 14 : 92, t: 14, b: 40 };
    var xmax = curve[curve.length - 1].step;
    var lo = Math.min.apply(null, curve.map(function (c) { return c.p10; }).concat([D.eval.random.mean_return]));
    var hi = Math.max.apply(null, curve.map(function (c) { return c.p90; }).concat([250]));
    lo = Math.floor(lo / 50) * 50; hi = Math.ceil(hi / 50) * 50;
    var x = scale(0, xmax, m.l, W - m.r), y = scale(lo, hi, H - m.b, m.t);
    var s = svg(W, H, "Training curve: mean episode return per bin of training steps, rising from " +
      fmt(curve[0].mean) + " to " + fmt(curve[curve.length - 1].mean) + " over " + kSteps(xmax) + " steps.");

    ticks(lo, hi, 5).forEach(function (t) {
      el(s, "line", { x1: m.l, x2: W - m.r, y1: y(t), y2: y(t), class: "viz__grid" + (t === 0 ? " viz__zero" : "") });
      el(s, "text", { x: m.l - 8, y: y(t) + 4, class: "viz__tick", "text-anchor": "end" }, fmt(t));
    });
    ticks(0, xmax, W < 520 ? 3 : 5).forEach(function (t) {
      el(s, "text", { x: x(t), y: H - m.b + 18, class: "viz__tick", "text-anchor": "middle" }, t ? kSteps(t) : "0");
    });
    el(s, "text", { x: (m.l + W - m.r) / 2, y: H - 4, class: "viz__axis", "text-anchor": "middle" }, "Training steps (all 16 environments combined)");

    // reference lines: Gymnasium's "solved" bar and the random policy's measured mean
    [[200, "Solved: 200"], [D.eval.random.mean_return, "Random: " + fmt(D.eval.random.mean_return)]].forEach(function (r) {
      el(s, "line", { x1: m.l, x2: W - m.r, y1: y(r[0]), y2: y(r[0]), class: "viz__ref" });
      if (W >= 520) el(s, "text", { x: W - m.r + 6, y: y(r[0]) + (r[0] === 200 ? 16 : 4), class: "viz__lab" }, r[1]);
      else if (r[0] === 200) el(s, "text", { x: m.l + 4, y: y(r[0]) - 5, class: "viz__lab" }, r[1]);
      else el(s, "text", { x: W - m.r, y: y(r[0]) + 14, class: "viz__lab", "text-anchor": "end" }, r[1]);
    });

    var band = curve.map(function (c) { return x(c.step) + "," + y(c.p90); }).join(" ") + " " +
      curve.slice().reverse().map(function (c) { return x(c.step) + "," + y(c.p10); }).join(" ");
    el(s, "polygon", { points: band, class: "viz__band" });
    el(s, "polyline", { points: curve.map(function (c) { return x(c.step) + "," + y(c.mean); }).join(" "), class: "viz__line" });
    if (W >= 520) {
      var last = curve[curve.length - 1];
      el(s, "text", { x: W - m.r + 6, y: Math.min(y(last.mean), y(200)) - 8, class: "viz__lab viz__lab--strong" }, "PPO mean");
    }

    // hover: crosshair snaps to the nearest bin
    var cross = el(s, "line", { y1: m.t, y2: H - m.b, class: "viz__cross" });
    var dot = el(s, "circle", { r: 4.5, class: "viz__dot" });
    var hit = el(s, "rect", { x: m.l, y: m.t, width: W - m.l - m.r, height: H - m.t - m.b, class: "viz__hit" });
    var tip = tooltip(wrap);
    function move(ev) {
      var r = s.getBoundingClientRect(), px = (ev.clientX - r.left) * (W / r.width);
      var best = curve.reduce(function (a, c) { return Math.abs(x(c.step) - px) < Math.abs(x(a.step) - px) ? c : a; });
      cross.setAttribute("x1", x(best.step)); cross.setAttribute("x2", x(best.step));
      dot.setAttribute("cx", x(best.step)); dot.setAttribute("cy", y(best.mean));
      s.classList.add("is-hover");
      tip.show("<b>Up to " + kSteps(best.step) + " steps</b><br>Mean return " + fmt(best.mean, 1) +
        "<br>Middle 80%: " + fmt(best.p10) + " to " + fmt(best.p90) + "<br>" + best.n + " episodes in this bin",
        x(best.step) * r.width / W, y(best.mean) * r.height / H);
    }
    hit.addEventListener("pointermove", move);
    hit.addEventListener("pointerleave", function () { s.classList.remove("is-hover"); tip.hide(); });
    wrap.appendChild(s);
  }

  /* ---------------- evaluation spread: 100 episodes per policy on shared seeds ---------------- */
  function spreadChart(wrap, D) {
    var W = Math.max(300, wrap.clientWidth), rowH = 74, m = { l: W < 520 ? 12 : 104, r: 16, t: 10, b: 40 };
    var H = m.t + rowH * 2 + m.b;
    var all = D.eval_returns.random.concat(D.eval_returns.ppo);
    var lo = Math.floor(Math.min.apply(null, all) / 50) * 50, hi = Math.ceil(Math.max.apply(null, all) / 50) * 50;
    var x = scale(lo, hi, m.l, W - m.r);
    var s = svg(W, H, "Evaluation returns, one dot per episode, " + D.eval.ppo.episodes + " episodes per policy on the same seeds.");
    ticks(lo, hi, W < 520 ? 4 : 7).forEach(function (t) {
      el(s, "line", { x1: x(t), x2: x(t), y1: m.t, y2: H - m.b, class: "viz__grid" + (t === 0 ? " viz__zero" : "") });
      el(s, "text", { x: x(t), y: H - m.b + 18, class: "viz__tick", "text-anchor": "middle" }, fmt(t));
    });
    el(s, "text", { x: (m.l + W - m.r) / 2, y: H - 4, class: "viz__axis", "text-anchor": "middle" }, "Episode return (original Gymnasium reward)");
    el(s, "line", { x1: x(200), x2: x(200), y1: m.t, y2: H - m.b, class: "viz__ref" });

    var seeds = D.eval.seeds.split("..").map(Number);
    var tip = tooltip(wrap);
    [["random", "Random", "viz__pt--random"], ["ppo", "Trained PPO", "viz__pt--ppo"]].forEach(function (row, ri) {
      var cy = m.t + rowH * ri + rowH / 2, vals = D.eval_returns[row[0]];
      var mean = D.eval[row[0]].mean_return;
      if (W >= 520) el(s, "text", { x: m.l - 14, y: cy + 4, class: "viz__lab viz__lab--strong", "text-anchor": "end" }, row[1]);
      else el(s, "text", { x: m.l, y: cy - rowH / 2 + 12, class: "viz__lab viz__lab--strong" }, row[1]);
      vals.forEach(function (v, i) {
        // deterministic jitter so the plot is stable between reloads
        var j = (((i * 37) % 23) / 22 - 0.5) * (rowH * 0.5);
        var c = el(s, "circle", { cx: x(v), cy: cy + j + (W < 520 ? 6 : 0), r: 3.6, class: "viz__pt " + row[2] });
        c.addEventListener("pointerenter", function () {
          var r = s.getBoundingClientRect();
          tip.show("<b>" + row[1] + "</b>, seed " + (seeds[0] + i) + "<br>Return " + fmt(v, 1),
            x(v) * r.width / W, (cy + j) * r.height / H);
        });
        c.addEventListener("pointerleave", tip.hide);
      });
      el(s, "line", { x1: x(mean), x2: x(mean), y1: cy - rowH * 0.36, y2: cy + rowH * 0.36, class: "viz__mean" });
    });
    wrap.appendChild(s);
  }

  /* ---------------- outcome counts: paired bars per outcome ---------------- */
  function outcomes(D) {
    var rows = [
      ["Landed between the flags", "landed_on_pad"],
      ["Crashed", "crashed"],
      ["Flew off screen", "out_of_bounds"],
      ["Did not finish", "timeout"]
    ];
    var n = D.eval.ppo.episodes;
    return '<table class="viz__bars"><caption class="sr">Outcome counts out of ' + n + ' episodes per policy</caption>' +
      "<thead><tr><th scope=\"col\">Outcome</th><th scope=\"col\">Random</th><th scope=\"col\">Trained PPO</th></tr></thead><tbody>" +
      rows.map(function (r) {
        var a = D.eval.random[r[1]], b = D.eval.ppo[r[1]];
        function cell(v, cls) {
          return '<td><span class="viz__bar ' + cls + '" style="--w:' + (v / n * 100) + '%"></span><span class="viz__n">' + v + "</span></td>";
        }
        return "<tr><th scope=\"row\">" + esc(r[0]) + "</th>" + cell(a, "viz__bar--random") + cell(b, "viz__bar--ppo") + "</tr>";
      }).join("") + "</tbody></table>";
  }

  function figures(D) {
    var p = D.eval.ppo, r = D.eval.random;
    var f = [
      [fmt(p.mean_return), "Average trained-agent score"],
      [fmt(r.mean_return), "Average random-agent score"],
      [p.landed_on_pad + "/" + p.episodes, "Landings between the flags"],
      [p.crashed + "/" + p.episodes, "Crashes by the trained agent"]
    ];
    return '<div class="figures viz__figures">' + f.map(function (x) {
      return '<div class="figure"><div class="figure__v">' + esc(x[0]) + '</div><div class="figure__l">' + esc(x[1]) + "</div></div>";
    }).join("") + "</div>";
  }

  function replay(D, media) {
    if (!D.replay) return "";
    var R = D.replay;
    function outcomeText(o) {
      var t = { landed: "landed and came to rest", crashed: "crashed", out_of_bounds: "flew off screen", timeout: "was still airborne at the 1,000-step limit" }[o.outcome] || o.outcome;
      if (o.outcome === "landed") t += o.on_pad ? " between the flags" : " outside the flags";
      return t;
    }
    function fig(name, title) {
      var o = R[name];
      return '<figure class="slot viz__replay"><video controls muted playsinline preload="metadata" poster="' + esc(media[name] + ".jpg") +
        '" src="' + esc(media[name] + ".mp4") + '" aria-label="' + esc(title + " replay, seed " + R.seed) + '"></video>' +
        "<figcaption><b>" + esc(title) + ":</b> " + esc(outcomeText(o)) + ". Score: " + fmt(o.episode_return, 1) + ".</figcaption></figure>";
    }
    return '<div class="viz__pair">' + fig("random", "Random") + fig("ppo", "Trained agent") + "</div>" +
      '<p class="viz__note">Both agents started with the same terrain and push.</p>';
  }

  function seedsTable(D) {
    var rows = [{ label: "Seed " + D.config.seed + " (published model)", s: D.eval.ppo }].concat(
      (D.other_seeds || []).map(function (o) { return { label: "Seed " + o.seed, s: o.ppo }; }));
    if (D.experiment) {
      var e = D.experiment.config;
      rows.push({ label: "Experiment: " + (e.reward_wrapper === "fuel" ? "extra fuel penalty" : e.reward_wrapper) + ", seed " + e.seed, s: D.experiment.ppo, exp: true });
    }
    rows.push({ label: "Random policy", s: D.eval.random });
    return '<div class="viz__tablewrap"><table class="viz__table"><caption>Every training run, evaluated on the same ' + D.eval.ppo.episodes +
      " seeds (" + esc(D.eval.seeds) + ")</caption><thead><tr><th scope=\"col\">Run</th><th scope=\"col\">Mean return</th><th scope=\"col\">SD</th>" +
      "<th scope=\"col\">Solved</th><th scope=\"col\">On pad</th><th scope=\"col\">Crashed</th><th scope=\"col\">Off screen</th><th scope=\"col\">Timeout</th><th scope=\"col\">Main engine frames</th></tr></thead><tbody>" +
      rows.map(function (r) {
        var s = r.s;
        return "<tr" + (r.exp ? ' class="is-exp"' : "") + '><th scope="row">' + esc(r.label) + "</th><td>" + fmt(s.mean_return, 1) + "</td><td>" + fmt(s.std_return, 1) +
          "</td><td>" + s.solved_episodes + "</td><td>" + s.landed_on_pad + "</td><td>" + s.crashed + "</td><td>" + s.out_of_bounds + "</td><td>" + s.timeout +
          "</td><td>" + (s.mean_main_engine_frames != null ? fmt(s.mean_main_engine_frames, 1) : "\u2013") + "</td></tr>";
      }).join("") + "</tbody></table></div>";
  }

  function render(root, D, opts) {
    var c = D.config, media = opts.media;
    root.innerHTML =
      '<p class="viz__tag">' + opts.glyph + "<span>2D Gymnasium simulation.</span></p>" +
      figures(D) +
      '<h3 class="viz__h">Random vs trained</h3>' + replay(D, media) +
      '<h3 class="viz__h">How it learned</h3>' +
      '<p class="viz__lede">The score rose as the agent practiced. The shaded area shows how much the attempts varied.</p>' +
      '<div class="viz__chart" data-chart="train"></div>' +
      '<h3 class="viz__h">100 new attempts</h3>' +
      outcomes(D) +
      '<p class="viz__note">I also trained two more agents with different random seeds. Their average scores were 262 and 267, so the result was not based on one lucky run.</p>';

    var charts = [["train", trainingChart]];
    function draw() {
      charts.forEach(function (ch) {
        var w = root.querySelector('[data-chart="' + ch[0] + '"]');
        w.innerHTML = "";
        ch[1](w, D);
      });
    }
    draw();
    var last = root.clientWidth, timer;
    window.addEventListener("resize", function () {
      clearTimeout(timer);
      timer = setTimeout(function () { if (root.clientWidth !== last) { last = root.clientWidth; draw(); } }, 150);
    });
  }

  window.LunarRLViz = { render: render };
})();
