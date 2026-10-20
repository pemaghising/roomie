import { Phone } from "@/ui/Phone";
import "./more.css";

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
          <Phone src="/screens/p2-my-items.webp" alt="Roomie Pantry, My items: Protein shake tagged Do not touch, Sourdough bread tagged Ask first" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="shelf-card" src="/cards/shelf.webp" alt="" width={393} height={220} loading="lazy" />
        </div>
      </div>
    </section>
  );
}
