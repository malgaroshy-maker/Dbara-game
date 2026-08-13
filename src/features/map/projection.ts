/**
 * Geographic projection for the Libya map artwork.
 *
 * Cities carry real latitude/longitude; this module is the single place that
 * turns those into positions on `public/assets/libya-map.png`. Storing screen
 * percentages in the data instead (as this used to) meant every pin had to be
 * re-tuned by hand whenever the artwork or its framing changed, and there was
 * no way to tell a correct pin from a plausible-looking wrong one.
 *
 * ## Fitting the projection
 *
 * The artwork is a Web Mercator render. That was established by measuring the
 * gold border stroke in the source PNG: Libya's outline spans x 26–255,
 * y 173–399, and the ratio of vertical to horizontal degrees-per-pixel is
 * ~1.13 — which matches sec(φ) at Libya's mid-latitude (1.12) and rules out an
 * equirectangular projection, where the ratio would be 1.0.
 *
 * The constants below are fitted so the outline's bounding box lands on
 * Libya's true extremes: 9.31°E–25.00°E and 19.50°N–33.17°N. Verified against
 * the drawn coastline at Tripoli, Al Khums, Sirte, El Agheila, Benghazi, Derna
 * and Tobruk — every one lands within ~1.5 px of the painted shoreline.
 */

/** Intrinsic size of the artwork, in pixels. */
export const MAP_IMAGE = { width: 286, height: 512 } as const;

/** Horizontal scale, in pixels per degree of longitude. */
const PX_PER_DEGREE_LON = 14.596;

/** Longitude anchor: the straight 25°E Egypt border sits at x = 255. */
const LON_ORIGIN = 9.31;
const X_AT_LON_ORIGIN = 26;

/**
 * Vertical scale, in pixels per radian of Mercator y. Fitted independently of
 * the horizontal scale so any slight stretch in the artwork is absorbed rather
 * than pushed into the pin positions.
 */
const PX_PER_MERCATOR_RADIAN = 852.8;
const Y_AT_MERCATOR_ZERO = 696.7;

/** Half the border stroke width: predictions land on the stroke's centre. */
const STROKE_CENTRE_CORRECTION = 1.0;

/** Mercator northing for a latitude, in radians. */
const mercatorY = (latitude: number): number =>
  Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));

export interface MapPoint {
  /** Horizontal position in artwork pixels. */
  x: number;
  /** Vertical position in artwork pixels. */
  y: number;
}

/** Projects real coordinates onto the artwork, in image pixels. */
export const projectToMap = (latitude: number, longitude: number): MapPoint => ({
  x: X_AT_LON_ORIGIN + PX_PER_DEGREE_LON * (longitude - LON_ORIGIN),
  y:
    Y_AT_MERCATOR_ZERO -
    PX_PER_MERCATOR_RADIAN * mercatorY(latitude) -
    STROKE_CENTRE_CORRECTION,
});

/** Projects real coordinates to a percentage of the artwork, for CSS offsets. */
export const projectToMapPercent = (
  latitude: number,
  longitude: number
): { left: number; top: number } => {
  const { x, y } = projectToMap(latitude, longitude);
  return {
    left: (x / MAP_IMAGE.width) * 100,
    top: (y / MAP_IMAGE.height) * 100,
  };
};

/**
 * Builds a gently curved route between two projected points.
 *
 * `curvature` is the sideways bow as a fraction of the segment length, signed:
 * positive bows one way, negative the other. Working in artwork pixels (rather
 * than percentages) keeps the perpendicular true, so routes bow evenly instead
 * of being squashed by the artwork's non-square aspect.
 */
export const buildRoutePath = (from: MapPoint, to: MapPoint, curvature: number): string => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy) || 1;

  // Perpendicular unit vector, offset from the midpoint.
  const offset = curvature * length;
  const controlX = (from.x + to.x) / 2 + (-dy / length) * offset;
  const controlY = (from.y + to.y) / 2 + (dx / length) * offset;

  return `M ${from.x.toFixed(2)},${from.y.toFixed(2)} Q ${controlX.toFixed(2)},${controlY.toFixed(
    2
  )} ${to.x.toFixed(2)},${to.y.toFixed(2)}`;
};
