import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { sm2 } from '../lib/sm2';
import { xpForCardRating, levelFromXp } from '../lib/xp';
import { calculateStreak } from '../lib/streak';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import type { Rating } from '../lib/sm2';

const router = Router();
router.use(authenticate);

// GET /v1/cards/categories
router.get('/categories', async (_req, res: Response) => {
  try {
    const groups = await prisma.card.groupBy({
      by: ['category'],
      _count: { id: true },
      orderBy: { category: 'asc' },
    });
    res.json(groups.map((g) => ({ name: g.category, count: g._count.id })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/cards/due
router.get('/due', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const now = new Date();
  const { category, random, limit } = req.query;
  const cap = Math.min(50, Math.max(1, parseInt(String(limit ?? '20'), 10) || 20));
  const isRandom = random === 'true';
  const categoryFilter = category ? { category: String(category) } : {};

  try {
    if (isRandom) {
      const startedUserCards = await prisma.userCard.findMany({
        where: { userId },
        include: { card: true },
      });

      if (startedUserCards.length === 0) {
        // No history yet — fall back to new cards in random order
        const allIds = await prisma.card.findMany({ select: { id: true } });
        const shuffledIds = allIds.sort(() => Math.random() - 0.5).slice(0, cap).map((c) => c.id);
        const newCards = await prisma.card.findMany({ where: { id: { in: shuffledIds } } });
        res.json({ due: [], new: newCards });
        return;
      }

      // Fisher-Yates shuffle then slice
      for (let i = startedUserCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [startedUserCards[i], startedUserCards[j]] = [startedUserCards[j], startedUserCards[i]];
      }
      const selected = startedUserCards.slice(0, cap);
      const cards = selected.map((uc) => ({
        ...uc.card,
        easeFactor: uc.easeFactor,
        interval: uc.interval,
        repetitions: uc.repetitions,
        nextReview: uc.nextReview,
      }));
      res.json({ due: cards, new: [] });
      return;
    }

    const allCards = await prisma.card.findMany({ where: categoryFilter, select: { id: true } });
    const started = await prisma.userCard.findMany({ where: { userId }, select: { cardId: true } });
    const startedIds = new Set(started.map((c) => c.cardId));
    const newCardIds = allCards.map((c) => c.id).filter((id) => !startedIds.has(id));

    const dueUserCards = await prisma.userCard.findMany({
      where: {
        userId,
        nextReview: { lte: now },
        ...(category ? { card: { category: String(category) } } : {}),
      },
      include: { card: true },
      orderBy: { nextReview: 'asc' },
      take: cap,
    });

    const dueCards = dueUserCards.map((uc) => ({
      ...uc.card,
      easeFactor: uc.easeFactor,
      interval: uc.interval,
      repetitions: uc.repetitions,
      nextReview: uc.nextReview,
    }));

    const remaining = Math.max(0, cap - dueCards.length);
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
  const { rating, sessionId } = req.body as { rating: Rating; sessionId?: string };

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

    if (sessionId) {
      await prisma.sessionCard.create({ data: { sessionId, cardId, rating } });
    }

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
