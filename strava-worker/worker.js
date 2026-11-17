/**
 * Matka Pallakselle – välipalvelin (Cloudflare Worker)
 *
 * 1) Strava: säilyttää salaisen avaimen, hoitaa kirjautumisen ja treenien haun.
 * 2) Pilvivarmuuskopio: tallentaa sovelluksen tiedot (KV-tallennustila PALLAS_KV).
 * 3) Ilmoitukset: Web Push -tilaukset ja iltatarkistus (cron).
 *
 * Käyttäjä tunnistetaan Strava-tokenilla: vain Stravaan kirjautunut omistaja pääsee omiin tietoihinsa.
 *
 * Ympäristö (wrangler.toml + Cloudflare): APP_URL, STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET (Secret), PALLAS_KV (KV-sidonta)
 */
const STRAVA = "https://www.strava.com";
const enc = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
async function sha256(s) { return b64u(await crypto.subtle.digest("SHA-256", enc.encode(s))); }

function helsinkiNow() {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Helsinki", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", hour12: false }).formatToParts(new Date()).map(x => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour };
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const missing = ["APP_URL", "STRAVA_CLIENT_ID", "STRAVA_CLIENT_SECRET"].filter(k => !env[k]);
    let app; try { app = new URL(env.APP_URL); } catch { app = null; }
    if (missing.length || !app) {
      return new Response(
        `Matka Pallakselle – Strava-välipalvelin on käynnissä, mutta asetukset puuttuvat: ${missing.join(", ") || "APP_URL (virheellinen osoite)"}.\n` +
        `Lisää ne Cloudflaressa: Workers & Pages → nuts → Settings → Variables and Secrets.`,
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
    const cors = {
      "Access-Control-Allow-Origin": app.origin,
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Vary": "Origin",
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
    const back = (frag) => Response.redirect(`${env.APP_URL}#${frag}`, 302);
    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    /* ---------- Strava ---------- */
    if (url.pathname === "/auth/start") {
      const state = (url.searchParams.get("state") || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
      const p = new URLSearchParams({ client_id: env.STRAVA_CLIENT_ID, response_type: "code", redirect_uri: `${url.origin}/auth/callback`, approval_prompt: "auto", scope: "read,activity:read_all", state });
      return Response.redirect(`${STRAVA}/oauth/authorize?${p}`, 302);
    }
    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code"); const state = url.searchParams.get("state") || "";
      if (!code) return back("strava-virhe");
      const r = await fetch(`${STRAVA}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, code, grant_type: "authorization_code" }) });
      if (!r.ok) return back("strava-virhe");
      const t = await r.json();
      const payload = { a: t.access_token, r: t.refresh_token, e: t.expires_at, n: (t.athlete && t.athlete.firstname) || "", s: state, w: url.origin };
      return back(`strava=${encodeURIComponent(JSON.stringify(payload))}`);
    }
    if (url.pathname === "/token" && req.method === "POST") {
      let body; try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
      if (!body.refresh_token) return json({ error: "bad_request" }, 400);
      const t = await refresh(env, body.refresh_token);
      if (!t) return json({ error: "refresh_failed" }, 401);
      return json({ a: t.access_token, r: t.refresh_token, e: t.expires_at });
    }
    if (url.pathname === "/activities" && req.method === "GET") {
      const auth = req.headers.get("Authorization");
      if (!auth) return json({ error: "unauthorized" }, 401);
      const r = await fetch(`${STRAVA}/api/v3/athlete/activities${url.search}`, { headers: { Authorization: auth } });
      return new Response(await r.text(), { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
    }

    /* ---------- Tallennustilaa vaativat reitit ---------- */
    const kvRoutes = ["/backup", "/push/key", "/push/subscribe", "/push/pending", "/push/test"];
    if (kvRoutes.includes(url.pathname)) {
      const kv = env.PALLAS_KV;
      if (!kv) return json({ error: "no_storage", message: "PALLAS_KV-tallennustila puuttuu" }, 503);

      if (url.pathname === "/push/key") return json({ key: (await vapid(kv)).pub });
      if (url.pathname === "/push/pending") {
        const k = (url.searchParams.get("k") || "").slice(0, 64);
        const m = k && await kv.get(`msg:${k}`, "json");
        return json(m || { title: "Matka Pallakselle", body: "Avaa sovellus ja katso päivän tilanne." });
      }

      const who = await athlete(req, kv);
      if (!who) return json({ error: "unauthorized" }, 401);

      if (url.pathname === "/backup" && req.method === "GET") {
        const d = await kv.get(`backup:${who}`, "json");
        return d ? json(d) : json({ error: "not_found" }, 404);
      }
      if (url.pathname === "/backup" && req.method === "PUT") {
        let b; try { b = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
        if (!b || typeof b.data !== "object") return json({ error: "bad_request" }, 400);
        const savedAt = new Date().toISOString();
        await kv.put(`backup:${who}`, JSON.stringify({ ...b.data, savedAt }));
        if (b.status) await kv.put(`status:${who}`, JSON.stringify(b.status));
        if (b.refresh) await kv.put(`refresh:${who}`, b.refresh);
        await addUser(kv, who);
        return json({ ok: true, savedAt });
      }
      if (url.pathname === "/push/subscribe" && req.method === "POST") {
        let s; try { s = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
        if (!s || !s.endpoint) return json({ error: "bad_request" }, 400);
        await kv.put(`sub:${who}`, JSON.stringify(s)); await addUser(kv, who);
        return json({ ok: true });
      }
      if (url.pathname === "/push/subscribe" && req.method === "DELETE") { await kv.delete(`sub:${who}`); return json({ ok: true }); }
      if (url.pathname === "/push/test" && req.method === "POST") {
        const r = await notify(env, kv, who, { title: "Matka Pallakselle", body: "Ilmoitukset toimivat! 🦌" });
        return json({ ok: r === true, status: r });
      }
    }
    return new Response("Matka Pallakselle – Strava-välipalvelin toimii.", { headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
  },

  /* ---------- Iltatarkistus ---------- */
  async scheduled(event, env, ctx) {
    const kv = env.PALLAS_KV; if (!kv) return;
    const now = helsinkiNow();
    if (now.hour !== 20 && !event.force) return; // kaksi cronia kattavat kesä- ja talviajan
    const users = (await kv.get("users", "json")) || [];
    for (const who of users) ctx.waitUntil(evening(env, kv, who, now.date));
  },
};

async function evening(env, kv, who, date) {
  if (await kv.get(`sent:${who}:${date}`)) return;
  const [status, backup] = await Promise.all([kv.get(`status:${who}`, "json"), kv.get(`backup:${who}`, "json")]);
  if (!status) return;
  const lines = [];
  const up = status.upcoming && status.upcoming[date];
  const log = backup && backup.logs && backup.logs[date];
  const logged = log && ["done", "skip", "moved"].includes(log.status);
  if (up && up.code !== "L" && !logged) {
    const did = await stravaToday(env, kv, who, date);
    if (did) lines.push(`Stravassa on tämän päivän treeni (${did}). Avaa sovellus ja lisää fiilis.`);
    else lines.push(`Tämän päivän ${up.label.toLowerCase()} on kirjaamatta.`);
  }
  const seen = (await kv.get(`warned:${who}`, "json")) || [];
  const fresh = (status.warnings || []).filter(w => (w.level === "crit" || w.level === "warn") && !seen.includes(w.title));
  if (fresh.length) { lines.push(fresh[0].title + "."); await kv.put(`warned:${who}`, JSON.stringify(seen.concat(fresh.map(w => w.title)).slice(-50))); }
  const tomorrow = status.upcoming && status.upcoming[nextDate(date)];
  if (tomorrow && ["X", "R"].includes(tomorrow.code)) lines.push(`Huomenna: ${tomorrow.label}.`);
  if (!lines.length) return;
  const r = await notify(env, kv, who, { title: "Matka Pallakselle", body: lines.join(" ") });
  if (r === true) await kv.put(`sent:${who}:${date}`, "1", { expirationTtl: 60 * 60 * 36 });
}
function nextDate(d) { const t = new Date(d + "T12:00:00Z"); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); }

async function refresh(env, rt) {
  const r = await fetch(`${STRAVA}/oauth/token`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, refresh_token: rt, grant_type: "refresh_token" }) });
  return r.ok ? r.json() : null;
}
async function stravaToday(env, kv, who, date) {
  try {
    const rt = await kv.get(`refresh:${who}`); if (!rt) return null;
    const t = await refresh(env, rt); if (!t) return null;
    if (t.refresh_token && t.refresh_token !== rt) await kv.put(`refresh:${who}`, t.refresh_token);
    const after = Math.floor(new Date(date + "T00:00:00Z").getTime() / 1000) - 3 * 3600;
    const r = await fetch(`${STRAVA}/api/v3/athlete/activities?after=${after}&per_page=10`, { headers: { Authorization: `Bearer ${t.access_token}` } });
    if (!r.ok) return null;
    const acts = (await r.json()).filter(a => (a.start_date_local || "").slice(0, 10) === date);
    return acts.length ? acts[0].name || acts[0].sport_type : null;
  } catch { return null; }
}

/* Käyttäjä Strava-tokenista (välimuisti 1 h) */
async function athlete(req, kv) {
  const auth = req.headers.get("Authorization") || ""; if (!auth.startsWith("Bearer ")) return null;
  const h = await sha256(auth); const c = await kv.get(`tok:${h}`); if (c) return c;
  const r = await fetch(`${STRAVA}/api/v3/athlete`, { headers: { Authorization: auth } });
  if (!r.ok) return null;
  const a = await r.json(); if (!a || !a.id) return null;
  await kv.put(`tok:${h}`, String(a.id), { expirationTtl: 3600 });
  return String(a.id);
}
async function addUser(kv, who) { const u = (await kv.get("users", "json")) || []; if (!u.includes(who)) { u.push(who); await kv.put("users", JSON.stringify(u)); } }

/* ---------- Web Push (VAPID, ilman sisältöä: palvelutyö hakee viestin /push/pending) ---------- */
async function vapid(kv) {
  const have = await kv.get("vapid", "json"); if (have) return have;
  const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
  const v = { pub: b64u(await crypto.subtle.exportKey("raw", kp.publicKey)), jwk: await crypto.subtle.exportKey("jwk", kp.privateKey) };
  await kv.put("vapid", JSON.stringify(v)); return v;
}
async function vapidAuth(kv, endpoint) {
  const v = await vapid(kv);
  const key = await crypto.subtle.importKey("jwk", v.jwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const head = b64u(enc.encode(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const body = b64u(enc.encode(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "https://zokaas.github.io/nuts/" })));
  const sig = b64u(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(`${head}.${body}`)));
  return `vapid t=${head}.${body}.${sig}, k=${v.pub}`;
}
async function notify(env, kv, who, msg) {
  const sub = await kv.get(`sub:${who}`, "json"); if (!sub) return "no_subscription";
  const k = await sha256(sub.endpoint);
  await kv.put(`msg:${k}`, JSON.stringify(msg), { expirationTtl: 60 * 60 * 48 });
  const r = await fetch(sub.endpoint, { method: "POST", headers: { Authorization: await vapidAuth(kv, sub.endpoint), TTL: "43200", Urgency: "normal", "Content-Length": "0" } });
  if (r.status === 404 || r.status === 410) { await kv.delete(`sub:${who}`); return "expired"; }
  return r.ok ? true : `http_${r.status}`;
}
