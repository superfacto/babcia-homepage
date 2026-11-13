// Babcia's daily newspaper: collects wPolityce.pl's public RSS feeds (https://wpolityce.pl/rss)
// and returns clean JSON for gazeta.html. Browsers can't read the feeds directly (no CORS),
// so this runs on Netlify and is cached at the edge for 15 minutes.

const BASE = "https://wpolityce.pl/rss/";

// Sections shown in the paper, in order. "kryminal" (crime) is left out on purpose — Babcia doesn't like crime stories.
export const SECTIONS = [
  ["kraj", "Kraj"],
  ["polityka", "Polityka"],
  ["swiat", "Świat"],
  ["kosciol", "Kościół"],
  ["historia", "Historia"],
  ["kultura", "Kultura"],
  ["spoleczenstwo", "Społeczeństwo"],
  ["zdrowie", "Zdrowie"],
  ["gospodarka", "Gospodarka"],
  ["sport", "Sport"],
  ["tygodniksieci", "Tygodnik „Sieci”"],
  ["publicystyka", "Publicystyka"],
];
const PER_SECTION = 8;

function decode(s = "") {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&quot;/g, '"').replace(/&apos;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\s+/g, " ").trim();
}
const tag = (xml, name) => (xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)) || [])[1];

export function parseRss(xml) {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(([, it]) => {
    const link = decode(tag(it, "link"));
    return {
      title: decode(tag(it, "title")),
      lead: decode(tag(it, "description")),
      link,
      date: new Date(decode(tag(it, "pubDate"))).toISOString(),
      img: ((it.match(/<enclosure[^>]*url="([^"]+)"[^>]*type="image/) || [])[1] || "").match(/^https:\/\/[^\s"<>]+$/)?.[0] || null, // https images only
      premium: /\/premium\//.test(link),
    };
  }).filter(i => i.title && /^https:\/\/wpolityce\.pl\//.test(i.link));
}

async function getSection([slug, name]) {
  try {
    const r = await fetch(BASE + slug + ".xml", {
      headers: { "User-Agent": "BabciaHomepage/1.0 (RSS reader)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    return { slug, name, items: parseRss(await r.text()) };
  } catch (e) {
    return { slug, name, items: [], error: String(e) };
  }
}

export default async () => {
  const sections = await Promise.all(SECTIONS.map(getSection));
  // An article can appear in several feeds — show it only in the first section.
  const seen = new Set();
  for (const s of sections) {
    s.items = s.items
      .filter(i => !/\/kryminal\//.test(i.link) && !seen.has(i.link) && seen.add(i.link))
      .slice(0, PER_SECTION);
  }
  const body = JSON.stringify({ updated: new Date().toISOString(), source: "wPolityce.pl", sections });
  return new Response(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "public, max-age=300",
      "netlify-cdn-cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
};

export const config = { path: "/api/gazeta" };
