import "./ui.css";

export const PROTOTYPE_URL = "https://roomie-mobile.vercel.app";

/** The one live call to action: opens the interactive prototype. A gradient ring travels round it on hover. */
export function TryRoomie({ className = "", size = "md", label = "Try Roomie" }: { className?: string; size?: "md" | "lg"; label?: string }) {
  return (
    <a className={`try try--${size} ${className}`} href={PROTOTYPE_URL} target="_blank" rel="noopener" aria-label={`${label}: open the interactive prototype in a new tab`}>
      <span>{label}</span>
    </a>
  );
}
