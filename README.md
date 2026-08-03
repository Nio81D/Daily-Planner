# Daily Planner

**Production version: 2.0.0**

A phone-first progressive web app for recurring schedules, daily focus, task notes, central habits, weekly targets, and local-only history.

## PROD 2.0 model

The schedule and habit systems are intentionally separate:

- **Habits** are user-defined outcomes with a weekly completion target.
- **Blocks** are recurring scheduled tasks.
- A block may contribute to one habit or to no habit at all.
- Completing a linked block contributes one completion to its habit.
- Habit streaks count consecutive weeks in which the weekly target was reached.

Examples: Gym, Golf, and Running can all contribute to `Fitness & Sports`. Dinner and Work can remain schedule-only blocks.

## Production structure

- `index.html` — application entry point and PWA registration
- `css/styles.css` — consolidated visual system
- `js/defaults.js` — palette, default habits, and default schedule
- `js/icons.js` — icon names, aliases, and rendering
- `js/habit-model.js` — isolated habit validation and analytics engine
- `js/app.js` — views, editing, storage orchestration, backup, and interactions
- `sw.js` — offline application shell and cache revision
- `manifest.webmanifest` — install metadata
- `assets/icons/` — Home Screen and browser icons

## Storage

PROD 2.0 uses the clean `sdp-v2:` localStorage namespace. PROD 1.x data under `sdp-v1:` is not read, changed, or deleted. This is a deliberate clean break rather than an accumulating migration layer.

Main records:

- `sdp-v2:habits`
- `sdp-v2:tasks`
- `sdp-v2:plan-day:YYYY-MM-DD`

Full and schedule backups use backup schema version 4 and include both habits and tasks.

## Updating production

1. Edit the responsible source file.
2. Change `CACHE_REVISION` in `sw.js` whenever a deployed asset changes.
3. Run JavaScript syntax checks and habit-model tests.
4. Commit and push to GitHub Pages.
5. Refresh the Pages URL, then reopen the installed PWA.
