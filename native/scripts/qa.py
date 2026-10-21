"""Scripted QA on the web export: runs flows (JSON step lists) like a person would and fails on any crash or unmet check.
Usage: python scripts/qa.py <out dir> <flow.json> [session.json]
Steps: ["go", route] · ["tap", label] · ["type", label, text] · ["see", text] · ["gone", text] · ["shot", name] · ["wait", ms]
       ["rings", n]  (exactly n focused field rings on screen)   Labels match aria-label, then button/link name, then text; "~regex" for patterns.
"""
import functools, http.server, json, re, socketserver, sys, threading
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "dist"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def translate_path(self, path):
        p = super().translate_path(path)
        return p if Path(p).exists() else str(ROOT / "index.html")

RINGS = """() => [...document.querySelectorAll('div')].filter(d => {
  const s = getComputedStyle(d), r = d.getBoundingClientRect();
  return s.backgroundImage.includes('gradient') && s.opacity === '1' && r.height >= 48 && r.height <= 56 && r.width > 200;
}).length"""

def find(pg, label):
    # "~pattern" matches by regular expression, anything else exactly
    m = re.compile(label[1:]) if label.startswith("~") else label
    ex = {} if label.startswith("~") else {"exact": True}
    for loc in (pg.get_by_label(m, **ex), pg.get_by_role("button", name=m, **ex),
                pg.get_by_role("link", name=m, **ex), pg.get_by_text(m, **ex)):
        for i in range(loc.count()):
            if loc.nth(i).is_visible(): return loc.nth(i)
    return None

def main():
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    flow = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
    session = json.loads(Path(sys.argv[3]).read_text()) if len(sys.argv) > 3 else None
    httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    fails, errors = [], []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 393, "height": 852}, device_scale_factor=2)
        pg.on("pageerror", lambda e: errors.append(str(e)[:200]))
        noise = ("favicon", "WebSocket connection", "cannot be a descendant", "cannot contain a nested", "status of 501", "navigator.vibrate")
        pg.on("console", lambda m: errors.append("console: " + m.text[:200]) if m.type == "error" and not any(x in m.text for x in noise) else None)
        pg.goto(base + "/kit")
        if session: pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [session["key"], json.dumps(session["value"])])
        for n, step in enumerate(flow):
            kind, arg = step[0], step[1] if len(step) > 1 else None
            ok = True
            try:
                ok = run_step(pg, base, out, step)
            except Exception as e:  # a blocked or missing element fails the step; the run carries on
                ok = False; errors.append(f"step {n}: {str(e).splitlines()[0][:160]}")
            if kind == "rings": arg = f"{arg} (saw {pg.evaluate(RINGS)})"
            print(("ok  " if ok else "FAIL"), n, kind, arg if not isinstance(arg, str) else arg[:60])
            if not ok:
                fails.append(f"{n} {kind} {arg}")
                pg.screenshot(path=str(out / f"fail-{n}.png"))
        b.close()
    httpd.shutdown()
    print(json.dumps({"fails": fails, "errors": errors[:8]}, indent=1))
    sys.exit(1 if fails or errors else 0)

def run_step(pg, base, out, step):
            kind, arg = step[0], step[1] if len(step) > 1 else None
            ok = True
            if kind == "go":
                pg.goto(base + arg, wait_until="networkidle"); pg.wait_for_timeout(2500)
                # the web dev build's warning toast (nested pressables are fine on iOS) would block taps
                pg.add_style_tag(content="#error-toast{display:none!important}")
            elif kind == "wait": pg.wait_for_timeout(arg)
            elif kind == "scrollto":
                el = find(pg, arg); ok = el is not None
                if el: pg.mouse.move(200, 300); pg.mouse.wheel(0, 260); pg.wait_for_timeout(500)
            elif kind == "shot": pg.screenshot(path=str(out / f"{arg}.png"))
            elif kind in ("tap", "type"):
                el = None
                for _ in range(20):
                    el = find(pg, arg)
                    if el: break
                    pg.wait_for_timeout(250)
                if not el: ok = False
                elif kind == "tap": el.click(); pg.wait_for_timeout(900)
                else: el.click(); el.fill(step[2]); pg.wait_for_timeout(400)
            elif kind == "see":
                ok = any(find(pg, arg) for _ in range(32) if not pg.wait_for_timeout(250))
            elif kind == "gone":
                pg.wait_for_timeout(600); ok = find(pg, arg) is None
            elif kind == "rings":
                ok = pg.evaluate(RINGS) == arg
            return ok

if __name__ == "__main__":
    main()
