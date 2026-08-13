import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SpeedBlitzQuestion } from '../../types/quiz';
import type { Stage } from '../../types/map';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { Timer, ArrowRight, Zap, Check, X, Trophy, Star } from 'lucide-react';

const blitzQuestionBank: SpeedBlitzQuestion[] = [
  { id: 'sb_1', statement: 'طرابلس كانت تُعرف قديماً عند الفينيقيين باسم "أويا".', isCorrect: true, category: 'history', explanation: 'صحيح، أويا هي إحدى المدن الثلاث التاريخية.' },
  { id: 'sb_2', statement: 'مدينة لبدة الكبرى تقع في أقصى جنوب الصحراء الليبية.', isCorrect: false, category: 'history', explanation: 'خطأ، لبدة تقع على ساحل البحر الأبيض المتوسط قرب مدينة الخمس.' },
  { id: 'sb_3', statement: 'البازين يُعرك باستخدام أداة خشبية تقليدية تسمى "المغرف".', isCorrect: true, category: 'food_traditions', explanation: 'صحيح، المغرف هو العصا الخشبية المخصصة لعرك البازين.' },
  { id: 'sb_4', statement: 'المنتخب الليبي لُقب بـ "نسور قرطاج".', isCorrect: false, category: 'sports', explanation: 'خطأ، لقب منتخب ليبيا هو "فرسان المتوسط".' },
  { id: 'sb_5', statement: 'عين الفرس تقع في واحة مدينة غدامس التاريخية.', isCorrect: true, category: 'geography', explanation: 'صحيح، عين الفرس هي النبع الأثري الشهير في غدامس.' },
  { id: 'sb_6', statement: 'سيبتيموس سيفيروس وُلد في روما ولم يزر ليبيا مطلقاً.', isCorrect: false, category: 'history', explanation: 'خطأ، سيبتيموس سيفيروس إمبراطور روماني وُلد في مدينة لبدة الكبرى.' },
  { id: 'sb_7', statement: 'حضارة الجرمنت القديمة نشأت في إقليم فزان بالجنوب الليبي.', isCorrect: true, category: 'history', explanation: 'صحيح، عاصمتهم كانت مدينة جرما بوادي الآجال.' },
  { id: 'sb_8', statement: 'الجرد الليبي التقليدي يُصنع من الحرير الطبيعي الخفيف فقط.', isCorrect: false, category: 'food_traditions', explanation: 'خطأ، الجرد الأصيل يُنسج من الصوف الأبيض الفاخر.' },
];

interface SpeedBlitzProps {
  stage: Stage;
  cityId: string;
  onFinish: () => void;
}

export const SpeedBlitz: React.FC<SpeedBlitzProps> = ({ stage, cityId, onFinish }) => {
  const { addDinars, recordSpeedScore } = useGameStore();
  const { completeStage } = useMapStore();

  const [timeLeft, setTimeLeft] = useState<number>(45);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [score, setScore] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  useEffect(() => {
    if (isFinished || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isFinished, timeLeft]);

  const handleGameOver = () => {
    setIsFinished(true);
    recordSpeedScore(score);
    sfx.playVictory();

    const stars = score >= 5 ? 3 : score >= 3 ? 2 : 1;
    const reward = score * 15 + stage.rewardDinars;
    addDinars(reward);
    completeStage(cityId, stage.id, stars);

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
    });
  };

  const handleAnswer = (userChoice: boolean) => {
    if (isFinished) return;
    const q = blitzQuestionBank[currentIdx % blitzQuestionBank.length];
    const isCorrect = userChoice === q.isCorrect;

    if (isCorrect) {
      sfx.playCorrect();
      setScore((s) => s + 1);
      setTimeLeft((t) => t + 3); // Bonus time for correct answer
      setFeedback('correct');
    } else {
      sfx.playWrong();
      setTimeLeft((t) => Math.max(1, t - 4)); // Penalty
      setFeedback('wrong');
    }

    setTimeout(() => {
      setFeedback(null);
      if (currentIdx + 1 >= blitzQuestionBank.length) {
        handleGameOver();
      } else {
        setCurrentIdx((idx) => idx + 1);
      }
    }, 300);
  };

  const currentQ = blitzQuestionBank[currentIdx % blitzQuestionBank.length];

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onFinish}
          className="flex items-center gap-1 text-xs font-bold text-[#94A3B8] hover:text-white bg-[#131C2E] px-3 py-1.5 rounded-xl border border-white/10"
        >
          <ArrowRight className="w-4 h-4" />
          <span>انسحاب</span>
        </button>

        <div className="flex items-center gap-1 text-[#FCD34D] font-extrabold text-sm bg-[#1E293B] px-3 py-1.5 rounded-2xl border border-[#E5A93B]/30">
          <Zap className="w-4 h-4 text-[#E5A93B]" />
          <span>النقاط: {score}</span>
        </div>

        <div className="flex items-center gap-1 text-[#F43F5E] font-black text-sm bg-[#1E293B] px-3 py-1.5 rounded-2xl border border-[#F43F5E]/30">
          <Timer className="w-4 h-4" />
          <span>{timeLeft} ثانية</span>
        </div>
      </div>

      {/* Speed Statement Card */}
      <motion.div
        key={currentQ.id}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`glass-panel p-6 rounded-3xl text-center min-h-[160px] flex flex-col items-center justify-center transition-colors relative overflow-hidden ${
          feedback === 'correct'
            ? 'bg-[#10B981]/25 border-[#10B981]'
            : feedback === 'wrong'
            ? 'bg-[#F43F5E]/25 border-[#F43F5E]'
            : ''
        }`}
      >
        <span className="text-xs font-bold text-[#38BDF8] mb-2">
          سؤال {currentIdx + 1} من {blitzQuestionBank.length}
        </span>
        <h2 className="text-lg sm:text-xl font-black text-[#F8FAFC] leading-relaxed">
          "{currentQ.statement}"
        </h2>
      </motion.div>

      {/* True / False Big Action Buttons */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        <button
          onClick={() => handleAnswer(true)}
          disabled={isFinished}
          className="py-5 rounded-3xl bg-gradient-to-b from-[#10B981] to-[#059669] text-white font-black text-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-transform active:scale-95"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>صح</span>
        </button>

        <button
          onClick={() => handleAnswer(false)}
          disabled={isFinished}
          className="py-5 rounded-3xl bg-gradient-to-b from-[#F43F5E] to-[#BE123C] text-white font-black text-xl flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(244,63,94,0.35)] transition-transform active:scale-95"
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
              className="w-full max-w-sm bg-gradient-to-b from-[#131C2E] to-[#0B0F19] border border-[#E5A93B]/50 rounded-3xl p-6 shadow-2xl text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[#E5A93B]/20 border-2 border-[#E5A93B] flex items-center justify-center mx-auto mb-3 text-[#FCD34D]">
                <Trophy className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-black text-white">انتهى سباق السرعة! ⏱️</h3>
              <p className="text-xs text-[#94A3B8] mt-1">حققت {score} إجابات صحيحة</p>

              <div className="flex items-center justify-center gap-1.5 my-3">
                {[1, 2, 3].map((s) => (
                  <Star
                    key={s}
                    className={`w-6 h-6 ${
                      (score >= 5 ? 3 : score >= 3 ? 2 : 1) >= s
                        ? 'text-[#E5A93B] fill-[#E5A93B]'
                        : 'text-white/20'
                    }`}
                  />
                ))}
              </div>

              <div className="p-2.5 rounded-2xl bg-[#E5A93B]/10 border border-[#E5A93B]/20 text-[#FCD34D] font-extrabold text-xs mb-4">
                +{score * 15 + stage.rewardDinars} دينار ليبي مكافأة 💰
              </div>

              <button
                onClick={onFinish}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] font-black text-sm shadow-lg"
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
