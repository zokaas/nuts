#!/usr/bin/env python3
"""Rakentaa index.html:n src-kansion osista. Aja: python3 build.py"""
import json, pathlib
R = pathlib.Path(__file__).parent
src = R / "src"
head = (src / "head.html").read_text()
body = (src / "body.html").read_text()
plan = json.loads((src / "plan.json").read_text())
logic = (src / "logic.js").read_text().split("if(typeof module")[0]
app = (src / "app.js").read_text()
html = (head + body + '<script type="application/json" id="plan">' + json.dumps(plan, ensure_ascii=False)
        + "</script>\n<script>\n" + logic + "\n" + app + "\n</script>\n</body>\n</html>\n")
(R / "index.html").write_text(html)
print(f"index.html {len(html)//1024} kt")
