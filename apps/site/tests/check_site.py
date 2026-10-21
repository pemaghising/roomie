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
H1 = "Fair chores. Zero nagging."
BUBBLES = ["whose turn is the bathroom??", "again? 🙃", "I'll just do it."]


@check("hero")
def test_hero(browser):
    page, errors = open_page(browser)
    hero = page.locator("#hero")
    assert hero.locator("h1").inner_text().strip() == H1, hero.locator("h1").inner_text()
    # The hero is the solution only: no group chat over the phone.
    assert hero.locator(".bubble").count() == 0, "group chat should not sit in the hero"
    # The chat is its own 'Sound familiar?' section, clearly not Roomie UI.
    prob = page.locator("#problem")
    assert prob.locator("h2").inner_text().strip() == "Sound familiar?", prob.locator("h2").inner_text()
    texts = prob.locator(".bubble p").all_inner_texts()
    assert [t.strip() for t in texts] == BUBBLES, texts
    assert prob.get_by_text("Roomie takes this job off everyone.").count() == 1
    order = page.evaluate("[...document.querySelectorAll('main > section')].map(s => s.id)")
    assert order[:3] == ["hero", "problem", "effort"], order
    # A real-looking device: rim, bezel, camera island and side buttons around the screen.
    assert page.locator("main .island").count() == 0, "no notch on any phone"
    # The app isn't out yet: the bar's button says so and jumps to the store buttons.
    bar = hero.locator(".topbar")
    assert [t.strip() for t in bar.locator("nav a").all_inner_texts()] == ["Features", "How it works", "The pantry"], bar.locator("nav a").all_inner_texts()
    assert bar.locator('a.topbar-cta[href="#close"]').inner_text().strip() == "Coming soon"
    # Full width at the top; shrinks into a floating pill on scroll and stays on screen
    full = bar.locator(".topbar-inner").evaluate("e => e.getBoundingClientRect().width")
    page.evaluate("window.scrollTo(0, 2400)")
    page.wait_for_timeout(800)
    assert bar.evaluate("e => e.getBoundingClientRect().top") < 30, "nav bar doesn't stay on screen"
    pill = bar.locator(".topbar-inner").evaluate("e => e.getBoundingClientRect().width")
    assert full >= page.evaluate("innerWidth") - 1 and pill < full - 100, f"bar doesn't shrink on scroll: {full} -> {pill}"
    page.evaluate("window.scrollTo(0, 0)")
    assert hero.get_by_role("button", name="Coming soon on the App Store").count() == 1
    assert not errors, f"console errors: {errors}"

    # Two layers only: the brand photo and the one Roomie nudge resting on it
    assert hero.locator('.hero-photo img[src="/photos/hero-laundry.webp"]').is_visible(), "no hero photo"
    assert hero.locator('img.hero-nudge[src="/cards/hero-nudge.webp"]').is_visible(), "no nudge card in hero"
    assert hero.locator(".phone, .scene-chip").count() == 0, "hero should stay two layers: photo + nudge"
    # The headline never spills out of its column, at any desktop width
    for w in (1024, 1280, 1440, 1680, 1920, 2200):
        page.set_viewport_size({"width": w, "height": 900})
        page.wait_for_timeout(200)
        spill = page.evaluate("""() => { const c = document.querySelector('#hero .hero-copy').getBoundingClientRect();
            const r = document.createRange(); r.selectNodeContents(document.querySelector('#hero h1'));
            return [...r.getClientRects()].some(x => x.right > c.right + 1); }""")
        assert not spill, f"headline spills out of its column at {w}"
    page.set_viewport_size({"width": 1280, "height": 900})
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


def pops_out(page, scope):
    """How far each visible .pop card reaches past its phone's right edge, in px."""
    return page.evaluate("""(scope) => { const root = document.querySelector(scope);
        const ph = root.querySelector('.device-pop .phone').getBoundingClientRect();
        return [...root.querySelectorAll('.device-pop .pop')].filter(p => parseFloat(getComputedStyle(p).opacity) > .9)
          .map(p => Math.round(p.getBoundingClientRect().right - ph.right)); }""", scope)


# ---------------------------------------------------------------- Task 5
WEEK = [
    ("Monday", "Busy days, set once", "/screens/w-mon-busy.webp"),
    ("Wednesday", "A chore slips", "/screens/w-wed-lock.webp"),
    ("Thursday", "Someone picks it up", "/screens/c1c-shared-pool.webp"),
    ("Saturday", "The milk runs out", "/screens/w-sat-lock.webp"),
    ("Sunday", "The week evens out", "/screens/w-sun-done.webp"),
]
POPS = {0: "/cards/w-mon-card.webp", 1: "/cards/w-wed-card.webp", 2: "/cards/w-thu-toast.webp", 3: "/cards/w-sat-card.webp", 4: "/cards/w-sun-streak.webp"}
OWNERS = ["Ramesh’s phone", "Every flatmate’s phone", "Ramesh’s phone", "Ramesh’s phone", "Ramesh’s phone"]
SECOND = {3: ("/screens/p1-pantry.webp", "Priya’s phone")}


@check("week")
def test_week(browser):
    page, errors = open_page(browser, 1280, 900)
    sec = page.locator("#week")
    assert sec.locator("h2").first.inner_text().strip() == "One week at Parijat Chowk Flat.", sec.locator("h2").first.inner_text()
    days = sec.locator(".day")
    assert days.count() == 5, days.count()
    for i, (day, title, _) in enumerate(WEEK):
        assert days.nth(i).locator(".day-name").inner_text().strip().startswith(day)
        assert days.nth(i).locator("h3").inner_text().strip() == title
        assert days.nth(i).locator(".node svg").count() == 1, f"day {i} has no icon node"
        assert days.nth(i).locator(".who").count() == 1, f"day {i} has no flatmate chip"
    # desktop: a pinned timeline; scrolling through the section steps the active day and the phone's screen
    top, height = page.evaluate("(() => { const r = document.querySelector('#week .timeline-wrap').getBoundingClientRect(); return [r.top + scrollY, r.height]; })()")
    span = height - 900
    assert span > 900, f"timeline section too short to scroll through: {height}"
    for i, (_, _, screen) in enumerate(WEEK):
        page.evaluate(f"window.scrollTo(0, {top} + {span} * ({i} + 0.5) / 5)")
        page.wait_for_timeout(900)
        shown = page.evaluate("""() => [...document.querySelectorAll('#week .stage .screen')]
            .filter(i => parseFloat(getComputedStyle(i).opacity) > .9).map(i => i.getAttribute('src'))""")
        assert shown == [screen], f"day {i}: stage shows {shown}, want {screen}"
        act = page.evaluate("[...document.querySelectorAll('#week .day')].findIndex(d => d.classList.contains('is-active'))")
        assert act == i, f"day {i}: active timeline item is {act}"
        # each scene: the key moment pops out past the phone's right edge, and says whose phone it is
        page.wait_for_timeout(1300)
        pops = page.evaluate("""() => { const ph = document.querySelector('#week .stage-phone').getBoundingClientRect();
            return [...document.querySelectorAll('#week .stage .pop')].filter(p => parseFloat(getComputedStyle(p).opacity) > .9)
              .map(p => { const r = p.getBoundingClientRect(); return [p.getAttribute('src'), r.right - ph.right, r.left > ph.left]; }); }""")
        assert len(pops) == 1 and pops[0][0] == POPS[i], f"day {i}: pop cards {pops}"
        assert pops[0][1] > 24 and pops[0][2], f"day {i}: card doesn't pop out of the phone: {pops}"
        owners = page.evaluate("""() => [...document.querySelectorAll('#week .stage-device > .owner')]
            .filter(o => parseFloat(getComputedStyle(o).opacity) > .9).map(o => o.textContent.trim())""")
        assert [o[1:] for o in owners] == [OWNERS[i]], f"day {i}: owner labels {owners}"
        seconds = page.evaluate("""() => [...document.querySelectorAll('#week .stage .second')]
            .filter(s => parseFloat(getComputedStyle(s).opacity) > .9)
            .map(s => [s.querySelector('img').getAttribute('src'), s.querySelector('.owner').textContent.trim().slice(1)])""")
        assert seconds == ([list(SECOND[i])] if i in SECOND else []), f"day {i}: second phone {seconds}"
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
        card = p2.locator(f'#week .day >> nth={i}').locator(f'img[src="{POPS[i]}"]')
        assert card.is_visible(), f"mobile day {i} has no visible pop-out card"
        if i in SECOND:
            assert p2.locator(f'#week .day >> nth={i}').locator(f'img[src="{SECOND[i][0]}"]').is_visible(), f"mobile day {i} misses the second phone"
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
    want = [("/photos/01-morning-check.webp", "Your whole day in one glance."), ("/photos/02-the-nudge.webp", "A nudge that never nags.")]
    for i, (src, cap) in enumerate(want):
        assert figs.nth(i).locator(f'img[src="{src}"]').count() == 1, f"photo {i} src"
        assert figs.nth(i).locator("figcaption").inner_text().strip() == cap, figs.nth(i).locator("figcaption").inner_text()
    shelf = page.locator("#shelf")
    assert shelf.locator("h2").inner_text().strip() == "Your shelf, your rules."
    body = shelf.locator("p").all_inner_texts()
    assert any("Do not touch or Ask first" in t for t in body), body
    assert any(t.strip().startswith("Running low? Ask the house") for t in body), body
    assert shelf.locator('.phone img[src="/screens/p2-my-items-slots.webp"]').count() == 1
    for src in ("/cards/shelf-protein.webp", "/cards/shelf-sourdough.webp"):
        assert shelf.locator(f'img[src="{src}"]').count() == 1, src
    shelf.scroll_into_view_if_needed()
    page.wait_for_timeout(2200)
    out = pops_out(page, "#shelf")
    assert len(out) == 2 and min(out) > 24, f"shelf items don't lift out of the phone: {out}"
    assert not errors, f"console errors: {errors}"


FEATURES = ["Effort, not headcount", "Built around your week", "A shared pool, no blame", "Nudges in your tone",
            "Restock in one tap", "A streak the whole house grows", "Move in with a code"]


@check("features")
def test_features(browser):
    page, errors = open_page(browser, 1440, 900)
    order = page.evaluate("[...document.querySelectorAll('main > section')].map(s => s.id)")
    assert order.index("week") == order.index("features") + 1, order
    sec = page.locator("#features")
    assert [t.strip() for t in sec.locator(".fslide h3").all_inner_texts()] == FEATURES
    for i in range(len(FEATURES)):
        assert sec.locator(".fslide").nth(i).locator(".phone img, .fcard").count() == 1, f"feature {i} has no real screen"
    # Desktop: a pinned sideways tour, one feature on screen at a time, its moment lifting out
    n = len(FEATURES)
    start = page.evaluate("document.querySelector('#features .ftour').parentElement.getBoundingClientRect().top + scrollY")
    for i in range(n):
        page.evaluate(f"window.scrollTo(0, {start} + innerWidth * {n - 1} * 0.8 * {i} / {n - 1})")
        page.wait_for_timeout(1500)
        state = page.evaluate("""() => [...document.querySelectorAll('#features .fslide')].map(s => {
            const r = s.getBoundingClientRect(), pop = s.querySelector('.fpop, .fcard');
            return [Math.abs(r.left) < innerWidth * .1 && r.top < 10 && r.bottom > innerHeight - 10, s.classList.contains('is-in'),
                    pop ? parseFloat(getComputedStyle(pop).opacity) : 1]; })""")
        on_screen = [k for k, s in enumerate(state) if s[0]]
        assert on_screen == [i], f"step {i}: on screen {on_screen}"
        assert state[i][1] and state[i][2] > .9, f"step {i}: moment didn't lift out {state[i]}"
        assert page.locator("#features .fcount").inner_text().strip() == f"{i + 1:02d} / {n:02d}"
    # Phones: the same features stacked, nothing pinned sideways, nothing overflowing
    for w in (390, 900):
        p2, _ = open_page(browser, w, 844)
        sw, iw = p2.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        assert sw == iw, f"overflow at {w}: {sw} > {iw}"
    p2, _ = open_page(browser, 390, 844)
    for i in range(n):
        s = p2.locator("#features .fslide").nth(i)
        s.scroll_into_view_if_needed()
        assert s.locator("h3").is_visible(), f"mobile feature {i} not visible"
    assert not errors, f"console errors: {errors}"


# ---------------------------------------------------------------- Task 7
@check("close")
def test_close(browser):
    page, errors = open_page(browser)
    sec = page.locator("#close")
    h2 = sec.locator("h2")
    assert " ".join(h2.inner_text().split()) == "Make your place feel like home.", h2.inner_text()
    em = h2.locator("em")
    assert em.inner_text().strip() == "home.", em.inner_text()
    style = em.evaluate("e => getComputedStyle(e).fontStyle")
    assert style == "italic", style
    for stage in ("seed", "sprout", "leafy", "bud", "bloom"):
        assert sec.locator(f'img[src="/brand/plant-{stage}.webp"]').count() == 1, f"missing plant {stage}"
    assert sec.get_by_role("button", name="Coming soon on Google Play").count() == 1
    foot = page.locator("footer")
    for text in ("© 2026 Roomie", "pemaghising.com.np"):
        assert foot.get_by_text(text).count() >= 1, f"footer missing {text}"
    assert foot.locator('a[href="https://pemaghising.com.np"]').count() == 1
    assert foot.locator('a[href="https://roomie-case-study.vercel.app/"]').inner_text().strip() == "Read the case study"
    assert foot.locator('img[src="/brand/logo-roomie.webp"]').count() == 1
    # The brand lockup from the guidelines (Logo/Roomie), not a hand-paired mascot + wordmark
    assert page.locator('#hero .topbar img[src="/brand/logo-roomie.webp"]').count() == 1
    assert not errors, f"console errors: {errors}"


# ---------------------------------------------------------------- Task 8
BANNED = ["revolutionize", "seamless", "effortless", "game-changer", "unlock", "supercharge",
          "trusted by", "users love", "★"]

HIDDEN_JS = """() => [...document.querySelectorAll('main h1, main h2, main p, main img')].filter(e => {
    if (!e.getClientRects().length) return false;            // display:none on purpose (e.g. desktop-only stage)
    for (let n = e; n && n !== document.body; n = n.parentElement) {
        const s = getComputedStyle(n);
        if (parseFloat(s.opacity) < 0.99 || s.visibility === 'hidden') return true;
    }
    return false;
}).map(e => e.tagName + ' ' + (e.getAttribute('src') || e.textContent.trim().slice(0, 40)))"""

OVERLAP_JS = """() => {
  const leaves = [...document.querySelectorAll('main *')].filter(e =>
      [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim()) && e.getClientRects().length);
  const out = [];
  for (const sec of document.querySelectorAll('main > section')) {
    const els = leaves.filter(e => sec.contains(e));
    for (let i = 0; i < els.length; i++) for (let j = i + 1; j < els.length; j++) {
      const a = els[i], b = els[j];
      if (a.contains(b) || b.contains(a)) continue;
      const r = a.getBoundingClientRect(), q = b.getBoundingClientRect();
      const ix = Math.min(r.right, q.right) - Math.max(r.left, q.left);
      const iy = Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top);
      if (ix > 2 && iy > 2) out.push(sec.id + ': "' + a.textContent.trim().slice(0, 24) + '" / "' + b.textContent.trim().slice(0, 24) + '"');
    }
  }
  return out.slice(0, 6);
}"""


@check("quality")
def test_quality(browser):
    # 1. reduced motion: nothing visible is left faded or hidden
    page, _ = open_page(browser, 1280, 900, reduced_motion="reduce")
    scroll_through(page)
    hidden = page.evaluate(HIDDEN_JS)
    assert not hidden, f"hidden under reduced motion: {hidden[:6]}"
    # 2. copy rules
    text = page.evaluate("document.body.innerText").lower()
    found = [w for w in BANNED if w.lower() in text]
    assert not found, f"banned words: {found}"
    upper = page.evaluate("""() => [...document.querySelectorAll('body *')]
        .filter(e => getComputedStyle(e).textTransform === 'uppercase').length""")
    assert upper == 0, f"{upper} elements use text-transform: uppercase"
    # 3. layout at six widths: no sideways scroll, no overlapping text (static layout)
    for w in (390, 430, 768, 1024, 1280, 1440):
        page.set_viewport_size({"width": w, "height": 900})
        page.wait_for_timeout(250)
        sw, iw = page.evaluate("[document.documentElement.scrollWidth, innerWidth]")
        assert sw == iw, f"overflow at {w}: {sw} > {iw}"
        clash = page.evaluate(OVERLAP_JS)
        assert not clash, f"overlapping text at {w}: {clash}"
    # 4. first-load weight with motion on
    p2, _ = open_page(browser, 1280, 900)
    total = p2.evaluate("""() => performance.getEntriesByType('navigation').concat(performance.getEntriesByType('resource'))
        .reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0)""")
    assert total < 3_000_000, f"first load {total / 1e6:.2f} MB"


# ---------------------------------------------------------------- Final review fixes
@check("hero_no_flash")
def test_hero_copy_never_flashes(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 900})
    page = ctx.new_page()
    page.goto(URL, wait_until="domcontentloaded")
    samples = []
    for _ in range(14):
        samples.append(page.evaluate("parseFloat(getComputedStyle(document.querySelector('#hero h1')).opacity)"))
        page.wait_for_timeout(100)
    ctx.close()
    assert min(samples) >= 0.99, f"hero h1 opacity dipped: {samples}"


@check("close_cta")
def test_close_cta_visible_early(browser):
    page, _ = open_page(browser, 1280, 900)
    y = page.evaluate("document.querySelector('#close').getBoundingClientRect().top + scrollY")
    # The buttons arrive with the headline, not before it
    page.evaluate(f"window.scrollTo(0, {y} + 10)")
    page.wait_for_timeout(1200)
    early = page.evaluate("parseFloat(getComputedStyle(document.querySelector('#close .stores')).opacity)")
    assert early < 0.5, f"store buttons already showing before the headline: {early:.2f}"
    page.evaluate(f"window.scrollTo(0, {y} + innerHeight * 0.5)")
    page.wait_for_timeout(1200)
    ops = page.evaluate("""() => { const o = e => { let v = 1; for (let n = e; n; n = n.parentElement) v *= parseFloat(getComputedStyle(n).opacity); return v; };
        return [o(document.querySelector('#close h2')), o(document.querySelector('#close .stores'))]; }""")
    assert ops[1] >= 0.99, f"close store buttons opacity {ops[1]:.2f} half a screen into the pin"
    assert ops[0] >= 0.5, f"close headline opacity {ops[0]:.2f} half a screen into the pin"


@check("mobile_hero_scrolls")
def test_mobile_hero_not_pinned(browser):
    page, _ = open_page(browser, 390, 844)
    top0 = page.evaluate("document.querySelector('#hero h1').getBoundingClientRect().top")
    page.evaluate("window.scrollTo(0, 300)")
    page.wait_for_timeout(500)
    top1 = page.evaluate("document.querySelector('#hero h1').getBoundingClientRect().top")
    assert top0 - top1 >= 250, f"hero pinned on mobile: h1 moved {top0 - top1}px for 300px of scroll"


@check("no_layout_swap")
def test_server_html_is_motion_layout(browser):
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, java_script_enabled=False)
    page = ctx.new_page()
    page.goto(URL, wait_until="load")
    cls = page.evaluate("[document.querySelector('#week').className, document.querySelector('#close').className]")
    stage = page.evaluate("getComputedStyle(document.querySelector('#week .stage-col')).display")
    ctx.close()
    assert "static" not in " ".join(cls), f"server HTML ships the static layout: {cls}"
    assert stage != "none", "desktop week stage hidden before hydration"


@check("flat_phones")
def test_phones_are_front_facing(browser):
    page, _ = open_page(browser, 1440, 900)
    scroll_through(page)
    tilted = page.evaluate("""() => {
      const out = [];
      for (const ph of document.querySelectorAll('main .phone, main .stage-card, main .shelf-card, main .nudge-card, main .pop')) {
        for (let n = ph; n && n !== document.body; n = n.parentElement) {
          const t = getComputedStyle(n).transform;
          if (t.startsWith('matrix3d')) { out.push((ph.className || ph.tagName) + ' via ' + n.className); break; }
          if (t.startsWith('matrix(')) { const [a, b] = t.slice(7).split(',').map(parseFloat); if (Math.abs(b) > 0.01) { out.push((ph.className || ph.tagName) + ' rotated via ' + n.className); break; } }
        }
      }
      return [...new Set(out)].slice(0, 6);
    }""")
    assert not tilted, f"tilted / perspective transforms: {tilted}"


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
