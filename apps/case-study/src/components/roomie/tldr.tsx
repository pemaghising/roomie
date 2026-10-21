import { Card, CardContent, CardHeader } from "@/components/ui/card";

const cards = [
  {
    tag: "Problem",
    icon: "warning-circle",
    tone: "orange",
    title: "One person quietly does more",
    body: "Roommates stay fair with memory, WhatsApp and a chart on the fridge. When schedules change, one person absorbs the extra work, and asking for help sounds like an accusation.",
  },
  {
    tag: "Solution",
    icon: "scales",
    tone: "purple",
    title: "A neutral third roommate",
    body: "Roomie weights chores by effort, keeps heavy tasks off your busy days, moves missed chores to a pool anyone can claim, and does the reminding.",
  },
  {
    tag: "Impact",
    icon: "rocket-launch",
    tone: "green",
    title: "A focused V1, ready to test",
    body: "62 hi-fi screens across onboarding, home, chores, pantry and settings, on one design system. Money and AI features are planned for Phase 2. It hasn't been tested yet; the plan is in section 05.",
  },
];

export function Tldr() {
  return (
    <div className="wrap tldr">
      {cards.map((c) => (
        <Card key={c.tag} className="card">
          <CardHeader>
            <span className={`gi gi-${c.tone}`} aria-hidden="true">
              <img src={`/assets/icons/${c.icon}.svg`} alt="" />
            </span>
            <p className="eyebrow">{c.tag}</p>
            <h2>{c.title}</h2>
          </CardHeader>
          <CardContent>
            <p>{c.body}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
