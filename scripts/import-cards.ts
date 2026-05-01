import { PrismaClient, Difficulty } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

interface CardInput {
  word: string;
  phonetic?: string;
  meaning: string;
  exampleFil?: string;
  exampleEng?: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: npm run import:cards -- <path-to-json>');
    console.error('Example: npm run import:cards -- content/verbs.json');
    process.exit(1);
  }

  let cards: CardInput[];
  try {
    cards = JSON.parse(readFileSync(resolve(filePath), 'utf-8'));
  } catch (e) {
    console.error(`Could not read ${filePath}:`, e);
    process.exit(1);
  }

  if (!Array.isArray(cards)) {
    console.error('File must contain a JSON array of card objects.');
    process.exit(1);
  }

  console.log(`Importing ${cards.length} cards from ${filePath}...`);

  let created = 0;
  let updated = 0;
  const errors: string[] = [];

  for (const card of cards) {
    if (!card.word || !card.meaning || !card.category || !card.difficulty) {
      errors.push(`Skipped: missing required field on "${card.word ?? 'unknown'}"`);
      continue;
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(card.difficulty)) {
      errors.push(`Skipped "${card.word}": difficulty must be beginner, intermediate, or advanced`);
      continue;
    }

    try {
      const existing = await prisma.card.findFirst({ where: { word: card.word } });

      const data = {
        phonetic: card.phonetic ?? '',
        meaning: card.meaning,
        exampleFil: card.exampleFil ?? '',
        exampleEng: card.exampleEng ?? '',
        category: card.category,
        difficulty: Difficulty[card.difficulty],
      };

      if (existing) {
        await prisma.card.update({ where: { id: existing.id }, data });
        updated++;
      } else {
        await prisma.card.create({ data: { word: card.word, ...data } });
        created++;
      }
    } catch (e) {
      errors.push(`Error on "${card.word}": ${e}`);
    }
  }

  console.log(`\nDone.`);
  console.log(`  Created: ${created}`);
  console.log(`  Updated: ${updated}`);
  if (errors.length) {
    console.log(`  Skipped/errors: ${errors.length}`);
    errors.forEach((e) => console.log(`    - ${e}`));
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
