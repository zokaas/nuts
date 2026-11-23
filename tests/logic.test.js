// Aja: node --test tests/*.test.js
const test = require("node:test");
const assert = require("node:assert");
const L = require("../src/logic.js");
const plan = require("../src/plan.json");
const iso = L.isoOfIdx;
function filled(today, extra = {}) { const logs = {}; for (let k = 0; k < today; k++) if (plan[k][0] !== "L") logs[iso(k)] = { status: "done", km: 5, feel: 4 }; return Object.assign(logs, extra); }

test("ohjelma kattaa 17.11.2026–23.7.2027", () => {
  assert.strictEqual(plan.length, 249);
  assert.strictEqual(iso(plan.length - 1), "2027-07-23");
  assert.strictEqual(plan[L.idxOfISO("2027-04-18")][0], "R");
});
test("sairaus: lepo tänään ja huomenna, sitten kevyt paluu", () => {
  const t = L.idxOfISO("2027-03-17");
  const logs = filled(t, { [iso(t)]: { status: "note", flags: ["sick"] } });
  const ad = L.buildAdapt(plan, logs, {}, t);
  assert.strictEqual(ad[t].code, "L"); assert.strictEqual(ad[t + 1].code, "L");
  const next = Object.keys(ad).map(Number).find(i => i > t + 1 && ad[i].kind === "sick");
  assert.ok(next && /Paluu sairastelusta/.test(ad[next].reason));
});
test("kova kipu: ei juoksua 3 päivään", () => {
  const t = L.idxOfISO("2027-02-24");
  const logs = filled(t, { [iso(t)]: { status: "done", km: 5, flags: ["pain"], painLevel: 3, painArea: "sääri" } });
  const ad = L.buildAdapt(plan, logs, {}, t);
  const runs = [t + 1, t + 2, t + 3].filter(i => L.RUN.has(plan[i][0]));
  for (const i of runs) assert.strictEqual(ad[i].code, "S", `päivä ${iso(i)}`);
});
test("kolme väliin jäänyttä: kevennys 80 %", () => {
  const t = L.idxOfISO("2027-02-17");
  const logs = filled(t); [t - 1, t - 2, t - 3, t - 4].forEach(i => { if (plan[i][0] !== "L") logs[iso(i)] = { status: "skip" }; });
  const ad = L.buildAdapt(plan, logs, {}, t);
  assert.ok(Object.values(ad).some(a => a.kind === "missed"));
  assert.ok(L.computeWarnings(plan, logs, ad, t).some(w => w.level === "crit"));
});
test("väsymys: mäkivedot vaihtuvat kevyeksi", () => {
  const t = L.idxOfISO("2027-02-23"); // mäkivedot 8×1 min
  const logs = filled(t, { [iso(t)]: { status: "note", flags: ["sleep", "stress"] } });
  const ad = L.buildAdapt(plan, logs, {}, t);
  assert.ok(ad[t] && ad[t].kind === "tired" && /ei vetoja/.test(ad[t].text));
});
test("kisapäivää ei muuteta", () => {
  const t = L.idxOfISO("2027-04-18");
  const logs = filled(t, { [iso(t - 1)]: { status: "note", flags: ["pain"], painLevel: 3, painArea: "polvi" } });
  const ad = L.buildAdapt(plan, logs, {}, t);
  assert.ok(!ad[t] || ad[t].code === "R");
});
test("scaleText säilyttää lihaskunnon ja skaalaa", () => {
  assert.strictEqual(L.scaleText("JL", "7 km kynnysvauhtia. Perään lihaskunto D (10 min).", 0.8, true), "6 km hyvin kevyesti, ei vetoja. Perään lihaskunto D.");
  assert.match(L.scaleText("P", "2,5 h rauhallisesti polulla", 0.6, true), /1,5 h/);
});
test("viikon km lasketaan myös Strava-lisätreeneistä", () => {
  const logs = { "2026-11-23": { status: "done", km: 4 }, "2026-11-24~s9": { status: "done", km: 3, type: "J" } };
  assert.strictEqual(L.weekKm(plan, logs, 2), 7);
});
test("kuume: paluu vähintään viikko, nuha 3 pv", () => {
  assert.strictEqual(L.sickRec(1, false), 3); assert.strictEqual(L.sickRec(1, true), 7); assert.strictEqual(L.sickRec(9, true), 14);
  const t = L.idxOfISO("2027-03-17");
  const logs = filled(t, { [iso(t)]: { status: "note", flags: ["sick", "fever"] } });
  const ad = L.buildAdapt(plan, logs, {}, t);
  const ret = Object.keys(ad).map(Number).filter(i => i > t + 1 && ad[i].kind === "sick");
  assert.ok(ret.length && Math.max(...ret) > t + 4 && Math.max(...ret) <= t + 7);
});
test("kynnystreeni kevenee väsyneenä", () => {
  assert.ok(L.hasIntensity("10 km polulla: 2 × 20 min kynnysvauhtia"));
  assert.ok(L.hasIntensity("Viimeinen tunti tavoiteteholla"));
});

test("planMin: toistot eivät ole kesto, km juoksuun, lihaskunto mukaan; jokainen ohjelmaviikko ≥ 4 h", () => {
  const { planMin, WEEK_MIN } = L;
  assert.equal(planMin("K", "Kuntopiiri 30 min + sykkeen nosto: 8× 1 min ylämäkeen kovaa"), 30);
  assert.equal(planMin("JL", "7 km, mäkivedot 8×1 min. Perään lihaskunto D (10 min)."), 63);
  assert.equal(planMin("P", "Pitkä 3–3,5 h polulla."), 195);
  assert.equal(planMin("L", "Kävely käy."), 0);
  const plan = require("../src/plan.json");
  for (let w = 2; w <= 36; w++) { const a = (w - 1) * 7 - 1; let s = 0; for (let i = Math.max(a, 6); i <= a + 6 && i < plan.length; i++) s += planMin(plan[i][0], plan[i][1]); assert.ok(s >= WEEK_MIN, `viikko ${w - 1}: ${s} min`); }
});

test("kirjaamaton kävely ei ole väliin jäänyt treeni", () => {
  const plan = [["L", ""], ["KA", "Kävely 30 min"], ["KA", "Kävely 30 min"], ["KA", "Kävely 30 min"], ["J", "30 min"]];
  const w = L.computeWarnings(plan, {}, {}, 4);
  assert.ok(!w.some(x => /väliin|kirjaamatta/.test(x.title)), JSON.stringify(w));
});

test("alamäkivalmistelu: portaat alas helmikuusta, alamäkiohjeet kevään polkulenkeillä", () => {
  const plan = require("../src/plan.json");
  const ym = plan.map((r, i) => [i, r]).filter(([i, r]) => i >= 69 && r[0] === "YM");
  assert.ok(ym.length >= 3 && ym.every(([, r]) => !/hissillä\./.test(r[1]) || /ei hissillä/.test(r[1])));
  assert.ok(plan.filter(r => r[0] === "P" && /Alamäet juosten/.test(r[1])).length >= 5);
});
