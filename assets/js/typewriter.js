/* A quiet, character-by-character alias line. Stable full phrase for screen readers. */
(() => {
 const host=document.querySelector('[data-typewriter]'),text=host?.querySelector('[data-typed-alias]');if(!host||!text)return;
 const aliases=['lazy genius','drumma boi','rodrick','d1 vibecoder','generational larper','the trencher','band kid','lego builder','larper','did i mention larper?'];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let index=0,count=aliases[0].length,deleting=true,timer=0,visible=true;
 function schedule(delay){clearTimeout(timer);if(visible&&!document.hidden&&!reduced.matches)timer=setTimeout(step,delay);}
 function step(){
  if(reduced.matches||document.hidden||!visible)return;
  if(deleting){count=Math.max(0,count-1);text.textContent=aliases[index].slice(0,count);if(count===0){index=(index+1)%aliases.length;deleting=false;schedule(300);}else schedule(38+Math.random()*32);}
  else{count++;text.textContent=aliases[index].slice(0,count);if(count>=aliases[index].length){deleting=true;schedule(1700);}else schedule(65+Math.random()*65);}
 }
 function refresh(){clearTimeout(timer);host.classList.toggle('typing-paused',document.hidden||!visible||reduced.matches);if(reduced.matches){index=0;count=aliases[0].length;text.textContent=aliases[0];deleting=true;}schedule(1700);}
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;refresh();}).observe(host);
 document.addEventListener('visibilitychange',refresh);reduced.addEventListener('change',refresh);refresh();
})();
