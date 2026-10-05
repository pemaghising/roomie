// Renders a section verbatim from the original roomie-case-study/index.html markup.
// The seven content sections (Context → Reflect) are hand-built, one-off layouts —
// lots of bespoke grids, tables and inline SVG flowcharts, none of it reusable — so
// porting them to JSX line by line would just be a slower way to get the same pixels.
// Each string below is copy-pasted straight from the source file with asset paths
// rewritten to /assets/... for the Next.js public folder. No user input ever flows
// through this component, so dangerouslySetInnerHTML is safe here.
export function RawSection({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}
