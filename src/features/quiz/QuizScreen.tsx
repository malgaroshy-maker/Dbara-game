import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TriviaQuestion } from '../../types/quiz';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { useCountdown } from '../../hooks/useCountdown';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { reportLink } from '../../data/credits';
import {
  Flag,
  BookOpen,
  Sparkles,
  Clock,
  HelpCircle, 
  FastForward, 
  PlusCircle, 
  Lightbulb, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  ArrowRight,
  Star,
  Share2
} from 'lucide-react';
import { ShareResultModal } from '../../components/ShareResultModal';

interface QuizScreenProps {
  stage: Stage;
  cityId: string;
  question: TriviaQuestion;
  onFinish: () => void;
  /** Reports how the question went, once, so round hosts can tally a score. */
  onResolved?: (result: { isCorrect: boolean; stars: number }) => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({
  stage,
  cityId,
  question,
  onFinish,
  onResolved,
}) => {
  const { profile, useLifeline, spendDinars, addDinars, recordQuestionAnswer } = useGameStore();
  const { completeStage } = useMapStore();

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [wasSkipped, setWasSkipped] = useState<boolean>(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [showFactModal, setShowFactModal] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [isVictoryModal, setIsVictoryModal] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isHintShown, setIsHintShown] = useState<boolean>(false);

  // Dynamically shuffle options on question load (Fisher-Yates Shuffle)
  const shuffledOptions = useMemo(() => {
    const opts = question.options.map((text, originalIndex) => ({ text, originalIndex }));
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    return opts;
  }, [question]);

  const handleTimeOut = useCallback(() => {
    setIsAnswered(true);
    sfx.playWrong();
    recordQuestionAnswer(false, question.id);
    onResolved?.({ isCorrect: false, stars: 0 });
    setShowFactModal(true);
  }, [recordQuestionAnswer, onResolved, question.id]);

  const handleTick = useCallback((secondsLeft: number) => {
    if (secondsLeft <= 4) sfx.playTick();
  }, []);

  const { timeLeft, addTime } = useCountdown({
    initialSeconds: 25,
    running: !isAnswered,
    onExpire: handleTimeOut,
    onTick: handleTick,
  });

  const handleSelectOption = (visualIndex: number) => {
    if (isAnswered || disabledOptions.includes(visualIndex)) return;
    setSelectedOption(visualIndex);
    setIsAnswered(true);

    const isCorrect = shuffledOptions[visualIndex].originalIndex === question.correctIndex;
    recordQuestionAnswer(isCorrect, question.id);

    if (isCorrect) {
      sfx.playCorrect();
      // Calculate stars based on speed
      // Three stars means answering quickly, not merely answering. The old
      // thresholds handed three stars to anyone who replied within ten seconds
      // of a twenty-five second timer, which was almost everyone.
      let stars = 1;
      if (timeLeft >= 19) stars = 3;
      else if (timeLeft >= 12) stars = 2;

      setEarnedStars(stars);
      addDinars(stage.rewardDinars);

      // Trigger Golden Confetti
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#E5A93B', '#FCD34D', '#0EA5E9', '#10B981'],
      });
    } else {
      sfx.playWrong();
      setEarnedStars(0);
    }

    onResolved?.({ isCorrect, stars: isCorrect ? (timeLeft >= 19 ? 3 : timeLeft >= 12 ? 2 : 1) : 0 });
    setShowFactModal(true);
  };

  // Lifelines Actions
  const handleFiftyFifty = () => {
    if (isAnswered || disabledOptions.length > 0) return;
    if (profile.lifelines.fiftyFifty > 0) {
      useLifeline('fiftyFifty');
    } else {
      if (!spendDinars(60)) return;
    }

    // Eliminate 2 wrong answers from visual shuffled array
    const wrongVisualIndices = shuffledOptions
      .map((item, idx) => ({ idx, isWrong: item.originalIndex !== question.correctIndex }))
      .filter((item) => item.isWrong)
      .map((item) => item.idx);

    const toDisable = wrongVisualIndices.slice(0, 2);
    setDisabledOptions(toDisable);
    sfx.playTap();
  };

  const handleExtraTime = () => {
    if (isAnswered) return;
    if (profile.lifelines.extraTime > 0) {
      useLifeline('extraTime');
    } else {
      if (!spendDinars(80)) return;
    }
    addTime(15);
    sfx.playTap();
  };

  /**
   * Buys the question's hint.
   *
   * Priced under the 50:50 because it is weaker: it narrows the thinking rather
   * than the options, and a player who does not know the subject still has to
   * choose. Only offered where a hint has actually been written.
   */
  const HINT_COST = 30;
  const handleHint = () => {
    if (isAnswered || isHintShown || !question.hint) return;
    if (!spendDinars(HINT_COST)) return;
    setIsHintShown(true);
    sfx.playTap();
  };

  const handleSkip = () => {
    if (isAnswered) return;
    if (profile.lifelines.skip > 0) {
      useLifeline('skip');
    } else {
      if (!spendDinars(120)) return;
    }

    // A skip clears the stage but only at one star, and never counts as an
    // answer the player got right — otherwise it would be the cheapest and
    // most accuracy-inflating way to farm a perfect run.
    setIsAnswered(true);
    setWasSkipped(true);
    setEarnedStars(1);
    sfx.playTap();
    onResolved?.({ isCorrect: false, stars: 1 });
    setShowFactModal(true);
  };

  /**
   * Whether the player earned the answer, as opposed to skipping to it.
   *
   * The fun fact is a reward for getting there, so a wrong answer is told what
   * the right one was and nothing more — the fact is still waiting the next
   * time the question comes round.
   */
  const answeredCorrectly =
    selectedOption !== null &&
    shuffledOptions[selectedOption]?.originalIndex === question.correctIndex;

  const handleFactContinue = () => {
    setShowFactModal(false);
    const isPlayerCorrect =
      wasSkipped ||
      (selectedOption !== null &&
        shuffledOptions[selectedOption]?.originalIndex === question.correctIndex);

    if (isPlayerCorrect) {
      completeStage(cityId, stage.id, earnedStars);
      setIsVictoryModal(true);
    } else {
      onFinish();
    }
  };

  const optionLabels = ['أ', 'ب', 'ج', 'د'];

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2">
      {/* Top Header with Back & Stage Info */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="flex items-center gap-1 text-xs font-bold text-ink-400 hover:text-white bg-night-800 px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للخريطة</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-sea-500">المرحلة {stage.stageNumber}</span>
          <h3 className="text-sm font-extrabold text-white">{stage.title}</h3>
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-black text-xs border ${
            timeLeft <= 5
              ? 'bg-crimson-500/20 text-crimson-500 border-crimson-500/40 animate-pulse'
              : 'bg-night-700 text-gold-300 border-gold-400/30'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{timeLeft} ثانية</span>
        </div>
      </div>

      {/* Main Question Frosted Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-5 rounded-3xl relative overflow-hidden"
      >
        {/* Subtle Gold Corner Accents */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-gold-400/20 to-transparent pointer-events-none rounded-tr-3xl" />

        <div className="flex items-center gap-1.5 text-xs text-gold-400 font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>سؤال التحدي الثقافي:</span>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-ink-100 leading-relaxed text-right">
          {question.question}
        </h2>
      </motion.div>

      {/* 4 Shuffled Answer Options */}
      <div className="space-y-3">
        {shuffledOptions.map((opt, visualIdx) => {
          const isSelected = selectedOption === visualIdx;
          const isCorrect = opt.originalIndex === question.correctIndex;
          const isDisabled = disabledOptions.includes(visualIdx);

          let optionStyle = 'glass-card-interactive border-white/10 text-ink-100';

          if (isAnswered) {
            if (isCorrect) {
              optionStyle = 'bg-oasis-500/25 border-oasis-500 text-oasis-200 shadow-oasis-glow';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-crimson-500/25 border-crimson-500 text-crimson-200';
            } else {
              optionStyle = 'opacity-40 border-white/5';
            }
          } else if (isDisabled) {
            optionStyle = 'opacity-25 pointer-events-none line-through border-white/5';
          }

          return (
            <motion.button
              key={visualIdx}
              whileTap={!isAnswered && !isDisabled ? { scale: 0.98 } : {}}
              disabled={isAnswered || isDisabled}
              onClick={() => handleSelectOption(visualIdx)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between text-right transition-all font-bold ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-gold-400/15 text-gold-300 border border-gold-400/30 flex items-center justify-center text-xs font-black shrink-0">
                  {optionLabels[visualIdx]}
                </span>
                <span className="text-sm sm:text-base leading-snug">{opt.text}</span>
              </div>

              {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-oasis-500 shrink-0" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-crimson-500 shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* The bought hint, shown in place rather than in a modal so it stays
          readable next to the options it is meant to narrow. */}
      {isHintShown && question.hint && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2 p-3 rounded-2xl bg-sea-500/10 border border-sea-500/30 text-right"
        >
          <Lightbulb className="w-4 h-4 text-sea-300 shrink-0 mt-0.5" />
          <p className="text-xs text-ink-100 leading-relaxed">{question.hint}</p>
        </motion.div>
      )}

      {/* Bottom Lifelines Bar */}
      <div className="glass-card p-3 rounded-2xl flex items-center justify-around gap-2 mt-2">
        <button
          onClick={handleFiftyFifty}
          disabled={isAnswered || disabledOptions.length > 0}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-ink-400 hover:text-gold-300 disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-night-700 border border-gold-400/20 text-gold-300">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span>50:50 ({profile.lifelines.fiftyFifty})</span>
        </button>

        <button
          onClick={handleExtraTime}
          disabled={isAnswered}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-ink-400 hover:text-sea-300 disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-night-700 border border-sea-500/20 text-sea-300">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>+15 ثانية ({profile.lifelines.extraTime})</span>
        </button>

        {question.hint && (
          <button
            onClick={handleHint}
            disabled={isAnswered || isHintShown || profile.dinars < HINT_COST}
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-ink-400 hover:text-sea-300 disabled:opacity-30"
          >
            <div className="p-2 rounded-xl bg-night-700 border border-sea-500/20 text-sea-300">
              <Lightbulb className="w-4 h-4" />
            </div>
            <span>{isHintShown ? 'ظهر التلميح' : `تلميح (${HINT_COST})`}</span>
          </button>
        )}

        <button
          onClick={handleSkip}
          disabled={isAnswered}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-ink-400 hover:text-oasis-500 disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-night-700 border border-oasis-500/20 text-oasis-500">
            <FastForward className="w-4 h-4" />
          </div>
          <span>تخطي ({profile.lifelines.skip})</span>
        </button>
      </div>

      {/* "معلومة ع الماشي" Educational Fact Card Modal */}
      <AnimatePresence>
        {showFactModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-gradient-to-b from-night-700 to-night-900 border border-gold-400/40 rounded-3xl p-5 shadow-2xl text-center"
            >
              <div
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 ${
                  answeredCorrectly
                    ? 'bg-gold-400/20 border-gold-400/50 text-gold-300'
                    : 'bg-sea-500/15 border-sea-500/40 text-sea-300'
                }`}
              >
                {answeredCorrectly ? <Lightbulb className="w-6 h-6" /> : <BookOpen className="w-6 h-6" />}
              </div>

              {answeredCorrectly ? (
                <>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-gold-400/20 text-gold-300 border border-gold-400/30">
                    💡 معلومة ع الماشي
                  </span>

                  <p className="text-sm text-ink-100 leading-relaxed my-4 text-right bg-night-850/70 p-4 rounded-2xl border border-white/5">
                    {question.funFact}
                  </p>
                </>
              ) : (
                <>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-sea-500/15 text-sea-300 border border-sea-500/30">
                    الإجابة الصحيحة
                  </span>

                  <p className="text-base font-extrabold text-ink-100 leading-relaxed my-4 bg-night-850/70 p-4 rounded-2xl border border-white/5">
                    {question.options[question.correctIndex]}
                  </p>

                  {/* The fact is the prize for getting there, so it is held back
                      rather than handed over — and it gives the question
                      something left to offer when it comes round again. */}
                  <p className="text-[11px] text-ink-400 -mt-2 mb-3">
                    المعلومة تنتظرك حين تصيبها 💡
                  </p>
                </>
              )}

              <button
                onClick={handleFactContinue}
                className={`w-full py-3.5 rounded-2xl font-black text-sm shadow-lg transition-transform active:scale-95 ${
                  answeredCorrectly
                    ? 'bg-gradient-to-r from-gold-400 to-flame text-night-900'
                    : 'bg-night-700 border border-white/15 text-ink-100'
                }`}
              >
                {answeredCorrectly ? 'استمر في الرحلة 🧭' : 'التالي'}
              </button>

              {/* The moment a player knows an answer is wrong is the moment they
                  have just read it, so the report carries this question's id and
                  they never have to describe which one they meant. */}
              <a
                href={reportLink(question.id)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center justify-center gap-1 text-[11px] text-ink-400 hover:text-gold-300 transition-colors"
              >
                <Flag className="w-3 h-3" />
                <span>تشك في هذه المعلومة؟ بلّغنا</span>
              </a>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Victory Celebration Modal */}
      <AnimatePresence>
        {isVictoryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-sm bg-gradient-to-b from-night-800 to-night-900 border border-oasis-500/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-oasis-500/20 border-2 border-oasis-500 flex items-center justify-center mx-auto mb-3 text-oasis-500 shadow-oasis-glow">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">
                {wasSkipped ? 'تجاوزت المرحلة! ✨' : 'أحسنت يا بطل! 🎉'}
              </h3>
              <p className="text-xs text-ink-400 mt-1">
                {wasSkipped
                  ? 'استخدمت مساعدة التخطي واجتزت المرحلة بنجمة واحدة'
                  : 'أجبت بشكل صحيح واجتزت المرحلة بنجاح'}
              </p>

              {/* 3 Stars Rating */}
              <div className="flex items-center justify-center gap-2 my-4">
                {[1, 2, 3].map((starNum) => (
                  <Star
                    key={starNum}
                    className={`w-7 h-7 ${
                      earnedStars >= starNum
                        ? 'text-gold-400 fill-gold-400 drop-shadow-gold-glow-sm'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-gold-400/10 border border-gold-400/20 text-gold-300 font-extrabold text-sm mb-4">
                {wasSkipped
                  ? 'لا توجد مكافأة دنانير عند التخطي 🎟️'
                  : `+${stage.rewardDinars} دينار ليبي مكافأة 💰`}
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="w-full py-3 rounded-2xl bg-sea-500 hover:bg-sea-700 text-night-900 font-black text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>مشاركة الإنجاز 🏅</span>
                </button>

                <button
                  onClick={onFinish}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-oasis-500 to-oasis-600 text-white font-black text-sm shadow-oasis-glow transition-transform active:scale-95"
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
        title={`اجتياز ${stage.title}`}
        subtitle={`محطة ${cityId === 'daily' ? 'التحدي اليومي' : cityId === 'quickplay' ? 'اللعب السريع' : 'خريطة ليبيا'}`}
        playerName={profile.name}
        playerAvatar={profile.avatar}
        playerTitle={profile.title}
        scoreOrStars={{
          stars: earnedStars,
          dinarsEarned: wasSkipped ? 0 : stage.rewardDinars,
          streakDays: profile.streakDays,
        }}
        contextType={cityId === 'daily' ? 'daily' : 'quiz'}
      />
    </div>
  );
};
