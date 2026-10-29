import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import vm from 'node:vm';import {createRequire} from 'node:module';
const root=path.resolve(import.meta.dirname,'..');let checked=0;
for(const file of fs.readdirSync(root).filter(p=>p.endsWith('.html'))){const html=fs.readFileSync(path.join(root,file),'utf8');for(const m of html.matchAll(/\b(?:href|src|poster|data-src)="([^"]+)"/g)){const url=m[1];if(/^(?:[a-z]+:|#|\/api\/)/i.test(url))continue;const relative=decodeURIComponent(url.split(/[?#]/)[0]);if(relative)assert(fs.existsSync(path.resolve(root,relative)),`${file}: missing ${url}`);}checked++;}
const home=fs.readFileSync(root+'/index.html','utf8');assert(home.includes('mailto:srijansaha.work@gmail.com'));assert(home.includes('tel:+15103596679'));assert(home.includes('https://calendly.com/srijansaha-work/30min'));assert(home.includes('srijan-saha-800723432'));assert(!home.includes('—'));assert(!home.includes('localStorage'));
// Reduced-motion clicks retain normal link behavior without loading WebGL.
const handlers={};const link={addEventListener:(name,fn)=>{handlers[name]=fn;}};
const sandbox={matchMedia:()=>({matches:true}),document:{querySelectorAll:()=>[link]},navigator:{},window:{addEventListener:()=>{}}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync(root+'/assets/js/transitions.js','utf8'),sandbox);let prevented=false;await handlers.click({button:0,preventDefault(){prevented=true;}});assert.equal(prevented,false);
const require=createRequire(import.meta.url);const api=require(root+'/api/visits.js');
async function request(req){const res={setHeader(){},status(n){this.code=n;return this},json(body){this.body=body;return this}};await api(req,res);return res;}
const old={...process.env};delete process.env.SUPABASE_URL;delete process.env.SUPABASE_SERVICE_ROLE_KEY;delete process.env.SUPABASE_SECRET_KEY;
assert.equal((await request({method:'POST',headers:{}})).code,503);assert.equal((await request({method:'DELETE',headers:{}})).code,405);
process.env.SUPABASE_URL='https://backend.example';process.env.SUPABASE_SECRET_KEY='sb_secret_test_only';process.env.VISIT_COUNTER_LABEL_APPROVED='true';const oldFetch=globalThis.fetch;
globalThis.fetch=async(url,options)=>{assert.equal(options.headers.apikey,'sb_secret_test_only');assert.equal(options.headers.Authorization,undefined);return{ok:true,json:async()=>328};};assert.equal((await request({method:'POST',headers:{host:'portfolio.example',origin:'https://unrelated.example'}})).code,403);assert.equal((await request({method:'POST',headers:{host:'portfolio.example',origin:'https://portfolio.example'}})).body.visits,328);
globalThis.fetch=async()=>{throw Error('offline');};assert.equal((await request({method:'GET',headers:{}})).code,503);globalThis.fetch=oldFetch;process.env=old;
console.log(`${checked} HTML pages: local links, contact/booking values, reduced-motion navigation, and counter failure paths passed. Live Production access is not exercised by these local checks.`);

await import('./check-transitions.mjs');

// No baseline or stale number is rendered while the live request is pending.
assert(home.includes('<p class="hero-visit-number" data-hero-visits hidden></p>'));
assert(home.includes('working on <em>vision systems</em>'));
const greetingSource=fs.readFileSync(root+'/assets/js/visit-greeting.js','utf8');
async function checkGreeting(response){
 let resolveRequest,calls=0;const number={hidden:true,children:[],replaceChildren(){this.children=[];},append(...nodes){this.children.push(...nodes);}};
 const note={dataset:{},querySelector(selector){return selector==='[data-hero-visits]'?number:{textContent:''};}};
 const context={document:{hidden:false,querySelector:()=>note,addEventListener(){},createTextNode:text=>({textContent:text}),createElement:()=>({})},matchMedia:()=>({matches:true,addEventListener(){}}),IntersectionObserver:class{observe(){}},clearInterval(){},setInterval(){},fetch(){calls++;return new Promise(resolve=>{resolveRequest=resolve;});}};
 vm.runInNewContext(greetingSource,context);
 assert.equal(number.hidden,true);assert.equal(number.children.length,0);assert.equal(calls,1);
 resolveRequest(response);await new Promise(resolve=>setImmediate(resolve));return number;
}
const loaded=await checkGreeting({ok:true,json:async()=>({visits:456,labelApproved:true})});assert.equal(loaded.hidden,false);assert.equal(loaded.children.map(n=>n.textContent).join(''),'visit #456.');
for(const response of [{ok:false},{ok:true,json:async()=>({visits:456,labelApproved:false})},{ok:true,json:async()=>({visits:0,labelApproved:true})}])assert.equal((await checkGreeting(response)).hidden,true);
console.log('Visit count stays empty and hidden until a valid live response; failures never reveal a baseline. Updated hero copy passed.');
