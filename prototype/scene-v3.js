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
let armed=false,sceneStart=0,timerRAF=0,active='car';

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
const observer=new MutationObserver(()=>{
  if(stage.classList.contains('connected'))setTimeout(armEntry,1250);
});
observer.observe(stage,{attributes:true,attributeFilter:['class']});

function enterStory(){
  if(!armed||experience.dataset.phase!=='archive')return;
  fragment.classList.remove('enterable');prompt.style.opacity='0';diagnostic.classList.remove('show');
  fragment.style.transition='transform .9s cubic-bezier(.16,.8,.18,1),opacity .65s,filter .65s';
  fragment.style.transform='translate(-50%,-50%) scale(4.4)';fragment.style.opacity='0';
  stage.style.transition='filter .8s,opacity .8s,transform .8s';stage.style.filter='blur(9px)';stage.style.opacity='.06';stage.style.transform='scale(1.04)';
  setTimeout(()=>{
    archive.setAttribute('aria-hidden','true');storyShell.setAttribute('aria-hidden','false');experience.dataset.phase='story';
    setPanel('car');cancelAnimationFrame(timerRAF);timerRAF=requestAnimationFrame(updateTimer);
  },760);
}
fragment.addEventListener('click',e=>{if(armed&&!fragment.classList.contains('dragging')){e.preventDefault();enterStory()}});
fragment.addEventListener('keydown',e=>{if(armed&&(e.key==='Enter'||e.key===' ')){e.preventDefault();enterStory()}});

toRestaurant.addEventListener('click',()=>{
  setPanel('bridge');
  setTimeout(()=>setPanel('restaurant'),1650);
});
toSilence.addEventListener('click',()=>setPanel('silence'));

function runSilence(){
  const a=document.querySelector('#silenceA'),b=document.querySelector('#silenceB');
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
  storyShell.setAttribute('aria-hidden','true');archive.setAttribute('aria-hidden','false');experience.dataset.phase='archive';
  stage.style.transition='none';stage.style.filter='';stage.style.opacity='';stage.style.transform='';
  fragment.style.transition='none';fragment.style.transform='translate(-50%,-50%)';fragment.style.opacity='1';fragment.classList.add('enterable');
  prompt.textContent='фрагмент просмотрен';prompt.style.opacity='1';
  diagnosticMain.textContent='общие координаты · 0';diagnosticSub.textContent='связанные фрагменты · 1847';diagnostic.classList.add('show');
});
})();