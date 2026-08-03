(()=>{
'use strict';
// Keep this namespace stable so existing on-device data remains available.
// Storage and application state
const STORAGE_PREFIX='sdp-v2:';
const {PALETTE,COLORS,DAYS,WEEKDAYS,DEFAULT_HABITS,DEFAULT_TASKS}=window.PlannerDefaults;
const {cloneHabit,cloneTask,habitWeekSummary,habitWeekStreak,validateHabits}=window.PlannerHabitModel;
const {ICON_KEYS,ICON_NAMES,normalizeIconKey,inferIcon,iconHtml,taskIcon}=window.PlannerIcons;

function freshDefaultTasks(){return DEFAULT_TASKS.map(cloneTask)}
function freshDefaultHabits(){return DEFAULT_HABITS.map(cloneHabit)}

const state={tab:'today',date:strip(new Date()),month:strip(new Date()),habitMonth:strip(new Date()),habitWeekStart:startOfWeek(new Date()),habits:loadJSON(STORAGE_PREFIX+'habits',null)||freshDefaultHabits(),tasks:loadJSON(STORAGE_PREFIX+'tasks',null)||freshDefaultTasks(),dayCache:{},editing:null};
const PROD_RELEASE='2.2';
function applyProd21Defaults(){
  const releaseKey=STORAGE_PREFIX+'release';
  if(localStorage.getItem(releaseKey)===PROD_RELEASE)return;
  const career=state.habits.find(h=>h.id==='h-learning');
  if(career)Object.assign(career,{label:'Career',color:PALETTE.coral,icon:'briefcase'});
  const markets=state.habits.find(h=>h.id==='h-markets');
  if(markets)markets.color=PALETTE.gold;
  const mindfulness=state.habits.find(h=>h.id==='h-mindfulness');
  if(mindfulness)mindfulness.color=PALETTE.purple;
  const work=state.tasks.find(t=>t.id==='t5');
  if(work)work.habitId='h-learning';
  saveJSON(STORAGE_PREFIX+'habits',state.habits);
  saveJSON(STORAGE_PREFIX+'tasks',state.tasks);
  localStorage.setItem(releaseKey,PROD_RELEASE);
}
applyProd21Defaults();
function strip(d){const x=new Date(d);x.setHours(0,0,0,0);return x}
function addDays(d,n){const x=new Date(d);x.setDate(x.getDate()+n);return x}
function startOfWeek(d){const x=strip(d);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
function endOfWeek(d){return addDays(startOfWeek(d),6)}

// Date and formatting utilities
function dateKey(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function mins(m){let h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM';h%=12;if(!h)h=12;return `${h}:${String(mm).padStart(2,'0')} ${ap}`}
function timeInput(m){return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}`}
function fromTime(v){const [h,m]=v.split(':').map(Number);return h*60+m}
function loadJSON(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch{return f}}
function saveJSON(k,v){try{localStorage.setItem(k,JSON.stringify(v));return true}catch{toast('Could not save on this device');return false}}
function saveTasks(){saveJSON(STORAGE_PREFIX+'tasks',state.tasks)}
function saveHabits(){saveJSON(STORAGE_PREFIX+'habits',state.habits)}
function habitById(id){return state.habits.find(h=>h.id===id)||null}
function getDay(d){const k=dateKey(d);if(!(k in state.dayCache))state.dayCache[k]=loadJSON(STORAGE_PREFIX+'plan-day:'+k,{});return state.dayCache[k]}
function saveDay(d){const k=dateKey(d);saveJSON(STORAGE_PREFIX+'plan-day:'+k,getDay(d))}
function tasksOn(d){return state.tasks.filter(t=>Array.isArray(t.days)&&t.days.includes(d.getDay())).sort((a,b)=>a.start-b.start)}
function isToday(d){return dateKey(d)===dateKey(new Date())}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}

// Per-day task state, focus, and notes
function taskState(t,d){return getDay(d)[t.id]||{}}
function dailyFocus(d=state.date){return getDay(d).__focus||''}
function saveDailyFocus(value,d=state.date){const data=getDay(d);data.__focus=String(value||'').trim();saveDay(d)}
function taskNote(t,d=state.date){return taskState(t,d).note||''}
function saveTaskNote(id,value,d=state.date){const data=getDay(d);data[id]={...(data[id]||{}),note:String(value||'').trim()};saveDay(d)}
function nowMinutes(){const n=new Date();return n.getHours()*60+n.getMinutes()}
function currentTask(tasks,d){if(!isToday(d))return null;const n=nowMinutes();return tasks.find(t=>n>=t.start&&n<t.end)||null}
function nextTask(tasks,d){if(!isToday(d))return tasks.find(t=>!taskState(t,d).done)||null;const n=nowMinutes();return tasks.find(t=>t.start>n&&!taskState(t,d).done)||null}
function toggle(id,d=state.date){const data=getDay(d);data[id]={...(data[id]||{}),done:!data[id]?.done};saveDay(d);render()}

// Progress calculations
function habitSummary(habit,from=state.date){return habitWeekSummary(habit,state.tasks,getDay,from)}
function habitStreak(habit,from=state.date){return habitWeekStreak(habit,state.tasks,getDay,from)}
function dayProgress(d,tasks=tasksOn(d)){
  const completed=tasks.filter(t=>getDay(d)[t.id]?.done).length;
  const total=tasks.length;
  return {completed,total,percent:total?Math.round(completed/total*100):null,state:!total?'empty':completed===0?'none':completed===total?'complete':'partial'};
}
function habitDayProgress(habit,d){
  const linked=tasksOn(d).filter(t=>t.habitId===habit.id);
  const completed=linked.filter(t=>getDay(d)[t.id]?.done).length;
  return {completed,total:linked.length,state:!linked.length?'empty':completed===0?'none':completed===linked.length?'complete':'partial'};
}
function greeting(){const h=new Date().getHours();return h<12?'Good morning':h<17?'Good afternoon':'Good evening'}

// Shared interface rendering
function top(){return `<div class="topbar"><div class="brand-wrap"><div><div class="brand">Planner</div><div class="greeting">${greeting()}</div></div></div><button class="icon-btn" id="backupBtn" aria-label="Backup and settings">⋯</button></div>`}
function navIcon(id){const icons={today:'<svg viewBox="0 0 24 24"><path d="M4 5.5h16v14H4z"/><path d="M8 3v5M16 3v5M4 9h16"/><path d="M8 13h3M8 16h5"/></svg>',calendar:'<svg viewBox="0 0 24 24"><rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M8 2.5v4M16 2.5v4M3.5 9h17"/><path d="M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01"/></svg>',habits:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 7.5V12l3 2"/></svg>',stats:'<svg viewBox="0 0 24 24"><path d="M5 20V11M12 20V5M19 20v-7"/><path d="M3 20h18"/></svg>'};return icons[id]}
function nav(){const items=[['today','Today'],['calendar','Calendar'],['habits','Habits'],['stats','Stats']];document.getElementById('bottomNav').innerHTML=items.map(([id,l])=>`<button class="nav-item ${state.tab===id?'active':''}" data-tab="${id}"><span class="nav-icon">${navIcon(id)}</span><span>${l}</span></button>`).join('');document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;render()})}

// Today view
async function renderToday(){
const app=document.getElementById('app'),d=state.date,tasks=tasksOn(d),data=getDay(d),done=tasks.filter(t=>data[t.id]?.done).length,pct=tasks.length?Math.round(done/tasks.length*100):0,cur=currentTask(tasks,d),next=nextTask(tasks,d),hero=cur||next;
const weekStart=addDays(d,-((d.getDay()+6)%7));
const weekStrip=Array.from({length:7},(_,i)=>{const wd=addDays(weekStart,i),active=dateKey(wd)===dateKey(d),progress=dayProgress(wd);return `<button class="week-day ${active?'active':''} ${isToday(wd)?'today':''}" data-weekdate="${dateKey(wd)}" aria-label="${wd.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}: ${progress.total?`${progress.completed} of ${progress.total} blocks complete`:'no scheduled blocks'}"><b>${wd.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3).toUpperCase()}</b><span>${wd.getDate()}</span><i class="week-progress ${progress.state}" title="${progress.total?`${progress.completed} of ${progress.total} complete`:'No scheduled blocks'}"></i></button>`}).join('');
const n=nowMinutes();
let rows='';
for(let i=0;i<tasks.length;i++){
  const t=tasks[i],isDone=!!data[t.id]?.done,isCur=cur?.id===t.id,duration=Math.max(0,t.end-t.start),prev=tasks[i-1];
  if(prev&&t.start>prev.end){const gap=t.start-prev.end;rows+=`<button type="button" class="structured-gap" data-gap-start="${prev.end}" data-gap-end="${t.start}" aria-label="Create a block from ${mins(prev.end)} to ${mins(t.start)}"><div class="structured-gap-time">${mins(prev.end)}<br>${mins(t.start)}</div><div class="structured-gap-icon">＋</div><div class="structured-gap-copy"><b>Free time</b><span>${gap} minutes available · tap to add</span></div></button>`}
  if(isToday(d)&&!cur&&n<t.start&&(i===0||n>=tasks[i-1].end)){rows+=`<div class="now-marker"><div class="now-marker-label">NOW</div><div class="now-marker-dot"></div><div class="now-marker-line"></div></div>`}
  const note=taskNote(t,d);rows+=`<div class="structured-row ${isDone?'done':''} ${isCur?'current':''}" style="--item-color:${t.color}" data-edit="${t.id}"><div class="structured-time">${mins(t.start)}</div><div class="structured-node" aria-hidden="true">${taskIcon(t)}</div><div class="structured-copy"><div class="structured-name">${esc(t.label)}</div><div class="structured-meta">${duration} min · until ${mins(t.end)}</div>${note?`<div class="structured-note">${esc(note)}</div>`:''}</div><button class="structured-check" data-toggle="${t.id}" aria-label="Toggle ${esc(t.label)}">${isDone?'✓':''}</button></div>`;
}
if(isToday(d)&&tasks.length&&n>=tasks[tasks.length-1].end){rows+=`<div class="now-marker"><div class="now-marker-label">NOW</div><div class="now-marker-dot"></div><div class="now-marker-line"></div></div>`}
app.innerHTML=top()+`<div class="date-row"><div><div class="kicker">${d.toLocaleDateString(undefined,{weekday:'long'})}</div><h1>${d.toLocaleDateString(undefined,{month:'long',day:'numeric'})}</h1></div><div class="date-controls"><button id="prevDay">‹</button><button id="nextDay">›</button></div></div><div class="week-strip">${weekStrip}</div><div class="card daily-focus-card"><div class="daily-focus-heading"><span>Daily focus</span><small>Set for this day only</small></div><textarea id="dailyFocus" rows="2" maxlength="180" placeholder="What matters most today?">${esc(dailyFocus(d))}</textarea></div>`+
(hero?`<div class="card hero ${cur?'current-hero':''}" style="--hero-color:${hero.color}"><div class="hero-label">${cur?'Now':'Up next'}</div><div class="hero-title">${esc(hero.label)}</div><div class="hero-time">${mins(hero.start)} – ${mins(hero.end)}</div><div class="hero-actions"><button class="primary" data-toggle="${hero.id}">${data[hero.id]?.done?'Undo':'Mark complete'}</button><button class="secondary" data-edit="${hero.id}">Edit</button></div></div>`:`<div class="card hero"><div class="hero-label">All clear</div><div class="hero-title">Nothing else scheduled</div><div class="hero-time">Use the + button to add a block.</div></div>`)+
`<div class="card progress-card"><div class="ring" style="--p:${pct}%"><span>${pct}%</span></div><div><div class="progress-title">${done} of ${tasks.length} complete</div><div class="progress-sub">${tasks.length-done?`${tasks.length-done} blocks remaining`:'Daily plan complete'}</div></div></div><div class="section-head"><h2>Daily schedule</h2><button id="goToday">${isToday(d)?'Today':'Go to today'}</button></div>`+
(tasks.length?`<div class="card day-timeline-card"><div class="timeline-summary"><strong>${mins(tasks[0].start)} – ${mins(tasks[tasks.length-1].end)}</strong><span>Tap an item to edit</span></div><div class="structured-timeline">${rows}</div></div>`:`<div class="empty"><b>No scheduled blocks</b>Add a block for this day.</div>`);
bindBase();const focusInput=document.getElementById('dailyFocus');let focusTimer=null;focusInput.oninput=()=>{clearTimeout(focusTimer);focusTimer=setTimeout(()=>saveDailyFocus(focusInput.value,d),350)};focusInput.onblur=()=>saveDailyFocus(focusInput.value,d);document.getElementById('prevDay').onclick=()=>{state.date=addDays(d,-1);render()};document.getElementById('nextDay').onclick=()=>{state.date=addDays(d,1);render()};document.getElementById('goToday').onclick=()=>{state.date=strip(new Date());render()};document.querySelectorAll('[data-weekdate]').forEach(b=>b.onclick=()=>{state.date=new Date(b.dataset.weekdate+'T00:00:00');render()});document.querySelectorAll('[data-gap-start]').forEach(gap=>gap.onclick=()=>openEditor(null,{start:+gap.dataset.gapStart,end:+gap.dataset.gapEnd,days:[state.date.getDay()] }));bindTasks();bindSwipe(app,dx=>{state.date=addDays(state.date,dx>0?-1:1);render()});
}

// Calendar view
function calendarDaySnapshot(d){
  const scheduledHabits=state.habits.map(habit=>({habit,progress:habitDayProgress(habit,d)})).filter(item=>item.progress.total>0);
  const all=dayProgress(d);
  const rows=scheduledHabits.map(({habit,progress})=>{
    const label=progress.state==='complete'?'Complete':progress.state==='partial'?'Partial':'Missed';
    const percent=progress.total?Math.round(progress.completed/progress.total*100):0;
    const mark=progress.state==='complete'?'✓':progress.state==='partial'?'◐':'×';
    return `<div class="snapshot-habit ${progress.state}" style="--habit-color:${habit.color};--habit-progress:${percent}%"><span class="snapshot-habit-mark">${mark}</span><span class="snapshot-habit-copy"><b>${esc(habit.label)}</b><small>${progress.completed} of ${progress.total} blocks</small></span><span class="snapshot-status">${label}</span><span class="snapshot-mini-track"><i></i></span></div>`;
  }).join('');
  return `<div class="card day-snapshot"><div class="snapshot-head"><div><div class="kicker">Day snapshot</div><h3>${d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}</h3></div><div class="snapshot-head-actions"><strong>${all.percent===null?'—':`${all.percent}%`}</strong><button id="openDay">Open day <span>→</span></button></div></div>${rows||'<div class="snapshot-empty">No habits were scheduled for this day.</div>'}<div class="snapshot-footer"><span>${all.total?`${all.completed} of ${all.total} blocks completed`:'No recurring blocks scheduled'}</span>${dailyFocus(d)?`<small><b>Focus</b>${esc(dailyFocus(d))}</small>`:''}</div></div>`;
}
async function renderCalendar(){
  const app=document.getElementById('app'),m=state.month,first=new Date(m.getFullYear(),m.getMonth(),1),start=addDays(first,-((first.getDay()+6)%7));
  const dayCells=[];
  for(let i=0;i<42;i++){
    const d=addDays(start,i),progress=dayProgress(d),outside=d.getMonth()!==m.getMonth();
    dayCells.push(`<button class="heat-day ${outside?'other':''} ${isToday(d)?'today':''} ${dateKey(d)===dateKey(state.date)?'selected':''} level-${progress.percent===null?'empty':progress.percent<40?'low':progress.percent<80?'mid':'high'}" data-date="${dateKey(d)}" aria-label="${d.toLocaleDateString(undefined,{month:'long',day:'numeric'})}: ${progress.total?`${progress.percent}% complete`:'no scheduled blocks'}"><span>${d.getDate()}</span><small>${progress.percent===null?'':`${progress.percent}%`}</small></button>`);
  }
  const overall=`<div class="card calendar-card"><div class="calendar heat-calendar">${['M','T','W','T','F','S','S'].map(x=>`<div class="dow">${x}</div>`).join('')}${dayCells.join('')}</div><div class="heat-legend"><span>Less</span><i class="level-empty"></i><i class="level-low"></i><i class="level-mid"></i><i class="level-high"></i><span>More</span></div></div>`;
  app.innerHTML=top()+`<div class="month-head"><div><div class="kicker">Daily history</div><h2>${m.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2></div><div class="month-controls"><button id="prevMonth">‹</button><button id="nextMonth">›</button></div></div>${overall}${calendarDaySnapshot(state.date)}`;
  bindBase();
  document.getElementById('prevMonth').onclick=()=>{state.month=new Date(m.getFullYear(),m.getMonth()-1,1);state.date=new Date(state.month);render()};
  document.getElementById('nextMonth').onclick=()=>{state.month=new Date(m.getFullYear(),m.getMonth()+1,1);state.date=new Date(state.month);render()};
  document.querySelectorAll('[data-date]').forEach(button=>button.onclick=()=>{state.date=new Date(button.dataset.date+'T00:00:00');if(state.date.getMonth()!==state.month.getMonth()||state.date.getFullYear()!==state.month.getFullYear())state.month=new Date(state.date.getFullYear(),state.date.getMonth(),1);render()});
  document.getElementById('openDay').onclick=()=>{state.tab='today';render()};
}

function habitMonthSummary(habit,month){
  const first=new Date(month.getFullYear(),month.getMonth(),1),last=new Date(month.getFullYear(),month.getMonth()+1,0);
  let scheduled=0,completed=0;
  for(let d=new Date(first);d<=last;d=addDays(d,1)){
    const progress=habitDayProgress(habit,d);
    scheduled+=progress.total;completed+=progress.completed;
  }
  return {scheduled,completed,percent:scheduled?Math.round(completed/scheduled*100):0};
}
function longestHabitStreak(habit,anchor=new Date(),limit=104){
  let longest=0,current=0;
  const currentStart=startOfWeek(anchor);
  for(let offset=limit-1;offset>=0;offset--){
    const week=addDays(currentStart,-7*offset),summary=habitWeekSummary(habit,state.tasks,getDay,week);
    if(summary.completed>=summary.target){current++;longest=Math.max(longest,current)}else current=0;
  }
  return longest;
}
function normalizeHabitWeek(month,week){
  const monthStart=new Date(month.getFullYear(),month.getMonth(),1),monthEnd=new Date(month.getFullYear(),month.getMonth()+1,0);
  let normalized=startOfWeek(week);
  if(endOfWeek(normalized)<monthStart)normalized=startOfWeek(monthStart);
  if(normalized>monthEnd)normalized=startOfWeek(monthEnd);
  return normalized;
}
async function renderHabits(){
  const app=document.getElementById('app'),month=new Date(state.habitMonth.getFullYear(),state.habitMonth.getMonth(),1);
  state.habitWeekStart=normalizeHabitWeek(month,state.habitWeekStart);
  const weekStart=state.habitWeekStart,weekEnd=endOfWeek(weekStart),today=strip(new Date());
  const monthRows=state.habits.map(habit=>{const summary=habitMonthSummary(habit,month);return `<div class="habit-month-row" style="--habit-color:${habit.color}"><div><span><i></i>${esc(habit.label)}</span><b>${summary.percent}%</b></div><div class="habit-month-track"><i style="width:${summary.percent}%"></i></div></div>`}).join('');
  const cards=state.habits.map(habit=>{
    const summary=habitWeekSummary(habit,state.tasks,getDay,weekStart),current=habitStreak(habit,today),longest=longestHabitStreak(habit,today);
    const dayLabels=Array.from({length:7},(_,i)=>addDays(weekStart,i).toLocaleDateString(undefined,{weekday:'short'}).slice(0,1));
    const dots=summary.dots.map((day,i)=>{const d=addDays(weekStart,i),stateName=!day.scheduled?'empty':day.completed===0?'none':day.completed===day.scheduled?'complete':'partial';return `<button class="habit-day ${stateName} ${isToday(d)?'today':''}" style="--habit-color:${habit.color}" data-habit-day="${dateKey(d)}" aria-label="${habit.label}, ${d.toLocaleDateString(undefined,{weekday:'long',month:'long',day:'numeric'})}: ${day.scheduled?`${day.completed} of ${day.scheduled} complete`:'not scheduled'}"><span>${dayLabels[i]}</span><i></i></button>`}).join('');
    return `<article class="card habit-week-card" style="--habit-color:${habit.color}"><button class="habit-card-title" data-habit-edit="${habit.id}"><span class="habit-icon">${iconHtml(habit.icon||'check-circle')}</span><span><b>${esc(habit.label)}</b><small>${summary.completed} of ${summary.target} this week</small></span><strong>${summary.percent}%</strong></button><div class="habit-progress"><i style="width:${summary.percent}%"></i></div><div class="habit-week-days">${dots}</div><div class="habit-card-stats"><span><b>${current}</b>Current streak</span><span><b>${longest}</b>Longest streak</span></div></article>`;
  }).join('');
  app.innerHTML=top()+`<div class="month-head habits-month-head"><div><div class="kicker">Consistency</div><h2>${month.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</h2></div><div class="month-controls"><button id="prevHabitMonth">‹</button><button id="nextHabitMonth">›</button></div></div><div class="card habit-month-summary"><div class="summary-title"><b>Monthly progress</b><span>Completed scheduled blocks</span></div>${monthRows||'<div class="snapshot-empty">No habits yet.</div>'}</div><div class="week-selector"><button id="prevHabitWeek">‹</button><div><small>Selected week</small><b>${weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</b></div><button id="nextHabitWeek">›</button></div><div class="habit-week-list">${cards||'<div class="empty"><b>No habits yet</b>Use the + button to add your first central habit.</div>'}</div>`;
  bindBase();
  document.getElementById('prevHabitMonth').onclick=()=>{state.habitMonth=new Date(month.getFullYear(),month.getMonth()-1,1);state.habitWeekStart=startOfWeek(state.habitMonth);render()};
  document.getElementById('nextHabitMonth').onclick=()=>{state.habitMonth=new Date(month.getFullYear(),month.getMonth()+1,1);state.habitWeekStart=startOfWeek(state.habitMonth);render()};
  document.getElementById('prevHabitWeek').onclick=()=>{const next=addDays(weekStart,-7);state.habitWeekStart=next;state.habitMonth=new Date(next.getFullYear(),next.getMonth(),1);render()};
  document.getElementById('nextHabitWeek').onclick=()=>{const next=addDays(weekStart,7);state.habitWeekStart=next;state.habitMonth=new Date(next.getFullYear(),next.getMonth(),1);render()};
  document.querySelectorAll('[data-habit-edit]').forEach(x=>x.onclick=()=>openHabitEditor(x.dataset.habitEdit));
  document.querySelectorAll('[data-habit-day]').forEach(x=>x.onclick=()=>{state.date=new Date(x.dataset.habitDay+'T00:00:00');state.tab='today';render()});
}
async function renderStats(){const app=document.getElementById('app'),today=strip(new Date());let done30=0,total30=0,done7=0,total7=0,totalMinutes=0;const byDay=[];for(let i=29;i>=0;i--){const d=addDays(today,-i),ts=tasksOn(d),dn=ts.filter(t=>getDay(d)[t.id]?.done).length;total30+=ts.length;done30+=dn;if(i<7){total7+=ts.length;done7+=dn}ts.forEach(t=>{if(getDay(d)[t.id]?.done)totalMinutes+=Math.max(0,t.end-t.start)});byDay.push(ts.length?Math.round(dn/ts.length*100):0)}let best=0;for(const habit of state.habits)best=Math.max(best,habitStreak(habit,today));const p30=total30?Math.round(done30/total30*100):0,p7=total7?Math.round(done7/total7*100):0;app.innerHTML=top()+`<div class="date-row"><div><div class="kicker">Your progress</div><h1>Stats</h1></div></div><div class="stats-grid"><div class="stat"><div class="stat-num">${p7}%</div><div class="stat-label">Last 7 days</div></div><div class="stat"><div class="stat-num">${p30}%</div><div class="stat-label">Last 30 days</div></div><div class="stat"><div class="stat-num">${best}</div><div class="stat-label">Best habit streak · weeks</div></div><div class="stat"><div class="stat-num">${(totalMinutes/60).toFixed(1)}</div><div class="stat-label">Completed hours · 30d</div></div><div class="stat wide"><div class="progress-title">Recent consistency</div>${[7,14,30].map(n=>{const vals=byDay.slice(-n),p=vals.length?Math.round(vals.reduce((a,b)=>a+b,0)/vals.length):0;return `<div class="bar-row"><div class="bar-label"><span>${n} day average</span><b>${p}%</b></div><div class="bar-track"><div class="bar-fill" style="width:${p}%"></div></div></div>`}).join('')}</div><div class="stat wide"><div class="progress-title">Data stays on this device</div><div class="progress-sub">Use Backup from the top-right menu to protect schedule and history.</div></div></div>`;bindBase()}
function bindTasks(){document.querySelectorAll('[data-toggle]').forEach(b=>b.onclick=e=>{e.stopPropagation();const row=b.closest('.structured-row,.task');if(row){row.classList.add('completing');setTimeout(()=>toggle(b.dataset.toggle),150)}else toggle(b.dataset.toggle)});document.querySelectorAll('[data-edit]').forEach(x=>x.onclick=()=>openEditor(x.dataset.edit));document.querySelectorAll('.structured-row[data-edit]').forEach(row=>{let timer=null,moved=false;row.addEventListener('touchstart',()=>{moved=false;timer=setTimeout(()=>{navigator.vibrate?.(12);openEditor(row.dataset.edit)},520)},{passive:true});row.addEventListener('touchmove',()=>{moved=true;clearTimeout(timer)},{passive:true});row.addEventListener('touchend',()=>clearTimeout(timer),{passive:true});row.addEventListener('touchcancel',()=>clearTimeout(timer),{passive:true})})}
function bindBase(){document.getElementById('backupBtn').onclick=openBackup}
function render(){nav();document.getElementById('fab').style.display=state.tab==='stats'?'none':'block';document.getElementById('fab').setAttribute('aria-label',state.tab==='habits'?'Add habit':'Add task');if(state.tab==='today')renderToday();else if(state.tab==='calendar')renderCalendar();else if(state.tab==='habits')renderHabits();else renderStats()}
function iconFor(task){return taskIcon(task)}

// Task editor
function openEditor(id=null,preset=null){
state.editing=id?state.tasks.find(t=>t.id===id):null;
const t=state.editing||{label:'',start:540,end:600,days:[state.date.getDay()],color:COLORS[0],icon:'clock-3',...(preset||{})};
const initialIcon=normalizeIconKey(t.icon||inferIcon(t.label));
const wrap=document.createElement('div');wrap.className='sheet-wrap';
wrap.innerHTML=`<div class="sheet"><div class="grab"></div><h3>${id?'Edit block':'New block'}</h3>
<div class="icon-preview" style="--preview-color:${t.color}"><div class="icon-preview-box" id="iconPreview">${iconHtml(initialIcon)}</div><div class="icon-preview-copy"><b id="previewName">${esc(t.label||'New block')}</b><small id="previewIconName">${ICON_NAMES[initialIcon]}</small></div></div>
<div class="field"><label>Name</label><input id="fLabel" value="${esc(t.label)}" placeholder="What are you doing?"></div>
<div class="field"><label>Note for ${state.date.toLocaleDateString(undefined,{month:'short',day:'numeric'})}</label><textarea id="fNote" rows="3" maxlength="240" placeholder="Optional focus, objective, or reminder for this occurrence">${esc(id?taskNote(t,state.date):'')}</textarea></div>
<div class="field"><label>Icon</label><div class="icon-grid">${ICON_KEYS.map(k=>`<button type="button" class="icon-choice ${initialIcon===k?'on':''}" data-icon="${k}" aria-label="${ICON_NAMES[k]}">${iconHtml(k)}<span>${ICON_NAMES[k]}</span></button>`).join('')}</div></div>
<div class="row"><div class="field"><label>Start</label><input id="fStart" type="time" value="${timeInput(t.start)}"></div><div class="field"><label>End</label><input id="fEnd" type="time" value="${timeInput(t.end)}"></div></div>
<div class="field"><label>Repeats</label><div class="preset-row"><button type="button" class="preset-btn" data-repeat="weekdays">Weekdays</button><button type="button" class="preset-btn" data-repeat="weekends">Weekends</button><button type="button" class="preset-btn" data-repeat="daily">Every day</button><button type="button" class="preset-btn" data-repeat="once">This day</button></div><div class="days">${DAYS.map((d,i)=>`<button type="button" class="daypick ${t.days.includes(i)?'on':''}" data-daypick="${i}">${d}</button>`).join('')}</div></div>
<div class="field"><label>Contributes to habit</label><select id="fHabit"><option value="">None · schedule only</option>${state.habits.map(h=>`<option value="${h.id}" ${t.habitId===h.id?'selected':''}>${esc(h.label)}</option>`).join('')}</select></div>
<div class="field"><label>Color</label><div class="colors">${COLORS.map(c=>`<button type="button" class="swatch ${t.color===c?'on':''}" style="background:${c}" data-color="${c}" aria-label="Choose color"></button>`).join('')}</div></div>
<div class="sheet-actions">${id?'<button class="danger" id="deleteTask">Delete</button>':''}<button class="secondary" id="cancelEdit">Cancel</button><button class="primary" id="saveTask">Save</button></div></div>`;
document.body.appendChild(wrap);
let selectedDays=new Set(t.days),selectedColor=t.color,selectedIcon=initialIcon;
const updatePreview=()=>{wrap.querySelector('#iconPreview').innerHTML=iconHtml(selectedIcon);wrap.querySelector('#previewIconName').textContent=ICON_NAMES[selectedIcon];wrap.querySelector('.icon-preview').style.setProperty('--preview-color',selectedColor);wrap.querySelector('#previewName').textContent=wrap.querySelector('#fLabel').value.trim()||'New block'};
const syncDays=()=>wrap.querySelectorAll('[data-daypick]').forEach(b=>b.classList.toggle('on',selectedDays.has(+b.dataset.daypick)));
wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
wrap.querySelector('#fLabel').addEventListener('input',updatePreview);
wrap.querySelectorAll('[data-icon]').forEach(b=>b.onclick=()=>{selectedIcon=b.dataset.icon;wrap.querySelectorAll('[data-icon]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
wrap.querySelectorAll('[data-daypick]').forEach(b=>b.onclick=()=>{const n=+b.dataset.daypick;selectedDays.has(n)?selectedDays.delete(n):selectedDays.add(n);syncDays()});
wrap.querySelectorAll('[data-repeat]').forEach(b=>b.onclick=()=>{const mode=b.dataset.repeat;selectedDays=new Set(mode==='weekdays'?[1,2,3,4,5]:mode==='weekends'?[0,6]:mode==='daily'?[0,1,2,3,4,5,6]:[state.date.getDay()]);syncDays();wrap.querySelectorAll('[data-repeat]').forEach(x=>x.classList.toggle('on',x===b))});
wrap.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{selectedColor=b.dataset.color;wrap.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
wrap.querySelector('#cancelEdit').onclick=()=>wrap.remove();
const del=wrap.querySelector('#deleteTask');if(del)del.onclick=()=>{state.tasks=state.tasks.filter(x=>x.id!==id);saveTasks();wrap.remove();render()};
wrap.querySelector('#saveTask').onclick=()=>{const label=wrap.querySelector('#fLabel').value.trim(),start=fromTime(wrap.querySelector('#fStart').value),end=fromTime(wrap.querySelector('#fEnd').value),habitId=wrap.querySelector('#fHabit').value||null;if(!label)return toast('Add a name');if(!selectedDays.size)return toast('Choose at least one day');if(end<=start)return toast('End time must be later');let savedId=id;if(id){Object.assign(state.editing,{label,start,end,days:[...selectedDays],color:selectedColor,icon:selectedIcon,habitId})}else{savedId='t'+Date.now();state.tasks.push({id:savedId,label,start,end,days:[...selectedDays],color:selectedColor,icon:selectedIcon,habitId})}saveTasks();saveTaskNote(savedId,wrap.querySelector('#fNote').value,state.date);wrap.remove();render()}
}

// Habit editor
function openHabitEditor(id=null){
  const existing=id?habitById(id):null;
  const habit=existing||{label:'',target:5,color:COLORS[0],icon:'check-circle'};
  const initialIcon=normalizeIconKey(habit.icon||'check-circle');
  const wrap=document.createElement('div');wrap.className='sheet-wrap';
  wrap.innerHTML=`<div class="sheet"><div class="grab"></div><h3>${id?'Edit habit':'New habit'}</h3>
  <div class="icon-preview" style="--preview-color:${habit.color}"><div class="icon-preview-box" id="iconPreview">${iconHtml(initialIcon)}</div><div class="icon-preview-copy"><b id="previewName">${esc(habit.label||'New habit')}</b><small id="previewIconName">${ICON_NAMES[initialIcon]}</small></div></div>
  <div class="field"><label>Name</label><input id="hLabel" value="${esc(habit.label)}" placeholder="e.g. Fitness & Sports"></div>
  <div class="field"><label>Weekly target</label><input id="hTarget" type="number" min="1" max="50" value="${Math.max(1,Number(habit.target)||1)}"></div>
  <div class="field"><label>Icon</label><div class="icon-grid">${ICON_KEYS.map(k=>`<button type="button" class="icon-choice ${initialIcon===k?'on':''}" data-icon="${k}" aria-label="${ICON_NAMES[k]}">${iconHtml(k)}<span>${ICON_NAMES[k]}</span></button>`).join('')}</div></div>
  <div class="field"><label>Color</label><div class="colors">${COLORS.map(c=>`<button type="button" class="swatch ${habit.color===c?'on':''}" style="background:${c}" data-color="${c}" aria-label="Choose color"></button>`).join('')}</div></div>
  <div class="sheet-actions">${id?'<button class="danger" id="deleteHabit">Delete</button>':''}<button class="secondary" id="cancelHabit">Cancel</button><button class="primary" id="saveHabit">Save</button></div></div>`;
  document.body.appendChild(wrap);
  let selectedColor=habit.color,selectedIcon=initialIcon;
  const updatePreview=()=>{wrap.querySelector('#iconPreview').innerHTML=iconHtml(selectedIcon);wrap.querySelector('#previewIconName').textContent=ICON_NAMES[selectedIcon];wrap.querySelector('.icon-preview').style.setProperty('--preview-color',selectedColor);wrap.querySelector('#previewName').textContent=wrap.querySelector('#hLabel').value.trim()||'New habit'};
  wrap.onclick=e=>{if(e.target===wrap)wrap.remove()};
  wrap.querySelector('#hLabel').addEventListener('input',updatePreview);
  wrap.querySelectorAll('[data-icon]').forEach(b=>b.onclick=()=>{selectedIcon=b.dataset.icon;wrap.querySelectorAll('[data-icon]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
  wrap.querySelectorAll('[data-color]').forEach(b=>b.onclick=()=>{selectedColor=b.dataset.color;wrap.querySelectorAll('[data-color]').forEach(x=>x.classList.toggle('on',x===b));updatePreview()});
  wrap.querySelector('#cancelHabit').onclick=()=>wrap.remove();
  const del=wrap.querySelector('#deleteHabit');if(del)del.onclick=()=>{const linked=state.tasks.filter(t=>t.habitId===id).length;if(!confirm(`Delete this habit? ${linked} linked block${linked===1?'':'s'} will remain in the schedule without a habit.`))return;state.tasks.forEach(t=>{if(t.habitId===id)t.habitId=null});state.habits=state.habits.filter(h=>h.id!==id);saveHabits();saveTasks();wrap.remove();render()};
  wrap.querySelector('#saveHabit').onclick=()=>{const label=wrap.querySelector('#hLabel').value.trim(),target=Math.max(1,Math.min(50,Number(wrap.querySelector('#hTarget').value)||1));if(!label)return toast('Add a habit name');if(existing)Object.assign(existing,{label,target,color:selectedColor,icon:selectedIcon});else state.habits.push({id:'h'+Date.now(),label,target,color:selectedColor,icon:selectedIcon});saveHabits();wrap.remove();render()};
}

// Backup and transfer
const DEVICE_LABEL_KEY=STORAGE_PREFIX+'device-label';
const UNDO_RESTORE_KEY=STORAGE_PREFIX+'undo-restore';

function collectDays(){
  const days={};
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&key.startsWith(STORAGE_PREFIX+'plan-day:')){
      days[key.slice((STORAGE_PREFIX+'plan-day:').length)]=loadJSON(key,{});
    }
  }
  return days;
}

function collectBackup(kind='full'){
  const base={
    version:4,
    type:kind,
    exportedAt:new Date().toISOString(),
    deviceLabel:localStorage.getItem(DEVICE_LABEL_KEY)||'',
    habits:state.habits,
    tasks:state.tasks
  };
  if(kind==='full')base.days=collectDays();
  return base;
}

function backupFileName(kind){
  const stamp=new Date().toISOString().replace(/[:.]/g,'-').slice(0,19);
  return `planner-${kind}-${stamp}.json`;
}

function downloadBackup(kind){
  const json=JSON.stringify(collectBackup(kind),null,2);
  const blob=new Blob([json],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const link=document.createElement('a');
  link.href=url;
  link.download=backupFileName(kind);
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),500);
  toast(kind==='full'?'Full backup downloaded':'Schedule backup downloaded');
}

function validateBackup(obj){
  if(!obj||!Array.isArray(obj.tasks)||!Array.isArray(obj.habits))throw new Error('Backup must contain habits and tasks arrays.');
  validateHabits(obj.habits);
  if(obj.days!==undefined&&(typeof obj.days!=='object'||Array.isArray(obj.days)||obj.days===null))throw new Error('Backup daily data is invalid.');
  return obj;
}

function backupSummary(obj){
  const dayCount=obj.days?Object.keys(obj.days).length:0;
  const created=obj.exportedAt?new Date(obj.exportedAt).toLocaleString():'Unknown';
  return {
    created,
    source:obj.deviceLabel||'Unlabeled device',
    habits:obj.habits.length,
    tasks:obj.tasks.length,
    days:dayCount,
    hasDays:!!obj.days
  };
}

function clearDayRecords(){
  const keys=[];
  for(let i=0;i<localStorage.length;i++){
    const key=localStorage.key(i);
    if(key&&key.startsWith(STORAGE_PREFIX+'plan-day:'))keys.push(key);
  }
  keys.forEach(key=>localStorage.removeItem(key));
}

function saveUndoSnapshot(){
  try{localStorage.setItem(UNDO_RESTORE_KEY,JSON.stringify(collectBackup('full')))}catch{}
}

function applyBackup(obj,mode){
  validateBackup(obj);
  saveUndoSnapshot();
  if(mode==='everything'||mode==='schedule'){
    state.habits=validateHabits(obj.habits);
    state.tasks=obj.tasks.map(cloneTask);
    saveHabits();saveTasks();
  }
  if(mode==='everything'||mode==='daily'){
    if(!obj.days)throw new Error('This backup does not contain daily history.');
    clearDayRecords();
    Object.entries(obj.days).forEach(([key,value])=>saveJSON(STORAGE_PREFIX+'plan-day:'+key,value));
    state.dayCache={};
  }
}

function undoLastRestore(){
  const raw=localStorage.getItem(UNDO_RESTORE_KEY);
  if(!raw)return toast('No restore is available to undo');
  try{
    const obj=validateBackup(JSON.parse(raw));
    state.habits=validateHabits(obj.habits);
    state.tasks=obj.tasks.map(cloneTask);
    saveHabits();saveTasks();
    clearDayRecords();
    Object.entries(obj.days||{}).forEach(([key,value])=>saveJSON(STORAGE_PREFIX+'plan-day:'+key,value));
    state.dayCache={};
    localStorage.removeItem(UNDO_RESTORE_KEY);
    render();
    toast('Last restore undone');
  }catch{toast('The undo backup could not be restored')}
}

async function copyBackupText(text,textarea){
  try{await navigator.clipboard.writeText(text);toast('Full backup copied')}
  catch{textarea.focus();textarea.select();document.execCommand('copy');toast('Full backup copied')}
}

function openBackup(){
  const fullJson=JSON.stringify(collectBackup('full'),null,2);
  const wrap=document.createElement('div');
  wrap.className='sheet-wrap';
  wrap.innerHTML=`<div class="sheet backup-sheet"><div class="grab"></div><h3>Backup & transfer</h3>
  <div class="backup-section"><div class="backup-section-head"><b>This device</b><span>Name backups so the source is obvious</span></div><div class="field"><label>Device name</label><input id="deviceLabel" maxlength="40" placeholder="e.g. Personal iPhone" value="${esc(localStorage.getItem(DEVICE_LABEL_KEY)||'')}"></div></div>
  <div class="backup-section"><div class="backup-section-head"><b>Export</b><span>Use full backup when moving between devices</span></div><div class="backup-grid"><button class="primary" id="downloadFull">Download full backup</button><button class="secondary" id="downloadSchedule">Download schedule only</button><button class="secondary" id="copyBackup">Copy full JSON</button></div><details class="backup-advanced"><summary>Show JSON</summary><textarea class="backup" id="backupText" readonly>${esc(fullJson)}</textarea></details></div>
  <div class="backup-section"><div class="backup-section-head"><b>Import</b><span>Choose a file or paste JSON</span></div><label class="file-picker"><input id="backupFile" type="file" accept="application/json,.json"><span>Choose backup file</span></label><textarea class="backup" id="restoreText" placeholder="Or paste backup JSON here"></textarea><div class="import-preview empty-preview" id="importPreview">Select or paste a backup to preview it.</div><div class="restore-modes"><label><input type="radio" name="restoreMode" value="everything" checked> Everything</label><label><input type="radio" name="restoreMode" value="schedule"> Schedule only</label><label><input type="radio" name="restoreMode" value="daily"> Daily data only</label></div><button class="primary full-width" id="restoreBackup" disabled>Restore selected data</button></div>
  <div class="backup-section compact-actions"><button class="secondary" id="undoRestore" ${localStorage.getItem(UNDO_RESTORE_KEY)?'':'disabled'}>Undo last restore</button><button class="reset-defaults" id="resetDefaults" type="button">Restore current default schedule</button></div>
  <div class="sheet-actions"><button class="secondary" id="closeBackup">Close</button></div></div>`;
  document.body.appendChild(wrap);
  let parsedBackup=null;
  const restoreText=wrap.querySelector('#restoreText');
  const preview=wrap.querySelector('#importPreview');
  const restoreButton=wrap.querySelector('#restoreBackup');
  const updatePreview=raw=>{
    try{
      const obj=validateBackup(JSON.parse(raw));
      const info=backupSummary(obj);
      parsedBackup=obj;
      preview.className='import-preview';
      preview.innerHTML=`<b>${esc(info.source)}</b><span>Created ${esc(info.created)}</span><span>${info.habits} habits · ${info.tasks} tasks · ${info.days} daily records</span>${info.hasDays?'':'<em>Schedule-only backup</em>'}`;
      restoreButton.disabled=false;
    }catch{
      parsedBackup=null;
      preview.className='import-preview empty-preview';
      preview.textContent=raw.trim()?'This does not appear to be a valid Planner backup.':'Select or paste a backup to preview it.';
      restoreButton.disabled=true;
    }
  };
  wrap.onclick=event=>{if(event.target===wrap)wrap.remove()};
  wrap.querySelector('#closeBackup').onclick=()=>wrap.remove();
  wrap.querySelector('#deviceLabel').onchange=event=>localStorage.setItem(DEVICE_LABEL_KEY,event.target.value.trim());
  wrap.querySelector('#downloadFull').onclick=()=>downloadBackup('full');
  wrap.querySelector('#downloadSchedule').onclick=()=>downloadBackup('schedule');
  wrap.querySelector('#copyBackup').onclick=()=>copyBackupText(fullJson,wrap.querySelector('#backupText'));
  wrap.querySelector('#backupFile').onchange=async event=>{
    const file=event.target.files?.[0];
    if(!file)return;
    try{const raw=await file.text();restoreText.value=raw;updatePreview(raw)}catch{toast('Could not read that file')}
  };
  restoreText.oninput=()=>updatePreview(restoreText.value);
  restoreButton.onclick=()=>{
    if(!parsedBackup)return;
    const mode=wrap.querySelector('input[name="restoreMode"]:checked').value;
    const labels={everything:'everything on this device',schedule:'the recurring schedule',daily:'daily history, focus, and notes'};
    if(!confirm(`Restore ${labels[mode]} from this backup? A local undo snapshot will be saved first.`))return;
    try{applyBackup(parsedBackup,mode);wrap.remove();render();toast('Backup restored')}
    catch(error){toast(error.message||'That backup could not be restored')}
  };
  wrap.querySelector('#undoRestore').onclick=()=>{wrap.remove();undoLastRestore()};
  wrap.querySelector('#resetDefaults').onclick=()=>{
    if(!confirm('Replace your recurring schedule with the current defaults? Completion history will be kept.'))return;
    saveUndoSnapshot();
    state.habits=freshDefaultHabits();state.tasks=freshDefaultTasks();
    saveHabits();saveTasks();
    wrap.remove();
    render();
    toast('Default schedule restored');
  };
}

// Interaction helpers and initialization
function toast(msg){document.querySelector('.toast')?.remove();const x=document.createElement('div');x.className='toast';x.textContent=msg;document.body.appendChild(x);setTimeout(()=>x.remove(),1800)}
function bindSwipe(el,fn){let x=null,y=null;el.ontouchstart=e=>{if(e.touches.length===1&&!e.target.closest('button,input,textarea,.sheet')){x=e.touches[0].clientX;y=e.touches[0].clientY}};el.ontouchend=e=>{if(x===null)return;const dx=e.changedTouches[0].clientX-x,dy=e.changedTouches[0].clientY-y;x=y=null;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)fn(dx)}}
document.getElementById('fab').onclick=()=>state.tab==='habits'?openHabitEditor():openEditor();if(!localStorage.getItem(STORAGE_PREFIX+'habits'))saveHabits();if(!localStorage.getItem(STORAGE_PREFIX+'tasks'))saveTasks();render();setInterval(()=>{if(state.tab==='today'&&isToday(state.date))render()},60000);
})();
