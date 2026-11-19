#!/usr/bin/env python3
"""Rakentaa index.html:n src-kansion osista. Aja: python3 build.py

src/head.html   sivun alku; /*CSS*/ korvataan src/css/*.css-tiedostoilla (aakkosjärjestyksessä)
src/body.html   näkymien HTML
src/plan.json   harjoitusohjelma, rivi per päivä (rivi 0 = ti 17.11.2026)
src/logic.js    laskenta (testataan node --testillä)
src/js/*.js     sovelluslogiikka osina, liitetään aakkosjärjestyksessä samaan skriptiin

Versio: sisällön tiiviste kirjoitetaan version.json-tiedostoon, BUILD-vakioon ja
sw.js:n välimuistin nimeen, joten välimuistia ei tarvitse enää kasvattaa käsin.
"""
import datetime, hashlib, json, pathlib, re
R = pathlib.Path(__file__).parent
src = R / "src"
css = "\n".join(p.read_text() for p in sorted((src / "css").glob("*.css")))
head = (src / "head.html").read_text().replace("/*CSS*/", css, 1)
body = (src / "body.html").read_text()
plan = json.loads((src / "plan.json").read_text())
logic = (src / "logic.js").read_text().split("if(typeof module")[0]
app = "".join(p.read_text() for p in sorted((src / "js").glob("*.js")))
sw = (R / "sw.js").read_text()
sw_body = re.sub(r'const CACHE = "[^"]*";', "", sw)
digest = hashlib.sha256((head + body + json.dumps(plan) + logic + app + sw_body).encode()).hexdigest()[:8]
vf = R / "version.json"
old = json.loads(vf.read_text()) if vf.exists() else {}
built = old.get("built") if old.get("hash") == digest else datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
ver = {"hash": digest, "built": built}
build = "const BUILD = " + json.dumps(ver) + ";\n"
html = (head + body + '<script type="application/json" id="plan">' + json.dumps(plan, ensure_ascii=False)
        + "</script>\n<script>\n" + build + logic + "\n" + app + "\n</script>\n</body>\n</html>\n")
(R / "index.html").write_text(html)
vf.write_text(json.dumps(ver) + "\n")
(R / "sw.js").write_text(re.sub(r'const CACHE = "[^"]*";', f'const CACHE = "pallas-{digest}";', sw, count=1))
print(f"index.html {len(html)//1024} kt · versio {digest}")
