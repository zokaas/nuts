// Käyttöliittymätestit oikealla selaimella (Playwright, puhelimen kokoinen näkymä).
// Aja: python3 build.py && node --test tests/
// Paikallisesti voi käyttää asennettua Chromea: CHROME=/usr/bin/google-chrome node --test tests/
import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
// require löytää myös globaalisti asennetun Playwrightin (NODE_PATH); CI asentaa sen package.jsonin kautta
const { chromium } = createRequire(import.meta.url)("playwright");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webmanifest": "application/manifest+json", ".png": "image/png" };

let server, base, browser;
test.before(async () => {
  server = http.createServer((req, res) => {
    const p = path.join(ROOT, decodeURIComponent(new URL(req.url, "http://x").pathname).replace(/^\/$/, "/index.html"));
    if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { "content-type": TYPES[path.extname(p)] || "application/octet-stream" }); fs.createReadStream(p).pipe(res);
  });
  await new Promise(r => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME, args: ["--no-sandbox"] } : {});
});
test.after(async () => { await browser?.close(); server?.close(); });

/** Avaa sovelluksen annettuna päivänä annetulla tallennetulla datalla. Palauttaa sivun ja virhelistan. */
async function open({ date = "2026-11-23T08:00:00", hash = "tanaan", logs = {}, meta = { hr: { age: 35 } }, scheme = "light", version } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, colorScheme: scheme, serviceWorkers: "block" });
  await ctx.addInitScript(([l, m]) => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.clear(); localStorage.setItem("pallas.logs.v1", l); localStorage.setItem("pallas.meta.v1", m); } }, [JSON.stringify(logs), JSON.stringify(meta)]);
  // Ulkoiset palvelut (sää, fontit, Strava) eivät kuulu testiin
  await ctx.route(/^https:\/\//, r => r.fulfill({ status: 200, contentType: "application/json", body: "[]", headers: { "Access-Control-Allow-Origin": "*" } }));
  if (version) await ctx.route(/version\.json/, r => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(version) }));
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.clock.setFixedTime(new Date(date));
  await page.goto(`${base}/index.html#${hash}`); await page.waitForTimeout(400);
  return { page, errors, ctx };
}
const meta = page => page.evaluate(() => JSON.parse(localStorage.getItem("pallas.meta.v1")));
const logs = page => page.evaluate(() => JSON.parse(localStorage.getItem("pallas.logs.v1") || "{}"));

test("kaikki näkymät aukeavat ilman virheitä, vaalea ja tumma", async () => {
  for (const scheme of ["light", "dark"]) {
    const { page, errors, ctx } = await open({ scheme });
    for (const r of ["tanaan", "kalenteri", "historia", "analyysi", "opas", "merkit", "asetukset", "ohje"]) {
      await page.evaluate(h => { location.hash = h; }, r); await page.waitForTimeout(150);
      assert.equal(await page.evaluate(() => document.body.dataset.route), r);
    }
    assert.deepEqual(errors, [], `${scheme}: ${errors.join(" | ")}`); await ctx.close();
  }
});

test("ohjelma alkaa ma 23.11.: aiemmat päivät piilossa ja aiemmat kirjaukset tyhjennetty (tehtävät säilyvät)", async () => {
  const old = { hr: { age: 35 }, habMig: 5, hab: { "2026-11-19": { hera: 1, veri1: 1 }, "2026-11-20": { dvit: 1 } },
    habits: [{ id: "hera", ic: "🌅", name: "Verenkierron herättely 5 min", when: "aamu", sched: [{ from: "2026-11-19", days: "all" }] },
             { id: "veri1", ic: "🩸", name: "Verikoe", task: true, when: "päivä", sched: [{ from: "2026-11-19", to: "2026-12-31" }] }] };
  const { page, errors, ctx } = await open({ date: "2026-11-22T10:00:00", meta: old, logs: { "2026-11-19": { status: "done", km: 4 }, "2026-11-23": { status: "note", flags: [] } } });
  assert.match(await page.textContent("#today"), /Ohjelma alkaa huomenna/);
  const days = await page.$$eval(".strip .sd .dn", els => els.map(e => e.textContent.trim()).filter(Boolean));
  assert.ok(!["17", "18", "19", "20", "21", "22"].some(d => days.includes(d)), days.join(","));
  const m = await meta(page), l = await logs(page);
  assert.deepEqual(m.hab, { "2026-11-19": { veri1: 1 } }); assert.equal(l["2026-11-19"], undefined); assert.ok(l["2026-11-23"]);
  assert.equal(m.habits.find(h => h.id === "hera").sched[0].from, "2026-11-23"); assert.ok(m.habits.some(h => h.id === "kasvot"));
  await page.evaluate(() => { location.hash = "kalenteri"; }); await page.waitForTimeout(200);
  assert.match(await page.textContent("#calBody"), /Vk 2\s*23\.11\.–29\.11\./); assert.doesNotMatch(await page.textContent("#calBody"), /Vk 1\b/);
  await ctx.close();
  const b = await open();
  assert.match(await b.page.textContent("#today"), /Ensimmäinen treeni/); assert.match(await b.page.textContent("#habits"), /Kasvot illalla/);
  assert.ok(await b.page.isHidden("#summary"));
  assert.deepEqual([...errors, ...b.errors], []); await b.ctx.close();
});

test("tarkistuspiste 1 (30 min yhtäjaksoista) on pe 4.12.", async () => {
  const { page, ctx } = await open({ hash: "kalenteri" });
  const plan = await page.evaluate(() => JSON.parse(document.getElementById("plan").textContent));
  assert.equal(plan[17][0], "X"); assert.match(plan[17][2], /Tarkistuspiste 1/);
  assert.equal(await page.evaluate(() => CPS.find(c => c.id === "c30").by), 17);
  await ctx.close();
});

test("sairastila: Vointi → Sairas käynnistää, Peru ja Olen terve samana päivänä perivät", async () => {
  const { page, errors, ctx } = await open();
  const markSick = async () => {
    await page.click("[data-mode=vointi]"); await page.click("[data-flag=sick]"); await page.click("#edSave"); await page.waitForTimeout(200);
  };
  await markSick();
  assert.ok(!(await page.isHidden("#sickCard"))); assert.equal((await meta(page)).sick.from, "2026-11-23");
  await page.click("#toast .tbtn"); await page.waitForTimeout(150);
  assert.equal((await meta(page)).sick, null); assert.equal((await logs(page))["2026-11-23"], undefined);
  await markSick(); await page.click("[data-sickoff]"); await page.waitForTimeout(150);
  assert.equal((await meta(page)).sick, null); assert.ok(await page.isHidden("#sickCard"));
  assert.deepEqual(errors, []); await ctx.close();
});

test("sairastila jatkuu itsestään seuraaville päiville ja paluu alkaa terveeksi merkitsemisestä", async () => {
  const { page, ctx } = await open({ meta: { hr: { age: 35 }, sick: { from: "2026-11-24", kind: "fever", auto: [] } }, date: "2026-11-26T08:00:00" });
  const l = await logs(page);
  for (const d of ["2026-11-24", "2026-11-25", "2026-11-26"]) assert.ok(l[d]?.flags.includes("fever"), d);
  await page.click("[data-sickoff]"); await page.waitForTimeout(150);
  const m = await meta(page); assert.equal(m.sick.to, "2026-11-25"); assert.equal(m.sick.rec, 7);
  assert.ok(!(await logs(page))["2026-11-26"]?.flags?.includes("sick"));
  await ctx.close();
});

test("teemat: marraskuussa vuodenaika = Kaamos, valinta tallentuu", async () => {
  const { page, ctx } = await open({ hash: "asetukset" });
  assert.equal(await page.evaluate(() => document.documentElement.dataset.pal), "kaamos");
  await page.click("[data-pal-pick=ruska]"); await page.click("[data-mode-pick=dark]");
  assert.equal(await page.evaluate(() => document.documentElement.dataset.pal), "ruska");
  assert.equal(await page.evaluate(() => document.documentElement.dataset.theme), "dark");
  const m = await meta(page); assert.equal(m.pal, "ruska"); assert.equal(m.mode, "dark");
  await ctx.close();
});

test("tavat: aamutavat näkyvät ja kuittaus tallentuu", async () => {
  const { page, ctx } = await open();
  const btn = page.locator('#habits [data-hab="hera"]').first();
  await btn.click(); await page.waitForTimeout(100);
  assert.equal((await meta(page)).hab["2026-11-23"].hera, 1);
  await ctx.close();
});

test("kuukausikatsaus näkyy kuun alussa ja piiloutuu", async () => {
  const { page, ctx } = await open({ date: "2026-12-02T09:00:00", logs: { "2026-11-23": { status: "done", km: 3, min: 32 } } });
  assert.match(await page.textContent("#monthCard"), /Marraskuu takana/);
  await page.click("[data-monseen]"); assert.ok(await page.isHidden("#monthCard"));
  await ctx.close();
});

test("päivitysilmoitus: uusi versio näyttää palkin, sama versio ei", async () => {
  const cur = JSON.parse(fs.readFileSync(path.join(ROOT, "version.json"), "utf8"));
  const a = await open({ version: cur }); await a.page.waitForTimeout(3300);
  assert.ok(await a.page.isHidden("#updBar")); await a.ctx.close();
  const b = await open({ version: { hash: "uusi1234", built: "2026-12-01T10:00:00Z" } }); await b.page.waitForTimeout(3300);
  assert.ok(!(await b.page.isHidden("#updBar"))); await b.ctx.close();
});

test("Nuts-tavoite 9 h näkyy kisasuunnitelmassa ja ultrajakso sisältää kynnys- ja mäkitreenit", async () => {
  const { page, errors, ctx } = await open({ hash: "opas" });
  assert.match(await page.textContent("#raceN"), /Tavoite:\s*alle 9 h 00 min \(keskivauhti alle 8:11\/km\), naisten top 30/);
  const plan = await page.evaluate(() => JSON.parse(document.getElementById("plan").textContent));
  const block = plan.slice(161, 248).map(r => r[1]).join(" ");
  assert.ok((block.match(/kynnysvauhtia/g) || []).length >= 4);
  assert.match(plan[206][1], /KISASIMULAATIO.*klo 15/); assert.equal(plan[208][0], "L");
  assert.ok((block.match(/ylämäkeen juosten/g) || []).length >= 3);
  assert.match(plan[221][1], /alle 3:25/);
  assert.deepEqual(errors, []); await ctx.close();
});

test("hiustenpesu vk 5→: maanantai ketokonatsoli, perjantai methi + mieto, vanha paikkamerkki korvautuu", async () => {
  const old = { hr: { age: 35 }, habMig: 4, habits: [{ id: "pesu", ic: "🧴", name: "Hiustenpesu", when: "päivä", week: 2, sched: [
    { from: "2026-11-19", to: "2026-12-13", days: { 0: { n: "x" } } }, { from: "2026-12-14", label: "Ylläpito (vk 5→)", days: { 0: { n: "Pesupäivä" }, 4: { n: "Pesupäivä" } }, todo: true }] }] };
  const { page, errors, ctx } = await open({ date: "2026-12-18T08:00:00", meta: old });
  const m = await meta(page); const sc = m.habits.find(h => h.id === "pesu").sched[1];
  assert.equal(m.habMig, 7); assert.ok(!sc.todo); assert.match(sc.days[4].n, /methi.*mieto/); assert.match(sc.days[0].n, /ketokonatsoli/);
  assert.match(await page.textContent("#habits"), /methi/);
  assert.deepEqual(errors, []); await ctx.close();
});
