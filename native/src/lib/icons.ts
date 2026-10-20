// The pantry icon library (P2f "Pick an icon"): Fluent 3D emoji by name, in the picker's four tabs.
// Pure data so it runs in tests; the art itself is looked up by name in ui/emoji-assets.
import { iconFor } from '@domain/pantry.ts';

export type IconCategory = 'Pantry' | 'Fruit and veg' | 'Drinks' | 'Cleaning';
export interface IconRef { name: string; char: string; category: IconCategory }

const L = (category: IconCategory, list: [string, string][]): IconRef[] => list.map(([name, char]) => ({ name, char, category }));

export const ICON_LIBRARY: IconRef[] = [
  ...L('Pantry', [
    ['Glass of milk', '🥛'], ['Bread', '🍞'], ['Baguette bread', '🥖'], ['Croissant', '🥐'], ['Doughnut', '🍩'],
    ['Cooked rice', '🍚'], ['Egg', '🥚'], ['Cheese wedge', '🧀'], ['Butter', '🧈'], ['Cupcake', '🧁'],
    ['Salt', '🧂'], ['Jar', '🫙'], ['Canned food', '🥫'], ['Spaghetti', '🍝'], ['Pancakes', '🥞'],
    ['Cookie', '🍪'], ['Chocolate bar', '🍫'], ['Popcorn', '🍿'], ['Peanuts', '🥜'], ['Pretzel', '🥨'],
    ['Bagel', '🥯'], ['Bowl with spoon', '🥣'], ['Steaming bowl', '🍜'], ['Sheaf of rice', '🌾'], ['Honey pot', '🍯'],
    ['Olive', '🫒'], ['Pouring liquid', '🫗'], ['Candy', '🍬'], ['Poultry leg', '🍗'], ['Cut of meat', '🥩'], ['Fish', '🐟'],
    ['Ice cream', '🍨'], ['Package', '📦'],
  ]),
  ...L('Fruit and veg', [
    ['Banana', '🍌'], ['Red apple', '🍎'], ['Tangerine', '🍊'], ['Lemon', '🍋'], ['Grapes', '🍇'], ['Strawberry', '🍓'],
    ['Kiwi fruit', '🥝'], ['Avocado', '🥑'], ['Tomato', '🍅'], ['Carrot', '🥕'], ['Onion', '🧅'], ['Garlic', '🧄'],
    ['Potato', '🥔'], ['Leafy green', '🥬'], ['Broccoli', '🥦'], ['Cucumber', '🥒'], ['Ear of corn', '🌽'], ['Mushroom', '🍄'],
    ['Hot pepper', '🌶️'], ['Ginger root', '🫚'], ['Beans', '🫘'],
  ]),
  ...L('Drinks', [
    ['Beverage box', '🧃'], ['Hot beverage', '☕'], ['Teapot', '🫖'], ['Teacup without handle', '🍵'], ['Bubble tea', '🧋'],
    ['Cup with straw', '🥤'], ['Ice', '🧊'], ['Droplet', '💧'], ['High voltage', '⚡'], ['Beer mug', '🍺'], ['Wine glass', '🍷'],
  ]),
  ...L('Cleaning', [
    ['Soap', '🧼'], ['Sponge', '🧽'], ['Lotion bottle', '🧴'], ['Roll of paper', '🧻'], ['Wastebasket', '🗑️'], ['Broom', '🧹'],
    ['Bucket', '🪣'], ['Gloves', '🧤'], ['Toothbrush', '🪥'], ['Basket', '🧺'],
  ]),
];

const BY_CHAR = new Map(ICON_LIBRARY.map((i) => [i.char, i]));
const BY_NAME = new Map(ICON_LIBRARY.map((i) => [i.name, i]));

/** Things with no icon of their own, and what looks most like them. */
const NEAR: Record<string, string> = {
  tofu: 'Cheese wedge', paneer: 'Cheese wedge', hummus: 'Jar', sauce: 'Jar', pickle: 'Jar', mayo: 'Jar', spread: 'Jar',
  soup: 'Canned food', tuna: 'Canned food', granola: 'Bowl with spoon', oat: 'Bowl with spoon', muesli: 'Bowl with spoon',
  cake: 'Cupcake', muffin: 'Cupcake', biscuit: 'Cookie', cracker: 'Cookie', snack: 'Popcorn', crisp: 'Potato',
  sparkling: 'Droplet', milkshake: 'Cup with straw', smoothie: 'Cup with straw', foil: 'Roll of paper', wrap: 'Roll of paper',
  bleach: 'Lotion bottle', spray: 'Lotion bottle', cleaner: 'Lotion bottle', laundry: 'Basket', bag: 'Wastebasket',
};

const words = (q: string) => q.toLowerCase().replace(/[^a-z ]/g, ' ').split(' ').filter(Boolean)
  .flatMap((w) => [w, w.replace(/ies$/, 'y'), w.replace(/es$/, ''), w.replace(/s$/, '')]);

export const iconsIn = (c: IconCategory): IconRef[] => ICON_LIBRARY.filter((i) => i.category === c);
export const iconByChar = (char?: string | null): IconRef | undefined => (char ? BY_CHAR.get(char) : undefined);

/** The icon for a typed name, the closest alternatives (best first), and the letter for a tile when nothing fits. */
export function matchIcons(query: string): { exact: IconRef | null; closest: IconRef[]; letter: string } {
  const q = query.trim().toLowerCase();
  const letter = q.charAt(0).toUpperCase() || '?';
  if (!q) return { exact: null, closest: [], letter };
  const guess = iconFor(q);
  const exact = guess === '🛒' ? null : BY_CHAR.get(guess) ?? null;
  const near = words(q).map((w) => NEAR[w]).filter(Boolean).map((n) => BY_NAME.get(n)!);
  const named = ICON_LIBRARY.filter((i) => i.name.toLowerCase().split(' ').some((w) => w.startsWith(q) || q.split(' ').some((p) => p.length > 2 && w.startsWith(p))));
  const closest = [...new Set([...(exact ? [exact] : []), ...near, ...named])];
  return { exact, closest, letter };
}
