import React from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import {
  competitiveScore,
  rankForScore,
  nextRankAfter,
  explorerRanks,
} from '../../data/ranks';
import { Star, Zap, Flame, Target, MapPin, HelpCircle, Users, Lock } from 'lucide-react';

/**
 * The player's own standing.
 *
 * This used to be a table of seven invented rivals — fabricated names with
 * fabricated scores, presented as real competitors. Cross-player ranking needs
 * the server that is planned but does not exist yet, and inventing opponents in
 * the meantime is exactly what a heritage game should not do.
 *
 * Everything here is the player's real record, plus the one thing that was
 * genuinely missing: a ladder. The profile carried a rank title that was set at
 * sign-up and never advanced.
 */
export const LeaderboardTab: React.FC = () => {
  const { profile, stats } = useGameStore();
  const { cities, getTotalStars } = useMapStore();

  const totalStars = getTotalStars();
  const score = competitiveScore({
    totalStars,
    correctAnswers: stats.correctAnswers,
    streakDays: profile.streakDays,
  });
  const rank = rankForScore(score);
  const nextRank = nextRankAfter(score);
  const rankIndex = explorerRanks.findIndex((r) => r.id === rank.id);

  const progressToNext = nextRank
    ? Math.min(100, ((score - rank.minScore) / (nextRank.minScore - rank.minScore)) * 100)
    : 100;

  const accuracy =
    stats.questionsAnswered > 0
      ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100)
      : 0;
  const unlockedCities = cities.filter(
    (c) => c.unlockedByDefault || c.stages.some((s) => s.isUnlocked)
  ).length;

  const records: { label: string; value: string; icon: React.ReactNode; tone: string }[] = [
    {
      label: 'أفضل سباق سرعة',
      value: `${stats.bestSpeedScore} إجابة`,
      icon: <Zap className="w-4 h-4" />,
      tone: 'text-sea-300',
    },
    {
      label: 'أطول سلسلة أيام',
      value: `${stats.dailyStreakRecord} يوم`,
      icon: <Flame className="w-4 h-4" />,
      tone: 'text-flame',
    },
    {
      label: 'دقة الإجابة',
      value: stats.questionsAnswered > 0 ? `${accuracy}%` : '—',
      icon: <Target className="w-4 h-4" />,
      tone: 'text-oasis-500',
    },
    {
      label: 'أسئلة مُجابة',
      value: `${stats.questionsAnswered}`,
      icon: <HelpCircle className="w-4 h-4" />,
      tone: 'text-orchid-300',
    },
    {
      label: 'النجوم المكتسبة',
      value: `${totalStars}`,
      icon: <Star className="w-4 h-4 fill-current" />,
      tone: 'text-gold-300',
    },
    {
      label: 'مدن مفتوحة',
      value: `${unlockedCities} من ${cities.length}`,
      icon: <MapPin className="w-4 h-4" />,
      tone: 'text-gold-400',
    },
  ];

  return (
    <div className="space-y-3.5 select-none">
      {/* Current rank */}
      <div className="glass-panel p-4 rounded-3xl border border-gold-400/40 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-28 h-28 bg-gradient-to-br from-gold-400/20 to-transparent pointer-events-none rounded-tl-3xl" />

        <div className="flex items-center gap-3">
          <span className="w-14 h-14 rounded-2xl bg-gold-400/15 border border-gold-400/40 flex items-center justify-center text-3xl shrink-0 shadow-gold-glow-sm">
            {rank.icon}
          </span>
          <div className="min-w-0">
            <p className="text-[11px] text-ink-400 font-bold">رتبتك الحالية</p>
            <h3 className="text-lg font-black text-white truncate">{rank.title}</h3>
            <p className="text-[11px] text-gold-300 font-bold mt-0.5">{score} نقطة تنافسية</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-bold mb-1.5">
            <span className="text-ink-400">
              {nextRank ? `التالي: ${nextRank.title}` : 'بلغت أعلى رتبة'}
            </span>
            {nextRank && (
              <span className="text-gold-300">باقٍ {nextRank.minScore - score} نقطة</span>
            )}
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-300"
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* The formula, stated rather than hidden */}
      <p className="text-[11px] text-ink-400 text-center leading-relaxed px-2">
        تُحتسب النقطة التنافسية من نجومك (×35) وإجاباتك الصحيحة (×15) وسلسلة أيامك (×20)
      </p>

      {/* Personal records */}
      <div>
        <h4 className="text-xs font-bold text-ink-400 flex items-center gap-1.5 mb-2 px-1">
          <Star className="w-3.5 h-3.5 text-gold-400" />
          أرقامك القياسية
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {records.map((r) => (
            <div key={r.label} className="glass-card rounded-2xl px-3 py-2.5">
              <div className={`flex items-center gap-1.5 font-black text-sm ${r.tone}`}>
                {r.icon}
                <span>{r.value}</span>
              </div>
              <span className="text-[10px] text-ink-400 mt-0.5 block">{r.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* The ladder */}
      <div>
        <h4 className="text-xs font-bold text-ink-400 flex items-center gap-1.5 mb-2 px-1">
          <Users className="w-3.5 h-3.5 text-gold-400" />
          سلّم الرتب
        </h4>
        <div className="space-y-1.5">
          {explorerRanks.map((r, i) => {
            const reached = i <= rankIndex;
            const isCurrent = r.id === rank.id;
            return (
              <div
                key={r.id}
                className={`px-3 py-2 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                  isCurrent
                    ? 'glass-panel border-gold-400 shadow-gold-glow-sm bg-gold-400/10'
                    : reached
                    ? 'glass-card border-white/5'
                    : 'bg-night-900/50 border-white/5 opacity-55'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-lg shrink-0 ${reached ? '' : 'grayscale'}`}>{r.icon}</span>
                  <span
                    className={`text-xs font-black truncate ${
                      isCurrent ? 'text-gold-300' : reached ? 'text-white' : 'text-ink-500'
                    }`}
                  >
                    {r.title}
                  </span>
                </div>
                <span
                  className={`text-[11px] font-bold shrink-0 ${reached ? 'text-ink-400' : 'text-ink-500'}`}
                >
                  {r.minScore === 0 ? 'البداية' : `${r.minScore} نقطة`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Honest about what is not here yet */}
      <div className="glass-card rounded-2xl px-3.5 py-3 flex items-start gap-2.5 border border-white/5">
        <Lock className="w-4 h-4 text-ink-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-ink-400 leading-relaxed">
          المقارنة مع لاعبين آخرين تحتاج حساباً على الإنترنت، وهي غير متاحة بعد. كل ما تراه
          هنا هو سجلك أنت، محفوظ على جهازك.
        </p>
      </div>
    </div>
  );
};
