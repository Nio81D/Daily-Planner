'use strict';

// Palette, central habits, and recurring default schedule.
const PALETTE=Object.freeze({
  blue:'#3b82f6',
  green:'#4bd39b',
  purple:'#9d8cff',
  coral:'#f06b68',
  gold:'#f59e0b'
});
const COLORS=Object.freeze(Object.values(PALETTE));
const DAYS=['S','M','T','W','T','F','S'];
const WEEKDAYS=Object.freeze([1,2,3,4,5]);

// Habits are intentional outcomes. Schedule blocks may contribute to one habit or none.
const DEFAULT_HABITS=Object.freeze([
  {id:'h-fitness',label:'Fitness & Sports',target:5,color:PALETTE.green,icon:'barbell'},
  {id:'h-learning',label:'Learning & Growth',target:5,color:PALETTE.purple,icon:'book-open'},
  {id:'h-markets',label:'Markets & Investing',target:6,color:PALETTE.gold,icon:'trend-up'},
  {id:'h-mindfulness',label:'Mindfulness',target:5,color:PALETTE.blue,icon:'moon-stars'}
]);

// A null habitId means the block is part of the schedule but is not habit-forming.
const DEFAULT_TASKS=Object.freeze([
{id:'t1',label:'Run (Optional)',start:330,end:370,days:WEEKDAYS,color:PALETTE.green,icon:'person-simple-run',habitId:'h-fitness'},
{id:'t2',label:'Shower & Breakfast',start:370,end:400,days:WEEKDAYS,color:PALETTE.blue,icon:'shower',habitId:null},
{id:'t3',label:'Market Prep',start:400,end:495,days:WEEKDAYS,color:PALETTE.gold,icon:'trend-up',habitId:'h-markets'},
{id:'t5',label:'Work',start:510,end:960,days:WEEKDAYS,color:PALETTE.coral,icon:'briefcase',habitId:null},
{id:'t6',label:'Gym',start:1020,end:1080,days:WEEKDAYS,color:PALETTE.green,icon:'barbell',habitId:'h-fitness'},
{id:'t8',label:'Dinner',start:1080,end:1125,days:WEEKDAYS,color:PALETTE.blue,icon:'fork-knife',habitId:null},
{id:'t13',label:'Study',start:1125,end:1230,days:WEEKDAYS,color:PALETTE.gold,icon:'book-open',habitId:'h-learning'},
{id:'t14',label:'Trade Journal',start:1230,end:1245,days:WEEKDAYS,color:PALETTE.gold,icon:'notebook',habitId:'h-markets'},
{id:'t15',label:'Wind Down: Read & Meditate',start:1245,end:1290,days:WEEKDAYS,color:PALETTE.purple,icon:'moon-stars',habitId:'h-mindfulness'},
{id:'t16',label:'Golf',start:540,end:720,days:[6],color:PALETTE.green,icon:'flag',habitId:'h-fitness'},
{id:'t17',label:'Trading & Portfolio Deep Work',start:780,end:960,days:[6],color:PALETTE.gold,icon:'trend-up',habitId:'h-markets'},
{id:'t18',label:'Gym & Read',start:540,end:720,days:[0],color:PALETTE.green,icon:'barbell',habitId:'h-fitness'},
{id:'t19',label:'Weekly Review',start:840,end:960,days:[0],color:PALETTE.gold,icon:'check-circle',habitId:'h-learning'}
]);

window.PlannerDefaults=Object.freeze({PALETTE,COLORS,DAYS,WEEKDAYS,DEFAULT_HABITS,DEFAULT_TASKS});
