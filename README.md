# Family Shopping List (Hebrew RTL) – v1 UI

This repo contains the **first UI version** (no backend yet) for:
- `/family/:listId` — family shopping list UI (List mode + Shopping mode)
- `/admin/:token` — mini back office UI (pending items + categories)

## Netlify
Netlify is pre-configured via `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`

React Router refresh support is enabled via `public/_redirects`.

## Local (optional)
```bash
npm install
npm run dev
```
