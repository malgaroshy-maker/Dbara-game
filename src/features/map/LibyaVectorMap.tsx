import React from 'react';
import { motion } from 'framer-motion';
import type { CityNode } from '../../types/map';
import { useMapStore } from '../../store/useMapStore';
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
  Flame
} from 'lucide-react';

interface LibyaVectorMapProps {
  onSelectCity: (city: CityNode) => void;
  selectedCityId: string | null;
}

export const LibyaVectorMap: React.FC<LibyaVectorMapProps> = ({ onSelectCity, selectedCityId }) => {
  const { cities } = useMapStore();

  // Natural curved geographic paths across Libya firmly on the landmass
  const routePaths: { id: string; d: string; isUnlocked: boolean }[] = [
    // 1. Coastal Highway (curves around Gulf of Sidra): Tripoli -> Leptis -> Benghazi -> Cyrene
    {
      id: 'coastal_1',
      d: 'M 23,27 Q 28,29 33,32', // Tripoli to Leptis
      isUnlocked: true,
    },
    {
      id: 'coastal_2',
      d: 'M 33,32 Q 46,42 60,36', // Leptis to Benghazi (around Gulf of Sidra)
      isUnlocked: true,
    },
    {
      id: 'coastal_3',
      d: 'M 60,36 Q 67,29 74,24', // Benghazi to Cyrene (Green Mountain)
      isUnlocked: true,
    },
    // 2. Western Desert Route: Tripoli -> Ghadames -> Sabha -> Ghat
    {
      id: 'desert_west_1',
      d: 'M 23,27 Q 15,38 10,49', // Tripoli to Ghadames
      isUnlocked: true,
    },
    {
      id: 'desert_west_2',
      d: 'M 10,49 Q 22,59 38,67', // Ghadames to Sabha
      isUnlocked: true,
    },
    {
      id: 'desert_west_3',
      d: 'M 38,67 Q 24,75 15,81', // Sabha to Ghat
      isUnlocked: false,
    },
    // 3. Eastern Desert Route: Benghazi -> Sabha -> Kufra
    {
      id: 'desert_east_1',
      d: 'M 60,36 Q 50,52 38,67', // Benghazi to Sabha
      isUnlocked: true,
    },
    {
      id: 'desert_east_2',
      d: 'M 38,67 Q 58,72 78,77', // Sabha to Kufra
      isUnlocked: false,
    },
  ];

  // Custom Icon Selector for High-Craft Aesthetics
  const getCityIcon = (cityId: string, isSelected: boolean, isUnlocked: boolean) => {
    const iconClass = `w-4 h-4 sm:w-5 sm:h-5 transition-transform ${
      isSelected ? 'text-[#0B0F19]' : isUnlocked ? 'text-[#FCD34D]' : 'text-[#64748B]'
    }`;

    switch (cityId) {
      case 'tripoli':
        return <Castle className={iconClass} />;
      case 'leptis_magna':
        return <Landmark className={iconClass} />;
      case 'benghazi':
        return <Waves className={iconClass} />;
      case 'cyrene_green_mountain':
        return <Trees className={iconClass} />;
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
    <div className="relative w-full max-w-[500px] aspect-[1/1.12] mx-auto select-none overflow-hidden rounded-3xl p-1 bg-[#06080C] border border-[#E5A93B]/30 shadow-2xl">
      {/* Background Libya Satellite Map Graphic */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden rounded-3xl">
        <img
          src="/assets/libya-map.png"
          alt="خريطة ليبيا الجغرافية"
          className="w-full h-full object-cover opacity-90 scale-[1.02] filter contrast-115 drop-shadow-[0_0_25px_rgba(212,175,55,0.25)]"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://lh3.googleusercontent.com/aida-public/AB6AXuCFEq4CYSnmFvo6GDkKPKQew6cRirUlLA3JAZJ2toqpPwcSa-CHqLSWH-pxFNMqgqtwdYpPFBR9ZdS6KDXjUBASyZqxbD8glHur2HVOTd5xTeU8razUpnEAAUh7cC9GQo2PutQidWExPhxpfX2j9aOsDWA6gXXBZ00gfmRO89uj7N1oufpge3pveC8_iyiT-CiS1WlERqUrHCrpzJTl9WldtBEqz5rIlCf2NZlYZsdwCsHv0-u4FQ3OAkElJsD8SJm4CFZGS3A37VA';
          }}
        />

        {/* Ambient Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080C] via-transparent to-[#06080C]/40" />
      </div>

      {/* SVG Naturally Curved Connecting Routes */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
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
            strokeWidth={route.isUnlocked ? '0.85' : '0.45'}
            strokeDasharray={route.isUnlocked ? 'none' : '1.5, 1.5'}
            className={route.isUnlocked ? 'filter drop-shadow-[0_0_5px_rgba(229,169,59,0.6)]' : ''}
          />
        ))}
      </svg>

      {/* Interactive Map Overlay Pins */}
      <div className="relative w-full h-full z-20">
        {cities.map((city) => {
          const isSelected = selectedCityId === city.id;
          const totalStars = city.stages.reduce((acc, s) => acc + (s.starsEarned || 0), 0);
          const isUnlocked = city.unlockedByDefault || city.stages.some((s) => s.isUnlocked);
          const isAllStagesCompleted = city.stages.every((s) => (s.starsEarned || 0) >= 1);

          return (
            <motion.div
              key={city.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
              style={{
                left: `${city.coordinates.xPercent}%`,
                top: `${city.coordinates.yPercent}%`,
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCity(city)}
            >
              {/* Pulsing Glowing Aura for Selected/Active Node */}
              {isSelected && (
                <motion.div
                  className={`absolute -inset-3 rounded-full pointer-events-none ${
                    isUnlocked ? 'bg-[#E5A93B]/50 blur-md' : 'bg-white/20 blur-sm'
                  }`}
                  animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}

              {/* Pin Beacon Icon Button */}
              <div
                className={`relative flex items-center justify-center rounded-full p-2.5 sm:p-3 transition-all shadow-xl ${
                  isSelected
                    ? isUnlocked
                      ? 'bg-gradient-to-br from-[#FCD34D] to-[#E5A93B] ring-4 ring-[#E5A93B]/60 scale-110 shadow-[0_0_25px_#E5A93B]'
                      : 'bg-[#1E293B] border-2 border-white/40 ring-2 ring-white/20 scale-105'
                    : isUnlocked
                    ? 'bg-[#131C2E]/95 backdrop-blur-md border-2 border-[#E5A93B] hover:border-[#FCD34D] shadow-[0_0_15px_rgba(229,169,59,0.35)]'
                    : 'bg-[#0B0F19]/90 backdrop-blur-md border border-white/15 opacity-70'
                }`}
              >
                {getCityIcon(city.id, isSelected && isUnlocked, isUnlocked)}

                {/* Status Indicator Badge (Lock / Check / Stars) */}
                <div className="absolute -top-2.5 -right-2 px-1.5 py-0.5 rounded-full text-[8px] font-black flex items-center gap-0.5 bg-[#0B0F19] border border-white/20 shadow-md">
                  {!isUnlocked ? (
                    <Lock className="w-2.5 h-2.5 text-[#94A3B8]" />
                  ) : isAllStagesCompleted ? (
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#10B981]" />
                  ) : totalStars > 0 ? (
                    <>
                      <Star className="w-2 h-2 text-[#E5A93B] fill-[#E5A93B]" />
                      <span className="text-[#FCD34D] text-[9px]">{totalStars}</span>
                    </>
                  ) : (
                    <span className="text-[#38BDF8] text-[8px] font-bold">1</span>
                  )}
                </div>
              </div>

              {/* City Label Below Pin */}
              <div className="absolute top-full mt-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none">
                <span
                  className={`text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded-full shadow-lg backdrop-blur-md transition-all ${
                    isSelected
                      ? isUnlocked
                        ? 'bg-[#E5A93B] text-[#0B0F19] border border-[#FCD34D] shadow-[0_0_12px_rgba(229,169,59,0.5)]'
                        : 'bg-[#1E293B] text-white border border-white/30'
                      : isUnlocked
                      ? 'bg-[#0B0F19]/90 text-[#F8FAFC] border border-[#E5A93B]/35 hover:border-[#E5A93B]'
                      : 'bg-[#0B0F19]/80 text-[#94A3B8] border border-white/10'
                  }`}
                >
                  {city.arabicName}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
