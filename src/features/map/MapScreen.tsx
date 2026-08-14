import React, { useState } from 'react';
import { LibyaVectorMap } from './LibyaVectorMap';
import { CityDetailModal } from './CityDetailModal';
import { useMapStore } from '../../store/useMapStore';
import type { CityNode, Stage, LibyanRegion } from '../../types/map';
import { MapPin, Compass, Trophy, Star } from 'lucide-react';

interface MapScreenProps {
  onStartStage: (cityId: string, stage: Stage) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onStartStage }) => {
  const { cities, selectedCityId, selectCity } = useMapStore();
  const [regionFilter, setRegionFilter] = useState<LibyanRegion | 'all'>('all');
  const [activeModalCity, setActiveModalCity] = useState<CityNode | null>(null);

  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  // Tapping a pin expands that city's stages on the map. The full detail card
  // (lore, rewards, lock requirements) stays one tap away via "استكشف" below —
  // previously the pin opened that card immediately, which left no way to see
  // a city's stages in place on the map.
  const handlePinClick = (city: CityNode) => {
    selectCity(city.id);
  };

  const filteredCities = regionFilter === 'all' ? cities : cities.filter((c) => c.region === regionFilter);

  const unlockedCount = cities.filter(
    (c) => c.unlockedByDefault || c.stages.some((s) => s.isUnlocked)
  ).length;
  const earnedStars = cities.reduce(
    (acc, c) => acc + c.stages.reduce((s, stage) => s + (stage.starsEarned || 0), 0),
    0
  );
  const totalPossibleStars = cities.reduce((acc, c) => acc + c.stages.length * 3, 0);
  const starPercent = totalPossibleStars ? (earnedStars / totalPossibleStars) * 100 : 0;

  return (
    <div className="flex flex-col gap-3 pb-36 max-w-lg mx-auto w-full px-3 select-none">
      {/* Title & Region Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-ink-100 flex items-center gap-2">
            <Compass className="w-5 h-5 text-gold-400" />
            خريطة التحدي والاستكشاف
          </h2>
          <p className="text-xs text-ink-400 mt-0.5">
            سافر عبر مدن ومعالم ليبيا واجمع النجوم والدنانير
          </p>
        </div>

        {/* Total City Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-night-700 border border-gold-400/30 text-xs font-bold text-gold-300 shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-gold-400" />
          <span>{filteredCities.length} مدن</span>
        </div>
      </div>

      {/* Region Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setRegionFilter('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'all'
              ? 'bg-gold-400 text-night-900 shadow-gold-glow-sm'
              : 'bg-night-800 text-ink-400 border border-white/10 hover:text-white'
          }`}
        >
          كافة أرجاء ليبيا ({cities.length})
        </button>
        <button
          onClick={() => setRegionFilter('tripolitania')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'tripolitania'
              ? 'bg-sea-500 text-night-900 shadow-[0_0_15px_rgb(14_165_233/0.3)]'
              : 'bg-night-800 text-ink-400 border border-white/10 hover:text-white'
          }`}
        >
          طرابلس والساحل الغربي
        </button>
        <button
          onClick={() => setRegionFilter('cyrenaica')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'cyrenaica'
              ? 'bg-oasis-500 text-night-900 shadow-oasis-glow'
              : 'bg-night-800 text-ink-400 border border-white/10 hover:text-white'
          }`}
        >
          برقة والجبل الأخضر
        </button>
        <button
          onClick={() => setRegionFilter('fezzan')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'fezzan'
              ? 'bg-flame text-night-900 shadow-gold-glow-sm'
              : 'bg-night-800 text-ink-400 border border-white/10 hover:text-white'
          }`}
        >
          فزان والجنوب
        </button>
        <button
          onClick={() => setRegionFilter('oasis_desert')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'oasis_desert'
              ? 'bg-rose text-night-900 shadow-[0_0_15px_rgb(236_72_153/0.3)]'
              : 'bg-night-800 text-ink-400 border border-white/10 hover:text-white'
          }`}
        >
          واحات الصحراء الكبرى
        </button>
      </div>

      {/* Main Libya Map Component with Stitch Artwork */}
      <LibyaVectorMap
        onSelectCity={handlePinClick}
        onStartStage={onStartStage}
        selectedCityId={selectedCityId}
        regionFilter={regionFilter}
      />

      {/* Expedition progress: how much of Libya is opened and starred. */}
      <div className="glass-card px-3.5 py-2.5 rounded-2xl flex items-center gap-3">
        <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-black text-gold-300">
          <Compass className="w-3.5 h-3.5 text-gold-400" />
          <span>
            {unlockedCount}/{cities.length} مدينة
          </span>
        </div>

        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300 transition-all duration-500"
            style={{ width: `${starPercent}%` }}
          />
        </div>

        <div className="flex items-center gap-1 shrink-0 text-[11px] font-black text-gold-300">
          <Star className="w-3.5 h-3.5 text-gold-400 fill-gold-400" />
          <span>
            {earnedStars}/{totalPossibleStars}
          </span>
        </div>
      </div>

      {/* Selected City Bottom Inspection Card */}
      {selectedCity && (
        <div className="glass-card-interactive p-3.5 rounded-3xl flex items-center justify-between gap-3 border border-gold-400/25 shadow-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-gold-400/20 border border-gold-400/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
              {selectedCity.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white truncate">{selectedCity.arabicName}</h4>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-sea-500/20 text-sea-300 font-bold border border-sea-500/30 shrink-0">
                  {selectedCity.titleBadge}
                </span>
              </div>
              <p className="text-[11px] text-ink-400 truncate mt-0.5">{selectedCity.description}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModalCity(selectedCity)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-gold-400 to-flame hover:from-gold-300 hover:to-gold-400 text-night-900 font-black text-xs shadow-gold-glow-sm shrink-0 transition-transform active:scale-95"
          >
            <span>استكشف</span>
            <Trophy className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* City Modal Dialog */}
      <CityDetailModal
        city={activeModalCity}
        onClose={() => setActiveModalCity(null)}
        onStartStage={(cityId, stage) => {
          setActiveModalCity(null);
          onStartStage(cityId, stage);
        }}
      />
    </div>
  );
};
