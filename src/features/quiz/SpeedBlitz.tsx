import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Stage } from '../../types/map';
import { speedBlitzQuestionsPool } from '../../data/questions/speedBlitz';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { useCountdown } from '../../hooks/useCountdown';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { Timer, ArrowRight, Zap, Check, X, Trophy, Star, Share2 } from 'lucide-react';
import { ShareResultModal } from '../../components/ShareResultModal';

interface SpeedBlitzProps {
  stage: Stage;
  cityId: string;
  onFinish: () => void;
  /** Fired once when the round settles, so hosts can record completion. */
  onSettled?: (score: number) => void;
}

export const SpeedBlitz: React.FC<SpeedBlitzProps> = ({ stage, cityId, onFinish, onSettled }) => {
  const { profile, addDinars, recordSpeedScore } = useGameStore();
  const { completeStage } = useMapStore();

  // Pick 10 randomized non-repeating questions per blitz round
  const roundQuestions = useMemo(() => {
    const pool = [...speedBlitzQuestionsPool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 10);
  }, []);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  // The round can end from two directions at once — the clock running out and
  // the last question being answered. Settling rewards twice would double-pay
  // dinars and re-run completeStage, so the payout is latched.
  const isSettledRef = useRef<boolean>(false);
  const scoreRef = useRef<number>(0);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  const handleGameOver = useCallback(() => {
    if (isSettledRef.current) return;
    isSettledRef.current = true;

    const finalScore = scoreRef.current;
    setIsFinished(true);
    recordSpeedScore(finalScore);
    sfx.playVictory();

    const stars = finalScore >= 6 ? 3 : finalScore >= 3 ? 2 : 1;
    addDinars(finalScore * 15 + stage.rewardDinars);
    completeStage(cityId, stage.id, stars);
    onSettled?.(finalScore);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
    });
  }, [addDinars, cityId, completeStage, recordSpeedScore, stage.id, stage.rewardDinars, onSettled]);

  const { timeLeft, addTime } = useCountdown({
    initialSeconds: 45,
    running: !isFinished,
    onExpire: handleGameOver,
  });

  const handleAnswer = (userChoice: boolean) => {
    // `feedback` also gates input: without it the same statement could be
    // answered repeatedly during the 280ms reveal window and farm both score
    // and bonus time.
    if (isFinished || feedback !== null) return;

    const isCorrect = userChoice === roundQuestions[currentIdx].isCorrect;

    if (isCorrect) {
      sfx.playCorrect();
      setScore((s) => s + 1);
      addTime(3); // Bonus time
      setFeedback('correct');
    } else {
      sfx.playWrong();
      addTime(-Math.min(4, timeLeft - 1)); // Penalty, never below one second
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 >= roundQuestions.length) {
        handleGameOver();
      } else {
        setCurrentIdx((idx) => idx + 1);
      }
    }, 280);
  };

  // Tension ticks over the closing seconds.
  useEffect(() => {
    if (!isFinished && timeLeft > 0 && timeLeft <= 5) sfx.playTick();
  }, [timeLeft, isFinished]);

  const currentQ = roundQuestions[currentIdx];

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2 select-none">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-white bg-night-800 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>انسحاب</span>
        </button>

        <div className="flex items-center gap-1 text-gold-300 font-extrabold text-sm bg-night-700 px-3 py-1.5 rounded-2xl border border-gold-400/30">
          <Zap className="w-4 h-4 text-gold-400" />
          <span>النقاط: {score}</span>
        </div>

        <div className="flex items-center gap-1 text-crimson-500 font-black text-sm bg-night-700 px-3 py-1.5 rounded-2xl border border-crimson-500/30">
          <Timer className="w-4 h-4" />
          <span>{timeLeft} ثانية</span>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-gold-400 to-oasis-500 h-full transition-all duration-300"
          style={{ width: `${((currentIdx + 1) / roundQuestions.length) * 100}%` }}
        />
      </div>

      {/* Speed Statement Card */}
      <motion.div
        key={currentQ.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-panel p-6 rounded-3xl text-center min-h-[170px] flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
          feedback === 'correct'
            ? 'bg-oasis-500/25 border-oasis-500'
            : feedback === 'wrong'
            ? 'bg-crimson-500/25 border-crimson-500'
            : ''
        }`}
      >
        <span className="text-xs font-bold text-sea-300 mb-2">
          سؤال {currentIdx + 1} من {roundQuestions.length}
        </span>
        <h2 className="text-lg sm:text-xl font-black text-ink-100 leading-relaxed">
          "{currentQ.statement}"
        </h2>
      </motion.div>

      {/* True / False Big Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <button
          onClick={() => handleAnswer(true)}
          disabled={isFinished || feedback !== null}
          className="py-5 rounded-3xl bg-gradient-to-b from-oasis-500 to-oasis-600 text-white font-black text-xl flex items-center justify-center gap-2 shadow-oasis-glow transition-transform active:scale-95 disabled:opacity-70"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>صح</span>
        </button>

        <button
          onClick={() => handleAnswer(false)}
          disabled={isFinished || feedback !== null}
          className="py-5 rounded-3xl bg-gradient-to-b from-crimson-500 to-crimson-700 text-white font-black text-xl flex items-center justify-center gap-2 shadow-crimson-glow transition-transform active:scale-95 disabled:opacity-70"
        >
          <X className="w-6 h-6 stroke-[3]" />
          <span>خطأ</span>
        </button>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {isFinished && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-gradient-to-b from-night-800 to-night-900 border border-gold-400/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-gold-400/20 border-2 border-gold-400 flex items-center justify-center mx-auto mb-3 text-gold-300">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">انتهى سباق السرعة! ⏱️</h3>
              <p className="text-xs text-ink-400 mt-1">حققت {score} إجابات صحيحة من {roundQuestions.length}</p>

              <div className="flex items-center justify-center gap-1.5 my-3">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${
                      (score >= 6 ? 3 : score >= 3 ? 2 : 1) >= s
                        ? 'text-gold-400 fill-gold-400'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="p-2.5 rounded-2xl bg-gold-400/10 border border-gold-400/20 text-gold-300 font-extrabold text-xs mb-4">
                +{score * 15 + stage.rewardDinars} دينار ليبي مكافأة 💰
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full py-3 rounded-2xl bg-sea-500 hover:bg-sea-700 text-night-900 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة رقم السرعة 🏅</span>
                </button>

                <button
                  onClick={onFinish}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-gold-400 to-flame text-night-900 font-black text-sm shadow-lg"
                >
                  العودة للخريطة 🗺️
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ShareResultModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title="إنجاز سباق السرعة والتحدي"
        subtitle={`حقق ${score} إجابات صحيحة في 45 ثانية`}
        playerName={profile.name}
        playerAvatar={profile.avatar}
        playerTitle={profile.title}
        scoreOrStars={{
          score,
          dinarsEarned: score * 15 + stage.rewardDinars,
          streakDays: profile.streakDays,
        }}
        contextType="blitz"
      />
    </div>
  );
};
