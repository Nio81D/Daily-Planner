# Planner

Production baseline: **1.0.4**

A phone-first personal planner hosted with GitHub Pages.

## Stable update model

- `index.html` contains the application shell.
- `css/styles.css` contains visual styling.
- `js/app.js` contains behavior and the hardcoded production defaults.
- `sw.js` controls the offline cache. Change its cache version whenever HTML, CSS, or JavaScript changes.
- Personal schedules and completion history remain in browser `localStorage` under the `sdp-v1:` keys.

## Editing defaults

The production task list is the `DEFAULT_TASKS` constant near the top of `js/app.js`. Future default names, times, colors, icons, or recurring days can be changed directly there.

There is no migration framework. Code updates do not rewrite a user's existing locally saved tasks. Personal task changes should normally be made through the Planner editor. Hardcoded defaults apply to a fresh install or after local planner data is cleared.

## Palette

The production colors are defined once in the `PALETTE` constant near the top of `js/app.js`:

- Blue: `#3b82f6`
- Green: `#4bd39b`
- Purple: `#9d8cff`
- Coral: `#f06b68`
- Gold: `#f59e0b`

## Current production design

- Structured-style daily timeline
- Task-colored icon circles
- Task-colored left borders
- Blue application theme
- Gold in place of the former light blue
- Local storage, backup/restore, and offline support

## Release history

### 1.0.4
- Removed all migration and schema-version code.
- Established `DEFAULT_TASKS` as the single editable source for production defaults.
- Retained the final task names and color mappings.
- Added the task-colored left border.
- Replaced light blue with gold.

### 1.0.3
- Simplified recurring weekday study blocks to `Study`.
