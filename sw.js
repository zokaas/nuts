// Matka Pallakselle – offline-välimuisti
const CACHE = "pallas-v19";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request; if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (req.mode === "navigate" || url.pathname.endsWith("index.html"))) {
    // Sivu: verkko ensin (päivitykset tulevat), välimuisti varalla
    e.respondWith(fetch(req).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put("./index.html", c)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  // Muut (ikonit, fontit): välimuisti ensin
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(r => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; })));
});

// Ilmoitukset: viesti haetaan välipalvelimelta (push ilman sisältöä)
async function sha256b64u(t){ const h=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(t)); return btoa(String.fromCharCode(...new Uint8Array(h))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
self.addEventListener("push", e => {
  e.waitUntil((async () => {
    let msg = { title: "Matka Pallakselle", body: "Avaa sovellus ja katso päivän tilanne." };
    try {
      const cfg = await (await caches.open("pallas-config")).match("./config.json").then(r => r && r.json());
      const sub = await self.registration.pushManager.getSubscription();
      if (cfg && sub) { const k = await sha256b64u(sub.endpoint); const r = await fetch(`${cfg.worker}/push/pending?k=${k}`); if (r.ok) msg = await r.json(); }
    } catch (err) {}
    await self.registration.showNotification(msg.title, { body: msg.body, icon: "./icons/icon-192.png", badge: "./icons/icon-192.png", tag: "pallas-ilta" });
  })());
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window" }).then(cs => { for (const c of cs) { if ("focus" in c) return c.focus(); } return self.clients.openWindow("./#tanaan"); }));
});
