(() => {
 const note=document.querySelector('.hero-visit-note');if(!note)return;
 const title=note.querySelector('[data-visit-greeting]'),number=note.querySelector('[data-hero-visits]'),joke=note.querySelector('[data-visit-joke]');
 const greetings=[['thanks for stopping by.','lab coat optional.'],["what’s up.",'welcome to the experiment.'],['hey!','please don’t touch the drone.'],['oh, hello.','another willing test subject.'],['you made it.','the experiment continues.']];
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let index=0,timer=0,visible=true;
 function update(){clearInterval(timer);if(!reduced.matches&&visible&&!document.hidden)timer=setInterval(()=>{index=(index+1)%greetings.length;title.textContent=greetings[index][0];joke.textContent=greetings[index][1];},4800);}
 new IntersectionObserver(es=>{visible=es[0].isIntersecting;update();}).observe(note);document.addEventListener('visibilitychange',update);reduced.addEventListener('change',update);update();
 // Exactly one POST per fresh homepage load. No client key or browser-local count.
 fetch('/api/visits',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}).then(r=>r.ok?r.json():null).then(data=>{
  if(!data?.labelApproved||!Number.isSafeInteger(data.visits)||data.visits<327)return;
  number.replaceChildren();const label=document.createTextNode('visit #'),value=document.createElement('b');value.textContent=data.visits.toLocaleString();number.append(label,value,document.createTextNode('.'));
  number.title='Visits, including a configured starting number of 327. Repeated homepage loads count; this is not unique people or people online.';number.hidden=false;note.dataset.live='true';
 }).catch(()=>{});
})();
