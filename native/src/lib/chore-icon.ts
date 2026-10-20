// The emoji a new chore gets from its name (frame C4). First match wins, so specific words come before general ones.
const RULES: [RegExp, string][] = [
  [/recycl/i, '♻️'], [/trash|bin|garbage|rubbish/i, '🗑️'], [/plant|garden/i, '🪴'], [/dish|plate|utensil/i, '🍽️'],
  [/stove|oven|cook|hob/i, '🍳'], [/laundry|clothes|towel|iron/i, '🧺'], [/toilet/i, '🚽'], [/mop|bucket/i, '🪣'],
  [/shower/i, '🚿'], [/bath|tub/i, '🛁'], [/vacuum|sweep|broom|dust/i, '🧹'], [/window|glass|mirror/i, '🪟'],
  [/bed|sheet/i, '🛏️'], [/grocer|shop/i, '🛒'],
];

export const choreIcon = (name: string): string => RULES.find(([re]) => re.test(name))?.[1] ?? '🧽';
