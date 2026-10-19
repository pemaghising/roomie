"""Browser checks for the Roomie marketing site.

Serves the static export in ../out and runs Playwright checks against it.
Usage: python tests/check_site.py [name ...]   (no names = run all)
Build first: npm run build
"""
import functools
import http.server
import os
import socketserver
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "out")
PORT = 4173
URL = f"http://localhost:{PORT}/"
CHECKS = {}


def check(name):
    def wrap(fn):
        CHECKS[name] = fn
        return fn
    return wrap


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=ROOT)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.ThreadingTCPServer(("127.0.0.1", PORT), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def open_page(browser, width=1280, height=900, **ctx):
    context = browser.new_context(viewport={"width": width, "height": height}, **ctx)
    page = context.new_page()
    errors = []
    page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(URL, wait_until="networkidle")
    return page, errors


def scroll_through(page, step=500):
    h = page.evaluate("document.body.scrollHeight")
    for y in range(0, h, step):
        page.evaluate(f"window.scrollTo(0, {y})")
        page.wait_for_timeout(30)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(200)


# ---------------------------------------------------------------- Task 1
@check("shell")
def test_shell(browser):
    page, errors = open_page(browser)
    assert page.title() == "Roomie · Make your place feel like home", page.title()
    fonts = page.evaluate("""() => { const s = getComputedStyle(document.documentElement);
        return [s.getPropertyValue('--font-serif'), s.getPropertyValue('--font-sans')]; }""")
    assert all(f.strip() for f in fonts), f"font variables missing: {fonts}"
    bg = page.evaluate("getComputedStyle(document.body).backgroundColor")
    assert bg == "rgb(248, 246, 252)", bg
    for w in (390, 768, 1280):
        page.set_viewport_size({"width": w, "height": 900})
        page.wait_for_timeout(150)
        sw, iw = page.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        assert sw == iw, f"horizontal overflow at {w}: {sw} > {iw}"
    white = page.evaluate("""() => [...document.querySelectorAll('*')]
        .filter(e => getComputedStyle(e).backgroundColor === 'rgb(255, 255, 255)')
        .map(e => e.tagName + '.' + e.className).slice(0, 5)""")
    assert not white, f"pure white backgrounds: {white}"
    assert not errors, f"console errors: {errors}"


def main():
    names = sys.argv[1:] or list(CHECKS)
    httpd = serve()
    failed = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for n in names:
            try:
                CHECKS[n](browser)
                print(f"PASS {n}")
            except AssertionError as e:
                failed += 1
                print(f"FAIL {n}: {e}")
        browser.close()
    httpd.shutdown()
    print(f"{len(names) - failed}/{len(names)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
