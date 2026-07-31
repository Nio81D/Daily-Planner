# Daily Planner

A phone-first personal planner designed for GitHub Pages and installation as an iPhone Home Screen web app.

## Project structure

- `index.html` loads the application and the Phosphor icon CDN.
- `css/styles.css` contains the visual design.
- `js/defaults.js` contains the default schedule, task names, colors, and icon names.
- `js/icons.js` maps task labels and saved icon names to Phosphor classes.
- `js/app.js` contains planner behavior and local-storage logic.
- `sw.js` provides offline caching for local application files.

## Icons

The planner uses Phosphor Icons through this pinned CDN dependency:

```html
<script src="https://unpkg.com/@phosphor-icons/web@2.1.1" defer></script>
```

Task icon names remain isolated in `js/defaults.js` and `js/icons.js`. The CDN can later be replaced with locally hosted Phosphor assets without changing task data or application behavior.

The planner interface and stored data continue to work offline after the local application shell has been cached. Phosphor icons require network access unless the browser has already cached the CDN asset.

## Deployment

Upload the repository contents to GitHub and deploy from the `main` branch using GitHub Pages.

When deployed files change, update `CACHE_REVISION` near the top of `sw.js` so installed copies retrieve the latest local files.

## Storage

Schedules, completion history, and streaks are stored in the browser under the existing `sdp-v1:` local-storage namespace. The repository does not contain personal planner data.
