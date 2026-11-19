/* ===== v10: teemat ===== */
const PALS=[{id:"kausi",n:"Vuodenaika",d:"vaihtuu itsestään"},{id:"tunturi",n:"Tunturi",d:"jäkälä ja lakka",bg:"#e9ece5",ac:"#1d5b6c",hl:"#d99a1e"},
  {id:"ruska",n:"Ruska",d:"puolukka ja koivunlehti",bg:"#efe8e6",ac:"#972a3b",hl:"#c98a1c"},
  {id:"kaamos",n:"Kaamos",d:"sininen hetki",bg:"#e6e9f1",ac:"#34449a",hl:"#1f9d78"}];
function seasonPal(d=new Date()){ const k=d.getMonth(); return (k>=10||k<=0)?"kaamos":k>=8?"ruska":"tunturi"; }
function applyTheme(){ const r=document.documentElement, p0=meta.pal||"kausi", p=p0==="kausi"?seasonPal():p0, m=meta.mode||"auto";
  if(p==="tunturi") delete r.dataset.pal; else r.dataset.pal=p;
  if(m==="auto") delete r.dataset.theme; else r.dataset.theme=m;
  const mt=document.querySelector('meta[name="theme-color"]'); if(mt) mt.content=getComputedStyle(r).getPropertyValue("--bg").trim()||"#e9ece5"; }
function renderTheme(){ const el=$("palPick"); if(!el) return; const p=meta.pal||"kausi", m=meta.mode||"auto"; const SN={kaamos:"Kaamos",ruska:"Ruska",tunturi:"Tunturi"};
  el.innerHTML=PALS.map(x=>x.id==="kausi"?`<button type="button" data-pal-pick="kausi" aria-pressed="${p==="kausi"}"><span class="sw kausi"><i></i></span><span><b>${x.n}</b><small>nyt ${SN[seasonPal()]} · kaamos marras–tammi, ruska syys–loka</small></span></button>`:`<button type="button" data-pal-pick="${x.id}" aria-pressed="${x.id===p}"><span class="sw" style="background:${x.bg}"><u style="background:${x.hl}"></u><i style="background:${x.ac}"></i></span><span><b>${x.n}</b><small>${x.d}</small></span></button>`).join("");
  document.querySelectorAll("[data-mode-pick]").forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.modePick===m))); }
document.addEventListener("click",e=>{ const b=e.target.closest("[data-pal-pick],[data-mode-pick]"); if(!b) return;
  if(b.dataset.palPick) meta.pal=b.dataset.palPick; else meta.mode=b.dataset.modePick;
  persist(); applyTheme(); renderTheme(); render(); });
matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>applyTheme());
