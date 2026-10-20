import "./ui.css";

type Props = { src: string; alt: string; className?: string; priority?: boolean };

/**
 * A real v2 screen export (393 × 852) inside a code-drawn modern phone:
 * metal rim, black bezel, camera island, side buttons and a soft glass glare.
 */
export function Phone({ src, alt, className = "", priority = false }: Props) {
  return (
    <figure className={`phone ${className}`}>
      <span className="btn-l" aria-hidden="true" />
      <span className="btn-r" aria-hidden="true" />
      <span className="bezel">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={393} height={852} loading={priority ? "eager" : "lazy"} decoding="async" />
        <span className="island" aria-hidden="true" />
        <span className="glare" aria-hidden="true" />
      </span>
    </figure>
  );
}
