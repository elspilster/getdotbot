// Dot Bot Duo: deliberately capped, opt-in experiment. Never log conversations or API keys.
const BASE='You are Dot Bot, a friendly black spherical AI companion from Box Signal. Speak in natural British English, with humour, curiosity and warmth. You are not a human or conscious being. Keep replies to 1-3 sentences and under 75 words. Do not include speaker labels.';
const rate=new Map();
export default async function handler(req,res){
res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
if(req.method!=='POST')return res.status(405).json({error:'Use POST.'});
if(process.env.DOTBOT_PUBLIC_CHAT_ENABLED!=='true'||!process.env.OPENAI_API_KEY)return res.status(503).json({error:'The experiment is not available yet.'});
const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Invalid origin.'})}catch{return res.status(403).json({error:'Invalid origin.'})}}
if(Number(req.headers['content-length']||0)>12000)return res.status(413).json({error:'Request too large.'});
let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({error:'Invalid request.'})}
const {topic,who,history}=body;
if(typeof topic!=='string'||!topic.trim()||topic.length>180||!['A','B'].includes(who)||!Array.isArray(history)||history.length>7||history.some((x,i)=>!x||x.who!==(i%2===0?'A':'B')||typeof x.text!=='string'||x.text.length>800)||who!==(history.length%2===0?'A':'B'))return res.status(400).json({error:'Invalid conversation.'});
const ip=String(req.headers['x-forwarded-for']||'unknown').split(',')[0];const now=Date.now();for(const [k,v] of rate)if(v.until<now)rate.delete(k);const item=rate.get(ip)||{count:0,until:now+3600000};if(item.count>=24)return res.status(429).json({error:'Hourly experiment limit reached. Please try later.'});item.count++;rate.set(ip,item);
const instruction=who==='A'?'You are curious, optimistic, and imaginative. Build on ideas.':'You are thoughtful, gently sceptical and witty. Improve ideas and ask interesting questions.';
const messages=[{role:'system',content:BASE+' '+instruction+' You are talking to another Dot Bot. Stay on topic and move the conversation forward.'},{role:'user',content:'Topic: '+topic+'\nBegin the conversation with an interesting thought.'},...history.map(x=>({role:x.who===who?'assistant':'user',content:x.text}))];
const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),18000);
try{const r=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',messages,max_completion_tokens:130})});const data=await r.json().catch(()=>({}));if(!r.ok)return res.status(502).json({error:'The bots could not reply right now.'});const reply=data.choices?.[0]?.message?.content;if(typeof reply!=='string'||!reply.trim())return res.status(502).json({error:'No reply received.'});return res.status(200).json({reply:reply.slice(0,800)})}catch(e){return res.status(502).json({error:e.name==='AbortError'?'The response timed out.':'Could not reach the bots.'})}finally{clearTimeout(timer)}
}