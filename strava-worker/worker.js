/**
 * Matka Pallakselle – Strava-välipalvelin (Cloudflare Worker)
 *
 * Tehtävä: säilyttää Stravan salainen avain (client secret) turvassa.
 * Sovellus (GitHub Pages) ei voi säilyttää salaisuuksia, koska sen koodi on julkinen.
 *
 * Ympäristömuuttujat (Cloudflare → Worker → Settings → Variables and Secrets):
 *   STRAVA_CLIENT_ID      esim. 123456                      (Text)
 *   STRAVA_CLIENT_SECRET  Stravan antama salainen avain     (Secret!)
 *   APP_URL               https://zokaas.github.io/nuts/    (Text)
 *
 * Reitit:
 *   GET  /auth/start?state=…   → ohjaa Stravan kirjautumiseen
 *   GET  /auth/callback        → vaihtaa koodin tokeneiksi ja palaa sovellukseen
 *   POST /token                → uusii vanhentuneen access tokenin (refresh token)
 *   GET  /activities?…         → hakee treenit Stravasta (välittää Authorization-otsakkeen)
 */
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
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Vary": "Origin",
    };
    const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { ...cors, "Content-Type": "application/json" } });
    const back = (frag) => Response.redirect(`${env.APP_URL}#${frag}`, 302);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    if (url.pathname === "/auth/start") {
      const state = (url.searchParams.get("state") || "").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 64);
      const p = new URLSearchParams({
        client_id: env.STRAVA_CLIENT_ID,
        response_type: "code",
        redirect_uri: `${url.origin}/auth/callback`,
        approval_prompt: "auto",
        scope: "read,activity:read_all",
        state,
      });
      return Response.redirect(`https://www.strava.com/oauth/authorize?${p}`, 302);
    }

    if (url.pathname === "/auth/callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state") || "";
      if (!code) return back("strava-virhe");
      const r = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, code, grant_type: "authorization_code" }),
      });
      if (!r.ok) return back("strava-virhe");
      const t = await r.json();
      const payload = { a: t.access_token, r: t.refresh_token, e: t.expires_at, n: (t.athlete && t.athlete.firstname) || "", s: state };
      return back(`strava=${encodeURIComponent(JSON.stringify(payload))}`);
    }

    if (url.pathname === "/token" && req.method === "POST") {
      let body; try { body = await req.json(); } catch { return json({ error: "bad_request" }, 400); }
      if (!body.refresh_token) return json({ error: "bad_request" }, 400);
      const r = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: env.STRAVA_CLIENT_ID, client_secret: env.STRAVA_CLIENT_SECRET, refresh_token: body.refresh_token, grant_type: "refresh_token" }),
      });
      const t = await r.json();
      if (!r.ok) return json({ error: "refresh_failed" }, 401);
      return json({ a: t.access_token, r: t.refresh_token, e: t.expires_at });
    }

    if (url.pathname === "/activities" && req.method === "GET") {
      const auth = req.headers.get("Authorization");
      if (!auth) return json({ error: "unauthorized" }, 401);
      const r = await fetch(`https://www.strava.com/api/v3/athlete/activities${url.search}`, { headers: { Authorization: auth } });
      return new Response(await r.text(), { status: r.status, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response("Matka Pallakselle – Strava-välipalvelin toimii.", { headers: { ...cors, "Content-Type": "text/plain; charset=utf-8" } });
  },
};
