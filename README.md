# Daily Planner

A phone-first progressive web app for recurring schedules, daily focus, task notes, habits, streaks, and local-only history.

## Production structure

- `index.html` — application entry point and PWA registration
- `css/styles.css` — consolidated visual system with no duplicate selectors
- `js/defaults.js` — palette and recurring default schedule
- `js/icons.js` — Phosphor icon names, aliases, and rendering
- `js/app.js` — storage, views, editing, backup, and interactions
- `sw.js` — offline application shell and cache revision
- `manifest.webmanifest` — install metadata
- `assets/icons/` — Home Screen and browser icons

## Data model

Planner data remains in browser `localStorage` under the existing `sdp-v1:` namespace. Daily Focus and task notes are stored in each date's `plan-day` record and are included in Full Backup JSON.

## Updating production

1. Edit only the file responsible for the requested change.
2. Change `CACHE_REVISION` in `sw.js` whenever a deployed asset changes.
3. Commit to GitHub and wait for GitHub Pages deployment.
4. Refresh the Pages URL in Safari, then reopen the Home Screen app.

## Current behavior

- Current default schedule is defined once in `js/defaults.js`.
- Completed tasks fade to gray, including the icon, check control, and left color border.
- Free-time gaps are shown as explicit timeline rows.
- No migration or schema-version framework is included.
