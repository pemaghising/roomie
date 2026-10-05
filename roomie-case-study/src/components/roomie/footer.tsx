import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="wrap">
      <div className="wrap">
        <p className="big">Thanks for reading.</p>
        <div className="stack" style={{ gap: 6, textAlign: "right" }}>
          <strong>Pema Ghising</strong>
          <span className="muted">
            Lead Graphic Designer · Leapfrog Technology, Kathmandu
          </span>
          <Button asChild variant="link" size="sm" className="justify-self-end px-0">
            <a href="https://pemaghising.com.np" target="_blank" rel="noopener">
              pemaghising.com.np
              <ArrowUpRight />
            </a>
          </Button>
        </div>
      </div>
    </footer>
  );
}
