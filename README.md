# Strona Babci 🇵🇱🇳🇿

A simple, big-text homepage for a Polish grandma in Auckland.

- **Weather** — Auckland and a chosen Polish city: right now + the next 7 days.
  Uses [Open-Meteo](https://open-meteo.com), falls back to [MET Norway](https://api.met.no) if it's down. No API keys.
- **Clocks** — Auckland and Poland time.
- **Events** — Polish community events in Auckland first, then other Auckland events.
  Past events hide themselves automatically.
- Polish by default, with an English button.

## Updating events

Events are hand-curated. Edit the `EVENTS` list near the top of the `<script>` in `index.html`
(`start`/`end` are `YYYY-MM-DD`; use `weekly: 0–6` for a repeating weekday event), then redeploy.

## Run locally

```bash
python3 -m http.server 8765
```
