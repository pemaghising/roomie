import "./ui.css";

type Props = { src: string; alt: string; className?: string; priority?: boolean };

/** A real v2 screen export inside a code-drawn device frame (393 × 852). */
export function Phone({ src, alt, className = "", priority = false }: Props) {
  return (
    <figure className={`phone ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} width={393} height={852} loading={priority ? "eager" : "lazy"} decoding="async" />
    </figure>
  );
}
