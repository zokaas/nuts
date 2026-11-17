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
