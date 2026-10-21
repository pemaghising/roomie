# Set 1: device mockups, image prompts

Each prompt below stands alone. Run them one at a time.

## Shared context (every prompt includes it)

- **Figma file:** Roomie, key `54WDfpLvnPKcWRnswVdOSd`, https://www.figma.com/design/54WDfpLvnPKcWRnswVdOSd
- **Screens page:** `05 · ✨ Final app v2` (node `834:4432`). Always use these frames, never older pages.
- **Brand mark:** `Logo/Roomie lockup` (node `261:945`).
- **Export:** export each screen frame as PNG at 3x (1179 × 2556).
- **Output:** save the finished image to `brand/marketing/01-mockups/originals/<file name>.png` in the repo `C:\Leapfrog\Bootcamp\roomie-app`. Don't commit; Claude reviews it first.

### Brand rules

- **Product:** Roomie is a calm chore and shared pantry app for roommates.
- **Palette:**
  - lavender mist `#F8F6FC` and `#EFE9FD`
  - roof violet `#7A5FD6`
  - soft peach `#FFB48A`
  - lavender off-white `#FCFBFF`. Never pure white.
- **Mascot:** a smiling cream house with a lilac roof and a carrot-pot sprout on the chimney, in a soft 3D clay style.
- **Light:** bright, clean, soft daylight and lavender tones. Never gritty, dark, moody or documentary.
- **Type, if any appears:** Fraunces serif for headlines, Geist sans for the rest. Sentence case, never all caps.
- **Content:** no scores, points or leaderboards anywhere.
- **Device:** iPhone 17 Pro in natural titanium, with a Dynamic Island.

### Screen rule

Show exactly the exported Figma screen on the phone:
- every word, number, icon, colour and spacing identical
- natural glass reflections only
- don't invent, translate, blur or rearrange any UI
- the screen fills the display edge to edge, with correct perspective

---

## 1. Kitchen counter

**File name:** `kitchen-counter-home.png`

**Screen:** `H1 · Home` (node `912:2195`), which shows the 23-day house streak with the plant, and today's tasks.

**Prompt:**

Photo of an iPhone 17 Pro in natural titanium lying at a slight angle on a light oak kitchen counter, seen in 3/4 view from above.

- **On the phone:** the exported Figma frame `H1 · Home` (node `912:2195`), following the screen rule.
- **Props:** a lavender ceramic mug of tea, a small potted plant, and a folded lilac tea towel at the edge of the frame.
- **Light:** soft morning daylight from a window on the left, gentle shadows, shallow depth of field.
- **Style:** follow the Roomie brand rules.
- **Format:** landscape 3:2, at least 2400 px wide.

---

## 2. Two flatmates

**File name:** `two-flatmates.png`

**Screens:**
- **Left phone:** `P1 · Pantry shared` (node `842:3873`), with Milk and Rice running low and the "I'll get it" buttons.
- **Right phone:** `H1 · Home` (node `912:2195`).

**Prompt:**

Photo of two people's hands, each holding an iPhone 17 Pro, side by side over a shared light-wood kitchen table, as if comparing their screens.

- **People:** one wears a soft lavender knit sleeve and the other a cream sweater. Only hands and forearms are visible.
- **On the phones:**
  - Left phone: the exported Figma frame `P1 · Pantry shared` (node `842:3873`).
  - Right phone: `H1 · Home` (node `912:2195`).
  - Both follow the screen rule.
- **Light:** warm natural light. Calm and friendly.
- **Style:** follow the Roomie brand rules.
- **Format:** landscape 3:2, at least 2400 px wide.

---

## 3. Bedside lock-screen nudge

**File name:** `bedside-lock-nudge.png`

**Screen:** `W4 · Lock screen, Priya gets milk` (node `1093:2120`), the lock screen with the Roomie notification "Priya is getting the milk 🥛 / No action needed."

**Prompt:**

Photo of an iPhone 17 Pro standing upright on a white-oak bedside table, next to a small potted plant and a ceramic cup.

- **Light:** soft early-morning light through sheer lavender curtains. Cosy and calm.
- **Camera:** the phone faces the camera almost straight on, slightly angled.
- **On the phone:** the exported Figma frame `W4 · Lock screen, Priya gets milk` (node `1093:2120`), following the screen rule. The notification text must read exactly as in Figma.
- **Style:** follow the Roomie brand rules.
- **Format:** portrait 4:5, at least 1600 px wide.

---

## 4. Studio device renders (two images)

**File names:** `studio-front-home.png` and `studio-angle-pantry.png`

**Screens:**
- **Front version:** `H1 · Home` (node `912:2195`).
- **Angled version:** `P1 · Pantry shared` (node `842:3873`).

**Prompt:**

Clean studio product render of an iPhone 17 Pro in natural titanium on a soft lavender `#EFE9FD` background, with a subtle lilac-to-peach glow behind the phone and a soft contact shadow. No props and no text.

- **Version A:** perfectly front-facing, upright and centred, showing the exported Figma frame `H1 · Home` (node `912:2195`).
- **Version B:** rotated about 20 degrees in 3/4 view, showing `P1 · Pantry shared` (node `842:3873`).
- **Both versions:** follow the screen rule, and keep the screen edges and Dynamic Island crisp.
- **Style:** follow the Roomie brand rules.
- **Format:** square 1:1, at least 2048 px.
