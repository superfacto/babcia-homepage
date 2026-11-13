// Private usage summary for statystyki.html. Locked by the STATS_KEY environment variable
// (set in Netlify → Site configuration → Environment variables). Without it, nothing is served.
import { getStore } from "@netlify/blobs";

const TZ = "Pacific/Auckland";
const aklDay = (iso) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(iso));
const aklHour = (ms) => +new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "numeric", hourCycle: "h23" }).format(new Date(ms));

export default async (req) => {
  const want = Netlify.env.get("STATS_KEY");
  if (!want) return Response.json({ error: "STATS_KEY not set on the site" }, { status: 503 });
  const url = new URL(req.url);
  const key = req.headers.get("x-stats-key") || url.searchParams.get("key");
  if (key !== want) return Response.json({ error: "wrong key" }, { status: 401 });

  const days = Math.min(Math.max(+url.searchParams.get("days") || 30, 1), 120);
  const dev = url.searchParams.get("dev") || "all"; // "all", a label like "babcia", or a device id
  const store = getStore("usage");

  // List batch keys for the last `days` UTC days (+1 to cover the time-zone shift)
  const keys = [];
  for (let i = 0; i <= days; i++) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    const { blobs } = await store.list({ prefix: `ev/${d}/` });
    keys.push(...blobs.map(b => b.key));
  }
  const batches = (await Promise.all(keys.map(k => store.get(k, { type: "json" }).catch(() => null)))).filter(Boolean);

  const devices = {};
  for (const b of batches) {
    const D = devices[b.d] ||= { id: b.d, label: "", first: b.at, last: b.at, sessions: new Set(), city: "", app: 0, browser: 0 };
    if (b.lbl) D.label = b.lbl;
    if (b.at < D.first) D.first = b.at;
    if (b.at > D.last) D.last = b.at;
    if (b.s) D.sessions.add(b.s);
    if (b.geo?.city) D.city = [b.geo.city, b.geo.c].filter(Boolean).join(", ");
    for (const e of b.ev) if (e.n === "open") D[e.label === "app" ? "app" : "browser"]++;
  }
  const match = (b) => dev === "all" || b.d === dev || (devices[b.d]?.label || "") === dev;
  const sel = batches.filter(match);

  const perDay = {}, hours = Array(24).fill(0), seen = {}, clicks = {}, radio = {}, pages = {};
  const sessions = new Set();
  let activeSec = 0, lastVisit = null;
  for (const b of sel) {
    if (b.s) sessions.add(b.s);
    for (const e of b.ev) {
      const day = aklDay(new Date(e.t).toISOString());
      const P = perDay[day] ||= { sessions: new Set(), activeSec: 0 };
      if (b.s) P.sessions.add(b.s);
      if (e.n === "open") {
        hours[aklHour(e.t)]++;
        pages[b.p] = (pages[b.p] || 0) + 1;
        if (!lastVisit || e.t > lastVisit) lastVisit = e.t;
      } else if (e.n === "active") { P.activeSec += e.v || 0; activeSec += e.v || 0; }
      else if (e.n === "seen") { (seen[e.sec] ||= new Set()).add(b.s); }
      else if (e.n === "click") { const k = `${e.sec || "?"}|${e.label || e.host || "?"}`; clicks[k] = (clicks[k] || 0) + 1; }
      else if (e.n === "radio") { radio[e.label || "?"] = (radio[e.label || "?"] || 0) + (e.v || 0); }
    }
  }
  const out = {
    range: { days, dev },
    totals: { sessions: sessions.size, activeMin: Math.round(activeSec / 60), daysUsed: Object.values(perDay).filter(p => p.sessions.size).length, lastVisit: lastVisit && new Date(lastVisit).toISOString() },
    perDay: Object.entries(perDay).sort().map(([day, p]) => ({ day, sessions: p.sessions.size, activeMin: Math.round(p.activeSec / 60) })),
    hours,
    pages,
    sectionsSeen: Object.entries(seen).map(([sec, s]) => ({ sec, sessions: s.size })).sort((a, b) => b.sessions - a.sessions),
    topClicks: Object.entries(clicks).map(([k, n]) => { const [sec, label] = k.split("|"); return { sec, label, n }; }).sort((a, b) => b.n - a.n).slice(0, 40),
    radioMin: Object.entries(radio).map(([station, s]) => ({ station, min: Math.round(s / 60) })).sort((a, b) => b.min - a.min),
    devices: Object.values(devices).map(D => ({ ...D, sessions: D.sessions.size })).sort((a, b) => b.last.localeCompare(a.last)),
  };
  return Response.json(out, { headers: { "cache-control": "no-store" } });
};

export const config = { path: "/api/stats" };
