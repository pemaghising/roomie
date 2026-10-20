import { ArrowUpRight } from "lucide-react";

// The Roomie marketing site (roomie-site).
const ROOMIE_SITE = "https://roomie-site-sigma.vercel.app/";

export function Footer() {
  return (
    <footer>
      <div className="wrap foot-in">
        <p className="big">Thanks for reading.</p>
        <div className="foot-meta">
          <div>
            <strong>Pema Ghising</strong>
            <span>Lead Graphic Designer · Leapfrog Technology, Kathmandu</span>
          </div>
          <div className="foot-links">
            <a className="foot-link" href={ROOMIE_SITE} target="_blank" rel="noopener">
              See the Roomie website
              <ArrowUpRight aria-hidden="true" />
            </a>
            <a className="foot-link ghost" href="https://pemaghising.com.np" target="_blank" rel="noopener">
              pemaghising.com.np
              <ArrowUpRight aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
