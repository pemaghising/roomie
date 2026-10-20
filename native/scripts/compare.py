"""Side-by-side check of an app route against its Figma frame.

Serves the Expo web export (dist/, from `npx expo export --platform web`), captures the route at
393 x 852 pt @2x with Playwright, and writes [Figma | App] next to each other.

Usage: python scripts/compare.py --route /kit --figma figma.png --out out.png [--width 393] [--full] [--session session.json]
--session injects a Supabase session (JSON) into localStorage so signed-in screens render.
"""
import argparse, functools, http.server, json, socketserver, threading
from pathlib import Path
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent / "dist"

class SPA(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
    def translate_path(self, path):
        p = super().translate_path(path)
        return p if Path(p).exists() else str(ROOT / "index.html")

def serve():
    httpd = socketserver.TCPServer(("127.0.0.1", 0), functools.partial(SPA, directory=str(ROOT)))
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--route", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--figma"); ap.add_argument("--width", type=int, default=393); ap.add_argument("--height", type=int, default=852)
    ap.add_argument("--full", action="store_true"); ap.add_argument("--session"); ap.add_argument("--wait", type=int, default=2500)
    ap.add_argument("--steps", help='JSON list run before the shot: ["click", label] or ["fill", label, text], matched by accessible label')
    a = ap.parse_args()
    httpd = serve(); base = f"http://127.0.0.1:{httpd.server_address[1]}"
    shot = Path(a.out).with_suffix(".app.png")
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": a.width, "height": a.height}, device_scale_factor=2)
        if a.session:
            s = json.loads(Path(a.session).read_text())
            pg.goto(base + "/kit"); pg.evaluate("([k, v]) => localStorage.setItem(k, v)", [s["key"], json.dumps(s["value"])])
        errors = []
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.goto(base + a.route, wait_until="networkidle"); pg.wait_for_timeout(a.wait)
        for step in json.loads(a.steps or "[]"):
            if step[0] == "scroll":
                pg.mouse.move(200, 400); pg.mouse.wheel(0, step[1]); pg.wait_for_timeout(700); continue
            el = pg.get_by_label(step[1], exact=True).first
            el.fill(step[2]) if step[0] == "fill" else el.click()
            pg.wait_for_timeout(700)
        pg.screenshot(path=str(shot), full_page=a.full)
        b.close()
    httpd.shutdown()
    app = Image.open(shot).convert("RGB")
    if a.figma:
        fig = Image.open(a.figma).convert("RGB")
        fig = fig.resize((app.width, round(fig.height * app.width / fig.width)))
        h = max(app.height, fig.height); out = Image.new("RGB", (app.width * 2 + 24, h), (255, 92, 92))
        out.paste(fig, (0, 0)); out.paste(app, (app.width + 24, 0)); out.save(a.out)
    else:
        app.save(a.out)
    print(json.dumps({"out": a.out, "errors": errors[:5]}))

if __name__ == "__main__":
    main()
