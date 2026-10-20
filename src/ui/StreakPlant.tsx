const STAGES = 8;

/** One growth stage per streak day: a seed at 0, fully grown from day 7. */
export const stageFor = (streak: number) => Math.min(STAGES, Math.max(1, Math.floor(streak) + 1));

/** The household streak as a growing plant. Decorative: the streak number is the accessible value. */
export function StreakPlant({ streak, height = 104 }: { streak: number; height?: number }) {
  const stage = stageFor(streak);
  return (
    <img key={stage} className="streak-plant" src={`/streak/stage-${stage}.webp`} alt="" aria-hidden
      width={Math.round(height * 183 / 240)} height={height} decoding="async" />
  );
}
