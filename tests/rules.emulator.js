// Run only through npm run test:rules. No production credentials required.
import {initializeTestEnvironment,assertFails,assertSucceeds} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,collection,getDocs,query,where} from 'firebase/firestore';
import {readFile} from 'node:fs/promises';
import test from 'node:test';
const env=await initializeTestEnvironment({projectId:'demo-tripsplit',firestore:{rules:await readFile('firestore.rules','utf8'),host:'127.0.0.1',port:8080}});
await env.withSecurityRulesDisabled(async context=>{const db=context.firestore();await setDoc(doc(db,'groups/g'),{memberIds:['a']});await setDoc(doc(db,'groups/g/expenses/e'),{amount:100});await setDoc(doc(db,'inviteLookup/secret'),{groupId:'g'});});
const a=env.authenticatedContext('a').firestore(),b=env.authenticatedContext('b').firestore(),anon=env.unauthenticatedContext().firestore();
test('member reads own group',()=>assertSucceeds(getDoc(doc(a,'groups/g'))));
test('member query works when membership constrained',()=>assertSucceeds(getDocs(query(collection(a,'groups'),where('memberIds','array-contains','a')))));
test('outsiders cannot read group or expense',async()=>{await assertFails(getDoc(doc(b,'groups/g')));await assertFails(getDoc(doc(b,'groups/g/expenses/e')));});
test('anonymous users cannot read group',()=>assertFails(getDoc(doc(anon,'groups/g'))));
test('members cannot bypass API ledger validation',()=>assertFails(setDoc(doc(a,'groups/g/expenses/hacked'),{amount:1})));
test('members cannot change membership or balances directly',()=>assertFails(setDoc(doc(a,'groups/g'),{memberIds:['a','b'],balances:{a:99999}})));
test('invitation lookup is not publicly readable',()=>assertFails(getDoc(doc(a,'inviteLookup/secret'))));
test.after(async()=>await env.cleanup());
