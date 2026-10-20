import "./close.css";

export function Footer() {
  return (
    <footer className="foot">
      <div className="wrap foot-inner">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo-roomie.webp" alt="Roomie" width={113} height={32} />
        <span>© 2026 Roomie</span>
        <a href="https://roomie-case-study.vercel.app/" target="_blank" rel="noopener">Read the case study</a>
        <a href="https://pemaghising.com.np" target="_blank" rel="noopener">pemaghising.com.np</a>
      </div>
    </footer>
  );
}
