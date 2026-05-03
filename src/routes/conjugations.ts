import { Router, Response } from 'express';
import { createHash } from 'crypto';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import prisma from '../lib/prisma';

const router = Router();
router.use(authenticate);

const VOICES = {
  female: process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL',
  male: process.env.ELEVENLABS_VOICE_ID_MALE || 'pNInz6obpgDQGcFmaJgB',
};

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

// POST /v1/conjugations/tts
router.post('/tts', async (req: AuthRequest, res: Response) => {
  const { text, voice } = req.body as { text: string; voice?: 'male' | 'female' };
  if (!text?.trim()) {
    res.status(400).json({ error: 'Text required' });
    return;
  }

  const voiceId = VOICES[voice === 'male' ? 'male' : 'female'];
  const textHash = createHash('sha256').update(`${voiceId}:${text}`).digest('hex');

  try {
    const cached = await prisma.ttsCache.findUnique({ where: { textHash } });
    if (cached) {
      res.json({ audioUrl: cached.audioUrl });
      return;
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    if (!ELEVENLABS_API_KEY) {
      res.status(503).json({ error: 'TTS not configured' });
      return;
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': ELEVENLABS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });

    if (!response.ok) {
      res.status(502).json({ error: 'TTS generation failed' });
      return;
    }

    const audioBase64 = Buffer.from(await response.arrayBuffer()).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    await prisma.ttsCache.create({ data: { textHash, audioUrl } });
    res.json({ audioUrl });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
