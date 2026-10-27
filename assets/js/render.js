/* Renders the site from content/projects.js. No build step, no dependencies. */
(function () {
  "use strict";

  var P = window.PORTFOLIO;
  if (!P) { return; }

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function status(key) {
    return P.statuses[key] || { label: key || "Unknown", glyph: "dashed", note: "" };
  }

  /* status glyph: solid = done, half = partly working,
     hatch = modelled not measured, dashed = not built yet */
  function glyph(kind) {
    var ns = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" class="glyph" aria-hidden="true"';
    var stroke = 'stroke="currentColor" stroke-width="1.4" fill="none"';
    if (kind === "solid")  return '<svg ' + ns + '><rect x="1" y="1" width="10" height="10" fill="currentColor"/></svg>';
    if (kind === "half")   return '<svg ' + ns + '><rect x="1" y="1" width="10" height="10" ' + stroke + '/><rect x="1" y="6" width="10" height="5" fill="currentColor"/></svg>';
    if (kind === "hatch")  return '<svg ' + ns + '><rect x="1" y="1" width="10" height="10" ' + stroke + '/><path d="M1 8L8 1M4 11L11 4" stroke="currentColor" stroke-width="1.2"/></svg>';
    return '<svg ' + ns + '><rect x="1" y="1" width="10" height="10" ' + stroke + ' stroke-dasharray="2.5 2"/></svg>';
  }

  function chip(key) {
    var s = status(key);
    return '<span class="chip" title="' + esc(s.note) + '">' + glyph(s.glyph) + esc(s.label) + "</span>";
  }

  function linkButtons(links, fallbackLabel) {
    if (!links || !links.length) return "";
    return '<div class="linklist">' + links.map(function (l) {
      if (l.url) {
        var ext = /^https?:/i.test(l.url) ? ' target="_blank" rel="noopener"' : "";
        return '<a class="linkbtn" href="' + esc(l.url) + '"' + ext + ">" + esc(l.label) + "</a>";
      }
      return '<span class="linkbtn linkbtn--todo" title="Add the URL in content/projects.js">' +
             esc(l.label) + ", add link</span>";
    }).join("") + "</div>";
  }

  function header(active) {
    return '' +
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="wrap"><div class="topbar">' +
        '<a class="topbar__home" href="index.html">' + esc(P.profile.name) + "</a>" +
        "<nav>" +
          '<a href="index.html#work">Work</a>' +
          '<a href="index.html#beyond">Beyond</a>' +
          '<a href="index.html#about">About</a>' +
          '<a href="index.html#contact">Links</a>' +
        "</nav>" +
      "</div></div>";
  }

  function footer() {
    var year = new Date().getFullYear();
    return '<div class="wrap"><div class="foot">' +
      "<span>" + esc(P.profile.name) + ", " + year + "</span>" +
      "<span>Status glyphs: filled = working, half = in progress, hatched = simulation, dashed = planned</span>" +
      "</div></div>";
  }

  /* ---------------- beyond engineering ---------------- */

  /* Media with an empty src renders nothing at all, no empty frames on the
     public page. Captions are already written in content/projects.js; drop a
     file into assets/media/, set its src, and the figure appears. */
  function beyondMedia(items) {
    var live = (items || []).filter(function (m) { return m && m.src; });
    if (!live.length) return "";
    return '<div class="bmedia">' + live.map(function (m) {
      var body;
      if (m.type === "video") {
        body = '<video controls playsinline preload="metadata"' +
               (m.poster ? ' poster="' + esc(m.poster) + '"' : "") +
               ' src="' + esc(m.src) + '"></video>';
      } else {
        body = '<img src="' + esc(m.src) + '" alt="' + esc(m.caption) + '" loading="lazy">';
      }
      return '<figure class="bfig reveal">' + body +
             "<figcaption>" + esc(m.caption) + "</figcaption></figure>";
    }).join("") + "</div>";
  }

  function figuresBlock(figs) {
    if (!figs || !figs.length) return "";
    return '<div class="figures reveal">' + figs.map(function (f) {
      return '<div class="figure"><div class="figure__v">' + esc(f.value) +
             '</div><div class="figure__l">' + esc(f.label) + "</div></div>";
    }).join("") + "</div>";
  }

  function rosterBlock(s) {
    if (!s.roster || !s.roster.length) return "";
    return '<div class="roster reveal">' +
      (s.rosterTitle ? '<h4 class="sub__h">' + esc(s.rosterTitle) + "</h4>" : "") +
      '<ul class="roster__list">' + s.roster.map(function (r) {
        return '<li><span class="roster__role">' + esc(r.role) + "</span>" +
               '<span class="roster__org">' + esc(r.org) + "</span>" +
               (r.note ? '<span class="roster__note">' + esc(r.note) + "</span>" : "") +
               "</li>";
      }).join("") + "</ul></div>";
  }

  function featuredBlock(f) {
    if (!f) return "";
    var obs = (f.observations || []).map(function (o) {
      return '<li class="obs"><span class="obs__n">' + esc(o.n) + "</span>" +
             '<div class="obs__body"><h5 class="obs__t">' + esc(o.title) + "</h5>" +
             "<p>" + esc(o.body) + "</p></div></li>";
    }).join("");
    return '<article class="paper reveal">' +
      '<div class="paper__kind">' + esc(f.kind) + "</div>" +
      '<h4 class="paper__title">' + esc(f.title) + "</h4>" +
      '<p class="paper__abstract">' + esc(f.abstract) + "</p>" +
      (obs ? '<ol class="obs__list">' + obs + "</ol>" : "") +
      (f.note ? '<p class="paper__note">' + esc(f.note) + "</p>" : "") +
      linkButtons(f.links) +
      "</article>";
  }

  function alsoBlock(s) {
    if (!s.also || !s.also.length) return "";
    return '<div class="also reveal">' +
      (s.alsoTitle ? '<h4 class="sub__h">' + esc(s.alsoTitle) + "</h4>" : "") +
      s.also.map(function (a) {
        var inner = '<span class="also__t">' + esc(a.title) + "</span>" +
          '<span class="also__m">' + esc(a.venue) +
          (a.note ? ", " + esc(a.note) : "") + "</span>";
        return a.url
          ? '<a class="also__row" href="' + esc(a.url) + '" target="_blank" rel="noopener">' +
            inner + '<span class="also__go">Read</span></a>'
          : '<div class="also__row">' + inner + "</div>";
      }).join("") + "</div>";
  }

  /* featured paper and the "also published" items, side by side at equal width */
  function paperPair(s) {
    if (!s.featured || !s.also || !s.also.length) {
      return featuredBlock(s.featured) + alsoBlock(s);
    }
    var cards = s.also.map(function (a) {
      return '<article class="paper paper--short reveal">' +
        '<div class="paper__kind">' + esc(a.venue) + "</div>" +
        '<h4 class="paper__title">' + esc(a.title) + "</h4>" +
        (a.note ? '<p class="paper__abstract">' + esc(a.note) + "</p>" : "") +
        (a.url ? linkButtons([{ label: "Read", url: a.url }]) : "") +
        "</article>";
    }).join("");
    return '<div class="papers">' + featuredBlock(s.featured) + cards + "</div>";
  }

  /* ---------------- 3D scenes (markup only; the code is in assets/js/scenes) ----
     The page is written as ordinary sections first. "is-live" is added only
     when the browser can run the scene; scenes/boot.js removes it again if the
     scene fails to start, and the same content simply reads as a normal page. */
  function sceneCapable() {
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl2 = !!window.WebGL2RenderingContext;
    var imap = !!(window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports("importmap"));
    return gl2 && imap ? (reduced ? " is-still" : " is-live") : "";
  }

  function corners() { return "<i></i><i></i><i></i><i></i>"; }

  /* project page: the Tello story. Beat 1 is the real project introduction. */
  function telloStory(p) {
    var sc = p.scene;
    var intro =
      '<header class="tbeat tbeat--intro is-active"><div class="tbeat__in">' +
        '<div class="ph__meta">' + chip(p.status) +
          '<span class="ph__year">' + esc(p.year) + "</span>" +
          '<span class="ph__year">' + (p.tags || []).map(esc).join(" / ") + "</span></div>" +
        "<h1>" + esc(p.title) + "</h1>" +
        '<p class="ph__kicker">' + esc(p.kicker) + "</p>" +
        '<p class="ph__statusline">' + esc(p.statusLine) + "</p>" +
        '<p class="tbeat__summary">' + esc(p.summary) + "</p>" +
        linkButtons(p.links) +
      "</div></header>";

    var beats = (sc.beats || []).map(function (b, i) {
      return '<section class="tbeat' + (i === sc.beats.length - 1 ? " tbeat--last" : "") + '"><div class="tbeat__in">' +
        '<h2 class="tbeat__t">' + esc(b.title) + "</h2><p>" + esc(b.text) + "</p></div></section>";
    }).join("");

    return '<section class="tstory' + sceneCapable() + '" data-scene="tello" data-model="' + esc(sc.model || "") + '" aria-label="Interactive illustration of the person-following idea">' +
      '<div class="tstory__sticky">' +
        '<canvas class="tstage__canvas" aria-hidden="true"></canvas>' +
        '<div class="tbox tbox--main" aria-hidden="true">' + corners() + "</div>" +
        '<div class="tstage__inset" aria-hidden="true">' +
          '<div class="tstage__frame"><div class="tbox tbox--inset">' + corners() + "</div>" +
          '<svg class="tstage__xhair"><line class="tstage__offset" x1="0" y1="0" x2="0" y2="0"/></svg></div>' +
          '<span class="tstage__incap">Drone camera, drawn</span>' +
        "</div>" +
      "</div>" +
      '<div class="tbeats"><div class="tstage__tagwrap"><p class="tstage__tag">' + glyph("hatch") + "<span>" + esc(sc.tag) + "</span></p></div>" + intro + beats + "</div>" +
    "</section>";
  }

  function recordedBlock(p) {
    var r = p.scene.recorded;
    var ev = p.evidence[r.video];
    var cols = (r.columns || []).map(function (c) {
      return '<div class="recorded__col"><h3>' + esc(c.title) + "</h3><p>" + esc(c.text) + "</p>" +
        (c.linkHref ? '<p class="recorded__more"><a href="' + esc(c.linkHref) + '">' + esc(c.linkLabel || "More") + "</a></p>" : "") +
        "</div>";
    }).join("");
    return '<section class="recorded" id="recorded"><div class="wrap">' +
      '<div class="recorded__head"><span class="recorded__tag">' + glyph("solid") + "Recorded</span><h2>" + esc(r.label) + "</h2></div>" +
      '<div class="recorded__grid">' + slot(ev, p.id, r.video) +
        '<div class="recorded__cols">' + cols + "</div></div>" +
    "</div></section>";
  }

  /* music strand: one pinned scene, with the text arriving in its empty space.
     Live: dark stage, text over it, driven by scroll. Still and static: the same text, stacked. */
  function musicFilm(s) {
    var sc = s.scene, f = sc.film || {};
    var rows = (s.roster || []).filter(function (r) { return r.chart; });
    var list = rows.filter(function (r) { return !r.award; }).map(function (r) {
      return '<li><span class="ens__org">' + esc(r.org) + '</span><span class="ens__role">' + esc(r.role) + "</span></li>";
    }).join("");
    var award = rows.filter(function (r) { return r.award; }).map(function (r) {
      return '<p class="ens__award"><span class="ens__x">' + esc(r.role) + '</span><span class="ens__aw">' + esc(r.org) + "</span></p>";
    }).join("");
    return '<div class="mfilm' + sceneCapable() + '" data-scene="drumsticks" role="group" aria-label="' + esc(sc.label) + '">' +
      '<div class="mfilm__stage">' +
        '<canvas class="mfilm__canvas" aria-hidden="true"></canvas>' +
        '<div class="mfilm__light" aria-hidden="true"></div>' +
        '<div class="mfilm__text">' +
          '<section class="mbeat mbeat--open">' +
            '<h3 class="mbeat__title">' + esc(s.title) + "</h3>" +
            '<p class="mbeat__sub">' + esc(f.scholarship) + "</p>" +
            '<p class="mbeat__msg">' + esc(f.message) + "</p>" +
          "</section>" +
          '<section class="mbeat mbeat--ens">' +
            '<h4 class="ens__title">' + esc(f.rosterTitle || "Where I play") + "</h4>" +
            '<ul class="ens__list">' + list + "</ul>" + award +
          "</section>" +
          (s.pull ? '<section class="mbeat mbeat--craft"><blockquote><p>' + esc(s.pull) + "</p></blockquote></section>" : "") +
          '<section class="mbeat mbeat--close"><p>' + esc(s.lede) + "</p></section>" +
        "</div>" +
        '<div class="mfilm__foot">' +
          '<button type="button" class="mfilm__sound" aria-pressed="false" data-on="' + esc(sc.soundOn || "Sound on") +
            '" data-off="' + esc(sc.soundOff || "Sound off") + '"><span class="snd-off">' + glyph("dashed") + '</span><span class="snd-on">' + glyph("solid") + '</span><span class="snd__t">' + esc(sc.soundOff || "Sound off") + "</span></button>" +
        "</div>" +
      "</div>" +
      '<i class="mfilm__fade mfilm__fade--top" aria-hidden="true"></i><i class="mfilm__fade mfilm__fade--bot" aria-hidden="true"></i>' +
    "</div>";
  }

  /* the belt that sweeps through as the music section ends */
  function beltFilm(s) {
    var sc = s.scene;
    return '<div class="bfilm' + sceneCapable() + '" data-scene="belt" data-name="' + esc(P.profile.name) + '" role="group" aria-label="' + esc(sc.label) + '">' +
      '<div class="bfilm__stage"><canvas class="bfilm__canvas" aria-hidden="true"></canvas>' +
        '<div class="bfilm__text"><section class="bbeat">' +
          '<p class="bbeat__kicker">' + esc(sc.kicker) + "</p>" +
          '<p class="bbeat__text">' + esc(sc.reflection) + "</p>" +
        "</section></div>" +
      "</div></div>";
  }

  /* 16 ticks, accented every 4, a bar of time */
  function beatMotif() {
    var t = "";
    for (var i = 0; i < 16; i++) {
      t += '<span class="beat__t' + (i % 4 === 0 ? " beat__t--on" : "") + '"></span>';
    }
    return '<div class="beat" aria-hidden="true">' + t + "</div>";
  }

  function renderBeyond() {
    var b = P.beyond;
    if (!b || !b.strands || !b.strands.length) return "";

    var lead = (b.lead || []).map(function (t) {
      return '<p class="blead__p">' + esc(t) + "</p>";
    }).join("");

    var strands = b.strands.map(function (s) {
      var motif = s.character === "music"   ? beatMotif()
                : s.character === "martial" ? '<div class="belt" aria-hidden="true"><span></span></div>'
                : s.character === "markets" ? '<div class="rules" aria-hidden="true"></div>'
                : "";

      var body = (s.body || []).map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");

      var head =
          '<header class="strand__head reveal">' + motif +
            '<div class="strand__eyebrow">' + esc(s.eyebrow) + "</div>" +
            '<h3 class="strand__title">' + esc(s.title) + "</h3>" +
            '<p class="strand__lede">' + esc(s.lede) + "</p>" +
          "</header>";
      var cols =
          '<div class="strand__cols">' +
            '<div class="strand__body reveal">' + body + "</div>" +
            (s.pull ? '<blockquote class="pull reveal"><p>' + esc(s.pull) + "</p></blockquote>" : "") +
          "</div>";

      /* a strand with the drumming film: the film carries the title, lede and pull quote, then the
         rest of the story follows as ordinary text. Everything is the same text either way. */
      if (s.scene && s.scene.kind === "drumsticks") {
        var rest = (s.roster || []).filter(function (r) { return !r.chart; });
        var restBlock = rosterBlock({ roster: rest, rosterTitle: "" });
        return '<article class="strand strand--' + esc(s.character) + ' has-scene" id="' + esc(s.id) + '">' +
          musicFilm(s) +
          '<div class="wrap strand__after">' +
            figuresBlock(s.figures) +
            '<div class="strand__cols"><div class="strand__body reveal">' + body + "</div></div>" +
            restBlock +
            paperPair(s) +
            beyondMedia(s.media) +
          "</div>" +
        "</article>";
      }

      var beltIntro = (s.scene && s.scene.kind === "belt") ? beltFilm(s) : "";

      return beltIntro + '<article class="strand strand--' + esc(s.character) + '" id="' + esc(s.id) + '">' +
        '<div class="wrap">' +
          head +
          figuresBlock(s.figures) +
          cols +
          rosterBlock(s) +
          paperPair(s) +
          beyondMedia(s.media) +
        "</div>" +
      "</article>";
    }).join("");

    return '<section class="section beyond" id="beyond">' +
      '<div class="wrap"><div class="section__head"><h2>' + esc(b.eyebrow) + "</h2>" +
        '<span class="count">' + esc(b.heading) + "</span></div>" +
        '<div class="blead reveal">' + lead + "</div></div>" +
      strands +
    "</section>";
  }

  /* Restrained reveal-on-scroll. If IntersectionObserver is missing or the
     visitor prefers reduced motion we never add .js-reveal, so the CSS never
     hides anything and the page is fully readable. */
  function reveals(root) {
    var nodes = root.querySelectorAll(".reveal");
    if (!nodes.length || !("IntersectionObserver" in window)) return;
    if (window.matchMedia &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    root.classList.add("js-reveal");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

    Array.prototype.forEach.call(nodes, function (n, i) {
      n.style.transitionDelay = ((i % 5) * 50) + "ms";
      io.observe(n);
    });
  }

  /* ---------------- home ---------------- */
  function renderHome(root) {
    var pr = P.profile;

    var readout = pr.readout.map(function (r) {
      return '<div class="readout__row"><div class="readout__k">' + esc(r.label) +
             '</div><div class="readout__v">' + esc(r.value) + "</div></div>";
    }).join("");

    var entries = P.projects.map(function (p) {
      return '<a class="entry" href="' + (p.page ? esc(p.page) : 'project.html?id=' + encodeURIComponent(p.id)) + '">' +
        "<div>" +
          '<h3 class="entry__title">' + esc(p.title) + "</h3>" +
          '<p class="entry__kicker">' + esc(p.kicker) + "</p>" +
        "</div>" +
        '<div class="entry__side">' + chip(p.status) + "</div>" +
      "</a>";
    }).join("");

    var about = pr.about.map(function (t) { return "<p>" + esc(t) + "</p>"; }).join("");

    root.innerHTML =
      header() +
      '<main id="main">' +

      '<section class="hero"><div class="wrap">' +
        '<div>' +
          '<h1 class="hero__name">' + esc(pr.name) + ' <span class="hero__role">' + esc(pr.role) + "</span></h1>" +
          '<p class="hero__line">' + esc(pr.line) + "</p>" +
        "</div>" +
        '<div class="readout">' + readout + "</div>" +
      "</div></section>" +

      '<section class="section" id="work"><div class="wrap">' +
        '<div class="section__head"><h2>Work</h2>' +
        '<span class="count">' + P.projects.length + " projects, with their real status</span></div>" +
        '<div class="manifest">' + entries + "</div>" +
      "</div></section>" +

      renderBeyond() +

      '<section class="section" id="about"><div class="wrap">' +
        '<div class="section__head"><h2>About</h2></div>' +
        '<div class="about">' + about + "</div>" +
      "</div></section>" +

      '<section class="section section--last" id="contact"><div class="wrap">' +
        '<div class="section__head"><h2>Links</h2></div>' +
        "<p>Code and the rest of what I'm working on.</p>" +
        linkButtons(pr.links) +
      "</div></section>" +

      "</main>" + footer();

    reveals(root);
  }

  /* ---------------- project page ---------------- */
  function slot(ev, projectId, i) {
    var kind = ev.type === "video" ? "Video" : "Image";
    var body;
    if (ev.src && ev.type === "video") {
      body = '<video controls playsinline preload="metadata"' +
             (ev.poster ? ' poster="' + esc(ev.poster) + '"' : "") +
             ' src="' + esc(ev.src) + '"></video>';
    } else if (ev.src) {
      body = '<img src="' + esc(ev.src) + '" alt="' + esc(ev.caption) + '" loading="lazy">';
    } else {
      var suggested = "assets/media/" + projectId + "-" + (i + 1) +
                      (ev.type === "video" ? ".mp4" : ".jpg");
      body = '<div class="slot__frame">' +
        '<span class="slot__kind">' + kind + " slot, empty</span>" +
        '<span class="slot__hint">Save your file as <code>' + esc(suggested) +
        "</code>, then set its <code>src</code> in content/projects.js</span>" +
        "</div>";
    }
    return '<figure class="slot">' + body +
           "<figcaption>" + esc(ev.caption) + "</figcaption></figure>";
  }

  function renderProject(root) {
    var id = new URLSearchParams(window.location.search).get("id");
    var idx = P.projects.findIndex(function (p) { return p.id === id; });

    if (idx === -1) {
      document.title = "Project not found, " + P.profile.name;
      root.innerHTML = header() +
        '<main id="main" class="wrap error"><h1>That project isn\'t here</h1>' +
        "<p>The link points to a project id that isn't in content/projects.js.</p>" +
        '<div class="linklist"><a class="linkbtn" href="index.html">Back to all work</a></div></main>' +
        footer();
      return;
    }

    var p = P.projects[idx];
    if (p.page) { window.location.replace(p.page); return; }
    var s = status(p.status);
    document.title = p.title + ", " + P.profile.name;

    function block(title, inner, id) {
      return '<section class="block"' + (id ? ' id="' + id + '"' : "") + '><div class="wrap"><h2>' + esc(title) + "</h2>" + inner + "</div></section>";
    }
    var story = p.scene && p.scene.kind === "tello";

    var builtList = '<ul class="bullets">' + (p.built || []).map(function (b) {
      return "<li>" + esc(b) + "</li>";
    }).join("") + "</ul>";

    var nextList = '<ul class="bullets bullets--open">' + (p.next || []).map(function (b) {
      return "<li>" + esc(b) + "</li>";
    }).join("") + "</ul>";

    var caveats = "";
    if (p.caveats && p.caveats.length) {
      caveats = '<section class="block"><div class="wrap"><div class="notice">' +
        "<h3>" + glyph(s.glyph) + esc(p.caveatTitle || "Read this before you read the results") + "</h3><ul>" +
        p.caveats.map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") +
        "</ul></div></div></section>";
    }

    /* optional long-form explainer sections: paragraphs, a list, term/definition pairs, a table */
    function explain(x) {
      var inner = (x.paras || []).map(function (t) { return '<p class="prose">' + esc(t) + "</p>"; }).join("");
      if (x.defs) inner += '<dl class="defs">' + x.defs.map(function (d) {
        return "<div><dt>" + esc(d.term) + "</dt><dd>" + esc(d.text) + "</dd></div>";
      }).join("") + "</dl>";
      if (x.list) inner += '<ul class="bullets">' + x.list.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul>";
      if (x.table) inner += '<div class="viz__tablewrap"><table class="viz__table viz__table--text">' +
        "<thead><tr>" + x.table.head.map(function (h) { return '<th scope="col">' + esc(h) + "</th>"; }).join("") + "</tr></thead><tbody>" +
        x.table.rows.map(function (r) {
          return "<tr>" + r.map(function (c, i) { return i ? "<td>" + esc(c) + "</td>" : '<th scope="row">' + esc(c) + "</th>"; }).join("") + "</tr>";
        }).join("") + "</tbody></table></div>";
      if (x.after) inner += x.after.map(function (t) { return '<p class="prose">' + esc(t) + "</p>"; }).join("");
      return block(x.title, inner, x.id);
    }
    var explainer = (p.explainer || []).filter(function (x) { return !x.afterResults; }).map(explain).join("");
    var explainerAfter = (p.explainer || []).filter(function (x) { return x.afterResults; }).map(explain).join("");

    /* optional data-driven results block (static: data and drawing code are plain script files) */
    var dataviz = p.dataviz ? block(p.dataviz.title || "Results",
      '<div class="viz" data-viz><p class="viz__loading">' + esc(p.dataviz.fallback || "Loading results.") + "</p></div>", "results") : "";

    var evidence = '<div class="evidence">' + (p.evidence || []).map(function (e, i) {
      return slot(e, p.id, i);
    }).join("") + "</div>";
    var evidenceBlock = (p.evidence && p.evidence.length) ? block("Evidence and demos", evidence) : "";

    var prev = P.projects[idx - 1];
    var next = P.projects[idx + 1];
    var pager = '<div class="wrap"><div class="pager"><div>' +
      (prev ? '<a href="project.html?id=' + encodeURIComponent(prev.id) + '">' +
        '<span class="pager__k">Previous</span><span class="pager__t">' + esc(prev.title) + "</span></a>" : "") +
      "</div><div>" +
      (next ? '<a href="project.html?id=' + encodeURIComponent(next.id) + '">' +
        '<span class="pager__k">Next</span><span class="pager__t">' + esc(next.title) + "</span></a>" : "") +
      "</div></div></div>";

    root.innerHTML =
      header() +
      '<main id="main">' +
        (story
          /* the scroll story opens the page: introduction, illustration, then the recorded flight */
          ? telloStory(p) + recordedBlock(p)
          : '<header class="ph"><div class="wrap">' +
              '<div class="ph__meta">' + chip(p.status) +
                '<span class="ph__year">' + esc(p.year) + "</span>" +
                '<span class="ph__year">' + (p.tags || []).map(esc).join(" / ") + "</span>" +
              "</div>" +
              "<h1>" + esc(p.title) + "</h1>" +
              '<p class="ph__kicker">' + esc(p.kicker) + "</p>" +
              '<p class="ph__statusline">' + esc(p.statusLine) + "</p>" +
            "</div></header>" +
            block("In short", "<p>" + esc(p.summary) + "</p>" + linkButtons(p.links))) +
        caveats +
        explainer +
        dataviz +
        explainerAfter +
        (p.built && p.built.length ? block("What I built", builtList) : "") +
        evidenceBlock +
        (p.hardest ? block("The hardest problem",
          '<h3 class="hard__title">' + esc(p.hardest.title) + "</h3>" +
          '<div class="hard__body"><p>' + esc(p.hardest.body) + "</p></div>", "hardest") : "") +
        (p.next && p.next.length ? block("What I'm doing next", nextList) : "") +
        pager +
      "</main>" + footer();

    if (p.dataviz) loadViz(root.querySelector("[data-viz]"), p.dataviz, s.glyph);
  }

  /* loads the results data and the drawing code as ordinary <script> tags, so it
     works on any static host and even from file:// (no fetch). */
  function loadViz(el, cfg, glyphKind) {
    function load(src, done) {
      var t = document.createElement("script");
      t.src = src;
      t.onload = done;
      t.onerror = function () {
        el.innerHTML = '<p class="viz__loading">Could not load <code>' + esc(src) +
          "</code>. Run <code>python export_results.py</code> in lunar-rl/ to regenerate it.</p>";
      };
      document.body.appendChild(t);
    }
    load(cfg.data, function () {
      load(cfg.script, function () {
        var D = window[cfg.global];
        if (D && window.LunarRLViz) window.LunarRLViz.render(el, D, { media: cfg.media, glyph: glyph(glyphKind) });
      });
    });
  }

  /* the recorded clip decides its own column: portrait stays narrow, landscape goes wide */
  function sizeRecorded(root) {
    var v = root.querySelector(".recorded video");
    if (!v) return;
    var apply = function () {
      if (v.videoWidth > v.videoHeight) v.closest(".recorded__grid").classList.add("is-wide");
    };
    if (v.readyState >= 1) apply(); else v.addEventListener("loadedmetadata", apply, { once: true });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var root = document.getElementById("app");
    if (!root) return;
    if (root.dataset.page === "project") renderProject(root);
    else renderHome(root);
    sizeRecorded(root);
    /* scenes/boot.js waits for this before looking for [data-scene] */
    window.PORTFOLIO_RENDERED = true;
    document.dispatchEvent(new Event("portfolio:rendered"));
  });
})();
