const MS_PER_DAY = 86_400_000;

export const DEFAULT_GENTLE_AFFIRMATION = 'One steady day at a time.';

export const GENTLE_AFFIRMATIONS = [
  'Breathe. You are doing enough for today.',
  'Small steady steps still move you forward.',
  'Your calm effort is creating real change.',
  'You are allowed to go gently and keep going.',
  'Today counts, even if it feels quiet.',
  'You are building trust with yourself.',
  'One choice at a time is more than enough.',
  'You are safe to keep this simple.',
  'A gentle pace is still progress.',
  'You are meeting this day with strength.',
];

export const getAffirmationForDayNumber = (dayNumber: number): string => {
  if (GENTLE_AFFIRMATIONS.length === 0) {
    return DEFAULT_GENTLE_AFFIRMATION;
  }

  const safeDayNumber = Number.isFinite(dayNumber) ? Math.max(0, Math.floor(dayNumber)) : 0;
  return GENTLE_AFFIRMATIONS[safeDayNumber % GENTLE_AFFIRMATIONS.length];
};

export const getLocalCalendarDayNumber = (value: Date): number =>
  Math.floor(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / MS_PER_DAY);
