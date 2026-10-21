# Roomie image prompts for the ChatGPT app

## How to save tokens and get the best results

1. **Use the ChatGPT app, not Codex.** Codex reads files and Figma on every request and spends tokens on all of it. The ChatGPT app only uses your image allowance.
2. **Attach images from this `refs` folder.** Never ask it to open Figma. Each prompt lists the files to attach.
3. **Make images with no words and no logo.** AI text comes out wrong and costs retries. Leave the empty space each prompt describes, and Claude adds the logo and headline afterwards in the real brand fonts.
4. **Keep one chat per set.** Paste the style message once at the start of the chat. After that, each image needs only its short prompt.
5. **Retry at most twice.** If a result is close, keep it and tell Claude what's off, because small fixes are cheaper here. Don't ask ChatGPT to edit the same image over and over.
6. **Download each image and send Claude the file path.** Claude reviews it, adds the text, files it and commits it.

## Style message (paste once at the start of each chat)

```
For every image in this chat: brand is Roomie, a calm chore and pantry app for roommates.
Bright soft daylight, lavender mist and cream tones (#F8F6FC, #EFE9FD, #FCFBFF; never pure white),
roof violet #7A5FD6 accents, a soft lilac-to-peach glow (#A489ED to #FFB48A). Clean, premium, calm.
Never dark, gritty, neon or moody. People are relaxed, diverse young adults in shared flats.
NO text, NO logos, NO letters anywhere unless I attach them. If a phone shows a screen, copy the
attached screen exactly with correct perspective. iPhone 17 Pro, natural titanium.
```

---

## Set 2: website

**2.2 Shared kitchen** (attach nothing; 16:9)
```
Photo: three flatmates in a bright lived-in shared kitchen, one rinsing a mug, one wiping the
counter, one laughing while putting milk in the fridge. Plants, light oak, lavender and cream. Candid.
```

**2.3 Pantry shelf** (attach nothing; 4:5)
```
Close-up of an open shared-flat fridge door and pantry shelf: milk, eggs, rice, sourdough, a protein
shake. A few small blank paper tags tied to items. Soft daylight, tidy and slightly funny.
```
Claude writes "Ask first" and "Do not touch" on the tags afterwards.

## Set 3: social

**3.1 Launch post** (attach `mascot.png`; 4:5)
```
The attached mascot, exactly as it is, large and centred on a soft lavender pedestal, with three
blank floating soft-3D chips around it. Lavender to peach glow. Keep the bottom quarter empty.
```
Claude adds the chip words and the headline.

**3.2 Carousel slide 2** (attach nothing; 4:5)
```
Three soft 3D rounded pills stacked with space between, in pale green #E9F6E1, pale amber #FFF1D6
and pale coral #FFE6DC, on lavender. Leave empty space to the right of each pill.
```
Slides 1 and 3 are typography and a phone, so Claude builds them from the real screens.

**3.3 Story** (attach `screen-lock-milk.png` for its card style; 9:16)
```
A hand holding a nearly empty milk carton beside an open fridge, bright light, top half of frame.
Keep the bottom 40% calm and empty lavender.
```

## Set 4: outdoor

**4.1 Billboard** (attach `mascot.png`; 16:9)
```
Realistic roadside billboard in a sunny leafy street at golden hour, seen from slightly below.
The billboard is lavender with the attached mascot on the right; the left two-thirds of the board
is empty lavender.
```

**4.2 Bus shelter** (attach `screen-home.png`; 4:5)
```
Modern glass bus shelter with a backlit lavender poster showing an iPhone with the attached screen.
Empty lavender space on the poster above the phone. Blurred passers-by, daytime.
```

**4.3 Metro poster** (attach `plant-seed`, `plant-sprout`, `plant-leafy`, `plant-bud`, `plant-bloom`; 3:2)
```
Tiled metro platform wall with a framed lavender poster showing the five attached plant stages in a
row, seed to bloom. Empty space on the poster above the plants.
```

## Set 5: merch (one chat; attach `mascot.png` to each)

**5.1 Tote** (1:1)
```
Cream canvas tote on a light oak hook, the attached mascot printed large in the centre, plain below.
```

**5.2 Mug** (1:1)
```
Lavender ceramic mug with the attached mascot printed small on the side, steam, light oak table.
```

**5.3 Stickers** (attach the plant PNGs too; 1:1)
```
Die-cut glossy sticker sheet flat-lay: the attached mascot, the attached plant stages, and three
blank rounded pill stickers in pale green, amber and coral.
```

**5.4 Tee** (4:5)
```
Person in a relaxed lavender t-shirt with the attached mascot small on the chest, bright flat,
cropped shoulders to waist.
```

**5.5 Fridge magnet** (attach `plant-bloom.png`; 4:5)
```
Close-up of a cream fridge door with a rounded lavender magnet board showing the attached plant,
three small blank pill magnets in green, amber and coral, a grocery list beside it.
```

## Set 1 redo

**6.1 Kitchen counter** (attach `screen-home.png`; 3:2)
```
iPhone lying on a light oak kitchen counter, 3/4 view from above, lavender mug of tea, small plant,
folded lilac towel. The phone shows the attached screen exactly, mapped flat with correct perspective.
```
