// Copy and colour rules from Pema's design notes: no pure white, no all caps, no visible points, weeks start on Sunday.
// Usage: npm run lint:copy (exits 1 and lists every hit).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const RULES = [
  [/#fff(?:fff)?\b/i, 'pure white: use color.bg.surface (#FCFBFF)'],
  [/['"]white['"]/, 'pure white: use color.bg.surface (#FCFBFF)'],
  [/textTransform:\s*['"]uppercase['"]/, 'all caps: use sentence case'],
  [/['"`][^'"`\n]*\b\d+\s?pts?\b[^'"`\n]*['"`]/i, 'visible points: say "On track" or "Catching up"'],
  [/week(?:s)? (?:start|begin)s? on Monday|Monday[- ]first/i, 'weeks start on Sunday'],
];

const files = [];
const walk = (d) => { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(tsx?|mjs)$/.test(f) && !/\.test\./.test(f)) files.push(p); } };
walk(new URL('../src', import.meta.url).pathname.replace(/^\/(\w:)/, '$1'));

let hits = 0;
for (const f of files) readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
  for (const [re, why] of RULES) if (re.test(line)) { hits++; console.log(`${f}:${i + 1}  ${why}\n    ${line.trim().slice(0, 140)}`); }
});
console.log(hits ? `\n${hits} copy rule hit(s)` : 'lint:copy clean');
process.exit(hits ? 1 : 0);
