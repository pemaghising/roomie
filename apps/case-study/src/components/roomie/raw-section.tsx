import type { Chapter } from "./chapter";

// Renders a chapter's hand-built markup (see chapter.ts for how the banner
// becomes the opener). The six chapters are bespoke one-off layouts - grids,
// tables, inline SVG flowcharts - so they stay as markup rather than being
// ported to JSX line by line. No user input flows through here, so
// dangerouslySetInnerHTML is safe.
export function RawSection({ chapter }: { chapter: Chapter }) {
  return <div dangerouslySetInnerHTML={{ __html: chapter.html }} />;
}
