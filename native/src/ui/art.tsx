import { Image } from 'expo-image';

// Sprout illustrations (assets/images/onboarding). w/h are the source pixel sizes, used for the aspect ratio.
const ART = {
  welcome: { src: require('@/assets/images/onboarding/01_welcome_home.png'), w: 285, h: 246 },
  chores: { src: require('@/assets/images/onboarding/02_organize_chores.png'), w: 287, h: 246 },
  groceries: { src: require('@/assets/images/onboarding/03_shared_groceries.png'), w: 293, h: 246 },
  quiet: { src: require('@/assets/images/onboarding/05_space_clean.png'), w: 286, h: 246 },
  highfive: { src: require('@/assets/images/onboarding/06_live_better_together.png'), w: 285, h: 212 },
  calendar: { src: require('@/assets/images/onboarding/07_stay_on_track.png'), w: 287, h: 212 },
  findHome: { src: require('@/assets/images/onboarding/08_find_roommates.png'), w: 293, h: 212 },
  chat: { src: require('@/assets/images/onboarding/09_communicate.png'), w: 288, h: 212 },
  trophy: { src: require('@/assets/images/onboarding/11_celebrate_milestones.png'), w: 285, h: 213 },
  nightHouse: { src: require('@/assets/images/onboarding/12_peaceful_coliving.png'), w: 287, h: 213 },
  emptyBox: { src: require('@/assets/images/onboarding/13_less_chaos.png'), w: 293, h: 213 },
  together: { src: require('@/assets/images/onboarding/14_happier_home.png'), w: 288, h: 213 },
} as const;

export type ArtName = keyof typeof ART;

/** A decorative illustration, centred, sized by width. */
export function Art({ name, width = 220 }: { name: ArtName; width?: number }) {
  const a = ART[name];
  return <Image source={a.src} style={{ width, aspectRatio: a.w / a.h, alignSelf: 'center' }} contentFit="contain" accessible={false} />;
}
