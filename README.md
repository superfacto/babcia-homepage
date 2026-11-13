# Strona Babci 🇵🇱🇳🇿

A simple, big-text homepage for a Polish grandma in Auckland.

**Live:** https://babcia-homepage.netlify.app

- **Weather** — Auckland and a chosen Polish city: right now + the next 7 days.
  Uses [Open-Meteo](https://open-meteo.com), falls back to [MET Norway](https://api.met.no) if it's down. No API keys.
- **Clocks** — Auckland and Poland time.
- **Gazeta Babci** — a daily newspaper page (`gazeta.html`) built from wPolityce.pl's official RSS feeds
  by a Netlify function (`netlify/functions/gazeta.mjs`, served at `/api/gazeta`, cached 15 min). Crime section left out.
- **Events** — Polish community events in Auckland first, then other Auckland events.
  Past events hide themselves automatically.
- **Daily shelf** — 10 picks a day (books from Wolne Lektury + free Polish films) from `library.js`;
  history, memoirs, legends, travel and classics — no crime, sci-fi or romance-led stories. Previous/Next by day.
- **Text this to someone** — each event has a button that opens Messages with the details filled in.
- Polish by default, with an English button.

## Updating events

Events are hand-curated. Edit the `EVENTS` list near the top of the `<script>` in `index.html`
(`start`/`end` are `YYYY-MM-DD`; use `weekly: 0–6` for a repeating weekday event), then push to `main` — Netlify auto-deploys it to https://babcia-homepage.netlify.app.

## Run locally

```bash
python3 -m http.server 8765
```
