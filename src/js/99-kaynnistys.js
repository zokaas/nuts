/* ---------- käynnistys: kaikki määritelty, nyt ajetaan ---------- */
handleStravaReturn();
applyTheme();
render();
loadWeather();
if(icu().key&&(!icu().last||Date.now()-icu().last>3*3600e3)) setTimeout(()=>icuSync(false),1500);
if(stravaConnected() && (!strava.lastSync || Date.now()-new Date(strava.lastSync).getTime()>30*60000)) setTimeout(()=>syncStrava(false),800);
if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
startUpdateCheck();
