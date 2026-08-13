import type { MapPoint } from './projection';

/**
 * Pushes overlapping city pins apart, the way a cartographer displaces symbols
 * on a crowded coastline.
 *
 * Real geography clusters: Tripoli, Msallata, Leptis Magna and Misrata all sit
 * within about 130 km, which at this map's scale is under 30 pixels — closer
 * together than a single pin is wide. Drawn at their true positions they
 * overlap into an untappable pile.
 *
 * Rather than fudge the coordinates in the data (which would make every pin
 * unverifiable to fix a problem with four of them), the true position stays the
 * anchor and only the *drawn* symbol moves. The map draws a small dot at the
 * anchor and a hairline to the displaced pin, so the real location is still
 * being stated.
 *
 * The relaxation balances two forces:
 *   - repulsion, pushing any two pins closer than `minDistance` apart;
 *   - attraction, pulling every pin back toward its true position.
 *
 * The attraction is what keeps this honest: pins drift the minimum needed to
 * separate, instead of sprawling across the map.
 */

/** Centre-to-centre spacing a pair of pins needs to stay tappable.
 *  A pin renders about 25.5 artwork px across, so this leaves a small gap. */
const MIN_PIN_DISTANCE = 25;

/** Pull back toward the true position, per iteration. */
const ANCHOR_PULL = 0.06;

/** Share of the overlap each pin of a pair gives up, per iteration. */
const PUSH_STRENGTH = 0.5;

const ITERATIONS = 160;

/** Displaced pins must stay on the artwork. */
const BOUNDS = { minX: 14, maxX: 272, minY: 100, maxY: 410 };

/** Below this, a pin is treated as sitting on its true position. */
const DISPLACEMENT_EPSILON = 0.75;

export interface PlacedPin {
  /** Where the pin is drawn. */
  display: MapPoint;
  /** The true projected position. */
  anchor: MapPoint;
  /** Whether the pin had to move, i.e. whether to draw a leader line. */
  isDisplaced: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Lays out pins for the given anchors. Input order determines iteration order,
 * so the result is deterministic for a given set of cities.
 */
export const declutterPins = (
  anchors: { id: string; point: MapPoint }[],
  minDistance: number = MIN_PIN_DISTANCE
): Map<string, PlacedPin> => {
  const positions = anchors.map((a) => ({ ...a.point }));

  for (let step = 0; step < ITERATIONS; step++) {
    let moved = false;

    // Repulsion between every crowded pair.
    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        let dx = b.x - a.x;
        let dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);

        if (distance >= minDistance) continue;

        // Exactly coincident pins have no direction to separate along; nudge
        // them apart deterministically rather than dividing by zero.
        if (distance < 1e-6) {
          dx = 1;
          dy = 0;
          distance = 1;
        }

        const overlap = (minDistance - distance) * PUSH_STRENGTH;
        const ux = (dx / distance) * overlap;
        const uy = (dy / distance) * overlap;

        a.x -= ux;
        a.y -= uy;
        b.x += ux;
        b.y += uy;
        moved = true;
      }
    }

    // Attraction back toward the true position.
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const anchor = anchors[i].point;
      p.x += (anchor.x - p.x) * ANCHOR_PULL;
      p.y += (anchor.y - p.y) * ANCHOR_PULL;
      p.x = clamp(p.x, BOUNDS.minX, BOUNDS.maxX);
      p.y = clamp(p.y, BOUNDS.minY, BOUNDS.maxY);
    }

    if (!moved) break; // Nothing overlaps; the anchors are already fine.
  }

  const placed = new Map<string, PlacedPin>();
  anchors.forEach((a, i) => {
    const display = positions[i];
    const drift = Math.hypot(display.x - a.point.x, display.y - a.point.y);
    placed.set(a.id, {
      display,
      anchor: a.point,
      isDisplaced: drift > DISPLACEMENT_EPSILON,
    });
  });
  return placed;
};
