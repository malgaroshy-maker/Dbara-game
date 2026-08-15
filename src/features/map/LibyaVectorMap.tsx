import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { CityNode, LibyanRegion, Stage } from '../../types/map';
import { useMapStore } from '../../store/useMapStore';
import { MAP_IMAGE, projectToMap, buildRoutePath, type MapPoint } from './projection';

/** Mirrors the `scale-[1.02]` the artwork and its overlay are both drawn at. */
const OVERLAY_SCALE = 1.02;
import { declutterPins, MIN_PIN_DISTANCE as PIN_SEPARATION } from './pinLayout';
import { layoutLabels } from './labelLayout';
import {
  layoutStageNodes,
  PIN_CLEARANCE,
  LABEL_CLEARANCE,
  type Obstacle,
} from './stageLayout';
import { useMapViewport } from './useMapViewport';
import {
  Lock,
  Star,
  CheckCircle2,
  Castle,
  Landmark,
  Waves,
  Trees,
  Palmtree,
  Mountain,
  Sun,
  Flame,
  Anchor,
  Leaf,
  Fish,
  Amphora,
  Sunset,
  Milestone,
  Ship,
  BookOpen,
  Tent,
  Sparkles,
  Plus,
  Minus,
  Maximize2,
  type LucideIcon,
} from 'lucide-react';

interface LibyaVectorMapProps {
  onSelectCity: (city: CityNode) => void;
  onStartStage: (cityId: string, stage: Stage) => void;
  /** Called when the player taps the map itself rather than any city. */
  onClearSelection: () => void;
  selectedCityId: string | null;
  regionFilter?: LibyanRegion | 'all';
}

/**
 * One symbol per city. A lookup rather than a switch in the render body: this
 * is fixed data, and rebuilding the branch for twenty cities on every pan frame
 * is work for nothing.
 */
const CITY_ICONS: Record<string, LucideIcon> = {
  tripoli: Castle,
  leptis_magna: Landmark,
  msallata: Leaf,
  zuwara: Fish,
  gharyan: Amphora,
  sirte: Sunset,
  ajdabiya: Milestone,
  tobruk: Ship,
  jaghbub: BookOpen,
  murzuq: Tent,
  misrata: Anchor,
  nalut_nafusa: Castle,
  benghazi: Waves,
  cyrene_green_mountain: Trees,
  derna: Sparkles,
  jalu_awjila: Palmtree,
  ghadames: Palmtree,
  sabha_fezzan: Flame,
  ghat_akakus: Mountain,
  kufra_desert: Sun,
};

/** Smaller symbols need less displacement to separate the coastal cluster. */
const CityIcon: React.FC<{ cityId: string; isSelected: boolean; isUnlocked: boolean }> = React.memo(
  ({ cityId, isSelected, isUnlocked }) => {
    const Icon = CITY_ICONS[cityId] ?? Landmark;
    return (
      <Icon
        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${
          isSelected ? 'text-night-900' : isUnlocked ? 'text-gold-300' : 'text-ink-500'
        }`}
      />
    );
  }
);
CityIcon.displayName = 'CityIcon';

export const LibyaVectorMap: React.FC<LibyaVectorMapProps> = ({
  onSelectCity,
  onStartStage,
  onClearSelection,
  selectedCityId,
  regionFilter = 'all',
}) => {
  const { cities } = useMapStore();
  const {
    frameRef,
    view,
    layoutScale,
    isZoomed,
    canZoomIn,
    onPointerDown,
    wasDragged,
    zoomBy,
    zoomToPoint,
    centreOn,
    reset,
  } = useMapViewport();

  /**
   * Pins and labels are drawn at a constant size on screen, so `1 / scale` is
   * how much of the artwork they now cover. Everything that reasons about
   * crowding is measured in artwork units, so it all divides by the same thing.
   */
  const symbolScale = 1 / view.scale;

  /**
   * How much of a pin's full size to draw at the current zoom.
   *
   * Libya's coastal cities are closer together than a full-size pin is wide, so
   * at the overview zoom a full-size pin cannot avoid covering its neighbour —
   * and a covered pin is worse than a small one: tapping the centre of Tripoli
   * used to select Gharyan, whichever happened to be painted last.
   *
   * So the symbol carries less detail when zoomed out, the way a paper map
   * marks a city with a dot and a name until you look closer: half size at the
   * overview, full size from 2x up. Half of 27 artwork px is 13.6, which fits
   * inside the 14 px the layout can open between Leptis Magna and Msallata —
   * the tightest pair on the map, and the one that decides this number.
   */
  const pinDetail = Math.min(1, view.scale / 2);
  const pinScale = symbolScale * pinDetail;

  /**
   * True projected positions, then the drawn positions after decluttering.
   * `cityPoints` is what everything on the map aligns to — pins, labels,
   * routes and stage fans — so they never disagree about where a city is.
   *
   * Zooming in shrinks the separation the pins need, so they settle closer to
   * where the cities really are: the displacement is only ever as large as
   * legibility demands.
   */
  const placedPins = useMemo(
    () =>
      declutterPins(
        cities.map((c) => ({
          id: c.id,
          point: projectToMap(c.coordinates.latitude, c.coordinates.longitude),
        })),
        // Not `/ layoutScale`: the pin is drawn at half detail below 2x, so its
        // artwork footprint is flat there rather than shrinking with the zoom.
        // Dividing the separation faster than the symbol actually shrinks is
        // what let Leptis Magna slide back under Msallata at 1.6x.
        PIN_SEPARATION / Math.max(1, layoutScale / 2)
      ),
    [cities, layoutScale]
  );

  const cityPoints = useMemo(
    () => new Map([...placedPins].map(([id, placed]) => [id, placed.display])),
    [placedPins]
  );

  /** Label centres, solved so no name covers a pin or another name. */
  const labelPoints = useMemo(
    () =>
      layoutLabels(
        cities.flatMap((c) => {
          const pin = cityPoints.get(c.id);
          return pin
            ? [{ id: c.id, pin, text: c.mapLabel ?? c.arabicName, preferred: c.labelOffset }]
            : [];
        }),
        layoutScale
      ),
    [cities, cityPoints, layoutScale]
  );

  /**
   * The selected city expands into its stages, fanned around its pin. Only
   * unlocked cities expand — a locked city has nothing playable to show, and
   * the reason it is locked belongs in the detail card, not on the map.
   */
  const expanded = useMemo(() => {
    const city = cities.find((c) => c.id === selectedCityId);
    if (!city) return null;
    const isUnlocked = city.unlockedByDefault || city.stages.some((s) => s.isUnlocked);
    if (!isUnlocked) return null;

    const origin = cityPoints.get(city.id);
    if (!origin) return null;

    // Stage nodes steer clear of the other cities' pins and of their labels —
    // a fan that lands on a neighbour's name is as unreadable as one that
    // lands on its pin.
    const obstacles: Obstacle[] = cities
      .filter((c) => c.id !== city.id)
      .flatMap((c) => {
        const p = cityPoints.get(c.id);
        const l = labelPoints.get(c.id);
        if (!p) return [];
        return [
          { ...p, clearance: PIN_CLEARANCE / layoutScale },
          // A hidden label is not on the map, so nothing needs to avoid it.
          ...(l && !l.hidden ? [{ ...l.centre, clearance: LABEL_CLEARANCE / layoutScale }] : []),
        ];
      });

    const { positions } = layoutStageNodes(origin, city.stages.length, obstacles, layoutScale);
    return {
      city,
      origin,
      nodes: city.stages.map((stage, i) => ({ stage, point: positions[i] })),
    };
    // `labelPoints` was missing here: the fan is solved against the label
    // positions, so leaving it out meant a re-solved label set kept the stale
    // constellation and stages could sit on a neighbour's name.
  }, [cities, selectedCityId, cityPoints, labelPoints, layoutScale]);

  // Caravan routes as city pairs plus a bow, so they always terminate exactly
  // on the projected pins. Previously these were hand-written path coordinates
  // that had to be re-drawn by hand whenever a pin moved — and silently pointed
  // at the wrong places when it did.
  const routePaths = useMemo(() => {
    const segments: { id: string; from: string; to: string; curvature: number }[] = [
      // 1. Coastal Highway (Tripoli -> Msallata -> Leptis -> Misrata -> Benghazi
      //    -> Cyrene -> Derna). Msallata sits inland between Tripoli and Leptis,
      //    so the chain threads through it rather than bypassing it.
      { id: 'coastal_0', from: 'zuwara', to: 'zawiya', curvature: 0.1 },
      { id: 'coastal_0b', from: 'zawiya', to: 'tripoli', curvature: 0.1 },
      { id: 'coastal_1', from: 'tripoli', to: 'msallata', curvature: 0.12 },
      { id: 'coastal_1b', from: 'msallata', to: 'leptis_magna', curvature: 0.12 },
      // Zliten sits on the shore between Leptis Magna and Misrata, so the road
      // threads through it rather than stepping over it.
      { id: 'coastal_2', from: 'leptis_magna', to: 'zliten', curvature: 0.1 },
      { id: 'coastal_2b', from: 'zliten', to: 'misrata', curvature: 0.1 },
      // Threads the shore of the Gulf of Sirte through Sirte itself rather than
      // cutting straight across open water.
      { id: 'coastal_3', from: 'misrata', to: 'sirte', curvature: 0.35 },
      { id: 'coastal_3b', from: 'sirte', to: 'ajdabiya', curvature: 0.35 },
      { id: 'coastal_3c', from: 'ajdabiya', to: 'benghazi', curvature: 0.15 },
      { id: 'coastal_4', from: 'benghazi', to: 'al_marj', curvature: -0.1 },
      { id: 'coastal_4b', from: 'al_marj', to: 'cyrene_green_mountain', curvature: -0.1 },
      { id: 'coastal_5', from: 'cyrene_green_mountain', to: 'derna', curvature: 0.1 },
      { id: 'coastal_6', from: 'derna', to: 'tobruk', curvature: 0.1 },

      // 2. Western Mountain & Desert (Tripoli -> Gharyan -> Nalut -> Ghadames
      //    -> Sabha -> Murzuq -> Ghat)
      { id: 'west_1', from: 'tripoli', to: 'gharyan', curvature: 0.12 },
      { id: 'west_1b', from: 'gharyan', to: 'nalut_nafusa', curvature: 0.12 },
      { id: 'west_2', from: 'nalut_nafusa', to: 'ghadames', curvature: 0.12 },
      { id: 'west_3', from: 'ghadames', to: 'sabha_fezzan', curvature: -0.1 },
      { id: 'west_4', from: 'sabha_fezzan', to: 'murzuq', curvature: -0.1 },
      // Ghat is reached along Wadi al-Hayaa through Ubari, which is the road
      // that exists rather than a line drawn straight across the sand sea.
      { id: 'west_5', from: 'sabha_fezzan', to: 'ubari', curvature: -0.1 },
      { id: 'west_5b', from: 'ubari', to: 'ghat_akakus', curvature: -0.12 },

      // 2b. The central corridor: the coast to Fezzan through the middle of the
      //     country, which is what puts Bani Walid and Jufrah on a road at all.
      { id: 'central_1', from: 'misrata', to: 'bani_walid', curvature: 0.1 },
      { id: 'central_2', from: 'bani_walid', to: 'jufrah', curvature: -0.1 },
      { id: 'central_3', from: 'jufrah', to: 'sabha_fezzan', curvature: -0.1 },

      // 3. Eastern Oases & Desert (Ajdabiya -> Jalu -> Kufra, Tobruk -> Jaghbub,
      //    and the desert crossing from Sabha)
      { id: 'east_1', from: 'ajdabiya', to: 'jalu_awjila', curvature: 0.1 },
      { id: 'east_2', from: 'jalu_awjila', to: 'kufra_desert', curvature: 0.1 },
      { id: 'east_3', from: 'tobruk', to: 'jaghbub', curvature: 0.12 },
      { id: 'cross_desert', from: 'sabha_fezzan', to: 'jalu_awjila', curvature: -0.08 },
    ];

    // Drawn positions, not true ones: a route has to meet the pin the player
    // actually sees, otherwise decluttering leaves the roads hanging in space.
    return segments.flatMap(({ id, from, to, curvature }) => {
      const a = cityPoints.get(from);
      const b = cityPoints.get(to);
      if (!a || !b) return [];
      return [{ id, d: buildRoutePath(a, b, curvature), isUnlocked: true }];
    });
  }, [cityPoints]);

  /**
   * A tap that lands on the artwork rather than on a city clears the selection.
   * `wasDragged` keeps a pan from counting as a tap, and the `data-map-hit`
   * marker keeps the pins, labels, stage nodes and zoom controls out of it.
   */
  const handleBackgroundClick = useCallback(
    (e: React.MouseEvent) => {
      if (wasDragged()) return;
      if ((e.target as Element).closest('[data-map-hit]')) return;
      onClearSelection();
    },
    [onClearSelection, wasDragged]
  );

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => zoomToPoint(e.clientX, e.clientY, 1.8),
    [zoomToPoint]
  );

  /**
   * Artwork pixels to the frame's own coordinates, before the pan/zoom
   * transform. The overlay is laid out full-width, centred vertically at the
   * artwork's aspect ratio and scaled by 1.02 to match the image, so anything
   * aiming the viewport at a city has to reproduce exactly that.
   */
  const artworkToFrame = useCallback(
    (point: MapPoint) => {
      const frame = frameRef.current;
      const frameWidth = frame?.clientWidth ?? 0;
      const frameHeight = frame?.clientHeight ?? 0;
      const overlayWidth = frameWidth;
      const overlayHeight = (frameWidth * MAP_IMAGE.height) / MAP_IMAGE.width;
      const halfWidth = overlayWidth / 2;
      const halfHeight = overlayHeight / 2;
      return {
        x: halfWidth + ((point.x / MAP_IMAGE.width) * overlayWidth - halfWidth) * OVERLAY_SCALE,
        y:
          (frameHeight - overlayHeight) / 2 +
          halfHeight +
          ((point.y / MAP_IMAGE.height) * overlayHeight - halfHeight) * OVERLAY_SCALE,
      };
    },
    [frameRef]
  );

  /** The pin the viewport should hold on to while zooming. */
  const focusPoint = selectedCityId ? cityPoints.get(selectedCityId) : undefined;

  // Selecting a city while zoomed in brings it into view. Without this the
  // player can pick a city from a card or a filter and be left staring at a
  // patch of desert somewhere else on the map.
  const lastFocused = useRef<string | null>(null);
  useEffect(() => {
    if (!selectedCityId || selectedCityId === lastFocused.current) {
      lastFocused.current = selectedCityId;
      return;
    }
    lastFocused.current = selectedCityId;
    if (view.scale <= 1.001) return;
    const point = cityPoints.get(selectedCityId);
    if (point) centreOn(artworkToFrame(point));
    // `view.scale` is read but deliberately not a dependency: this should fire
    // when the selection changes, not every time the player zooms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCityId, cityPoints, centreOn, artworkToFrame]);

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onClick={handleBackgroundClick}
      onDoubleClick={handleDoubleClick}
      // Vertical page scrolling stays available until the map is zoomed in;
      // from then on the gesture belongs to the map, or panning would fight
      // the page for every drag.
      style={{ touchAction: isZoomed ? 'none' : 'pan-y' }}
      className={`relative w-full max-w-[500px] aspect-[1/1.12] mx-auto select-none overflow-hidden rounded-3xl p-1 bg-night-950 border border-gold-400/30 shadow-2xl ${
        isZoomed ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
    >
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})`,
          transformOrigin: '0 0',
        }}
      >
      {/* Background Libya Satellite Map Graphic */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
        <img
          src="/assets/libya-map.png"
          alt="خريطة ليبيا الجغرافية"
          draggable={false}
          className="w-full h-full object-cover opacity-90 scale-[1.02] filter contrast-115 drop-shadow-gold-glow"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCFEq4CYSnmFvo6GDkKPKQew6cRirUlLA3JAZJ2toqpPwcSa-CHqLSWH-pxFNMqgqtwdYpPFBR9ZdS6KDXjUBASyZqxbD8glHur2HVOTd5xTeU8razUpnEAAUh7cC9GQo2PutQidWExPhxpfX2j9aOsDWA6gXXBZ00gfmRO89uj7N1oufpge3pveC8_iyiT-CiS1WlERqUrHCrpzJTl9WldtBEqz5rIlCf2NZlYZsdwCsHv0-u4FQ3OAkElJsD8SJm4CFZGS3A37VA';
          }}
        />

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-night-950 via-transparent to-night-950/40" />
      </div>

      {/*
        Overlay tracking the artwork, not the container.

        The image is `object-cover` inside a container whose aspect ratio is
        wider than the artwork's, so it is scaled to the container's width and
        centre-cropped vertically. This box reproduces that exactly — full
        width, the artwork's own aspect ratio, centred — which means everything
        inside it can be positioned in plain artwork coordinates and stays
        aligned however the container is sized. `scale-[1.02]` mirrors the
        image's own scale so the two never drift apart.
      */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full scale-[1.02] pointer-events-none z-10"
        style={{ aspectRatio: `${MAP_IMAGE.width} / ${MAP_IMAGE.height}` }}
      >
      {/* SVG Naturally Curved Connecting Routes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${MAP_IMAGE.width} ${MAP_IMAGE.height}`}
      >
        <defs>
          <linearGradient id="goldRouteGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5A93B" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FCD34D" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.85" />
          </linearGradient>
        </defs>

        {routePaths.map((route) => (
          <path
            key={route.id}
            d={route.d}
            fill="none"
            stroke={route.isUnlocked ? 'url(#goldRouteGradient)' : 'rgba(255, 255, 255, 0.12)'}
            strokeLinecap="round"
            // Strokes are counter-scaled too, so a zoomed-in map shows finer
            // roads rather than gold ribbons swamping the coastline.
            strokeWidth={(route.isUnlocked ? 2.4 : 1.2) * symbolScale}
            strokeDasharray={
              route.isUnlocked
                ? `${8 * symbolScale}, ${6 * symbolScale}`
                : `${4.5 * symbolScale}, ${4.5 * symbolScale}`
            }
            className={route.isUnlocked ? 'animate-caravan-flow filter drop-shadow-gold-glow-sm' : ''}
          />
        ))}

        {/* Leader lines for pins the declutter had to move: a dot marks the
            true location and a hairline ties it to the drawn pin, so a
            displaced symbol still states where the city actually is. */}
        {[...placedPins].map(([id, placed]) =>
          placed.isDisplaced ? (
            <g key={`leader_${id}`} opacity={0.65}>
              <line
                x1={placed.anchor.x}
                y1={placed.anchor.y}
                x2={placed.display.x}
                y2={placed.display.y}
                stroke="rgba(252, 211, 77, 0.55)"
                strokeWidth={0.8 * symbolScale}
                strokeDasharray={`${2 * symbolScale}, ${2 * symbolScale}`}
              />
              <circle
                cx={placed.anchor.x}
                cy={placed.anchor.y}
                r={1.6 * symbolScale}
                fill="#FCD34D"
                stroke="rgba(11, 15, 25, 0.8)"
                strokeWidth={0.5 * symbolScale}
              />
            </g>
          ) : null
        )}

        {/* Spurs from the selected city out to each of its stage nodes. */}
        {expanded?.nodes.map(({ stage, point }) => {
          const isPlayable = stage.isUnlocked;
          return (
            <line
              key={`spur_${stage.id}`}
              x1={expanded.origin.x}
              y1={expanded.origin.y}
              x2={point.x}
              y2={point.y}
              stroke={isPlayable ? 'rgba(252, 211, 77, 0.75)' : 'rgba(255, 255, 255, 0.18)'}
              strokeWidth={1.4 * symbolScale}
              strokeLinecap="round"
              strokeDasharray={isPlayable ? 'none' : `${3 * symbolScale}, ${3 * symbolScale}`}
            />
          );
        })}
      </svg>

      {/* Interactive Map Overlay Pins */}
      <div className="absolute inset-0 z-20 pointer-events-auto">
        {cities.map((city) => {
          const isSelected = selectedCityId === city.id;
          const totalStars = city.stages.reduce((acc, s) => acc + (s.starsEarned || 0), 0);
          const isUnlocked = city.unlockedByDefault || city.stages.some((s) => s.isUnlocked);
          const isAllStagesCompleted = city.stages.every((s) => (s.starsEarned || 0) >= 1);
          const isRegionMatched = regionFilter === 'all' || city.region === regionFilter;
          // While one city is expanded, the others step back so the stage
          // constellation has room to read on a crowded coastline.
          const isBackgrounded = expanded !== null && expanded.city.id !== city.id;
          // The expanded city's own label would sit inside its fan, and it is
          // redundant anyway — the pin is highlighted and the card below names
          // the city.
          const isLabelHidden = expanded !== null && expanded.city.id === city.id;

          const placed = placedPins.get(city.id);
          if (!placed) return null;
          const pin = {
            left: (placed.display.x / MAP_IMAGE.width) * 100,
            top: (placed.display.y / MAP_IMAGE.height) * 100,
          };
          const placedLabel = labelPoints.get(city.id);
          const labelPoint = placedLabel?.centre ?? placed.display;
          const label = {
            left: (labelPoint.x / MAP_IMAGE.width) * 100,
            top: (labelPoint.y / MAP_IMAGE.height) * 100,
          };
          // A name with nowhere to sit is dropped rather than stacked on its
          // neighbour — except for the city the player has selected, which is
          // the one name they actually asked to see.
          const isLabelCrowdedOut = (placedLabel?.hidden ?? false) && !isSelected;

          return (
            <React.Fragment key={city.id}>
            <motion.button
              type="button"
              data-city-id={city.id}
              data-map-hit
              aria-label={city.arabicName}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-opacity duration-300 ${
                !isRegionMatched
                  ? 'opacity-35 pointer-events-none'
                  : isBackgrounded
                  ? 'opacity-45'
                  : 'opacity-100'
              }`}
              style={{
                left: `${pin.left}%`,
                top: `${pin.top}%`,
                // Held at a constant size on screen: zooming is for separating
                // the pins, not for magnifying them.
                scale: pinScale * (isBackgrounded ? 0.75 : 1),
              }}
              whileHover={{ scale: pinScale * 1.15 }}
              whileTap={{ scale: pinScale * 0.95 }}
              onClick={() => !wasDragged() && onSelectCity(city)}
            >
              {/* Pulsing Glowing Aura for Selected/Active Node */}
              {isSelected && (
                <motion.div
                  className={`absolute -inset-3 rounded-full pointer-events-none ${
                    isUnlocked ? 'bg-gold-400/50 blur-md' : 'bg-white/20 blur-sm'
                  }`}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}

              {/* Star-progress ring: how much of this city is finished, read
                  at a glance without opening it. */}
              {isUnlocked && totalStars > 0 && (
                <svg
                  className="absolute -inset-1 pointer-events-none -rotate-90"
                  viewBox="0 0 36 36"
                  aria-hidden="true"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke="rgba(255,255,255,0.12)"
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={isAllStagesCompleted ? '#10B981' : '#FCD34D'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeDasharray={`${(totalStars / (city.stages.length * 3)) * 100.5} 100.5`}
                    className="transition-all duration-500"
                  />
                </svg>
              )}

              {/* Completed City Glowing Beacon Halo */}
              {isAllStagesCompleted && (
                <div
                  className="absolute -inset-1.5 rounded-full border-2 border-gold-400/60 animate-beacon-glow pointer-events-none"
                  aria-hidden="true"
                />
              )}

              {/* Pin Beacon Icon Button */}
              <div
                className={`relative flex items-center justify-center rounded-full p-2 sm:p-2.5 transition-all shadow-xl ${
                  isSelected
                    ? isUnlocked
                      ? 'bg-gradient-to-br from-gold-300 to-gold-400 ring-4 ring-gold-400/60 scale-110 shadow-gold-glow'
                      : 'bg-night-700 border-2 border-white/40 ring-2 ring-white/20 scale-105'
                    : isUnlocked
                    ? 'bg-night-800/95 backdrop-blur-md border-2 border-gold-400 hover:border-gold-300 shadow-gold-glow-sm'
                    : 'bg-night-900/90 backdrop-blur-md border border-white/15 opacity-70'
                }`}
              >
                <CityIcon
                  cityId={city.id}
                  isSelected={isSelected && isUnlocked}
                  isUnlocked={isUnlocked}
                />

                {/* Status Indicator Badge (Lock / Check / Stars) */}
                <div className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black flex items-center gap-0.5 bg-night-900 border border-white/20 shadow-md">
                  {!isUnlocked ? (
                    <Lock className="w-2.5 h-2.5 text-ink-400" />
                  ) : isAllStagesCompleted ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-oasis-500" />
                  ) : totalStars > 0 ? (
                    <>
                      <Star className="w-2 h-2 text-gold-400 fill-gold-400" />
                      <span className="text-gold-300 text-[9px]">{totalStars}</span>
                    </>
                  ) : (
                    <span className="text-sea-300 text-[8px] font-bold">1</span>
                  )}
                </div>
              </div>

            </motion.button>

            {/* City label, hand-placed via labelOffset and rendered as a sibling
                so it lives in the same artwork coordinate space as the pin.
                Also a tap target, so the name works as well as the small dot. */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              data-map-hit
              onClick={() => !wasDragged() && onSelectCity(city)}
              style={{
                left: `${label.left}%`,
                top: `${label.top}%`,
                transform: `translate(-50%, -50%) scale(${symbolScale})`,
              }}
              className={`absolute whitespace-nowrap transition-opacity duration-300 ${
                isLabelHidden || isLabelCrowdedOut
                  ? 'opacity-0 pointer-events-none'
                  : !isRegionMatched
                  ? 'opacity-35 pointer-events-none'
                  : isBackgrounded
                  ? 'opacity-30'
                  : 'opacity-100'
              } ${isSelected ? 'z-30' : 'z-20'}`}
            >
              <span
                className={`text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded-full shadow-lg backdrop-blur-md transition-all ${
                  isSelected
                    ? isUnlocked
                      ? 'bg-gold-400 text-night-900 border border-gold-300 shadow-gold-glow-sm'
                      : 'bg-night-700 text-white border border-white/30'
                    : isUnlocked
                    ? 'bg-night-900/90 text-ink-100 border border-gold-400/35 hover:border-gold-400'
                    : 'bg-night-900/80 text-ink-400 border border-white/10'
                }`}
              >
                {city.mapLabel ?? city.arabicName}
              </span>
            </button>
            </React.Fragment>
          );
        })}

        {/* Stage constellation for the selected city */}
        {expanded?.nodes.map(({ stage, point }) => {
          const isPlayable = stage.isUnlocked;
          const stars = stage.starsEarned || 0;

          return (
            <motion.button
              key={stage.id}
              type="button"
              data-stage-id={stage.id}
              data-map-hit
              disabled={!isPlayable}
              aria-label={`${stage.title} — ${
                isPlayable ? `${stars} من 3 نجوم` : 'مرحلة مقفلة'
              }`}
              title={stage.title}
              onClick={() => isPlayable && !wasDragged() && onStartStage(expanded.city.id, stage)}
              initial={{ opacity: 0, scale: symbolScale * 0.4 }}
              animate={{ opacity: 1, scale: symbolScale }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: stage.stageNumber * 0.04 }}
              whileHover={isPlayable ? { scale: symbolScale * 1.18 } : undefined}
              whileTap={isPlayable ? { scale: symbolScale * 0.92 } : undefined}
              style={{
                left: `${(point.x / MAP_IMAGE.width) * 100}%`,
                top: `${(point.y / MAP_IMAGE.height) * 100}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-40 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex flex-col items-center justify-center font-black text-[11px] shadow-lg transition-colors ${
                !isPlayable
                  ? 'bg-night-900/90 border border-white/15 text-ink-500 cursor-not-allowed'
                  : stars > 0
                  ? 'bg-gradient-to-br from-gold-300 to-gold-400 border-2 border-gold-300 text-night-900 shadow-gold-glow-sm'
                  : 'bg-night-800 border-2 border-gold-400 text-gold-300 shadow-gold-glow-sm cursor-pointer'
              }`}
            >
              {isPlayable ? (
                <>
                  <span className="leading-none">{stage.stageNumber}</span>
                  {stars > 0 && (
                    <span className="leading-none text-[7px] tracking-[-0.5px] mt-0.5">
                      {'★'.repeat(stars)}
                    </span>
                  )}
                </>
              ) : (
                <Lock className="w-3 h-3" />
              )}
            </motion.button>
          );
        })}
      </div>
      </div>
      </div>

      {/*
        Centred on the bottom edge — below Libya's southern border, the one
        strip of this frame that is never a city. The corners all cover one:
        bottom left is Ghat, top right is Tobruk once panned. Keeping the
        controls inside the frame also keeps them out of the page's layout,
        which matters because a row of their own pushed the city card down
        behind the bottom navigation.
      */}
      <div
        data-map-hit
        className="absolute bottom-2 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* The zoom level, shown only while it is not 1 — a permanent "1.0x"
            badge would be noise on a map most players never zoom. */}
        <span
          // A number with its unit: RTL would otherwise render it as "×1.6".
          dir="ltr"
          className={`px-2 py-1 rounded-lg bg-night-900/90 backdrop-blur-md border border-gold-400/30 text-[10px] font-black text-gold-300 transition-opacity ${
            isZoomed ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {view.scale.toFixed(1)}×
        </span>

        <span className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => zoomBy(1.6, focusPoint && artworkToFrame(focusPoint))}
          disabled={!canZoomIn}
          aria-label="تكبير الخريطة"
          className="w-9 h-9 rounded-xl bg-night-900/90 backdrop-blur-md border border-gold-400/40 text-gold-300 flex items-center justify-center shadow-lg hover:border-gold-300 active:scale-95 disabled:opacity-30 transition-all"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.6, focusPoint && artworkToFrame(focusPoint))}
          disabled={!isZoomed}
          aria-label="تصغير الخريطة"
          className="w-9 h-9 rounded-xl bg-night-900/90 backdrop-blur-md border border-gold-400/40 text-gold-300 flex items-center justify-center shadow-lg hover:border-gold-300 active:scale-95 disabled:opacity-30 transition-all"
        >
          <Minus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={reset}
          disabled={!isZoomed}
          aria-label="إعادة الخريطة لحجمها"
          className="w-9 h-9 rounded-xl bg-night-900/90 backdrop-blur-md border border-white/15 text-ink-400 flex items-center justify-center shadow-lg hover:text-white active:scale-95 disabled:opacity-30 transition-all"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
        </span>
      </div>
    </div>
  );
};
