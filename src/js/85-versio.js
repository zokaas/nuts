/* ===== Versio ja päivitysilmoitus =====
   build.py kirjoittaa version.json-tiedoston ja BUILD-vakion. Kotinäytön sovellus voi jäädä
   muistiin vanhana päiviksi, joten tarkistetaan uusi versio aina kun sovellus tulee esiin. */
function verText(){ if(typeof BUILD==="undefined") return "Kehitysversio"; const d=new Date(BUILD.built);
  return `Versio ${d.toLocaleDateString("fi-FI")} klo ${d.toLocaleTimeString("fi-FI",{hour:"2-digit",minute:"2-digit"})} · ${BUILD.hash}`; }
let updSeen=false;
async function checkUpdate(manual){ if(typeof BUILD==="undefined"||!location.protocol.startsWith("http")) return false;
  try{ const r=await fetch(`version.json?t=${Date.now()}`,{cache:"no-store"}); if(!r.ok) throw 0; const j=await r.json();
    if(j.hash&&j.hash!==BUILD.hash){ $("updBar").hidden=false; updSeen=true; return true; }
    if(manual) toast("Sinulla on uusin versio."); return false;
  }catch(e){ if(manual) toast("Päivitystä ei voitu tarkistaa. Onko verkko päällä?"); return false; } }
function startUpdateCheck(){
  setTimeout(()=>checkUpdate(false),3000);
  setInterval(()=>{ if(!document.hidden&&!updSeen) checkUpdate(false); },30*60000);
  document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&!updSeen){ checkUpdate(false); navigator.serviceWorker?.getRegistration().then(r=>r&&r.update()).catch(()=>{}); } });
  $("updGo").onclick=()=>{ $("updGo").disabled=true; $("updGo").textContent="Päivitetään…"; location.reload(); };
  $("verCheck").onclick=()=>checkUpdate(true);
  $("verLine").textContent=verText(); }
