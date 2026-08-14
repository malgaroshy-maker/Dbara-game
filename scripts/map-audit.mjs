/**
 * Reports how far each city pin is drawn from its true projected position.
 *
 *   node scripts/map-audit.mjs [zoom]
 *
 * The declutter pass moves overlapping symbols apart, which is deliberate — but
 * it is only honest while the drift stays small enough that the pin still
 * reads as the city. This turns that drift into a number, in kilometres on the
 * ground, so "some cities are in the wrong place" can be checked rather than
 * argued about.
 */
import { build } from 'esbuild';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const tmp = join(root, 'node_modules', '.cache', 'map-audit.mjs');

mkdirSync(dirname(tmp), { recursive: true });
writeFileSync(
  join(dirname(tmp), 'map-audit-entry.ts'),
  `
export { initialCities } from '../../src/data/cities';
export { projectToMap, MAP_IMAGE } from '../../src/features/map/projection';
export { declutterPins, MIN_PIN_DISTANCE, MAX_PIN_DRIFT } from '../../src/features/map/pinLayout';
`,
  'utf8'
);

await build({
  entryPoints: [join(dirname(tmp), 'map-audit-entry.ts')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: tmp,
  logLevel: 'warning',
});

const { initialCities, projectToMap, declutterPins, MIN_PIN_DISTANCE, MAX_PIN_DRIFT } = await import(
  pathToFileURL(tmp).href + `?t=${Date.now()}`
);

const zoom = Number(process.argv[2] ?? 1);
const separation = Number(process.argv[3] ?? MIN_PIN_DISTANCE);
const drift = Number(process.argv[4] ?? MAX_PIN_DRIFT);

/** Horizontal scale of the artwork, from projection.ts. */
const PX_PER_DEGREE_LON = 14.596;
const KM_PER_DEGREE_LON_AT = (lat) => 111.32 * Math.cos((lat * Math.PI) / 180);

const anchors = initialCities.map((c) => ({
  id: c.id,
  label: c.mapLabel ?? c.arabicName,
  lat: c.coordinates.latitude,
  point: projectToMap(c.coordinates.latitude, c.coordinates.longitude),
}));

const placed = declutterPins(
  anchors.map(({ id, point }) => ({ id, point })),
  separation / zoom,
  drift
);

/** Closest pair of drawn pins, i.e. the worst tap ambiguity left on the map. */
const tightestPair = () => {
  let best = { gap: Infinity, a: '', b: '' };
  for (let i = 0; i < anchors.length; i++) {
    for (let j = i + 1; j < anchors.length; j++) {
      const p = placed.get(anchors[i].id).display;
      const q = placed.get(anchors[j].id).display;
      const gap = Math.hypot(p.x - q.x, p.y - q.y);
      if (gap < best.gap) best = { gap, a: anchors[i].label, b: anchors[j].label };
    }
  }
  return best;
};

const rows = anchors
  .map((a) => {
    const p = placed.get(a.id);
    const dx = p.display.x - p.anchor.x;
    const dy = p.display.y - p.anchor.y;
    const px = Math.hypot(dx, dy);
    // Artwork pixels back to ground distance, at this city's latitude.
    const km = (px / PX_PER_DEGREE_LON) * KM_PER_DEGREE_LON_AT(a.lat);
    return { label: a.label, px, km };
  })
  .sort((x, y) => y.px - x.px);

const moved = rows.filter((r) => r.px > 0.75);
console.log(`التكبير ${zoom}× — الفاصل المطلوب ${(MIN_PIN_DISTANCE / zoom).toFixed(1)} بكسل`);
console.log(`مُزاح: ${moved.length}/${rows.length}`);
for (const r of rows) {
  if (r.px <= 0.75) continue;
  console.log(`  ${r.label.padEnd(10)} ${r.px.toFixed(1).padStart(5)} بكسل  ≈ ${r.km.toFixed(0).padStart(3)} كم`);
}
const worst = rows[0];
const tight = tightestPair();
console.log(`الأسوأ: ${worst.label} ${worst.px.toFixed(1)} بكسل ≈ ${worst.km.toFixed(0)} كم`);
console.log(`أقرب زوج: ${tight.a} / ${tight.b} — ${tight.gap.toFixed(1)} بكسل`);
