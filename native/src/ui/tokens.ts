// Roomie v2 design tokens, one-to-one with the Figma variables (v2 · Color, v2 · Layout)
// and the v2/ text and effect styles. Screens use these names, never raw values.

export const color = {
  bg: { canvas: '#F8F6FC', surface: '#FCFBFF', glass: 'rgba(252,251,255,0.62)', tint: '#EFE9FD', track: '#E9E4F6', scrim: 'rgba(31,27,58,0.32)' },
  text: { primary: '#1F1B3A', secondary: '#5E5873', tertiary: '#67617F', link: '#6E52C9', onAccent: '#FCFBFF', danger: '#C2410C', numeral: '#3B2470' },
  action: { primary: '#7A5FD6', selectedTint: 'rgba(135,107,222,0.14)', danger: '#C2410C' },
  icon: { default: '#876BDE', muted: '#5E5873' },
  border: { hairline: 'rgba(252,251,255,0.9)', divider: 'rgba(135,107,222,0.08)', error: '#C2410C' },
  accent: { selectedStart: '#A489ED', selectedEnd: '#FFB48A', addStart: '#7A5FD6', addMid: '#BE72CE', addEnd: '#F39A80' },
  pool: { bg: '#FFE3D3', fg: '#9A3412' },
  effort: { lightBg: '#E9F6E1', lightFg: '#3F7A2A', mediumBg: '#FFF1D6', mediumFg: '#8A5A00', heavyBg: '#FFE6DC', heavyFg: '#B23E1E' },
} as const;

export const space = { 4: 4, 8: 8, 10: 10, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 } as const;
export const radius = { tile: 11, chip: 18, card: 24, field: 26, sheet: 32, full: 999 } as const;

/** Font family names as registered in _layout.tsx (one family per weight). */
export const font = {
  title: 'Fraunces-SemiBold',
  titleItalic: 'Fraunces-SemiBoldItalic',
  light: 'Geist-Light',
  regular: 'Geist-Regular',
  medium: 'Geist-Medium',
  semibold: 'Geist-SemiBold',
} as const;

type TextStyle = { fontFamily: string; fontSize: number; lineHeight: number; letterSpacing?: number };
const t = (fontFamily: string, fontSize: number, lineHeight: number, letterSpacing?: number): TextStyle =>
  letterSpacing === undefined ? { fontFamily, fontSize, lineHeight } : { fontFamily, fontSize, lineHeight, letterSpacing };

export const type = {
  'Title/Page': t(font.title, 34, 41, -0.3),
  'Title/Onboarding': t(font.title, 28, 34, -0.2),
  'Title/Accent': t(font.titleItalic, 28, 34, -0.2),
  'Title/Greeting': t(font.title, 20, 25),
  'Heading/Section': t(font.semibold, 20, 25, -0.2),
  'Body/Button': t(font.medium, 17, 22),
  'Body/Input': t(font.regular, 17, 22),
  'Body/Row': t(font.medium, 16, 21),
  'Body/Default': t(font.regular, 15, 20),
  'Body/Label': t(font.medium, 15, 20),
  Meta: t(font.regular, 13, 18),
  'Meta/Medium': t(font.medium, 13, 18),
  Tag: t(font.semibold, 12, 16),
  'Tag/Medium': t(font.medium, 12, 16),
  Nav: t(font.medium, 10, 12),
  'Numeral/Streak': t(font.light, 81, 92, -3.24),
} as const satisfies Record<string, TextStyle>;

type Shadow = { shadowColor: string; shadowOpacity: number; shadowRadius: number; shadowOffset: { width: number; height: number }; elevation: number };
const shadow = (radius: number, y: number, opacity: number, elevation: number, shadowColor = '#8C66D9'): Shadow =>
  ({ shadowColor, shadowOpacity: opacity, shadowRadius: radius / 2, shadowOffset: { width: 0, height: y }, elevation });

export const elevation = {
  glass: shadow(24, 8, 0.08, 3),
  liftButton: shadow(12, 4, 0.16, 4, '#7A5FD6'),
  liftSmall: shadow(8, 2, 0.14, 2, '#7A5FD6'),
  day: shadow(16, 4, 0.08, 2),
  sheet: shadow(24, 8, 0.22, 8, '#1C1447'),
} as const;

/** Screen margin and section rhythm from the Figma spacing notes. */
export const layout = { margin: 24, titleToTabs: 16, tabsToSection: 24, sectionGap: 32, headerToItems: 12, itemGap: 10 } as const;
