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
const storyScene=document.querySelector('#storyScene');
const sceneTimer=document.querySelector('#sceneTimer');
const continueScene=document.querySelector('#continueScene');
const prototypeBack=document.querySelector('#prototypeBack');

let armed=false;
let sceneStartedAt=0;
let timerRaf=0;
let observer=null;

function armEntry(){
  if(armed)return;
  armed=true;
  setTimeout(()=>{
    fragment.classList.add('enterable');
    fragment.setAttribute('aria-label','Открыть фрагмент сцены');
    prompt.textContent='коснитесь фрагмента';
    prompt.style.opacity='1';
  },1200);
}

function watchArchive(){
  observer=new MutationObserver(()=>{
    if(stage.classList.contains('connected')){
      const check=()=>{
        const text=(diagnosticMain.textContent||'').toLowerCase();
        if(text.includes('общие координаты')||text.includes('обнаружено наложение')) armEntry();
        else setTimeout(check,350);
      };
      setTimeout(check,800);
    }
  });
  observer.observe(stage,{attributes:true,attributeFilter:['class']});
}

function enterScene(){
  if(!armed||experience.dataset.phase!=='archive')return;
  fragment.classList.remove('enterable');
  prompt.style.opacity='0';
  diagnostic.classList.remove('show');
  experience.classList.add('transitioning');
  fragment.style.transition='transform .9s cubic-bezier(.16,.8,.18,1),opacity .7s,filter .7s';
  fragment.style.transform='translate(-50%,-50%) scale(4.2)';
  fragment.style.opacity='0';
  stage.style.transition='filter .8s,opacity .8s,transform .8s';
  stage.style.filter='blur(8px)';
  stage.style.opacity='.08';
  stage.style.transform='scale(1.035)';
  setTimeout(()=>{
    archive.setAttribute('aria-hidden','true');
    storyScene.setAttribute('aria-hidden','false');
    experience.dataset.phase='scene';
    experience.classList.remove('transitioning');
    requestAnimationFrame(()=>storyScene.classList.add('running'));
    sceneStartedAt=performance.now();
    cancelAnimationFrame(timerRaf);
    timerRaf=requestAnimationFrame(updateTimer);
    setTimeout(()=>storyScene.classList.add('ready-next'),8200);
  },760);
}

function updateTimer(now){
  if(experience.dataset.phase!=='scene')return;
  const sec=Math.max(0,(now-sceneStartedAt)/1000);
  sceneTimer.textContent=`00:${String(Math.floor(sec)).padStart(2,'0')}`;
  timerRaf=requestAnimationFrame(updateTimer);
}

function returnArchive(){
  cancelAnimationFrame(timerRaf);
  storyScene.classList.remove('running','ready-next');
  storyScene.setAttribute('aria-hidden','true');
  archive.setAttribute('aria-hidden','false');
  experience.dataset.phase='archive';
  stage.style.transition='none';
  stage.style.filter='';
  stage.style.opacity='';
  stage.style.transform='';
  fragment.style.transition='none';
  fragment.style.transform='translate(-50%,-50%)';
  fragment.style.opacity='1';
  fragment.classList.add('enterable');
  prompt.textContent='коснитесь фрагмента';
  prompt.style.opacity='1';
  diagnosticMain.textContent='общие координаты · 0';
  diagnosticSub.textContent='связанные фрагменты · 1847';
  diagnostic.classList.add('show');
}

fragment.addEventListener('click',e=>{
  if(!armed)return;
  if(fragment.classList.contains('dragging'))return;
  e.preventDefault();
  enterScene();
});
fragment.addEventListener('keydown',e=>{
  if(!armed)return;
  if(e.key==='Enter'||e.key===' '){e.preventDefault();enterScene();}
});

continueScene.addEventListener('click',()=>{
  continueScene.textContent='следующая сцена — в работе';
  continueScene.disabled=true;
});
prototypeBack.addEventListener('click',returnArchive);

watchArchive();
})();
