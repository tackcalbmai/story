(()=>{
'use strict';
const experience=document.querySelector('#experience');
const archive=document.querySelector('#archive');
const stage=document.querySelector('#stage');
const fragment=document.querySelector('#fragment');
const prompt=document.querySelector('#prompt');
const diagnostic=document.querySelector('#diagnostic');
const diagnosticMain=document.querySelector('#diagnosticMain');
const diagnosticSub=document.querySelector('#diagnosticSub');
const storyShell=document.querySelector('#storyShell');
const storyLabel=document.querySelector('#storyLabel');
const storyTimer=document.querySelector('#storyTimer');
const panels={car:document.querySelector('#panelCar'),bridge:document.querySelector('#panelBridge'),restaurant:document.querySelector('#panelRestaurant'),silence:document.querySelector('#panelSilence'),ret:document.querySelector('#panelReturn')};
const toRestaurant=document.querySelector('#toRestaurant');
const toSilence=document.querySelector('#toSilence');
const finishSlice=document.querySelector('#finishSlice');
const tracesShell=document.querySelector('#tracesShell');
const traceCount=document.querySelector('#traceCount');
const traceButtons=[...document.querySelectorAll('.trace')];
const traceDetail=document.querySelector('#traceDetail');
const traceDetailInner=document.querySelector('#traceDetailInner');
const closeTrace=document.querySelector('#closeTrace');
const wordTest=document.querySelector('#wordTest');
const sharedWord=document.querySelector('#sharedWord');
const wordStage=document.querySelector('#wordStage');
const wordOwners=[...document.querySelectorAll('.word-owner')];
const wordResult=document.querySelector('#wordResult');
const chapterTease=document.querySelector('#chapterTease');
let armed=false,sceneStart=0,timerRAF=0,active='car';
let opened=new Set();
let wordDrag=null,wordAttempts=0;

function setPanel(name){
  Object.entries(panels).forEach(([k,p])=>{const on=k===name;p.classList.toggle('active',on);p.setAttribute('aria-hidden',on?'false':'true');if(!on)p.classList.remove('ready')});
  active=name;
  const labels={car:'01 · его сторона',bridge:'связь',restaurant:'02 · её сторона',silence:'тот же звонок',ret:'архив'};
  storyLabel.textContent=labels[name]||'';
  sceneStart=performance.now();
  clearDialogue();
  if(name==='car')runDialogue(panels.car,7600);
  if(name==='restaurant')runDialogue(panels.restaurant,7350);
  if(name==='silence')runSilence();
  if(name==='ret')runReturn();
}
function clearDialogue(){document.querySelectorAll('.dialogue p').forEach(p=>p.classList.remove('show'))}
function runDialogue(panel,readyAt){
  [...panel.querySelectorAll('.dialogue p')].forEach(p=>setTimeout(()=>{if(panel.classList.contains('active'))p.classList.add('show')},Number(p.dataset.at)||0));
  setTimeout(()=>{if(panel.classList.contains('active'))panel.classList.add('ready')},readyAt);
}
function updateTimer(now){
  if(experience.dataset.phase!=='story')return;
  const sec=Math.max(0,(now-sceneStart)/1000);storyTimer.textContent=`00:${String(Math.floor(sec)).padStart(2,'0')}`;timerRAF=requestAnimationFrame(updateTimer);
}
function armEntry(){
  if(armed)return;armed=true;
  fragment.classList.add('enterable');fragment.setAttribute('aria-label','Открыть связанный фрагмент');
  prompt.textContent='коснитесь фрагмента';prompt.style.opacity='1';
}
const observer=new MutationObserver(()=>{if(stage.classList.contains('connected'))setTimeout(armEntry,1250)});
observer.observe(stage,{attributes:true,attributeFilter:['class']});

function enterStory(){
  if(!armed||experience.dataset.phase!=='archive')return;
  fragment.classList.remove('enterable');prompt.style.opacity='0';diagnostic.classList.remove('show');
  fragment.style.transition='transform .9s cubic-bezier(.16,.8,.18,1),opacity .65s,filter .65s';
  fragment.style.transform='translate(-50%,-50%) scale(4.4)';fragment.style.opacity='0';
  stage.style.transition='filter .8s,opacity .8s,transform .8s';stage.style.filter='blur(9px)';stage.style.opacity='.06';stage.style.transform='scale(1.04)';
  setTimeout(()=>{archive.setAttribute('aria-hidden','true');storyShell.setAttribute('aria-hidden','false');experience.dataset.phase='story';setPanel('car');cancelAnimationFrame(timerRAF);timerRAF=requestAnimationFrame(updateTimer)},760);
}
fragment.addEventListener('click',e=>{if(armed&&!fragment.classList.contains('dragging')){e.preventDefault();enterStory()}});
fragment.addEventListener('keydown',e=>{if(armed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();enterStory()}});

toRestaurant.addEventListener('click',()=>{setPanel('bridge');setTimeout(()=>setPanel('restaurant'),1650)});
toSilence.addEventListener('click',()=>setPanel('silence'));
function runSilence(){
  const a=document.querySelector('#silenceA'),b=document.querySelector('#silenceB');a.classList.remove('show');b.classList.remove('show');
  setTimeout(()=>{if(active==='silence')a.classList.add('show')},1600);
  setTimeout(()=>{if(active==='silence')b.classList.add('show')},3300);
  setTimeout(()=>{if(active==='silence')setPanel('ret')},5600);
}
function runReturn(){
  const copies=[...document.querySelectorAll('.return-copy')];copies.forEach(c=>c.classList.remove('show'));
  setTimeout(()=>{if(active==='ret')copies[0].classList.add('show')},650);
  setTimeout(()=>{if(active==='ret')copies[1].classList.add('show')},1850);
  setTimeout(()=>{if(active==='ret')panels.ret.classList.add('ready')},3100);
}
finishSlice.addEventListener('click',()=>{
  cancelAnimationFrame(timerRAF);
  storyShell.setAttribute('aria-hidden','true');
  tracesShell.setAttribute('aria-hidden','false');
  experience.dataset.phase='traces';
  opened.clear();traceCount.textContent='0 / 3';
  traceButtons.forEach(b=>b.classList.remove('opened'));
});

const traceTemplates={
  morning:()=>`<div class="trace-scene"><span class="kicker">обычный день / утро</span><p class="main">Доброе утро, малыш ❤️</p><p class="sub">Один из тех фрагментов, которые повторяются так часто, что перестают казаться событием.</p></div>`,
  andso:()=>`<div class="trace-scene"><span class="kicker">поздно / пора спать</span><div class="trace-chat"><span>И так…</span><span>Неет</span><span>Я вообще-то ещё ничего не сказала</span><span>Знаю</span></div></div>`,
  call:()=>`<div class="trace-scene"><span class="kicker">вызов завершён</span><div class="trace-duration">02:47:16</div><div class="trace-call-line"></div><p class="sub">Большую часть этого фрагмента система не может выделить как «событие». Там почти ничего не происходит.</p></div>`,
  baby:()=>`<div class="trace-scene"><span class="kicker">обращение</span><div class="trace-pair"><div>профиль 01<b>малыш</b></div><div>профиль 02<b>малыш</b></div></div><p class="sub">Одинаковое слово появляется с обеих сторон связи.</p></div>`,
  lexicon:()=>`<div class="trace-scene"><span class="kicker">лексика / след</span><p class="main">Почавкала?</p><p class="sub">Фрагмент маленький. Источник слова — один профиль. Через время оно появляется в речи другого.</p></div>`
};
function openTrace(btn){
  const key=btn.dataset.trace;if(!traceTemplates[key])return;
  traceDetailInner.innerHTML=traceTemplates[key]();
  traceDetail.classList.add('show');traceDetail.setAttribute('aria-hidden','false');
  if(!opened.has(key)){
    opened.add(key);btn.classList.add('opened');traceCount.textContent=`${Math.min(opened.size,3)} / 3`;
  }
}
traceButtons.forEach(btn=>btn.addEventListener('click',()=>openTrace(btn)));
function closeTraceView(){
  traceDetail.classList.remove('show');traceDetail.setAttribute('aria-hidden','true');
  if(opened.size>=3)setTimeout(showWordTest,380);
}
closeTrace.addEventListener('click',closeTraceView);
traceDetail.addEventListener('click',e=>{if(e.target===traceDetail)closeTraceView()});

function showWordTest(){
  if(wordTest.classList.contains('show')||chapterTease.classList.contains('show'))return;
  wordAttempts=0;wordResult.textContent='';wordResult.classList.remove('show');resetWord(true);
  wordTest.classList.add('show');wordTest.setAttribute('aria-hidden','false');
}
function resetWord(instant=false){
  sharedWord.style.transition=instant?'none':'transform .5s cubic-bezier(.2,.85,.2,1)';
  sharedWord.style.transform='translate(-50%,-50%)';
  requestAnimationFrame(()=>{sharedWord.style.transition=''});
}
function ownerAt(x,y){
  let best=null,bestD=Infinity;
  wordOwners.forEach(o=>{const r=o.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,d=Math.hypot(x-cx,y-cy);if(d<bestD){bestD=d;best=o}});
  return bestD<120?best:null;
}
function wordDown(e){
  sharedWord.setPointerCapture?.(e.pointerId);wordDrag={id:e.pointerId,x:e.clientX,y:e.clientY};sharedWord.classList.add('dragging');sharedWord.style.transition='none';
}
function wordMove(e){
  if(!wordDrag||wordDrag.id!==e.pointerId)return;
  const dx=e.clientX-wordDrag.x,dy=e.clientY-wordDrag.y;sharedWord.style.transform=`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
}
function wordUp(e){
  if(!wordDrag||wordDrag.id!==e.pointerId)return;
  const target=ownerAt(e.clientX,e.clientY);wordDrag=null;sharedWord.classList.remove('dragging');
  if(!target){resetWord();return;}
  wordAttempts++;
  const who=target.dataset.owner;
  wordResult.textContent=wordAttempts===1?`Профиль ${who} использует это слово. Но второй тоже.`:'Единственный владелец не определяется.';
  wordResult.classList.add('show');
  resetWord();
  if(wordAttempts>=2){
    setTimeout(()=>{wordTest.classList.remove('show');wordTest.setAttribute('aria-hidden','true');chapterTease.classList.add('show');chapterTease.setAttribute('aria-hidden','false')},1500);
  }
}
sharedWord.addEventListener('pointerdown',wordDown);sharedWord.addEventListener('pointermove',wordMove);sharedWord.addEventListener('pointerup',wordUp);sharedWord.addEventListener('pointercancel',()=>{wordDrag=null;sharedWord.classList.remove('dragging');resetWord()});
})();
