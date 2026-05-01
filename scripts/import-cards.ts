import { PrismaClient, Difficulty } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';

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

function resolveFiles(target: string): string[] {
  const abs = resolve(target);
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    return readdirSync(abs)
      .filter((f) => extname(f) === '.json')
      .sort()
      .map((f) => join(abs, f));
  }
  return [abs];
}

async function importFile(filePath: string): Promise<{ created: number; updated: number; errors: string[] }> {
  let cards: CardInput[];
  try {
    cards = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return { created: 0, updated: 0, errors: [`Could not parse ${filePath}: ${e}`] };
  }

  if (!Array.isArray(cards)) {
    return { created: 0, updated: 0, errors: [`${filePath}: must be a JSON array`] };
  }

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

  return { created, updated, errors };
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error('Usage: npm run import:cards -- <file.json|directory>');
    console.error('  Single file:  npm run import:cards -- content/chapter-01.json');
    console.error('  All in dir:   npm run import:cards -- content/');
    process.exit(1);
  }

  let files: string[];
  try {
    files = resolveFiles(target);
  } catch {
    console.error(`Could not read: ${target}`);
    process.exit(1);
  }

  if (files.length === 0) {
    console.error(`No .json files found in ${target}`);
    process.exit(1);
  }

  console.log(`Found ${files.length} file${files.length !== 1 ? 's' : ''}:\n`);

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  for (const file of files) {
    process.stdout.write(`  ${file.split('/').pop()} ... `);
    const { created, updated, errors } = await importFile(file);
    totalCreated += created;
    totalUpdated += updated;
    totalErrors += errors.length;
    console.log(`+${created} created, ~${updated} updated${errors.length ? `, ${errors.length} skipped` : ''}`);
    errors.forEach((e) => console.log(`    ⚠ ${e}`));
  }

  console.log(`\nTotal: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} skipped`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
