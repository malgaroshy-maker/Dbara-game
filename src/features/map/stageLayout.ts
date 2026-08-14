import type { MapPoint } from './projection';

/**
 * Fans a city's stages out around its pin, in artwork pixels.
 *
 * Like the city pins themselves, these positions are derived rather than
 * hand-placed: the cities sit at their real coordinates, so the space around
 * any given pin depends on its neighbours and on the edge of the artwork. A
 * fixed offset table would collide with Leptis Magna on the Tripoli coast and
 * hang off the edge at Derna.
 *
 * The layout picks the bearing whose arc is furthest from other city pins and
 * from the edge of the map, then spreads the stages evenly along it.
 */

/** Preferred distance from the city pin to its stage nodes. */
export const STAGE_ORBIT_RADIUS = 40;

/**
 * Radii the search may fall back to, in preference order. Cities hemmed in on
 * several sides — Nalut, between Tripoli, Ghadames and the western edge —
 * cannot clear their neighbours at the preferred radius from any bearing, so
 * the layout is allowed to reach further out or pull in.
 */
const RADIUS_CANDIDATES = [STAGE_ORBIT_RADIUS, 46, 52, 34];

/** Cost per pixel of deviation from the preferred radius, to keep it the norm. */
const RADIUS_DEVIATION_COST = 4;

/**
 * Arc width allotted per additional stage, in degrees, in preference order.
 * A tighter fan is the last resort for cities boxed into a corner — Ghadames
 * sits on the western tip with Nalut blocking the only open bearing, and a
 * full-width fan there always spills off the artwork.
 */
const SWEEP_PER_GAP_CANDIDATES = [36, 30, 26, 22];

/** Cost per degree of deviation from the preferred fan width. */
const SWEEP_DEVIATION_COST = 6;

const MAX_SWEEP = 150;

/** How close a stage node may come to an obstacle before it is penalised. */
export const PIN_CLEARANCE = 30;
export const LABEL_CLEARANCE = 22;

/** Something a stage node should keep away from: a city pin or a city label. */
export interface Obstacle extends MapPoint {
  clearance: number;
}

/**
 * Minimum spacing between adjacent stage nodes. A node renders about 23
 * artwork pixels across, so anything tighter than this has them overlapping.
 */
const MIN_NODE_SPACING = 25;

/** Stage nodes must stay inside this box, leaving room for the node's own size. */
const SAFE_AREA = { minX: 12, maxX: 274, minY: 106, maxY: 406 };

/** Candidate bearings are tried at this resolution, in degrees. */
const BEARING_STEP = 10;

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

/** Positions on the arc for a given bearing and radius, in artwork pixels. */
const arcPositions = (
  origin: MapPoint,
  count: number,
  bearingDeg: number,
  radius: number,
  degreesPerGap: number
): MapPoint[] => {
  const sweep = Math.min(MAX_SWEEP, degreesPerGap * Math.max(0, count - 1));
  const start = bearingDeg - sweep / 2;
  const step = count > 1 ? sweep / (count - 1) : 0;

  return Array.from({ length: count }, (_, i) => {
    const angle = toRadians(start + step * i);
    return {
      x: origin.x + radius * Math.cos(angle),
      y: origin.y + radius * Math.sin(angle),
    };
  });
};

/** Lower is better: sums how badly an arc leaves the map or crowds neighbours. */
const scoreArc = (positions: MapPoint[], obstacles: Obstacle[], scale: number): number => {
  let penalty = 0;
  const minSpacing = MIN_NODE_SPACING / scale;

  // Adjacent nodes crowding each other. Without this the search happily pulls
  // the radius in to dodge a neighbouring city and stacks the nodes instead.
  for (let i = 1; i < positions.length; i++) {
    const gap = Math.hypot(positions[i].x - positions[i - 1].x, positions[i].y - positions[i - 1].y);
    if (gap < minSpacing) {
      const shortfall = minSpacing - gap;
      penalty += shortfall * shortfall * 4;
    }
  }

  for (const p of positions) {
    const overflow =
      Math.max(0, SAFE_AREA.minX - p.x) +
      Math.max(0, p.x - SAFE_AREA.maxX) +
      Math.max(0, SAFE_AREA.minY - p.y) +
      Math.max(0, p.y - SAFE_AREA.maxY);
    if (overflow > 0) penalty += 1000 + overflow * overflow;

    for (const o of obstacles) {
      const distance = Math.hypot(p.x - o.x, p.y - o.y);
      if (distance < o.clearance) {
        const encroachment = o.clearance - distance;
        penalty += encroachment * encroachment;
      }
    }
  }

  return penalty;
};

export interface StageLayout {
  positions: MapPoint[];
  /** Chosen bearing in degrees, 0 = east, increasing clockwise on screen. */
  bearing: number;
  /** Chosen orbit radius in artwork pixels. */
  radius: number;
}

/**
 * Lays out `count` stage nodes around `origin`, steering clear of `obstacles`
 * (the other city pins) and the edge of the artwork.
 *
 * Candidates are evaluated in a fixed order and ties keep the first, so the
 * result is deterministic — the same city always fans out the same way.
 */
export const layoutStageNodes = (
  origin: MapPoint,
  count: number,
  obstacles: Obstacle[],
  /** The map's zoom: nodes keep a constant screen size, so the fan tightens. */
  scale = 1
): StageLayout => {
  if (count <= 0) return { positions: [], bearing: 0, radius: STAGE_ORBIT_RADIUS / scale };

  let best: StageLayout | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const degreesPerGap of SWEEP_PER_GAP_CANDIDATES) {
    const sweepPenalty =
      (SWEEP_PER_GAP_CANDIDATES[0] - degreesPerGap) * SWEEP_DEVIATION_COST;

    for (const candidate of RADIUS_CANDIDATES) {
      const radius = candidate / scale;
      const radiusPenalty =
        Math.abs(candidate - STAGE_ORBIT_RADIUS) * RADIUS_DEVIATION_COST;

      // Start at due north (-90°) so an unobstructed city fans out over the
      // sea, which reads better than fanning inland over the terrain.
      for (let i = 0; i < 360 / BEARING_STEP; i++) {
        const bearing = -90 + i * BEARING_STEP;
        const positions = arcPositions(origin, count, bearing, radius, degreesPerGap);
        const score = scoreArc(positions, obstacles, scale) + radiusPenalty + sweepPenalty;

        if (score < bestScore) {
          bestScore = score;
          best = { positions, bearing, radius };
        }
      }
    }

    // The preferred fan already clears everything; no need to compromise.
    if (bestScore === 0) break;
  }

  return (
    best ?? {
      positions: arcPositions(
        origin,
        count,
        -90,
        STAGE_ORBIT_RADIUS / scale,
        SWEEP_PER_GAP_CANDIDATES[0]
      ),
      bearing: -90,
      radius: STAGE_ORBIT_RADIUS / scale,
    }
  );
};
