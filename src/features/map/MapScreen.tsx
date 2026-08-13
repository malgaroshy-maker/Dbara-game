import React, { useState } from 'react';
import { LibyaVectorMap } from './LibyaVectorMap';
import { CityDetailModal } from './CityDetailModal';
import { useMapStore } from '../../store/useMapStore';
import type { CityNode, Stage, LibyanRegion } from '../../types/map';
import { MapPin, Compass, Trophy } from 'lucide-react';

interface MapScreenProps {
  onStartStage: (cityId: string, stage: Stage) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({ onStartStage }) => {
  const { cities, selectedCityId, selectCity } = useMapStore();
  const [regionFilter, setRegionFilter] = useState<LibyanRegion | 'all'>('all');
  const [activeModalCity, setActiveModalCity] = useState<CityNode | null>(null);

  const selectedCity = cities.find((c) => c.id === selectedCityId) || cities[0];

  const handlePinClick = (city: CityNode) => {
    selectCity(city.id);
    setActiveModalCity(city);
  };

  const filteredCities = regionFilter === 'all' ? cities : cities.filter((c) => c.region === regionFilter);

  return (
    <div className="flex flex-col gap-3 pb-36 max-w-lg mx-auto w-full px-3 select-none">
      {/* Title & Region Banner */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h2 className="text-xl font-extrabold text-[#F8FAFC] flex items-center gap-2">
            <Compass className="w-5 h-5 text-[#E5A93B]" />
            خريطة التحدي والاستكشاف
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            سافر عبر مدن ومعالم ليبيا واجمع النجوم والدنانير
          </p>
        </div>

        {/* Total City Count Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1E293B] border border-[#E5A93B]/30 text-xs font-bold text-[#FCD34D] shadow-sm">
          <MapPin className="w-3.5 h-3.5 text-[#E5A93B]" />
          <span>{filteredCities.length} مدن</span>
        </div>
      </div>

      {/* Region Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <button
          onClick={() => setRegionFilter('all')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'all'
              ? 'bg-[#E5A93B] text-[#0B0F19] shadow-[0_0_15px_rgba(229,169,59,0.3)]'
              : 'bg-[#131C2E] text-[#94A3B8] border border-white/10 hover:text-white'
          }`}
        >
          كافة أرجاء ليبيا ({cities.length})
        </button>
        <button
          onClick={() => setRegionFilter('tripolitania')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'tripolitania'
              ? 'bg-[#0EA5E9] text-[#0B0F19] shadow-[0_0_15px_rgba(14,165,233,0.3)]'
              : 'bg-[#131C2E] text-[#94A3B8] border border-white/10 hover:text-white'
          }`}
        >
          طرابلس والساحل الغربي
        </button>
        <button
          onClick={() => setRegionFilter('cyrenaica')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'cyrenaica'
              ? 'bg-[#10B981] text-[#0B0F19] shadow-[0_0_15px_rgba(16,185,129,0.3)]'
              : 'bg-[#131C2E] text-[#94A3B8] border border-white/10 hover:text-white'
          }`}
        >
          برقة والجبل الأخضر
        </button>
        <button
          onClick={() => setRegionFilter('fezzan')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'fezzan'
              ? 'bg-[#F59E0B] text-[#0B0F19] shadow-[0_0_15px_rgba(245,158,11,0.3)]'
              : 'bg-[#131C2E] text-[#94A3B8] border border-white/10 hover:text-white'
          }`}
        >
          فزان والجنوب
        </button>
        <button
          onClick={() => setRegionFilter('oasis_desert')}
          className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all ${
            regionFilter === 'oasis_desert'
              ? 'bg-[#EC4899] text-[#0B0F19] shadow-[0_0_15px_rgba(236,72,153,0.3)]'
              : 'bg-[#131C2E] text-[#94A3B8] border border-white/10 hover:text-white'
          }`}
        >
          واحات الصحراء الكبرى
        </button>
      </div>

      {/* Main Libya Map Component with Stitch Artwork */}
      <LibyaVectorMap
        onSelectCity={handlePinClick}
        selectedCityId={selectedCityId}
        regionFilter={regionFilter}
      />

      {/* Selected City Bottom Inspection Card */}
      {selectedCity && (
        <div className="glass-card-interactive p-3.5 rounded-3xl flex items-center justify-between gap-3 border border-[#E5A93B]/25 shadow-xl">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-11 h-11 rounded-2xl bg-[#E5A93B]/20 border border-[#E5A93B]/40 flex items-center justify-center text-xl shrink-0 shadow-inner">
              {selectedCity.icon}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-white truncate">{selectedCity.arabicName}</h4>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#0EA5E9]/20 text-[#38BDF8] font-bold border border-[#0EA5E9]/30 shrink-0">
                  {selectedCity.titleBadge}
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] truncate mt-0.5">{selectedCity.description}</p>
            </div>
          </div>

          <button
            onClick={() => setActiveModalCity(selectedCity)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] hover:from-[#FCD34D] hover:to-[#E5A93B] text-[#0B0F19] font-black text-xs shadow-[0_0_15px_rgba(229,169,59,0.35)] shrink-0 transition-transform active:scale-95"
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
