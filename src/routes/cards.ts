import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { sm2 } from '../lib/sm2';
import { xpForCardRating, levelFromXp } from '../lib/xp';
import { calculateStreak } from '../lib/streak';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import type { Rating } from '../lib/sm2';

const router = Router();
router.use(authenticate);

// GET /v1/cards/due
router.get('/due', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();

  try {
    // New cards the user hasn't started yet (no user_card row)
    const allCards = await prisma.card.findMany({ select: { id: true } });
    const started = await prisma.userCard.findMany({ where: { userId }, select: { cardId: true } });
    const startedIds = new Set(started.map((c) => c.cardId));
    const newCardIds = allCards.map((c) => c.id).filter((id) => !startedIds.has(id));

    // Due cards (have a user_card row and nextReview <= now)
    const dueUserCards = await prisma.userCard.findMany({
      where: { userId, nextReview: { lte: now } },
      include: { card: true },
      orderBy: { nextReview: 'asc' },
      take: 20,
    });

    const dueCards = dueUserCards.map((uc) => ({
      ...uc.card,
      easeFactor: uc.easeFactor,
      interval: uc.interval,
      repetitions: uc.repetitions,
      nextReview: uc.nextReview,
    }));

    // Fill remaining slots with new cards (up to 20 total)
    const remaining = Math.max(0, 20 - dueCards.length);
    const newCards = remaining > 0
      ? await prisma.card.findMany({ where: { id: { in: newCardIds.slice(0, remaining) } } })
      : [];

    res.json({ due: dueCards, new: newCards });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/cards/stats
router.get('/stats', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();

  try {
    const total = await prisma.card.count();
    const started = await prisma.userCard.count({ where: { userId } });
    const due = await prisma.userCard.count({ where: { userId, nextReview: { lte: now } } });
    const mastered = await prisma.userCard.count({ where: { userId, interval: { gte: 21 } } });

    res.json({ total, started, due, mastered });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/cards/:id/review
router.post('/:id/review', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const cardId = String(req.params.id);
  const { rating } = req.body as { rating: Rating };

  if (!['again', 'hard', 'good'].includes(rating)) {
    res.status(400).json({ error: 'Rating must be again, hard, or good' });
    return;
  }

  try {
    const card = await prisma.card.findUnique({ where: { id: cardId } });
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const existing = await prisma.userCard.findUnique({ where: { userId_cardId: { userId, cardId } } });

    const currentState = existing
      ? { easeFactor: existing.easeFactor, interval: existing.interval, repetitions: existing.repetitions }
      : { easeFactor: 2.5, interval: 1, repetitions: 0 };

    const result = sm2(currentState, rating);
    const xpEarned = xpForCardRating(rating);

    await prisma.userCard.upsert({
      where: { userId_cardId: { userId, cardId } },
      create: { userId, cardId, ...result, lastReviewed: new Date() },
      update: { ...result, lastReviewed: new Date() },
    });

    // Award XP and update streak
    if (xpEarned > 0) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        const { streakDays, streakLastDate } = calculateStreak(user.streakDays, user.streakLastDate);
        const isNewDay = streakLastDate.getTime() !== (user.streakLastDate ? new Date(user.streakLastDate).setHours(0,0,0,0) : -1);
        const streakBonus = isNewDay && streakDays > 1 ? 25 : 0;
        const newXp = user.xpTotal + xpEarned + streakBonus;

        await prisma.user.update({
          where: { id: userId },
          data: { xpTotal: newXp, level: levelFromXp(newXp), streakDays, streakLastDate },
        });
      }
    }

    res.json({ ...result, xpEarned });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
