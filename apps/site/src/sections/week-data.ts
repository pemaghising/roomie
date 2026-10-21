export type Who = "Ramesh" | "Aman" | "Priya" | "The house";
export type Icon = "calendar" | "slip" | "hand" | "bag" | "sprout";
/** x, y, w are fractions of the 393 × 852 screen; r is the card's corner radius in screen points. */
/** `slot`: the card lifts out of the screen and leaves a dashed gap. Notifications and toasts arrive, so they leave none. */
export type Pop = { src: string; alt: string; x: number; y: number; w: number; r: number; slot?: boolean };
export type Tap = { x: number; y: number };
export type Owner = { who: Who; label: string };
export type WeekDay = {
  day: string; time: string; who: Who; icon: Icon; title: string; body: string;
  screen: string; owner: Owner; pop: Pop; tap?: Tap;
  second?: { screen: string; alt: string; owner: Owner; tap?: Tap };
};

const LOCK_CARD = { x: 16 / 393, y: 520 / 852, w: 361 / 393, r: 16 };

/** One week at Parijat Chowk Flat. Each day is a scene: whose phone, what they see, the moment that matters. */
export const WEEK: WeekDay[] = [
  {
    day: "Monday", time: "9 am", who: "Ramesh", icon: "calendar",
    title: "Busy days, set once",
    body: "Ramesh marks Tue, Wed and Fri. Heavy chores stay off them.",
    screen: "/screens/w-mon-busy.webp",
    owner: { who: "Ramesh", label: "Ramesh’s phone" },
    tap: { x: 300 / 393, y: 452 / 852 },
    pop: { src: "/cards/w-mon-card.webp", alt: "Tue, Wed and Fri. Heavy chores stay off these days.", x: 24 / 393, y: 297 / 852, w: 345 / 393, r: 24, slot: true },
  },
  {
    day: "Wednesday", time: "7 pm", who: "Aman", icon: "slip",
    title: "A chore slips",
    body: "Aman’s buried in exams and misses the bathroom. It moves to the shared pool, no name attached.",
    screen: "/screens/w-wed-lock.webp",
    owner: { who: "The house", label: "Every flatmate’s phone" },
    pop: { src: "/cards/w-wed-card.webp", alt: "Roomie · now: Mop bathroom floor is in the shared pool. Anyone can claim it, no names attached.", ...LOCK_CARD },
  },
  {
    day: "Thursday", time: "8 am", who: "Ramesh", icon: "hand",
    title: "Someone picks it up",
    body: "Thursday’s Ramesh’s free day, so he claims it. The house’s week is saved, and his next week gets lighter.",
    screen: "/screens/c1c-shared-pool.webp",
    owner: { who: "Ramesh", label: "Ramesh’s phone" },
    tap: { x: 336 / 393, y: 246 / 852 },
    pop: { src: "/cards/w-thu-toast.webp", alt: "Mop bathroom floor is yours. You’ll get a lighter week.", x: 20 / 393, y: 700 / 852, w: 353 / 393, r: 16 },
  },
  {
    day: "Saturday", time: "10 am", who: "Priya", icon: "bag",
    title: "The milk runs out",
    body: "Priya taps “I’ll get it”. Everyone else just gets the note, so nobody asks in the group chat.",
    screen: "/screens/w-sat-lock.webp",
    owner: { who: "Ramesh", label: "Ramesh’s phone" },
    pop: { src: "/cards/w-sat-card.webp", alt: "Roomie · now: Priya is getting the milk. No action needed.", ...LOCK_CARD },
    second: {
      screen: "/screens/p1-pantry.webp",
      alt: "Priya’s Pantry: Milk is out, and she taps I’ll get it",
      owner: { who: "Priya", label: "Priya’s phone" },
      tap: { x: 278 / 393, y: 285 / 852 },
    },
  },
  {
    day: "Sunday", time: "9 pm", who: "The house", icon: "sprout",
    title: "The week evens out",
    body: "Everything’s done. That’s day 24 of the house streak, and the plant is nearly in bloom.",
    screen: "/screens/w-sun-done.webp",
    owner: { who: "Ramesh", label: "Ramesh’s phone" },
    pop: { src: "/cards/w-sun-streak.webp", alt: "House streak: 24 days strong, Sunday done and a new week started", x: 24 / 393, y: 220 / 852, w: 345 / 393, r: 24, slot: true },
  },
];
