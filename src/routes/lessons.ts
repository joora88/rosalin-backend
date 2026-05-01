import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { levelFromXp, XP } from '../lib/xp';
import { calculateStreak } from '../lib/streak';

const router = Router();
router.use(authenticate);

// GET /v1/lessons
router.get('/', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;

  try {
    const lessons = await prisma.lesson.findMany({ orderBy: { orderIndex: 'asc' } });
    const completions = await prisma.userLesson.findMany({ where: { userId } });
    const completedIds = new Set(completions.map((c) => c.lessonId));

    const result = lessons.map((lesson, index) => ({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      orderIndex: lesson.orderIndex,
      difficulty: lesson.difficulty,
      completed: completedIds.has(lesson.id),
      locked: index > 0 && !completedIds.has(lessons[index - 1].id),
    }));

    res.json(result);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /v1/lessons/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    // Check lock — lesson N requires N-1 to be complete
    if (lesson.orderIndex > 1) {
      const prev = await prisma.lesson.findFirst({ where: { orderIndex: lesson.orderIndex - 1 } });
      if (prev) {
        const prevComplete = await prisma.userLesson.findUnique({
          where: { userId_lessonId: { userId, lessonId: prev.id } },
        });
        if (!prevComplete) {
          res.status(403).json({ error: 'Complete the previous lesson first' });
          return;
        }
      }
    }

    // Strip correct answers from quiz before sending to client
    const content = lesson.contentJson as { sections: unknown[]; quiz: { id: string; question: string; options: string[]; correct: number }[] };
    const safeQuiz = content.quiz.map(({ id, question, options }) => ({ id, question, options }));

    res.json({
      id: lesson.id,
      title: lesson.title,
      slug: lesson.slug,
      difficulty: lesson.difficulty,
      sections: content.sections,
      quiz: safeQuiz,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/lessons/:id/complete
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const id = String(req.params.id);
  const { answers } = req.body as { answers: Record<string, number> };

  if (!answers || typeof answers !== 'object') {
    res.status(400).json({ error: 'Answers required' });
    return;
  }

  try {
    const lesson = await prisma.lesson.findUnique({ where: { id } });
    if (!lesson) {
      res.status(404).json({ error: 'Lesson not found' });
      return;
    }

    const alreadyDone = await prisma.userLesson.findUnique({
      where: { userId_lessonId: { userId, lessonId: id } },
    });
    if (alreadyDone) {
      res.status(409).json({ error: 'Lesson already completed' });
      return;
    }

    const content = lesson.contentJson as { sections: unknown[]; quiz: { id: string; question: string; options: string[]; correct: number }[] };
    const total = content.quiz.length;
    const correct = content.quiz.filter((q) => answers[q.id] === q.correct).length;
    const score = Math.round((correct / total) * 100);
    const xpEarned = score === 100 ? XP.lessonFullMarks : XP.lessonPartial;

    await prisma.userLesson.create({
      data: { userId, lessonId: id, completedAt: new Date(), quizScore: score, xpAwarded: xpEarned },
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { streakDays, streakLastDate } = calculateStreak(user.streakDays, user.streakLastDate);
      const newXp = user.xpTotal + xpEarned;
      await prisma.user.update({
        where: { id: userId },
        data: { xpTotal: newXp, level: levelFromXp(newXp), streakDays, streakLastDate },
      });
    }

    res.json({ score, correct, total, xpEarned });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
