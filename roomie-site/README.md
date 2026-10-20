<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="../.github/assets/logo-roomie-dark.webp">
  <img src="public/brand/logo-roomie.webp" alt="Roomie" height="56">
</picture>

### The Roomie website

**Live:** [roomie-site-sigma.vercel.app](https://roomie-site-sigma.vercel.app)

</div>

The marketing site for Roomie, the chore app that splits chores by effort and does the reminding itself. It sells to flatmates in one scroll:

1. **Hero:** the promise, with a real moment from a shared flat.
2. **Sound familiar?** The group-chat argument every flat knows.
3. **Fair isn't equal:** why a 2-minute trash run isn't a 45-minute bathroom.
4. **Features:** a pinned, sideways tour of seven real app screens.
5. **How it works:** one week at Parijat Chowk Flat, told phone by phone.
6. **Real life, the pantry, and the close:** the house plant grows as you scroll.

## Stack

Next.js 16 (App Router, static export) · React 19 · TypeScript · GSAP with ScrollTrigger · Lenis smooth scroll · self-hosted Fraunces and Geist.

Motion respects `prefers-reduced-motion`: pinned sections become plain stacked layouts, with nothing hidden.

## Run

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export to out/
python tests/check_site.py   # 14 browser checks against out/ (Playwright)
```

## Structure

```
src/
├── app/          layout, global tokens, page order
├── sections/     one file per section (Hero, Features, Week, ...)
└── ui/           Phone frame, pop-out cards, store buttons, smooth scroll
public/
├── screens/      real app screens, exported at 2x from Figma
├── cards/        cards that lift out of the phones
└── photos/       brand photography
```

Part of the [Roomie](../README.md) project by Pema Ghising.
