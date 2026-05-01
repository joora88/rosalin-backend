export type Rating = 'again' | 'hard' | 'good';

export interface CardState {
  easeFactor: number;
  interval: number;
  repetitions: number;
}

export interface SM2Result extends CardState {
  nextReview: Date;
}

export function sm2(state: CardState, rating: Rating): SM2Result {
  let { easeFactor, interval, repetitions } = state;

  if (rating === 'again') {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  } else if (rating === 'hard') {
    interval = Math.max(1, Math.round(interval * 1.2));
    easeFactor = Math.max(1.3, easeFactor - 0.15);
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    easeFactor = Math.min(2.5, easeFactor + 0.1);
    repetitions += 1;
  }

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  return { easeFactor, interval, repetitions, nextReview };
}
