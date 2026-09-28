(() => {
 'use strict';
 const gs=window.gsap, ST=window.ScrollTrigger, motion=document.querySelector('#motion'), lang=document.querySelector('#language'), hero=document.querySelector('.hero-scroll');
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 let context=null, intro=null, language='en', manualStill=reduce.matches, ready=false, seaSyncRaf=0;
 function syncSeaFromScroll(){seaSyncRaf=0;const still=document.body.classList.contains('still'),max=Math.max(1,(hero?.offsetHeight||innerHeight)-innerHeight),progress=still?0:Math.min(1,Math.max(0,scrollY/max));window.PachinSea?.setProgress(progress);document.documentElement.dataset.depth=progress.toFixed(3)}
 function queueSeaSync(){if(!seaSyncRaf)seaSyncRaf=requestAnimationFrame(syncSeaFromScroll)}
 function labels(){document.documentElement.lang=language;document.querySelectorAll('[data-en]').forEach(el=>{el.textContent=el.dataset[language]});lang.textContent='EN';lang.setAttribute('aria-label','English preview; other languages are not included');motion.textContent=manualStill?'Enable motion':'Still mode'}
 function build(){
  if(!ready)return;
  context?.revert();context=null;intro=null;
  const still=manualStill||!gs||!ST;
  document.documentElement.style.scrollBehavior=still?'auto':'smooth';
  document.body.classList.toggle('still',still);motion.setAttribute('aria-pressed',String(still));labels();
  window.PachinSea?.setPaused(still);syncSeaFromScroll();
  if(still)return;
  gs.registerPlugin(ST);
  let timeline=null;
  context=gs.context(()=>{
   intro=gs.timeline({defaults:{ease:'power3.out'}}).fromTo('.glyph i',{yPercent:105,rotation:4},{yPercent:0,rotation:0,duration:1.5,stagger:.08},0);
   timeline=gs.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'.hero-scroll',start:'top top',end:'bottom bottom',scrub:.55,invalidateOnRefresh:true,onRefresh:queueSeaSync}});
   timeline.to({},{duration:1},0)
    .to('.opening',{autoAlpha:0,duration:.12},0)
    .to('.brand-scroll',{scale:.80,y:()=>-innerHeight*.16,duration:.24},.06)
    .to('.glyph',{yPercent:i=>-14-i*7,opacity:0,filter:'blur(5px)',duration:.22,stagger:.012},.25)
    .to('.brand-caption',{autoAlpha:0,duration:.12},.26)
    .fromTo('.below',{autoAlpha:0,y:55},{autoAlpha:1,y:0,duration:.23},.64);
  });
  requestAnimationFrame(()=>{ST.refresh();queueSeaSync()});
 }
 lang.addEventListener('click',()=>{lang.title='English-only preview';lang.setAttribute('aria-label','English-only preview; other languages are not included')});
 motion.addEventListener('click',()=>{manualStill=!manualStill;build()});
 reduce.addEventListener('change',()=>{manualStill=reduce.matches;build()});
 addEventListener('scroll',queueSeaSync,{passive:true});addEventListener('resize',queueSeaSync,{passive:true});
 window.addEventListener('pageshow',()=>{if(ready){ST?.refresh();queueSeaSync()}});
 Promise.race([document.fonts.ready,new Promise(resolve=>setTimeout(resolve,2500))]).then(()=>{ready=true;build()});
})();
