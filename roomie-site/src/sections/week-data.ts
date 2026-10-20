export type WeekDay = { day: string; title: string; body: string; screen: string };

/** One week at Parijat Chowk Flat, told from Ramesh's phone (every v2 export is his account). */
export const WEEK: WeekDay[] = [
  {
    day: "Monday",
    title: "Busy days, set once",
    body: "Ramesh marks Tue, Thu and Fri. Heavy chores stay off them.",
    screen: "/screens/r7-busy-days.webp",
  },
  {
    day: "Wednesday",
    title: "A chore slips",
    body: "Aman’s buried in exams and misses the bathroom. It moves to the shared pool, no name attached.",
    screen: "/screens/c1c-shared-pool.webp",
  },
  {
    day: "Thursday",
    title: "Someone picks it up",
    body: "Ramesh claims it. The house’s week is saved, and his next week gets lighter.",
    screen: "/screens/h3-claimed.webp",
  },
  {
    day: "Saturday",
    title: "The milk runs out",
    body: "Priya taps “I’ll get it”. Nobody asks in the group chat.",
    screen: "/screens/p1-pantry.webp",
  },
  {
    day: "Sunday",
    title: "The week evens out",
    body: "Everything’s done. The house is on track for week 9, and the plant grows.",
    screen: "/screens/h6-all-done.webp",
  },
];
