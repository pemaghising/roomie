export function Sprout({ size = 56, grow = 1 }: { size?: number; grow?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden className="sprout" style={{ ['--grow' as string]: grow }}>
      <path d="M32 58V30" stroke="#065F46" strokeWidth="4" strokeLinecap="round" />
      <path className="sprout__leaf sprout__leaf--l" d="M31 34C21 34 14 27 13 18c10 0 17 6 18 16Z" fill="#34D399" />
      <path className="sprout__leaf sprout__leaf--r" d="M33 30c7 0 12-5 13-11-7 0-12 4-13 11Z" fill="#6EE7B7" />
    </svg>
  );
}
