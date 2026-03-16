import { useState, useEffect, useRef } from "react";

// ── Inject Font ──
(() => {
  if (document.getElementById("lu-font")) return;
  const l = document.createElement("link");
  l.id = "lu-font"; l.rel = "stylesheet";
  l.href = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap";
  const s = document.createElement("style");
  s.textContent = `*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}body{background:#F2F2F7;font-family:'Plus Jakarta Sans',sans-serif;}input,button,textarea,select{font-family:'Plus Jakarta Sans',sans-serif;}
@keyframes slideDown{from{opacity:0;transform:translateX(-50%) translateY(-14px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:scale(0.96)}to{opacity:1;transform:scale(1)}}
@keyframes popIn{from{opacity:0;transform:scale(0.85) translateY(20px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
@keyframes confettiFall{0%{transform:translateY(-20px) rotate(0deg);opacity:1}100%{transform:translateY(80px) rotate(360deg);opacity:0}}`;
  document.head.append(l, s);
})();

// ── Design Tokens ──
const C = {
  bg:"#F2F2F7",card:"#FFFFFF",primary:"#5856D6",pl:"#EEEEFF",
  gold:"#FF9500",text:"#1C1C1E",sub:"#8E8E93",
  border:"#E5E5EA",ok:"#34C759",err:"#FF3B30",teal:"#32ADE6",
};
const sh = "0 2px 16px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)";
const shHero = "0 12px 40px rgba(88,86,214,0.32)";
const XPL = 200;
const SKEY = "lu_v6_users", SESS = "lu_v6_sess";

// ── Constants ──
const RANKS = [
  {at:1,name:"Rookie",c:"#8E8E93"},{at:3,name:"Scholar",c:"#32ADE6"},
  {at:6,name:"Achiever",c:"#34C759"},{at:10,name:"Champion",c:"#FF9500"},
  {at:15,name:"Elite",c:"#FF3B30"},{at:20,name:"Legend",c:"#5856D6"},
  {at:30,name:"Mythic",c:"#AF52DE"},
];

const MILESTONES = [
  {day:3,emoji:"🌱",title:"3 Days Strong!",color:"#34C759",bg:"linear-gradient(145deg,#E8F9EC,#F0FFF4)",msg:"You've made it 3 days in a row — that's your spark! Every great journey begins with small, consistent steps. Keep showing up and the momentum will build itself."},
  {day:7,emoji:"🔥",title:"One Full Week!",color:"#FF9500",bg:"linear-gradient(145deg,#FFF4E0,#FFFBF0)",msg:"A full week of consistency! Most people give up before day 7. You didn't. Your brain is already adapting — this is where real change begins."},
  {day:10,emoji:"⚡",title:"Day 10 — You're Serious.",color:"#5856D6",bg:"linear-gradient(145deg,#EEEEFF,#F5F5FF)",msg:"Look at your effort over the past 10 days. Your consistency is already improving your discipline, energy, and commitment. You are not the same person you were on Day 1 — keep going."},
  {day:21,emoji:"🏆",title:"21 Days — Habit Formed!",color:"#FF9500",bg:"linear-gradient(145deg,#FFF8E7,#FFFBF0)",msg:"You've reached 21 days! Research shows that repeating something consistently for 21 days helps turn it into a habit. Your routine, motivation, and discipline are becoming a permanent part of who you are. This is no longer effort — it's your identity."},
  {day:30,emoji:"👑",title:"30 Days — Legendary!",color:"#AF52DE",bg:"linear-gradient(145deg,#F5EEFF,#FDF7FF)",msg:"30 consecutive days. You've done what most people only dream about. You are disciplined, focused, and unstoppable. Whatever you set your mind to — you will achieve it."},
  {day:50,emoji:"🌟",title:"50 Days — Mythic Status!",color:"#5856D6",bg:"linear-gradient(145deg,#EEEEFF,#F0EEFF)",msg:"50 days. You have transcended ordinary willpower and entered the realm of true mastery. Your future self thanks you for every single day you chose discipline over comfort."},
  {day:100,emoji:"💎",title:"100 Days — Absolute Legend",color:"#FF9500",bg:"linear-gradient(145deg,#FFF4E0,#FFFDF0)",msg:"You are on your own now. You don't need motivational messages anymore. You have become strong without the need of others."},
];

const BADGES = [
  {id:"first_habit",icon:"🎯",name:"First Step",desc:"Add your first habit",check:u=>(u.habits||[]).length>=1},
  {id:"streak_3",icon:"🌱",name:"Sprouting",desc:"3-day routine streak",check:u=>(u.routineStreak||0)>=3},
  {id:"streak_7",icon:"🔥",name:"On Fire",desc:"7-day routine streak",check:u=>(u.routineStreak||0)>=7},
  {id:"streak_21",icon:"🏆",name:"Habit Master",desc:"21-day streak",check:u=>(u.routineStreak||0)>=21},
  {id:"xp_100",icon:"⚡",name:"Charged",desc:"Earn 100 XP",check:u=>(u.xp||0)>=100},
  {id:"xp_500",icon:"💎",name:"Diamond Mind",desc:"Earn 500 XP",check:u=>(u.xp||0)>=500},
  {id:"first_book",icon:"📚",name:"Bookworm",desc:"Complete a book/manhwa",check:u=>(u.library||[]).some(i=>i.status==="Completed")},
  {id:"coder",icon:"💻",name:"Coder",desc:"Complete a coding level",check:u=>Object.values(u.codingProgress||{}).some(p=>p.completed)},
  {id:"scholar",icon:"📖",name:"Scholar",desc:"Log 5 study sessions",check:u=>(u.study||[]).reduce((s,sub)=>s+(sub.sessions||[]).length,0)>=5},
  {id:"word_10",icon:"🔤",name:"Word Wizard",desc:"Learn 10 words",check:u=>(u.vocabulary||[]).length>=10},
  {id:"sleep_7",icon:"🌙",name:"Well Rested",desc:"Log 7 sleep entries",check:u=>(u.sleepLog||[]).length>=7},
  {id:"hydrated",icon:"💧",name:"Hydrated",desc:"Log water 5 days",check:u=>(u.waterLog||[]).length>=5},
  {id:"athlete",icon:"🏋️",name:"Athlete",desc:"Log 5 workouts",check:u=>(u.workouts||[]).length>=5},
  {id:"goal_crusher",icon:"🎯",name:"Goal Crusher",desc:"Complete a goal step",check:u=>(u.goals||[]).some(g=>(g.steps||[]).some(s=>s.done))},
  {id:"lucky_spin",icon:"🎰",name:"Lucky Spin",desc:"Spin the wheel once",check:u=>(u.spinHistory||[]).length>=1},
  {id:"zen",icon:"🧘",name:"Zen Master",desc:"Complete 3 meditations",check:u=>(u.meditationLog||[]).length>=3},
  {id:"saver",icon:"💰",name:"Smart Saver",desc:"Log 10 transactions",check:u=>(u.transactions||[]).length>=10},
  {id:"math_10",icon:"🔢",name:"Math Whiz",desc:"Solve 10 math problems",check:u=>(u.mathScore||0)>=10},
  {id:"noted",icon:"📝",name:"Noted",desc:"Write 5 notes",check:u=>(u.notes||[]).length>=5},
  {id:"meal_planner",icon:"🍽️",name:"Meal Planner",desc:"Plan 5 meals",check:u=>Object.values(u.meals||{}).reduce((s,d)=>s+Object.values(d).filter(Boolean).length,0)>=5},
];

const SPIN_PRIZES = [
  {label:"+10 XP",xp:10,color:"#5856D6"},{label:"+25 XP",xp:25,color:"#FF9500"},
  {label:"+50 XP",xp:50,color:"#34C759"},{label:"+5 XP",xp:5,color:"#32ADE6"},
  {label:"+30 XP",xp:30,color:"#FF3B30"},{label:"+15 XP",xp:15,color:"#AF52DE"},
  {label:"+20 XP",xp:20,color:"#FF9500"},{label:"🎉 +100",xp:100,color:"#FFD700"},
];

const HABIT_ICONS = ["💪","🏃","🧘","📚","💻","✍️","🧹","💧","🥗","🎯","🌙","🎸","🏋️","📖","🎮","🌅","🧴","📐"];
const HABIT_CATS = ["Fitness","Study","Mindset","Hygiene","Coding","Reading","Other"];
const LIB_TYPES = ["Book","Manhwa","Podcast"];
const TICON = {Book:"📗",Manhwa:"📕",Podcast:"🎧"};
const SUB_EMOJIS = ["📖","🔢","⚗️","💻","🌍","📐","🧪","📝","🏛️","🎨","🧬","📊"];
const WORKOUT_TYPES = ["🏋️ Weights","🏃 Running","🧘 Yoga","🚴 Cycling","🏊 Swimming","⚽ Football","🤸 Calisthenics","🥊 Boxing","Other"];
const EXPENSE_CATS = ["🍔 Food","🚗 Transport","📚 Education","👕 Clothes","🎮 Entertainment","💊 Health","🏠 Rent","💡 Utilities","Other"];
const MEAL_TIMES = ["Breakfast","Lunch","Dinner","Snack"];

const ALL_WORDS = [
  [{w:"Tenacious",e:"Holding firmly to a purpose; persistent",a:"مثابر / متمسك بهدفه بإصرار",ex:"His tenacious effort earned him top marks."},
   {w:"Eloquent",e:"Fluent and persuasive in speech",a:"بليغ / فصيح في الكلام",ex:"She gave an eloquent presentation."},
   {w:"Resilient",e:"Quickly recovering from difficulties",a:"مرن / قادر على التعافي السريع",ex:"Stay resilient when challenges arise."},
   {w:"Diligent",e:"Showing steady, careful effort",a:"مجتهد / يبذل جهداً مستمراً",ex:"Diligent effort leads to success."},
   {w:"Astute",e:"Sharp, clever, and perceptive",a:"ذكي / حاد الملاحظة",ex:"His astute analysis solved the problem."}],
  [{w:"Pragmatic",e:"Dealing with things practically",a:"عملي / براغماتي",ex:"A pragmatic engineer focuses on what works."},
   {w:"Meticulous",e:"Very careful and precise about details",a:"دقيق / يهتم بأدق التفاصيل",ex:"She reviewed every line meticulously."},
   {w:"Proficient",e:"Skilled and competent at something",a:"ماهر / متمكن من مهارة ما",ex:"He became proficient in Python."},
   {w:"Iterate",e:"To repeat a process to improve it",a:"يكرر / يحسّن بالتكرار",ex:"Engineers iterate on designs until perfect."},
   {w:"Articulate",e:"Expressing ideas clearly and effectively",a:"واضح التعبير / فصيح",ex:"An articulate developer communicates well."}],
  [{w:"Formidable",e:"Inspiring respect by being impressively capable",a:"هائل / يثير الإعجاب والاحترام",ex:"Cybersecurity is a formidable field."},
   {w:"Persevere",e:"To continue steadily despite difficulty",a:"يصبر / يثابر رغم الصعاب",ex:"You must persevere through hard problems."},
   {w:"Exemplary",e:"Serving as a model of excellence",a:"نموذجي / يُحتذى به",ex:"His work ethic is exemplary."},
   {w:"Optimize",e:"To make as effective as possible",a:"يُحسّن / يرفع الكفاءة للحد الأقصى",ex:"Let us optimize this algorithm."},
   {w:"Synthesis",e:"Combining parts to form a new whole",a:"تركيب / دمج أجزاء لتشكيل كل جديد",ex:"His thesis was a synthesis of theories."}],
  [{w:"Concise",e:"Giving much information clearly and briefly",a:"موجز / مختصر ومعبّر",ex:"Write concise code that others can read."},
   {w:"Coherent",e:"Logical and consistent; easy to understand",a:"متماسك / منطقي ومتسق",ex:"His argument was coherent and well-structured."},
   {w:"Deduce",e:"Arrive at a conclusion by reasoning",a:"يستنتج / يصل للنتيجة بالمنطق",ex:"He deduced the bug from the error message."},
   {w:"Implement",e:"To put a plan or decision into effect",a:"ينفّذ / يطبّق خطة أو فكرة",ex:"They implemented the feature in two hours."},
   {w:"Leverage",e:"Use something to maximum advantage",a:"يستغل / يوظّف شيئاً لأقصى فائدة",ex:"Leverage your strengths to grow faster."}],
  [{w:"Robust",e:"Strong and effective in all conditions",a:"متين / قوي في جميع الظروف",ex:"A robust system handles errors gracefully."},
   {w:"Intuitive",e:"Easy to understand without much effort",a:"بديهي / سهل الفهم بشكل تلقائي",ex:"The app has an intuitive interface."},
   {w:"Systematic",e:"Done in a methodical and organized way",a:"منهجي / مرتّب وفق نظام واضح",ex:"She approached the problem systematically."},
   {w:"Fundamental",e:"Forming the base or core of something",a:"أساسي / جوهري / ركيزة رئيسية",ex:"Algorithms are fundamental to programming."},
   {w:"Analytical",e:"Using logical reasoning to examine something",a:"تحليلي / يعتمد على المنطق والتفكير",ex:"An analytical mind excels in engineering."}],
  [{w:"Initiative",e:"The ability to start things independently",a:"مبادرة / القدرة على البدء باستقلالية",ex:"He took the initiative to fix the bug."},
   {w:"Consistency",e:"Doing the same thing repeatedly over time",a:"اتساق / الاستمرار على نفس النهج",ex:"Consistency is the key to mastery."},
   {w:"Competence",e:"The ability to do something successfully",a:"كفاءة / القدرة على أداء شيء بنجاح",ex:"His competence was clear from day one."},
   {w:"Persistence",e:"Continuing firmly despite obstacles",a:"إصرار / المضي قُدُماً رغم العقبات",ex:"Persistence turns failures into lessons."},
   {w:"Discipline",e:"Training yourself to follow rules consistently",a:"انضباط / تدريب النفس على الالتزام",ex:"Discipline separates good from great."}],
  [{w:"Refactor",e:"Restructure code without changing its behavior",a:"يُعيد هيكلة / يُحسّن الكود دون تغيير وظيفته",ex:"Refactor your code to make it cleaner."},
   {w:"Debug",e:"Find and fix errors in code",a:"يصحّح / يكتشف الأخطاء ويصلحها",ex:"He spent an hour debugging the function."},
   {w:"Syntax",e:"The rules that define the structure of a language",a:"صياغة / قواعد بناء لغة البرمجة",ex:"Python syntax is clean and readable."},
   {w:"Algorithm",e:"A step-by-step set of instructions to solve a problem",a:"خوارزمية / سلسلة خطوات لحل مشكلة",ex:"A good algorithm runs fast and uses less memory."},
   {w:"Variable",e:"A named storage location for a value",a:"متغيّر / مكان لتخزين قيمة في البرمجة",ex:"Declare a variable before using it."}],
];

const CODING_TRACKS = [
  {id:"python",icon:"🐍",name:"Python",color:"#3776AB",levels:[
    {id:"py1",title:"Variables & Data Types",desc:"Store and use data",ar:"تخزين البيانات واستخدامها",xp:20,lessons:[
      {title:"Variables",code:`name = "Mohammed"\nage = 17\nprint(name, age)`,explanation:"A variable stores a value. Use = to assign.",ar:"المتغير يخزن قيمة. استخدم = للإسناد."},
      {title:"Data Types",code:`x = 10        # int\ny = 3.14      # float\nz = "Hello"   # string\nb = True      # boolean`,explanation:"Python has 4 basic types: int, float, string, boolean.",ar:"4 أنواع أساسية: عدد صحيح، عشري، نص، منطقي."},
      {title:"User Input",code:`name = input("Enter your name: ")\nprint("Hello,", name)`,explanation:"input() gets text from the user.",ar:"input() تأخذ نصاً من المستخدم."},
    ]},
    {id:"py2",title:"Conditions",desc:"Make decisions in code",ar:"اتخاذ القرارات في الكود",xp:25,lessons:[
      {title:"If/Else",code:`age = 17\nif age >= 18:\n    print("Adult")\nelse:\n    print("Minor")`,explanation:"if checks a condition. else runs when false.",ar:"if تفحص شرطاً. else تُنفَّذ عند الفشل."},
      {title:"elif",code:`score = 85\nif score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")`,explanation:"elif lets you check multiple conditions.",ar:"elif تتيح فحص شروط متعددة."},
    ]},
    {id:"py3",title:"Loops",desc:"Repeat actions automatically",ar:"تكرار الإجراءات تلقائياً",xp:30,lessons:[
      {title:"For Loop",code:`for i in range(5):\n    print("Day", i+1)`,explanation:"range(5) gives numbers 0 to 4.",ar:"range(5) تعطي أرقاماً من 0 إلى 4."},
      {title:"While Loop",code:`count = 0\nwhile count < 3:\n    print("Count:", count)\n    count += 1`,explanation:"while repeats as long as condition is True.",ar:"while تكرر طالما الشرط صحيح."},
    ]},
    {id:"py4",title:"Functions",desc:"Reusable code blocks",ar:"أكواد قابلة لإعادة الاستخدام",xp:35,lessons:[
      {title:"Define a Function",code:`def greet(name):\n    return "Hello, " + name\n\nprint(greet("Mohammed"))`,explanation:"def creates a function. return sends a value back.",ar:"def تُنشئ دالة. return تُعيد قيمة."},
    ]},
    {id:"py5",title:"Lists & Dicts",desc:"Store collections of data",ar:"تخزين مجموعات من البيانات",xp:40,lessons:[
      {title:"Lists",code:`grades = [98, 95, 100, 97]\nprint(grades[0])  # 98\nprint(len(grades)) # 4`,explanation:"Lists store multiple values. Access by index from 0.",ar:"القوائم تخزن قيماً متعددة. الفهرس يبدأ من 0."},
      {title:"Dictionaries",code:`student = {\n  "name": "Mohammed",\n  "gpa": 98.4\n}\nprint(student["name"])`,explanation:"Dictionaries store key-value pairs.",ar:"القواميس تخزن أزواج مفتاح-قيمة."},
    ]},
  ]},
  {id:"js",icon:"🟨",name:"JavaScript",color:"#F7DF1E",levels:[
    {id:"js1",title:"Variables & Console",desc:"Your first JavaScript",ar:"أول JavaScript لك",xp:20,lessons:[
      {title:"let & const",code:`let name = "Mohammed";\nconst age = 17;\nconsole.log(name, age);`,explanation:"let is for values that change. const never changes.",ar:"let للقيم القابلة للتغيير. const لا تتغير أبداً."},
    ]},
    {id:"js2",title:"Functions & Arrays",desc:"Build reusable logic",ar:"بناء منطق قابل لإعادة الاستخدام",xp:30,lessons:[
      {title:"Arrow Functions",code:"const greet = (name) => {\n  return `Hello ${name}!`;\n};\nconsole.log(greet(\"Mohammed\"));",explanation:"Arrow functions are a modern way to write functions.",ar:"الدوال السهمية طريقة حديثة لكتابة الدوال."},
      {title:"Arrays",code:`const scores = [98, 95, 100];\nconsole.log(scores.length); // 3\nscores.push(97);`,explanation:"Arrays store lists. push() adds to the end.",ar:"المصفوفات تخزن قوائم. push() تضيف في النهاية."},
    ]},
    {id:"js3",title:"DOM Manipulation",desc:"Make web pages interactive",ar:"جعل صفحات الويب تفاعلية",xp:40,lessons:[
      {title:"Selecting Elements",code:`const btn = document.getElementById("myBtn");\nbtn.addEventListener("click", () => {\n  alert("Clicked!");\n});`,explanation:"getElementById finds an element. addEventListener listens for events.",ar:"getElementById يجد عنصراً. addEventListener يستمع للأحداث."},
    ]},
  ]},
  {id:"html",icon:"🌐",name:"HTML & CSS",color:"#E34C26",levels:[
    {id:"h1",title:"HTML Basics",desc:"Structure of a webpage",ar:"هيكل صفحة الويب",xp:15,lessons:[
      {title:"Basic HTML",code:`<!DOCTYPE html>\n<html>\n  <head>\n    <title>My Page</title>\n  </head>\n  <body>\n    <h1>Hello World!</h1>\n    <p>My first webpage.</p>\n  </body>\n</html>`,explanation:"Every HTML page needs html, head, and body tags.",ar:"كل صفحة HTML تحتاج وسوم html و head و body."},
      {title:"Common Tags",code:`<h1>Main Title</h1>\n<p>A paragraph</p>\n<a href="https://google.com">Link</a>\n<img src="photo.jpg" alt="photo">`,explanation:"h1-h6 headings, p paragraph, a link, img image.",ar:"h1-h6 عناوين، p فقرة، a رابط، img صورة."},
    ]},
    {id:"h2",title:"CSS Styling",desc:"Make your page beautiful",ar:"جعل صفحتك جميلة",xp:20,lessons:[
      {title:"Basic CSS",code:`h1 {\n  color: purple;\n  font-size: 32px;\n}\np {\n  color: gray;\n  line-height: 1.6;\n}`,explanation:"CSS selects elements and applies styles.",ar:"CSS تختار العناصر وتُطبّق التنسيقات."},
      {title:"Flexbox",code:`.container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  gap: 16px;\n}`,explanation:"Flexbox makes layouts easy.",ar:"Flexbox يجعل التخطيط سهلاً."},
    ]},
  ]},
];

// ── Helpers ──
const F_today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric"});
const lvlInfo = xp => { const lv=Math.floor(xp/XPL)+1, lxp=xp%XPL; return {lv,lxp,pct:(lxp/XPL)*100}; };
const getRank = lv => { let r=RANKS[0]; for(const x of RANKS) if(lv>=x.at) r=x; return r; };
const todayWords = () => ALL_WORDS[Math.floor(Date.now()/86400000)%ALL_WORDS.length];
const prevDay = () => new Date(Date.now()-86400000).toISOString().split("T")[0];
const genMath = (lv=1) => {
  const ops = lv===1?["+","-"]:lv===2?["+","-","×"]:["+","-","×","÷"];
  const op = ops[Math.floor(Math.random()*ops.length)];
  let a,b,ans;
  if(op==="+"){a=Math.floor(Math.random()*50)+1;b=Math.floor(Math.random()*50)+1;ans=a+b;}
  else if(op==="-"){a=Math.floor(Math.random()*50)+10;b=Math.floor(Math.random()*a);ans=a-b;}
  else if(op==="×"){a=Math.floor(Math.random()*12)+1;b=Math.floor(Math.random()*12)+1;ans=a*b;}
  else{b=Math.floor(Math.random()*10)+1;ans=Math.floor(Math.random()*10)+1;a=b*ans;}
  return {q:`${a} ${op} ${b} = ?`,ans:ans.toString()};
};

// ── localStorage Storage ──
const db = {
  load()    { try { const r=localStorage.getItem(SKEY); return r?JSON.parse(r):{}; } catch { return {}; } },
  save(d)   { try { localStorage.setItem(SKEY,JSON.stringify(d)); } catch {} },
  getSess() { try { return localStorage.getItem(SESS)||null; } catch { return null; } },
  setSess(u){ try { localStorage.setItem(SESS,u); } catch {} },
  delSess() { try { localStorage.removeItem(SESS); } catch {} },
};

const mkUser = (u,p) => ({
  password:p, xp:0, createdAt:Date.now(),
  habits:[], completions:{}, library:[], study:[],
  vocabulary:[], sleepLog:[], screenTime:[],
  body:{height:"",weight:"",targetWeight:""},
  routineStreak:0, lastRoutineDate:null, seenMilestones:[],
  codingProgress:{}, goals:[], transactions:[], notes:[],
  meals:{}, workouts:[], waterLog:[], meditationLog:[],
  spinHistory:[], earnedBadges:[], mathScore:0, mathLevel:1,
});

const computeStreak = (user,completions) => {
  const t=F_today(), yest=prevDay();
  const todayDone=(completions[t]||[]).length>0;
  if(!todayDone){
    const last=user.lastRoutineDate;
    if(!last) return {streak:0,lastRoutineDate:null};
    if(last===yest||last===t) return {streak:user.routineStreak,lastRoutineDate:last};
    return {streak:0,lastRoutineDate:null};
  }
  const last=user.lastRoutineDate;
  if(last===t) return {streak:user.routineStreak,lastRoutineDate:t};
  if(last===yest) return {streak:user.routineStreak+1,lastRoutineDate:t};
  return {streak:1,lastRoutineDate:t};
};

const checkBadges = user => {
  const earned = user.earnedBadges||[];
  return BADGES.filter(b=>!earned.includes(b.id)&&b.check(user)).map(b=>b.id);
};

// ── Micro Components ──
const Card = ({children,style,onClick}) => (
  <div onClick={onClick} style={{background:C.card,borderRadius:20,padding:"16px 18px",boxShadow:sh,marginBottom:12,cursor:onClick?"pointer":"default",animation:"fadeIn 0.25s ease",...style}}>{children}</div>
);
const Btn = ({children,onClick,style,v="pri",sm,disabled}) => {
  const vs = {
    pri:{background:C.primary,color:"#fff"},
    sec:{background:C.pl,color:C.primary},
    ghost:{background:"transparent",color:C.sub,border:`1.5px solid ${C.border}`},
    ok:{background:"#E8F9EC",color:C.ok},
    danger:{background:"#FFF0EF",color:C.err},
  };
  return <button disabled={disabled} onClick={onClick}
    style={{...vs[v],border:"none",borderRadius:13,padding:sm?"7px 15px":"12px 22px",fontSize:sm?13:14,fontWeight:700,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.5:1,transition:"all 0.15s",...style}}
    onMouseDown={e=>{if(!disabled)e.currentTarget.style.transform="scale(0.97)"}}
    onMouseUp={e=>{e.currentTarget.style.transform="scale(1)"}}>
    {children}
  </button>;
};
const Inp = ({p,v,o,t="text",s,rows}) => {
  const base = {width:"100%",padding:"11px 14px",borderRadius:13,border:`1.5px solid ${C.border}`,fontSize:14,color:C.text,background:"#FAFAFA",outline:"none",boxSizing:"border-box",transition:"border-color 0.2s",...s};
  return rows
    ? <textarea placeholder={p} value={v} onChange={o} rows={rows} style={{...base,resize:"none"}} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>
    : <input type={t} placeholder={p} value={v} onChange={o} style={base} onFocus={e=>e.target.style.borderColor=C.primary} onBlur={e=>e.target.style.borderColor=C.border}/>;
};
const Tag = ({label,col=C.primary}) => <span style={{background:col+"1A",color:col,fontSize:11,fontWeight:700,padding:"2px 9px",borderRadius:20}}>{label}</span>;
const Pill = ({label,active,onClick}) => <span onClick={onClick} style={{padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap",flexShrink:0,background:active?C.primary:C.card,color:active?"#fff":C.sub,boxShadow:active?"none":sh,transition:"all 0.18s"}}>{label}</span>;
const SL = ({text}) => <p style={{fontSize:11,fontWeight:800,color:C.sub,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10,marginTop:6}}>{text}</p>;

// ── Milestone Modal ──
function MilestoneModal({milestone,onClose}){
  if(!milestone) return null;
  const confetti = Array.from({length:18},(_,i)=>({left:`${5+i*5.5}%`,color:["#5856D6","#FF9500","#34C759","#FF3B30","#32ADE6","#AF52DE"][i%6],delay:`${(i*0.08).toFixed(2)}s`,dur:`${0.7+(i%4)*0.15}s`}));
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:9998,display:"flex",alignItems:"center",justifyContent:"center",padding:"0 20px",backdropFilter:"blur(6px)"}}>
      {confetti.map((c,i)=><div key={i} style={{position:"absolute",top:0,left:c.left,width:8,height:8,borderRadius:2,background:c.color,animation:`confettiFall ${c.dur} ${c.delay} ease-out forwards`}}/>)}
      <div style={{background:C.card,borderRadius:28,padding:"36px 28px 28px",maxWidth:380,width:"100%",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,0.3)",animation:"popIn 0.4s cubic-bezier(.22,1,.36,1)",position:"relative"}}>
        <div style={{position:"absolute",top:-30,left:"50%",transform:"translateX(-50%)",width:120,height:120,borderRadius:"50%",background:milestone.color+"33",filter:"blur(30px)",pointerEvents:"none"}}/>
        <div style={{fontSize:72,marginBottom:14,animation:"float 2s ease-in-out infinite",display:"block"}}>{milestone.emoji}</div>
        <div style={{display:"inline-block",background:milestone.color+"1A",borderRadius:99,padding:"5px 18px",marginBottom:14}}>
          <span style={{color:milestone.color,fontWeight:800,fontSize:13}}>Day {milestone.day} Milestone</span>
        </div>
        <h2 style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:14,lineHeight:1.2}}>{milestone.title}</h2>
        <div style={{background:milestone.bg,borderRadius:16,padding:"16px 18px",marginBottom:22,border:`1.5px solid ${milestone.color}30`}}>
          <p style={{fontSize:14,color:"#3D3D4D",lineHeight:1.7,fontWeight:500}}>{milestone.msg}</p>
        </div>
        <Btn onClick={onClose} style={{width:"100%",padding:"14px",fontSize:15,background:`linear-gradient(135deg,${milestone.color},${milestone.color}CC)`}}>Let's Keep Going! ⚡</Btn>
      </div>
    </div>
  );
}

// ── Badge Popup ──
function BadgePopup({badge,onClose}){
  if(!badge) return null;
  return(
    <div style={{position:"fixed",bottom:100,left:"50%",transform:"translateX(-50%)",background:"#1C1C2E",borderRadius:20,padding:"14px 20px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,0.3)",zIndex:9997,animation:"popIn 0.4s cubic-bezier(.22,1,.36,1)",maxWidth:340,width:"90%"}}>
      <span style={{fontSize:36}}>{badge.icon}</span>
      <div style={{flex:1}}>
        <p style={{color:"#FF9500",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1}}>🏅 Badge Unlocked!</p>
        <p style={{color:"#fff",fontSize:15,fontWeight:900,marginTop:2}}>{badge.name}</p>
        <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,marginTop:2}}>{badge.desc}</p>
      </div>
      <span onClick={onClose} style={{color:"rgba(255,255,255,0.4)",fontSize:20,cursor:"pointer"}}>×</span>
    </div>
  );
}

// ── Day Streak Card ──
function DayStreakCard({streak,nextMilestone}){
  const filled = streak%7||(streak>0&&streak%7===0?7:0);
  const weeksDone = Math.floor(streak/7);
  const sc = streak===0?C.sub:streak<7?C.teal:streak<21?C.gold:"#AF52DE";
  return(
    <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2A2840)",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <p style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:800,letterSpacing:1.5,textTransform:"uppercase",marginBottom:4}}>Routine Streak</p>
          <div style={{display:"flex",alignItems:"baseline",gap:6}}>
            <span style={{fontSize:46,fontWeight:900,color:"#fff",lineHeight:1,letterSpacing:"-2px"}}>{streak}</span>
            <span style={{fontSize:16,fontWeight:700,color:"rgba(255,255,255,0.55)"}}>days</span>
          </div>
          {weeksDone>0&&<p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:3}}>{weeksDone} {weeksDone===1?"week":"weeks"} completed</p>}
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:48,animation:streak>0?"float 2.5s ease-in-out infinite":"none"}}>
            {streak===0?"😴":streak<3?"🌱":streak<7?"⚡":streak<21?"🔥":streak<30?"🏆":"👑"}
          </div>
          {streak===0&&<p style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:3}}>Start today!</p>}
        </div>
      </div>
      <div style={{display:"flex",gap:7,marginBottom:14}}>
        {Array.from({length:7},(_,i)=><div key={i} style={{flex:1,height:7,borderRadius:99,background:i<filled?sc:"rgba(255,255,255,0.12)",transition:"background 0.4s"}}/>)}
      </div>
      {nextMilestone&&streak<nextMilestone.day?(
        <div style={{background:"rgba(255,255,255,0.07)",borderRadius:13,padding:"10px 14px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>{nextMilestone.emoji}</span>
          <div style={{flex:1}}>
            <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:600}}>Next milestone</p>
            <div style={{background:"rgba(255,255,255,0.12)",borderRadius:99,height:5,marginTop:5}}>
              <div style={{width:`${(streak/nextMilestone.day)*100}%`,background:sc,height:"100%",borderRadius:99,transition:"width 0.5s"}}/>
            </div>
          </div>
          <span style={{color:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:700,whiteSpace:"nowrap"}}>{nextMilestone.day-streak}d left</span>
        </div>
      ):(streak>0&&<p style={{textAlign:"center",color:"rgba(255,255,255,0.5)",fontSize:13,fontWeight:700}}>💎 All milestones reached. You are legendary.</p>)}
    </Card>
  );
}

// ── Spin Wheel ──
function SpinWheel({userData,saveUser,showNotif,onBadge}){
  const[spinning,setSpinning]=useState(false);
  const[result,setResult]=useState(null);
  const[rotation,setRotation]=useState(0);
  const t=F_today();
  const alreadySpun=(userData.spinHistory||[]).includes(t);
  const spin=()=>{
    if(spinning||alreadySpun) return;
    const idx=Math.floor(Math.random()*SPIN_PRIZES.length);
    const prize=SPIN_PRIZES[idx];
    const newRot=rotation+1440+(360/SPIN_PRIZES.length)*idx;
    setSpinning(true); setRotation(newRot);
    setTimeout(()=>{
      setSpinning(false); setResult(prize);
      const updated={...userData,xp:(userData.xp||0)+prize.xp,spinHistory:[...(userData.spinHistory||[]),t]};
      const nb=checkBadges(updated);
      saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
      showNotif(`${prize.label} from the wheel! 🎰`,"xp");
      if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),800);
    },3000);
  };
  const sa=360/SPIN_PRIZES.length;
  return(
    <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2A2840)",marginBottom:14}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <span style={{fontSize:20}}>🎰</span>
        <div>
          <p style={{color:"#fff",fontWeight:800,fontSize:15}}>Daily Spin Wheel</p>
          <p style={{color:"rgba(255,255,255,0.4)",fontSize:12}}>{alreadySpun?"Come back tomorrow!":"Spin once per day for bonus XP"}</p>
        </div>
      </div>
      <div style={{display:"flex",justifyContent:"center",marginBottom:14,position:"relative"}}>
        <div style={{position:"absolute",top:-8,left:"50%",transform:"translateX(-50%)",width:0,height:0,borderLeft:"10px solid transparent",borderRight:"10px solid transparent",borderTop:"20px solid #FF9500",zIndex:1}}/>
        <div style={{width:180,height:180,borderRadius:"50%",position:"relative",overflow:"hidden",transition:spinning?"transform 3s cubic-bezier(0.17,0.67,0.12,0.99)":"none",transform:`rotate(${rotation}deg)`,border:"4px solid rgba(255,255,255,0.2)"}}>
          {SPIN_PRIZES.map((p,i)=>(
            <div key={i} style={{position:"absolute",top:"50%",left:"50%",width:0,height:0,transformOrigin:"0 0",transform:`rotate(${i*sa}deg)`}}>
              <div style={{position:"absolute",top:-90,left:0,width:90,height:90,background:p.color,clipPath:"polygon(0 0, 100% 0, 100% 100%)",opacity:0.9}}/>
              <p style={{position:"absolute",top:-60,left:8,color:"#fff",fontSize:9,fontWeight:800,transform:`rotate(${sa/2}deg)`,whiteSpace:"nowrap"}}>{p.label}</p>
            </div>
          ))}
          <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:30,height:30,borderRadius:"50%",background:"#1C1C2E",border:"3px solid rgba(255,255,255,0.3)"}}/>
        </div>
      </div>
      {result&&<p style={{textAlign:"center",color:"#FF9500",fontWeight:800,fontSize:14,marginBottom:10}}>🎉 You won {result.label}!</p>}
      <Btn onClick={spin} disabled={alreadySpun||spinning} style={{width:"100%",background:alreadySpun?"rgba(255,255,255,0.1)":spinning?"rgba(255,255,255,0.15)":"linear-gradient(135deg,#FF9500,#FFB347)",color:"#fff"}}>
        {alreadySpun?"✅ Spun Today":spinning?"Spinning...":"🎰 Spin Now!"}
      </Btn>
    </Card>
  );
}

// ── HOME TAB ──
function HomeTab({userData,username,saveUser,showNotif,onBadge}){
  const{lv,lxp,pct}=lvlInfo(userData.xp||0);
  const rank=getRank(lv), t=F_today();
  const doneCnt=(userData.completions?.[t]||[]).length, habCnt=(userData.habits||[]).length;
  const streak=userData.routineStreak||0, nextM=MILESTONES.find(m=>m.day>streak);
  const compLib=(userData.library||[]).filter(x=>x.status==="Completed").length;
  const words=todayWords();
  const[expanded,setExpanded]=useState(null);
  const waterToday=(userData.waterLog||[]).find(w=>w.date===t)||{cups:0,goal:8};

  return(
    <div style={{padding:"0 16px 8px"}}>
      <div style={{paddingTop:24,marginBottom:20}}>
        <p style={{color:C.sub,fontSize:13}}>{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</p>
        <h1 style={{fontSize:26,fontWeight:900,color:C.text,marginTop:3,letterSpacing:"-0.5px"}}>Hey, {username}! 👋</h1>
      </div>

      {/* XP Card */}
      <div style={{background:"linear-gradient(140deg,#5856D6 0%,#7B79E8 50%,#9391EA 100%)",borderRadius:24,padding:"22px 22px 18px",boxShadow:shHero,marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:18}}>
          <div><span style={{background:rank.c,color:"#fff",fontSize:11,fontWeight:800,padding:"3px 10px",borderRadius:20}}>{rank.name}</span><p style={{color:"rgba(255,255,255,0.7)",fontSize:13,marginTop:5}}>Level {lv}</p></div>
          <div style={{textAlign:"right"}}><p style={{color:"rgba(255,255,255,0.75)",fontSize:13}}>Total XP</p><p style={{color:"#fff",fontSize:30,fontWeight:900,letterSpacing:"-1px",lineHeight:1.1}}>{userData.xp||0}</p></div>
        </div>
        <div style={{background:"rgba(255,255,255,0.22)",borderRadius:99,height:9}}><div style={{width:`${pct}%`,background:"rgba(255,255,255,0.95)",height:"100%",borderRadius:99,transition:"width 0.8s cubic-bezier(.22,1,.36,1)"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:7}}>
          <span style={{color:"rgba(255,255,255,0.65)",fontSize:12}}>{lxp}/{XPL} XP</span>
          <span style={{color:"rgba(255,255,255,0.65)",fontSize:12}}>{XPL-lxp} to Level {lv+1}</span>
        </div>
      </div>

      <DayStreakCard streak={streak} nextMilestone={nextM}/>

      {/* Quick Stats */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:8,marginBottom:12}}>
        {[{i:"✅",v:`${doneCnt}/${habCnt}`,l:"Habits"},{i:"📚",v:compLib,l:"Done"},{i:"💧",v:`${waterToday.cups}/${waterToday.goal||8}`,l:"Water"},{i:"🏅",v:(userData.earnedBadges||[]).length,l:"Badges"}].map(s=>(
          <Card key={s.l} style={{textAlign:"center",padding:"12px 6px",marginBottom:0}}>
            <div style={{fontSize:18}}>{s.i}</div>
            <div style={{fontWeight:900,fontSize:15,color:C.text,marginTop:2}}>{s.v}</div>
            <div style={{fontSize:10,color:C.sub,marginTop:1}}>{s.l}</div>
          </Card>
        ))}
      </div>

      {/* Today's habit progress */}
      {habCnt>0&&(
        <Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <p style={{fontWeight:700,fontSize:15,color:C.text}}>Today's Progress</p>
            <span style={{fontSize:13,fontWeight:700,color:doneCnt===habCnt?C.ok:C.primary}}>{doneCnt===habCnt&&habCnt>0?"🎉 All done!":`${doneCnt}/${habCnt}`}</span>
          </div>
          <div style={{background:C.border,borderRadius:99,height:8}}><div style={{width:`${habCnt?(doneCnt/habCnt)*100:0}%`,background:`linear-gradient(90deg,${C.ok},#7FE49B)`,height:"100%",borderRadius:99,transition:"width 0.6s ease"}}/></div>
          <div style={{marginTop:12,display:"flex",flexWrap:"wrap",gap:7}}>
            {(userData.habits||[]).slice(0,8).map(h=>{const done=(userData.completions?.[t]||[]).includes(h.id);return<span key={h.id} style={{fontSize:11,fontWeight:700,padding:"4px 10px",borderRadius:20,background:done?"#E8F9EC":C.bg,color:done?C.ok:C.sub,textDecoration:done?"line-through":"none"}}>{h.icon} {h.name}</span>;})}
          </div>
        </Card>
      )}

      <SpinWheel userData={userData} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>

      {/* 5 Words of the Day */}
      <Card style={{background:"linear-gradient(135deg,#FFF4E0,#FFFBF0)",border:"1.5px solid #FFD680"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
          <span style={{fontSize:20}}>📘</span>
          <div><p style={{fontSize:11,fontWeight:800,color:C.gold,textTransform:"uppercase",letterSpacing:1.5}}>Words of the Day</p><p style={{fontSize:11,color:"#9A6400",marginTop:1}}>5 words — English & Arabic 🇬🇧🇸🇦</p></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {words.map((word,i)=>(
            <div key={i} onClick={()=>setExpanded(expanded===i?null:i)} style={{background:"rgba(255,255,255,0.7)",borderRadius:14,padding:"12px 14px",cursor:"pointer",border:`1.5px solid ${expanded===i?"#FFB800":"transparent"}`,transition:"all 0.2s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{background:C.gold+"22",color:C.gold,fontSize:11,fontWeight:800,width:22,height:22,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</span>
                  <p style={{fontWeight:900,fontSize:15,color:C.text}}>{word.w}</p>
                </div>
                <span style={{color:C.sub,fontSize:14}}>{expanded===i?"▲":"▼"}</span>
              </div>
              {expanded===i&&(
                <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid #FFE08A"}}>
                  <p style={{fontSize:11,fontWeight:800,color:C.gold,marginBottom:3}}>🇬🇧 English</p>
                  <p style={{fontSize:13,color:"#3D3D4D",lineHeight:1.6,marginBottom:6}}>{word.e}</p>
                  <p style={{fontSize:12,fontStyle:"italic",color:"#9A6400",marginBottom:10}}>"{word.ex}"</p>
                  <div style={{background:"#F0FFF6",borderRadius:10,padding:"8px 12px"}}>
                    <p style={{fontSize:11,fontWeight:800,color:"#059669",marginBottom:3}}>🇸🇦 العربية</p>
                    <p style={{fontSize:13,color:"#065F46",lineHeight:1.6,direction:"rtl",textAlign:"right"}}>{word.a}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── HABITS TAB ──
function HabitsTab({userData,saveUser,showNotif,onMilestone,onBadge}){
  const[adding,setAdding]=useState(false);
  const[form,setForm]=useState({name:"",icon:"💪",cat:"Fitness"});
  const t=F_today(), done=userData.completions?.[t]||[];

  const toggle=id=>{
    const isDone=done.includes(id), newDone=isDone?done.filter(x=>x!==id):[...done,id], yest=prevDay();
    const newHabits=(userData.habits||[]).map(h=>{if(h.id!==id)return h;if(!isDone){const yD=(userData.completions?.[yest]||[]).includes(id);return{...h,streak:(yD?(h.streak||0):0)+1};}return{...h,streak:Math.max(0,(h.streak||0)-1)};});
    const newComp={...userData.completions,[t]:newDone};
    const{streak:newStreak,lastRoutineDate:newLast}=computeStreak({...userData,completions:newComp},newComp);
    const seen=userData.seenMilestones||[]; let newSeen=seen, milestoneToShow=null;
    if(!isDone){const hit=MILESTONES.find(m=>m.day===newStreak&&!seen.includes(m.day));if(hit){milestoneToShow=hit;newSeen=[...seen,hit.day];}}
    const updated={...userData,habits:newHabits,completions:newComp,xp:(userData.xp||0)+(isDone?0:10),routineStreak:newStreak,lastRoutineDate:newLast,seenMilestones:newSeen};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    if(!isDone) showNotif("+10 XP ⚡","xp");
    if(milestoneToShow) setTimeout(()=>onMilestone(milestoneToShow),600);
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),1200);
  };

  const addHabit=()=>{
    if(!form.name.trim()) return;
    const updated={...userData,habits:[...(userData.habits||[]),{id:Date.now().toString(),...form,streak:0}]};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    setForm({name:"",icon:"💪",cat:"Fitness"}); setAdding(false);
    showNotif("Habit added!","success");
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };
  const delHabit=id=>saveUser({...userData,habits:(userData.habits||[]).filter(h=>h.id!==id)});
  const bycat={}; (userData.habits||[]).forEach(h=>{(bycat[h.cat]||(bycat[h.cat]=[])).push(h);});

  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px"}}>Daily Habits</h1>
        <Btn sm v={adding?"sec":"pri"} onClick={()=>setAdding(!adding)}>{adding?"Cancel":"+ New"}</Btn>
      </div>
      {adding&&(
        <Card style={{border:`2px solid ${C.pl}`,marginBottom:20}}>
          <Inp p="Habit name" v={form.name} o={e=>setForm(f=>({...f,name:e.target.value}))} s={{marginBottom:12}}/>
          <SL text="Icon"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:14}}>{HABIT_ICONS.map(ic=><span key={ic} onClick={()=>setForm(f=>({...f,icon:ic}))} style={{fontSize:22,cursor:"pointer",padding:"5px 7px",borderRadius:10,background:form.icon===ic?C.pl:"transparent",border:`2px solid ${form.icon===ic?C.primary:"transparent"}`}}>{ic}</span>)}</div>
          <SL text="Category"/>
          <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>{HABIT_CATS.map(cat=><span key={cat} onClick={()=>setForm(f=>({...f,cat}))} style={{fontSize:13,fontWeight:700,padding:"6px 14px",borderRadius:20,cursor:"pointer",background:form.cat===cat?C.primary:C.pl,color:form.cat===cat?"#fff":C.primary}}>{cat}</span>)}</div>
          <Btn onClick={addHabit} style={{width:"100%"}}>Add Habit</Btn>
        </Card>
      )}
      {!(userData.habits?.length)&&<div style={{textAlign:"center",padding:"52px 0",color:C.sub}}><div style={{fontSize:56}}>🎯</div><p style={{fontWeight:800,fontSize:16,color:C.text,marginTop:14}}>No habits yet</p><p style={{fontSize:14,marginTop:6}}>Add your first habit!</p></div>}
      {Object.entries(bycat).map(([cat,hs])=>(
        <div key={cat} style={{marginBottom:20}}>
          <SL text={cat}/>
          {hs.map(h=>{const d=done.includes(h.id);return(
            <Card key={h.id} style={{marginBottom:9,border:`2px solid ${d?C.ok+"50":"transparent"}`}}>
              <div style={{display:"flex",alignItems:"center",gap:13}}>
                <div onClick={()=>toggle(h.id)} style={{width:44,height:44,borderRadius:14,background:d?C.ok:C.pl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:21,cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>{d?"✅":h.icon}</div>
                <div style={{flex:1}}><p style={{fontWeight:700,color:d?C.sub:C.text,fontSize:14,textDecoration:d?"line-through":"none"}}>{h.name}</p><p style={{fontSize:12,color:C.sub,marginTop:2}}>{h.streak>0?`🔥 ${h.streak} day streak`:"Start today!"}</p></div>
                <span onClick={()=>delHabit(h.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:22,lineHeight:1,padding:"0 4px"}}>×</span>
              </div>
            </Card>
          );})}
        </div>
      ))}
    </div>
  );
}

// ── HEALTH TAB ──
function HealthTab({userData,saveUser,showNotif,onBadge}){
  const[sec,setSec]=useState("water");
  const t=F_today();
  const waterToday=(userData.waterLog||[]).find(w=>w.date===t)||{date:t,cups:0,goal:8};
  const[goal,setGoal]=useState(waterToday.goal||8);
  const[medSec,setMedSec]=useState(false);
  const[medTime,setMedTime]=useState(300);
  const[medRunning,setMedRunning]=useState(false);
  const[medLeft,setMedLeft]=useState(300);
  const timerRef=useRef(null);
  const[wForm,setWForm]=useState({type:"",sets:"",reps:"",notes:""});
  const[bF,setBF]=useState({height:userData.body?.height||"",weight:userData.body?.weight||"",target:userData.body?.targetWeight||""});
  const[slF,setSlF]=useState({hours:"",qual:"Good"});

  const addCup=()=>{
    const newCups=Math.min((waterToday.cups||0)+1,goal);
    const newLog=(userData.waterLog||[]).filter(w=>w.date!==t);
    const updated={...userData,waterLog:[...newLog,{date:t,cups:newCups,goal}]};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("💧 +1 cup!","success");
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const startMed=()=>{
    setMedLeft(medTime); setMedRunning(true);
    timerRef.current=setInterval(()=>{
      setMedLeft(l=>{
        if(l<=1){
          clearInterval(timerRef.current); setMedRunning(false);
          const updated={...userData,meditationLog:[...(userData.meditationLog||[]),{date:t,duration:medTime,at:Date.now()}],xp:(userData.xp||0)+10};
          const nb=checkBadges(updated);
          saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
          showNotif("+10 XP — Meditation complete! 🧘","xp");
          if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
          return 0;
        }
        return l-1;
      });
    },1000);
  };
  const stopMed=()=>{clearInterval(timerRef.current);setMedRunning(false);setMedLeft(medTime);};
  const fmtTime=s=>`${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;

  const logWorkout=()=>{
    if(!wForm.type) return;
    const updated={...userData,workouts:[...(userData.workouts||[]),{id:Date.now().toString(),date:t,...wForm}],xp:(userData.xp||0)+15};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+15 XP — Workout logged! 💪","xp");
    setWForm({type:"",sets:"",reps:"",notes:""});
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const saveBody=()=>{
    saveUser({...userData,body:{...userData.body,height:bF.height,weight:bF.weight,targetWeight:bF.target},xp:(userData.xp||0)+5});
    showNotif("+5 XP — Saved! ⚡","xp");
  };

  const logSleep=()=>{
    if(!slF.hours) return;
    const log=[...(userData.sleepLog||[]).filter(s=>s.date!==t),{date:t,hours:Number(slF.hours),qual:slF.qual}];
    const updated={...userData,sleepLog:log,xp:(userData.xp||0)+5};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+5 XP — Sleep logged! 🌙","xp");
    setSlF({hours:"",qual:"Good"});
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const SECS=[{id:"water",i:"💧",l:"Water"},{id:"workout",i:"🏋️",l:"Workout"},{id:"meditate",i:"🧘",l:"Meditate"},{id:"sleep",i:"🌙",l:"Sleep"},{id:"body",i:"💪",l:"Body"}];

  return(
    <div style={{padding:"24px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px",marginBottom:16}}>Health 💚</h1>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>{SECS.map(s=><Pill key={s.id} label={`${s.i} ${s.l}`} active={sec===s.id} onClick={()=>setSec(s.id)}/>)}</div>

      {sec==="water"&&(
        <>
          <Card style={{background:"linear-gradient(145deg,#E0F4FF,#F0F9FF)",border:"1.5px solid #BAE6FD",textAlign:"center"}}>
            <p style={{fontSize:11,fontWeight:800,color:C.teal,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>💧 Today's Water</p>
            <p style={{fontSize:64,fontWeight:900,color:C.teal,lineHeight:1}}>{waterToday.cups||0}</p>
            <p style={{color:C.sub,fontSize:14,marginTop:4}}>of {goal} cups goal</p>
            <div style={{background:"rgba(50,173,230,0.15)",borderRadius:99,height:10,margin:"14px 0"}}>
              <div style={{width:`${Math.min(100,((waterToday.cups||0)/goal)*100)}%`,background:C.teal,height:"100%",borderRadius:99,transition:"width 0.4s"}}/>
            </div>
            <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:10}}>
              {Array.from({length:goal},(_,i)=><span key={i} style={{fontSize:24,opacity:i<(waterToday.cups||0)?1:0.25}}>💧</span>)}
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn style={{flex:1,background:"linear-gradient(135deg,#32ADE6,#5AC8FA)",color:"#fff"}} onClick={addCup}>+ Add Cup</Btn>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <p style={{fontSize:12,color:C.sub}}>Goal:</p>
                <input type="number" value={goal} onChange={e=>setGoal(Number(e.target.value))} style={{width:50,padding:"8px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:14,textAlign:"center",outline:"none"}}/>
              </div>
            </div>
          </Card>
          <SL text="History"/>
          {(userData.waterLog||[]).slice(-7).reverse().map(e=>(
            <Card key={e.date} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <p style={{fontWeight:700,fontSize:14}}>{fmtDate(e.date)}</p>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <div style={{background:C.border,borderRadius:99,height:6,width:80}}><div style={{width:`${Math.min(100,(e.cups/(e.goal||8))*100)}%`,background:C.teal,height:"100%",borderRadius:99}}/></div>
                  <p style={{fontWeight:800,color:C.teal,fontSize:14}}>{e.cups}/{e.goal||8}</p>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {sec==="workout"&&(
        <>
          <Card>
            <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:14}}>🏋️ Log Workout</p>
            <SL text="Type"/>
            <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:12}}>
              {WORKOUT_TYPES.map(tp=><span key={tp} onClick={()=>setWForm(f=>({...f,type:tp}))} style={{fontSize:12,fontWeight:700,padding:"6px 12px",borderRadius:20,cursor:"pointer",background:wForm.type===tp?C.primary:C.pl,color:wForm.type===tp?"#fff":C.primary}}>{tp}</span>)}
            </div>
            <div style={{display:"flex",gap:10,marginBottom:10}}>
              <div style={{flex:1}}><p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Sets</p><Inp t="number" p="3" v={wForm.sets} o={e=>setWForm(f=>({...f,sets:e.target.value}))}/></div>
              <div style={{flex:1}}><p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Reps / Min</p><Inp t="number" p="10" v={wForm.reps} o={e=>setWForm(f=>({...f,reps:e.target.value}))}/></div>
            </div>
            <Inp p="Notes (optional)" v={wForm.notes} o={e=>setWForm(f=>({...f,notes:e.target.value}))} s={{marginBottom:12}}/>
            <Btn onClick={logWorkout} style={{width:"100%"}}>Log Workout +15XP</Btn>
          </Card>
          <SL text="Recent Workouts"/>
          {!(userData.workouts?.length)&&<p style={{textAlign:"center",color:C.sub,fontSize:13,padding:"20px 0"}}>No workouts yet.</p>}
          {(userData.workouts||[]).slice(-10).reverse().map(w=>(
            <Card key={w.id} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontWeight:700,fontSize:14}}>{w.type}</p>{w.sets&&<p style={{fontSize:12,color:C.sub,marginTop:2}}>{w.sets} sets × {w.reps} reps</p>}</div>
                <Tag label={fmtDate(w.date)}/>
              </div>
              {w.notes&&<p style={{fontSize:12,color:C.sub,marginTop:6,fontStyle:"italic"}}>{w.notes}</p>}
            </Card>
          ))}
        </>
      )}

      {sec==="meditate"&&(
        <Card style={{textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:4}}>🧘 Meditation Timer</p>
          <p style={{color:C.sub,fontSize:13,marginBottom:20}}>Total sessions: {(userData.meditationLog||[]).length}</p>
          <div style={{fontSize:72,fontWeight:900,color:medRunning?C.primary:C.text,marginBottom:20,fontVariantNumeric:"tabular-nums"}}>
            {fmtTime(medRunning?medLeft:medTime)}
          </div>
          {!medRunning&&(
            <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:20,flexWrap:"wrap"}}>
              {[60,180,300,600,900,1200].map(s=><span key={s} onClick={()=>{setMedTime(s);setMedLeft(s);}} style={{padding:"7px 14px",borderRadius:20,fontSize:13,fontWeight:700,cursor:"pointer",background:medTime===s?C.primary:C.pl,color:medTime===s?"#fff":C.primary}}>{fmtTime(s)}</span>)}
            </div>
          )}
          {medRunning
            ? <Btn v="danger" onClick={stopMed} style={{width:"100%"}}>⏹ Stop</Btn>
            : <Btn onClick={startMed} style={{width:"100%",background:"linear-gradient(135deg,#AF52DE,#BF5AF2)",color:"#fff"}}>▶ Start Meditation</Btn>}
          <p style={{color:C.sub,fontSize:12,marginTop:12}}>+10 XP per completed session</p>
        </Card>
      )}

      {sec==="sleep"&&(
        <>
          <Card>
            <p style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:14}}>🌙 Log Sleep</p>
            <p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Hours slept last night</p>
            <Inp t="number" p="7.5" v={slF.hours} o={e=>setSlF(f=>({...f,hours:e.target.value}))} s={{marginBottom:11}}/>
            <div style={{display:"flex",gap:7,marginBottom:16}}>
              {["Poor","Okay","Good","Great"].map(q=><span key={q} onClick={()=>setSlF(f=>({...f,qual:q}))} style={{flex:1,textAlign:"center",padding:"8px 0",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",background:slF.qual===q?C.primary:C.pl,color:slF.qual===q?"#fff":C.primary}}>{q}</span>)}
            </div>
            <Btn onClick={logSleep} style={{width:"100%"}}>Log Sleep +5XP</Btn>
          </Card>
          <SL text="Recent Nights"/>
          {(userData.sleepLog||[]).slice(-7).reverse().map(e=>(
            <Card key={e.date} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontWeight:700,fontSize:14}}>{fmtDate(e.date)}</p><Tag label={e.qual} col={e.qual==="Great"?C.ok:e.qual==="Poor"?C.err:C.primary}/></div>
                <p style={{fontSize:26,fontWeight:900,color:C.primary}}>{e.hours}h</p>
              </div>
            </Card>
          ))}
        </>
      )}

      {sec==="body"&&(
        <Card>
          <p style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:16}}>💪 Body Stats</p>
          <div style={{display:"flex",gap:10,marginBottom:11}}>
            <div style={{flex:1}}><p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Height (cm)</p><Inp p="175" t="number" v={bF.height} o={e=>setBF(f=>({...f,height:e.target.value}))}/></div>
            <div style={{flex:1}}><p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Weight (kg)</p><Inp p="70" t="number" v={bF.weight} o={e=>setBF(f=>({...f,weight:e.target.value}))}/></div>
          </div>
          <p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Target Weight (kg)</p>
          <Inp p="65" t="number" v={bF.target} o={e=>setBF(f=>({...f,target:e.target.value}))} s={{marginBottom:14}}/>
          {bF.height&&bF.weight&&(()=>{
            const bmi=(Number(bF.weight)/((Number(bF.height)/100)**2)).toFixed(1);
            const cat=bmi<18.5?["Underweight",C.teal]:bmi<25?["Normal ✅",C.ok]:bmi<30?["Overweight",C.gold]:["Obese",C.err];
            return(<div style={{background:C.pl,borderRadius:14,padding:"12px 15px",marginBottom:14}}><p style={{fontSize:14,color:C.primary,fontWeight:800}}>BMI: {bmi} — <span style={{color:cat[1]}}>{cat[0]}</span></p>{bF.target&&<p style={{fontSize:13,color:C.sub,marginTop:5}}>Goal: {Math.abs(bF.weight-bF.target).toFixed(1)} kg {bF.weight>bF.target?"to lose 📉":"to gain 📈"}</p>}</div>);
          })()}
          <Btn onClick={saveBody} style={{width:"100%"}}>Save Stats +5XP</Btn>
        </Card>
      )}
    </div>
  );
}

// ── LEARN TAB ──
function LearnTab({userData,saveUser,showNotif,onBadge}){
  const[sub,setSub]=useState("coding");
  const[track,setTrack]=useState(null);
  const[activeLevel,setActiveLevel]=useState(null);
  const[lessonIdx,setLessonIdx]=useState(0);
  const[mathQ,setMathQ]=useState(()=>genMath(userData.mathLevel||1));
  const[mathAns,setMathAns]=useState("");
  const[mathFeedback,setMathFeedback]=useState(null);
  const[flashIdx,setFlashIdx]=useState(0);
  const[flashFlipped,setFlashFlipped]=useState(false);
  const[vF,setVF]=useState({word:"",def:"",ar:""});
  const[adding,setAdding]=useState(false);
  const[logId,setLogId]=useState(null);
  const[sForm,setSForm]=useState({subject:"",examDate:"",emoji:"📖"});
  const[logF,setLogF]=useState({duration:"",topic:""});
  const progress=userData.codingProgress||{};
  const vocab=userData.vocabulary||[];

  const completeLesson=(levelId,totalLessons)=>{
    const cur=progress[levelId]||{done:0,completed:false};
    if(cur.completed) return;
    const newDone=Math.min(cur.done+1,totalLessons);
    const completed=newDone>=totalLessons;
    const xpGain=completed?30:10;
    const updated={...userData,codingProgress:{...progress,[levelId]:{done:newDone,completed}},xp:(userData.xp||0)+xpGain};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif(`+${xpGain} XP — ${completed?"Level complete! 🎉":"Lesson done! ⚡"}`,"xp");
    if(!completed) setLessonIdx(i=>Math.min(i+1,totalLessons-1));
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const checkMath=()=>{
    if(mathAns.trim()===mathQ.ans){
      setMathFeedback("correct");
      const newScore=(userData.mathScore||0)+1;
      const newLevel=newScore%5===0?Math.min((userData.mathLevel||1)+1,3):(userData.mathLevel||1);
      const updated={...userData,mathScore:newScore,mathLevel:newLevel,xp:(userData.xp||0)+5};
      const nb=checkBadges(updated);
      saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
      showNotif("+5 XP — Correct! ⚡","xp");
      setTimeout(()=>{setMathQ(genMath(newLevel));setMathAns("");setMathFeedback(null);},1000);
      if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
    } else {
      setMathFeedback("wrong");
      setTimeout(()=>setMathFeedback(null),1000);
    }
  };

  const addWord=()=>{
    if(!vF.word.trim()) return;
    const updated={...userData,vocabulary:[...(userData.vocabulary||[]),{id:Date.now().toString(),...vF,at:Date.now()}],xp:(userData.xp||0)+3};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+3 XP — Word learned! ⚡","xp");
    setVF({word:"",def:"",ar:""});
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const addStudy=()=>{
    if(!sForm.subject.trim()) return;
    saveUser({...userData,study:[...(userData.study||[]),{id:Date.now().toString(),...sForm,sessions:[]}]});
    setSForm({subject:"",examDate:"",emoji:"📖"}); setAdding(false);
    showNotif("Subject added!","success");
  };

  const logSession=subId=>{
    if(!logF.duration) return;
    const newStudy=(userData.study||[]).map(s=>s.id!==subId?s:{...s,sessions:[...(s.sessions||[]),{date:F_today(),duration:Number(logF.duration),topic:logF.topic}]});
    const updated={...userData,study:newStudy,xp:(userData.xp||0)+15};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+15 XP — Study logged! ⚡","xp");
    setLogF({duration:"",topic:""}); setLogId(null);
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const delStudy=id=>saveUser({...userData,study:(userData.study||[]).filter(s=>s.id!==id)});
  const daysUntil=d=>{if(!d)return null;return Math.ceil((new Date(d)-new Date())/86400000);};
  const studyHrs=ss=>((ss||[]).reduce((sum,s)=>sum+(s.duration||0),0)/60).toFixed(1);

  const SUBS=[{id:"coding",i:"💻",l:"Coding"},{id:"study",i:"📖",l:"Study"},{id:"math",i:"🔢",l:"Math"},{id:"flash",i:"🃏",l:"Flashcards"},{id:"vocab",i:"🔤",l:"Vocab"}];

  // Coding sub-screens
  if(sub==="coding"&&activeLevel){
    const lessons=activeLevel.lessons, lesson=lessons[lessonIdx];
    const prog=progress[activeLevel.id]||{done:0,completed:false};
    return(
      <div style={{padding:"24px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <span onClick={()=>{setActiveLevel(null);setLessonIdx(0);}} style={{fontSize:22,cursor:"pointer",background:C.pl,borderRadius:12,padding:"6px 10px"}}>←</span>
          <div><p style={{fontSize:12,color:C.sub,fontWeight:700}}>{track?.name} · {activeLevel.title}</p><p style={{fontSize:11,color:"#059669",direction:"rtl",marginTop:2}}>{activeLevel.ar}</p></div>
        </div>
        <div style={{display:"flex",gap:6,marginBottom:16}}>
          {lessons.map((_,i)=><div key={i} onClick={()=>setLessonIdx(i)} style={{flex:1,height:6,borderRadius:99,cursor:"pointer",background:i<prog.done?C.ok:i===lessonIdx?C.primary:C.border,transition:"background 0.3s"}}/>)}
        </div>
        <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2A2840)",marginBottom:12}}>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:12,fontWeight:700,marginBottom:8}}>📚 Lesson {lessonIdx+1}/{lessons.length}</p>
          <h2 style={{color:"#fff",fontSize:18,fontWeight:900}}>{lesson.title}</h2>
        </Card>
        <Card style={{background:"#0D1117",border:"1px solid #30363D",marginBottom:12}}>
          <p style={{color:"#8B949E",fontSize:11,fontWeight:700,marginBottom:10,letterSpacing:1}}>{"</>"} CODE</p>
          <pre style={{color:"#E6EDF3",fontSize:13,lineHeight:1.7,fontFamily:"monospace",whiteSpace:"pre-wrap",margin:0}}>{lesson.code}</pre>
        </Card>
        <Card style={{border:`1.5px solid ${C.pl}`,marginBottom:12}}>
          <p style={{fontSize:11,fontWeight:800,color:C.primary,marginBottom:8}}>💡 EXPLANATION</p>
          <p style={{fontSize:14,color:C.text,lineHeight:1.7,marginBottom:10}}>{lesson.explanation}</p>
          <div style={{background:"#F0FFF6",borderRadius:12,padding:"10px 13px",border:"1px solid #A7F3D0"}}>
            <p style={{fontSize:11,fontWeight:800,color:"#059669",marginBottom:4}}>🇸🇦 بالعربي</p>
            <p style={{fontSize:13,color:"#065F46",lineHeight:1.7,direction:"rtl",textAlign:"right"}}>{lesson.ar}</p>
          </div>
        </Card>
        <div style={{display:"flex",gap:10}}>
          {lessonIdx>0&&<Btn v="ghost" style={{flex:1}} onClick={()=>setLessonIdx(i=>i-1)}>← Prev</Btn>}
          <Btn style={{flex:2,background:`linear-gradient(135deg,${C.ok},#7FE49B)`}} onClick={()=>completeLesson(activeLevel.id,lessons.length)}>
            {prog.done>lessonIdx?"✅ Already Done":lessonIdx===lessons.length-1?"Complete +30XP":"Next +10XP"}
          </Btn>
        </div>
      </div>
    );
  }

  if(sub==="coding"&&track){
    return(
      <div style={{padding:"24px 16px 0"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <span onClick={()=>setTrack(null)} style={{fontSize:22,cursor:"pointer",background:C.pl,borderRadius:12,padding:"6px 10px"}}>←</span>
          <h1 style={{fontSize:22,fontWeight:900,color:C.text}}>{track.icon} {track.name}</h1>
        </div>
        {track.levels.map((level,i)=>{
          const prog=progress[level.id]||{done:0,completed:false};
          const pct=level.lessons.length?Math.round((prog.done/level.lessons.length)*100):0;
          return(
            <Card key={level.id} onClick={()=>{setActiveLevel(level);setLessonIdx(prog.done<level.lessons.length?prog.done:0);}} style={{border:`2px solid ${prog.completed?C.ok+"50":prog.done>0?C.primary+"30":"transparent"}`,cursor:"pointer"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:14,background:prog.completed?"#E8F9EC":prog.done>0?C.pl:C.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{prog.completed?"✅":i+1}</div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:800,fontSize:14,color:C.text}}>{level.title}</p>
                  <p style={{fontSize:12,color:C.sub,marginTop:2}}>{level.desc}</p>
                  <p style={{fontSize:11,color:"#059669",marginTop:2,direction:"rtl",textAlign:"right"}}>{level.ar}</p>
                </div>
                <div style={{textAlign:"right"}}><p style={{fontWeight:900,fontSize:14,color:prog.completed?C.ok:C.primary}}>{pct}%</p><p style={{fontSize:11,color:C.sub}}>+{level.xp}XP</p></div>
              </div>
              {prog.done>0&&!prog.completed&&<div style={{background:C.border,borderRadius:99,height:5,marginTop:10}}><div style={{width:`${pct}%`,background:C.primary,height:"100%",borderRadius:99}}/></div>}
            </Card>
          );
        })}
      </div>
    );
  }

  return(
    <div style={{padding:"24px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px",marginBottom:16}}>Learn 🧠</h1>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>{SUBS.map(s=><Pill key={s.id} label={`${s.i} ${s.l}`} active={sub===s.id} onClick={()=>setSub(s.id)}/>)}</div>

      {sub==="coding"&&(
        <>
          <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2A2840)",marginBottom:16}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div><p style={{color:"rgba(255,255,255,0.5)",fontSize:11,fontWeight:800,textTransform:"uppercase",letterSpacing:1.5}}>Coding Progress</p><p style={{color:"#fff",fontSize:26,fontWeight:900,marginTop:4}}>{Object.values(progress).filter(p=>p.completed).length} <span style={{fontSize:14,color:"rgba(255,255,255,0.5)"}}>levels done</span></p></div>
              <span style={{fontSize:44}}>🎓</span>
            </div>
          </Card>
          <SL text="Choose a Language"/>
          {CODING_TRACKS.map(tr=>{
            const done=tr.levels.filter(l=>(progress[l.id]||{}).completed).length;
            const pct=Math.round((done/tr.levels.length)*100);
            return(
              <Card key={tr.id} onClick={()=>setTrack(tr)} style={{cursor:"pointer",border:`2px solid ${done>0?tr.color+"40":"transparent"}`}}>
                <div style={{display:"flex",alignItems:"center",gap:14}}>
                  <div style={{width:56,height:56,borderRadius:18,background:tr.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{tr.icon}</div>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:900,fontSize:17,color:C.text}}>{tr.name}</p>
                    <p style={{fontSize:12,color:C.sub,marginTop:2}}>{tr.levels.length} levels · {tr.levels.reduce((s,l)=>s+l.lessons.length,0)} lessons</p>
                    <div style={{background:C.border,borderRadius:99,height:5,marginTop:8}}><div style={{width:`${pct}%`,background:tr.color,height:"100%",borderRadius:99}}/></div>
                  </div>
                  <div style={{textAlign:"right"}}><p style={{fontWeight:900,fontSize:18,color:tr.color}}>{pct}%</p><p style={{fontSize:11,color:C.sub,marginTop:2}}>{done}/{tr.levels.length}</p></div>
                </div>
              </Card>
            );
          })}
        </>
      )}

      {sub==="study"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontWeight:800,fontSize:16,color:C.text}}>Study Planner 📖</p>
            <Btn sm v={adding?"sec":"pri"} onClick={()=>setAdding(!adding)}>{adding?"Cancel":"+ Add"}</Btn>
          </div>
          {adding&&(
            <Card style={{border:`2px solid ${C.pl}`,marginBottom:14}}>
              <Inp p="Subject (e.g. Physics)" v={sForm.subject} o={e=>setSForm(f=>({...f,subject:e.target.value}))} s={{marginBottom:10}}/>
              <p style={{fontSize:12,color:C.sub,fontWeight:700,marginBottom:5}}>Exam Date (optional)</p>
              <Inp t="date" v={sForm.examDate} o={e=>setSForm(f=>({...f,examDate:e.target.value}))} s={{marginBottom:10}}/>
              <SL text="Icon"/>
              <div style={{display:"flex",gap:7,flexWrap:"wrap",marginBottom:14}}>{SUB_EMOJIS.map(ic=><span key={ic} onClick={()=>setSForm(f=>({...f,emoji:ic}))} style={{fontSize:22,cursor:"pointer",padding:"5px 7px",borderRadius:10,background:sForm.emoji===ic?C.pl:"transparent",border:`2px solid ${sForm.emoji===ic?C.primary:"transparent"}`}}>{ic}</span>)}</div>
              <Btn onClick={addStudy} style={{width:"100%"}}>Add Subject</Btn>
            </Card>
          )}
          {!(userData.study?.length)&&<div style={{textAlign:"center",padding:"40px 0",color:C.sub}}><div style={{fontSize:48}}>📖</div><p style={{fontWeight:800,color:C.text,marginTop:12}}>No subjects yet</p></div>}
          {(userData.study||[]).map(s=>{
            const days=daysUntil(s.examDate), hrs=studyHrs(s.sessions), cnt=(s.sessions||[]).length, isLog=logId===s.id;
            let urgCol=C.teal; if(days!==null) urgCol=days<=7?C.err:days<=14?C.gold:C.ok;
            return(
              <Card key={s.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <div style={{width:46,height:46,borderRadius:14,background:C.pl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{s.emoji}</div>
                  <div style={{flex:1}}><p style={{fontWeight:800,fontSize:15,color:C.text}}>{s.subject}</p>{days!==null&&<span style={{fontSize:12,fontWeight:700,padding:"2px 9px",borderRadius:20,background:urgCol+"18",color:urgCol,marginTop:3,display:"inline-block"}}>{days>0?`⏳ ${days}d to exam`:days===0?"📅 Today!":"✅ Passed"}</span>}</div>
                  <div style={{textAlign:"right",marginRight:4}}><p style={{fontWeight:900,fontSize:20,color:C.primary}}>{hrs}h</p><p style={{fontSize:11,color:C.sub}}>{cnt} sessions</p></div>
                  <span onClick={()=>delStudy(s.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:20}}>×</span>
                </div>
                {isLog?(
                  <div style={{borderTop:`1px solid ${C.border}`,paddingTop:12}}>
                    <Inp p="Duration (min)" t="number" v={logF.duration} o={e=>setLogF(f=>({...f,duration:e.target.value}))} s={{marginBottom:8}}/>
                    <Inp p="Topic covered" v={logF.topic} o={e=>setLogF(f=>({...f,topic:e.target.value}))} s={{marginBottom:10}}/>
                    <div style={{display:"flex",gap:8}}><Btn style={{flex:1}} onClick={()=>logSession(s.id)}>Save +15XP</Btn><Btn sm v="ghost" onClick={()=>setLogId(null)}>Cancel</Btn></div>
                  </div>
                ):<Btn v="sec" style={{width:"100%",fontSize:13}} onClick={()=>setLogId(s.id)}>📝 Log Session</Btn>}
              </Card>
            );
          })}
        </>
      )}

      {sub==="math"&&(
        <Card style={{textAlign:"center"}}>
          <p style={{fontWeight:800,fontSize:17,color:C.text,marginBottom:4}}>🔢 Math Practice</p>
          <p style={{color:C.sub,fontSize:13,marginBottom:4}}>Level {userData.mathLevel||1} · Score: {userData.mathScore||0}</p>
          <p style={{fontSize:11,color:C.primary,fontWeight:700,marginBottom:20}}>Every 5 correct → level up!</p>
          <div style={{background:mathFeedback==="correct"?"#E8F9EC":mathFeedback==="wrong"?"#FFF0EF":C.bg,borderRadius:20,padding:"30px 20px",marginBottom:20,transition:"background 0.3s"}}>
            <p style={{fontSize:36,fontWeight:900,color:mathFeedback==="correct"?C.ok:mathFeedback==="wrong"?C.err:C.text,letterSpacing:"-1px"}}>{mathQ.q}</p>
          </div>
          <Inp t="number" p="Your answer" v={mathAns} o={e=>setMathAns(e.target.value)} s={{textAlign:"center",fontSize:22,fontWeight:700,marginBottom:14}}/>
          <Btn onClick={checkMath} style={{width:"100%",fontSize:16}}>
            {mathFeedback==="correct"?"✅ Correct!":mathFeedback==="wrong"?"❌ Wrong!":"Check Answer +5XP"}
          </Btn>
        </Card>
      )}

      {sub==="flash"&&(
        <>
          <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:14}}>🃏 Vocabulary Flashcards</p>
          {vocab.length===0?(
            <div style={{textAlign:"center",padding:"40px 0",color:C.sub}}><div style={{fontSize:48}}>🃏</div><p style={{fontWeight:800,color:C.text,marginTop:12}}>No words yet</p><p style={{fontSize:13,marginTop:6}}>Add words in the Vocab tab first!</p></div>
          ):(
            <>
              <Card style={{background:"linear-gradient(135deg,#FFF4E0,#FFFBF2)",border:"1.5px solid #FFD680",textAlign:"center",minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:14}} onClick={()=>setFlashFlipped(!flashFlipped)}>
                <div>
                  <p style={{fontSize:11,fontWeight:800,color:C.gold,marginBottom:10}}>{flashFlipped?"ARABIC / DEFINITION":"WORD"}</p>
                  <p style={{fontSize:28,fontWeight:900,color:C.text,marginBottom:8}}>{flashFlipped?(vocab[flashIdx].ar||vocab[flashIdx].def):vocab[flashIdx].word}</p>
                  {!flashFlipped&&<p style={{fontSize:12,color:C.sub}}>Tap to reveal</p>}
                </div>
              </Card>
              <p style={{textAlign:"center",color:C.sub,fontSize:13,marginBottom:14}}>{flashIdx+1} of {vocab.length}</p>
              <div style={{display:"flex",gap:10}}>
                <Btn v="ghost" style={{flex:1}} onClick={()=>{setFlashIdx(i=>(i-1+vocab.length)%vocab.length);setFlashFlipped(false);}}>← Prev</Btn>
                <Btn style={{flex:1}} onClick={()=>{setFlashIdx(i=>(i+1)%vocab.length);setFlashFlipped(false);}}>Next →</Btn>
              </div>
            </>
          )}
        </>
      )}

      {sub==="vocab"&&(
        <>
          <Card>
            <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:14}}>🔤 Add New Word</p>
            <Inp p="Word in English" v={vF.word} o={e=>setVF(f=>({...f,word:e.target.value}))} s={{marginBottom:8}}/>
            <Inp p="English definition" v={vF.def} o={e=>setVF(f=>({...f,def:e.target.value}))} s={{marginBottom:8}}/>
            <Inp p="المعنى بالعربي" v={vF.ar} o={e=>setVF(f=>({...f,ar:e.target.value}))} s={{marginBottom:12,direction:"rtl",textAlign:"right"}}/>
            <Btn onClick={addWord} style={{width:"100%"}}>Add Word +3XP</Btn>
          </Card>
          <p style={{fontWeight:800,fontSize:15,color:C.text,margin:"4px 0 10px"}}>My Vocabulary ({vocab.length})</p>
          {!vocab.length&&<p style={{textAlign:"center",color:C.sub,fontSize:13,padding:"20px 0"}}>Start adding words!</p>}
          {[...vocab].reverse().map(e=>(
            <Card key={e.id} style={{marginBottom:9,background:"linear-gradient(135deg,#FFF4E0,#FFFBF2)",border:"1.5px solid #FFD680"}}>
              <p style={{fontWeight:900,fontSize:16,color:C.text}}>{e.word}</p>
              <p style={{fontSize:13,color:"#78350F",marginTop:4}}>{e.def}</p>
              {e.ar&&<p style={{fontSize:13,color:"#059669",marginTop:5,direction:"rtl",textAlign:"right"}}>🇸🇦 {e.ar}</p>}
            </Card>
          ))}
        </>
      )}
    </div>
  );
}

// ── LIBRARY TAB ──
function LibraryTab({userData,saveUser,showNotif,onBadge}){
  const[adding,setAdding]=useState(false);
  const[filter,setFilter]=useState("All");
  const[form,setForm]=useState({title:"",type:"Book",total:""});
  const add=()=>{
    if(!form.title.trim()) return;
    const updated={...userData,library:[...(userData.library||[]),{id:Date.now().toString(),...form,progress:0,total:Number(form.total)||0,status:"Reading"}],xp:(userData.xp||0)+5};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+5 XP ⚡","xp"); setForm({title:"",type:"Book",total:""}); setAdding(false);
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };
  const updateProg=(id,delta)=>{
    const newLib=(userData.library||[]).map(i=>{if(i.id!==id)return i;const p=Math.max(0,Math.min(i.total||9999,i.progress+delta));return{...i,progress:p,status:i.total&&p>=i.total?"Completed":p===0?"Reading":i.status};});
    const updated={...userData,library:newLib,xp:(userData.xp||0)+(delta>0?2:0)};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    if(delta>0) showNotif("+2 XP ⚡","xp");
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };
  const del=id=>saveUser({...userData,library:(userData.library||[]).filter(i=>i.id!==id)});
  const filtered=filter==="All"?(userData.library||[]):(userData.library||[]).filter(i=>i.type===filter);
  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px"}}>Library 📚</h1>
        <Btn sm v={adding?"sec":"pri"} onClick={()=>setAdding(!adding)}>{adding?"Cancel":"+ Add"}</Btn>
      </div>
      <div style={{display:"flex",gap:8,marginBottom:14,overflowX:"auto",paddingBottom:4}}>{["All",...LIB_TYPES].map(f=><Pill key={f} label={f} active={filter===f} onClick={()=>setFilter(f)}/>)}</div>
      {adding&&(
        <Card style={{border:`2px solid ${C.pl}`,marginBottom:14}}>
          <Inp p="Title" v={form.title} o={e=>setForm(f=>({...f,title:e.target.value}))} s={{marginBottom:10}}/>
          <div style={{display:"flex",gap:8,marginBottom:10}}>{LIB_TYPES.map(tp=><span key={tp} onClick={()=>setForm(f=>({...f,type:tp}))} style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",background:form.type===tp?C.primary:C.pl,color:form.type===tp?"#fff":C.primary}}>{TICON[tp]} {tp}</span>)}</div>
          <Inp p="Total chapters/episodes (optional)" t="number" v={form.total} o={e=>setForm(f=>({...f,total:e.target.value}))} s={{marginBottom:12}}/>
          <Btn onClick={add} style={{width:"100%"}}>Add +5XP</Btn>
        </Card>
      )}
      {!filtered.length&&<div style={{textAlign:"center",padding:"48px 0",color:C.sub}}><div style={{fontSize:52}}>📚</div><p style={{fontWeight:800,fontSize:15,color:C.text,marginTop:12}}>Library empty</p></div>}
      {filtered.map(item=>{
        const pct=item.total?Math.min(100,(item.progress/item.total)*100):0;
        const sCo=item.status==="Completed"?C.ok:item.status==="On Hold"?C.gold:C.primary;
        return(
          <Card key={item.id}>
            <div style={{display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{width:46,height:46,borderRadius:14,background:C.pl,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{TICON[item.type]}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",justifyContent:"space-between"}}><p style={{fontWeight:800,fontSize:14,color:C.text,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:180}}>{item.title}</p><span onClick={()=>del(item.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:18,marginLeft:8}}>×</span></div>
                <div style={{display:"flex",gap:6,margin:"4px 0 10px"}}><Tag label={item.type}/><Tag label={item.status} col={sCo}/></div>
                {item.total>0&&(<><div style={{background:C.border,borderRadius:99,height:5,marginBottom:7}}><div style={{width:`${pct}%`,background:C.primary,height:"100%",borderRadius:99}}/></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:12,color:C.sub,fontWeight:600}}>{item.progress}/{item.total}</span><div style={{display:"flex",gap:6}}><Btn sm v="ghost" onClick={()=>updateProg(item.id,-1)}>−1</Btn><Btn sm v="sec" onClick={()=>updateProg(item.id,+1)}>+1</Btn></div></div></>)}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── MORE TAB (Goals, Money, Meals, Notes, Badges) ──
function MoreTab({userData,saveUser,showNotif,onBadge}){
  const[sec,setSec]=useState("goals");
  const[gForm,setGForm]=useState({title:"",emoji:"🎯",steps:[""]});
  const[tForm,setTForm]=useState({amount:"",cat:EXPENSE_CATS[0],note:"",type:"expense"});
  const[nForm,setNForm]=useState({title:"",content:""});
  const[addingG,setAddingG]=useState(false);
  const[addingT,setAddingT]=useState(false);
  const[addingN,setAddingN]=useState(false);
  const t=F_today();

  const addGoal=()=>{
    if(!gForm.title.trim()) return;
    const g={id:Date.now().toString(),title:gForm.title,emoji:gForm.emoji,steps:gForm.steps.filter(s=>s.trim()).map((s,i)=>({id:i.toString(),text:s,done:false})),createdAt:Date.now()};
    saveUser({...userData,goals:[...(userData.goals||[]),g]});
    setGForm({title:"",emoji:"🎯",steps:[""]}); setAddingG(false);
    showNotif("Goal added!","success");
  };

  const toggleStep=(gId,sId)=>{
    const newGoals=(userData.goals||[]).map(g=>{if(g.id!==gId)return g;return{...g,steps:g.steps.map(s=>s.id===sId?{...s,done:!s.done}:s)};});
    const updated={...userData,goals:newGoals,xp:(userData.xp||0)+5};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("+5 XP — Step done! ⚡","xp");
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const delGoal=id=>saveUser({...userData,goals:(userData.goals||[]).filter(g=>g.id!==id)});

  const addTransaction=()=>{
    if(!tForm.amount) return;
    const tx={id:Date.now().toString(),date:t,...tForm,amount:Number(tForm.amount)};
    const updated={...userData,transactions:[...(userData.transactions||[]),tx]};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif(`${tForm.type==="income"?"💰 Income":"💸 Expense"} logged!`,"success");
    setTForm({amount:"",cat:EXPENSE_CATS[0],note:"",type:"expense"}); setAddingT(false);
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const delTransaction=id=>saveUser({...userData,transactions:(userData.transactions||[]).filter(t=>t.id!==id)});

  const addNote=()=>{
    if(!nForm.title.trim()) return;
    const updated={...userData,notes:[...(userData.notes||[]),{id:Date.now().toString(),...nForm,createdAt:Date.now()}]};
    const nb=checkBadges(updated);
    saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});
    showNotif("Note saved! 📝","success");
    setNForm({title:"",content:""}); setAddingN(false);
    if(nb.length>0) setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);
  };

  const delNote=id=>saveUser({...userData,notes:(userData.notes||[]).filter(n=>n.id!==id)});

  const txs=(userData.transactions||[]);
  const totalIncome=txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const totalExpense=txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const balance=totalIncome-totalExpense;

  const SECS=[{id:"goals",i:"🎯",l:"Goals"},{id:"money",i:"💰",l:"Money"},{id:"meals",i:"🍽️",l:"Meals"},{id:"notes",i:"📝",l:"Notes"},{id:"badges",i:"🏅",l:"Badges"}];

  return(
    <div style={{padding:"24px 16px 0"}}>
      <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px",marginBottom:16}}>More ✨</h1>
      <div style={{display:"flex",gap:8,overflowX:"auto",marginBottom:16,paddingBottom:4}}>{SECS.map(s=><Pill key={s.id} label={`${s.i} ${s.l}`} active={sec===s.id} onClick={()=>setSec(s.id)}/>)}</div>

      {sec==="goals"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontWeight:800,fontSize:16,color:C.text}}>My Goals 🎯</p>
            <Btn sm v={addingG?"sec":"pri"} onClick={()=>setAddingG(!addingG)}>{addingG?"Cancel":"+ New"}</Btn>
          </div>
          {addingG&&(
            <Card style={{border:`2px solid ${C.pl}`,marginBottom:14}}>
              <Inp p="Goal title" v={gForm.title} o={e=>setGForm(f=>({...f,title:e.target.value}))} s={{marginBottom:10}}/>
              <SL text="Emoji"/>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {["🎯","🏆","💪","📚","💻","🚀","❤️","💰","🎸","🏋️","🌟","✈️"].map(ic=><span key={ic} onClick={()=>setGForm(f=>({...f,emoji:ic}))} style={{fontSize:22,cursor:"pointer",padding:"4px 6px",borderRadius:10,background:gForm.emoji===ic?C.pl:"transparent",border:`2px solid ${gForm.emoji===ic?C.primary:"transparent"}`}}>{ic}</span>)}
              </div>
              <SL text="Steps"/>
              {gForm.steps.map((s,i)=>(
                <div key={i} style={{display:"flex",gap:8,marginBottom:8}}>
                  <Inp p={`Step ${i+1}`} v={s} o={e=>{const ns=[...gForm.steps];ns[i]=e.target.value;setGForm(f=>({...f,steps:ns}));}} s={{flex:1}}/>
                  {i===gForm.steps.length-1&&<Btn sm v="sec" onClick={()=>setGForm(f=>({...f,steps:[...f.steps,""]}))}>+</Btn>}
                </div>
              ))}
              <Btn onClick={addGoal} style={{width:"100%",marginTop:8}}>Add Goal</Btn>
            </Card>
          )}
          {!(userData.goals?.length)&&<div style={{textAlign:"center",padding:"40px 0",color:C.sub}}><div style={{fontSize:52}}>🎯</div><p style={{fontWeight:800,color:C.text,marginTop:12}}>No goals yet</p></div>}
          {(userData.goals||[]).map(g=>{
            const done=(g.steps||[]).filter(s=>s.done).length;
            const total=(g.steps||[]).length;
            const pct=total?Math.round((done/total)*100):0;
            return(
              <Card key={g.id}>
                <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                  <span style={{fontSize:30}}>{g.emoji}</span>
                  <div style={{flex:1}}>
                    <p style={{fontWeight:800,fontSize:15,color:C.text}}>{g.title}</p>
                    <p style={{fontSize:12,color:C.sub,marginTop:2}}>{done}/{total} steps · {pct}%</p>
                  </div>
                  <span onClick={()=>delGoal(g.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:20}}>×</span>
                </div>
                <div style={{background:C.border,borderRadius:99,height:6,marginBottom:12}}><div style={{width:`${pct}%`,background:pct===100?C.ok:C.primary,height:"100%",borderRadius:99,transition:"width 0.4s"}}/></div>
                {(g.steps||[]).map(s=>(
                  <div key={s.id} onClick={()=>toggleStep(g.id,s.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`,cursor:"pointer"}}>
                    <div style={{width:22,height:22,borderRadius:99,border:`2px solid ${s.done?C.ok:C.border}`,background:s.done?C.ok:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s"}}>
                      {s.done&&<span style={{color:"#fff",fontSize:12}}>✓</span>}
                    </div>
                    <p style={{fontSize:14,color:s.done?C.sub:C.text,textDecoration:s.done?"line-through":"none"}}>{s.text}</p>
                  </div>
                ))}
              </Card>
            );
          })}
        </>
      )}

      {sec==="money"&&(
        <>
          <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2A2840)",marginBottom:14}}>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10}}>
              <div style={{textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Income</p><p style={{color:C.ok,fontSize:20,fontWeight:900}}>+{totalIncome.toFixed(0)}</p></div>
              <div style={{textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Balance</p><p style={{color:balance>=0?"#FFD700":C.err,fontSize:20,fontWeight:900}}>{balance.toFixed(0)}</p></div>
              <div style={{textAlign:"center"}}><p style={{color:"rgba(255,255,255,0.5)",fontSize:11}}>Expense</p><p style={{color:C.err,fontSize:20,fontWeight:900}}>-{totalExpense.toFixed(0)}</p></div>
            </div>
          </Card>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <p style={{fontWeight:800,fontSize:15,color:C.text}}>Transactions</p>
            <Btn sm v={addingT?"sec":"pri"} onClick={()=>setAddingT(!addingT)}>{addingT?"Cancel":"+ Add"}</Btn>
          </div>
          {addingT&&(
            <Card style={{border:`2px solid ${C.pl}`,marginBottom:14}}>
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {["expense","income"].map(tp=><span key={tp} onClick={()=>setTForm(f=>({...f,type:tp}))} style={{flex:1,textAlign:"center",padding:"9px 0",borderRadius:12,fontSize:13,fontWeight:700,cursor:"pointer",background:tForm.type===tp?C.primary:C.pl,color:tForm.type===tp?"#fff":C.primary,textTransform:"capitalize"}}>{tp==="income"?"💰 Income":"💸 Expense"}</span>)}
              </div>
              <Inp t="number" p="Amount (BHD)" v={tForm.amount} o={e=>setTForm(f=>({...f,amount:e.target.value}))} s={{marginBottom:10}}/>
              <SL text="Category"/>
              <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:12}}>
                {EXPENSE_CATS.map(cat=><span key={cat} onClick={()=>setTForm(f=>({...f,cat}))} style={{fontSize:12,fontWeight:700,padding:"5px 11px",borderRadius:20,cursor:"pointer",background:tForm.cat===cat?C.primary:C.pl,color:tForm.cat===cat?"#fff":C.primary}}>{cat}</span>)}
              </div>
              <Inp p="Note (optional)" v={tForm.note} o={e=>setTForm(f=>({...f,note:e.target.value}))} s={{marginBottom:12}}/>
              <Btn onClick={addTransaction} style={{width:"100%"}}>Save Transaction</Btn>
            </Card>
          )}
          {!txs.length&&<p style={{textAlign:"center",color:C.sub,fontSize:13,padding:"20px 0"}}>No transactions yet.</p>}
          {[...txs].reverse().slice(0,20).map(tx=>(
            <Card key={tx.id} style={{marginBottom:9}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div><p style={{fontWeight:700,fontSize:14}}>{tx.cat}</p><p style={{fontSize:12,color:C.sub,marginTop:2}}>{fmtDate(tx.date)}{tx.note?` · ${tx.note}`:""}</p></div>
                <div style={{display:"flex",alignItems:"center",gap:10}}>
                  <p style={{fontWeight:900,fontSize:16,color:tx.type==="income"?C.ok:C.err}}>{tx.type==="income"?"+":"-"}{tx.amount}</p>
                  <span onClick={()=>delTransaction(tx.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:18}}>×</span>
                </div>
              </div>
            </Card>
          ))}
        </>
      )}

      {sec==="meals"&&(
        <>
          <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:14}}>🍽️ Meal Planner</p>
          {[0,1,2,3,4,5,6].map(dayOff=>{
            const d=new Date(Date.now()+dayOff*86400000).toISOString().split("T")[0];
            const dayMeals=userData.meals?.[d]||{};
            const label=dayOff===0?"Today":dayOff===1?"Tomorrow":new Date(Date.now()+dayOff*86400000).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"});
            return(
              <Card key={d} style={{marginBottom:10}}>
                <p style={{fontWeight:800,fontSize:14,color:C.text,marginBottom:10}}>{label}</p>
                <div style={{display:"flex",flexDirection:"column",gap:8}}>
                  {MEAL_TIMES.map(mt=>(
                    <div key={mt} style={{display:"flex",alignItems:"center",gap:10}}>
                      <span style={{fontSize:14,color:C.sub,minWidth:70,fontWeight:600}}>{mt}</span>
                      <input value={dayMeals[mt]||""} onChange={e=>{const newMeals={...userData.meals,[d]:{...dayMeals,[mt]:e.target.value}};const updated={...userData,meals:newMeals};const nb=checkBadges(updated);saveUser({...updated,earnedBadges:[...(userData.earnedBadges||[]),...nb]});if(nb.length>0)setTimeout(()=>onBadge(BADGES.find(b=>b.id===nb[0])),600);}} placeholder="What will you eat?" style={{flex:1,padding:"7px 12px",borderRadius:10,border:`1.5px solid ${C.border}`,fontSize:13,outline:"none",color:C.text,background:"#FAFAFA"}}/>
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </>
      )}

      {sec==="notes"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
            <p style={{fontWeight:800,fontSize:16,color:C.text}}>My Notes 📝</p>
            <Btn sm v={addingN?"sec":"pri"} onClick={()=>setAddingN(!addingN)}>{addingN?"Cancel":"+ New"}</Btn>
          </div>
          {addingN&&(
            <Card style={{border:`2px solid ${C.pl}`,marginBottom:14}}>
              <Inp p="Title" v={nForm.title} o={e=>setNForm(f=>({...f,title:e.target.value}))} s={{marginBottom:10}}/>
              <Inp p="Write your note here..." v={nForm.content} o={e=>setNForm(f=>({...f,content:e.target.value}))} rows={5} s={{marginBottom:12}}/>
              <Btn onClick={addNote} style={{width:"100%"}}>Save Note</Btn>
            </Card>
          )}
          {!(userData.notes?.length)&&<div style={{textAlign:"center",padding:"40px 0",color:C.sub}}><div style={{fontSize:52}}>📝</div><p style={{fontWeight:800,color:C.text,marginTop:12}}>No notes yet</p></div>}
          {[...(userData.notes||[])].reverse().map(n=>(
            <Card key={n.id} style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:6}}>
                <p style={{fontWeight:800,fontSize:15,color:C.text,flex:1}}>{n.title}</p>
                <span onClick={()=>delNote(n.id)} style={{color:"#C7C7CC",cursor:"pointer",fontSize:18,marginLeft:8}}>×</span>
              </div>
              <p style={{fontSize:13,color:C.sub,marginBottom:6}}>{fmtDate(n.createdAt)}</p>
              <p style={{fontSize:14,color:C.text,lineHeight:1.6,whiteSpace:"pre-wrap"}}>{n.content}</p>
            </Card>
          ))}
        </>
      )}

      {sec==="badges"&&(
        <>
          <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:4}}>Badges 🏅</p>
          <p style={{color:C.sub,fontSize:13,marginBottom:16}}>{(userData.earnedBadges||[]).length}/{BADGES.length} earned</p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {BADGES.map(b=>{
              const earned=(userData.earnedBadges||[]).includes(b.id);
              return(
                <Card key={b.id} style={{textAlign:"center",marginBottom:0,opacity:earned?1:0.45,border:earned?`2px solid ${C.gold}30`:"2px solid transparent",background:earned?"linear-gradient(145deg,#FFF9EE,#FFFDF5)":C.card}}>
                  <div style={{fontSize:36,marginBottom:6,filter:earned?"none":"grayscale(1)"}}>{b.icon}</div>
                  <p style={{fontWeight:800,fontSize:13,color:C.text}}>{b.name}</p>
                  <p style={{fontSize:11,color:C.sub,marginTop:3}}>{b.desc}</p>
                  {earned&&<p style={{fontSize:10,color:C.gold,fontWeight:700,marginTop:6}}>✅ Earned!</p>}
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── ME TAB ──
function MeTab({userData,username,saveUser,showNotif,onLogout}){
  const{lv,pct}=lvlInfo(userData.xp||0);
  const rank=getRank(lv);
  const avgSleep=userData.sleepLog?.length?(userData.sleepLog.reduce((s,e)=>s+e.hours,0)/userData.sleepLog.length).toFixed(1):"—";
  const totalSess=(userData.study||[]).reduce((s,sub)=>s+(sub.sessions||[]).length,0);
  const doneTot=Object.values(userData.completions||{}).flat().length;
  const bestStreak=Math.max(0,...(userData.habits||[]).map(h=>h.streak||0));
  const codingDone=Object.values(userData.codingProgress||{}).filter(p=>p.completed).length;
  const[stF,setStF]=useState({hours:""});
  const t=F_today();
  const logScreen=()=>{
    if(!stF.hours) return;
    const log=[...(userData.screenTime||[]).filter(s=>s.date!==t),{date:t,hours:Number(stF.hours)}];
    saveUser({...userData,screenTime:log});
    showNotif("Screen time logged!","success");
    setStF({hours:""});
  };

  return(
    <div style={{padding:"24px 16px 0"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h1 style={{fontSize:24,fontWeight:900,color:C.text,letterSpacing:"-0.5px"}}>{username}</h1>
          <p style={{fontSize:13,color:C.sub,marginTop:2}}>Member since {new Date(userData.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</p>
        </div>
        <Btn sm v="ghost" onClick={onLogout}>Sign Out</Btn>
      </div>

      {/* XP Rank Card */}
      <Card style={{background:"linear-gradient(145deg,#1C1C2E,#2E2B8A)",marginBottom:14}}>
        <div style={{textAlign:"center"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:rank.c,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px",boxShadow:`0 6px 20px ${rank.c}55`}}>⚡</div>
          <h2 style={{color:"#fff",fontSize:22,fontWeight:900}}>{rank.name}</h2>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:13,margin:"5px 0 16px"}}>Level {lv} · {userData.xp||0} XP total</p>
          <div style={{background:"rgba(255,255,255,0.18)",borderRadius:99,height:8}}><div style={{width:`${pct}%`,background:"#fff",height:"100%",borderRadius:99}}/></div>
        </div>
      </Card>

      {/* Streak Card */}
      <Card style={{background:"linear-gradient(135deg,#1C1C2E,#2A2840)",marginBottom:14}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div>
            <p style={{color:"rgba(255,255,255,0.5)",fontSize:12,fontWeight:700}}>Routine Streak</p>
            <p style={{color:"#fff",fontSize:36,fontWeight:900,lineHeight:1.1,letterSpacing:"-1px"}}>{userData.routineStreak||0} <span style={{fontSize:16}}>days</span></p>
          </div>
          <div style={{fontSize:52,animation:"float 2.5s ease-in-out infinite"}}>
            {(userData.routineStreak||0)<3?"🌱":(userData.routineStreak||0)<7?"⚡":(userData.routineStreak||0)<21?"🔥":"👑"}
          </div>
        </div>
        <p style={{color:"rgba(255,255,255,0.4)",fontSize:12,marginTop:12}}>Milestones: {(userData.seenMilestones||[]).map(d=>`Day ${d}`).join(", ")||"None yet"}</p>
      </Card>

      {/* Stats Grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[{i:"✅",v:doneTot,l:"Completions"},{i:"🔥",v:bestStreak,l:"Best Streak"},{i:"📚",v:(userData.library||[]).filter(x=>x.status==="Completed").length,l:"Finished"},{i:"⏱️",v:totalSess,l:"Study Sessions"},{i:"💻",v:codingDone,l:"Coding Levels"},{i:"🔤",v:(userData.vocabulary||[]).length,l:"Words Learned"},{i:"🌙",v:`${avgSleep}h`,l:"Avg Sleep"},{i:"🏅",v:(userData.earnedBadges||[]).length,l:"Badges Earned"}].map(s=>(
          <Card key={s.l} style={{textAlign:"center",marginBottom:0}}>
            <span style={{fontSize:26}}>{s.i}</span>
            <p style={{fontSize:22,fontWeight:900,color:C.text,margin:"5px 0 2px"}}>{s.v}</p>
            <p style={{fontSize:12,color:C.sub}}>{s.l}</p>
          </Card>
        ))}
      </div>

      {/* Screen Time */}
      <Card>
        <p style={{fontWeight:800,fontSize:16,color:C.text,marginBottom:12}}>📱 Screen Time</p>
        <Inp t="number" p="Total hours today" v={stF.hours} o={e=>setStF(f=>({...f,hours:e.target.value}))} s={{marginBottom:10}}/>
        <div style={{background:C.pl,borderRadius:12,padding:"10px 14px",marginBottom:12}}>
          <p style={{fontSize:13,color:C.primary,fontWeight:600}}>{stF.hours<=2?"🟢 Excellent! Keep it minimal.":stF.hours<=4?"🟡 Moderate — try to reduce it.":stF.hours<=6?"🟠 High — take a break.":"🔴 Too much! Time to unplug."}</p>
        </div>
        <Btn onClick={logScreen} style={{width:"100%"}}>Log Screen Time</Btn>
      </Card>

      {(userData.screenTime||[]).slice(-5).reverse().map(e=>{
        const col=e.hours>6?C.err:e.hours>4?C.gold:C.ok;
        return(
          <Card key={e.date} style={{marginBottom:9}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <p style={{fontWeight:700,fontSize:14}}>{fmtDate(e.date)}</p>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{background:C.border,borderRadius:99,height:7,width:90}}><div style={{width:`${Math.min(100,(e.hours/8)*100)}%`,background:col,height:"100%",borderRadius:99}}/></div>
                <p style={{fontSize:16,fontWeight:900,color:col,minWidth:38,textAlign:"right"}}>{e.hours}h</p>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ── AUTH SCREEN ──
function AuthScreen({mode,setMode,form,setForm,error,setError,onSubmit}){
  const isL=mode==="login";
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(160deg,#E8E8FF 0%,#F2F2F7 50%,#FFF4E0 100%)",display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 20px"}}>
      <div style={{width:"100%",maxWidth:390}}>
        <div style={{textAlign:"center",marginBottom:40}}>
          <div style={{fontSize:60,marginBottom:10,filter:"drop-shadow(0 4px 12px rgba(88,86,214,0.3))",animation:"float 3s ease-in-out infinite"}}>⚡</div>
          <h1 style={{fontSize:34,fontWeight:900,color:C.text,letterSpacing:"-1.5px"}}>LevelUp</h1>
          <p style={{color:C.sub,fontSize:15,marginTop:6}}>Build the best version of yourself</p>
        </div>
        <div style={{background:C.card,borderRadius:28,padding:"30px 26px",boxShadow:"0 20px 60px rgba(0,0,0,0.1)"}}>
          <h2 style={{fontSize:22,fontWeight:800,color:C.text,marginBottom:22}}>{isL?"Welcome back 👋":"Start your journey ✨"}</h2>
          <div style={{display:"flex",flexDirection:"column",gap:11}}>
            <Inp p="Username" v={form.username} o={e=>{setForm(f=>({...f,username:e.target.value}));setError("");}}/>
            <Inp p="Password" t="password" v={form.password} o={e=>{setForm(f=>({...f,password:e.target.value}));setError("");}}/>
            {!isL&&<Inp p="Confirm password" t="password" v={form.confirm} o={e=>{setForm(f=>({...f,confirm:e.target.value}));setError("");}}/>}
          </div>
          {error&&<p style={{color:C.err,fontSize:13,marginTop:11,fontWeight:600}}>⚠️ {error}</p>}
          <Btn onClick={onSubmit} style={{width:"100%",marginTop:18,padding:"14px",fontSize:15}}>{isL?"Sign In":"🚀 Create Account"}</Btn>
          <p style={{textAlign:"center",marginTop:18,fontSize:13,color:C.sub}}>
            {isL?"New here? ":"Already have an account? "}
            <span onClick={()=>{setMode(isL?"signup":"login");setError("");}} style={{color:C.primary,fontWeight:800,cursor:"pointer"}}>{isL?"Sign Up":"Sign In"}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP SHELL ──
function MainApp({userData,username,saveUser,showNotif,activeTab,setActiveTab,onLogout,notif,onMilestone,onBadge}){
  const TABS=[{id:"home",i:"🏠",l:"Home"},{id:"habits",i:"✅",l:"Habits"},{id:"health",i:"💚",l:"Health"},{id:"learn",i:"🧠",l:"Learn"},{id:"library",i:"📚",l:"Library"},{id:"more",i:"✨",l:"More"},{id:"me",i:"👤",l:"Me"}];
  return(
    <div style={{minHeight:"100vh",background:C.bg,maxWidth:480,margin:"0 auto",position:"relative"}}>
      {notif&&<div style={{position:"fixed",top:18,left:"50%",transform:"translateX(-50%)",background:notif.type==="xp"?C.gold:C.primary,color:"#fff",padding:"11px 24px",borderRadius:99,fontSize:13,fontWeight:800,boxShadow:"0 8px 28px rgba(0,0,0,0.18)",zIndex:9999,animation:"slideDown 0.3s cubic-bezier(.22,1,.36,1)",whiteSpace:"nowrap"}}>{notif.msg}</div>}
      <div style={{paddingBottom:90}}>
        {activeTab==="home"    &&<HomeTab    userData={userData} username={username} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>}
        {activeTab==="habits"  &&<HabitsTab  userData={userData} saveUser={saveUser} showNotif={showNotif} onMilestone={onMilestone} onBadge={onBadge}/>}
        {activeTab==="health"  &&<HealthTab  userData={userData} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>}
        {activeTab==="learn"   &&<LearnTab   userData={userData} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>}
        {activeTab==="library" &&<LibraryTab userData={userData} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>}
        {activeTab==="more"    &&<MoreTab    userData={userData} saveUser={saveUser} showNotif={showNotif} onBadge={onBadge}/>}
        {activeTab==="me"      &&<MeTab      userData={userData} username={username} saveUser={saveUser} showNotif={showNotif} onLogout={onLogout}/>}
      </div>
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:"rgba(249,249,251,0.95)",backdropFilter:"blur(20px)",borderTop:`1px solid ${C.border}`,display:"flex",zIndex:100}}>
        {TABS.map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{flex:1,padding:"8px 0 12px",border:"none",background:"transparent",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
            <span style={{fontSize:18,filter:activeTab===tab.id?"none":"grayscale(60%) opacity(0.5)",transform:activeTab===tab.id?"scale(1.1)":"scale(1)",transition:"all 0.2s",display:"block"}}>{tab.i}</span>
            <span style={{fontSize:9,fontWeight:activeTab===tab.id?800:500,color:activeTab===tab.id?C.primary:C.sub}}>{tab.l}</span>
            {activeTab===tab.id&&<div style={{width:4,height:4,borderRadius:"50%",background:C.primary,marginTop:-1}}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── ROOT APP ──
export default function App(){
  const[screen,setScreen]=useState("loading");
  const[authMode,setAuthMode]=useState("login");
  const[username,setUsername]=useState("");
  const[userData,setUserData]=useState(null);
  const[activeTab,setActiveTab]=useState("home");
  const[authForm,setAuthForm]=useState({username:"",password:"",confirm:""});
  const[authErr,setAuthErr]=useState("");
  const[notif,setNotif]=useState(null);
  const[milestone,setMilestone]=useState(null);
  const[badge,setBadge]=useState(null);
  const usersRef=useRef({});

  useEffect(()=>{
    const all=db.load(); usersRef.current=all;
    const sess=db.getSess();
    if(sess&&all[sess]){setUsername(sess);setUserData(all[sess]);setScreen("main");}
    else setScreen("auth");
  },[]);

  const showNotif=(msg,type="success")=>{setNotif({msg,type});setTimeout(()=>setNotif(null),2400);};
  const showBadge=b=>{if(!b)return;setBadge(b);setTimeout(()=>setBadge(null),4000);};

  const saveUser=data=>{
    const nu={...usersRef.current,[username]:data};
    usersRef.current=nu; setUserData(data); db.save(nu);
  };

  const handleAuth=()=>{
    const{username:u,password:p,confirm:c}=authForm;
    if(!u.trim()||!p.trim()) return setAuthErr("Please fill all fields.");
    if(authMode==="signup"){
      if(p!==c) return setAuthErr("Passwords don't match.");
      if(usersRef.current[u]) return setAuthErr("Username already taken.");
      const user=mkUser(u,p), nu={...usersRef.current,[u]:user};
      usersRef.current=nu; db.save(nu); db.setSess(u);
      setUsername(u); setUserData(user); setScreen("main");
    } else {
      const found=usersRef.current[u];
      if(!found||found.password!==p) return setAuthErr("Invalid username or password.");
      db.setSess(u); setUsername(u); setUserData(found); setScreen("main");
    }
  };

  const handleLogout=()=>{
    db.delSess(); setUsername(""); setUserData(null); setScreen("auth");
    setAuthForm({username:"",password:"",confirm:""}); setAuthMode("login");
  };

  if(screen==="loading") return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"linear-gradient(160deg,#E8E8FF,#F2F2F7)",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{fontSize:64,marginBottom:12,animation:"float 2s ease-in-out infinite",filter:"drop-shadow(0 6px 18px rgba(88,86,214,0.3))"}}>⚡</div>
      <h1 style={{fontSize:30,fontWeight:900,color:C.text,letterSpacing:"-1.5px"}}>LevelUp</h1>
      <p style={{color:C.sub,fontSize:14,marginTop:8}}>Loading your journey...</p>
    </div>
  );

  if(screen==="auth") return <AuthScreen mode={authMode} setMode={setAuthMode} form={authForm} setForm={setAuthForm} error={authErr} setError={setAuthErr} onSubmit={handleAuth}/>;

  return(
    <>
      <MilestoneModal milestone={milestone} onClose={()=>setMilestone(null)}/>
      <BadgePopup badge={badge} onClose={()=>setBadge(null)}/>
      <MainApp userData={userData} username={username} saveUser={saveUser} showNotif={showNotif} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} notif={notif} onMilestone={setMilestone} onBadge={showBadge}/>
    </>
  );
}
