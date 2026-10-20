export type Who = "Ramesh" | "Aman" | "Priya" | "The house";
export type Icon = "calendar" | "slip" | "hand" | "bag" | "sprout";
export type WeekDay = { day: string; time: string; who: Who; icon: Icon; title: string; body: string; screen: string };

/** One week at Parijat Chowk Flat, told from Ramesh's phone (every v2 export is his account). */
export const WEEK: WeekDay[] = [
  {
    day: "Monday", time: "9 am", who: "Ramesh", icon: "calendar",
    title: "Busy days, set once",
    body: "Ramesh marks Tue, Thu and Fri. Heavy chores stay off them.",
    screen: "/screens/r7-busy-days.webp",
  },
  {
    day: "Wednesday", time: "7 pm", who: "Aman", icon: "slip",
    title: "A chore slips",
    body: "Aman’s buried in exams and misses the bathroom. It moves to the shared pool, no name attached.",
    screen: "/screens/c1c-shared-pool.webp",
  },
  {
    day: "Thursday", time: "8 am", who: "Ramesh", icon: "hand",
    title: "Someone picks it up",
    body: "Ramesh claims it. The house’s week is saved, and his next week gets lighter.",
    screen: "/screens/h3-claimed.webp",
  },
  {
    day: "Saturday", time: "10 am", who: "Priya", icon: "bag",
    title: "The milk runs out",
    body: "Priya taps “I’ll get it”. Nobody asks in the group chat.",
    screen: "/screens/p1-pantry.webp",
  },
  {
    day: "Sunday", time: "9 pm", who: "The house", icon: "sprout",
    title: "The week evens out",
    body: "Everything’s done. The house is on track for week 9, and the plant grows.",
    screen: "/screens/h6-all-done.webp",
  },
];
