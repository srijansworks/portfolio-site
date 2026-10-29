/* Browser-only target acquisition. No WebGL, model downloads, or idle loops. */
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const cache=new Map();let active=null;
const clamp=t=>Math.max(0,Math.min(1,t));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>t*t*(3-2*t);
const outCubic=t=>1-(1-t)**3;
const inOutQuint=t=>t<.5?16*t**5:1-(-2*t+2)**5/2;
function prepare(link){
 if(reduced.matches||navigator.connection?.saveData||cache.has(link.href))return;
 const task=fetch(link.href,{cache:'force-cache',signal:AbortSignal.timeout(3500)}).then(async r=>{
  if(!r.ok)return;const html=await r.text();const doc=new DOMParser().parseFromString(html,'text/html');
  for(const x of doc.querySelectorAll('link[rel="stylesheet"],link[rel="preload"]')){
   const href=new URL(x.getAttribute('href'),link.href).href;
   if(document.querySelector(`link[data-prepared="${CSS.escape(href)}"]`))continue;
   const l=document.createElement('link');l.rel='preload';l.as=x.getAttribute('as')||'style';l.href=href;l.dataset.prepared=href;if(l.as==='font')l.crossOrigin='anonymous';document.head.append(l);
  }
 }).catch(()=>{});cache.set(link.href,task);
}
for(const link of document.querySelectorAll('[data-transition]')){
 for(const name of ['pointerenter','focus','touchstart'])link.addEventListener(name,()=>prepare(link),{once:true,passive:true});
 link.addEventListener('click',event=>{
  if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||reduced.matches||navigator.connection?.saveData)return;
  if(active){event.preventDefault();return;}
  event.preventDefault();prepare(link);
  try{start(link);}catch{active?.cleanup();location.assign(link.href);}
 });
}
function start(link){
 let target=link.querySelector('[data-preview]')||link;
 const w=innerWidth,h=innerHeight,headerBottom=document.querySelector('.site-header')?.getBoundingClientRect().bottom||0;
 let rect=target.getBoundingClientRect();
 if(rect.bottom<headerBottom+12||rect.top>h-12){target=link;rect=target.getBoundingClientRect();}
 const center={x:Math.max(24,Math.min(w-24,rect.left+rect.width/2)),y:Math.max(headerBottom+16,Math.min(h-24,rect.top+rect.height/2))};
 // Keep the first aim genuinely random and clearly away from the selected card.
 let random={x:w*.2,y:h*.25};
 for(let i=0;i<8;i++){
  random={x:40+Math.random()*Math.max(1,w-80),y:headerBottom+32+Math.random()*Math.max(1,h-headerBottom-80)};
  if(Math.hypot(random.x-center.x,random.y-center.y)>Math.min(w,h)*.33)break;
 }
 const distance=Math.hypot(center.x-random.x,center.y-random.y)||1;
 const overshoot=Math.min(52,Math.max(24,rect.width*.12));
 const beyond={x:Math.max(20,Math.min(w-20,center.x+(center.x-random.x)/distance*overshoot)),y:Math.max(headerBottom+8,Math.min(h-20,center.y+(center.y-random.y)/distance*overshoot))};
 const layer=document.createElement('div');layer.className='transition-layer crosshair-transition';layer.setAttribute('role','status');layer.setAttribute('aria-label','Opening project');
 const veil=document.createElement('div');veil.className='transition-veil';layer.append(veil);
 const clone=target.cloneNode(true);clone.className='transition-preview '+target.className;clone.removeAttribute('data-preview');clone.setAttribute('aria-hidden','true');clone.setAttribute('inert','');
 clone.removeAttribute('id');clone.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
 Object.assign(clone.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px',aspectRatio:'auto'});
 clone.querySelectorAll('canvas').forEach((c,i)=>{const orig=target.querySelectorAll('canvas')[i];if(orig){c.width=orig.width;c.height=orig.height;c.getContext('2d').drawImage(orig,0,0);}});
 clone.querySelectorAll('video').forEach((v,i)=>{const orig=target.querySelectorAll('video')[i];if(orig?.currentSrc){v.src=orig.currentSrc;v.currentTime=orig.currentTime;v.muted=true;v.play().catch(()=>{});}});
 layer.append(clone);
 const bracket=document.createElement('div');bracket.className='aim-brackets';bracket.setAttribute('aria-hidden','true');bracket.innerHTML='<i></i><i></i><i></i><i></i>';layer.append(bracket);
 const reticle=document.createElement('div');reticle.className='aim-reticle';reticle.setAttribute('aria-hidden','true');
 reticle.innerHTML='<svg viewBox="0 0 100 100" fill="none"><circle class="aim-ring" cx="50" cy="50" r="24"/><path class="aim-arms" d="M50 5V28 M50 72V95 M5 50H28 M72 50H95"/><path class="aim-ticks" d="M20 29V20H29 M71 20H80V29 M80 71V80H71 M29 80H20V71"/><path class="aim-center" d="M46 50H54 M50 46V54"/></svg><span class="aim-label">ACQUIRE</span>';
 layer.append(reticle);
 const skip=document.createElement('button');skip.className='transition-skip';skip.textContent='Skip animation';layer.append(skip);
 const oldFocus=document.activeElement;let raf=0,done=false,navigating=false;
 const cleanup=()=>{if(done)return;done=true;cancelAnimationFrame(raf);clone.querySelectorAll('video').forEach(v=>v.pause());layer.remove();document.removeEventListener('keydown',keys);window.removeEventListener('resize',cancel);window.removeEventListener('pagehide',cleanup);window.removeEventListener('wheel',cancel);document.removeEventListener('visibilitychange',hidden);active=null;};
 const cancel=()=>{if(navigating)return;cleanup();oldFocus?.focus({preventScroll:true});};
 const finish=()=>{if(done||navigating)return;navigating=true;cancelAnimationFrame(raf);location.assign(link.href);};
 const keys=e=>{if(e.key==='Escape'){e.preventDefault();cancel();}else if(e.key==='Tab'){e.preventDefault();skip.focus();}};
 const hidden=()=>{if(document.hidden)cancel();};
 document.addEventListener('keydown',keys);window.addEventListener('resize',cancel);window.addEventListener('pagehide',cleanup);window.addEventListener('wheel',cancel,{passive:true});document.addEventListener('visibilitychange',hidden);skip.onclick=finish;
 document.body.append(layer);active={cleanup,cancel};
 const started=performance.now(),duration=920;
 const maxScale=Math.max(w/Math.max(rect.width,1),h/Math.max(rect.height,1))*1.025;
 const dx=w/2-(rect.left+rect.width/2),dy=h/2-(rect.top+rect.height/2);
 function draw(now){
  if(done||navigating)return;
  const p=clamp((now-started)/duration);
  let aim={...random};
  if(p>.10&&p<.34){const q=outCubic(clamp((p-.10)/.24));aim={x:lerp(random.x,beyond.x,q),y:lerp(random.y,beyond.y,q)};}
  else if(p>=.34){const q=smooth(clamp((p-.34)/.16));aim={x:lerp(beyond.x,center.x,q),y:lerp(beyond.y,center.y,q)};}
  const locked=p>=.50,zoom=inOutQuint(clamp((p-.61)/.39)),scale=lerp(1,maxScale,zoom);
  const zoomX=dx*zoom,zoomY=dy*zoom;
  clone.style.transform=`translate3d(${zoomX}px,${zoomY}px,0) scale(${scale})`;
  clone.style.borderRadius=lerp(8,0,zoom)+'px';
  veil.style.opacity=String(zoom*.99);
  reticle.style.transform=`translate3d(${lerp(aim.x,w/2,zoom)}px,${lerp(aim.y,h/2,zoom)}px,0) translate(-50%,-50%) scale(${lerp(1,1.6,zoom)})`;
  reticle.style.opacity=String(p<.05?p/.05:1-clamp((p-.77)/.2));
  reticle.classList.toggle('is-locked',locked);reticle.querySelector('.aim-label').textContent=locked?'LOCKED':'ACQUIRE';
  const pulse=locked?1:0;
  Object.assign(bracket.style,{left:(rect.left+zoomX-(rect.width*(scale-1)/2)-5)+'px',top:(rect.top+zoomY-(rect.height*(scale-1)/2)-5)+'px',width:(rect.width*scale+10)+'px',height:(rect.height*scale+10)+'px',opacity:String(pulse*(1-clamp((p-.78)/.2)))});
  layer.dataset.phase=p<.10?'random':p<.34?'overshoot':p<.50?'correct':p<.61?'locked':'zoom';
  if(p<1)raf=requestAnimationFrame(draw);else finish();
 }
 raf=requestAnimationFrame(draw);
}
window.addEventListener('pageshow',()=>active?.cleanup());
