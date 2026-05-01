import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';

const router = Router();
router.use(authenticate);

// POST /v1/sessions — start a session
router.post('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { mode = 'flashcard', category, cardCount } = req.body as {
    mode?: string;
    category?: string;
    cardCount: number;
  };

  if (!cardCount || cardCount < 1) {
    res.status(400).json({ error: 'cardCount required' });
    return;
  }

  try {
    const session = await prisma.studySession.create({
      data: { userId, mode, category: category ?? null, cardCount },
    });
    res.json({ sessionId: session.id });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/sessions/:id/complete — mark session done
router.patch('/:id/complete', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);
  const { xpEarned } = req.body as { xpEarned: number };

  try {
    await prisma.studySession.updateMany({
      where: { id, userId },
      data: { completedAt: new Date(), xpEarned: xpEarned ?? 0 },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/sessions — history (50 most recent)
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const sessions = await prisma.studySession.findMany({
      where: { userId },
      orderBy: { startedAt: 'desc' },
      take: 50,
      include: { _count: { select: { cards: true } } },
    });
    res.json(sessions.map((s) => ({
      id: s.id,
      mode: s.mode,
      category: s.category,
      cardCount: s.cardCount,
      xpEarned: s.xpEarned,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      cardsReviewed: s._count.cards,
    })));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
