"""Width sweep of the web export: every route at many phone widths, flagging horizontal overflow and overlapping text.
Usage: python scripts/sweep.py <out dir> <session.json> [route ...]   (writes <out>/sheet-<width>.png contact sheets)
"""
import functools, http.server, json, socketserver, sys, threading
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "dist"
import os
WIDTHS = [int(w) for w in os.environ.get("WIDTHS", "320,340,360,375,390,393,402,414,428,440").split(",")]
ROUTES = ["/", "/chores", "/chores?view=pool", "/calendar", "/pantry", "/pantry?tab=mine", "/pantry?tab=roommates", "/profile",
          "/why", "/add-menu", "/add-chore", "/add-item", "/restock", "/activity", "/roommates", "/manage-chores", "/invite",
          "/busy-days", "/nudge-style", "/notifications", "/email", "/help", "/privacy", "/edit-profile", "/home-name", "/recap"]

CHECK = """() => {
  const vw = innerWidth, out = [];
  if (document.documentElement.scrollWidth > vw + 1) out.push('page scrolls sideways: ' + document.documentElement.scrollWidth);
  const leaves = [...document.querySelectorAll('div[dir], div')].filter(e => e.childElementCount === 0 && e.textContent.trim() && e.offsetParent);
  const rects = leaves.map(e => [e, e.getBoundingClientRect()]).filter(([, r]) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight);
  for (const [e, r] of rects) if (r.right > vw + 1 || r.left < -1) out.push('off screen: ' + e.textContent.trim().slice(0, 40));
  for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) {
    const [a, ra] = rects[i], [b, rb] = rects[j];
    const w = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), h = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (w > 4 && h > 4 && getComputedStyle(a).opacity !== '0' && getComputedStyle(b).opacity !== '0')
      out.push('overlap: "' + a.textContent.trim().slice(0, 30) + '" / "' + b.textContent.trim().slice(0, 30) + '"');
  }
  return [...new Set(out)].slice(0, 8);
}"""

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def translate_path(self, path):
        p = super().translate_path(path)
        return p if Path(p).exists() else str(ROOT / "index.html")

def main():
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    session = json.loads(Path(sys.argv[2]).read_text())
    routes = sys.argv[3:] or ROUTES
    httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{httpd.server_address[1]}"
    report = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        for w in WIDTHS:
            pg = b.new_page(viewport={"width": w, "height": 852}, device_scale_factor=1)
            pg.goto(base + "/kit"); pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [session["key"], json.dumps(session["value"])])
            shots = []
            for r in routes:
                errs = []
                pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(base + r, wait_until="networkidle"); pg.wait_for_timeout(2200)
                found = pg.evaluate(CHECK) + [f"error: {e}" for e in errs]
                pg.remove_listener("pageerror", pg.listeners("pageerror")[0]) if hasattr(pg, "listeners") else None
                if found: report[f"{w} {r}"] = found
                f = out / f"{w}-{r.strip('/').replace('/', '_').replace('?', '_') or 'home'}.png"
                pg.screenshot(path=str(f)); shots.append(f)
            pg.close()
            ims = [Image.open(s) for s in shots]; cols = 9
            sheet = Image.new("RGB", (cols * (w + 8), ((len(ims) + cols - 1) // cols) * 860), (255, 92, 92))
            for i, im in enumerate(ims): sheet.paste(im, ((i % cols) * (w + 8), (i // cols) * 860))
            sheet.save(out / f"sheet-{w}.png")
        b.close()
    httpd.shutdown()
    print(json.dumps(report, indent=1) if report else "no overflow or overlap found")

if __name__ == "__main__":
    main()
