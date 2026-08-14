import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import type { GameMode } from '../../types/game';
import {
  Compass,
  Play,
  Zap,
  Flame,
  Trophy,
  Settings as SettingsIcon,
  Star,
  Coins,
  MapPin,
} from 'lucide-react';

interface MainMenuScreenProps {
  /** Enters the game on the given screen. */
  onPlay: (mode: GameMode) => void;
  onOpenSettings: () => void;
}

export const MainMenuScreen: React.FC<MainMenuScreenProps> = ({ onPlay, onOpenSettings }) => {
  const { profile, stats, unlockedBadges, isDailyChallengeAvailable } = useGameStore();
  const { cities } = useMapStore();

  const earnedStars = cities.reduce(
    (acc, c) => acc + c.stages.reduce((s, stage) => s + (stage.starsEarned || 0), 0),
    0
  );
  const unlockedCities = cities.filter(
    (c) => c.unlockedByDefault || c.stages.some((s) => s.isUnlocked)
  ).length;
  const hasProgress = earnedStars > 0;
  const dailyReady = isDailyChallengeAvailable();

  const enter = (mode: GameMode) => {
    sfx.playTap();
    onPlay(mode);
  };

  const modes: { mode: GameMode; label: string; hint: string; icon: React.ReactNode; accent: string }[] = [
    {
      mode: 'quickplay',
      label: 'لعب سريع',
      hint: 'جولة من 5 أسئلة في مجالك المفضل',
      icon: <Zap className="w-5 h-5" />,
      accent: 'text-[#38BDF8] border-[#0EA5E9]/40',
    },
    {
      mode: 'daily',
      label: 'تحدي اليوم',
      hint: dailyReady ? 'لغز اليوم بانتظارك' : 'تم إنجاز تحدي اليوم',
      icon: <Flame className="w-5 h-5" />,
      accent: 'text-[#FCD34D] border-[#F59E0B]/40',
    },
    {
      mode: 'badges',
      label: 'الأوسمة ولوحة الشرف',
      hint: `${unlockedBadges.length} وسام • المتجر والتصنيف`,
      icon: <Trophy className="w-5 h-5" />,
      accent: 'text-[#A78BFA] border-[#A855F7]/40',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8 max-w-lg mx-auto w-full select-none">
      {/* Emblem & title */}
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
        className="text-center"
      >
        <div className="relative mx-auto w-24 h-24 rounded-[2rem] bg-gradient-to-br from-[#FCD34D] via-[#E5A93B] to-[#B45309] flex items-center justify-center shadow-[0_0_45px_rgba(229,169,59,0.45)]">
          <Compass className="w-12 h-12 text-[#0B0F19]" strokeWidth={2.2} />
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-[2rem] border-2 border-[#FCD34D]/50"
            animate={{ scale: [1, 1.18, 1], opacity: [0.55, 0, 0.55] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: 'easeOut' }}
          />
        </div>

        <h1 className="mt-5 text-5xl font-black gold-gradient-text leading-tight">دبارة</h1>
        <p className="text-sm font-bold text-[#CBD5E1] mt-1">لغز ومعرفة ليبية</p>
        <p className="text-xs text-[#94A3B8] mt-2 leading-relaxed">
          سافر عبر مدن ليبيا ومعالمها، واجمع النجوم والدنانير
        </p>
      </motion.div>

      {/* Progress strip — only once there is progress worth showing. */}
      {hasProgress && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="mt-6 w-full glass-card rounded-2xl px-4 py-3 grid grid-cols-3 gap-2 text-center"
        >
          <div>
            <div className="flex items-center justify-center gap-1 text-[#FCD34D] font-black text-sm">
              <Star className="w-3.5 h-3.5 fill-current" />
              {earnedStars}
            </div>
            <span className="text-[10px] text-[#94A3B8]">نجوم</span>
          </div>
          <div className="border-x border-white/10">
            <div className="flex items-center justify-center gap-1 text-[#38BDF8] font-black text-sm">
              <MapPin className="w-3.5 h-3.5" />
              {unlockedCities}/{cities.length}
            </div>
            <span className="text-[10px] text-[#94A3B8]">مدن مفتوحة</span>
          </div>
          <div>
            <div className="flex items-center justify-center gap-1 text-[#E5A93B] font-black text-sm">
              <Coins className="w-3.5 h-3.5" />
              {profile.dinars}
            </div>
            <span className="text-[10px] text-[#94A3B8]">دينار</span>
          </div>
        </motion.div>
      )}

      {/* Primary action */}
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => enter('map')}
        className="mt-6 w-full py-4 rounded-3xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] font-black text-base shadow-[0_0_30px_rgba(229,169,59,0.4)] flex items-center justify-center gap-2"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>{hasProgress ? 'واصل الرحلة' : 'ابدأ الرحلة'}</span>
      </motion.button>

      {/* Secondary modes */}
      <div className="mt-3 w-full space-y-2.5">
        {modes.map(({ mode, label, hint, icon, accent }, i) => (
          <motion.button
            key={mode}
            type="button"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => enter(mode)}
            className={`w-full text-right glass-card-interactive rounded-2xl px-4 py-3 flex items-center gap-3 border ${accent}`}
          >
            <span className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              {icon}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-black text-white">{label}</span>
              <span className="block text-[11px] text-[#94A3B8] truncate">{hint}</span>
            </span>
            {mode === 'daily' && dailyReady && (
              <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#10B981]" />
            )}
          </motion.button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          sfx.playTap();
          onOpenSettings();
        }}
        className="mt-5 flex items-center gap-1.5 text-xs font-bold text-[#94A3B8] hover:text-white transition-colors"
      >
        <SettingsIcon className="w-4 h-4" />
        <span>الإعدادات والنسخ الاحتياطي</span>
      </button>

      <p className="mt-4 text-[10px] text-[#64748B]">
        {stats.questionsAnswered > 0
          ? `أجبت على ${stats.questionsAnswered} سؤالاً حتى الآن`
          : 'كل رحلة تبدأ بخطوة'}
      </p>
    </div>
  );
};
