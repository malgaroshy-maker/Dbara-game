import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { PlayerProfile, AudioSettings, GameStats, GameMode } from '../types/game';
import { badgesList } from '../data/badges';
import { competitiveScore, rankForScore } from '../data/ranks';
import { sfx } from '../audio/soundEffects';

interface GameState {
  currentMode: GameMode;
  profile: PlayerProfile;
  audio: AudioSettings;
  stats: GameStats;
  unlockedBadges: string[];
  activeCategory: string | null;
  /** Local date the daily challenge was last completed, or null. */
  dailyChallengeCompletedDate: string | null;

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
  /**
   * `questionId` is optional so callers that have no single question to name
   * (the speed round) still record the tally.
   */
  recordQuestionAnswer: (isCorrect: boolean, questionId?: string) => void;
  /** Ids the player has been shown, so a round can prefer fresh questions. */
  seenQuestionIds: string[];
  /** Ids answered wrong and not yet re-answered correctly. */
  missedQuestionIds: string[];
  clearQuestionHistory: () => void;
  recordSpeedScore: (score: number) => void;
  unlockBadge: (badgeId: string) => void;
  checkBadgeUnlocks: (totalStars: number) => string[];
  claimDailyStreak: () => { streakUpdated: boolean; bonusGranted: number };
  isDailyRewardAvailable: () => boolean;
  completeDailyChallenge: () => void;
  isDailyChallengeAvailable: () => boolean;
  refreshRank: (totalStars: number) => void;
  hasOnboarded: boolean;
  completeOnboarding: (identity: { name: string; avatar: string }) => void;
  resetAllProgress: () => void;
}

/**
 * Today's date as YYYY-MM-DD in the player's own timezone.
 *
 * `toISOString()` would give the UTC date, which rolls over at 02:00 local
 * time in Libya — so the daily reward and the daily challenge would reset in
 * the small hours of the wrong day.
 */
export const todayKey = (date: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

/** Yesterday's local date key, for streak continuity checks. */
export const yesterdayKey = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return todayKey(d);
};

const initialProfile: PlayerProfile = {
  name: 'مستكشف دبارة',
  avatar: '🧭',
  title: 'مستكشف مبتدئ',
  dinars: 150, // Starting bonus
  totalStars: 0,
  streakDays: 1,
  // Empty rather than today's date so a brand new player can claim day one.
  lastLoginDate: '',
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
      dailyChallengeCompletedDate: null,
      hasOnboarded: false,
      seenQuestionIds: [],
      missedQuestionIds: [],

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
        const nextState = !get().audio.hapticsEnabled;
        sfx.setHapticsEnabled(nextState);
        sfx.playTap();
        set((state) => ({
          audio: { ...state.audio, hapticsEnabled: nextState },
        }));
      },

      recordQuestionAnswer: (isCorrect, questionId) => {
        set((state) => {
          const stats = {
            ...state.stats,
            questionsAnswered: state.stats.questionsAnswered + 1,
            correctAnswers: isCorrect ? state.stats.correctAnswers + 1 : state.stats.correctAnswers,
          };
          if (!questionId) return { stats };

          const seen = state.seenQuestionIds.includes(questionId)
            ? state.seenQuestionIds
            : [...state.seenQuestionIds, questionId];

          // A question leaves the missed list only by being answered right,
          // so practice actually clears it rather than merely re-showing it.
          const missed = isCorrect
            ? state.missedQuestionIds.filter((id) => id !== questionId)
            : state.missedQuestionIds.includes(questionId)
              ? state.missedQuestionIds
              : [...state.missedQuestionIds, questionId];

          return { stats, seenQuestionIds: seen, missedQuestionIds: missed };
        });
      },

      clearQuestionHistory: () => set({ seenQuestionIds: [], missedQuestionIds: [] }),

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
          const badge = badgesList.find((b) => b.id === badgeId);
          sfx.playVictory();
          set((state) => ({
            unlockedBadges: [...state.unlockedBadges, badgeId],
            profile: {
              ...state.profile,
              dinars: state.profile.dinars + (badge?.rewardDinars || 50),
            },
          }));
        }
      },

      checkBadgeUnlocks: (totalStars: number) => {
        const state = get();
        const newlyUnlocked: string[] = [];

        // Check Grand Jahbadh (20+ stars)
        if (totalStars >= 20 && !state.unlockedBadges.includes('grand_jahbadh')) {
          newlyUnlocked.push('grand_jahbadh');
        }

        // Check Streak Warrior (7+ days)
        if (state.profile.streakDays >= 7 && !state.unlockedBadges.includes('streak_warrior')) {
          newlyUnlocked.push('streak_warrior');
        }

        // Check Dialect Expert (15+ questions answered)
        if (state.stats.correctAnswers >= 15 && !state.unlockedBadges.includes('dialect_expert')) {
          newlyUnlocked.push('dialect_expert');
        }

        newlyUnlocked.forEach((bId) => state.unlockBadge(bId));
        return newlyUnlocked;
      },

      isDailyRewardAvailable: () => get().profile.lastLoginDate !== todayKey(),

      isDailyChallengeAvailable: () => get().dailyChallengeCompletedDate !== todayKey(),

      /**
       * Records the name and avatar the player chose on first run. The profile
       * name used to be a hard-coded placeholder with no way to change it, even
       * though it appears in the header, the duel and every shared card.
       */
      completeOnboarding: ({ name, avatar }) =>
        set((state) => ({
          hasOnboarded: true,
          profile: {
            ...state.profile,
            name: name.trim() || state.profile.name,
            avatar: avatar || state.profile.avatar,
          },
        })),

      /**
       * Advances the displayed rank to match what the player has actually
       * earned. Without this the title was frozen at sign-up forever, so the
       * header, share card and leaderboard all showed a rank that never moved.
       */
      refreshRank: (totalStars) => {
        const state = get();
        const rank = rankForScore(
          competitiveScore({
            totalStars,
            correctAnswers: state.stats.correctAnswers,
            streakDays: state.profile.streakDays,
          })
        );
        if (state.profile.title === rank.title) return;
        set({ profile: { ...state.profile, title: rank.title } });
      },

      /**
       * Marks today's challenge as done so it pays out once. Without this the
       * challenge could be replayed indefinitely, minting dinars every run.
       */
      completeDailyChallenge: () => set({ dailyChallengeCompletedDate: todayKey() }),

      claimDailyStreak: () => {
        const today = todayKey();
        const lastLogin = get().profile.lastLoginDate;
        if (lastLogin === today) {
          return { streakUpdated: false, bonusGranted: 0 };
        }

        const yesterday = yesterdayKey();
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

      // Backup/restore lives in SettingsModal, which is the only caller and the
      // only place that also knows about map progress. Two partial
      // implementations of the same save format was one too many.

      resetAllProgress: () => {
        set({
          profile: initialProfile,
          audio: initialAudio,
          stats: initialStats,
          unlockedBadges: ['welcome_badge'],
          dailyChallengeCompletedDate: null,
          hasOnboarded: false,
          seenQuestionIds: [],
          missedQuestionIds: [],
        });
      },
    }),
    {
      name: 'dbara_game_save_v1',
      storage: createJSONStorage(() => localStorage),
      // `currentMode` and `activeCategory` are view state, not progress — leaving
      // them out keeps a reload landing on the map instead of a half-open screen.
      partialize: (state) => ({
        profile: state.profile,
        audio: state.audio,
        stats: state.stats,
        unlockedBadges: state.unlockedBadges,
        dailyChallengeCompletedDate: state.dailyChallengeCompletedDate,
        hasOnboarded: state.hasOnboarded,
        // Shaped to sync to a server later without a rebuild, per PRODUCT.md.
        seenQuestionIds: state.seenQuestionIds,
        missedQuestionIds: state.missedQuestionIds,
      }),
      onRehydrateStorage: () => (state) => {
        // The sound engine is a plain singleton; without this the saved mute and
        // haptics preferences are shown in the UI but never actually applied.
        if (!state) return;
        try {
          const sound = state.audio?.soundEnabled ?? true;
          const haptics = state.audio?.hapticsEnabled ?? true;
          sfx.setMuted(!sound);
          sfx.setHapticsEnabled(haptics);
        } catch {
          // ignore
        }
      },
    }
  )
);
