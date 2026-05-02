import { Router, Response } from 'express';
import OpenAI from 'openai';
import { createHash } from 'crypto';
import prisma from '../lib/prisma';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { scenarios, characters } from '../config/scenarios';
import { levelFromXp, XP } from '../lib/xp';
import { calculateStreak } from '../lib/streak';

const router = Router();
router.use(authenticate);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /v1/conversation/scenarios — returns all scenarios with character info
router.get('/scenarios', (_req, res) => {
  res.json(scenarios.map(({ id, title, objective, openingLine, character }) => ({
    id,
    title,
    objective,
    openingLine,
    character: { id: character.id, name: character.name },
  })));
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
    // Fetch user first — needed for both personalization and XP update
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const userName = user?.displayName || 'the learner';
    const userLevel = user?.level ?? 1;

    const characterName = scenario.character.name;
    const characterMood = scenario.character.mood;
    const systemPrompt = `You are ${characterName}. Your disposition: ${characterMood}.

Scenario: ${scenario.context}
Objective: ${scenario.objective}

User: You are speaking with ${userName}, a level ${userLevel} Filipino learner. Address them by name when it feels natural — don't force it every turn. Use their name the way a real person would in this situation.

Rules:
- Stay completely in character — your personality and mood override all generic politeness defaults
- Respond in a way that fits your character's speech style (some characters code-switch Filipino/English, others use formal or old-fashioned Tagalog, others use simple slang — follow what the scenario describes)
- Keep responses concise — 2-4 sentences max
- When the user makes a Filipino mistake, correct it in a way that fits your character (blunt, impatient, amused, gentle — whatever is true to who you are)
- Introduce exactly one new Filipino word or phrase per turn, worked naturally into your response
- Never break character`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1',
      max_tokens: 300,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    });

    const reply = response.choices[0]?.message?.content ?? '';

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
  const { text, characterId } = req.body as { text: string; characterId?: string };
  if (!text) {
    res.status(400).json({ error: 'Text required' });
    return;
  }

  const character = characterId ? characters[characterId] : null;
  const voiceId = character?.voiceId || process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL';

  // Include voiceId in cache key so different characters don't share cached audio
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

    const audioBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(audioBuffer).toString('base64');
    const audioUrl = `data:audio/mpeg;base64,${audioBase64}`;

    await prisma.ttsCache.create({ data: { textHash, audioUrl } });

    res.json({ audioUrl });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/conversation/translate — word or sentence translation via DeepL
router.post('/translate', async (req: AuthRequest, res: Response) => {
  const { text } = req.body as { text: string };
  if (!text?.trim()) {
    res.status(400).json({ error: 'Text required' });
    return;
  }

  const DEEPL_API_KEY = process.env.DEEPL_API_KEY;
  if (!DEEPL_API_KEY) {
    res.status(503).json({ error: 'Translation not configured' });
    return;
  }

  // Free-tier keys end with :fx and use a different subdomain
  const deeplUrl = DEEPL_API_KEY.endsWith(':fx')
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  try {
    const response = await fetch(deeplUrl, {
      method: 'POST',
      headers: {
        'Authorization': `DeepL-Auth-Key ${DEEPL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: [text], target_lang: 'EN' }),
    });

    if (!response.ok) {
      res.status(502).json({ error: 'Translation failed' });
      return;
    }

    const data = await response.json() as { translations: { text: string }[] };
    res.json({ translation: data.translations[0]?.text ?? '' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
