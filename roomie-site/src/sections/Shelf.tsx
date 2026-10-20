import { Phone } from "@/ui/Phone";
import { PopIn } from "@/ui/PopIn";
import { popVars } from "@/ui/pop";
import "./more.css";

const ROW = { x: 24 / 393, w: 345 / 393, r: 24 };

export function Shelf() {
  return (
    <section id="shelf" className="shelf">
      <div className="wrap shelf-grid">
        <div className="shelf-copy">
          <p className="eyebrow">The pantry</p>
          <h2>Your shelf, your rules.</h2>
          <p className="lede">Shared things anyone can top up. Your things stay yours: tag them Do not touch or Ask first.</p>
          <p className="lede">Running low? Ask the house, and it becomes a chore anyone can claim.</p>
        </div>
        <div className="shelf-stage">
          <PopIn className="shelf-device">
            <Phone src="/screens/p2-my-items-slots.webp" alt="Roomie Pantry, My items: your personal things, each with a tag" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pop shelf-card" src="/cards/shelf-protein.webp" alt="Protein shake, tagged Do not touch" style={popVars({ ...ROW, y: 278 / 852 }, 0.2)} loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="pop shelf-card" src="/cards/shelf-sourdough.webp" alt="Sourdough bread, tagged Ask first" style={popVars({ ...ROW, y: 450 / 852 }, 0.5)} loading="lazy" />
          </PopIn>
        </div>
      </div>
    </section>
  );
}
