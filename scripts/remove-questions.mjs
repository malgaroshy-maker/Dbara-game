/**
 * Removes question records by id.
 *
 *   node scripts/remove-questions.mjs id1 id2 …
 *
 * Used to drop delegated drafts that turned out to duplicate a question the
 * bank already asks. Rewording cannot save those: when two records have the
 * same answer, the second one is not a new question, it is the same question
 * wearing different words.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const ids = process.argv.slice(2);
if (!ids.length) {
  console.error('usage: node scripts/remove-questions.mjs <id> [id…]');
  process.exit(2);
}

const dir = join(root, 'src', 'data', 'questions');
const removed = [];

for (const file of readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts')) {
  const path = join(dir, file);
  let source = readFileSync(path, 'utf8');
  const before = source;

  for (const id of ids) {
    const at = source.indexOf(`id: '${id}',`);
    if (at === -1) continue;
    // Walk back to the record's opening brace and forward past its closing one.
    const start = source.lastIndexOf('  {\n', at);
    const end = source.indexOf('\n  },', at);
    if (start === -1 || end === -1) {
      console.error(`✗ ${id}: could not find record bounds`);
      continue;
    }
    source = source.slice(0, start) + source.slice(end + '\n  },\n'.length);
    removed.push(id);
  }

  if (source !== before) writeFileSync(path, source);
}

console.log(`حُذف ${removed.length}: ${removed.join(', ')}`);
const missing = ids.filter((i) => !removed.includes(i));
if (missing.length) {
  console.error(`لم يُعثر على: ${missing.join(', ')}`);
  process.exit(1);
}
