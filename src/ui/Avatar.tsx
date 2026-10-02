export function Avatar({ name, color, size = 44 }: { name: string; color: string; size?: number }) {
  return (
    <span className="avatar" style={{ background: color, width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {(name.trim()[0] ?? '?').toUpperCase()}
    </span>
  );
}
