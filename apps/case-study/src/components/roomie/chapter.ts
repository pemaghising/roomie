// Turns one chapter's raw markup (content/*.ts) into what the page needs: the
// banner pulled out of the body so it can become a full-bleed chapter opener,
// and a list of the chapter's sub-sections (each gets an anchor id) for the
// opener's "In this chapter" index. Pure string work, runs on the server.
export type Chapter = {
  id: string;
  cls: string;
  n: string;
  title: string;
  summary: string;
  html: string;
};

const slug = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&[a-z]+;/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';

export function parseChapter(raw: string): Chapter {
  const id = raw.match(/<section class="phase[^"]*" id="([^"]+)"/)![1];
  const cls = raw.match(/<section class="phase ([^"\s]+)/)![1];
  const header = raw.match(/<header class="phase-head">([\s\S]*?)<\/header>/)![1];
  const n = header.match(/<span class="num">([^<]+)</)![1];
  const title = header.match(/<h2>([\s\S]*?)<\/h2>/)![1];
  const summary = header.match(/<p>([\s\S]*?)<\/p>/)![1];
  const essence = header.match(/<b class="ess">([\s\S]*?)<\/b>/)?.[1] ?? title;

  const toc: { id: string; title: string }[] = [];
  const body = raw
    .replace(/<header class="phase-head">[\s\S]*?<\/header>/, "")
    .replace(/(<div class="block"[^>]*>\s*)<h3([^>]*)>([\s\S]*?)<\/h3>/g, (_m, open: string, attrs: string, t: string) => {
      const hid = `${id}-${slug(t)}-${toc.length + 1}`;
      toc.push({ id: hid, title: t });
      return `${open}<h3 id="${hid}"${attrs}>${t}</h3>`;
    });

  const list = toc
    .map((t, i) => `<li><a href="#${t.id}"><i>${String(i + 1).padStart(2, "0")}</i><span>${t.title}</span>${ARROW}</a></li>`)
    .join("");

  const opener = `<div class="opener">
  <div class="op-in">
    <div class="op-head"><div class="op-title"><p class="op-eye">${title}</p><h2>${essence.replace(/f(?=i)/g, "<span class=\"fx fi\">f</span>").replace(/f(?=l)/g, "<span class=\"fx\">f</span>")}</h2></div><span class="op-num" aria-hidden="true">${n}</span></div>
    <div class="op-foot"><p class="op-sum">${summary}</p>${
      toc.length ? `<nav class="op-toc" aria-label="In this chapter: ${title}"><p>In this chapter</p><ol>${list}</ol></nav>` : ""
    }</div>
  </div>
</div>
`;

  return { id, cls, n, title, summary, html: body.replace('<div class="wrap">', `${opener}<div class="wrap">`) };
}
