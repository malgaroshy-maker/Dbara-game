import type { MapPoint } from './projection';

/**
 * Places city name labels so they do not cover pins or each other.
 *
 * With twenty cities, hand-tuning an offset per city stopped working: the pins
 * themselves are positioned dynamically by the declutter pass, so any authored
 * offset is a guess about a position that moves. This solves the placement the
 * same way as the pins and the stage fans — try candidate positions, score
 * them, keep the best — so adding a city needs no manual tuning.
 *
 * An authored `labelOffset` is still honoured as a *preference*: it is tried
 * first and wins if it happens to be clear, which keeps deliberate cartographic
 * choices (Tripoli's name in the sea, for instance) while guaranteeing that a
 * crowded label still lands somewhere readable.
 */

/**
 * Roughly how wide a label renders, in artwork px, for `n` characters.
 *
 * Measured off the rendered chips rather than guessed: the pill's own padding
 * is most of a short name's width, which is why the constant term is large and
 * why "سرت" comes out nearly as wide as "لبدة". The old estimate (8 + 4.6n,
 * height 12) undercounted every label — the height by 40% — so the solver kept
 * declaring positions clear that visibly collided.
 */
export const estimateLabelWidth = (text: string) => 18 + 4.4 * text.length;
export const LABEL_HEIGHT = 20;

/** Half-width of a city pin, for overlap tests. */
const PIN_RADIUS = 13;

/** Labels must stay on the artwork. */
const BOUNDS = { minX: 6, maxX: 280, minY: 96, maxY: 414 };

/** Candidate offsets, in preference order: below, above, then the diagonals. */
const CANDIDATE_DIRECTIONS: MapPoint[] = [
  { x: 0, y: 1 },
  { x: 0, y: -1 },
  { x: 1, y: 0.6 },
  { x: -1, y: 0.6 },
  { x: 1, y: -0.6 },
  { x: -1, y: -0.6 },
  { x: 1, y: 0 },
  { x: -1, y: 0 },
];
const CANDIDATE_DISTANCES = [18, 24, 30, 37];

interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const overlapArea = (a: Rect, b: Rect) =>
  Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1)) *
  Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));

export interface LabelInput {
  id: string;
  /** Where the pin is drawn. */
  pin: MapPoint;
  text: string;
  /** Authored preference, tried before the generated candidates. */
  preferred?: MapPoint;
}

/**
 * How much overlap a placed label may still carry, in square artwork pixels.
 * Above this it is dropped rather than drawn on top of its neighbour.
 */
const OVERLAP_TOLERANCE = 12;

export interface PlacedLabel {
  centre: MapPoint;
  /**
   * True when even the best position collided, so the label is not drawn.
   *
   * With twenty-six cities there is simply no arrangement in which every name
   * fits at the overview zoom — the solver was returning fifteen overlapping
   * pairs, which is less readable than showing fewer names. Dropping the ones
   * that cannot fit is what a printed map does, and because the labels shrink
   * with zoom the dropped ones come back as the player zooms in.
   */
  hidden: boolean;
}

/**
 * Returns the chosen label centre for each city, in artwork pixels.
 *
 * Cities are placed in the order given and each one avoids everything already
 * placed, so the result is deterministic — and so earlier cities keep their
 * position while later ones give way.
 */
export const layoutLabels = (
  inputs: LabelInput[],
  /**
   * The map's zoom. Pins and labels are drawn at a constant size on screen, so
   * at 2x they cover half as much of the artwork — and the solver has to know
   * that, or it keeps shoving names apart that no longer collide.
   */
  scale = 1
): Map<string, PlacedLabel> => {
  const pinRadius = PIN_RADIUS / scale;
  const labelHeight = LABEL_HEIGHT / scale;
  const rectAtScale = (centre: MapPoint, width: number): Rect => ({
    x1: centre.x - width / 2,
    y1: centre.y - labelHeight / 2,
    x2: centre.x + width / 2,
    y2: centre.y + labelHeight / 2,
  });

  const pinRects: Rect[] = inputs.map((i) => ({
    x1: i.pin.x - pinRadius,
    y1: i.pin.y - pinRadius,
    x2: i.pin.x + pinRadius,
    y2: i.pin.y + pinRadius,
  }));

  const placed: Rect[] = [];
  const result = new Map<string, PlacedLabel>();

  for (const input of inputs) {
    const width = estimateLabelWidth(input.text) / scale;

    const candidates: MapPoint[] = [];
    if (input.preferred) {
      candidates.push({
        x: input.pin.x + input.preferred.x / scale,
        y: input.pin.y + input.preferred.y / scale,
      });
    }
    for (const distance of CANDIDATE_DISTANCES) {
      for (const dir of CANDIDATE_DIRECTIONS) {
        candidates.push({
          x: input.pin.x + dir.x * (width / 2 + 6 / scale),
          y: input.pin.y + (dir.y * distance) / scale,
        });
      }
    }

    let best = candidates[0];
    let bestScore = Number.POSITIVE_INFINITY;
    let bestCollision = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate, index) => {
      const rect = rectAtScale(candidate, width);
      let score = 0;
      let collision = 0;

      const overflow =
        Math.max(0, BOUNDS.minX - rect.x1) +
        Math.max(0, rect.x2 - BOUNDS.maxX) +
        Math.max(0, BOUNDS.minY - rect.y1) +
        Math.max(0, rect.y2 - BOUNDS.maxY);
      if (overflow > 0) score += 500 + overflow * overflow;

      // Covering a pin is worse than covering another label: the pin is the
      // thing the player has to hit.
      for (const pin of pinRects) collision += overlapArea(rect, pin);
      for (const other of placed) collision += overlapArea(rect, other);
      // Covering a pin is worse than covering another label: the pin is the
      // thing the player has to hit.
      for (const pin of pinRects) score += overlapArea(rect, pin) * 3;
      for (const other of placed) score += overlapArea(rect, other) * 2;

      // Mild preference for earlier candidates, so an authored offset or a
      // simple "below the pin" wins whenever it is equally clear.
      score += index * 0.5;

      if (score < bestScore) {
        bestScore = score;
        best = candidate;
        bestCollision = collision;
      }
    });

    const hidden = bestCollision > OVERLAP_TOLERANCE;
    // A dropped label does not reserve space, so the next city may still use
    // the room it would have taken.
    if (!hidden) placed.push(rectAtScale(best, width));
    result.set(input.id, { centre: best, hidden });
  }

  return result;
};
