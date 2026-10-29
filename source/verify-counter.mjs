/* Read-only, server-side connection check. Never print keys or backend error bodies. */
const {SUPABASE_URL,SUPABASE_SECRET_KEY}=process.env;
if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw Error('Configure SUPABASE_URL and SUPABASE_SECRET_KEY in a local ignored environment file first.');
const base=new URL(SUPABASE_URL);if(base.protocol!=='https:')throw Error('Use the HTTPS Supabase Project URL.');
const response=await fetch(new URL('/rest/v1/rpc/read_portfolio_visits',base),{method:'POST',headers:{apikey:SUPABASE_SECRET_KEY,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
if(!response.ok)throw Error('Counter read-only verification failed with HTTP '+response.status+'. Check the portfolio project migration and server key privately.');
const count=await response.json();if(!Number.isSafeInteger(count)||count<327)throw Error('The backend returned an invalid visit count.');
console.log('Read-only portfolio counter connection verified: '+count+' visits. No visit was added.');
