import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import prisma from '../lib/prisma';

const router = Router();

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateTokens(userId: string) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '15m' });
  const refreshToken = randomBytes(40).toString('hex');
  return { accessToken, refreshToken };
}

function refreshTokenExpiry() {
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
}

// POST /v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  const { email, password, displayName } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email, passwordHash, displayName },
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshTokenExpiry() },
    });

    res.status(201).json({ accessToken, refreshToken });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await prisma.refreshToken.create({
      data: { userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshTokenExpiry() },
    });

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/auth/refresh
router.post('/refresh', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const stored = await prisma.refreshToken.findFirst({
      where: { tokenHash: hashToken(refreshToken), revoked: false, expiresAt: { gt: new Date() } },
    });

    if (!stored) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(stored.userId);
    await prisma.refreshToken.create({
      data: { userId: stored.userId, tokenHash: hashToken(newRefreshToken), expiresAt: refreshTokenExpiry() },
    });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /v1/auth/logout
router.post('/logout', async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken), revoked: false },
      data: { revoked: true },
    });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
