import "./close.css";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/wordmark.svg" alt="Roomie" width={104} height={28} />
        <span>Made in Kathmandu</span>
        <span>© 2026 Roomie</span>
        <a href="https://pemaghising.com.np">pemaghising.com.np</a>
      </div>
    </footer>
  );
}
