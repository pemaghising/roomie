import { color } from '../tokens';

export type TagKind = 'light' | 'medium' | 'heavy' | 'inPool' | 'out' | 'low' | 'doNotTouch' | 'askFirst';
export type TagStyle = { bg: string; fg: string; label: string; icon?: 'lock' | 'help' };

const E = color.effort;
const STYLES: Record<TagKind, TagStyle> = {
  light: { bg: E.lightBg, fg: E.lightFg, label: 'Light' },
  medium: { bg: E.mediumBg, fg: E.mediumFg, label: 'Medium' },
  heavy: { bg: E.heavyBg, fg: E.heavyFg, label: 'Heavy' },
  inPool: { bg: color.pool.bg, fg: color.pool.fg, label: 'In the pool' },
  out: { bg: E.heavyBg, fg: E.heavyFg, label: 'Out' },
  low: { bg: E.mediumBg, fg: E.mediumFg, label: 'Low' },
  doNotTouch: { bg: E.heavyBg, fg: E.heavyFg, label: 'Do not touch', icon: 'lock' },
  askFirst: { bg: E.mediumBg, fg: E.mediumFg, label: 'Ask first', icon: 'help' },
};

export const tagStyle = (kind: TagKind): TagStyle => STYLES[kind];

export const effortKind = (effort: number): 'light' | 'medium' | 'heavy' =>
  effort >= 3 ? 'heavy' : effort === 2 ? 'medium' : 'light';

// Letter tiles for items with no matching emoji, as in the icon library: Fraunces letter on a soft pastel.
const PASTELS = [
  { bg: '#EFE9FD', fg: '#6E52C9' }, { bg: '#FFE3D3', fg: '#9A3412' }, { bg: '#E9F6E1', fg: '#3F7A2A' },
  { bg: '#FCE7F6', fg: '#9D3C86' }, { bg: '#FFF1D6', fg: '#8A5A00' },
] as const;

export function letterTile(name: string): { letter: string; bg: string; fg: string } {
  const letter = name.trim().charAt(0).toUpperCase() || '?';
  const p = PASTELS[letter.charCodeAt(0) % PASTELS.length];
  return { letter, bg: p.bg, fg: p.fg };
}
