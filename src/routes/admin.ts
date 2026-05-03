import { Router, Request, Response, NextFunction } from 'express';
import { timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

interface AdminRequest extends Request {
  isAdmin?: boolean;
}

function adminAuth(req: AdminRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.ADMIN_JWT_SECRET!) as { isAdmin: boolean };
    if (!payload.isAdmin) throw new Error();
    req.isAdmin = true;
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

// POST /v1/admin/login
router.post('/login', (req: Request, res: Response) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!password || !adminPassword) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  let match = false;
  try {
    const a = Buffer.from(password);
    const b = Buffer.from(adminPassword);
    match = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    match = false;
  }

  if (!match) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = jwt.sign({ isAdmin: true }, process.env.ADMIN_JWT_SECRET!, { expiresIn: '8h' });
  res.json({ token });
});

// GET /v1/admin/users
router.get('/users', adminAuth, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, displayName: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /v1/admin/users/:id
router.patch('/users/:id', adminAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== 'approved' && status !== 'rejected' && status !== 'pending') {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, email: true, displayName: true, status: true },
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'User not found' });
  }
});

export default router;
