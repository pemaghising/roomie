import { Nav } from "@/components/roomie/nav";
import { Hero } from "@/components/roomie/hero";
import { Tldr } from "@/components/roomie/tldr";
import { RawSection } from "@/components/roomie/raw-section";
import { ScrollFx } from "@/components/roomie/scroll-fx";
import { Footer } from "@/components/roomie/footer";
import { empathizeHtml } from "@/components/roomie/content/empathize";
import { defineHtml } from "@/components/roomie/content/define";
import { ideateHtml } from "@/components/roomie/content/ideate";
import { prototypeHtml } from "@/components/roomie/content/prototype";
import { testHtml } from "@/components/roomie/content/test";
import { reflectHtml } from "@/components/roomie/content/reflect";

const phaseSections = [empathizeHtml, defineHtml, ideateHtml, prototypeHtml, testHtml, reflectHtml];

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />
        <Tldr />
        {phaseSections.map((html, i) => (
          <RawSection key={i} html={html} />
        ))}
      </main>
      <Footer />
      <ScrollFx />
    </>
  );
}
