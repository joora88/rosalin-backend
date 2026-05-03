import { PrismaClient, FocusType, Aspect } from '@prisma/client';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, extname } from 'path';

const prisma = new PrismaClient();

interface ExampleInput {
  tagalog: string;
  english: string;
}

interface FormInput {
  word: string;
  examples: ExampleInput[];
}

interface FocusTypeInput {
  affix: string;
  forms: {
    infinitive: FormInput;
    completed: FormInput;
    incomplete: FormInput;
    contemplated: FormInput;
  };
}

interface VerbInput {
  id: string;
  root: string;
  english: string;
  category: string;
  notes?: string;
  focusTypes: Partial<Record<'actor' | 'object' | 'locative' | 'beneficiary', FocusTypeInput>>;
}

const FOCUS_TYPE_MAP: Record<string, FocusType> = {
  actor: FocusType.actor,
  object: FocusType.object,
  locative: FocusType.locative,
  beneficiary: FocusType.beneficiary,
};

const ASPECT_MAP: Record<string, Aspect> = {
  infinitive: Aspect.infinitive,
  completed: Aspect.completed,
  incomplete: Aspect.incomplete,
  contemplated: Aspect.contemplated,
};

function resolveFiles(target: string): string[] {
  const abs = resolve(target);
  const stat = statSync(abs);
  if (stat.isDirectory()) {
    return readdirSync(abs)
      .sort()
      .flatMap((f) => resolveFiles(join(abs, f)))
      .filter((f) => extname(f) === '.json');
  }
  return extname(abs) === '.json' ? [abs] : [];
}

async function importFile(filePath: string, force: boolean): Promise<{ created: number; updated: number; errors: string[] }> {
  let verb: VerbInput;
  try {
    verb = JSON.parse(readFileSync(filePath, 'utf-8'));
  } catch (e) {
    return { created: 0, updated: 0, errors: [`Could not parse ${filePath}: ${e}`] };
  }

  const errors: string[] = [];

  if (!verb.id || !verb.root || !verb.english || !verb.category) {
    return { created: 0, updated: 0, errors: [`${filePath}: missing required field (id, root, english, category)`] };
  }

  if (!verb.focusTypes || Object.keys(verb.focusTypes).length === 0) {
    return { created: 0, updated: 0, errors: [`${filePath}: focusTypes must not be empty`] };
  }

  const existing = await prisma.verb.findUnique({ where: { id: verb.id } });
  if (existing && !force) {
    return { created: 0, updated: 0, errors: [] };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (existing) {
        // Delete child rows so we can re-create cleanly
        const focusTypeIds = (await tx.verbFocusType.findMany({ where: { verbId: verb.id }, select: { id: true } })).map((f) => f.id);
        const formIds = (await tx.verbForm.findMany({ where: { focusTypeId: { in: focusTypeIds } }, select: { id: true } })).map((f) => f.id);
        await tx.verbExample.deleteMany({ where: { formId: { in: formIds } } });
        await tx.verbForm.deleteMany({ where: { focusTypeId: { in: focusTypeIds } } });
        await tx.verbFocusType.deleteMany({ where: { verbId: verb.id } });
        await tx.verb.update({ where: { id: verb.id }, data: { root: verb.root, english: verb.english, category: verb.category, notes: verb.notes ?? null } });
      } else {
        await tx.verb.create({ data: { id: verb.id, root: verb.root, english: verb.english, category: verb.category, notes: verb.notes ?? null } });
      }

      for (const [focusKey, focusData] of Object.entries(verb.focusTypes)) {
        if (!focusData) continue;
        const focusType = FOCUS_TYPE_MAP[focusKey];
        if (!focusType) {
          errors.push(`Unknown focus type "${focusKey}" in ${filePath}`);
          continue;
        }

        const focusTypeRecord = await tx.verbFocusType.create({
          data: { verbId: verb.id, type: focusType, affix: focusData.affix },
        });

        for (const [aspectKey, formData] of Object.entries(focusData.forms)) {
          const aspect = ASPECT_MAP[aspectKey];
          if (!aspect) {
            errors.push(`Unknown aspect "${aspectKey}" in ${filePath}`);
            continue;
          }

          const formRecord = await tx.verbForm.create({
            data: { focusTypeId: focusTypeRecord.id, aspect, word: formData.word },
          });

          if (formData.examples.length > 0) {
            await tx.verbExample.createMany({
              data: formData.examples.map((ex) => ({ formId: formRecord.id, tagalog: ex.tagalog, english: ex.english })),
            });
          }
        }
      }
    }, { timeout: 30000 });
  } catch (e) {
    return { created: 0, updated: 0, errors: [`Error importing "${verb.id}": ${e}`] };
  }

  return { created: existing ? 0 : 1, updated: existing ? 1 : 0, errors };
}

async function main() {
  const target = process.argv[2];
  const force = process.argv.includes('--force');

  if (!target) {
    console.error('Usage: npm run import:conjugations -- <file.json|directory> [--force]');
    console.error('  Single file:  npm run import:conjugations -- data/conjugations/kain.json');
    console.error('  All in dir:   npm run import:conjugations -- data/conjugations/');
    console.error('  Force update: npm run import:conjugations -- data/conjugations/ --force');
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
    const { created, updated, errors } = await importFile(file, force);
    totalCreated += created;
    totalUpdated += updated;
    totalErrors += errors.length;
    const parts = [];
    if (created > 0) parts.push(`+${created} created`);
    if (updated > 0) parts.push(`${updated} updated`);
    if (errors.length > 0) parts.push(`${errors.length} errors`);
    if (parts.length === 0) parts.push('already exists (use --force to overwrite)');
    console.log(parts.join(', '));
    errors.forEach((e) => console.log(`    ⚠ ${e}`));
  }

  console.log(`\nTotal: ${totalCreated} created, ${totalUpdated} updated, ${totalErrors} errors`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
