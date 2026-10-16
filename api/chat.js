// Dot Bot hosted web chat. Server-side secret only. Do not log prompts or credentials.
// Production launch requires durable distributed rate limiting (e.g. Vercel WAF or Redis).
const SYSTEM=`You are Dot Bot, the original Box Signal AI companion: a smooth black sphere with two small glowing white eyes. You are a character-led AI companion, not a human. You keep good company, help people think and create, encourage curiosity and make room for wonder. Be kind, thoughtful, imaginative, gently funny and occasionally a bit odd. Speak naturally in British English, usually concisely. Be honest about your limitations: you cannot see the user's browser tab or control their computer. You are not an official Microsoft or Minecraft product.`;
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST.'});}
  if(process.env.DOTBOT_PUBLIC_CHAT_ENABLED!=='true')return res.status(503).json({error:'Dot Bot web conversations are being prepared. Please come back soon.'});
  if(!process.env.OPENAI_API_KEY)return res.status(503).json({error:'Dot Bot is not connected yet.'});
  const origin=req.headers.origin;
  if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Invalid origin.'});}catch{return res.status(403).json({error:'Invalid origin.'});}}
  if(Number(req.headers['content-length']||0)>24000)return res.status(413).json({error:'Message too large.'});
  let body;try{body=typeof req.body==='string'?JSON.parse(req.body):req.body||{}}catch{return res.status(400).json({error:'Invalid request.'})}
  if(!Array.isArray(body.messages)||body.messages.length<1||body.messages.length>12)return res.status(400).json({error:'Please start a new conversation.'});
  const messages=body.messages.map(m=>({role:m.role,content:m.content}));
  if(messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>1600)||messages.at(-1).role!=='user')return res.status(400).json({error:'Invalid conversation.'});
  // This in-memory limit is best effort per server instance, not distributed protection.
  const ip=(req.headers['x-forwarded-for']||'unknown').split(',')[0].trim();
  const now=Date.now(),windowMs=60*60*1000,limit=12;
  const store=globalThis.__dotbotRateLimit||(globalThis.__dotbotRateLimit=new Map());
  for(const [k,v] of store){if(v.until<now)store.delete(k)}
  const entry=store.get(ip)||{count:0,until:now+windowMs};
  if(entry.count>=limit)return res.status(429).json({error:'You have reached the current conversation allowance. Please try again later.'});
  entry.count++;store.set(ip,entry);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),22000);
  try{
    const upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+process.env.OPENAI_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',messages:[{role:'system',content:SYSTEM},...messages],max_completion_tokens:320})});
    const data=await upstream.json().catch(()=>({}));
    if(!upstream.ok)return res.status(502).json({error:upstream.status===429?'Dot Bot is busy right now. Please try again later.':'Dot Bot could not answer right now.'});
    const reply=data.choices?.[0]?.message?.content;
    if(typeof reply!=='string'||!reply.trim())return res.status(502).json({error:'No reply was received.'});
    return res.status(200).json({reply});
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'Dot Bot took too long to answer.':'Dot Bot could not connect. Please try again.'})}finally{clearTimeout(timer)}
}
