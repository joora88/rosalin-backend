import { Router, Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { scenarios } from '../config/scenarios';
import { levelFromXp, XP } from '../lib/xp';
import { calculateStreak } from '../lib/streak';

const router = Router();
router.use(authenticate);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// GET /v1/conversation/scenarios
router.get('/scenarios', (_req, res) => {
  res.json(scenarios.map(({ id, title, objective, openingLine }) => ({ id, title, objective, openingLine })));
});

// POST /v1/conversation/message
router.post('/message', async (req: AuthRequest, res: Response) => {
  const userId = req.userId!;
  const { scenarioId, messages, conversationId } = req.body as {
    scenarioId: string;
    messages: { role: 'user' | 'assistant'; content: string }[];
    conversationId?: string;
  };

  const scenario = scenarios.find((s) => s.id === scenarioId);
  if (!scenario) {
    res.status(400).json({ error: 'Invalid scenario' });
    return;
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Messages required' });
    return;
  }

  try {
    const systemPrompt = `You are Ate Maya, a warm, patient, and encouraging Filipino conversation tutor.

Scenario: ${scenario.context}
Objective: ${scenario.objective}

Rules:
- Respond naturally in Filipino/English code-switching (mix both, as real Filipinos do)
- Keep responses concise — 2-4 sentences max
- Gently correct any Filipino mistakes the user makes, inline and kindly
- Introduce exactly one new Filipino word or phrase per turn, briefly explaining it
- End each response with the format: [EN: english translation of your response]
- Never break character
- Be warm, encouraging, and culturally authentic`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : '';

    // Update or create conversation record and award XP
    let convId = conversationId;
    if (convId) {
      await prisma.conversation.update({
        where: { id: convId },
        data: { turnCount: { increment: 1 }, xpAwarded: { increment: XP.conversationTurn } },
      });
    } else {
      const conv = await prisma.conversation.create({
        data: { userId, scenarioId, turnCount: 1, xpAwarded: XP.conversationTurn },
      });
      convId = conv.id;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const { streakDays, streakLastDate } = calculateStreak(user.streakDays, user.streakLastDate);
      const newXp = user.xpTotal + XP.conversationTurn;
      await prisma.user.update({
        where: { id: userId },
        data: { xpTotal: newXp, level: levelFromXp(newXp), streakDays, streakLastDate },
      });
    }

    res.json({ reply, conversationId: convId, xpEarned: XP.conversationTurn });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/conversation/tts
router.post('/tts', async (req: AuthRequest, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text) {
    res.status(400).json({ error: 'Text required' });
    return;
  }

  const textHash = createHash('sha256').update(text).digest('hex');

  try {
    const cached = await prisma.ttsCache.findUnique({ where: { textHash } });
    if (cached) {
      res.json({ audioUrl: cached.audioUrl });
      return;
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

    if (!ELEVENLABS_API_KEY) {
      res.status(503).json({ error: 'TTS not configured' });
      return;
    }

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75 } }),
    });

    if (!response.ok) {
      res.status(502).json({ error: 'TTS generation failed' });
      return;
    }

    // Return audio directly as base64 for MVP (Phase 2 will use R2/CDN storage)
    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    await prisma.ttsCache.create({ data: { textHash, audioUrl } });

    res.json({ audioUrl });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
