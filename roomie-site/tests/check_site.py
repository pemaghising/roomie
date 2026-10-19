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


# ---------------------------------------------------------------- Task 2
@check("store")
def test_store_buttons(browser):
    page, errors = open_page(browser)
    labels = ["Coming soon on the App Store", "Coming soon on Google Play"]
    for label in labels:
        btn = page.get_by_role("button", name=label).first
        assert btn.count() == 1, f"missing button: {label}"
        assert btn.get_attribute("aria-disabled") == "true", f"{label} not aria-disabled"
        before = page.url
        btn.click(force=True)  # aria-disabled blocks Playwright, not a real tap
        page.wait_for_timeout(150)
        assert page.url == before, f"{label} navigated to {page.url}"
        tip = page.locator("[role=status]", has_text="Coming soon").first
        try:
            tip.wait_for(state="visible", timeout=2000)
        except Exception:
            raise AssertionError(f"{label}: no 'Coming soon' message after click")
    assert not errors, f"console errors: {errors}"


# ---------------------------------------------------------------- Task 3
H1 = "Nobody should have to be the one who asks."
BUBBLES = ["whose turn is the bathroom??", "again? 🙃", "I'll just do it."]


@check("hero")
def test_hero(browser):
    page, errors = open_page(browser)
    hero = page.locator("#hero")
    assert hero.locator("h1").inner_text().strip() == H1, hero.locator("h1").inner_text()
    texts = hero.locator(".bubble p").all_inner_texts()
    assert [t.strip() for t in texts] == BUBBLES, texts
    assert hero.get_by_role("button", name="Coming soon on the App Store").count() == 1
    assert not errors, f"console errors: {errors}"

    # The hero leads with the real app: Home screen in a tilted phone + the nudge card.
    assert hero.locator('.phone img[src="/screens/h1-home.png"]').is_visible(), "no Home screen phone in hero"
    assert hero.locator('img[src="/cards/nudge.png"]').count() == 1, "no nudge card in hero"
    assert hero.locator("canvas").count() == 0, "3D canvas should be gone"
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    p3 = ctx.new_page()
    glb = []
    p3.on("request", lambda r: glb.append(r.url) if r.url.endswith(".glb") else None)
    p3.goto(URL, wait_until="networkidle")
    assert not glb, f"3D model still requested: {glb}"
    ctx.close()


# ---------------------------------------------------------------- Task 4
@check("effort")
def test_effort(browser):
    page, errors = open_page(browser)
    sec = page.locator("#effort")
    h2 = sec.locator("h2").inner_text().strip()
    assert h2 == "A 2-minute trash run isn’t a 45-minute bathroom." or h2 == "A 2-minute trash run isn't a 45-minute bathroom.", h2
    want = {"Light": "rgb(233, 246, 225)", "Medium": "rgb(255, 241, 214)", "Heavy": "rgb(255, 230, 220)"}
    for tag, bg in want.items():
        el = sec.locator(".tag", has_text=tag).first
        assert el.count() == 1, f"missing tag {tag}"
        got = el.evaluate("e => getComputedStyle(e).backgroundColor")
        assert got == bg, f"{tag} tag background {got} != {bg}"
    rows = [t.strip() for t in sec.locator(".chore b").all_inner_texts()]
    assert rows == ["Take out trash", "Vacuum living room", "Deep clean bathroom"], rows
    assert not errors, f"console errors: {errors}"


# ---------------------------------------------------------------- Task 5
WEEK = [
    ("Monday", "Busy days, set once", "/screens/r7-busy-days.png"),
    ("Wednesday", "A chore slips", "/screens/c1c-shared-pool.png"),
    ("Thursday", "Someone picks it up", "/screens/h3-claimed.png"),
    ("Saturday", "The milk runs out", "/screens/p1-pantry.png"),
    ("Sunday", "The week evens out", "/screens/h6-all-done.png"),
]


@check("week")
def test_week(browser):
    page, errors = open_page(browser, 1280, 900)
    sec = page.locator("#week")
    assert sec.locator("h2").first.inner_text().strip() == "One week at Parijat Chowk Flat.", sec.locator("h2").first.inner_text()
    days = sec.locator(".day")
    assert days.count() == 5, days.count()
    for i, (day, title, _) in enumerate(WEEK):
        assert days.nth(i).locator(".day-name").inner_text().strip() == day
        assert days.nth(i).locator("h3").inner_text().strip() == title
    # desktop: the pinned phone shows each day's screen in turn
    for i, (_, _, screen) in enumerate(WEEK):
        days.nth(i).scroll_into_view_if_needed()
        page.evaluate("(el) => window.scrollTo(0, el.getBoundingClientRect().top + scrollY - innerHeight * 0.35)", days.nth(i).element_handle())
        page.wait_for_timeout(900)
        shown = page.evaluate("""() => [...document.querySelectorAll('#week .stage .screen')]
            .filter(i => parseFloat(getComputedStyle(i).opacity) > .9).map(i => i.getAttribute('src'))""")
        assert shown == [screen], f"day {i}: stage shows {shown}, want {screen}"
    ratio = page.evaluate("""() => { const i = document.querySelector('.phone img');
        return i ? i.naturalWidth / i.naturalHeight : 0; }""")
    assert abs(ratio - 393 / 852) < 0.01, f"phone ratio {ratio}"
    assert not errors, f"console errors: {errors}"
    # phone width: stacked days, nothing pinned, each day has its own visible screen
    p2, _ = open_page(browser, 390, 844)
    pinned = p2.evaluate("""() => [...document.querySelectorAll('#week *')].filter(e => {
        const s = getComputedStyle(e); return (s.position === 'sticky' || s.position === 'fixed') && e.offsetParent !== null; }).length""")
    assert pinned == 0, f"{pinned} pinned elements on mobile"
    for i, (_, _, screen) in enumerate(WEEK):
        img = p2.locator(f'#week .day >> nth={i}').locator(f'img[src="{screen}"]')
        img.scroll_into_view_if_needed()
        assert img.is_visible(), f"mobile day {i} has no visible {screen}"
    sw, iw = p2.evaluate("[document.documentElement.scrollWidth, innerWidth]")
    assert sw == iw, f"mobile overflow {sw} > {iw}"


# ---------------------------------------------------------------- Task 6
@check("more")
def test_more(browser):
    page, errors = open_page(browser)
    real = page.locator("#real-life")
    assert real.locator("h2").inner_text().strip() == "Built for the small moments."
    figs = real.locator("figure.photo")
    assert figs.count() == 2, figs.count()
    want = [("/photos/01-morning-check.png", "One glance before chai."), ("/photos/02-the-nudge.png", "A nudge that never nags.")]
    for i, (src, cap) in enumerate(want):
        assert figs.nth(i).locator(f'img[src="{src}"]').count() == 1, f"photo {i} src"
        assert figs.nth(i).locator("figcaption").inner_text().strip() == cap, figs.nth(i).locator("figcaption").inner_text()
    shelf = page.locator("#shelf")
    assert shelf.locator("h2").inner_text().strip() == "Your shelf, your rules."
    body = shelf.locator("p").all_inner_texts()
    assert any("Do not touch or Ask first" in t for t in body), body
    assert any(t.strip().startswith("Running low? Ask the house") for t in body), body
    assert shelf.locator('.phone img[src="/screens/p2-my-items.png"]').count() == 1
    assert shelf.locator('img[src="/cards/shelf.png"]').count() == 1
    assert not errors, f"console errors: {errors}"


PW = {}


def main():
    names = sys.argv[1:] or list(CHECKS)
    httpd = serve()
    failed = 0
    with sync_playwright() as p:
        PW["p"] = p
        browser = p.chromium.launch()
        for n in names:
            try:
                CHECKS[n](browser)
                print(f"PASS {n}")
            except Exception as e:
                failed += 1
                print(f"FAIL {n}: {e}")
        browser.close()
    httpd.shutdown()
    print(f"{len(names) - failed}/{len(names)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
