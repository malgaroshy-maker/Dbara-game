import React, { useState } from 'react';
import { dailyChallenges } from '../../data/puzzles/dailyPuzzles';
import { dialectQuestions } from '../../data/questions/dialects';
import { wordScramblePuzzles } from '../../data/puzzles/wordScramble';
import { useGameStore } from '../../store/useGameStore';
import { QuizScreen } from '../quiz/QuizScreen';
import { LetterScramble } from '../puzzles/LetterScramble';
import { Flame, Gift, Calendar, Sparkles, CheckCircle2, Play } from 'lucide-react';

export const DailyChallengeScreen: React.FC = () => {
  const { profile, checkDailyStreak } = useGameStore();
  const [activeChallenge, setActiveChallenge] = useState<typeof dailyChallenges[0] | null>(null);
  const [streakClaimed, setStreakClaimed] = useState<boolean>(false);

  const todayChallenge = dailyChallenges[0];

  const handleClaimStreak = () => {
    checkDailyStreak();
    setStreakClaimed(true);
  };

  if (activeChallenge) {
    if (activeChallenge.type === 'trivia') {
      const q = dialectQuestions.find((dq) => dq.id === activeChallenge.questionId) || dialectQuestions[0];
      return (
        <QuizScreen
          stage={{
            id: 'daily_stage',
            stageNumber: 1,
            title: activeChallenge.title,
            type: 'multiple_choice',
            starsEarned: 0,
            isUnlocked: true,
            rewardDinars: activeChallenge.rewardDinars,
          }}
          cityId="daily"
          question={q}
          onFinish={() => setActiveChallenge(null)}
        />
      );
    }

    if (activeChallenge.type === 'scramble') {
      const puzzle = wordScramblePuzzles.find((p) => p.id === activeChallenge.scrambleId) || wordScramblePuzzles[0];
      return (
        <LetterScramble
          stage={{
            id: 'daily_stage',
            stageNumber: 1,
            title: activeChallenge.title,
            type: 'letter_scramble',
            starsEarned: 0,
            isUnlocked: true,
            rewardDinars: activeChallenge.rewardDinars,
          }}
          cityId="daily"
          puzzle={puzzle}
          onFinish={() => setActiveChallenge(null)}
        />
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-1">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Flame className="w-5 h-5 text-[#F59E0B]" />
          تحدي اليوم وسلسلة الدخول
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          حافظ على سلسلة أيامك واكسب دنانير إضافية كل 24 ساعة
        </p>
      </div>

      {/* Daily Streak Card */}
      <div className="glass-panel p-5 rounded-3xl relative overflow-hidden text-center border-[#F59E0B]/30">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-3 rounded-2xl bg-[#F59E0B]/20 border border-[#F59E0B]/40 text-[#FCD34D]">
            <Flame className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <h3 className="text-2xl font-black text-white">{profile.streakDays} أيام متتالية!</h3>
        <p className="text-xs text-[#94A3B8] mt-1">
          كل يوم متتالي يضاعف مكافأتك اليومية بـ 25 ديناراً إضافية
        </p>

        {/* 7-Days Visual Streak Circles */}
        <div className="flex items-center justify-center gap-2 my-4">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isDone = profile.streakDays >= day;
            return (
              <div
                key={day}
                className={`w-9 h-9 rounded-xl flex flex-col items-center justify-center font-bold text-xs border transition-all ${
                  isDone
                    ? 'bg-[#F59E0B] border-[#FCD34D] text-[#0B0F19] shadow-[0_0_10px_#F59E0B]'
                    : 'bg-[#1E293B] border-white/10 text-[#64748B]'
                }`}
              >
                <span>يوم</span>
                <span className="text-[10px] leading-none">{day}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleClaimStreak}
          disabled={streakClaimed}
          className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-[#0B0F19] font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 disabled:opacity-50"
        >
          {streakClaimed ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>تم استلام مكافأة الدخول لليوم!</span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4" />
              <span>استلم مكافأة اليوم (+{profile.streakDays * 25} د.ل)</span>
            </>
          )}
        </button>
      </div>

      {/* Today's Special Challenge Banner */}
      <div className="glass-card-interactive p-5 rounded-3xl border border-[#E5A93B]/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#E5A93B]" />
            <span className="text-xs font-bold text-[#E5A93B]">لغز اليوم الحصري</span>
          </div>
          <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-[#10B981]/20 text-[#10B981] border border-[#10B981]/30">
            مكافأة x{todayChallenge.multiplier}
          </span>
        </div>

        <div>
          <h3 className="text-base font-extrabold text-white">{todayChallenge.title}</h3>
          <p className="text-xs text-[#CBD5E1] mt-1">{todayChallenge.description}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <div className="flex items-center gap-1.5 text-xs text-[#FCD34D] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>+{todayChallenge.rewardDinars} دينار ليبي</span>
          </div>

          <button
            onClick={() => setActiveChallenge(todayChallenge)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#E5A93B] text-[#0B0F19] font-black text-xs shadow-md transition-transform active:scale-95"
          >
            <span>ابدأ التحدي</span>
            <Play className="w-3.5 h-3.5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
