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
 *
 * ## Why a hard cap, and not just the attraction
 *
 * A pin renders about 27 artwork px across, and 28 artwork px is 180 km on the
 * ground. Libya's coastal cities are simply closer together than that — Leptis
 * Magna and Msallata are 4 px apart — so full separation at the overview zoom
 * cannot be bought with anything except distance the map does not have. Asking
 * for it anyway put Leptis 121 km and Tripoli 97 km from where they are.
 *
 * So the separation is a preference and `maxDrift` is the law: no pin is ever
 * drawn more than that far from its city, and any crowding left over is left
 * to the player's zoom, which is exactly what zoom is for. The cap is in
 * artwork pixels, i.e. in ground distance — the promise the map makes about
 * how wrong a pin can be does not change with how far the player has zoomed.
 */

/**
 * Centre-to-centre spacing the layout aims for.
 *
 * Deliberately less than a pin's own width (~27), so two crowded pins are
 * allowed to overlap a little rather than shove each other across the country.
 * Asking for full separation is worse on both counts that matter: measured over
 * the twenty cities it moves 14 pins instead of 8 *and* leaves the closest pair
 * tighter (10.8 px against 12.0), because an unreachable target just saturates
 * every pin against the drift cap without buying any room.
 */
export const MIN_PIN_DISTANCE = 16;

/**
 * The furthest a pin may ever be drawn from its true position, in artwork px.
 * Six is about 39 km at Libya's coast — close enough that the symbol still
 * reads as the city it names. Whatever crowding is left over is the zoom's job.
 *
 * The floor is set by tappability, not taste: Leptis Magna and Msallata are 4 px
 * apart, so this budget is what opens them to 14 px — just wider than the 13.6 px
 * overview symbol, which is what stops a tap on one from landing on the other.
 */
export const MAX_PIN_DRIFT = 6;

/** Pull back toward the true position, per iteration. */
const ANCHOR_PULL = 0.06;

/** Share of the overlap each pin of a pair gives up, per iteration. */
const PUSH_STRENGTH = 0.5;

const ITERATIONS = 220;

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
  minDistance: number = MIN_PIN_DISTANCE,
  maxDrift: number = MAX_PIN_DRIFT
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

    // Attraction back toward the true position, then the hard cap. Capping
    // inside the loop rather than at the end lets the repulsion keep working
    // with whatever room is left, instead of piling up drift that is then
    // thrown away.
    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      const anchor = anchors[i].point;
      p.x += (anchor.x - p.x) * ANCHOR_PULL;
      p.y += (anchor.y - p.y) * ANCHOR_PULL;

      const dx = p.x - anchor.x;
      const dy = p.y - anchor.y;
      const drift = Math.hypot(dx, dy);
      if (drift > maxDrift) {
        p.x = anchor.x + (dx / drift) * maxDrift;
        p.y = anchor.y + (dy / drift) * maxDrift;
      }

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
