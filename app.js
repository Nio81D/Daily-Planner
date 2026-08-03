(()=>{
'use strict';

function cloneHabit(habit){return {...habit,target:Math.max(1,Number(habit.target)||1)}}
function cloneTask(task){return {...task,days:Array.isArray(task.days)?[...task.days]:[],habitId:task.habitId||null}}
function taskBelongsToHabit(task,habitId){return !!habitId&&task.habitId===habitId}
function completed(task,day){return !!day?.[task.id]?.done}
function startOfWeek(date){const d=new Date(date);d.setHours(0,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d}
function addDays(date,n){const d=new Date(date);d.setDate(d.getDate()+n);return d}

function habitWeekSummary(habit,tasks,getDay,anchor=new Date()){
  const start=startOfWeek(anchor);
  const linked=tasks.filter(task=>taskBelongsToHabit(task,habit.id));
  let completedCount=0;
  const dots=[];
  for(let i=0;i<7;i++){
    const date=addDays(start,i);
    const scheduled=linked.filter(task=>task.days.includes(date.getDay()));
    const done=scheduled.filter(task=>completed(task,getDay(date))).length;
    completedCount+=done;
    dots.push({scheduled:scheduled.length,completed:done});
  }
  const target=Math.max(1,Number(habit.target)||1);
  return {completed:completedCount,target,percent:Math.min(100,Math.round(completedCount/target*100)),dots,linkedTasks:linked};
}

function habitWeekStreak(habit,tasks,getDay,anchor=new Date(),limit=104){
  let streak=0;
  const currentStart=startOfWeek(anchor);
  for(let offset=0;offset<limit;offset++){
    const weekStart=addDays(currentStart,-7*offset);
    const summary=habitWeekSummary(habit,tasks,getDay,weekStart);
    const isCurrent=offset===0;
    if(summary.completed>=summary.target)streak++;
    else if(isCurrent)continue;
    else break;
  }
  return streak;
}

function validateHabits(habits){
  if(!Array.isArray(habits))throw new Error('Habits must be an array.');
  const ids=new Set();
  return habits.map(raw=>{
    if(!raw||typeof raw!=='object')throw new Error('A habit record is invalid.');
    const habit=cloneHabit(raw);
    if(!habit.id||ids.has(habit.id))throw new Error('Habit IDs must be unique.');
    if(!String(habit.label||'').trim())throw new Error('Every habit needs a name.');
    ids.add(habit.id);
    return habit;
  });
}

window.PlannerHabitModel=Object.freeze({cloneHabit,cloneTask,taskBelongsToHabit,habitWeekSummary,habitWeekStreak,validateHabits});
})();
