import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProfile, AudioSettings, GameStats, GameMode } from '../types/game';
import { sfx } from '../audio/soundEffects';

interface GameState {
  currentMode: GameMode;
  profile: PlayerProfile;
  audio: AudioSettings;
  stats: GameStats;
  unlockedBadges: string[];
  activeCategory: string | null;

  // Actions
  setMode: (mode: GameMode) => void;
  setActiveCategory: (cat: string | null) => void;
  addDinars: (amount: number) => void;
  spendDinars: (amount: number) => boolean;
  useLifeline: (type: keyof PlayerProfile['lifelines']) => boolean;
  buyLifeline: (type: keyof PlayerProfile['lifelines'], cost: number) => boolean;
  toggleSound: () => void;
  toggleMusic: () => void;
  toggleHaptics: () => void;
  recordQuestionAnswer: (isCorrect: boolean) => void;
  recordSpeedScore: (score: number) => void;
  unlockBadge: (badgeId: string) => void;
  checkDailyStreak: () => { streakUpdated: boolean; bonusGranted: number };
  exportSaveData: () => string;
  importSaveData: (jsonString: string) => boolean;
  resetAllProgress: () => void;
}

const initialProfile: PlayerProfile = {
  name: 'مستكشف دبارة',
  avatar: '🧭',
  title: 'مستكشف مبتدئ',
  dinars: 150, // Starting bonus
  totalStars: 0,
  streakDays: 1,
  lastLoginDate: new Date().toISOString().split('T')[0],
  lifelines: {
    fiftyFifty: 3,
    revealLetter: 3,
    skip: 1,
    extraTime: 2,
  },
};

const initialAudio: AudioSettings = {
  soundEnabled: true,
  musicEnabled: true,
  hapticsEnabled: true,
};

const initialStats: GameStats = {
  questionsAnswered: 0,
  correctAnswers: 0,
  citiesUnlocked: 1,
  crosswordsSolved: 0,
  dailyStreakRecord: 1,
  bestSpeedScore: 0,
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      currentMode: 'map',
      profile: initialProfile,
      audio: initialAudio,
      stats: initialStats,
      unlockedBadges: ['welcome_badge'],
      activeCategory: null,

      setMode: (mode) => {
        sfx.playTap();
        set({ currentMode: mode });
      },

      setActiveCategory: (cat) => set({ activeCategory: cat }),

      addDinars: (amount) => {
        sfx.playCoin();
        set((state) => ({
          profile: {
            ...state.profile,
            dinars: state.profile.dinars + amount,
          },
        }));
      },

      spendDinars: (amount) => {
        const currentDinars = get().profile.dinars;
        if (currentDinars < amount) return false;
        set((state) => ({
          profile: {
            ...state.profile,
            dinars: state.profile.dinars - amount,
          },
        }));
        return true;
      },

      useLifeline: (type) => {
        const count = get().profile.lifelines[type];
        if (count <= 0) return false;
        sfx.playTap();
        set((state) => ({
          profile: {
            ...state.profile,
            lifelines: {
              ...state.profile.lifelines,
              [type]: count - 1,
            },
          },
        }));
        return true;
      },

      buyLifeline: (type, cost) => {
        if (!get().spendDinars(cost)) return false;
        sfx.playCoin();
        set((state) => ({
          profile: {
            ...state.profile,
            lifelines: {
              ...state.profile.lifelines,
              [type]: state.profile.lifelines[type] + 1,
            },
          },
        }));
        return true;
      },

      toggleSound: () => {
        const nextState = !get().audio.soundEnabled;
        sfx.setMuted(!nextState);
        if (nextState) sfx.playTap();
        set((state) => ({
          audio: { ...state.audio, soundEnabled: nextState },
        }));
      },

      toggleMusic: () => {
        set((state) => ({
          audio: { ...state.audio, musicEnabled: !state.audio.musicEnabled },
        }));
      },

      toggleHaptics: () => {
        set((state) => ({
          audio: { ...state.audio, hapticsEnabled: !state.audio.hapticsEnabled },
        }));
      },

      recordQuestionAnswer: (isCorrect) => {
        set((state) => ({
          stats: {
            ...state.stats,
            questionsAnswered: state.stats.questionsAnswered + 1,
            correctAnswers: isCorrect ? state.stats.correctAnswers + 1 : state.stats.correctAnswers,
          },
        }));
      },

      recordSpeedScore: (score) => {
        set((state) => ({
          stats: {
            ...state.stats,
            bestSpeedScore: Math.max(state.stats.bestSpeedScore, score),
          },
        }));
      },

      unlockBadge: (badgeId) => {
        if (!get().unlockedBadges.includes(badgeId)) {
          sfx.playVictory();
          set((state) => ({
            unlockedBadges: [...state.unlockedBadges, badgeId],
          }));
        }
      },

      checkDailyStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const lastLogin = get().profile.lastLoginDate;
        if (lastLogin === today) {
          return { streakUpdated: false, bonusGranted: 0 };
        }

        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        let newStreak = 1;
        if (lastLogin === yesterday) {
          newStreak = get().profile.streakDays + 1;
        }

        const bonus = Math.min(newStreak * 25, 200);
        sfx.playCoin();
        set((state) => ({
          profile: {
            ...state.profile,
            streakDays: newStreak,
            lastLoginDate: today,
            dinars: state.profile.dinars + bonus,
          },
          stats: {
            ...state.stats,
            dailyStreakRecord: Math.max(state.stats.dailyStreakRecord, newStreak),
          },
        }));
        return { streakUpdated: true, bonusGranted: bonus };
      },

      exportSaveData: () => {
        const state = get();
        return JSON.stringify({
          profile: state.profile,
          stats: state.stats,
          unlockedBadges: state.unlockedBadges,
          savedAt: new Date().toISOString(),
        });
      },

      importSaveData: (jsonString) => {
        try {
          const parsed = JSON.parse(jsonString);
          if (parsed.profile && parsed.stats) {
            set({
              profile: parsed.profile,
              stats: parsed.stats,
              unlockedBadges: parsed.unlockedBadges || ['welcome_badge'],
            });
            sfx.playVictory();
            return true;
          }
        } catch {
          // parse failed
        }
        return false;
      },

      resetAllProgress: () => {
        set({
          profile: initialProfile,
          audio: initialAudio,
          stats: initialStats,
          unlockedBadges: ['welcome_badge'],
        });
      },
    }),
    {
      name: 'dbara_game_save_v1',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
