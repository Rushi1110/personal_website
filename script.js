(() => {
  "use strict";

  const root = document.documentElement;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const MINUS = "−";

  /* ---------------- Basics ---------------- */
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  const themeBtn = $("#theme-btn");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  themeBtn?.addEventListener("click", () => {
    const current = root.dataset.theme || (prefersDark.matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    themeBtn.classList.toggle("is-spinning");
    try { localStorage.setItem("theme", next); } catch (e) {}
  });

  const bar = $("#bar");
  const copyBtn = $("#copy-email");
  copyBtn?.addEventListener("click", () => {
    const email = $("#email").textContent.trim();
    const done = (msg) => {
      copyBtn.textContent = msg;
      setTimeout(() => { copyBtn.textContent = "Copy email"; }, 1800);
    };
    const selectIt = () => {
      const range = document.createRange();
      range.selectNodeContents($("#email"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      done("Selected, press Ctrl+C");
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(email).then(() => done("Copied"), selectIt);
    } else {
      selectIt();
    }
  });

  /* ---------------- Word streaming (LLM-style) ---------------- */
  function splitWords(el) {
    const words = el.textContent.trim().split(/\s+/);
    el.textContent = "";
    return words.map((w, i) => {
      const s = document.createElement("span");
      s.className = "w";
      s.textContent = w;
      el.appendChild(s);
      if (i < words.length - 1) el.appendChild(document.createTextNode(" "));
      return s;
    });
  }

  async function stream(container, spans, { speed = 32, caret = true } = {}) {
    container.classList.add("is-streaming");
    spans.forEach((s) => s.classList.remove("on"));
    let c = null;
    if (caret) {
      c = document.createElement("span");
      c.className = "caret";
      c.setAttribute("aria-hidden", "true");
    }
    for (const s of spans) {
      s.classList.add("on");
      if (c) s.after(c);
      // token-like jitter: short words arrive faster
      await wait(speed * (0.45 + Math.min(s.textContent.length, 9) * 0.12) * (0.7 + Math.random() * 0.6));
    }
    container.classList.remove("is-streaming");
    if (c) {
      c.classList.add("is-done");
      setTimeout(() => c.remove(), 3200);
    }
  }

  /* ---------------- Variable-font proximity type ---------------- */
  class ProxType {
    constructor(el) {
      this.el = el;
      this.letters = [];
      this.base = { w: 100, g: 800 };
      this.pointer = null;
      this.running = false;
      this.visible = true;
      $$(".line", el).forEach((line) => this.split(line));
      this.loop = this.loop.bind(this);
    }

    split(node) {
      Array.from(node.childNodes).forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (ch === " ") { frag.appendChild(document.createTextNode(" ")); continue; }
            const s = document.createElement("span");
            s.className = "ch";
            s.setAttribute("aria-hidden", "true");
            s.textContent = ch;
            frag.appendChild(s);
            this.letters.push({ el: s, w: this.base.w, g: this.base.g, tw: this.base.w, tg: this.base.g });
          }
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE) {
          this.split(child);
        }
      });
    }

    compress() {
      this.letters.forEach((l) => {
        l.w = l.tw = 62;
        l.g = l.tg = 200;
        l.introPending = true;
        this.write(l);
      });
    }

    intro(startDelay = 0) {
      this.compress();
      this.letters.forEach((l, i) => {
        setTimeout(() => { l.introPending = false; l.tw = this.base.w; l.tg = this.base.g; this.kick(); }, startDelay + i * 32);
      });
      this.kick();
    }

    enablePointer() {
      if (!finePointer) return;
      window.addEventListener("pointermove", (e) => {
        this.pointer = { x: e.clientX, y: e.clientY };
        if (this.visible) this.kick();
      }, { passive: true });
      document.addEventListener("pointerleave", () => { this.pointer = null; this.kick(); });
      new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; if (!this.visible) { this.pointer = null; this.kick(); } })
        .observe(this.el);
    }

    kick() {
      if (!this.running) { this.running = true; requestAnimationFrame(this.loop); }
    }

    write(l) {
      l.el.style.fontVariationSettings = `"wdth" ${l.w.toFixed(1)}, "wght" ${Math.round(l.g)}`;
    }

    loop() {
      const p = this.pointer;
      if (p && this.visible) {
        const size = parseFloat(getComputedStyle(this.el).fontSize) || 100;
        const R = size * 2;
        const rects = this.letters.map((l) => l.el.getBoundingClientRect());
        this.letters.forEach((l, i) => {
          if (l.introPending) return;
          const r = rects[i];
          const dx = p.x - (r.left + r.width / 2);
          const dy = p.y - (r.top + r.height / 2);
          const d = Math.hypot(dx, dy);
          const t = clamp(1 - d / R, 0, 1);
          const inf = t * t * (3 - 2 * t);
          l.tw = this.base.w + 25 * inf;
          l.tg = this.base.g + 100 * inf;
        });
      } else if (!p) {
        this.letters.forEach((l) => {
          if (l.introPending) return;
          if (l.tw > this.base.w) l.tw = this.base.w;
          if (l.tg > this.base.g) l.tg = this.base.g;
        });
      }
      let moving = false;
      for (const l of this.letters) {
        const dw = l.tw - l.w, dg = l.tg - l.g;
        if (Math.abs(dw) > 0.05 || Math.abs(dg) > 0.5) {
          l.w += dw * 0.14;
          l.g += dg * 0.14;
          moving = true;
        } else {
          l.w = l.tw; l.g = l.tg;
        }
        this.write(l);
      }
      if (moving || (p && this.visible)) {
        requestAnimationFrame(this.loop);
      } else {
        this.running = false;
      }
    }
  }

  /* ---------------- Count-up ---------------- */
  function setCount(el, v) {
    const dec = +(el.dataset.decimals || 0);
    el.textContent = v.toFixed(dec);
  }
  function countUp(el, dur = 1400) {
    const from = +(el.dataset.from || 0);
    const to = +el.dataset.count;
    const t0 = performance.now();
    const tick = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      setCount(el, from + (to - from) * easeOut(t));
      if (t < 1) requestAnimationFrame(tick);
    };
    setCount(el, from);
    requestAnimationFrame(tick);
  }

  /* ---------------- Scatter (OLA) ---------------- */
  function buildScatter(svg) {
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    };

    // Deterministic points whose R² against y = x is exactly the model's 0.83
    let seed = 20240711;
    const rand = () => {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const n = 38;
    const xs = Array.from({ length: n }, () => 0.14 + 0.72 * rand());
    const es = Array.from({ length: n }, gauss);
    const r2For = (k) => {
      const ys = xs.map((x, i) => x + k * es[i]);
      const mean = ys.reduce((a, b) => a + b, 0) / n;
      const tot = ys.reduce((a, y) => a + (y - mean) ** 2, 0);
      const res = ys.reduce((a, y, i) => a + (y - xs[i]) ** 2, 0);
      return { ys, r2: 1 - res / tot };
    };
    let lo = 0, hi = 0.5;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (r2For(mid).r2 > 0.83) lo = mid; else hi = mid;
    }
    const { ys, r2 } = r2For((lo + hi) / 2);

    const all = xs.concat(ys);
    const dMin = Math.min(...all) - 0.04, dMax = Math.max(...all) + 0.04;
    const L = 34, R = 308, T = 10, B = 262;
    const sx = (v) => L + ((v - dMin) / (dMax - dMin)) * (R - L);
    const sy = (v) => B - ((v - dMin) / (dMax - dMin)) * (B - T);

    for (let i = 1; i < 4; i++) {
      const gx = L + (i / 4) * (R - L), gy = T + (i / 4) * (B - T);
      mk("line", { x1: gx, y1: T, x2: gx, y2: B, class: "ax" });
      mk("line", { x1: L, y1: gy, x2: R, y2: gy, class: "ax" });
    }
    mk("path", { d: `M${L} ${T}V${B}H${R}`, class: "ax ax-strong" });
    mk("line", { x1: sx(dMin), y1: sy(dMin), x2: sx(dMax), y2: sy(dMax), class: "diag" });
    mk("text", { x: R, y: B + 22, "text-anchor": "end", class: "ax-label" }, "SIMULATED →");
    mk("text", { x: L - 12, y: T, transform: `rotate(-90 ${L - 12} ${T})`, "text-anchor": "end", class: "ax-label" }, "PREDICTED →");
    xs.forEach((x, i) => {
      const c = mk("circle", { cx: sx(x).toFixed(1), cy: sy(ys[i]).toFixed(1), r: 3.4, class: "dot" });
      c.style.transitionDelay = `${120 + i * 22}ms`;
    });
    mk("text", { x: L + 14, y: T + 18, class: "r2-k" }, "R²");
    mk("text", { x: L + 14, y: T + 46, class: "r2" }, r2.toFixed(2));
  }

  /* ---------------- Gauge (Chakr) ---------------- */
  const gauge = { deg: (v) => (Math.abs(v) / 2) * 180 };
  function buildGauge(svg) {
    const NS = "http://www.w3.org/2000/svg";
    const cx = 160, cy = 170, r = 118;
    const mk = (tag, attrs, text, parent = svg) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      parent.appendChild(n);
      return n;
    };
    const th = (v) => Math.PI - (Math.abs(v) / 2) * Math.PI;
    const pt = (v, rr) => [cx + rr * Math.cos(th(v)), cy - rr * Math.sin(th(v))];
    const arc = (v1, v2, rr) => {
      const [x1, y1] = pt(v1, rr), [x2, y2] = pt(v2, rr);
      return `M${x1.toFixed(2)} ${y1.toFixed(2)}A${rr} ${rr} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
    };
    mk("path", { d: arc(0, -2, r), class: "g-track" });
    mk("path", { d: arc(-1.35, -1.7, r), class: "g-band" });
    [0, -0.5, -1, -1.5, -2].forEach((v) => {
      const [x1, y1] = pt(v, r + 11), [x2, y2] = pt(v, r + 18);
      mk("line", { x1, y1, x2, y2, class: "g-tick" });
      const label = v === 0 ? "0 V" : `${MINUS}${Math.abs(v).toFixed(1)}`;
      // end labels sit under the arc ends; the rest sit outside the ticks
      const [lx, ly] = (v === 0 || v === -2) ? pt(v, r) : pt(v, r + 32);
      const dy = (v === 0 || v === -2) ? 26 : 3;
      mk("text", { x: lx, y: ly + dy, "text-anchor": "middle", class: "ax-label" }, label);
    });
    const [gx1, gy1] = pt(-1.35, r - 24), [gx2, gy2] = pt(-1.35, r + 8), [glx, gly] = pt(-1.35, r - 48);
    mk("line", { x1: gx1, y1: gy1, x2: gx2, y2: gy2, class: "g-ghost" });
    mk("text", { x: glx, y: gly, "text-anchor": "middle", class: "g-ghost-label" }, `start ${MINUS}1.35`);
    const g = mk("g", { class: "g-needle-grp", id: "needle" });
    mk("line", { x1: cx, y1: cy, x2: cx - (r - 30), y2: cy, class: "g-needle" }, null, g);
    mk("circle", { cx, cy, r: 6, class: "g-hub" }, null, g);
    g.style.transform = `rotate(${gauge.deg(-1.7)}deg)`;
  }
  function setGaugeValue(v, animate) {
    const needle = $("#needle");
    const out = $("#gauge-v");
    if (!needle || !out) return;
    if (!animate) {
      needle.style.transition = "none";
      needle.style.transform = `rotate(${gauge.deg(v)}deg)`;
      out.textContent = `${MINUS}${Math.abs(v).toFixed(2)}`;
      needle.getBoundingClientRect();
      needle.style.transition = "";
      return;
    }
    const from = -1.35, to = v, dur = 1600, t0 = performance.now();
    needle.style.transform = `rotate(${gauge.deg(to)}deg)`;
    const tick = (now) => {
      const t = clamp((now - t0) / dur, 0, 1);
      const e = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
      out.textContent = `${MINUS}${Math.abs(from + (to - from) * e).toFixed(2)}`;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const scatterSvg = $("#scatter");
  if (scatterSvg) buildScatter(scatterSvg);
  const gaugeSvg = $("#gauge");
  if (gaugeSvg) buildGauge(gaugeSvg);

  /* ---------------- Ananya trace playback ---------------- */
  const trace = $("#trace");
  const traceBody = $("#trace-body");
  const replayBtn = $("#replay");
  const agentMsgs = $$("[data-stream-msg] p", trace || document).map((p) => ({ p, spans: splitWords(p) }));
  let tracePlaying = false;

  async function playTrace() {
    if (!trace || tracePlaying) return;
    tracePlaying = true;
    replayBtn.disabled = true;
    traceBody.style.minHeight = `${traceBody.offsetHeight}px`;
    const items = $$(":scope > li", traceBody);
    trace.classList.add("is-playing");
    items.forEach((li) => li.classList.remove("shown", "is-running"));
    await wait(350);
    for (const li of items) {
      if (li.classList.contains("tool")) {
        li.classList.add("shown", "is-running");
        await wait(+(li.dataset.ms || 600));
        li.classList.remove("is-running");
        await wait(220);
      } else if (li.hasAttribute("data-stream-msg")) {
        const typing = document.createElement("li");
        typing.className = "shown";
        typing.setAttribute("aria-hidden", "true");
        typing.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
        li.before(typing);
        await wait(650);
        typing.remove();
        const m = agentMsgs.find((a) => li.contains(a.p));
        m.spans.forEach((s) => s.classList.remove("on"));
        li.classList.add("shown");
        await stream(li, m.spans, { speed: 26, caret: false });
        await wait(450);
      } else {
        li.classList.add("shown");
        await wait(900);
      }
    }
    tracePlaying = false;
    replayBtn.disabled = false;
  }
  replayBtn?.addEventListener("click", playTrace);

  /* ---------------- Hero sequence ---------------- */
  const heroHead = $(".headline[data-prox]");
  const ctaHead = $(".cta-head[data-prox]");
  const intro = $("[data-stream]");
  const telemetry = $(".telemetry");

  let heroProx = null, ctaProx = null;
  if (!reduce) {
    if (heroHead) { heroProx = new ProxType(heroHead); heroProx.intro(120); heroProx.enablePointer(); }
    if (ctaHead) { ctaProx = new ProxType(ctaHead); ctaProx.enablePointer(); }
    if (intro) {
      const spans = splitWords(intro);
      intro.classList.add("is-streaming");
      setTimeout(() => stream(intro, spans, { speed: 30 }), 650);
    }
  }

  /* ---------------- Magnetic buttons ---------------- */
  if (finePointer && !reduce) {
    $$(".btn").forEach((b) => {
      b.addEventListener("pointermove", (e) => {
        const r = b.getBoundingClientRect();
        b.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 8}px`);
        b.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 6}px`);
      });
      b.addEventListener("pointerleave", () => { b.style.setProperty("--mx", "0px"); b.style.setProperty("--my", "0px"); });
    });
  }

  /* ---------------- Scroll: bar, rail, chapters ---------------- */
  const railFill = $("#rail-fill");
  const chaptersWrap = $("#chapters");
  const chapters = $$(".chapter");
  let ticking = false;
  function onScroll() {
    ticking = false;
    bar?.classList.toggle("is-scrolled", window.scrollY > 10);
    if (chaptersWrap && railFill) {
      const r = chaptersWrap.getBoundingClientRect();
      const line = window.innerHeight * 0.6;
      const p = clamp((line - r.top) / r.height, 0, 1);
      railFill.style.setProperty("--p", reduce ? 1 : p.toFixed(4));
      chapters.forEach((c) => {
        const top = c.getBoundingClientRect().top + 60;
        c.classList.toggle("is-reached", top < line);
      });
    }
  }
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  /* ---------------- Active nav link ---------------- */
  const navLinks = $$(".nav a");
  if ("IntersectionObserver" in window) {
    const navObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        navLinks.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === `#${e.target.id}`));
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    ["ananya", "path", "principles", "contact"].forEach((id) => { const s = document.getElementById(id); if (s) navObs.observe(s); });
  }

  /* ---------------- Arm / play choreography ----------------
     Everything is visible at rest. An element is only hidden ("armed")
     while it is still below the fold, then plays as it scrolls in. */
  const handlers = new Map([
    [telemetry, {
      play: () => $$("[data-count]", telemetry).forEach((el, i) => setTimeout(() => countUp(el), i * 120)),
      arm: () => $$("[data-count]", telemetry).forEach((el) => setCount(el, +(el.dataset.from || 0))),
    }],
    [$(".outcome"), {
      play: () => $$("[data-count]", $(".outcome")).forEach((el) => countUp(el, 1600)),
      arm: () => $$("[data-count]", $(".outcome")).forEach((el) => setCount(el, +(el.dataset.from || 0))),
    }],
    [trace, { play: () => setTimeout(playTrace, 250) }],
    [$(".viz-gauge"), { arm: () => setGaugeValue(-1.35, false), play: () => setTimeout(() => setGaugeValue(-1.7, true), 350) }],
  ]);

  const anims = $$("[data-anim]");
  if (reduce || !("IntersectionObserver" in window)) {
    return;
  }

  const state = new WeakMap();
  const armObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const el = e.target;
      if (!e.isIntersecting || state.has(el)) return;
      if (e.boundingClientRect.top > window.innerHeight) {
        state.set(el, "armed");
        el.classList.add("is-armed");
        handlers.get(el)?.arm?.();
      } else {
        state.set(el, "static");
      }
      armObs.unobserve(el);
    });
  }, { rootMargin: "0px 0px 40% 0px" });

  const playObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const el = e.target;
      if (!e.isIntersecting) return;
      const s = state.get(el);
      if (s === "static") { playObs.unobserve(el); return; }
      if (s !== "armed") return;
      state.set(el, "played");
      playObs.unobserve(el);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        el.classList.remove("is-armed");
        handlers.get(el)?.play?.();
      }));
    });
  }, { threshold: 0.18 });

  anims.forEach((el) => { armObs.observe(el); playObs.observe(el); });

  // Hero telemetry and the closing headline get their moment on load / arrival
  if (telemetry && telemetry.getBoundingClientRect().top < window.innerHeight) {
    const cells = $$("[data-count]", telemetry);
    cells.forEach((el) => setCount(el, +(el.dataset.from || 0)));
    setTimeout(() => cells.forEach((el, i) => setTimeout(() => countUp(el), i * 120)), 900);
  }
  if (ctaProx && ctaHead.getBoundingClientRect().top > window.innerHeight) {
    ctaProx.compress();
    let done = false;
    const ctaObs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done) { done = true; ctaProx.intro(0); ctaObs.disconnect(); }
    }, { threshold: 0.6 });
    ctaObs.observe(ctaHead);
  }
})();
