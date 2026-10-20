import type { Chapter } from "./chapter";

// The whole case study on one screen: six rows, each a link to its chapter.
// Doubles as the agenda slide when presenting. Each row's number chip carries
// that chapter's colour; the row fills with it on hover/focus.
export function Agenda({ chapters }: { chapters: Chapter[] }) {
  return (
    <nav className="wrap agenda" aria-label="Contents">
      <h2 className="agenda-h">Six chapters, one problem</h2>
      <ol>
        {chapters.map((c) => (
          <li key={c.id} className={c.cls}>
            <a href={`#${c.id}`}>
              <b>{c.n}</b>
              <strong>{c.title}</strong>
              <span>{c.summary}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
