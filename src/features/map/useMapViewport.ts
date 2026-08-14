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
const DRAG_SLOP = 8;

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
  const viewRef = useRef<Viewport>(view);
  viewRef.current = view;

  const mouseLastPoint = useRef<{ x: number; y: number } | null>(null);
  const isMouseDown = useRef(false);
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
      setView((current) => {
        const updated = clampToFrame(next(current), width, height);
        viewRef.current = updated;
        return updated;
      });
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

  // Native Wheel Event Listener for Desktop
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

  // Native Touch Event Listeners for Mobile Pinch & Pan
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;

    let touchStartDist = 0;
    let touchStartScale = 1;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let touchMoved = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
        touchMoved = 0;
        dragged.current = false;
      } else if (e.touches.length >= 2) {
        // Multi-touch pinch start: prevent browser zoom immediately
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        touchStartDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY) || 1;
        touchStartScale = viewRef.current.scale;
        dragged.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length >= 2) {
        // Two-finger pinch-zoom on mobile
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        if (dist > 0 && touchStartDist > 0) {
          const focus = toFrame((t1.clientX + t2.clientX) / 2, (t1.clientY + t2.clientY) / 2);
          dragged.current = true;
          const nextScale = touchStartScale * (dist / touchStartDist);
          if (Number.isFinite(nextScale)) {
            update((v) => zoomAbout(v, nextScale, focus.x, focus.y));
          }
        }
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        const dx = t.clientX - lastTouchX;
        const dy = t.clientY - lastTouchY;
        lastTouchX = t.clientX;
        lastTouchY = t.clientY;
        touchMoved += Math.hypot(dx, dy);

        // If map is zoomed in (> 1.05), pan the map with 1 finger and prevent vertical page scroll
        if (viewRef.current.scale > 1.05) {
          e.preventDefault();
          if (touchMoved > DRAG_SLOP) {
            dragged.current = true;
            update((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
          }
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        lastTouchX = e.touches[0].clientX;
        lastTouchY = e.touches[0].clientY;
      }
      if (e.touches.length === 0) {
        touchStartDist = 0;
        // Keep dragged flag for a tick so onClick knows it was a drag, then reset
        setTimeout(() => {
          dragged.current = false;
        }, 80);
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: false });
    el.addEventListener('touchcancel', onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [toFrame, update]);

  // Desktop Mouse Drag Handling
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isMouseDown.current || !mouseLastPoint.current) return;
      const dx = e.clientX - mouseLastPoint.current.x;
      const dy = e.clientY - mouseLastPoint.current.y;
      mouseLastPoint.current = { x: e.clientX, y: e.clientY };
      travelled.current += Math.hypot(dx, dy);

      if (travelled.current > DRAG_SLOP) {
        dragged.current = true;
        update((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
      }
    },
    [update]
  );

  const handleMouseUp = useCallback(() => {
    isMouseDown.current = false;
    mouseLastPoint.current = null;
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mouseup', handleMouseUp);
    setTimeout(() => {
      dragged.current = false;
    }, 80);
  }, [handleMouseMove]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      // Only process mouse pointer on pointerdown (touch is handled natively by touchstart)
      if (e.pointerType === 'mouse' && e.button === 0) {
        isMouseDown.current = true;
        mouseLastPoint.current = { x: e.clientX, y: e.clientY };
        travelled.current = 0;
        dragged.current = false;
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
    },
    [handleMouseMove, handleMouseUp]
  );

  useEffect(
    () => () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
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
