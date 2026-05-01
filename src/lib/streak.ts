export function calculateStreak(streakDays: number, streakLastDate: Date | null): { streakDays: number; streakLastDate: Date } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!streakLastDate) {
    return { streakDays: 1, streakLastDate: today };
  }

  const last = new Date(streakLastDate);
  last.setHours(0, 0, 0, 0);

  const diffDays = Math.round((today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return { streakDays, streakLastDate: last };
  } else if (diffDays === 1) {
    return { streakDays: streakDays + 1, streakLastDate: today };
  } else {
    return { streakDays: 1, streakLastDate: today };
  }
}
