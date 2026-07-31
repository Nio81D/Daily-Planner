(()=>{
'use strict';
const PREFIX='sdp-v1:';
const COLORS=['#3b82f6','#4bd39b','#9d8cff','#f06b68','#65b6f2'];
const ICON_KEYS=['trend-up','briefcase','book-open','barbell','fork-knife','moon-stars','person-simple-run','flag','shower','car','coffee','notebook','laptop','clock','check-circle'];
const ICON_NAMES={'trend-up':'Markets',briefcase:'Work','book-open':'Study',barbell:'Fitness','fork-knife':'Meal','moon-stars':'Wind down','person-simple-run':'Run',flag:'Golf',shower:'Shower',car:'Travel',coffee:'Break',notebook:'Journal',laptop:'Computer',clock:'Time block','check-circle':'General'};
const DAYS=['S','M','T','W','T','F','S'];
const state={tab:'today',date:strip(new Date()),month:strip(new Date()),tasks:loadJSON(PREFIX+'tasks',null)||defaults(),dayCache:{},editing:null};
function defaults(){const WD=[1,2,3,4,5];return[
{id:'t1',label:'Run (optional)',start:330,end:370,days:WD,color:COLORS[4]},
{id:'t2',label:'Shower + breakfast',start:370,end:400,days:WD,color:COLORS[4]},
{id:'t3',label:'Market Prep',start:400,end:495,days:WD,color:COLORS[0]},
{id:'t5',label:'Work',start:510,end:960,days:WD,color:COLORS[3]},
{id:'t6',label:'Gym',start:1020,end:1080,days:WD,color:COLORS[1]},
{id:'t8',label:'Dinner',start:1080,end:1125,days:WD,color:COLORS[4]},
{id:'t9',label:'Study: Company deep dive',start:1125,end:1230,days:[1],color:COLORS[2]},
{id:'t10',label:'Study: Financial modeling',start:1125,end:1230,days:[2],color:COLORS[2]},
{id:'t11',label:'Study: Sector reading',start:1125,end:1230,days:[3],color:COLORS[2]},
{id:'t12',label:'Study: Quant / Python',start:1125,end:1230,days:[4],color:COLORS[2]},
{id:'t13',label:'Study: Weekly catch-up',start:1125,end:1230,days:[5],color:COLORS[2]},
{id:'t14',label:'Trade Journal',start:1230,end:1245,days:WD,color:COLORS[0]},
{id:'t15',label:'Wind Down: read / meditate',start:1245,end:1290,days:WD,color:COLORS[4]},
{id:'t16',label:'Golf',start:540,end:720,days:[6],color:COLORS[1]},
{id:'t17',label:'Trading / portfolio deep work',start:780,end:960,days:[6],color:COLORS[0]},
{id:'t18',label:'Gym + long-form reading',start:480,end:630,days:[0],color:COLORS[1]},
{id:'t19',label:'Weekly review',start:840,end:960,days:[0],color:COLORS[0]}];}
function strip(d){const x=new Date(d);x.setHours(0,0,0,0);return x}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mins(m){let h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM';h%=12;if(!h)h=12;return `${h}:${String(mm).padStart(2,'0')} ${ap}`}
function timeInput(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function fromTime(v){const [h,m]=v.split(':').map(Number);return h*60+m}
function loadJSON(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Could not save on this device');return false}}
function saveTasks(){saveJSON(PREFIX+'tasks',state.tasks)}
function migrateV7(){
  const marker=PREFIX+'migration-v7';
  if(localStorage.getItem(marker))return;
  state.tasks=state.tasks.filter(t=>!['t4','t7'].includes(t.id));
  const changes={
    t3:{label:'Market Prep',start:400,end:495},
    t5:{label:'Work',start:510,end:960},
    t6:{label:'Gym',start:1020,end:1080},
    t8:{label:'Dinner',start:1080,end:1125},
    t9:{start:1125,end:1230},t10:{start:1125,end:1230},t11:{start:1125,end:1230},
    t12:{start:1125,end:1230},t13:{start:1125,end:1230},
    t14:{label:'Trade Journal',start:1230,end:1245},
    t15:{label:'Wind Down: read / meditate',start:1245,end:1290}
  };
  state.tasks.forEach(t=>{if(changes[t.id])Object.assign(t,changes[t.id])});
  saveTasks();
  localStorage.setItem(marker,'1');
}
function migrateV10(){
  const marker=PREFIX+'migration-v10';if(localStorage.getItem(marker))return;
  const colorFor=label=>/gym|run|golf|workout|fitness/i.test(label)?COLORS[2]:/study|read|research|model|python/i.test(label)?COLORS[3]:/market|trade|work|job|portfolio/i.test(label)?COLORS[1]:/dinner|breakfast|shower|wind|meditat/i.test(label)?COLORS[0]:COLORS[4];
  state.tasks.forEach(t=>{t.icon=normalizeIconKey(t.icon||inferIcon(t.label));t.color=colorFor(t.label)});saveTasks();localStorage.setItem(marker,'1');
}
function migrateV11(){
  const marker=PREFIX+'migration-v11';if(localStorage.getItem(marker))return;
  const colorFor=label=>/market|trade|portfolio/i.test(label)?COLORS[0]:/gym|run|golf|workout|fitness/i.test(label)?COLORS[1]:/study|read|research|model|python/i.test(label)?COLORS[2]:/work|job|email/i.test(label)?COLORS[3]:/dinner|breakfast|shower|wind|meditat/i.test(label)?COLORS[4]:COLORS[0];
  state.tasks.forEach(t=>{t.icon=normalizeIconKey(t.icon||inferIcon(t.label));t.color=colorFor(t.label)});
  saveTasks();localStorage.setItem(marker,'1');
}
function getDay(d){const k=dateKey(d);if(!(k in state.dayCache))state.dayCache[k]=loadJSON(PREFIX+'plan-day:'+k,{});return state.dayCache[k]}
function saveDay(d){const k=dateKey(d);saveJSON(PREFIX+'plan-day:'+k,getDay(d))}
function tasksOn(d){return state.tasks.filter(t=>Array.isArray(t.days)&&t.days.includes(d.getDay())).sort((a,b)=>a.start-b.start)}
function isToday(d){return dateKey(d)===dateKey(new Date())}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
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
function iconSvg(rawKey='check-circle'){const key=normalizeIconKey(rawKey);return `<i class="ph ph-${key}" aria-hidden="true"></i>`}
function taskIcon(taskOrLabel=''){if(typeof taskOrLabel==='object')return iconSvg(normalizeIconKey(taskOrLabel.icon)||inferIcon(taskOrLabel.label));return iconSvg(inferIcon(taskOrLabel))}
function taskState(t,d){return getDay(d)[t.id]||{}}
function nowMinutes(){const n=new Date();return n.getHours()*60+n.getMinutes()}
function currentTask(tasks,d){if(!isToday(d))return null;const n=nowMinutes();return tasks.find(t=>n>=t.start&&n<t.end)||null}
function nextTask(tasks,d){if(!isToday(d))return tasks.find(t=>!taskState(t,d).done)||null;const n=nowMinutes();return tasks.find(t=>t.start>n&&!taskState(t,d).done)||null}
function toggle(id,d=state.date){const data=getDay(d);data[id]={...(data[id]||{}),done:!data[id]?.done};saveDay(d);render()}
async function streak(t,from=state.date){let s=0,c=strip(from),seen=0;for(let i=0;i<180;i++){if(t.days.includes(c.getDay())){const done=!!getDay(c)[t.id]?.done;if(seen===0&&!done){}else if(done)s++;else break;seen++}c=addDays(c,-1)}return s}
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}
function top(){return `<div class="topbar"><div class="brand-wrap"><div><div class="brand">Planner</div><div class="greeting">${greeting()}</div></div></div><button class="icon-btn" id="backupBtn" aria-label="Backup and settings">⋯</button></div>`}
function navIcon(id){const icons={today:'<svg viewBox="0 0 24 24"><path d="M4 5.5h16v14H4z"/><path d="M8 3v5M16 3v5M4 9h16"/><path d="M8 13h3M8 16h5"/></svg>',calendar:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M8 2.5v4M16 2.5v4M3.5 9h17"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>',habits:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5V12l3 2"/></svg>',stats:'<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-7"/><path d="M3 20h18"/></svg>'};return icons[id]}
function nav(){const items=[['today','Today'],['calendar','Calendar'],['habits','Habits'],['stats','Stats']];document.getElementById('bottomNav').innerHTML=items.map(([id,l])=>`<button class="nav-item ${state.tab===id?'active':''}" data-tab="${id}"><span class="nav-icon">${navIcon(id)}</span><span>${l}</span></button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()})}
async function renderToday(){
const app=document.getElementById('app'),d=state.date,tasks=tasksOn(d),data=getDay(d),done=tasks.filter(t=>data[t.id]?.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0,cur=currentTask(tasks,d),next=nextTask(tasks,d),hero=cur||next;
const weekStart=addDays(d,-((d.getDay()+6)%7));
const weekStrip=Array.from({length:7},(_,i)=>{const wd=addDays(weekStart,i),active=dateKey(wd)===dateKey(d),hasTasks=tasksOn(wd).length>0;return `<button class="week-day ${active?'active':''} ${isToday(wd)?'today':''}" data-weekdate="${dateKey(wd)}"><b>${wd.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3).toUpperCase()}</b><span>${wd.getDate()}</span>${hasTasks?'<i></i>':''}</button>`}).join('');
const n=nowMinutes();
let rows='';
for(let i=0;i<tasks.length;i++){
  const t=tasks[i],isDone=!!data[t.id]?.done,isCur=cur?.id===t.id,duration=Math.max(0,t.end-t.start),prev=tasks[i-1];
  if(prev&&t.start>prev.end){const gap=t.start-prev.end;rows+=`<div class="structured-gap"><div class="structured-gap-time">${gap>=30?`${gap}m free`:''}</div><div></div><div class="structured-gap-line"></div></div>`}
  if(isToday(d)&&!cur&&n<t.start&&(i===0||n>=tasks[i-1].end)){rows+=`<div class="now-marker"><div class="now-marker-label">NOW</div><div class="now-marker-dot"></div><div class="now-marker-line"></div></div>`}
  rows+=`<div class="structured-row ${isDone?'done':''} ${isCur?'current':''}" style="--item-color:${t.color}" data-edit="${t.id}"><div class="structured-time">${mins(t.start)}</div><div class="structured-node" aria-hidden="true">${taskIcon(t)}</div><div class="structured-copy"><div class="structured-name">${esc(t.label)}</div><div class="structured-meta">${duration} min · until ${mins(t.end)}</div></div><button class="structured-check" data-toggle="${t.id}" aria-label="Toggle ${esc(t.label)}">${isDone?'✓':''}</button></div>`;
}
if(isToday(d)&&tasks.length&&n>=tasks[tasks.length-1].end){rows+=`<div class="now-marker"><div class="now-marker-label">NOW</div><div class="now-marker-dot"></div><div class="now-marker-line"></div></div>`}
app.innerHTML=top()+`<div class="date-row"><div><div class="kicker">${d.toLocaleDateString(undefined,{weekday:'long'})}</div><h1>${d.toLocaleDateString(undefined,{month:'long',day:'numeric'})}</h1></div><div class="date-controls"><button id="prevDay">‹</button><button id="nextDay">›</button></div></div><div class="week-strip">${weekStrip}</div>`+
(hero?`<div class="card hero ${cur?'current-hero':''}" style="--hero-color:${hero.color}"><div class="hero-label">${cur?'Now':'Up next'}</div><div class="hero-title">${esc(hero.label)}</div><div class="hero-time">${mins(hero.start)} – ${mins(hero.end)}</div><div class="hero-actions"><button class="primary" data-toggle="${hero.id}">${data[hero.id]?.done?'Undo':'Mark complete'}</button><button class="secondary" data-edit="${hero.id}">Edit</button></div></div>`:`<div class="card hero"><div class="hero-label">All clear</div><div class="hero-title">Nothing else scheduled</div><div class="hero-time">Use the + button to add a block.</div></div>`)+
`<div class="card progress-card"><div class="ring" style="--p:${pct}%"><span>${pct}%</span></div><div><div class="progress-title">${done} of ${tasks.length} complete</div><div class="progress-sub">${tasks.length-done?`${tasks.length-done} blocks remaining`:'Daily plan complete'}</div></div></div><div class="section-head"><h2>Daily schedule</h2><button id="goToday">${isToday(d)?'Today':'Go to today'}</button></div>`+
(tasks.length?`<div class="card day-timeline-card"><div class="timeline-summary"><strong>${mins(tasks[0].start)} – ${mins(tasks[tasks.length-1].end)}</strong><span>Tap an item to edit</span></div><div class="structured-timeline">${rows}</div></div>`:`<div class="empty"><b>No scheduled blocks</b>Add a block for this day.</div>`);
bindBase();document.getElementById('prevDay').onclick=()=>{state.date=addDays(d,-1);render()};document.getElementById('nextDay').onclick=()=>{state.date=addDays(d,1);render()};document.getElementById('goToday').onclick=()=>{state.date=strip(new Date());render()};document.querySelectorAll('[data-weekdate]').forEach(b=>b.onclick=()=>{state.date=new Date(b.dataset.weekdate+'T00:00:00');render()});bindTasks();bindSwipe(app,dx=>{state.date=addDays(state.date,dx>0?-1:1);render()});
}
function taskHTML(t,d,current=false){const done=!!taskState(t,d).done;return `<div class="task ${done?'done':''} ${current?'current':''}" style="--task-color:${t.color}" data-edit="${t.id}"><button class="check" data-toggle="${t.id}" aria-label="Toggle ${esc(t.label)}">${done?'✓':''}</button><div><div class="task-name">${esc(t.label)}</div><div class="task-meta">${mins(t.start)} – ${mins(t.end)}</div></div><i class="task-dot"></i></div>`}
async function renderCalendar(){const app=document.getElementById('app'),m=state.month,first=new Date(m.getFullYear(),m.getMonth(),1),start=addDays(first,-((first.getDay()+6)%7)),cells=[];for(let i=0;i<42;i++){const d=addDays(start,i),ts=tasksOn(d),dn=ts.filter(t=>getDay(d)[t.id]?.done).length,cnt=Math.min(dn,3);cells.push(`<button class="day ${d.getMonth()!==m.getMonth()?'other':''} ${isToday(d)?'today':''} ${dateKey(d)===dateKey(state.date)?'selected':''}" data-date="${dateKey(d)}"><span>${d.getDate()}</span><span class="mini">${'<i></i>'.repeat(cnt)}</span></button>`)}
const selected=tasksOn(state.date);app.innerHTML=top()+`<div class="month-head"><h2>${m.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2><div class="month-controls"><button id="prevMonth">‹</button><button id="nextMonth">›</button></div></div><div class="card"><div class="calendar">${['M','T','W','T','F','S','S'].map(x=>`<div class="dow">${x}</div>`).join('')}${cells.join('')}</div></div><div class="section-head"><h2>${state.date.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'})}</h2><button id="openDay">Open day</button></div><div class="task-list">${selected.length?selected.map(t=>taskHTML(t,state.date,false)).join(''):`<div class="empty"><b>No blocks</b>This day has no recurring schedule.</div>`}</div>`;
bindBase();document.getElementById('prevMonth').onclick=()=>{state.month=new Date(m.getFullYear(),m.getMonth()-1,1);render()};document.getElementById('nextMonth').onclick=()=>{state.month=new Date(m.getFullYear(),m.getMonth()+1,1);render()};document.getElementById('openDay').onclick=()=>{state.tab='today';render()};document.querySelectorAll('[data-date]').forEach(b=>b.onclick=()=>{state.date=new Date(b.dataset.date+'T00:00:00');state.month=new Date(state.date.getFullYear(),state.date.getMonth(),1);render()});bindTasks()}
async function renderHabits(){
const app=document.getElementById('app'),today=strip(new Date()),rows=[];
for(const t of state.tasks.slice().sort((a,b)=>a.start-b.start)){
  const s=await streak(t,today),dots=[];let scheduled=0,completed=0;
  for(let i=6;i>=0;i--){const d=addDays(today,-i),active=t.days.includes(d.getDay()),done=active&&!!getDay(d)[t.id]?.done;if(active){scheduled++;if(done)completed++}dots.push(active?`<span class="${done?'on':''}"></span>`:`<span class="na"></span>`)}
  const pct=scheduled?Math.round(completed/scheduled*100):0;
  rows.push(`<button class="habit-row" data-edit="${t.id}" style="--habit-color:${t.color}"><span class="habit-icon">${iconFor(t)}</span><span class="habit-main"><span class="habit-top"><b>${esc(t.label)}</b><strong>${s} day${s===1?'':'s'}</strong></span><span class="habit-sub">${pct}% this week · ${mins(t.start)}</span><span class="habit-progress"><i style="width:${pct}%"></i></span><span class="week-dots">${dots.join('')}</span></span><span class="habit-chevron">›</span></button>`)
}
app.innerHTML=top()+`<div class="date-row"><div><div class="kicker">Consistency</div><h1>Habits</h1></div></div><div class="habit-summary"><span><b>${state.tasks.length}</b> recurring blocks</span><span>Past 7 days</span></div><div class="habit-list">${rows.join('')}</div>`;
bindBase();document.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>openEditor(x.dataset.edit))
}
async function renderStats(){const app=document.getElementById('app'),today=strip(new Date());let done30=0,total30=0,done7=0,total7=0,totalMinutes=0;const byDay=[];for(let i=29;i>=0;i--){const d=addDays(today,-i),ts=tasksOn(d),dn=ts.filter(t=>getDay(d)[t.id]?.done).length;total30+=ts.length;done30+=dn;if(i<7){total7+=ts.length;done7+=dn}ts.forEach(t=>{if(getDay(d)[t.id]?.done)totalMinutes+=Math.max(0,t.end-t.start)});byDay.push(ts.length?Math.round(dn/ts.length*100):0)}let best=0;for(const t of state.tasks)best=Math.max(best,await streak(t,today));const p30=total30?Math.round(done30/total30*100):0,p7=total7?Math.round(done7/total7*100):0;app.innerHTML=top()+`<div class="date-row"><div><div class="kicker">Your progress</div><h1>Stats</h1></div></div><div class="stats-grid"><div class="stat"><div class="stat-num">${p7}%</div><div class="stat-label">Last 7 days</div></div><div class="stat"><div class="stat-num">${p30}%</div><div class="stat-label">Last 30 days</div></div><div class="stat"><div class="stat-num">${best}</div><div class="stat-label">Best current streak</div></div><div class="stat"><div class="stat-num">${(totalMinutes/60).toFixed(1)}</div><div class="stat-label">Completed hours · 30d</div></div><div class="stat wide"><div class="progress-title">Recent consistency</div>${[7,14,30].map(n=>{const vals=byDay.slice(-n),p=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;return `<div class="bar-row"><div class="bar-label"><span>${n} day average</span><b>${p}%</b></div><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div></div>`}).join('')}</div><div class="stat wide"><div class="progress-title">Data stays on this device</div><div class="progress-sub">Use Backup from the top-right menu to protect schedule and history.</div></div></div>`;bindBase()}
function bindTasks(){document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=e=>{e.stopPropagation();const row=b.closest('.structured-row,.task');if(row){row.classList.add('completing');setTimeout(()=>toggle(b.dataset.toggle),150)}else toggle(b.dataset.toggle)});document.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>openEditor(x.dataset.edit));document.querySelectorAll('.structured-row[data-edit]').forEach(row=>{let timer=null,moved=false;row.addEventListener('touchstart',()=>{moved=false;timer=setTimeout(()=>{navigator.vibrate?.(12);openEditor(row.dataset.edit)},520)},{passive:true});row.addEventListener('touchmove',()=>{moved=true;clearTimeout(timer)},{passive:true});row.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});row.addEventListener('touchcancel',()=>clearTimeout(timer),{passive:true})})}
function bindBase(){document.getElementById('backupBtn').onclick=openBackup}
function render(){nav();document.getElementById('fab').style.display=state.tab==='stats'?'none':'block';if(state.tab==='today')renderToday();else if(state.tab==='calendar')renderCalendar();else if(state.tab==='habits')renderHabits();else renderStats()}
function iconFor(task){return taskIcon(task)}
function openEditor(id=null){
state.editing=id?state.tasks.find(t=>t.id===id):null;
const t=state.editing||{label:'',start:540,end:600,days:[state.date.getDay()],color:COLORS[0],icon:'clock-3'};
const initialIcon=normalizeIconKey(t.icon||inferIcon(t.label));
const wrap=document.createElement('div');wrap.className='sheet-wrap';
wrap.innerHTML=`<div class="sheet"><div class="grab"></div><h3>${id?'Edit block':'New block'}</h3>
<div class="icon-preview" style="--preview-color:${t.color}"><div class="icon-preview-box" id="iconPreview">${iconSvg(initialIcon)}</div><div class="icon-preview-copy"><b id="previewName">${esc(t.label||'New block')}</b><small id="previewIconName">${ICON_NAMES[initialIcon]}</small></div></div>
<div class="field"><label>Name</label><input id="fLabel" value="${esc(t.label)}" placeholder="What are you doing?"></div>
<div class="field"><label>Icon</label><div class="icon-grid">${ICON_KEYS.map(k=>`<button type="button" class="icon-choice ${initialIcon===k?'on':''}" data-icon="${k}" aria-label="${ICON_NAMES[k]}">${iconSvg(k)}<span>${ICON_NAMES[k]}</span></button>`).join('')}</div></div>
<div class="row"><div class="field"><label>Start</label><input id="fStart" type="time" value="${timeInput(t.start)}"></div><div class="field"><label>End</label><input id="fEnd" type="time" value="${timeInput(t.end)}"></div></div>
<div class="field"><label>Repeats</label><div class="preset-row"><button type="button" class="preset-btn" data-repeat="weekdays">Weekdays</button><button type="button" class="preset-btn" data-repeat="weekends">Weekends</button><button type="button" class="preset-btn" data-repeat="daily">Every day</button><button type="button" class="preset-btn" data-repeat="once">This day</button></div><div class="days">${DAYS.map((d,i)=>`<button type="button" class="daypick ${t.days.includes(i)?'on':''}" data-daypick="${i}">${d}</button>`).join('')}</div></div>
<div class="field"><label>Color</label><div class="colors">${COLORS.map(c=>`<button type="button" class="swatch ${t.color===c?'on':''}" style="background:${c}" data-color="${c}" aria-label="Choose color"></button>`).join('')}</div></div>
<div class="sheet-actions">${id?'<button class="danger" id="deleteTask">Delete</button>':''}<button class="secondary" id="cancelEdit">Cancel</button><button class="primary" id="saveTask">Save</button></div></div>`;
document.body.appendChild(wrap);
let selectedDays=new Set(t.days),selectedColor=t.color,selectedIcon=initialIcon;
const updatePreview=()=>{wrap.querySelector('#iconPreview').innerHTML=iconSvg(selectedIcon);wrap.querySelector('#previewIconName').textContent=ICON_NAMES[selectedIcon];wrap.querySelector('.icon-preview').style.setProperty('--preview-color',selectedColor);wrap.querySelector('#previewName').textContent=wrap.querySelector('#fLabel').value.trim()||'New block'};
const syncDays=()=>wrap.querySelectorAll('[data-daypick]').forEach(b=>b.classList.toggle('on',selectedDays.has(+b.dataset.daypick)));
wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
wrap.querySelector('#fLabel').addEventListener('input',updatePreview);
wrap.querySelectorAll('[data-icon]').forEach(b=>b.onclick=()=>{selectedIcon=b.dataset.icon;wrap.querySelectorAll('[data-icon]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
wrap.querySelectorAll('[data-daypick]').forEach(b=>b.onclick=()=>{const n=+b.dataset.daypick;selectedDays.has(n)?selectedDays.delete(n):selectedDays.add(n);syncDays()});
wrap.querySelectorAll('[data-repeat]').forEach(b=>b.onclick=()=>{const mode=b.dataset.repeat;selectedDays=new Set(mode==='weekdays'?[1,2,3,4,5]:mode==='weekends'?[0,6]:mode==='daily'?[0,1,2,3,4,5,6]:[state.date.getDay()]);syncDays();wrap.querySelectorAll('[data-repeat]').forEach(x=>x.classList.toggle('on',x===b))});
wrap.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{selectedColor=b.dataset.color;wrap.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
wrap.querySelector('#cancelEdit').onclick=()=>wrap.remove();
const del=wrap.querySelector('#deleteTask');if(del)del.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==id);saveTasks();wrap.remove();render()};
wrap.querySelector('#saveTask').onclick=()=>{const label=wrap.querySelector('#fLabel').value.trim(),start=fromTime(wrap.querySelector('#fStart').value),end=fromTime(wrap.querySelector('#fEnd').value);if(!label)return toast('Add a name');if(!selectedDays.size)return toast('Choose at least one day');if(end<=start)return toast('End time must be later');if(id){Object.assign(state.editing,{label,start,end,days:[...selectedDays],color:selectedColor,icon:selectedIcon})}else state.tasks.push({id:'t'+Date.now(),label,start,end,days:[...selectedDays],color:selectedColor,icon:selectedIcon});saveTasks();wrap.remove();render()}
}
function collectBackup(){const days={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k&&k.startsWith(PREFIX+'plan-day:'))days[k.slice((PREFIX+'plan-day:').length)]=loadJSON(k,{})}return {version:2,exportedAt:new Date().toISOString(),tasks:state.tasks,days}}
function openBackup(){const data=JSON.stringify(collectBackup(),null,2),wrap=document.createElement('div');wrap.className='sheet-wrap';wrap.innerHTML=`<div class="sheet"><div class="grab"></div><h3>Backup & restore</h3><div class="field"><label>Full backup</label><textarea class="backup" id="backupText">${esc(data)}</textarea></div><div class="field"><label>Restore from backup</label><textarea class="backup" id="restoreText" placeholder="Paste backup JSON here"></textarea></div><div class="sheet-actions"><button class="secondary" id="closeBackup">Close</button><button class="secondary" id="copyBackup">Copy</button><button class="primary" id="restoreBackup">Restore</button></div></div>`;document.body.appendChild(wrap);wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};wrap.querySelector('#closeBackup').onclick=()=>wrap.remove();wrap.querySelector('#copyBackup').onclick=async()=>{try{await navigator.clipboard.writeText(data);toast('Backup copied')}catch{wrap.querySelector('#backupText').select();document.execCommand('copy');toast('Backup copied')}};wrap.querySelector('#restoreBackup').onclick=()=>{try{const obj=JSON.parse(wrap.querySelector('#restoreText').value);if(!Array.isArray(obj.tasks)||typeof obj.days!=='object')throw 0;state.tasks=obj.tasks;saveTasks();Object.entries(obj.days).forEach(([k,v])=>saveJSON(PREFIX+'plan-day:'+k,v));state.dayCache={};wrap.remove();render();toast('Backup restored')}catch{toast('That backup is not valid')}}}
function toast(msg){document.querySelector('.toast')?.remove();const x=document.createElement('div');x.className='toast';x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
function bindSwipe(el,fn){let x=null,y=null;el.ontouchstart=e=>{if(e.touches.length===1&&!e.target.closest('button,input,textarea,.sheet')){x=e.touches[0].clientX;y=e.touches[0].clientY}};el.ontouchend=e=>{if(x===null)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;x=y=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)fn(dx)}}
document.getElementById('fab').onclick=()=>openEditor();if(!localStorage.getItem(PREFIX+'tasks'))saveTasks();migrateV7();migrateV10();migrateV11();localStorage.setItem(PREFIX+'ui-version','11');render();setInterval(()=>{if(state.tab==='today'&&isToday(state.date))render()},60000);
})();
