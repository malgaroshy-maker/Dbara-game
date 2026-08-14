import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { initialCities } from '../data/cities';
import type { CityNode, Stage } from '../types/map';
import { sfx } from '../audio/soundEffects';

interface MapState {
  cities: CityNode[];
  selectedCityId: string | null;
  activeStage: { cityId: string; stage: Stage } | null;

  // Actions
  selectCity: (cityId: string | null) => void;
  startStage: (cityId: string, stage: Stage) => void;
  clearActiveStage: () => void;
  completeStage: (cityId: string, stageId: string, stars: number) => { newStarsEarned: number; newlyUnlockedCities: string[] };
  getTotalStars: () => number;
  /**
   * Opens a city without the stars, for a player who pays instead.
   *
   * Only the first stage opens, exactly as reaching the star threshold would,
   * so buying your way in skips the queue rather than the game.
   */
  purchaseCityUnlock: (cityId: string) => boolean;
  resetMapProgress: () => void;
}

// Helper to merge stored cities with newly updated initialCities.
// Exported so restored backups go through the same reconciliation as a
// rehydrated save — otherwise an old backup would drop cities added since.
export const mergeCitiesWithInitial = (savedCities: CityNode[]): CityNode[] => {
  if (!Array.isArray(savedCities) || savedCities.length === 0) return initialCities;

  return initialCities.map((initCity) => {
    const saved = savedCities.find((c) => c.id === initCity.id);
    if (!saved) return initCity;

    const mergedStages = initCity.stages.map((initStg) => {
      const savedStg = saved.stages?.find((s) => s.id === initStg.id);
      return savedStg
        ? { ...initStg, starsEarned: savedStg.starsEarned || 0, isUnlocked: savedStg.isUnlocked ?? initStg.isUnlocked }
        : initStg;
    });

    return {
      ...initCity,
      stages: mergedStages,
    };
  });
};

export const useMapStore = create<MapState>()(
  persist(
    (set, get) => ({
      cities: initialCities,
      selectedCityId: 'tripoli',
      activeStage: null,

      selectCity: (cityId) => {
        if (cityId) sfx.playTap();
        set({ selectedCityId: cityId });
      },

      startStage: (cityId, stage) => {
        sfx.playTap();
        set({ activeStage: { cityId, stage } });
      },

      clearActiveStage: () => set({ activeStage: null }),

      completeStage: (cityId, stageId, stars) => {
        const state = get();
        let newStarsEarned = 0;
        const newlyUnlockedCities: string[] = [];

        const updatedCities = state.cities.map((city) => {
          if (city.id !== cityId) return city;

          const updatedStages = city.stages.map((stg) => {
            if (stg.id === stageId) {
              const previousStars = stg.starsEarned || 0;
              const awardedStars = Math.max(previousStars, stars);
              newStarsEarned += Math.max(0, awardedStars - previousStars);
              return { ...stg, starsEarned: awardedStars };
            }
            return stg;
          });

          // Unlock next stage in same city if current was passed with >= 1 star
          const currentStageIdx = updatedStages.findIndex((s) => s.id === stageId);
          if (stars >= 1 && currentStageIdx >= 0 && currentStageIdx + 1 < updatedStages.length) {
            updatedStages[currentStageIdx + 1].isUnlocked = true;
          }

          return { ...city, stages: updatedStages };
        });

        // Calculate total stars after this victory
        const totalStars = updatedCities.reduce(
          (acc, c) => acc + c.stages.reduce((sAcc, stg) => sAcc + (stg.starsEarned || 0), 0),
          0
        );

        // Check if any locked cities now meet the star threshold
        const finalizedCities = updatedCities.map((city) => {
          const isCurrentlyLocked = !city.unlockedByDefault && city.stages.every((s) => !s.isUnlocked);
          if (isCurrentlyLocked && totalStars >= city.requiredStarsToUnlock) {
            newlyUnlockedCities.push(city.id);
            const unlockedFirstStage = city.stages.map((s, idx) => ({
              ...s,
              isUnlocked: idx === 0,
            }));
            return { ...city, stages: unlockedFirstStage };
          }
          return city;
        });

        set({ cities: finalizedCities });
        return { newStarsEarned, newlyUnlockedCities };
      },

      purchaseCityUnlock: (cityId) => {
        const city = get().cities.find((c) => c.id === cityId);
        if (!city) return false;
        const alreadyOpen = city.unlockedByDefault || city.stages.some((s) => s.isUnlocked);
        if (alreadyOpen) return false;

        sfx.playVictory();
        set((state) => ({
          cities: state.cities.map((c) =>
            c.id === cityId
              ? { ...c, stages: c.stages.map((s, idx) => ({ ...s, isUnlocked: idx === 0 })) }
              : c
          ),
        }));
        return true;
      },

      getTotalStars: () => {
        return get().cities.reduce(
          (acc, c) => acc + c.stages.reduce((sAcc, stg) => sAcc + (stg.starsEarned || 0), 0),
          0
        );
      },

      resetMapProgress: () => {
        set({
          cities: initialCities,
          selectedCityId: 'tripoli',
          activeStage: null,
        });
      },
    }),
    {
      name: 'dbara_map_save_v2',
      storage: createJSONStorage(() => localStorage),
      // `activeStage` is transient: persisting it drops the player back into a
      // half-played stage with a fresh timer after any reload.
      partialize: (state) => ({
        cities: state.cities,
        selectedCityId: state.selectedCityId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && state.cities) {
          state.cities = mergeCitiesWithInitial(state.cities);
        }
      },
    }
  )
);
