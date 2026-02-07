export type TimeDiff = {
  totalDays: number;
  totalHours: number;
  monthsApprox: number;
  weeks: number;
  remainingDays: number;
};

export function diffFromStart(startISO: string, now = new Date()): TimeDiff {
  const start = new Date(startISO);
  const rawMs = now.getTime() - start.getTime();
  const totalMs = Number.isFinite(rawMs) ? Math.max(0, rawMs) : 0;

  const totalDays = Math.floor(totalMs / 86_400_000);
  const totalHours = Math.floor(totalMs / 3_600_000);
  const monthsApprox = Math.floor(totalDays / 30);
  const weeks = Math.floor(totalDays / 7);
  const remainingDays = totalDays % 7;

  return {
    totalDays,
    totalHours,
    monthsApprox,
    weeks,
    remainingDays,
  };
}
