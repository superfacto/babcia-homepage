// Private usage tracking for Babcia's homepage → /api/track (Netlify Blobs, this site only).
// Records: page opens (app vs browser), time on screen, sections scrolled into view,
// taps on buttons/links (their visible label), radio listening time. Never records typed text.
// On a device:  ?device=babcia  labels it ·  ?notrack=1  turns tracking off ·  ?notrack=0  back on.
(function () {
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch { return null; } };
  const q = new URLSearchParams(location.search);
  if (q.has("notrack")) ls("babcia-notrack", q.get("notrack") === "0" ? "" : "1");
  if (q.has("device")) ls("babcia-device-label", q.get("device").slice(0, 40));
  const off = ls("babcia-notrack") === "1" || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);

  let dev = ls("babcia-device");
  if (!dev) { dev = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2)); ls("babcia-device", dev); }
  const newSession = () => Math.random().toString(36).slice(2, 12);
  let session = newSession();
  const page = document.documentElement.dataset.page || "home";
  const queue = [];

  function track(n, o = {}) {
    if (off) return;
    queue.push({ t: Date.now(), n, ...o });
    if (queue.length >= 40) flush();
  }
  function flush() {
    if (off || !queue.length) return;
    const body = JSON.stringify({ d: dev, lbl: ls("babcia-device-label") || "", s: session, p: page, ev: queue.splice(0) });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }))) return;
    } catch { }
    fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } }).catch(() => { });
  }
  window.track = track;

  const isApp = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const open = () => track("open", { label: isApp() ? "app" : "browser", v: innerWidth });
  open();

  // Time actually on screen (visible), sent in ~30 s chunks
  let tick = Date.now(), acc = 0, hiddenAt = 0;
  setInterval(() => {
    const now = Date.now();
    if (document.visibilityState === "visible") acc += (now - tick) / 1000;
    tick = now;
    if (acc >= 30) { track("active", { v: acc }); acc = 0; }
  }, 5000);
  setInterval(flush, 60000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      if (acc >= 1) { track("active", { v: acc }); acc = 0; }
      window.onTrackFlush && window.onTrackFlush();
      hiddenAt = Date.now();
      flush();
    } else {
      tick = Date.now();
      // Home-screen apps resume instead of reloading: a long break counts as a new visit
      if (hiddenAt && Date.now() - hiddenAt > 30 * 60000) { session = newSession(); seenOnce.clear(); open(); }
    }
  });
  addEventListener("pagehide", () => { if (acc >= 1) track("active", { v: acc }); acc = 0; window.onTrackFlush && window.onTrackFlush(); flush(); });

  // Which sections she scrolls to (once per visit)
  const seenOnce = new Set();
  const io = "IntersectionObserver" in window ? new IntersectionObserver((entries) => {
    for (const e of entries) {
      const sec = e.target.dataset.sec;
      if (e.isIntersecting && sec && !seenOnce.has(sec)) { seenOnce.add(sec); track("seen", { sec }); }
    }
  }, { threshold: 0.35 }) : null;
  const observe = () => io && document.querySelectorAll("[data-sec]").forEach(el => io.observe(el));
  window.trackObserve = observe;
  addEventListener("load", observe);
  setTimeout(observe, 3000);

  // Taps on links and buttons, labelled by their visible text (never form input values)
  document.addEventListener("click", (e) => {
    const el = e.target.closest("a, button, summary");
    if (!el || el.closest("form")) return;
    const sec = el.closest("[data-sec]")?.dataset.sec || "inne";
    const label = (el.dataset.trackLabel || el.getAttribute("aria-label") || el.textContent || "").replace(/\s+/g, " ").trim().slice(0, 90);
    let host = "";
    try { if (el.href) host = new URL(el.href, location.href).host; } catch { }
    track("click", { sec, label, host });
  }, true);
  document.addEventListener("change", (e) => {
    if (e.target.matches("select")) track("click", { sec: e.target.closest("[data-sec]")?.dataset.sec || "inne", label: "wybór: " + e.target.value.slice(0, 40) });
  }, true);
})();
