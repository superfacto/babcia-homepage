# Strona Babci 🇵🇱🇳🇿

A simple, big-text homepage for a Polish grandma in Auckland.

**Live:** https://babcia-homepage.netlify.app

- **Weather** — Auckland and a chosen Polish city: right now + the next 7 days.
  Uses [Open-Meteo](https://open-meteo.com), falls back to [MET Norway](https://api.met.no) if it's down. No API keys.
- **Clocks** — Auckland and Poland time.
- **Events** — Polish community events in Auckland first, then other Auckland events.
  Past events hide themselves automatically.
- **Book of the day** — a free Polish classic from [Wolne Lektury](https://wolnelektury.pl), with a short
  "what it is / why it's worth reading" note. 31 history-focused picks (memoirs, chronicles, uprising stories, historical novels — no crime, sci-fi or romance) rotate daily, with Previous/Next buttons (edit `BOOKS` in `index.html`).
- **Text this to someone** — each event has a button that opens Messages with the details filled in.
- Polish by default, with an English button.

## Updating events

Events are hand-curated. Edit the `EVENTS` list near the top of the `<script>` in `index.html`
(`start`/`end` are `YYYY-MM-DD`; use `weekly: 0–6` for a repeating weekday event), then push to `main` — Netlify auto-deploys it to https://babcia-homepage.netlify.app.

## Run locally

```bash
python3 -m http.server 8765
```
