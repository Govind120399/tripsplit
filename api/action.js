import {randomBytes,createHash} from 'node:crypto';
import {firebase} from '../server/firebase.js';
import {assert,text,newGroup,member,transition} from '../public/js/ledger.js';
const hash=s=>createHash('sha256').update(s).digest('hex');
const id=v=>{assert(typeof v==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(v),'Invalid identifier.');return v;};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(req.method!=='POST')return res.status(405).json({error:'POST required.'});
 try{
  assert(Number(req.headers['content-length']||0)<20000,'Request too large.');
  const body=typeof req.body==='string'?JSON.parse(req.body):req.body;assert(body&&JSON.stringify(body).length<20000,'Invalid request.');
  const {auth,db}=firebase();let token;try{token=await auth.verifyIdToken((req.headers.authorization||'').replace(/^Bearer /,''),true);}catch{return res.status(401).json({error:'Please sign in again.'});}
  const actor={uid:token.uid,name:token.name||token.email?.split('@')[0]||'Traveler'};const action=body.action;const input=body.input||{};const now=Date.now();
  const userRef=db.doc('users/'+actor.uid);
  // Durable per-user rate limit; limits invitation guessing and accidental write bursts.
  await db.runTransaction(async tx=>{const snap=await tx.get(userRef);const u=snap.data()||{};const same=Math.floor(now/60000)===u.rateMinute;assert(!same||u.rateCount<40,'Too many requests. Try again in a minute.');tx.set(userRef,{name:actor.name,rateMinute:Math.floor(now/60000),rateCount:same?u.rateCount+1:1},{merge:true});});
  if(action==='previewInvite'||action==='join'){
   const code=String(input.code||'').trim().toUpperCase();assert(/^[A-F0-9]{16}$/.test(code),'That invitation code is invalid.');const inviteRef=db.doc('inviteLookup/'+hash(code));
   const result=await db.runTransaction(async tx=>{const inv=await tx.get(inviteRef);assert(inv.exists&&inv.data().expiresAt>now,'This invitation is invalid or expired.');const ref=db.doc('groups/'+inv.data().groupId);const snap=await tx.get(ref);assert(snap.exists,'Trip not found.');const g=snap.data();if(action==='previewInvite')return {id:ref.id,name:g.name,emoji:g.emoji,count:g.memberIds.length};if(!g.memberIds.includes(actor.uid)){assert(Object.keys(g.members).length<30||g.members[actor.uid],'This trip has reached its 30-member limit.');g.memberIds.push(actor.uid);g.members[actor.uid]={name:text(actor.name,50),active:true};g.balances[actor.uid]??=0;g.contributions[actor.uid]??=0;g.pending[actor.uid]??=0;g.revision++;g.updatedAt=now;g.lastActivity={actor:actor.name,label:'joined the trip 🎉',createdAt:now};tx.set(ref,g);tx.set(ref.collection('members').doc(actor.uid),g.members[actor.uid]);tx.set(ref.collection('activity').doc(),{actor:actor.name,label:'joined the trip 🎉',createdAt:now});}return {id:ref.id};});return res.json(result);
  }
  const opId=id(body.operationId);const operationRef=db.doc('users/'+actor.uid+'/operations/'+opId);
  if(action==='createTrip'){
   const groupId=randomBytes(12).toString('hex');const code=randomBytes(8).toString('hex').toUpperCase();const ref=db.doc('groups/'+groupId);const invRef=db.doc('inviteLookup/'+hash(code));const g=newGroup(input,actor,groupId,code,now);
   const result=await db.runTransaction(async tx=>{const [op,inv]=await Promise.all([tx.get(operationRef),tx.get(invRef)]);if(op.exists)return op.data().result;assert(!inv.exists,'Invitation collision; please retry.');tx.create(ref,g);tx.create(invRef,{groupId,expiresAt:now+30*86400000});tx.set(ref.collection('invites').doc('current'),{code,expiresAt:now+30*86400000});tx.set(ref.collection('members').doc(actor.uid),g.members[actor.uid]);tx.set(ref.collection('activity').doc(),{actor:actor.name,label:'created the trip 🧳',createdAt:now});const result={id:groupId,code};tx.create(operationRef,{result,createdAt:now});return result;});return res.json(result);
  }
  const groupId=id(body.groupId),ref=db.doc('groups/'+groupId);
  const result=await db.runTransaction(async tx=>{
   const [snap,op]=await Promise.all([tx.get(ref),tx.get(operationRef)]);assert(snap.exists,'Trip not found.');const g=snap.data();member(g,actor.uid);if(op.exists)return op.data().result;
   if(action==='rotateInvite'){assert(g.adminId===actor.uid,'Only the admin can renew invitations.');const code=randomBytes(8).toString('hex').toUpperCase();const lookup=db.doc('inviteLookup/'+hash(code));const exists=await tx.get(lookup);assert(!exists.exists,'Please try again.');tx.delete(db.doc('inviteLookup/'+hash(g.inviteCode)));tx.create(lookup,{groupId,expiresAt:now+30*86400000});tx.set(ref.collection('invites').doc('current'),{code,expiresAt:now+30*86400000});tx.update(ref,{inviteCode:code,updatedAt:now});const result={code};tx.create(operationRef,{result,createdAt:now});return result;}
   const expense=action==='saveExpense'||action==='deleteExpense';const settlement=['recordSettlement','confirmSettlement','rejectSettlement','cancelSettlement'].includes(action);let target,old=null;
   if(expense||settlement){target=ref.collection(expense?'expenses':'settlements').doc(input.id?id(input.id):opId);const s=await tx.get(target);old=s.exists?s.data():null;if(input.id)assert(old,'Record no longer exists.');else assert(!old,'Record already exists.');}
   const largest=expense?await tx.get(ref.collection('expenses').orderBy('amount','desc').limit(2)):null;const next=transition(g,action,input,actor,old,now);if(largest){const candidates=largest.docs.filter(d=>d.id!==target.id).map(d=>({id:d.id,title:d.data().title,amount:d.data().amount}));if(next.record)candidates.push({id:target.id,title:next.record.title,amount:next.record.amount});next.group.highest=candidates.sort((a,b)=>b.amount-a.amount)[0]||null;}tx.set(ref,next.group);if(target){if(action==='deleteExpense')tx.delete(target);else tx.set(target,next.record);}if(action==='removeMember')tx.set(ref.collection('members').doc(input.uid),next.group.members[input.uid]);
   tx.set(ref.collection('activity').doc(opId),{actor:actor.name,label:next.label,createdAt:now});const result={id:target?.id||groupId};tx.create(operationRef,{result,createdAt:now});return result;
  });return res.json(result);
 }catch(error){const safe=error instanceof Error?error.message:'Unable to complete request.';const internal=/credential|configuration|private.key|PERMISSION_DENIED|UNAVAILABLE|JSON|token/i.test(safe);return res.status(internal?503:400).json({error:internal?'Service unavailable. Check server configuration or try again.':safe});}
}
