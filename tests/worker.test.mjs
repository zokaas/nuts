// Aja: node --test tests/*.test.*
import test from "node:test"; import assert from "node:assert";
import w from "../strava-worker/worker.js";
class KV { constructor(){ this.m=new Map(); } async get(k,t){ const v=this.m.get(k); if(v==null) return null; return t==="json"?JSON.parse(v):v; } async put(k,v){ this.m.set(k,v); } async delete(k){ this.m.delete(k); } }
const base = { APP_URL:"https://zokaas.github.io/nuts/", STRAVA_CLIENT_ID:"1", STRAVA_CLIENT_SECRET:"s" };
let pushes=[];
globalThis.fetch = async (u, o={}) => { u=String(u);
  if (u.endsWith("/api/v3/athlete")) return new Response(JSON.stringify({id:42}),{status:o.headers?.Authorization==="Bearer good"?200:401});
  if (u.includes("/oauth/token")) return new Response(JSON.stringify({access_token:"A",refresh_token:"R2",expires_at:9}),{status:200});
  if (u.includes("/athlete/activities")) return new Response(JSON.stringify([]),{status:200});
  if (u.startsWith("https://intervals.icu/api/v1/athlete/i123/wellness")) return o.headers.Authorization==="Basic "+btoa("API_KEY:goodkey123") ? new Response(JSON.stringify([{id:"2026-11-17",restingHR:54,hrv:77,sleepSecs:25740,sleepScore:80}]),{status:200}) : new Response("",{status:401});
  if (u.startsWith("https://push.example")) { pushes.push(o.headers.Authorization); return new Response("",{status:201}); }
  return new Response("?",{status:500}); };
const call=(path,opt={},env)=>w.fetch(new Request("https://nuts.x.workers.dev"+path,opt),env);

test("puuttuvat asetukset eivät kaada", async()=>{ const r=await call("/",{}, {}); assert.match(await r.text(), /asetukset puuttuvat/); });
test("varmuuskopio vaatii Strava-tunnistuksen ja toimii", async()=>{
  const env={...base, PALLAS_KV:new KV()};
  assert.strictEqual((await call("/backup",{method:"PUT",body:"{}",headers:{Authorization:"Bearer bad"}},env)).status,401);
  const r=await call("/backup",{method:"PUT",headers:{Authorization:"Bearer good","Content-Type":"application/json"},body:JSON.stringify({data:{logs:{"2026-11-17":{status:"done"}}},status:{upcoming:{},warnings:[]},refresh:"R"})},env);
  assert.strictEqual(r.status,200);
  const g=await (await call("/backup",{headers:{Authorization:"Bearer good"}},env)).json();
  assert.strictEqual(g.logs["2026-11-17"].status,"done"); assert.ok(g.savedAt);
});
test("ilmoitus: VAPID-avain, tilaus ja testi-ilmoitus", async()=>{
  const env={...base, PALLAS_KV:new KV()}; pushes=[];
  const k=await (await call("/push/key",{},env)).json(); assert.strictEqual(k.key.length,87);
  await call("/push/subscribe",{method:"POST",headers:{Authorization:"Bearer good"},body:JSON.stringify({endpoint:"https://push.example/abc"})},env);
  const t=await (await call("/push/test",{method:"POST",headers:{Authorization:"Bearer good"}},env)).json(); assert.strictEqual(t.ok,true);
  assert.match(pushes[0], /^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=/);
});
test("iltatarkistus: kirjaamaton treeni lähettää ilmoituksen kerran", async()=>{
  const kv=new KV(); const env={...base, PALLAS_KV:kv}; pushes=[];
  const d=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Helsinki"}).format(new Date());
  await kv.put("users",JSON.stringify(["42"])); await kv.put("sub:42",JSON.stringify({endpoint:"https://push.example/x"}));
  await kv.put("status:42",JSON.stringify({upcoming:{[d]:{code:"J",label:"Juoksu"}},warnings:[{level:"warn",title:"Kirjasit kipua"}]}));
  await kv.put("backup:42",JSON.stringify({logs:{}}));
  const waits=[]; const ctx={waitUntil:p=>waits.push(p)};
  await w.scheduled({force:true},env,ctx); await Promise.all(waits);
  assert.strictEqual(pushes.length,1);
  const msg=JSON.parse([...kv.m.entries()].find(([k])=>k.startsWith("msg:"))[1]); assert.match(msg.body,/kirjaamatta/); assert.match(msg.body,/kipua/);
  waits.length=0; await w.scheduled({force:true},env,ctx); await Promise.all(waits); assert.strictEqual(pushes.length,1);
});

test("iltatarkistus: muistutus ennen pitkää lenkkiä", async()=>{
  const kv=new KV(); const env={...base, PALLAS_KV:kv}; pushes=[];
  const d=new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Helsinki"}).format(new Date());
  const t=new Date(d+"T12:00:00Z"); t.setUTCDate(t.getUTCDate()+1); const tm=t.toISOString().slice(0,10);
  await kv.put("users",JSON.stringify(["42"])); await kv.put("sub:42",JSON.stringify({endpoint:"https://push.example/x"}));
  await kv.put("status:42",JSON.stringify({upcoming:{[d]:{code:"L",label:"Lepo"},[tm]:{code:"P",label:"Pitkä lenkki",text:"Pitkä lenkki 1,5 h rauhallisesti"}},warnings:[]}));
  await kv.put("backup:42",JSON.stringify({logs:{}}));
  const waits=[]; const ctx={waitUntil:p=>waits.push(p)};
  await w.scheduled({force:true},env,ctx); await Promise.all(waits);
  assert.strictEqual(pushes.length,1);
  const msg=JSON.parse([...kv.m.entries()].find(([k])=>k.startsWith("msg:"))[1]); assert.match(msg.body,/pitkä lenkki \(1 h 30 min\)/); assert.match(msg.body,/geeli/);
});

test("sunnuntain viikkokatsaus", async()=>{
  const kv=new KV(); const env={...base, PALLAS_KV:kv}; pushes=[];
  const sun="2026-11-22", add=n=>{ const t=new Date(sun+"T12:00:00Z"); t.setUTCDate(t.getUTCDate()+n); return t.toISOString().slice(0,10); };
  const up={}; for(let k=-6;k<=7;k++) up[add(k)]={code:[0,3,5].includes((k+7)%7)?"L":"J",label:"Juoksu",text:"Juoksu 30 min"};
  up[add(6)]={code:"P",label:"Pitkä lenkki",text:"Pitkä lenkki 50 min"}; up[add(5)].note="Pikkujoulut";
  await kv.put("users",JSON.stringify(["42"])); await kv.put("sub:42",JSON.stringify({endpoint:"https://push.example/x"}));
  await kv.put("status:42",JSON.stringify({upcoming:up,weeks:{[add(-6)]:{w:1,tgt:8},[add(1)]:{w:2,tgt:10}},warnings:[]}));
  await kv.put("backup:42",JSON.stringify({logs:{[add(-5)]:{status:"done",type:"J",km:3.5},[add(-3)]:{status:"done",type:"S"},[add(0)]:{status:"done",type:"J",km:4}}}));
  const waits=[]; const ctx={waitUntil:p=>waits.push(p)};
  await w.scheduled({force:true,date:sun},env,ctx); await Promise.all(waits);
  assert.strictEqual(pushes.length,1);
  const msg=JSON.parse([...kv.m.entries()].find(([k])=>k.startsWith("msg:"))[1]);
  assert.strictEqual(msg.title,"Viikon katsaus"); assert.match(msg.body,/Vk 1: 3\/\d treeniä, 7,5 \/ 8 km/); assert.match(msg.body,/Ensi viikko: .*tavoite 10 km.*pitkä lenkki la 50 min/); assert.match(msg.body,/Pikkujoulut/);
});

test("Intervals.icu-hyvinvointidata välitetään ja validoidaan", async()=>{
  const env={...base};
  const post=b=>call("/icu/wellness",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(b)},env);
  const ok=await (await post({athlete:"i123",key:"goodkey123",oldest:"2026-11-10",newest:"2026-11-18"})).json();
  assert.deepStrictEqual(ok[0],{d:"2026-11-17",rhr:54,hrv:77,sleep:25740,score:80,steps:null});
  assert.strictEqual((await post({athlete:"i123",key:"badkey1234",oldest:"2026-11-10",newest:"2026-11-18"})).status,401);
  assert.strictEqual((await post({athlete:"../x",key:"goodkey123",oldest:"2026-11-10",newest:"2026-11-18"})).status,400);
});
