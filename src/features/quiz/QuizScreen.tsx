import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TriviaQuestion } from '../../types/quiz';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { 
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
  Star
} from 'lucide-react';

interface QuizScreenProps {
  stage: Stage;
  cityId: string;
  question: TriviaQuestion;
  onFinish: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ stage, cityId, question, onFinish }) => {
  const { profile, useLifeline, spendDinars, addDinars, recordQuestionAnswer } = useGameStore();
  const { completeStage } = useMapStore();

  const [timeLeft, setTimeLeft] = useState<number>(25);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [disabledOptions, setDisabledOptions] = useState<number[]>([]);
  const [showFactModal, setShowFactModal] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(0);
  const [isVictoryModal, setIsVictoryModal] = useState<boolean>(false);

  // Countdown timer
  useEffect(() => {
    if (isAnswered || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 4 && prev > 1) sfx.playTick();
        if (prev <= 1) {
          handleTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isAnswered, timeLeft]);

  const handleTimeOut = () => {
    setIsAnswered(true);
    sfx.playWrong();
    recordQuestionAnswer(false);
    setShowFactModal(true);
  };

  const handleSelectOption = (index: number) => {
    if (isAnswered || disabledOptions.includes(index)) return;
    setSelectedOption(index);
    setIsAnswered(true);

    const isCorrect = index === question.correctIndex;
    recordQuestionAnswer(isCorrect);

    if (isCorrect) {
      sfx.playCorrect();
      // Calculate stars based on speed
      let stars = 1;
      if (timeLeft >= 15) stars = 3;
      else if (timeLeft >= 8) stars = 2;

      setEarnedStars(stars);
      addDinars(question.rewardDinars);

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

    setShowFactModal(true);
  };

  // Lifelines Actions
  const handleFiftyFifty = () => {
    if (isAnswered || disabledOptions.length > 0) return;
    if (profile.lifelines.fiftyFifty > 0) {
      useLifeline('fiftyFifty');
    } else {
      if (!spendDinars(20)) return;
    }

    // Eliminate 2 wrong answers
    const wrongIndices = question.options
      .map((_, i) => i)
      .filter((i) => i !== question.correctIndex);
    const toDisable = wrongIndices.slice(0, 2);
    setDisabledOptions(toDisable);
    sfx.playTap();
  };

  const handleExtraTime = () => {
    if (isAnswered) return;
    if (profile.lifelines.extraTime > 0) {
      useLifeline('extraTime');
    } else {
      if (!spendDinars(25)) return;
    }
    setTimeLeft((prev) => prev + 15);
    sfx.playTap();
  };

  const handleSkip = () => {
    if (isAnswered) return;
    if (profile.lifelines.skip > 0) {
      useLifeline('skip');
    } else {
      if (!spendDinars(40)) return;
    }
    handleSelectOption(question.correctIndex);
  };

  const handleFactContinue = () => {
    setShowFactModal(false);
    if (selectedOption === question.correctIndex) {
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
          className="flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white bg-[#131C2E] px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>رجوع للخريطة</span>
        </button>

        <div className="text-center">
          <span className="text-xs font-semibold text-[#0EA5E9]">المرحلة {stage.stageNumber}</span>
          <h3 className="text-sm font-extrabold text-white">{stage.title}</h3>
        </div>

        {/* Timer Badge */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl font-black text-xs border ${
            timeLeft <= 5
              ? 'bg-[#F43F5E]/20 text-[#F43F5E] border-[#F43F5E]/40 animate-pulse'
              : 'bg-[#1E293B] text-[#FCD34D] border-[#E5A93B]/30'
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
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-[#E5A93B]/20 to-transparent pointer-events-none rounded-tr-3xl" />

        <div className="flex items-center gap-1.5 text-xs text-[#E5A93B] font-bold mb-2">
          <Sparkles className="w-3.5 h-3.5" />
          <span>سؤال التحدي الثقافي:</span>
        </div>

        <h2 className="text-lg sm:text-xl font-extrabold text-[#F8FAFC] leading-relaxed text-right">
          {question.question}
        </h2>
      </motion.div>

      {/* 4 Answer Options */}
      <div className="space-y-3">
        {question.options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          const isCorrect = idx === question.correctIndex;
          const isDisabled = disabledOptions.includes(idx);

          let optionStyle = 'glass-card-interactive border-white/10 text-[#F8FAFC]';

          if (isAnswered) {
            if (isCorrect) {
              optionStyle = 'bg-[#10B981]/25 border-[#10B981] text-[#A7F3D0] shadow-[0_0_20px_rgba(16,185,129,0.35)]';
            } else if (isSelected && !isCorrect) {
              optionStyle = 'bg-[#F43F5E]/25 border-[#F43F5E] text-[#FECDD3]';
            } else {
              optionStyle = 'opacity-40 border-white/5';
            }
          } else if (isDisabled) {
            optionStyle = 'opacity-25 pointer-events-none line-through border-white/5';
          }

          return (
            <motion.button
              key={idx}
              whileTap={!isAnswered && !isDisabled ? { scale: 0.98 } : {}}
              disabled={isAnswered || isDisabled}
              onClick={() => handleSelectOption(idx)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between text-right transition-all font-bold ${optionStyle}`}
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-[#E5A93B]/15 text-[#FCD34D] border border-[#E5A93B]/30 flex items-center justify-center text-xs font-black shrink-0">
                  {optionLabels[idx]}
                </span>
                <span className="text-sm sm:text-base leading-snug">{opt}</span>
              </div>

              {isAnswered && isCorrect && <CheckCircle className="w-5 h-5 text-[#10B981] shrink-0" />}
              {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-[#F43F5E] shrink-0" />}
            </motion.button>
          );
        })}
      </div>

      {/* Bottom Lifelines Bar */}
      <div className="glass-card p-3 rounded-2xl flex items-center justify-around gap-2 mt-2">
        <button
          onClick={handleFiftyFifty}
          disabled={isAnswered || disabledOptions.length > 0}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#FCD34D] disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-[#1E293B] border border-[#E5A93B]/20 text-[#FCD34D]">
            <HelpCircle className="w-4 h-4" />
          </div>
          <span>50:50 ({profile.lifelines.fiftyFifty})</span>
        </button>

        <button
          onClick={handleExtraTime}
          disabled={isAnswered}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#38BDF8] disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-[#1E293B] border border-[#0EA5E9]/20 text-[#38BDF8]">
            <PlusCircle className="w-4 h-4" />
          </div>
          <span>+15 ثانية ({profile.lifelines.extraTime})</span>
        </button>

        <button
          onClick={handleSkip}
          disabled={isAnswered}
          className="flex flex-col items-center gap-1 text-[11px] font-bold text-[#94A3B8] hover:text-[#10B981] disabled:opacity-30"
        >
          <div className="p-2 rounded-xl bg-[#1E293B] border border-[#10B981]/20 text-[#10B981]">
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
              className="w-full max-w-md bg-gradient-to-b from-[#1E293B] to-[#0B0F19] border border-[#E5A93B]/40 rounded-3xl p-5 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-[#E5A93B]/20 border border-[#E5A93B]/50 flex items-center justify-center mx-auto mb-3 text-[#FCD34D]">
                <Lightbulb className="w-6 h-6" />
              </div>

              <span className="text-xs font-black px-3 py-1 rounded-full bg-[#E5A93B]/20 text-[#FCD34D] border border-[#E5A93B]/30">
                💡 معلومة ع الماشي
              </span>

              <p className="text-sm text-[#F8FAFC] leading-relaxed my-4 text-right bg-[#0F172A]/70 p-4 rounded-2xl border border-white/5">
                {question.funFact}
              </p>

              <button
                onClick={handleFactContinue}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] font-black text-sm shadow-lg transition-transform active:scale-95"
              >
                استمر في الرحلة 🧭
              </button>
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
              className="w-full max-w-sm bg-gradient-to-b from-[#131C2E] to-[#0B0F19] border border-[#10B981]/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#10B981]/20 border-2 border-[#10B981] flex items-center justify-center mx-auto mb-3 text-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">أحسنت يا بطل! 🎉</h3>
              <p className="text-xs text-[#94A3B8] mt-1">أجبت بشكل صحيح واجتزت المرحلة بنجاح</p>

              {/* 3 Stars Rating */}
              <div className="flex items-center justify-center gap-2 my-4">
                {[1, 2, 3].map((starNum) => (
                  <Star
                    key={starNum}
                    className={`w-7 h-7 ${
                      earnedStars >= starNum
                        ? 'text-[#E5A93B] fill-[#E5A93B] drop-shadow-[0_0_10px_#E5A93B]'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="p-3 rounded-2xl bg-[#E5A93B]/10 border border-[#E5A93B]/20 text-[#FCD34D] font-extrabold text-sm mb-5">
                +{question.rewardDinars} دينار ليبي مكافأة 💰
              </div>

              <button
                onClick={onFinish}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#059669] text-white font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-transform active:scale-95"
              >
                العودة للخريطة 🗺️
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
