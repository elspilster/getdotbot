// Dot Bot web chat — BYO OpenAI API key. No key or conversation persistence.
// The key is transmitted through this Vercel function to OpenAI on each request.
const SYSTEM = `You are Dot Bot, the original Box Signal AI companion. You are a small smooth black sphere with exactly two small glowing white eyes. You are not a human. Your purpose is to keep good company, help people think and create, encourage curiosity and make a little room for wonder. Be calm, kind, thoughtful, imaginative, occasionally gently funny and a bit odd. Speak naturally in British English, without overlong answers or constant productivity pitches. You can help with questions, stories, games and creative ideas. Be truthful about what you can and cannot do. Never claim you can see the user's browser tab or control their computer unless an actual tool has been provided. You're a companion first, not just a Windows guide or Minecraft guide. You are an AI, not a conscious being. Do not imply official affiliation with Microsoft or Minecraft.`;
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Use POST.'});}
  const origin=req.headers.origin;
  const host=req.headers.host;
  if(origin){try{if(new URL(origin).host!==host)return res.status(403).json({error:'Invalid origin.'});}catch{return res.status(403).json({error:'Invalid origin.'});}}
  const size=Number(req.headers['content-length']||0);
  if(size>40000)return res.status(413).json({error:'Message too large.'});
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body||{};
  const key=body.apiKey;
  if(typeof key!=='string'||!/^sk-[A-Za-z0-9_-]{12,}$/.test(key)||key.length>400)return res.status(400).json({error:'Enter a valid OpenAI API key.'});
  if(!Array.isArray(body.messages)||body.messages.length>24)return res.status(400).json({error:'Conversation too long. Start a new chat.'});
  const messages=body.messages.map(m=>({role:m.role,content:m.content}));
  if(!messages.length||messages.some(m=>!['user','assistant'].includes(m.role)||typeof m.content!=='string'||m.content.length>3500)||messages[messages.length-1].role!=='user')return res.status(400).json({error:'Invalid conversation.'});
  try{
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),25000);
    let upstream;
    try{upstream=await fetch('https://api.openai.com/v1/chat/completions',{method:'POST',signal:controller.signal,headers:{Authorization:'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'gpt-4.1-mini',messages:[{role:'system',content:SYSTEM},...messages],max_completion_tokens:500})});}finally{clearTimeout(timer)}
    const result=await upstream.json().catch(()=>({}));
    if(!upstream.ok){const msg=upstream.status===401?'That API key was not accepted.':upstream.status===429?'OpenAI rate limit or usage limit reached.':'OpenAI could not complete this request ('+upstream.status+').';return res.status(upstream.status===401?401:502).json({error:msg});}
    const answer=result.choices?.[0]?.message?.content;
    if(typeof answer!=='string'||!answer.trim())return res.status(502).json({error:'Dot Bot did not receive a reply.'});
    return res.status(200).json({reply:answer});
  }catch(e){return res.status(502).json({error:e.name==='AbortError'?'The request timed out. Please try again.':'Could not reach OpenAI. Please try again.'});}
}
