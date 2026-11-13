// Collects anonymous usage events from the homepage (see track.js) so Nicolas can see
// which parts Babcia actually uses. Private: stored in this site's Netlify Blobs only,
// no third parties, no IP addresses, no family data.
// Each batch is written to its own new key (append-only), so writes never overwrite each other.
import { getStore } from "@netlify/blobs";

const MAX_BODY = 20_000;
const clip = (v, n = 120) => (typeof v === "string" ? v.slice(0, n) : v);

export default async (req, context) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const raw = await req.text();
  if (raw.length > MAX_BODY) return new Response("Too large", { status: 413 });
  let b;
  try { b = JSON.parse(raw); } catch { return new Response("Bad JSON", { status: 400 }); }
  if (!b || typeof b.d !== "string" || !Array.isArray(b.ev) || b.ev.length > 200) return new Response("Bad payload", { status: 400 });

  const now = new Date();
  const batch = {
    at: now.toISOString(),
    d: clip(b.d, 40),          // random per-device id (localStorage)
    lbl: clip(b.lbl || "", 40), // optional device label, e.g. "babcia"
    s: clip(b.s || "", 40),    // per-visit session id
    p: clip(b.p || "", 20),    // page: home / gazeta
    geo: { c: context?.geo?.country?.code || "", city: context?.geo?.city || "" },
    ev: b.ev.map(e => ({
      t: Number(e.t) || now.getTime(),
      n: clip(String(e.n || ""), 30),
      sec: clip(e.sec, 40), label: clip(e.label), host: clip(e.host, 60),
      v: typeof e.v === "number" && isFinite(e.v) ? Math.round(e.v) : undefined,
    })),
  };
  const day = now.toISOString().slice(0, 10);
  const key = `ev/${day}/${now.getTime()}-${Math.random().toString(36).slice(2, 10)}`;
  try {
    await getStore("usage").setJSON(key, batch);
  } catch (e) {
    console.error("usage store write failed", e);
    return new Response("Store error", { status: 500 });
  }
  return new Response(null, { status: 204 });
};

export const config = { path: "/api/track" };
