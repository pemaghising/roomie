import type { CSSProperties } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const cards = [
  {
    tag: "Problem",
    bg: "var(--rose)",
    fg: "var(--rose-ink)",
    title: "One person quietly does more",
    body: "Roommates stay fair with memory, WhatsApp and a chart on the fridge. When schedules change, one person absorbs the extra work, and asking for help sounds like an accusation.",
  },
  {
    tag: "Solution",
    bg: "var(--mint)",
    fg: "var(--mint-ink)",
    title: "A neutral third roommate",
    body: "Roomie weights chores by effort, keeps heavy tasks off your busy days, moves missed chores to a pool anyone can claim, and does the reminding.",
  },
  {
    tag: "Impact",
    bg: "var(--lav)",
    fg: "var(--lav-ink)",
    title: "A focused V1, ready to test",
    body: "27 hi-fi screens across onboarding, chores, pantry and settings. Money and AI features moved deliberately to Phase 2. It hasn't been tested yet; the plan is in section 05.",
  },
];

export function Tldr() {
  return (
    <div className="wrap tldr">
      {cards.map((c) => (
        <Card key={c.tag} className="card" style={{ "--card-spacing": "24px" } as CSSProperties}>
          <CardHeader>
            <Badge style={{ background: c.bg, color: c.fg }}>{c.tag}</Badge>
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
