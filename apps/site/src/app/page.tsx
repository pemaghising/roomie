import { Hero } from "@/sections/Hero";
import { Problem } from "@/sections/Problem";
import { Effort } from "@/sections/Effort";
import { Week } from "@/sections/Week";
import { Features } from "@/sections/Features";
import { RealLife } from "@/sections/RealLife";
import { Shelf } from "@/sections/Shelf";
import { Close } from "@/sections/Close";
import { Footer } from "@/sections/Footer";

export default function Home() {
  return (
    <>
    <main>
      <Hero />
      <Problem />
      <Effort />
      <Features />
      <Week />
      <RealLife />
      <Shelf />
      <Close />
    </main>
    <Footer />
    </>
  );
}
