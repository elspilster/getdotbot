import { put } from '@vercel/blob';
export default async function handler(req,res){
 if(req.method!=='POST'){res.setHeader('Allow','POST');return res.status(405).json({error:'Method not allowed'});}
 try{
  const fields=['usefulness','relevance','interest','usability','appearance','returnIntent','comment'];
  const ratings=['','Very good','Good','Okay','Poor','Very poor'];
  const result={};for(const field of fields){const value=req.body?.[field];if(typeof value!=='string')return res.status(400).json({error:'Invalid feedback'});const clean=value.trim();if(field==='comment'){if(clean.length>1000)return res.status(400).json({error:'Comment too long'});result[field]=clean;}else{if(!(field==='returnIntent'?['','Definitely','Probably','Not sure','Probably not']:ratings).includes(clean))return res.status(400).json({error:'Invalid rating'});result[field]=clean;}}
  if(!Object.values(result).some(Boolean))return res.status(400).json({error:'Empty feedback'});
  const record={createdAt:new Date().toISOString(),...result};
  await put('feedback/'+crypto.randomUUID()+'.json',JSON.stringify(record),{access:'private',contentType:'application/json',addRandomSuffix:false});
  return res.status(201).json({ok:true});
 }catch(e){console.error('Feedback storage failed',e);return res.status(503).json({error:'Feedback is temporarily unavailable'});}
}
