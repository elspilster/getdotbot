// Experimental Sproggle image tools. Private development branch only.
// Search uses Wikimedia Commons (licence and author links returned). Generation uses the server-side OpenAI key.
const limits=new Map();
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
if(process.env.DOTBOT_PUBLIC_CHAT_ENABLED!=='true')return res.status(503).json({error:'Sproggle is not enabled.'});
if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return res.status(403).json({error:'Invalid origin.'})}catch{return res.status(403).json({error:'Invalid origin.'})}}
if(Number(req.headers['content-length']||0)>2000)return res.status(413).json({error:'Request too large.'});
let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({error:'Invalid request.'})}
const {action,prompt}=body;if(!['search','create'].includes(action)||typeof prompt!=='string'||!prompt.trim()||prompt.length>300)return res.status(400).json({error:'Enter a short image description.'});
const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim(),key=ip+':'+action,now=Date.now();for(const [k,v] of limits)if(v.until<now)limits.delete(k);const item=limits.get(key)||{count:0,until:now+3600000};if(item.count>=(action==='create'?3:15))return res.status(429).json({error:'Hourly image limit reached.'});item.count++;limits.set(key,item);
const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),55000);
try{
if(action==='search'){
const params=new URLSearchParams({action:'query',generator:'search',gsrsearch:'filetype:bitmap '+prompt,gsrnamespace:'6',gsrlimit:'6',prop:'imageinfo',iiprop:'url|extmetadata',iiurlwidth:'640',format:'json',formatversion:'2',origin:'*'});
const r=await fetch('https://commons.wikimedia.org/w/api.php?'+params,{signal:controller.signal,headers:{'User-Agent':'BoxSignalSproggle/0.1 (experimental image search)'}});if(!r.ok)throw Error('Search unavailable');
const d=await r.json();const results=(d.query?.pages||[]).flatMap(p=>{const i=p.imageinfo?.[0];if(!i?.thumburl||!/^https:\/\//.test(i.thumburl))return [];const meta=i.extmetadata||{};return [{title:String(p.title||'').replace(/^File:/,''),image:i.thumburl,source:i.descriptionurl||i.url,license:meta.LicenseShortName?.value||'Check source',attribution:meta.Artist?.value?.replace(/<[^>]*>/g,'').slice(0,140)||'See source'}]}).slice(0,6);
return res.status(200).json({results});
}
if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Image creation is not configured.'});
const r=await fetch('https://api.openai.com/v1/images/generations',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-image-1-mini',prompt,size:'1024x1024',quality:'low',n:1})});
const d=await r.json().catch(()=>({}));if(!r.ok)return res.status(502).json({error:'Image creation was unavailable. Check model access and billing.'});const b64=d.data?.[0]?.b64_json;if(!b64)return res.status(502).json({error:'No image was returned.'});return res.status(200).json({image:'data:image/png;base64,'+b64});
}catch(e){return res.status(502).json({error:e.name==='AbortError'?'Image request timed out.':'Image service unavailable.'})}finally{clearTimeout(timer)}
}