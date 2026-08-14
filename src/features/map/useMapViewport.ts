import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Pan and zoom for the Libya map.
 *
 * Twenty cities on a coastline this tight cannot all be legible at one scale —
 * Tripoli, Msallata, Leptis Magna and Misrata sit within about 130 km, under
 * thirty artwork pixels. The declutter pass keeps them tappable by pushing the
 * symbols apart, but the more it pushes, the less the map says about where the
 * cities actually are. Zoom is the honest fix: at 2x the same pins need half
 * the artwork separation, so they drift back toward their true positions.
 *
 * The transform is applied to a single layer holding both the artwork and the
 * overlay, so they cannot drift apart.
 */

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;

/** Movement past this many pixels is a pan, not a tap. */
const DRAG_SLOP = 6;

/** How much one wheel notch multiplies the scale. */
const WHEEL_SENSITIVITY = 0.0015;

export interface Viewport {
  scale: number;
  x: number;
  y: number;
}

const safeNum = (val: number, fallback: number = 0): number =>
  Number.isFinite(val) ? val : fallback;

const clamp = (value: number, min: number, max: number): number => {
  const safe = safeNum(value, min);
  return Math.min(max, Math.max(min, safe));
};

/**
 * Keeps the scaled content covering the frame.
 *
 * With `transform-origin: 0 0` the content spans `size * scale` from the
 * offset, so the offset has to stay between `size * (1 - scale)` and 0 — at
 * scale 1 that pins it to 0, which is what stops the map drifting off centre
 * when the player zooms back out.
 */
const clampToFrame = (view: Viewport, width: number, height: number): Viewport => {
  const safeScale = clamp(view.scale, MIN_ZOOM, MAX_ZOOM);
  const minX = width * (1 - safeScale);
  const minY = height * (1 - safeScale);
  return {
    scale: safeScale,
    x: clamp(view.x, minX, 0),
    y: clamp(view.y, minY, 0),
  };
};

/** Rescales about a point in frame coordinates, so that point stays put. */
const zoomAbout = (view: Viewport, nextScale: number, fx: number, fy: number): Viewport => {
  const currentScale = clamp(view.scale, MIN_ZOOM, MAX_ZOOM);
  const scale = clamp(nextScale, MIN_ZOOM, MAX_ZOOM);
  const ratio = scale / (currentScale || 1);
  const validFx = safeNum(fx, 0);
  const validFy = safeNum(fy, 0);
  const validX = safeNum(view.x, 0);
  const validY = safeNum(view.y, 0);

  return {
    scale,
    x: validFx - (validFx - validX) * ratio,
    y: validFy - (validFy - validY) * ratio,
  };
};

export const useMapViewport = () => {
  const frameRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<Viewport>({ scale: MIN_ZOOM, x: 0, y: 0 });

  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ distance: number; scale: number } | null>(null);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);
  const travelled = useRef(0);
  /** Set once a gesture turns into a drag, so the trailing click is ignored. */
  const dragged = useRef(false);

  const frameSize = useCallback(() => {
    const rect = frameRef.current?.getBoundingClientRect();
    return { width: Math.max(rect?.width ?? 1, 1), height: Math.max(rect?.height ?? 1, 1) };
  }, []);

  const update = useCallback(
    (next: (current: Viewport) => Viewport) => {
      const { width, height } = frameSize();
      setView((current) => clampToFrame(next(current), width, height));
    },
    [frameSize]
  );

  /** Frame-relative coordinates for a client point. */
  const toFrame = useCallback((clientX: number, clientY: number) => {
    const rect = frameRef.current?.getBoundingClientRect();
    return {
      x: safeNum(clientX - (rect?.left ?? 0), 0),
      y: safeNum(clientY - (rect?.top ?? 0), 0),
    };
  }, []);

  // Wheel has to be a native non-passive listener: React's synthetic handler
  // cannot preventDefault, so the page would scroll while the map zoomed.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { x, y } = toFrame(e.clientX, e.clientY);
      update((v) => zoomAbout(v, v.scale * Math.exp(-e.deltaY * WHEEL_SENSITIVITY), x, y));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [toFrame, update]);

  /**
   * Claims two-finger gestures for the map.
   *
   * The frame carries `touch-action: pan-y` until it is zoomed, so that a
   * one-finger drag still scrolls the page — the map is half the height of a
   * phone screen, and swallowing every drag over it would make the page
   * awkward to move. But `pan-y` also lets the browser treat a two-finger drag
   * as a scroll, and once it does it fires `pointercancel` and the pinch dies
   * mid-gesture.
   *
   * Cancelling the default on a multi-touch `touchstart` takes the gesture back
   * without giving up single-finger scrolling. It has to be non-passive, or the
   * `preventDefault` is ignored.
   */
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length >= 2) e.preventDefault();
    };
    el.addEventListener('touchstart', onTouchStart, { passive: false });
    return () => el.removeEventListener('touchstart', onTouchStart);
  }, []);

  const endGesture = useCallback(() => {
    pointers.current.clear();
    pinch.current = null;
    lastPoint.current = null;
    travelled.current = 0;
  }, []);

  const handleMove = useCallback(
    (e: PointerEvent) => {
      const active = pointers.current;
      if (!active.has(e.pointerId)) return;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (active.size >= 2) {
        const [a, b] = [...active.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const focus = toFrame((a.x + b.x) / 2, (a.y + b.y) / 2);

        if (!pinch.current || !Number.isFinite(pinch.current.distance) || pinch.current.distance <= 0) {
          pinch.current = { distance: Math.max(distance, 1), scale: clamp(view.scale, MIN_ZOOM, MAX_ZOOM) };
        }

        if (distance > 0 && pinch.current.distance > 0) {
          dragged.current = true;
          const nextScale = pinch.current.scale * (distance / pinch.current.distance);
          if (Number.isFinite(nextScale)) {
            update((v) => zoomAbout(v, nextScale, focus.x, focus.y));
          }
        }
        return;
      }

      const last = lastPoint.current;
      if (!last) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      lastPoint.current = { x: e.clientX, y: e.clientY };
      travelled.current += Math.hypot(dx, dy);
      if (travelled.current <= DRAG_SLOP) return;
      dragged.current = true;
      update((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    },
    [toFrame, update, view.scale]
  );

  const handleUp = useCallback(
    (e: PointerEvent) => {
      pointers.current.delete(e.pointerId);
      if (pointers.current.size < 2) pinch.current = null;
      if (pointers.current.size === 0) {
        window.removeEventListener('pointermove', handleMove);
        window.removeEventListener('pointerup', handleUp);
        window.removeEventListener('pointercancel', handleUp);
        endGesture();
      }
    },
    [endGesture, handleMove]
  );

  // Tracking on the window rather than capturing the pointer: capture on an
  // ancestor of the pins interferes with the click the pins depend on.
  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const active = pointers.current;
      active.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (active.size === 1) {
        lastPoint.current = { x: e.clientX, y: e.clientY };
        travelled.current = 0;
        dragged.current = false;
        pinch.current = null;
      } else if (active.size >= 2) {
        const [a, b] = [...active.values()];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        setView((v) => {
          const scale = clamp(v.scale, MIN_ZOOM, MAX_ZOOM);
          pinch.current = { distance: Math.max(distance, 1), scale };
          return v;
        });
      }

      window.addEventListener('pointermove', handleMove);
      window.addEventListener('pointerup', handleUp);
      window.addEventListener('pointercancel', handleUp);
    },
    [handleMove, handleUp]
  );

  useEffect(
    () => () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    },
    [handleMove, handleUp]
  );

  /** True when the click that just fired was the tail of a drag or pinch. */
  const wasDragged = useCallback(() => dragged.current, []);

  /**
   * Zooms about `anchor` — a point in untransformed content coordinates —
   * falling back to the middle of the frame.
   */
  const zoomBy = useCallback(
    (factor: number, anchor?: { x: number; y: number }) => {
      const { width, height } = frameSize();
      update((v) => {
        const fx = anchor ? anchor.x * v.scale + v.x : width / 2;
        const fy = anchor ? anchor.y * v.scale + v.y : height / 2;
        return zoomAbout(v, v.scale * factor, fx, fy);
      });
    },
    [frameSize, update]
  );

  /** Brings a content-space point to the middle of the frame. */
  const centreOn = useCallback(
    (point: { x: number; y: number }) => {
      const { width, height } = frameSize();
      const px = safeNum(point.x, 0);
      const py = safeNum(point.y, 0);
      update((v) => ({ ...v, x: width / 2 - px * v.scale, y: height / 2 - py * v.scale }));
    },
    [frameSize, update]
  );

  const zoomToPoint = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      const { x, y } = toFrame(clientX, clientY);
      update((v) => zoomAbout(v, v.scale * factor, x, y));
    },
    [toFrame, update]
  );

  const reset = useCallback(() => setView({ scale: MIN_ZOOM, x: 0, y: 0 }), []);

  /**
   * The scale the layout solvers see, quantised.
   */
  const layoutScale = useMemo(
    () => Math.max(1, Math.round(clamp(view.scale, MIN_ZOOM, MAX_ZOOM) * 4) / 4),
    [view.scale]
  );

  return {
    frameRef,
    view,
    layoutScale,
    isZoomed: view.scale > MIN_ZOOM + 0.001,
    canZoomIn: view.scale < MAX_ZOOM - 0.001,
    onPointerDown,
    wasDragged,
    zoomBy,
    zoomToPoint,
    centreOn,
    reset,
  };
};
