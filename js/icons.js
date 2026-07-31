'use strict';

// Phosphor icon names used by the planner. The icon library is loaded in index.html.
const ICON_KEYS = [
  'trend-up',
  'briefcase',
  'book-open',
  'barbell',
  'fork-knife',
  'moon-stars',
  'person-simple-run',
  'flag',
  'shower',
  'car',
  'coffee',
  'notebook',
  'laptop',
  'clock',
  'check-circle'
];

const ICON_NAMES = {
  'trend-up': 'Markets',
  briefcase: 'Work',
  'book-open': 'Study',
  barbell: 'Fitness',
  'fork-knife': 'Meal',
  'moon-stars': 'Wind down',
  'person-simple-run': 'Run',
  flag: 'Golf',
  shower: 'Shower',
  car: 'Travel',
  coffee: 'Break',
  notebook: 'Journal',
  laptop: 'Computer',
  clock: 'Time block',
  'check-circle': 'General'
};

function normalizeIconKey(key = '') {
  const aliases = {
    chart: 'trend-up',
    'trending-up': 'trend-up',
    book: 'book-open',
    run: 'person-simple-run',
    'person-standing': 'person-simple-run',
    golf: 'flag',
    'shower-head': 'shower',
    journal: 'notebook',
    'notebook-pen': 'notebook',
    'clock-3': 'clock',
    check: 'check-circle',
    'circle-check': 'check-circle',
    dumbbell: 'barbell',
    utensils: 'fork-knife',
    moon: 'moon-stars'
  };

  return aliases[key] || key || 'check-circle';
}

function inferIcon(label = '') {
  const value = label.toLowerCase();

  if (/run|jog/.test(value)) return 'person-simple-run';
  if (/gym|workout|yoga|fitness/.test(value)) return 'barbell';
  if (/golf/.test(value)) return 'flag';
  if (/shower/.test(value)) return 'shower';
  if (/breakfast|dinner|lunch|eat|meal/.test(value)) return 'fork-knife';
  if (/journal/.test(value)) return 'notebook';
  if (/read|study|research|deep dive|model/.test(value)) return 'book-open';
  if (/market|trade|portfolio/.test(value)) return 'trend-up';
  if (/commute|bike|drive|travel/.test(value)) return 'car';
  if (/sleep|wind.down|meditat/.test(value)) return 'moon-stars';
  if (/job|work|email/.test(value)) return 'briefcase';
  if (/python|computer|laptop|code/.test(value)) return 'laptop';
  if (/coffee|break/.test(value)) return 'coffee';

  return 'check-circle';
}

function iconHtml(rawKey = 'check-circle') {
  const key = normalizeIconKey(rawKey);
  return '<i class="ph ph-' + key + ' task-phosphor-icon" aria-hidden="true"></i>';
}

function taskIcon(taskOrLabel = '') {
  if (typeof taskOrLabel === 'object') {
    return iconHtml(normalizeIconKey(taskOrLabel.icon) || inferIcon(taskOrLabel.label));
  }

  return iconHtml(inferIcon(taskOrLabel));
}

window.PlannerIcons = Object.freeze({
  ICON_KEYS,
  ICON_NAMES,
  normalizeIconKey,
  inferIcon,
  iconHtml,
  taskIcon
});
