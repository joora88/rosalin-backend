import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { conjugationVerbs } from '../config/conjugations';

const router = Router();
router.use(authenticate);

// GET /v1/conjugations/verbs
router.get('/verbs', (_req: AuthRequest, res: Response) => {
  const summary = conjugationVerbs.map((v) => ({
    id: v.id,
    root: v.root,
    english: v.english,
    category: v.category,
    focusTypes: {
      actor: !!v.actorFocus,
      object: !!v.objectFocus,
      locative: !!v.locativeFocus,
      beneficiary: !!v.beneficiaryFocus,
    },
  }));
  res.json(summary);
});

// GET /v1/conjugations/verbs/:id
router.get('/verbs/:id', (req: AuthRequest, res: Response) => {
  const verb = conjugationVerbs.find((v) => v.id === req.params.id);
  if (!verb) {
    res.status(404).json({ error: 'Verb not found' });
    return;
  }
  res.json(verb);
});

export default router;
