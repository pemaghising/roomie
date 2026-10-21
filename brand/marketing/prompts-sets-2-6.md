# Sets 2 to 6: website, social, outdoor, merch, image prompts

Run one prompt at a time. Each prompt saves to its own folder, with the full-size PNG in `originals/`.

## Shared context (every prompt includes it)

- **Repo:** `C:\Leapfrog\Bootcamp\roomie-app`. Don't commit; Claude reviews every image first.
- **Figma file:** Roomie, key `54WDfpLvnPKcWRnswVdOSd`.
  - **Screens:** always from page `05 · ✨ Final app v2` (`834:4432`), exported at 3x.
  - **Logo:** `Logo/Roomie lockup` (`261:945`). The logo and mascot are also on disk at `apps/site/public/brand/logo-roomie.webp` and `apps/site/public/brand/mascot.webp`; plant stages are in the same folder.
- **Reference images:** attach the logo, mascot and any screen as reference images. Reproduce them exactly; never redraw, restyle or re-letter them.

### Brand rules

- **Product:** Roomie is a calm chore and shared pantry app for roommates. Tagline: "Fair chores. Zero nagging."
- **Palette:**
  - lavender mist `#F8F6FC` and `#EFE9FD`
  - roof violet `#7A5FD6` and deep violet `#6E52C9`
  - ink `#1F1B3A`
  - soft peach `#FFB48A`
  - lavender off-white `#FCFBFF`. Never pure white.
  - The signature accent is a lilac-to-peach gradient, `#A489ED` to `#FFB48A`.
- **Mascot:** a smiling cream house with a lilac roof and a carrot-pot sprout on the chimney, in a soft 3D clay style. Use the reference; don't invent a new character.
- **Type:**
  - Headlines in Fraunces, a soft high-contrast serif. The second phrase is often italic in deep violet, as in "Fair chores. *Zero nagging.*"
  - Everything else in Geist sans.
  - Sentence case everywhere, never all caps.
- **Light:** bright, clean, soft daylight and lavender tones. Never gritty, dark, moody, neon or documentary.
- **Copy:** never show scores, points, leaderboards or rankings. Use only the exact copy given in each prompt; no extra words, URLs or fake app-store badges.
- **People:** real-looking young adults in shared flats, diverse, relaxed and friendly, never posed like stock models.
- **Screens:** if a phone shows a screen, it must be the exported Figma frame, identical in every word and icon.

---

## Set 2: website assets → `brand/marketing/02-website/`

### 2.1 Social share image
**File name:** `og-share.png`. **Format:** 1200 × 630.

A clean banner for link previews.
- **Left:** the Roomie logo lockup, and below it the headline "Fair chores. *Zero nagging.*" in Fraunces, with the second phrase in italic deep violet.
- **Right:** an iPhone 17 Pro showing `H1 · Home` (`912:2195`), slightly angled, cropped at the bottom edge.
- **Background:** lavender mist with a soft lilac-to-peach glow behind the phone.
- **Space:** generous margins; nothing within 60 px of the edges.

### 2.2 Section photo: a shared kitchen
**File name:** `photo-shared-kitchen.png`. **Format:** 16:9, at least 2400 px wide.

Three flatmates in a bright, lived-in shared kitchen: one rinsing a mug, one wiping the counter, one laughing while putting milk in the fridge.
- **Feel:** soft morning light, lavender and cream tones, plants, light oak. Natural and candid.
- **No phones and no text.**

### 2.3 Section photo: the pantry shelf
**File name:** `photo-pantry-shelf.png`. **Format:** 4:5, at least 1600 px wide.

A close-up of an open shared-flat fridge door and pantry shelf: milk, eggs, rice, sourdough, a protein shake.
- **Labels:** small handwritten paper tags reading "Ask first" and "Do not touch", in a calm, tidy and slightly funny way.
- **Light:** soft daylight with a lavender tint.
- **No other text.**

---

## Set 3: social → `brand/marketing/03-social/`

### 3.1 Instagram launch post
**File name:** `ig-launch.png`. **Format:** 1080 × 1350.

- **Centre:** the mascot, large, sitting on a soft lavender pedestal, with small floating 3D chips around it reading "Dishes done", "Your turn" and "Milk's low". These match the app's welcome screen `01 · Welcome` (`834:4433`); reference it.
- **Below:** "Fair chores. *Zero nagging.*" in Fraunces.
- **Background:** a lavender to peach gradient glow.

### 3.2 Carousel: "Fair isn't equal" (three slides)
**File names:** `carousel-1.png`, `carousel-2.png`, `carousel-3.png`. **Format:** 1080 × 1350 each.

All three slides share the same lavender background, type and layout.
1. **Slide 1:** the headline "Fair isn't *equal.*" in big Fraunces, with a small mascot in the corner.
2. **Slide 2:** three soft 3D pills reading "Light", "Medium" and "Heavy", in green `#E9F6E1`, amber `#FFF1D6` and coral `#FFE6DC`. Beside each is a chore: "Take out trash", "Vacuum", "Mop bathroom". Caption: "Every chore weighs differently."
3. **Slide 3:** an iPhone 17 Pro showing `09 · Pick chores` (`836:4517`). Caption: "Roomie splits by effort, not count."

### 3.3 Story: "Out of milk?"
**File name:** `story-milk.png`. **Format:** 1080 × 1920.

- **Top:** a hand holding a nearly empty milk carton over a fridge, in bright light.
- **Middle:** a floating Roomie notification card matching `W4 · Lock screen, Priya gets milk` (`1093:2120`): "Priya is getting the milk 🥛" and "No action needed."
- **Bottom third:** "One tap. *Sorted.*" in Fraunces. Leave the space below it empty.

---

## Set 4: outdoor → `brand/marketing/04-outdoor/`

### 4.1 Billboard
**File name:** `billboard.png`. **Format:** 16:9 photo, at least 2400 px wide.

A large roadside billboard in a sunny, leafy city street at golden hour, seen from slightly below.
- **The billboard:** a lavender background, the mascot on the right, and the headline "Fair chores. *Zero nagging.*" in Fraunces on the left, with the Roomie logo lockup small in the bottom-left corner.
- **Billboard text:** nothing else.
- **Feel:** realistic photo, clean and bright.

### 4.2 Bus shelter poster
**File name:** `bus-shelter.png`. **Format:** 4:5 photo.

A modern glass bus shelter at a city street with a backlit poster, in daytime.
- **Poster:** an iPhone 17 Pro showing `H1 · Home` (`912:2195`), with "Your flat, *on track.*" above it in Fraunces, and the Roomie logo lockup at the bottom.
- **Background:** a few blurred passers-by.

### 4.3 Metro poster
**File name:** `metro-poster.png`. **Format:** 3:2 photo.

A tiled metro platform wall with a framed poster.
- **Poster:** a lavender background, the five plant growth stages in a row from seed to bloom (use `apps/site/public/brand/plant-*.webp` as reference), and the headline "Grow a streak, *together.*" in Fraunces, with the Roomie logo lockup.
- **Light:** soft and clean.

---

## Set 5: merch → `brand/marketing/05-merch/`

All merch shots are flat-lay or studio product photos on soft lavender `#EFE9FD`, in soft daylight with gentle shadows.

### 5.1 Tote bag
**File name:** `tote.png`. **Format:** 1:1.

A natural cream canvas tote with the mascot printed large in the centre and "Fair chores. *Zero nagging.*" underneath in deep violet Fraunces. Hung on a light oak hook.

### 5.2 Mug
**File name:** `mug.png`. **Format:** 1:1.

A lavender ceramic mug with the Roomie logo lockup on one side and the small sprout from the logo on the other, steam rising, on a light oak table.

### 5.3 Sticker sheet
**File name:** `stickers.png`. **Format:** 1:1.

A die-cut sticker sheet, flat-lay, with:
- the mascot
- each plant stage, from seed to bloom
- three effort pills reading "Light", "Medium" and "Heavy"
- small speech-bubble stickers reading "I'll get it", "Your turn" and "Dishes done"

Glossy finish, soft shadows.

### 5.4 T-shirt
**File name:** `tee.png`. **Format:** 4:5.

A person in a relaxed lavender t-shirt with a small mascot on the chest, in a bright flat, cropped from shoulders to waist.

### 5.5 Fridge chore magnet
**File name:** `fridge-magnet.png`. **Format:** 4:5.

A close-up of a cream fridge door with a rounded Roomie magnet board showing the house plant and "This week" in Fraunces, plus three small magnets reading "Light", "Medium" and "Heavy", next to a child-like drawing and a grocery list.

---

## Set 6: redo from set 1 → `brand/marketing/01-mockups/`

### 6.1 Kitchen counter: screen fix
**File name:** `kitchen-counter-home-v2.png`.

Keep the scene of `originals/kitchen-counter-home.png` exactly: the mug, plant, towel, light and camera angle. Replace only the phone screen with `H1 · Home` (`912:2195`), mapped flat onto the display with correct perspective. Every row stays aligned: the shared pool card sits fully above "Your tasks today", "Why these?" sits on the same line as "Your tasks today", and each check circle sits in its own row.

