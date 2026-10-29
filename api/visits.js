/* Vercel function. Secrets are server-only. SQL migration is in source/database. */
module.exports = async (req,res) => {
 res.setHeader('Cache-Control','no-store');
 if(!['GET','POST'].includes(req.method)){res.setHeader('Allow','GET, POST');return res.status(405).json({error:'Method not allowed'});}
 const {SUPABASE_URL,VISIT_COUNTER_LABEL_APPROVED}=process.env;
 const serverKey=process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!SUPABASE_URL||!serverKey||VISIT_COUNTER_LABEL_APPROVED!=='true')return res.status(503).json({error:'Visit counter not configured'});
 // Reject cross-site increments; no public CORS or credentials in the client.
 if(req.method==='POST'&&req.headers.origin){let origin;try{origin=new URL(req.headers.origin);}catch{return res.status(403).json({error:'Invalid origin'});}
 if(origin.host!==req.headers.host)return res.status(403).json({error:'Invalid origin'});}
 const fn=req.method==='POST'?'increment_portfolio_visits':'read_portfolio_visits';
 try{
  const projectURL=new URL(SUPABASE_URL);if(projectURL.protocol!=='https:')throw Error('HTTPS required');
  const r=await fetch(new URL('/rest/v1/rpc/'+fn,projectURL),{method:'POST',headers:{apikey:serverKey,...(serverKey.startsWith('sb_secret_')?{}:{Authorization:'Bearer '+serverKey}),'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(5000)});
  if(!r.ok)throw Error('Backend unavailable');const count=await r.json();
  if(!Number.isSafeInteger(count)||count<327)throw Error('Invalid count');
  return res.status(200).json({visits:count,labelApproved:true,baseline:327,unit:'visits',definition:'fresh homepage loads, including reloads'});
 }catch{return res.status(503).json({error:'Visit count unavailable'});}
};
