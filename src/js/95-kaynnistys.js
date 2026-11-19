/* ---------- käynnistys ---------- */
window.addEventListener("hashchange",()=>{ if(!keepSel) selDay=null; keepSel=false; statusOpen=false; calScrolled=false; render(); if(route()!=="kalenteri") window.scrollTo(0,0); });
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&!edit){ selDay=null; render(); if(stravaConnected() && (!strava.lastSync || Date.now()-new Date(strava.lastSync).getTime()>30*60000)) syncStrava(false); } });
window.addEventListener("storage",()=>{ logs=load(LS_LOGS,{}); adjOff=load(LS_ADJ,{}); edits=load(LS_EDITS,{}); weekScale=load(LS_SCALE,{}); shoes=load(LS_SHOES,[]); gear=load(LS_GEAR,{}); if(!edit) render(); });
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
$("installHint").hidden = !!standalone;
$("edX").onclick=()=>closeEditor();
