import type { Rating } from './sm2';

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500];

export const XP = {
  cardGood: 20,
  cardHard: 8,
  cardAgain: 0,
  conversationTurn: 15,
  lessonFullMarks: 50,
  lessonPartial: 20,
  dailyStreakBonus: 25,
} as const;

export function xpForCardRating(rating: Rating): number {
  if (rating === 'good') return XP.cardGood;
  if (rating === 'hard') return XP.cardHard;
  return XP.cardAgain;
}

export function levelFromXp(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
    else break;
  }
  return level;
}
