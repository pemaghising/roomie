// iOS launch images (apple-touch-startup-image): white, with the Splash screen's sprout at the same spot and size,
// so launch -> splash -> first screen has no white/black flash and nothing jumps. Run: npm run splash
import sharp from 'sharp';

// [css width, css height, device pixel ratio], portrait; covers iPhone SE 1st gen through iPhone 17 / Air / 16 Pro Max
const SIZES = [[320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3], [414, 896, 2], [414, 896, 3], [390, 844, 3],
  [428, 926, 3], [393, 852, 3], [430, 932, 3], [402, 874, 3], [420, 912, 3], [440, 956, 3]];
const SPROUT = 64; // css px, as in <Splash />
const links = [];
for (const [w, h, r] of SIZES) {
  const W = w * r, H = h * r, s = (SPROUT * r) / 64;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#ffffff"/>
    <g transform="translate(${(W - SPROUT * r) / 2} ${(H - SPROUT * r) / 2}) scale(${s})">
      <path d="M32 58V30" stroke="#065F46" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M31 34C21 34 14 27 13 18c10 0 17 6 18 16Z" fill="#34D399"/>
      <path d="M33 30c7 0 12-5 13-11-7 0-12 4-13 11Z" fill="#6EE7B7"/>
    </g></svg>`;
  const file = `apple-splash-${W}x${H}.png`;
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(`public/${file}`);
  links.push(`    <link rel="apple-touch-startup-image" href="/${file}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)" />`);
}
console.log(links.join('\n')); // paste into index.html
console.log(links.length, 'launch images');
