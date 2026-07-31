# Planner

A phone-first personal planner hosted with GitHub Pages.

## Repository structure

- `index.html` — application shell and PWA registration
- `css/styles.css` — all visual styling
- `js/app.js` — planner behavior, palette, icons, and default schedule
- `manifest.webmanifest` — installable app metadata
- `sw.js` — offline cache and update behavior
- `assets/icons/` — Home Screen and browser icons

## Routine updates

### Change the default schedule

Edit `DEFAULT_TASKS` near the top of `js/app.js`. Each task has a name, start and end time, recurring days, color, and icon.

### Change the palette

Edit `PALETTE` near the top of `js/app.js`. The same values are used by the editor and default tasks.

### Change the interface

Edit `css/styles.css`. Sections are named by function rather than by historical release.

### Publish an update

1. Commit the changed files to the `main` branch.
2. Change `CACHE_REVISION` near the top of `sw.js` whenever `index.html`, `css/styles.css`, `js/app.js`, the manifest, or an icon changes.
3. Wait for the GitHub Pages deployment to complete.
4. Refresh the hosted planner in Safari, then reopen the Home Screen app.

## Local data

Schedules and completion history are stored only in the browser under the stable `sdp-v1:` namespace. Repository updates do not rewrite existing saved tasks. Use the in-app editor for personal schedule changes and the backup tool for portability.

## Design baseline

- Structured-style daily timeline
- Blue application theme
- Bright task colors with gold replacing light blue
- Task-colored icon circles and left borders
- Bundled inline SVG task icons with no external icon dependency
- Offline support through the service worker


## Source layout

- `js/defaults.js`: palette and hardcoded recurring task defaults.
- `js/icons.js`: local task icon catalog and rendering.
- `js/app.js`: planner behavior, storage, and UI rendering.
- `css/styles.css`: visual styling.

For future task-name, time, default color, or default icon changes, edit `js/defaults.js`.
