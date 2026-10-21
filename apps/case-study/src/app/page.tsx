import { Nav } from "@/components/roomie/nav";
import { Hero } from "@/components/roomie/hero";
import { Tldr } from "@/components/roomie/tldr";
import { Agenda } from "@/components/roomie/agenda";
import { RawSection } from "@/components/roomie/raw-section";
import { ScrollFx } from "@/components/roomie/scroll-fx";
import { PanZoom } from "@/components/roomie/pan-zoom";
import { GalleryRail } from "@/components/roomie/gallery-rail";
import { Footer } from "@/components/roomie/footer";
import { parseChapter } from "@/components/roomie/chapter";
import { empathizeHtml } from "@/components/roomie/content/empathize";
import { defineHtml } from "@/components/roomie/content/define";
import { ideateHtml } from "@/components/roomie/content/ideate";
import { prototypeHtml } from "@/components/roomie/content/prototype";
import { testHtml } from "@/components/roomie/content/test";
import { reflectHtml } from "@/components/roomie/content/reflect";

const chapters = [empathizeHtml, defineHtml, ideateHtml, prototypeHtml, testHtml, reflectHtml].map(parseChapter);

export default function Home() {
  return (
    <>
      <a className="skip" href="#top">Skip to content</a>
      <Nav />
      <main id="top" tabIndex={-1}>
        <Hero />
        <Tldr />
        <Agenda chapters={chapters} />
        {chapters.map((c) => (
          <RawSection key={c.id} chapter={c} />
        ))}
      </main>
      <Footer />
      <ScrollFx />
      <PanZoom />
      <GalleryRail />
    </>
  );
}
