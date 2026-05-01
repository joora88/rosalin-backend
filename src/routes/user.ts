import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// GET /v1/user/profile
router.get('/profile', async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      select: { id: true, email: true, displayName: true, xpTotal: true, level: true, streakDays: true, streakLastDate: true, createdAt: true },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /v1/user/profile
router.put('/profile', async (req: AuthRequest, res: Response) => {
  const { displayName } = req.body as { displayName?: string };

  try {
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { ...(displayName !== undefined && { displayName }) },
      select: { id: true, email: true, displayName: true, xpTotal: true, level: true, streakDays: true },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/user/progress
router.get('/progress', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { xpTotal: true, level: true, streakDays: true, streakLastDate: true },
    });

    const totalCards = await prisma.card.count();
    const startedCards = await prisma.userCard.count({ where: { userId } });
    const masteredCards = await prisma.userCard.count({ where: { userId, interval: { gte: 21 } } });
    const dueCards = await prisma.userCard.count({ where: { userId, nextReview: { lte: new Date() } } });

    const totalLessons = await prisma.lesson.count();
    const completedLessons = await prisma.userLesson.count({ where: { userId } });

    const conversations = await prisma.conversation.aggregate({
      where: { userId },
      _sum: { turnCount: true, xpAwarded: true },
      _count: { id: true },
    });

    res.json({
      user,
      flashcards: { total: totalCards, started: startedCards, mastered: masteredCards, due: dueCards },
      lessons: { total: totalLessons, completed: completedLessons },
      conversations: {
        total: conversations._count.id,
        totalTurns: conversations._sum.turnCount ?? 0,
        totalXp: conversations._sum.xpAwarded ?? 0,
      },
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
