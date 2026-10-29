import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../assets/js/transitions.js',import.meta.url),'utf8');
function fixture(reduce=false){
 const events={},windowEvents={},clickHandlers={},nodes=[],navigations=[];let nextFrame=null,restored=false;
 function node(tag='div'){
  const n={tag,style:{},dataset:{},attrs:{},children:[],removed:false,className:'',innerHTML:'',classList:{toggle(){}},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},append(...items){this.children.push(...items);},remove(){this.removed=true;},querySelectorAll(){return[];},querySelector(){return this.label??=(node('span'));},focus(){}};nodes.push(n);return n;
 }
 const target=node();target.className='preview';target.getBoundingClientRect=()=>({left:80,top:180,width:330,height:300,bottom:480,right:410});target.cloneNode=()=>node();
 const link={href:'https://portfolio.example/scene.html',querySelector:()=>target,getBoundingClientRect:target.getBoundingClientRect,addEventListener(k,fn){clickHandlers[k]=fn;}};
 const body=node('body');const doc={body,hidden:false,activeElement:{focus(){restored=true;}},querySelectorAll(){return[link];},querySelector(){return{getBoundingClientRect:()=>({bottom:83})};},createElement:tag=>node(tag),addEventListener(k,fn){events[k]=fn;},removeEventListener(k,fn){if(events[k]===fn)delete events[k];}};
 const sandbox={document:doc,window:{addEventListener(k,fn){windowEvents[k]=fn;},removeEventListener(k,fn){if(windowEvents[k]===fn)delete windowEvents[k];}},innerWidth:1280,innerHeight:900,matchMedia:()=>({matches:reduce}),navigator:{},performance:{now:()=>0},requestAnimationFrame(fn){nextFrame=fn;return 1;},cancelAnimationFrame(){nextFrame=null;},fetch:async()=>({ok:false}),AbortSignal:{timeout:()=>null},location:{assign(url){navigations.push(url);}}};
 vm.createContext(sandbox);vm.runInContext(source,sandbox);
 const click=(options={})=>{let prevented=false;clickHandlers.click({button:0,defaultPrevented:false,preventDefault(){prevented=true;},...options});return prevented;};
 const frame=ms=>{assert(nextFrame,'Animation should have a scheduled frame');const fn=nextFrame;nextFrame=null;fn(ms);};
 const overlay=()=>body.children.findLast(n=>!n.removed);
 return{events,windowEvents,nodes,navigations,click,frame,overlay,restored:()=>restored};
}
const f=fixture();assert(f.click());
for(const [ms,phase] of [[0,'random'],[300,'overshoot'],[380,'correct'],[500,'locked'],[750,'zoom']]){f.frame(ms);assert.equal(f.overlay().dataset.phase,phase);}
f.frame(920);assert.equal(f.navigations.length,1);assert(f.overlay(),'Keep the zoomed card visible until the actual navigation');f.windowEvents.pagehide();assert(!f.overlay());
const cancel=fixture();cancel.click();cancel.frame(380);cancel.events.keydown({key:'Escape',preventDefault(){}});assert(!cancel.overlay());assert.equal(cancel.navigations.length,0);assert(cancel.restored());
const skip=fixture();skip.click();skip.nodes.findLast(n=>n.tag==='button').onclick();assert.equal(skip.navigations.length,1);
assert.equal(fixture(true).click(),false);assert.equal(fixture().click({ctrlKey:true}),false);assert.equal(fixture().click({metaKey:true}),false);assert.equal(fixture().click({button:1}),false);
console.log('Crosshair: random aim → overshoot → correction → lock → zoom within 920ms; Escape/skip, navigation handoff, reduced motion, and modified clicks passed.');
// Run the actual typewriter through its complete sequence using a virtual clock.
const typingSource=fs.readFileSync(new URL('../assets/js/typewriter.js',import.meta.url),'utf8');
const aliases=['lazy genius','drumma boi','rodrick','d1 vibecoder','generational larper','the trencher','band kid','lego builder','larper','did i mention larper?'];
let callback=null,delay=0;const text={textContent:'lazy genius'},media={matches:false,addEventListener(){}};const host={querySelector:()=>text,classList:{toggle(){}}};
const context={document:{hidden:false,querySelector:()=>host,addEventListener(){}},matchMedia:()=>media,IntersectionObserver:class{observe(){}},setTimeout(fn,ms){callback=fn;delay=ms;return 1;},clearTimeout(){callback=null;}};
vm.createContext(context);vm.runInContext(typingSource,context);const seen=new Set([text.textContent]);
for(let i=0;i<600&&seen.size<aliases.length;i++){const before=text.textContent;const fn=callback;assert(fn);callback=null;fn();assert(Math.abs(text.textContent.length-before.length)<=1,'Typing and deletion should move one character at a time');if(delay===1700)seen.add(text.textContent);}
assert.deepEqual([...seen],aliases);console.log('Typewriter: all 10 aliases appear in order, typed and deleted one character at a time.');
