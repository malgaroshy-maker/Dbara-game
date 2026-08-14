/**
 * Applies field edits to question and puzzle records from a JSON file.
 *
 *   node scripts/apply-edits.mjs <edits.json>
 *
 * The file maps a record id to the fields to replace:
 *
 *   { "spo_09": { "funFact": "…" }, "cross_gen_07": { "funFact": "…" } }
 *
 * Written for the leak clean-up, where the same few fields had to be rewritten
 * across dozens of records in several banks — doing that by hand invites the
 * silent mistake of editing the wrong record with the right text.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const editsPath = process.argv[2];
if (!editsPath) {
  console.error('usage: node scripts/apply-edits.mjs <edits.json>');
  process.exit(2);
}
const edits = JSON.parse(readFileSync(editsPath, 'utf8'));

const files = [
  ...readdirSync(join(root, 'src', 'data', 'questions'))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => join(root, 'src', 'data', 'questions', f)),
  join(root, 'src', 'data', 'puzzles', 'wordScramble.ts'),
  join(root, 'src', 'data', 'puzzles', 'crosswords.ts'),
];

/** End of the single-quoted string starting at `from`, honouring escapes. */
const closingQuote = (text, from) => {
  let i = from;
  for (;;) {
    i = text.indexOf("'", i);
    if (i === -1) return -1;
    if (text[i - 1] !== '\\') return i;
    i += 1;
  }
};

const applied = new Set();

for (const file of files) {
  let source = readFileSync(file, 'utf8');
  const before = source;

  for (const [id, fields] of Object.entries(edits)) {
    const at = source.indexOf(`id: '${id}',`);
    if (at === -1) continue;
    // The record ends at the first closing brace that starts a line.
    const recordEnd = source.indexOf('\n  },', at);

    for (const [field, value] of Object.entries(fields)) {
      const key = `${field}: '`;
      let start = source.indexOf(key, at);
      if (start === -1 || (recordEnd !== -1 && start > recordEnd)) {
        // The field is absent — insert it just before the reward line.
        const anchor = source.indexOf('rewardDinars:', at);
        if (anchor === -1) {
          console.error(`✗ ${id}: no ${field} and nowhere to put it`);
          continue;
        }
        source = `${source.slice(0, anchor)}${field}: '${value.replace(/'/g, "\\'")}',\n    ${source.slice(anchor)}`;
        applied.add(`${id}.${field}`);
        continue;
      }
      const valueStart = start + key.length;
      const valueEnd = closingQuote(source, valueStart);
      source = source.slice(0, valueStart) + value.replace(/'/g, "\\'") + source.slice(valueEnd);
      applied.add(`${id}.${field}`);
    }
  }

  if (source !== before) writeFileSync(file, source);
}

const wanted = Object.entries(edits).flatMap(([id, f]) => Object.keys(f).map((k) => `${id}.${k}`));
const missing = wanted.filter((w) => !applied.has(w));
console.log(`طُبّق ${applied.size} من ${wanted.length} تعديلاً`);
if (missing.length) {
  console.error(`لم يُطبَّق: ${missing.join(', ')}`);
  process.exit(1);
}
