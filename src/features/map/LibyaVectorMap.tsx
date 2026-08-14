import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { CityNode, LibyanRegion, Stage } from '../../types/map';
import { useMapStore } from '../../store/useMapStore';
import { MAP_IMAGE, projectToMap, buildRoutePath } from './projection';
import { declutterPins } from './pinLayout';
import { layoutLabels } from './labelLayout';
import {
  layoutStageNodes,
  PIN_CLEARANCE,
  LABEL_CLEARANCE,
  type Obstacle,
} from './stageLayout';
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
  Sparkles
} from 'lucide-react';

interface LibyaVectorMapProps {
  onSelectCity: (city: CityNode) => void;
  onStartStage: (cityId: string, stage: Stage) => void;
  selectedCityId: string | null;
  regionFilter?: LibyanRegion | 'all';
}

export const LibyaVectorMap: React.FC<LibyaVectorMapProps> = ({
  onSelectCity,
  onStartStage,
  selectedCityId,
  regionFilter = 'all',
}) => {
  const { cities } = useMapStore();

  /**
   * True projected positions, then the drawn positions after decluttering.
   * `cityPoints` is what everything on the map aligns to — pins, labels,
   * routes and stage fans — so they never disagree about where a city is.
   */
  const placedPins = useMemo(
    () =>
      declutterPins(
        cities.map((c) => ({
          id: c.id,
          point: projectToMap(c.coordinates.latitude, c.coordinates.longitude),
        }))
      ),
    [cities]
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
        })
      ),
    [cities, cityPoints]
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
          { ...p, clearance: PIN_CLEARANCE },
          ...(l ? [{ ...l, clearance: LABEL_CLEARANCE }] : []),
        ];
      });

    const { positions } = layoutStageNodes(origin, city.stages.length, obstacles);
    return {
      city,
      origin,
      nodes: city.stages.map((stage, i) => ({ stage, point: positions[i] })),
    };
  }, [cities, selectedCityId, cityPoints]);

  // Caravan routes as city pairs plus a bow, so they always terminate exactly
  // on the projected pins. Previously these were hand-written path coordinates
  // that had to be re-drawn by hand whenever a pin moved — and silently pointed
  // at the wrong places when it did.
  const routePaths = useMemo(() => {
    const segments: { id: string; from: string; to: string; curvature: number }[] = [
      // 1. Coastal Highway (Tripoli -> Msallata -> Leptis -> Misrata -> Benghazi
      //    -> Cyrene -> Derna). Msallata sits inland between Tripoli and Leptis,
      //    so the chain threads through it rather than bypassing it.
      { id: 'coastal_0', from: 'zuwara', to: 'tripoli', curvature: 0.1 },
      { id: 'coastal_1', from: 'tripoli', to: 'msallata', curvature: 0.12 },
      { id: 'coastal_1b', from: 'msallata', to: 'leptis_magna', curvature: 0.12 },
      { id: 'coastal_2', from: 'leptis_magna', to: 'misrata', curvature: 0.1 },
      // Threads the shore of the Gulf of Sirte through Sirte itself rather than
      // cutting straight across open water.
      { id: 'coastal_3', from: 'misrata', to: 'sirte', curvature: 0.35 },
      { id: 'coastal_3b', from: 'sirte', to: 'ajdabiya', curvature: 0.35 },
      { id: 'coastal_3c', from: 'ajdabiya', to: 'benghazi', curvature: 0.15 },
      { id: 'coastal_4', from: 'benghazi', to: 'cyrene_green_mountain', curvature: -0.1 },
      { id: 'coastal_5', from: 'cyrene_green_mountain', to: 'derna', curvature: 0.1 },
      { id: 'coastal_6', from: 'derna', to: 'tobruk', curvature: 0.1 },

      // 2. Western Mountain & Desert (Tripoli -> Gharyan -> Nalut -> Ghadames
      //    -> Sabha -> Murzuq -> Ghat)
      { id: 'west_1', from: 'tripoli', to: 'gharyan', curvature: 0.12 },
      { id: 'west_1b', from: 'gharyan', to: 'nalut_nafusa', curvature: 0.12 },
      { id: 'west_2', from: 'nalut_nafusa', to: 'ghadames', curvature: 0.12 },
      { id: 'west_3', from: 'ghadames', to: 'sabha_fezzan', curvature: -0.1 },
      { id: 'west_4', from: 'sabha_fezzan', to: 'murzuq', curvature: -0.1 },
      { id: 'west_5', from: 'murzuq', to: 'ghat_akakus', curvature: -0.12 },

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

  // Custom Icon Selector for High-Craft Aesthetics across all 12 cities
  const getCityIcon = (cityId: string, isSelected: boolean, isUnlocked: boolean) => {
    // Smaller symbols mean less displacement is needed to separate the coastal
    // cluster, so pins stay closer to their true positions.
    const iconClass = `w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform ${
      isSelected ? 'text-night-900' : isUnlocked ? 'text-gold-300' : 'text-ink-500'
    }`;

    switch (cityId) {
      case 'tripoli':
        return <Castle className={iconClass} />;
      case 'leptis_magna':
        return <Landmark className={iconClass} />;
      case 'msallata':
        return <Leaf className={iconClass} />;
      case 'zuwara':
        return <Fish className={iconClass} />;
      case 'gharyan':
        return <Amphora className={iconClass} />;
      case 'sirte':
        return <Sunset className={iconClass} />;
      case 'ajdabiya':
        return <Milestone className={iconClass} />;
      case 'tobruk':
        return <Ship className={iconClass} />;
      case 'jaghbub':
        return <BookOpen className={iconClass} />;
      case 'murzuq':
        return <Tent className={iconClass} />;
      case 'misrata':
        return <Anchor className={iconClass} />;
      case 'nalut_nafusa':
        return <Castle className={iconClass} />;
      case 'benghazi':
        return <Waves className={iconClass} />;
      case 'cyrene_green_mountain':
        return <Trees className={iconClass} />;
      case 'derna':
        return <Sparkles className={iconClass} />;
      case 'jalu_awjila':
        return <Palmtree className={iconClass} />;
      case 'ghadames':
        return <Palmtree className={iconClass} />;
      case 'sabha_fezzan':
        return <Flame className={iconClass} />;
      case 'ghat_akakus':
        return <Mountain className={iconClass} />;
      case 'kufra_desert':
        return <Sun className={iconClass} />;
      default:
        return <Landmark className={iconClass} />;
    }
  };

  return (
    <div className="relative w-full max-w-[500px] aspect-[1/1.12] mx-auto select-none overflow-hidden rounded-3xl p-1 bg-night-950 border border-gold-400/30 shadow-2xl">
      {/* Background Libya Satellite Map Graphic */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
        <img
          src="/assets/libya-map.png"
          alt="خريطة ليبيا الجغرافية"
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
            strokeWidth={route.isUnlocked ? 2.2 : 1.2}
            strokeDasharray={route.isUnlocked ? 'none' : '4.5, 4.5'}
            className={route.isUnlocked ? 'filter drop-shadow-gold-glow-sm' : ''}
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
                strokeWidth={0.8}
                strokeDasharray="2, 2"
              />
              <circle
                cx={placed.anchor.x}
                cy={placed.anchor.y}
                r={1.6}
                fill="#FCD34D"
                stroke="rgba(11, 15, 25, 0.8)"
                strokeWidth={0.5}
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
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeDasharray={isPlayable ? 'none' : '3, 3'}
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
          const labelPoint = labelPoints.get(city.id) ?? placed.display;
          const label = {
            left: (labelPoint.x / MAP_IMAGE.width) * 100,
            top: (labelPoint.y / MAP_IMAGE.height) * 100,
          };

          return (
            <React.Fragment key={city.id}>
            <motion.button
              type="button"
              data-city-id={city.id}
              aria-label={city.arabicName}
              className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                !isRegionMatched
                  ? 'opacity-35 pointer-events-none'
                  : isBackgrounded
                  ? 'opacity-45 scale-75'
                  : 'opacity-100'
              }`}
              style={{ left: `${pin.left}%`, top: `${pin.top}%` }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCity(city)}
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
                {getCityIcon(city.id, isSelected && isUnlocked, isUnlocked)}

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
              onClick={() => onSelectCity(city)}
              style={{ left: `${label.left}%`, top: `${label.top}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap transition-opacity duration-300 ${
                isLabelHidden
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
              disabled={!isPlayable}
              aria-label={`${stage.title} — ${
                isPlayable ? `${stars} من 3 نجوم` : 'مرحلة مقفلة'
              }`}
              title={stage.title}
              onClick={() => isPlayable && onStartStage(expanded.city.id, stage)}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22, delay: stage.stageNumber * 0.04 }}
              whileHover={isPlayable ? { scale: 1.18 } : undefined}
              whileTap={isPlayable ? { scale: 0.92 } : undefined}
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
  );
};
