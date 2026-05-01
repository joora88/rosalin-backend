import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import cardRoutes from './routes/cards';
import sessionRoutes from './routes/sessions';
import conversationRoutes from './routes/conversation';
import lessonRoutes from './routes/lessons';
import userRoutes from './routes/user';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json({ limit: '10kb' }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/v1/auth', authRoutes);
app.use('/v1/cards', cardRoutes);
app.use('/v1/sessions', sessionRoutes);
app.use('/v1/conversation', conversationRoutes);
app.use('/v1/lessons', lessonRoutes);
app.use('/v1/user', userRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
