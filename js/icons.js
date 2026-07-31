'use strict';

// Local task icon catalog. Keys retain the familiar Phosphor icon names.
const ICON_KEYS=['trend-up','briefcase','book-open','barbell','fork-knife','moon-stars','person-simple-run','flag','shower','car','coffee','notebook','laptop','clock','check-circle'];
const ICON_NAMES={'trend-up':'Markets',briefcase:'Work','book-open':'Study',barbell:'Fitness','fork-knife':'Meal','moon-stars':'Wind down','person-simple-run':'Run',flag:'Golf',shower:'Shower',car:'Travel',coffee:'Break',notebook:'Journal',laptop:'Computer',clock:'Time block','check-circle':'General'};

function normalizeIconKey(key=''){
const map={
  chart:'trend-up','trending-up':'trend-up',book:'book-open',run:'person-simple-run','person-standing':'person-simple-run',
  golf:'flag','shower-head':'shower',journal:'notebook','notebook-pen':'notebook','clock-3':'clock',
  check:'check-circle','circle-check':'check-circle',dumbbell:'barbell',utensils:'fork-knife',moon:'moon-stars'
};
return map[key]||key||'check-circle'
}
function inferIcon(label=''){const x=label.toLowerCase();
if(/run|jog/.test(x))return 'person-simple-run';
if(/gym|workout|yoga|fitness/.test(x))return 'barbell';
if(/golf/.test(x))return 'flag';
if(/shower/.test(x))return 'shower';
if(/breakfast|dinner|lunch|eat|meal/.test(x))return 'fork-knife';
if(/journal/.test(x))return 'notebook';
if(/read|study|research|deep dive|model/.test(x))return 'book-open';
if(/market|trade|portfolio/.test(x))return 'trend-up';
if(/commute|bike|drive|travel/.test(x))return 'car';
if(/sleep|wind.down|meditat/.test(x))return 'moon-stars';
if(/job|work|email/.test(x))return 'briefcase';
if(/python|computer|laptop|code/.test(x))return 'laptop';
if(/coffee|break/.test(x))return 'coffee';
return 'check-circle'}
function iconSvg(rawKey='check-circle'){
  const key=normalizeIconKey(rawKey);
  const paths={
    'trend-up':'<path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    'briefcase':'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18M10 12v2h4v-2"/>',
    'book-open':'<path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H11v17H6.5A3.5 3.5 0 0 0 3 22z"/><path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H13v17h4.5A3.5 3.5 0 0 1 21 22z"/>',
    'barbell':'<path d="M6 7v10M3.5 9v6M18 7v10M20.5 9v6M6 12h12"/>',
    'fork-knife':'<path d="M6 3v7M3.5 3v4.5A2.5 2.5 0 0 0 6 10M8.5 3v4.5A2.5 2.5 0 0 1 6 10v11M15 3v18M15 3c4 2 5 6 5 9h-5"/>',
    'moon-stars':'<path d="M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5z"/><path d="M17 3v3M15.5 4.5h3M21 7v2M20 8h2"/>',
    'person-simple-run':'<circle cx="14" cy="4" r="2"/><path d="M8 21l3-6 2-4 4 3 3 1M6 11l5-3 3 3M13 15l-5 1-3 5"/>',
    'flag':'<path d="M5 22V3M5 4h11l-2 4 2 4H5"/>',
    'shower':'<path d="M5 10a7 7 0 0 1 14 0M19 10H9M10 14v1M14 14v1M18 14v1M8 18v1M12 18v1M16 18v1"/>',
    'car':'<path d="M5 17h14l1-6-2-5H6l-2 5z"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/><path d="M6 11h12"/>',
    'coffee':'<path d="M4 8h13v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4zM17 10h2a3 3 0 0 1 0 6h-2M7 3v2M11 3v2M15 3v2"/>',
    'notebook':'<rect x="5" y="3" width="15" height="18" rx="2"/><path d="M9 3v18M2.5 7H7M2.5 12H7M2.5 17H7M12 8h5M12 12h5"/>',
    'laptop':'<rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20M8 20h8"/>',
    'clock':'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    'check-circle':'<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'
  };
  return `<svg class="task-svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key]||paths['check-circle']}</svg>`;
}
function taskIcon(taskOrLabel=''){if(typeof taskOrLabel==='object')return iconSvg(normalizeIconKey(taskOrLabel.icon)||inferIcon(taskOrLabel.label));return iconSvg(inferIcon(taskOrLabel))}

window.PlannerIcons=Object.freeze({ICON_KEYS,ICON_NAMES,normalizeIconKey,inferIcon,iconSvg,taskIcon});
