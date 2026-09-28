(() => {
  "use strict";

  /* =========================================================
     Helpers
     ========================================================= */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const root = document.documentElement;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const MINUS = "−";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  };

  function animate(dur, step, ease = easeInOut) {
    return new Promise((res) => {
      if (reduce || dur <= 0) { step(1); res(); return; }
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const keep = step(ease(t));
        if (keep === false) { res(); return; }
        if (t < 1) requestAnimationFrame(tick); else res();
      };
      requestAnimationFrame(tick);
    });
  }

  /* =========================================================
     Elements + state
     ========================================================= */
  const app = $("#app");
  const viewport = $("#viewport");
  const world = $("#world");
  const frames = $$("[data-frame]");
  const byId = (id) => document.getElementById(id);
  const PANEL_ORDER = ["hello", "roadmap", "ola", "chakr", "ananya", "metrics", "principles", "beyond", "contact"];

  const state = {
    board: false,
    tool: "move",
    cam: { x: 0, y: 0, z: 1 },
    flight: 0,
    touring: false,
    step: 0,
    space: false,
  };
  const isBoard = () => state.board;
  const vw = () => viewport.clientWidth;
  const vh = () => viewport.clientHeight;

  /* =========================================================
     Theme
     ========================================================= */
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  $("#theme-btn").addEventListener("click", () => {
    const cur = root.dataset.theme || (prefersDark.matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    cell.readColors();
  });

  /* =========================================================
     Frame layout
     ========================================================= */
  frames.forEach((f) => {
    f.style.setProperty("--fx", `${f.dataset.x}px`);
    f.style.setProperty("--fy", `${f.dataset.y}px`);
    f.style.setProperty("--fw", `${f.dataset.w}px`);
  });
  let rects = {};
  let bounds = { x: -1400, y: -1000, w: 3200, h: 2800 };
  function measure() {
    rects = {};
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    frames.forEach((f) => {
      const r = { x: +f.dataset.x, y: +f.dataset.y, w: +f.dataset.w, h: f.offsetHeight };
      rects[f.id] = r;
      x0 = Math.min(x0, r.x); y0 = Math.min(y0, r.y - 30);
      x1 = Math.max(x1, r.x + r.w); y1 = Math.max(y1, r.y + r.h);
    });
    bounds = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* =========================================================
     Camera
     ========================================================= */
  const pad = () => ({
    l: window.innerWidth > 1100 ? 250 : 28,
    r: 28,
    t: 44,
    b: window.innerWidth > 720 ? 96 : 110,
  });
  function camFor(r, maxZ = 1.1) {
    const p = pad();
    const z = clamp(Math.min((vw() - p.l - p.r) / r.w, (vh() - p.t - p.b) / r.h), 0.08, maxZ);
    const scx = p.l + (vw() - p.l - p.r) / 2;
    const scy = p.t + (vh() - p.t - p.b) / 2;
    return { x: r.x + r.w / 2 + (vw() / 2 - scx) / z, y: r.y + r.h / 2 + (vh() / 2 - scy) / z, z };
  }
  const frameRect = (id) => {
    const r = rects[id];
    return { x: r.x - 20, y: r.y - 40, w: r.w + 40, h: r.h + 60 };
  };
  const toWorld = (sx, sy) => ({ x: state.cam.x + (sx - vw() / 2) / state.cam.z, y: state.cam.y + (sy - vh() / 2) / state.cam.z });
  const toScreen = (wx, wy) => ({ x: vw() / 2 + (wx - state.cam.x) * state.cam.z, y: vh() / 2 + (wy - state.cam.y) * state.cam.z });
  const vpPoint = (e) => { const r = viewport.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };

  let dirty = false;
  function invalidate() {
    if (!dirty) { dirty = true; requestAnimationFrame(render); }
  }
  function render() {
    dirty = false;
    if (!isBoard()) return;
    const { x, y, z } = state.cam;
    const tx = vw() / 2 - x * z, ty = vh() / 2 - y * z;
    world.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${z})`;
    world.style.setProperty("--z", z);
    let gs = 24 * z;
    while (gs < 14) gs *= 2;
    viewport.style.setProperty("--gs", `${gs}px`);
    viewport.style.setProperty("--gx", `${((tx % gs) + gs) % gs}px`);
    viewport.style.setProperty("--gy", `${((ty % gs) + gs) % gs}px`);
    viewport.style.setProperty("--dz", clamp(z, 0.7, 1.4));
    $("#zoom-v").textContent = `${Math.round(z * 100)}%`;
    cursors.forEach((c) => c.place());
    minimap.place();
    panel.track();
  }

  function cancelFlight() { state.flight++; }
  function flyTo(target, dur = 1100) {
    const id = ++state.flight;
    const from = { ...state.cam };
    const dist = Math.hypot(target.x - from.x, target.y - from.y);
    const dip = clamp((dist * Math.min(from.z, target.z)) / (vw() * 1.6), 0, 0.5);
    const lz0 = Math.log(from.z), lz1 = Math.log(target.z);
    return animate(dur, (e) => {
      if (id !== state.flight) return false;
      state.cam.x = lerp(from.x, target.x, e);
      state.cam.y = lerp(from.y, target.y, e);
      state.cam.z = Math.exp(lerp(lz0, lz1, e)) * (1 - dip * Math.sin(Math.PI * e));
      invalidate();
    });
  }
  function zoomAt(sx, sy, factor) {
    const w = toWorld(sx, sy);
    const z = clamp(state.cam.z * factor, 0.08, 3);
    state.cam.z = z;
    state.cam.x = w.x - (sx - vw() / 2) / z;
    state.cam.y = w.y - (sy - vh() / 2) / z;
    invalidate();
  }

  function focusFrame(id) {
    frames.forEach((f) => f.classList.toggle("is-focus", f.id === id));
    clearTimeout(focusFrame.t);
    focusFrame.t = setTimeout(() => byId(id)?.classList.remove("is-focus"), 2200);
  }

  async function goto(id, { dur = 1100 } = {}) {
    if (!byId(id)) return;
    if (isBoard()) {
      focusFrame(id);
      await flyTo(camFor(frameRect(id)), dur);
    } else {
      byId(id).scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      await wait(500);
    }
  }
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-goto]");
    if (g) { e.preventDefault(); goto(g.dataset.goto); }
    const a = e.target.closest("[data-action]");
    if (a && a.dataset.action === "tour") tour.start();
  });

  /* =========================================================
     Pan / zoom / pinch / inertia
     ========================================================= */
  const pointers = new Map();
  let pan = null, pinch = null, inertia = 0;

  viewport.addEventListener("pointerdown", (e) => {
    if (!isBoard()) return;
    if (e.pointerType === "mouse" && e.button !== 0 && e.button !== 1) return;
    const interactive = e.target.closest("button, a, input, textarea, label, select, output, [data-drag], .phone-msgs, .bubble, .v-sticky, .scatter svg");
    const force = state.tool === "hand" || state.space || e.button === 1;
    if (state.tool === "sticky" && !interactive) {
      const p = vpPoint(e);
      notes.add(toWorld(p.x, p.y));
      setTool("move");
      return;
    }
    if (interactive && !force) return;
    e.preventDefault();
    cancelFlight();
    cancelAnimationFrame(inertia);
    pointers.set(e.pointerId, vpPoint(e));
    viewport.setPointerCapture(e.pointerId);
    if (pointers.size === 1) {
      const p = vpPoint(e);
      pan = { last: p, t: performance.now(), vx: 0, vy: 0 };
      app.classList.add("panning");
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y), z0: state.cam.z, w: toWorld(mid.x, mid.y) };
      pan = null;
    }
  });
  viewport.addEventListener("pointermove", (e) => {
    if (!pointers.has(e.pointerId)) return;
    const p = vpPoint(e);
    pointers.set(e.pointerId, p);
    if (pinch && pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const z = clamp(pinch.z0 * (Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0), 0.08, 3);
      state.cam.z = z;
      state.cam.x = pinch.w.x - (mid.x - vw() / 2) / z;
      state.cam.y = pinch.w.y - (mid.y - vh() / 2) / z;
      invalidate();
    } else if (pan) {
      const now = performance.now();
      const dx = p.x - pan.last.x, dy = p.y - pan.last.y;
      const dt = Math.max(1, now - pan.t);
      pan.vx = lerp(pan.vx, dx / dt, 0.4);
      pan.vy = lerp(pan.vy, dy / dt, 0.4);
      pan.last = p; pan.t = now;
      state.cam.x -= dx / state.cam.z;
      state.cam.y -= dy / state.cam.z;
      invalidate();
    }
  });
  const endPointer = (e) => {
    if (!pointers.has(e.pointerId)) return;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      app.classList.remove("panning");
      if (pan && !reduce && performance.now() - pan.t < 80 && Math.hypot(pan.vx, pan.vy) > 0.25) {
        let vx = pan.vx * 16, vy = pan.vy * 16;
        const glide = () => {
          vx *= 0.92; vy *= 0.92;
          state.cam.x -= vx / state.cam.z;
          state.cam.y -= vy / state.cam.z;
          invalidate();
          if (Math.hypot(vx, vy) > 0.3) inertia = requestAnimationFrame(glide);
        };
        inertia = requestAnimationFrame(glide);
      }
      pan = null;
    } else if (pointers.size === 1) {
      pan = { last: [...pointers.values()][0], t: performance.now(), vx: 0, vy: 0 };
    }
  };
  viewport.addEventListener("pointerup", endPointer);
  viewport.addEventListener("pointercancel", endPointer);

  viewport.addEventListener("wheel", (e) => {
    if (!isBoard()) return;
    const scroller = e.target.closest(".phone-msgs, textarea");
    if (scroller && scroller.scrollHeight > scroller.clientHeight && !e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    cancelFlight();
    cancelAnimationFrame(inertia);
    const p = vpPoint(e);
    if (e.ctrlKey || e.metaKey) {
      const k = e.deltaMode === 1 ? 0.05 : 0.01;
      zoomAt(p.x, p.y, clamp(Math.exp(-e.deltaY * k), 0.7, 1.4));
    } else {
      const k = e.deltaMode === 1 ? 16 : 1;
      state.cam.x += (e.deltaX * k) / state.cam.z;
      state.cam.y += (e.deltaY * k) / state.cam.z;
      invalidate();
    }
  }, { passive: false });

  // Safari trackpad pinch
  let gz = 1;
  viewport.addEventListener("gesturestart", (e) => { e.preventDefault(); gz = 1; });
  viewport.addEventListener("gesturechange", (e) => {
    e.preventDefault();
    const p = vpPoint(e);
    zoomAt(p.x, p.y, e.scale / gz);
    gz = e.scale;
  });

  $("#zoom-in").addEventListener("click", () => zoomAt(vw() / 2, vh() / 2, 1.25));
  $("#zoom-out").addEventListener("click", () => zoomAt(vw() / 2, vh() / 2, 0.8));
  $("#zoom-fit").addEventListener("click", () => flyTo(camFor(bounds, 1), 900));

  /* =========================================================
     Tools + keyboard
     ========================================================= */
  function setTool(t) {
    state.tool = t;
    $$(".tool").forEach((b) => b.classList.toggle("is-on", b.dataset.tool === t));
    app.classList.toggle("tool-hand", t === "hand");
    app.classList.toggle("tool-sticky", t === "sticky");
    if (t === "sticky") toast("Click anywhere on the board to add a sticky note");
  }
  $$(".tool").forEach((b) => b.addEventListener("click", () => setTool(b.dataset.tool)));

  const typing = () => {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
  };
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.touring) tour.end();
      else ananya.hush();
      if (typing()) document.activeElement.blur();
      return;
    }
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing())) {
      e.preventDefault();
      $("#ask-input").focus();
      return;
    }
    if (typing() || e.metaKey || e.ctrlKey || e.altKey) return;
    if (state.touring && (e.key === "ArrowRight" || e.key === "Enter")) { e.preventDefault(); tour.next(); return; }
    if (state.touring && e.key === "ArrowLeft") { e.preventDefault(); tour.back(); return; }
    const k = e.key.toLowerCase();
    if (k === "t") { tour.start(); return; }
    if (!isBoard()) return;
    if (k === "v") setTool("move");
    else if (k === "h") setTool("hand");
    else if (k === "s") setTool("sticky");
    else if (k === "=" || k === "+") zoomAt(vw() / 2, vh() / 2, 1.25);
    else if (k === "-") zoomAt(vw() / 2, vh() / 2, 0.8);
    else if (k === "0") flyTo(camFor(bounds, 1), 900);
    else if (/^[1-9]$/.test(k)) goto(PANEL_ORDER[+k - 1]);
    else if (k === " ") { e.preventDefault(); state.space = true; app.classList.add("space"); }
    else if (e.key.startsWith("Arrow")) {
      e.preventDefault();
      const s = 90 / state.cam.z;
      if (e.key === "ArrowLeft") state.cam.x -= s;
      if (e.key === "ArrowRight") state.cam.x += s;
      if (e.key === "ArrowUp") state.cam.y -= s;
      if (e.key === "ArrowDown") state.cam.y += s;
      invalidate();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (e.key === " ") { state.space = false; app.classList.remove("space"); }
  });

  /* =========================================================
     Toast
     ========================================================= */
  const toastEl = $("#toast");
  function toast(msg, ms = 2600) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    toastEl.style.animation = "none";
    toastEl.offsetHeight;
    toastEl.style.animation = "";
    clearTimeout(toast.t);
    toast.t = setTimeout(() => { toastEl.hidden = true; }, ms);
  }

  /* =========================================================
     Frames panel
     ========================================================= */
  const panel = {
    list: $("#panel-list"),
    build() {
      PANEL_ORDER.forEach((id, i) => {
        const li = document.createElement("li");
        const b = document.createElement("button");
        b.type = "button";
        b.dataset.goto = id;
        b.textContent = byId(id).dataset.title;
        b.title = `Press ${i + 1}`;
        li.appendChild(b);
        this.list.appendChild(li);
      });
    },
    track() {
      const c = state.cam;
      let best = null, bd = Infinity;
      for (const id in rects) {
        const r = rects[id];
        const d = Math.hypot(r.x + r.w / 2 - c.x, r.y + r.h / 2 - c.y);
        if (d < bd) { bd = d; best = id; }
      }
      if (best !== this.cur) {
        this.cur = best;
        $$("button", this.list).forEach((b) => b.classList.toggle("is-on", b.dataset.goto === best));
      }
    },
  };
  panel.build();

  /* =========================================================
     Minimap
     ========================================================= */
  const minimap = {
    el: $("#minimap"),
    view: $("#mm-view"),
    s: 1, ox: 0, oy: 0,
    build() {
      $$(".mm-frame", this.el).forEach((n) => n.remove());
      const W = 200, H = 132, m = 10;
      this.s = Math.min((W - m * 2) / bounds.w, (H - m * 2) / bounds.h);
      this.ox = m + (W - m * 2 - bounds.w * this.s) / 2 - bounds.x * this.s;
      this.oy = m + (H - m * 2 - bounds.h * this.s) / 2 - bounds.y * this.s;
      for (const id in rects) {
        const r = rects[id];
        const d = document.createElement("span");
        d.className = "mm-frame" + (byId(id).classList.contains("frame-open") ? " is-open" : "");
        Object.assign(d.style, { left: `${this.ox + r.x * this.s}px`, top: `${this.oy + r.y * this.s}px`, width: `${r.w * this.s}px`, height: `${r.h * this.s}px` });
        this.el.insertBefore(d, this.view);
      }
    },
    place() {
      const tl = toWorld(0, 0), br = toWorld(vw(), vh());
      Object.assign(this.view.style, {
        left: `${this.ox + tl.x * this.s}px`, top: `${this.oy + tl.y * this.s}px`,
        width: `${(br.x - tl.x) * this.s}px`, height: `${(br.y - tl.y) * this.s}px`,
      });
    },
    jump(e) {
      const r = this.el.getBoundingClientRect();
      const wx = (e.clientX - r.left - this.ox) / this.s;
      const wy = (e.clientY - r.top - this.oy) / this.s;
      flyTo({ x: wx, y: wy, z: state.cam.z }, 500);
    },
  };
  minimap.el.addEventListener("click", (e) => minimap.jump(e));
  minimap.el.addEventListener("keydown", (e) => { if (e.key === "Enter") flyTo(camFor(bounds, 1), 900); });

  /* =========================================================
     Connectors (hand-drawn arrows between frames)
     ========================================================= */
  function drawConnectors() {
    const svg = $("#connectors");
    const NS = "http://www.w3.org/2000/svg";
    svg.innerHTML = "";
    const R = rects;
    const side = (id, s, t = 0.5) => {
      const r = R[id];
      if (s === "r") return { x: r.x + r.w, y: r.y + r.h * t, dx: 1, dy: 0 };
      if (s === "l") return { x: r.x, y: r.y + r.h * t, dx: -1, dy: 0 };
      if (s === "b") return { x: r.x + r.w * t, y: r.y + r.h, dx: 0, dy: 1 };
      return { x: r.x + r.w * t, y: r.y - 34, dx: 0, dy: -1 };
    };
    const links = [
      { a: side("hello", "r", 0.3), b: side("ananya", "l", 0.62), label: "the agent I PM'd", lx: -10, ly: -22 },
      { a: side("ola", "b", 0.5), b: side("chakr", "t", 0.45), label: "ML meets hardware", lx: 18, ly: 6 },
      { a: side("chakr", "r", 0.3), b: side("principles", "l", 0.35), label: "lessons", lx: -30, ly: -16 },
      { a: side("ananya", "b", 0.3), b: side("metrics", "t", 0.3), label: "what it moved", lx: 18, ly: 6 },
      { a: side("roadmap", "b", 0.5), b: side("hello", "t", 0.5), label: "", lx: 0, ly: 0 },
    ];
    links.forEach(({ a, b, label, lx, ly }) => {
      const k = Math.max(60, Math.hypot(b.x - a.x, b.y - a.y) * 0.4);
      const c1 = { x: a.x + a.dx * k, y: a.y + a.dy * k + 6 };
      const c2 = { x: b.x + b.dx * k, y: b.y + b.dy * k - 6 };
      const s = { x: a.x + a.dx * 10, y: a.y + a.dy * 10 };
      const e = { x: b.x + b.dx * 12, y: b.y + b.dy * 12 };
      const path = document.createElementNS(NS, "path");
      path.setAttribute("d", `M${s.x} ${s.y} C${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${e.x} ${e.y}`);
      svg.appendChild(path);
      const ang = Math.atan2(e.y - c2.y, e.x - c2.x);
      const hl = 16, spread = 0.5;
      const head = document.createElementNS(NS, "path");
      head.setAttribute("d", `M${e.x - hl * Math.cos(ang - spread)} ${e.y - hl * Math.sin(ang - spread)} L${e.x} ${e.y} L${e.x - hl * Math.cos(ang + spread)} ${e.y - hl * Math.sin(ang + spread)}`);
      svg.appendChild(head);
      if (label) {
        const t = 0.5, mt = 1 - t;
        const mx = mt ** 3 * s.x + 3 * mt * mt * t * c1.x + 3 * mt * t * t * c2.x + t ** 3 * e.x;
        const my = mt ** 3 * s.y + 3 * mt * mt * t * c1.y + 3 * mt * t * t * c2.y + t ** 3 * e.y;
        const tx = document.createElementNS(NS, "text");
        tx.setAttribute("x", mx + lx);
        tx.setAttribute("y", my + ly);
        tx.textContent = label;
        svg.appendChild(tx);
      }
    });
  }

  /* =========================================================
     Cursors
     ========================================================= */
  class Cursor {
    constructor(el) { this.el = el; this.x = 0; this.y = 0; this.visible = false; this.moveId = 0; }
    place() {
      if (!isBoard()) return;
      const s = toScreen(this.x, this.y);
      this.el.style.setProperty("--sx", `${s.x}px`);
      this.el.style.setProperty("--sy", `${s.y}px`);
      this.el.classList.toggle("flip", s.x > vw() - 360);
      this.el.classList.toggle("lift", s.y > vh() - 260);
    }
    jump(x, y) { this.x = x; this.y = y; this.place(); }
    moveTo(x, y, dur = 900) {
      const id = ++this.moveId;
      const fx = this.x, fy = this.y;
      const bend = (Math.random() - 0.5) * 0.35;
      const cx = (fx + x) / 2 + (y - fy) * bend, cy = (fy + y) / 2 - (x - fx) * bend;
      return animate(dur, (e) => {
        if (id !== this.moveId) return false;
        const m = 1 - e;
        this.x = m * m * fx + 2 * m * e * cx + e * e * x;
        this.y = m * m * fy + 2 * m * e * cy + e * e * y;
        this.place();
      });
    }
    show(v) { this.visible = v; this.el.classList.toggle("is-away", !v); }
  }
  const curR = new Cursor($("#cur-r"));
  const curA = new Cursor($("#cur-a"));
  const cursors = [curR, curA];
  curR.show(false); curA.show(false);

  // world position of an element's point (relative 0..1 of its box)
  function worldOf(el, fx = 0.5, fy = 0.5) {
    const r = el.getBoundingClientRect();
    const v = viewport.getBoundingClientRect();
    return toWorld(r.left - v.left + r.width * fx, r.top - v.top + r.height * fy);
  }

  // Rushabh's cursor: a replay that drifts between things he'd point at
  const wander = {
    spots: ["#hello .hello-name", ".rm-bar[data-rm='jumbo']", "#ananya .doc-title", "#metrics .kpi", "#ocp", "#principles .sticky.c-green", "#scatter", "#contact .note-card"],
    i: 0,
    timer: 0,
    started: false,
    start() {
      if (reduce || this.started) return;
      this.started = true;
      curR.show(true);
      const t = worldOf($(this.spots[0]), 0.7, 0.9);
      curR.jump(t.x + 200, t.y + 160);
      this.tick();
    },
    async tick() {
      if (!isBoard()) { this.timer = setTimeout(() => this.tick(), 3000); return; }
      const el = $(this.spots[this.i % this.spots.length]);
      this.i++;
      const p = worldOf(el, 0.3 + Math.random() * 0.5, 0.3 + Math.random() * 0.5);
      await curR.moveTo(p.x, p.y, 1600 + Math.random() * 900);
      this.timer = setTimeout(() => this.tick(), 3800 + Math.random() * 3200);
    },
  };

  /* =========================================================
     Ananya: bubble + speech
     ========================================================= */
  const bubble = $("#bubble");
  const bubbleText = $("#bubble-text");
  const bubbleActions = $("#bubble-actions");
  const ananya = {
    sayId: 0,
    async say(text, actions = []) {
      const id = ++this.sayId;
      bubble.hidden = false;
      bubble.style.animation = "none"; bubble.offsetHeight; bubble.style.animation = "";
      bubbleActions.innerHTML = "";
      bubbleText.textContent = "";
      const words = text.split(" ");
      const spans = words.map((w, i) => {
        const s = document.createElement("span");
        s.className = "w off";
        s.textContent = w + (i < words.length - 1 ? " " : "");
        bubbleText.appendChild(s);
        return s;
      });
      for (const s of spans) {
        if (id !== this.sayId) return;
        s.classList.remove("off");
        if (!reduce) await new Promise((r) => setTimeout(r, 22 + Math.random() * 30));
      }
      if (id !== this.sayId) return;
      actions.forEach((a) => {
        if (a.step) {
          const s = document.createElement("span");
          s.className = "step";
          s.textContent = a.step;
          bubbleActions.appendChild(s);
          return;
        }
        const b = document.createElement("button");
        b.type = "button";
        b.className = "b-btn" + (a.primary ? " b-primary" : "");
        b.textContent = a.label;
        b.addEventListener("click", a.run);
        bubbleActions.appendChild(b);
      });
      const first = bubbleActions.querySelector(".b-primary");
      if (first && state.touring) first.focus({ preventScroll: true });
    },
    hush() {
      this.sayId++;
      bubble.hidden = true;
    },
    async pointAt(el, fx = 0.2, fy = 0.5) {
      if (!isBoard()) return;
      const p = worldOf(el, fx, fy);
      if (!curA.visible) {
        curA.jump(p.x + 260 / state.cam.z, p.y + 200 / state.cam.z);
        curA.show(true);
      }
      await curA.moveTo(p.x, p.y, 750);
    },
  };

  /* =========================================================
     Tour
     ========================================================= */
  const TOUR = [
    { id: "hello", at: ".hello-actions", fx: 0.1, text: "Hi, I'm Ananya, the AI agent Rushabh product-managed at Jumbo Homes. Let me walk you around his board." },
    { id: "roadmap", at: ".rm-bar[data-rm='jumbo']", text: "Four years, three industries: electric vehicles, batteries, then AI for real estate. Click any bar for the details." },
    { id: "ola", at: "#scatter", fx: 0.55, fy: 0.45, text: "At OLA Electric he built a model that predicts crash-injury scores. R² of 0.83, and 500 compute hours saved per design iteration." },
    { id: "chakr", at: "#ocp", fx: 0.1, text: "Then a moonshot: aluminium-air batteries. Drag this slider to see what moving the anode from −1.35 V to −1.70 V did." },
    { id: "ananya", at: "#phone-chips", fx: 0.2, fy: 0.4, text: "Then me. I shortlist homes, check commutes and schools, and book the site visit. Tap a buyer message to watch my tool calls." },
    { id: "metrics", at: ".seg", text: "His first year at Jumbo: ARR up about 5×, supply up 8×, 11 micro-markets. Flip the toggle to compare." },
    { id: "principles", at: ".sticky.c-violet", fx: 0.3, fy: 0.3, text: "What he learned along the way. Go ahead, drag the stickies around." },
    { id: "contact", at: "#note", fx: 0.3, fy: 0.3, text: "That's the tour. Leave him a note on the sticky, or grab his email. You can also ask me anything below." },
  ];
  const tour = {
    async show(i) {
      state.step = i;
      const s = TOUR[i];
      ananya.hush();
      await goto(s.id, { dur: 1150 });
      if (!state.touring || state.step !== i) return;
      await ananya.pointAt($(s.at, byId(s.id)), s.fx ?? 0.2, s.fy ?? 0.5);
      if (!state.touring || state.step !== i) return;
      const last = i === TOUR.length - 1;
      const acts = [{ step: `${i + 1} / ${TOUR.length}` }];
      if (i > 0) acts.push({ label: "Back", run: () => tour.back() });
      acts.push(last ? { label: "Finish", primary: true, run: () => tour.end() } : { label: "Next", primary: true, run: () => tour.next() });
      if (!last) acts.push({ label: "End", run: () => tour.end() });
      ananya.say(s.text, acts);
    },
    start() {
      state.touring = true;
      $("#tour-btn").textContent = "End tour";
      this.show(0);
    },
    next() { if (state.step < TOUR.length - 1) this.show(state.step + 1); else this.end(); },
    back() { if (state.step > 0) this.show(state.step - 1); },
    end() {
      state.touring = false;
      $("#tour-btn").textContent = "Take the tour";
      ananya.hush();
    },
  };
  $("#tour-btn").addEventListener("click", () => (state.touring ? tour.end() : tour.start()));

  /* =========================================================
     Ask Ananya
     ========================================================= */
  const INTENTS = [
    { id: "contact", at: "#note", keys: ["contact", "hire", "hiring", "email", "mail", "reach", "linkedin", "talk", "connect", "job", "role", "available", "call", "meet"],
      text: "The easiest way is email: rushabhparikh10@gmail.com. Or write on this sticky and send it straight to him." },
    { id: "ananya", at: "#phone-chips", keys: ["ananya", "agent", "agents", "agentic", "ship", "shipped", "built", "prd", "chatbot", "llm", "ai", "genai", "bot", "assistant"],
      text: "Ananya is the agentic home-buying assistant Rushabh product-managed. It lifted lead-to-visit from 4.5% to 10.3% in its first month. You can try me right here." },
    { id: "metrics", at: ".kpis", keys: ["metric", "metrics", "arr", "revenue", "growth", "numbers", "impact", "result", "results", "kpi", "kpis", "scale", "grew", "money"],
      text: "In one year at Jumbo: ARR went from ₹1.15 Cr to ₹6 Cr, homes closed from 4 to 21 a month, and listings grew 8× in his first quarter." },
    { id: "chakr", at: "#ocp", keys: ["battery", "batteries", "chakr", "aluminium", "aluminum", "r&d", "lab", "research", "deeptech", "deep", "hardware", "chemistry", "moonshot", "anode"],
      text: "At Chakr he led a six-person R&D team on aluminium-air batteries, and got 83% of pure-aluminium performance out of scrap. Try the slider." },
    { id: "ola", at: "#scatter", keys: ["ola", "crash", "ev", "evs", "electric", "vehicle", "vehicles", "ml", "machine", "model", "simulation", "hpc", "safety"],
      text: "At OLA Electric he built an ML model that predicts pedestrian crash-injury scores (R² 0.83), saving 500 compute hours per iteration." },
    { id: "principles", at: ".sticky.c-yellow", keys: ["why", "principle", "principles", "approach", "think", "thinks", "philosophy", "how", "pm", "style", "evals", "values", "believe"],
      text: "His rules of thumb: pick the metric before the model, treat evals as the spec, and count unit economics as part of the product." },
    { id: "roadmap", at: ".rm-bar[data-rm='ola']", keys: ["career", "journey", "experience", "background", "timeline", "resume", "cv", "history", "roadmap", "years", "worked", "companies"],
      text: "Four years across electric vehicles, batteries and AI for real estate, after mechanical engineering at IIT Guwahati." },
    { id: "beyond", at: ".b-item", keys: ["iit", "guwahati", "college", "education", "degree", "study", "studied", "racing", "sports", "cpi", "university", "gpa"],
      text: "B.Tech in Mechanical Engineering from IIT Guwahati, CPI 8.42. He also ran campus sports for 8,000+ students and raced with IITG Racing." },
    { id: "hello", at: ".hello-name", keys: ["who", "rushabh", "about", "hi", "hello", "hey", "intro", "yourself", "summary"],
      text: "Rushabh is an AI product manager in Bengaluru. He owns product at Jumbo Homes and came up through battery R&D and EV engineering." },
  ];
  function matchIntent(q) {
    const s = q.toLowerCase();
    const words = new Set(s.split(/[^a-z0-9&]+/).filter(Boolean));
    let best = null, score = 0;
    INTENTS.forEach((it) => {
      let n = 0;
      it.keys.forEach((k) => { if (words.has(k) || (k.length > 4 && s.includes(k))) n++; });
      if (n > score) { score = n; best = it; }
    });
    return best;
  }
  async function answer(q) {
    if (state.touring) tour.end();
    const it = matchIntent(q);
    if (!it) {
      if (isBoard() && !curA.visible) await ananya.pointAt($(".hello-actions"), 0.1, 0.5);
      ananya.say("I only know about Rushabh's work. Try asking about me (Ananya), his battery R&D, his results, or how to reach him.", [
        { label: "Ananya", run: () => answer("ananya") },
        { label: "Battery R&D", run: () => answer("battery") },
        { label: "Results", run: () => answer("metrics") },
        { label: "Contact", run: () => answer("contact") },
      ]);
      return;
    }
    ananya.hush();
    await goto(it.id, { dur: 1000 });
    await ananya.pointAt($(it.at, byId(it.id)), 0.25, 0.4);
    ananya.say(it.text, [
      { label: "Take the tour", primary: true, run: () => tour.start() },
      { label: "Close", run: () => ananya.hush() },
    ]);
  }
  $("#ask").addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("#ask-input");
    const q = inp.value.trim();
    if (!q) return;
    inp.value = "";
    inp.blur();
    answer(q);
  });

  /* =========================================================
     Draggable stickies (principles)
     ========================================================= */
  let zTop = 10;
  function makeDraggable(el, get, set, skip = "") {
    el.addEventListener("pointerdown", (e) => {
      if (!isBoard()) return;
      if (skip && e.target.closest(skip)) return;
      e.preventDefault();
      e.stopPropagation();
      const start = { x: e.clientX, y: e.clientY, ...get() };
      el.setPointerCapture(e.pointerId);
      el.classList.add("is-dragging");
      el.style.zIndex = ++zTop;
      const move = (ev) => {
        set(start.x0 + (ev.clientX - start.x) / state.cam.z, start.y0 + (ev.clientY - start.y) / state.cam.z);
      };
      const up = () => {
        el.classList.remove("is-dragging");
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        el.dispatchEvent(new CustomEvent("dropped"));
      };
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    });
  }
  $$(".sticky[data-drag]").forEach((el) => {
    makeDraggable(el,
      () => ({ x0: parseFloat(el.style.getPropertyValue("--x")), y0: parseFloat(el.style.getPropertyValue("--y")) }),
      (x, y) => { el.style.setProperty("--x", `${x}px`); el.style.setProperty("--y", `${y}px`); });
  });

  /* =========================================================
     Visitor sticky notes
     ========================================================= */
  const COLORS = ["c-yellow", "c-pink", "c-green", "c-blue", "c-violet", "c-orange"];
  const notes = {
    list: store.get("rp-board-notes", []),
    save() { store.set("rp-board-notes", this.list); updateMail(); },
    render(n) {
      const el = document.createElement("div");
      el.className = `v-sticky ${n.c}`;
      el.style.left = `${n.x}px`;
      el.style.top = `${n.y}px`;
      el.innerHTML = '<div class="v-sticky-top"><span>your note</span><button type="button" aria-label="Delete note">×</button></div><textarea aria-label="Your sticky note" placeholder="Type a note…"></textarea>';
      const ta = $("textarea", el);
      ta.value = n.text || "";
      ta.addEventListener("input", () => { n.text = ta.value; this.save(); });
      $("button", el).addEventListener("click", () => {
        el.remove();
        this.list = this.list.filter((m) => m !== n);
        this.save();
      });
      makeDraggable(el, () => ({ x0: n.x, y0: n.y }), (x, y) => { n.x = x; n.y = y; el.style.left = `${x}px`; el.style.top = `${y}px`; }, "textarea, button");
      el.addEventListener("dropped", () => this.save());
      world.appendChild(el);
      return el;
    },
    add(p) {
      const n = { x: p.x - 110, y: p.y - 20, c: COLORS[this.list.length % COLORS.length], text: "" };
      this.list.push(n);
      this.save();
      const el = this.render(n);
      setTimeout(() => $("textarea", el).focus({ preventScroll: true }), 50);
    },
    init() { this.list.forEach((n) => this.render(n)); },
  };
  notes.init();

  /* =========================================================
     Contact: note -> mailto, copy email
     ========================================================= */
  const EMAIL = "rushabhparikh10@gmail.com";
  function updateMail() {
    const main = $("#note").value.trim();
    const extra = notes.list.map((n) => n.text && n.text.trim()).filter(Boolean);
    const body = [main, ...extra.map((t) => `— ${t}`)].filter(Boolean).join("\n\n");
    $("#send-note").href = `mailto:${EMAIL}?subject=${encodeURIComponent("Hello from your portfolio board")}&body=${encodeURIComponent(body)}`;
    $("#note-count").textContent = extra.length
      ? `+ ${extra.length} note${extra.length > 1 ? "s" : ""} from the board`
      : "Notes you add to the board go too.";
  }
  $("#note").addEventListener("input", updateMail);
  updateMail();
  $("#copy-email").addEventListener("click", () => {
    const btn = $("#copy-email");
    const done = (m) => { btn.textContent = m; setTimeout(() => { btn.textContent = "Copy"; }, 1600); };
    const fallback = () => {
      const r = document.createRange();
      r.selectNodeContents($("#email"));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(r);
      done("Selected");
    };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(EMAIL).then(() => done("Copied"), fallback);
    else fallback();
  });

  /* =========================================================
     Roadmap
     ========================================================= */
  $$(".rm-bar").forEach((b) => b.addEventListener("click", () => {
    $$(".rm-bar").forEach((x) => x.classList.toggle("is-on", x === b));
    $$("[data-rm-detail]").forEach((d) => { d.hidden = d.dataset.rmDetail !== b.dataset.rm; });
  }));

  /* =========================================================
     OLA scatter (points fitted to R² = 0.83 against y = x)
     ========================================================= */
  (function scatter() {
    const svg = $("#scatter");
    const tip = $("#scatter-tip");
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, attrs, text) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      if (text != null) n.textContent = text;
      svg.appendChild(n);
      return n;
    };
    let seed = 20240711;
    const rand = () => {
      seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const gauss = () => Math.sqrt(-2 * Math.log(1 - rand())) * Math.cos(2 * Math.PI * rand());
    const n = 42;
    const xs = Array.from({ length: n }, () => 0.12 + 0.76 * rand());
    const es = Array.from({ length: n }, gauss);
    const fit = (k) => {
      const ys = xs.map((x, i) => x + k * es[i]);
      const m = ys.reduce((a, b) => a + b, 0) / n;
      const tot = ys.reduce((a, y) => a + (y - m) ** 2, 0);
      const res = ys.reduce((a, y, i) => a + (y - xs[i]) ** 2, 0);
      return { ys, r2: 1 - res / tot };
    };
    let lo = 0, hi = 0.5;
    for (let i = 0; i < 40; i++) { const mid = (lo + hi) / 2; if (fit(mid).r2 > 0.83) lo = mid; else hi = mid; }
    const { ys, r2 } = fit((lo + hi) / 2);
    const all = xs.concat(ys);
    const d0 = Math.min(...all) - 0.04, d1 = Math.max(...all) + 0.04;
    const L = 40, R = 390, T = 12, B = 262;
    const sx = (v) => L + ((v - d0) / (d1 - d0)) * (R - L);
    const sy = (v) => B - ((v - d0) / (d1 - d0)) * (B - T);
    for (let i = 1; i < 5; i++) {
      const gx = L + (i / 5) * (R - L), gy = T + (i / 5) * (B - T);
      mk("line", { x1: gx, y1: T, x2: gx, y2: B, class: "sc-grid" });
      mk("line", { x1: L, y1: gy, x2: R, y2: gy, class: "sc-grid" });
    }
    mk("path", { d: `M${L} ${T}V${B}H${R}`, class: "sc-axis" });
    mk("line", { x1: sx(d0), y1: sy(d0), x2: sx(d1), y2: sy(d1), class: "sc-diag" });
    mk("text", { x: R, y: B + 24, "text-anchor": "end", class: "sc-label" }, "simulated injury score →");
    mk("text", { x: L - 14, y: T, transform: `rotate(-90 ${L - 14} ${T})`, "text-anchor": "end", class: "sc-label" }, "predicted →");
    mk("text", { x: L + 16, y: T + 20, class: "sc-r2k" }, "R²");
    mk("text", { x: L + 16, y: T + 52, class: "sc-r2" }, r2.toFixed(2));
    const scale = (v) => (1 + 9 * (v - d0) / (d1 - d0)).toFixed(1);
    xs.forEach((x, i) => {
      const c = mk("circle", { cx: sx(x).toFixed(1), cy: sy(ys[i]).toFixed(1), r: 4, class: "sc-dot", tabindex: "-1" });
      const show = () => {
        const fig = svg.parentElement;
        const fr = fig.getBoundingClientRect(), cr = c.getBoundingClientRect();
        const k = fr.width / fig.offsetWidth || 1;
        tip.textContent = `design ${String(i + 1).padStart(2, "0")} · predicted ${scale(ys[i])} · simulated ${scale(x)}`;
        tip.style.left = `${(cr.left + cr.width / 2 - fr.left) / k}px`;
        tip.style.top = `${(cr.top - fr.top) / k}px`;
        tip.hidden = false;
      };
      c.addEventListener("pointerenter", show);
      c.addEventListener("pointerleave", () => { tip.hidden = true; });
    });
  })();

  /* =========================================================
     Chakr cell: bubbles = parasitic reactions (illustration)
     ========================================================= */
  const cell = {
    cv: $("#cell-canvas"),
    input: $("#ocp"),
    out: $("#ocp-v"),
    bubbles: [],
    electrons: [],
    t: 0,
    last: 0,
    spawn: 0,
    running: false,
    visible: false,
    colors: {},
    readColors() {
      const cs = getComputedStyle(root);
      const g = (v) => cs.getPropertyValue(v).trim();
      this.colors = { ink: g("--ink"), ink3: g("--ink-3"), line: g("--line-2"), paper: g("--paper"), r: g("--r"), a: g("--a"), blue: g("--c-blue") };
      this.draw();
    },
    level() { return (+this.input.value - 135) / 35; },
    init() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      this.cv.width = 640 * dpr; this.cv.height = 240 * dpr;
      this.ctx = this.cv.getContext("2d");
      this.ctx.scale(dpr, dpr);
      for (let i = 0; i < 6; i++) this.electrons.push(i / 6);
      this.readColors();
      this.input.addEventListener("input", () => {
        const v = +this.input.value / 100;
        this.out.textContent = `${MINUS}${v.toFixed(2)} V`;
        if (reduce) this.draw();
      });
      new IntersectionObserver(([e]) => {
        this.visible = e.isIntersecting;
        if (this.visible && !this.running && !reduce) { this.running = true; this.last = performance.now(); requestAnimationFrame((n) => this.loop(n)); }
      }).observe(this.cv);
    },
    loop(now) {
      const dt = Math.min(50, now - this.last) / 1000;
      this.last = now;
      const t = this.level();
      this.spawn += dt * lerp(26, 2.5, t);
      while (this.spawn > 1) {
        this.spawn -= 1;
        this.bubbles.push({ x: 152 + Math.random() * 10, y: 60 + Math.random() * 150, r: 2 + Math.random() * 4.5, vy: 30 + Math.random() * 40, ph: Math.random() * 6 });
      }
      this.bubbles.forEach((b) => { b.y -= b.vy * dt; b.x += (8 + Math.sin(b.ph + b.y / 14) * 14) * dt; });
      this.bubbles = this.bubbles.filter((b) => b.y > 44);
      const speed = lerp(0.12, 0.5, t);
      this.electrons = this.electrons.map((p) => (p + speed * dt) % 1);
      this.draw();
      if (this.visible && isVisibleTab()) requestAnimationFrame((n) => this.loop(n));
      else this.running = false;
    },
    draw() {
      const c = this.ctx, k = this.colors;
      if (!c) return;
      c.clearRect(0, 0, 640, 240);
      // electrolyte
      c.fillStyle = k.blue; c.globalAlpha = 0.28;
      c.fillRect(150, 44, 380, 180);
      c.globalAlpha = 1;
      // wire + load
      c.strokeStyle = k.ink; c.lineWidth = 2;
      c.beginPath(); c.moveTo(95, 44); c.lineTo(95, 22); c.lineTo(555, 22); c.lineTo(555, 44); c.stroke();
      c.fillStyle = k.paper; c.fillRect(300, 12, 80, 20); c.strokeRect(300, 12, 80, 20);
      c.fillStyle = k.ink; c.font = "600 11px Geist, system-ui, sans-serif"; c.textAlign = "center"; c.fillText("load", 340, 26);
      // electrons on the wire
      c.fillStyle = k.a;
      const pathLen = 22 + 460 + 22;
      this.electrons.forEach((p) => {
        let d = p * pathLen, x, y;
        if (d < 22) { x = 95; y = 44 - d; } else if (d < 482) { x = 95 + (d - 22); y = 22; } else { x = 555; y = 22 + (d - 482); }
        if (x > 298 && x < 382 && y === 22) return;
        c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fill();
      });
      // anode
      const g = c.createLinearGradient(40, 0, 150, 0);
      g.addColorStop(0, "#9aa1aa"); g.addColorStop(0.5, "#d9dde2"); g.addColorStop(1, "#a7aeb7");
      c.fillStyle = g; c.fillRect(40, 44, 110, 180);
      c.strokeStyle = k.ink; c.lineWidth = 1.5; c.strokeRect(40, 44, 110, 180);
      c.fillStyle = "#2a2e33"; c.font = "700 13px Geist, system-ui, sans-serif"; c.fillText("Al", 95, 132); c.font = "500 10px Geist, system-ui, sans-serif"; c.fillText("anode", 95, 148);
      // cathode mesh
      c.strokeStyle = k.ink3; c.lineWidth = 1;
      for (let y = 48; y < 224; y += 8) { c.beginPath(); c.moveTo(530, y); c.lineTo(580, y + 6); c.stroke(); }
      c.strokeStyle = k.ink; c.lineWidth = 1.5; c.strokeRect(530, 44, 50, 180);
      c.fillStyle = k.ink3; c.font = "500 10px Geist, system-ui, sans-serif";
      c.save(); c.translate(600, 134); c.rotate(-Math.PI / 2); c.fillText("air cathode  ·  O₂ in", 0, 0); c.restore();
      // bubbles
      c.strokeStyle = k.r; c.lineWidth = 1.4; c.fillStyle = k.paper;
      this.bubbles.forEach((b) => { c.beginPath(); c.arc(b.x, b.y, b.r, 0, Math.PI * 2); c.fill(); c.stroke(); });
      // legend
      c.textAlign = "left"; c.fillStyle = k.r; c.font = "600 12px 'Shantell Sans', cursive";
      c.fillText("bubbles = parasitic reactions", 300, 212);
    },
  };
  const isVisibleTab = () => document.visibilityState === "visible";
  document.addEventListener("visibilitychange", () => {
    if (isVisibleTab() && cell.visible && !cell.running && !reduce) { cell.running = true; cell.last = performance.now(); requestAnimationFrame((n) => cell.loop(n)); }
  });
  cell.init();

  /* =========================================================
     Metrics toggle
     ========================================================= */
  function fmt(kind, v, final, period) {
    if (kind === "cr") return `₹${final ? String(+v.toFixed(2)) : v.toFixed(2)} Cr`;
    if (kind === "plus") return final ? (period ? "800+" : "~100") : String(Math.round(v / 10) * 10);
    return String(Math.round(v));
  }
  $$(".seg-btn").forEach((btn) => btn.addEventListener("click", () => {
    const p = +btn.dataset.period;
    $$(".seg-btn").forEach((b) => { const on = b === btn; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    $$(".kpi").forEach((k) => {
      const from = +(k.dataset.cur ?? k.dataset.v1);
      const to = +(p ? k.dataset.v1 : k.dataset.v0);
      k.dataset.cur = to;
      const n = $(".kpi-n", k);
      $(".kpi-fill", k).style.setProperty("--v", to / +k.dataset.max);
      animate(800, (e) => { n.textContent = fmt(k.dataset.fmt, lerp(from, to, e), e === 1, p); }, easeOut);
    });
  }));

  /* =========================================================
     Ananya phone: scripted agent runs
     ========================================================= */
  const SCN = {
    whitefield: {
      user: "Looking for a 3BHK near Whitefield under ₹1.2 Cr. My wife works at ITPL and good schools matter.",
      steps: [
        { tool: 'search_listings(zone="Whitefield", bhk=3, budget≤1.2Cr)', out: "14 homes", ms: 800 },
        { tool: 'commute(to="ITPL", peak=true)', out: "5 under 20 min", ms: 700 },
        { tool: 'schools(radius_km=2, board="CBSE|ICSE")', out: "3 fit", ms: 700 },
        { say: "Three homes fit. The best is 11 minutes from ITPL at peak hour, with two CBSE schools within 1.5 km, at ₹1.12 Cr. Shall I book a visit for Saturday at 11?" },
        { cta: "Yes, book it", then: [
          { tool: 'book_visit(slot="Sat 11:00", with="relationship_manager")', out: "Booked", ms: 900 },
          { say: "Done! Your relationship manager will meet you at the gate on Saturday at 11. I've sent the location and the other two options." },
        ] },
      ],
    },
    hsr: {
      user: "Need a ready-to-move 2BHK in HSR Layout, max ₹90L. We're a young couple.",
      steps: [
        { tool: 'search_listings(zone="HSR Layout", bhk=2, budget≤90L)', out: "9 homes", ms: 800 },
        { tool: 'filter(possession="ready")', out: "4 left", ms: 600 },
        { tool: 'price_check(vs="locality median")', out: "2 below median", ms: 800 },
        { say: "Four are ready to move in, and two are priced below the HSR median for their size. Want to see both back to back on Sunday morning?" },
        { cta: "Sunday works", then: [
          { tool: 'book_visit(slots=["Sun 10:00","Sun 11:00"])', out: "Booked", ms: 900 },
          { say: "Booked both. I'll send directions and floor plans an hour before." },
        ] },
      ],
    },
    timing: {
      user: "Is now a good time to buy in Sarjapur, or should I wait a year?",
      steps: [
        { tool: "classify_intent(message)", out: "market advice", ms: 700, guard: true },
        { tool: 'policy_check("investment advice")', out: "needs a human", ms: 700, guard: true },
        { say: "I can show you recent listing prices around Sarjapur, but I shouldn't tell you when to buy. That call deserves a person, so I've asked your relationship manager to call you today." },
        { tool: 'handoff(to="relationship_manager", priority="high")', out: "RM notified", ms: 800 },
      ],
    },
  };
  const msgs = $("#phone-msgs");
  const chips = $$("#phone-chips .chip");
  let running = false;
  const scrollMsgs = () => { msgs.scrollTop = msgs.scrollHeight; };
  function addMsg(cls, html) {
    const li = document.createElement("li");
    li.className = cls;
    li.innerHTML = html;
    msgs.appendChild(li);
    scrollMsgs();
    return li;
  }
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  async function agentSay(text) {
    const t = addMsg("pm-typing", "<i></i><i></i><i></i>");
    await wait(650);
    t.remove();
    const li = addMsg("pm pm-agent", "<p></p>");
    const p = $("p", li);
    const words = text.split(" ");
    for (let i = 0; i < words.length; i++) {
      p.textContent = words.slice(0, i + 1).join(" ");
      scrollMsgs();
      if (!reduce) await new Promise((r) => setTimeout(r, 24 + Math.random() * 26));
    }
  }
  async function runSteps(steps) {
    for (const s of steps) {
      if (s.tool) {
        const li = addMsg(`pm-tool${s.guard ? " is-guard" : ""}`, `<span class="st" aria-hidden="true"></span><code>${esc(s.tool)}</code><span class="out"></span>`);
        await wait(s.ms);
        li.classList.add("done");
        $(".out", li).textContent = s.out;
        await wait(250);
      } else if (s.say) {
        await agentSay(s.say);
        await wait(300);
      } else if (s.cta) {
        await new Promise((resolve) => {
          const li = addMsg("pm-cta", `<button class="chip chip-solid" type="button">${esc(s.cta)}</button>`);
          $("button", li).addEventListener("click", async () => {
            li.remove();
            addMsg("pm pm-user", `<p>${esc(s.cta)}</p>`);
            await wait(350);
            await runSteps(s.then);
            resolve();
          }, { once: true });
          chips.forEach((c) => { c.disabled = false; });
          running = false;
        });
      }
    }
  }
  chips.forEach((chip) => chip.addEventListener("click", async () => {
    if (running) return;
    running = true;
    chips.forEach((c) => { c.disabled = true; });
    const scn = SCN[chip.dataset.scn];
    msgs.innerHTML = "";
    addMsg("pm pm-agent", "<p>Hi! Tell me what you're looking for and I'll find homes worth visiting.</p>");
    await wait(200);
    addMsg("pm pm-user", `<p>${esc(scn.user)}</p>`);
    await wait(450);
    await runSteps(scn.steps);
    running = false;
    chips.forEach((c) => { c.disabled = false; });
  }));

  /* =========================================================
     Mode: board <-> page
     ========================================================= */
  const modeBtn = $("#mode-btn");
  function setMode(board, { initial = false } = {}) {
    state.board = board;
    app.classList.toggle("board", board);
    modeBtn.textContent = board ? "Read as a page" : "Explore the board";
    modeBtn.setAttribute("aria-pressed", String(!board));
    if (board) {
      world.style.transform = "";
      requestAnimationFrame(() => {
        measure();
        drawConnectors();
        minimap.build();
        if (!initial) { state.cam = camFor(frameRect("hello")); invalidate(); setTimeout(() => wander.start(), 900); }
      });
    } else {
      world.style.transform = "";
      frames.forEach((f) => f.classList.remove("is-focus"));
      if (!initial) window.scrollTo({ top: 0 });
    }
  }
  modeBtn.addEventListener("click", () => {
    if (state.touring) tour.end();
    ananya.hush();
    setMode(!state.board);
  });
  window.addEventListener("resize", () => { if (isBoard()) { measure(); minimap.build(); invalidate(); } });

  /* =========================================================
     Boot
     ========================================================= */
  const startBoard = window.innerWidth >= 760;
  setMode(startBoard, { initial: true });
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 1500))]);

  if (startBoard) {
    measure();
    state.cam = camFor(bounds, 1);
    invalidate();
    fontsReady.then(async () => {
      measure();
      drawConnectors();
      minimap.build();
      const hash = location.hash.slice(1);
      const first = byId(hash) && hash !== "hello" ? hash : "hello";
      state.cam = camFor(bounds, 1);
      invalidate();
      await wait(650);
      await goto(first, { dur: 1700 });
      wander.start();
      await wait(450);
      toast("Ananya joined the board");
      await wait(500);
      if (!state.touring && bubble.hidden) {
        await ananya.pointAt($(".hello-actions"), 0.12, 0.5);
        if (!state.touring) {
          ananya.say("Hi! I'm Ananya, the AI agent Rushabh built at Jumbo Homes. Want a 60-second tour of his board?", [
            { label: "Start the tour", primary: true, run: () => tour.start() },
            { label: "I'll explore", run: () => ananya.hush() },
          ]);
        }
      }
    });
  } else {
    fontsReady.then(async () => {
      await wait(1200);
      ananya.say("Hi! I'm Ananya, the AI agent Rushabh built. Ask me anything about him below, or explore his board.", [
        { label: "Explore the board", primary: true, run: () => { ananya.hush(); setMode(true); } },
        { label: "Close", run: () => ananya.hush() },
      ]);
    });
  }
})();
