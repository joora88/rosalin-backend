import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';

const router = Router();
router.use(authenticate);

// GET /v1/conjugations/verbs
router.get('/verbs', async (_req: AuthRequest, res: Response) => {
  const verbs = await prisma.verb.findMany({
    include: { focusTypes: { select: { type: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const summary = verbs.map((v) => {
    const types = new Set(v.focusTypes.map((ft) => String(ft.type)));
    return {
      id: v.id,
      root: v.root,
      english: v.english,
      category: v.category,
      focusTypes: {
        actor: types.has('actor'),
        object: types.has('object'),
        locative: types.has('locative'),
        beneficiary: types.has('beneficiary'),
      },
    };
  });

  res.json(summary);
});

// GET /v1/conjugations/verbs/:id
router.get('/verbs/:id', async (req: AuthRequest, res: Response) => {
  const verb = await prisma.verb.findUnique({
    where: { id: String(req.params['id']) },
    include: {
      focusTypes: {
        include: {
          forms: {
            include: { examples: true },
          },
        },
      },
    },
  });

  if (!verb) {
    res.status(404).json({ error: 'Verb not found' });
    return;
  }

  const shaped: Record<string, unknown> = {};
  for (const ft of verb.focusTypes) {
    const forms: Record<string, unknown> = {};
    for (const form of ft.forms) {
      forms[form.aspect] = {
        word: form.word,
        examples: form.examples.map((ex) => ({ tagalog: ex.tagalog, english: ex.english })),
      };
    }
    shaped[`${ft.type}Focus`] = { affix: ft.affix, forms };
  }

  res.json({
    id: verb.id,
    root: verb.root,
    english: verb.english,
    category: verb.category,
    notes: verb.notes ?? undefined,
    ...shaped,
  });
});

export default router;
