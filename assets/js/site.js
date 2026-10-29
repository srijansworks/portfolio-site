/* Progressive enhancements only: all writing and links are already HTML. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let previewsPaused=reduced.matches;
 const videos=[...document.querySelectorAll('[data-preview-video]')];
 const visible=new Set();
 const play=v=>{if(previewsPaused||document.hidden)return;if(!v.src)v.src=v.dataset.src;v.muted=true;v.play().catch(()=>{});};
 const io=new IntersectionObserver(entries=>{for(const x of entries){if(x.isIntersecting){visible.add(x.target);play(x.target);}else{visible.delete(x.target);x.target.pause();}}},{threshold:.15});
 videos.forEach(v=>io.observe(v));
 // A single accessible control pauses every automatic preview on the page.
 if(videos.length||document.querySelector('[data-pid-preview], [data-maritime-preview]')){
  const host=document.querySelector('.section-heading')||document.querySelector('.project-status');
  if(host){const b=document.createElement('button');b.className='preview-toggle';b.type='button';b.textContent=previewsPaused?'Play previews':'Pause previews';b.setAttribute('aria-pressed',String(previewsPaused));host.append(b);b.addEventListener('click',()=>{previewsPaused=!previewsPaused;b.textContent=previewsPaused?'Play previews':'Pause previews';b.setAttribute('aria-pressed',String(previewsPaused));for(const v of visible)previewsPaused?v.pause():play(v);document.dispatchEvent(new CustomEvent('preview-playback',{detail:!previewsPaused}));});}
 }
 document.addEventListener('visibilitychange',()=>{videos.forEach(v=>v.pause());if(!document.hidden)visible.forEach(play);});
 reduced.addEventListener('change',()=>{previewsPaused=reduced.matches;videos.forEach(v=>v.pause());if(!previewsPaused)visible.forEach(play);document.dispatchEvent(new CustomEvent('preview-playback',{detail:!previewsPaused}));const b=document.querySelector('.preview-toggle');if(b){b.textContent=previewsPaused?'Play previews':'Pause previews';b.setAttribute('aria-pressed',String(previewsPaused));}});
 if(window.PanTiltSim&&window.Scene3D)document.querySelectorAll('[data-pid-preview]').forEach(canvas=>{
  const S=window.PanTiltSim;const sim=new S.Sim({mode:'figure8',speed:30,seed:1,gains:{...S.PRESETS.wellTuned}});
  const guide=Array.from({length:80},(_,i)=>{const a=i/80*Math.PI*2;return[30*Math.sin(a),15*Math.sin(2*a)];});
  let state={pan:0,tilt:0,targetPan:0,targetTilt:0,errPan:0,errTilt:0,trail:[],guide};
  const stage=window.Scene3D.create(canvas,()=>state,{hud:true,sky:true});
  let raf=0,last=0,acc=0,inView=false,active=!previewsPaused;
  function frame(ts){raf=0;if(!inView||!active||document.hidden)return;const dt=last?Math.min((ts-last)/1000,.05):0;last=ts;acc+=dt;while(acc>=sim.cfg.dt){const s=sim.step();state={...s,trail:state.trail,guide};if(state.trail.length>45)state.trail.shift();state.trail.push([s.targetPan,s.targetTilt]);acc-=sim.cfg.dt;}stage.draw(ts);raf=requestAnimationFrame(frame);}
  const refresh=()=>{cancelAnimationFrame(raf);raf=0;last=0;if(inView&&active&&!document.hidden)raf=requestAnimationFrame(frame);else stage.draw(performance.now());};
  new IntersectionObserver(es=>{inView=es[0].isIntersecting;refresh();},{threshold:.15}).observe(canvas);
  document.addEventListener('visibilitychange',refresh);document.addEventListener('preview-playback',e=>{active=e.detail;refresh();});
  stage.draw(0);canvas.classList.add('ready');
 });
 const viz=document.querySelector('[data-lunar-viz]');if(viz&&window.LunarRLViz&&window.LUNARRL_RESULTS){window.LunarRLViz.render(viz,window.LUNARRL_RESULTS,{media:{ppo:'assets/media/lunar-rl-ppo',random:'assets/media/lunar-rl-random'},glyph:''});}

})();
// Load the real public scheduling calendar only on the visitor's request.
(() => {
 const button=document.querySelector('[data-load-calendar]'),panel=document.getElementById('booking-calendar');
 if(!button||!panel)return;
 button.addEventListener('click',()=>{
  const opened=button.getAttribute('aria-expanded')==='true';button.setAttribute('aria-expanded',String(!opened));panel.hidden=opened;
  button.textContent=opened?'Show my calendar ↗':'Hide calendar −';
  if(opened){panel.replaceChildren();return;}
  const frame=document.createElement('iframe');
  const url=new URL('https://calendly.com/srijansaha-work/30min');url.searchParams.set('embed_domain',location.hostname);url.searchParams.set('embed_type','Inline');url.searchParams.set('hide_event_type_details','1');url.searchParams.set('hide_gdpr_banner','1');
  frame.src=url.href;frame.title='Book a 30-minute call with Srijan Saha';frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';panel.append(frame);
 });
})();
(() => {
 const hero=document.querySelector('.hero-banner');if(!hero)return;
 let visible=true;const update=()=>hero.classList.toggle('hero-paused',!visible||document.hidden);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(hero);
 document.addEventListener('visibilitychange',update);
})();
