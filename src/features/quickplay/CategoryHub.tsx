import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { historyQuestions } from '../../data/questions/history';
import { dialectQuestions } from '../../data/questions/dialects';
import { sportsQuestions } from '../../data/questions/sports';
import { foodTraditionsQuestions } from '../../data/questions/foodTraditions';
import { generalArabQuestions } from '../../data/questions/generalArab';
import type { QuizCategory, TriviaQuestion } from '../../types/quiz';
import { QuizScreen } from '../quiz/QuizScreen';
import { PassAndPlayScreen } from '../multiplayer/PassAndPlayScreen';
import { useGameStore } from '../../store/useGameStore';
import { sfx } from '../../audio/soundEffects';
import confetti from 'canvas-confetti';
import { BookOpen, MessageSquareQuote, Trophy, Utensils, Globe, Sparkles, Play, Star, RotateCcw, Swords } from 'lucide-react';

const QUESTIONS_PER_ROUND = 5;

/** Flat completion bonus plus 10 dinars for every question actually answered right. */
const roundCompletionBonus = (correctCount: number) => 25 + correctCount * 10;

/** Round summary stars: 5/5 earns three, a clear majority two, anything else one. */
const roundStars = (correctCount: number, total: number) => {
  if (total === 0) return 1;
  const ratio = correctCount / total;
  if (ratio >= 1) return 3;
  if (ratio >= 0.6) return 2;
  return 1;
};

interface CategoryConfig {
  id: QuizCategory;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  questions: TriviaQuestion[];
}

// Hoisted out of the component: this list never depends on props or state, so
// rebuilding it (and its icon elements) on every render is pure waste.
const categories: CategoryConfig[] = [
    {
      id: 'history',
      title: 'تاريخ وآثار ليبيا',
      description: 'لبدة، قورينا، السرايا الحمراء، وشخصيات النضال الوطني',
      icon: <BookOpen className="w-6 h-6 text-[#E5A93B]" />,
      color: 'border-[#E5A93B]/40 hover:border-[#E5A93B]',
      questions: historyQuestions,
    },
    {
      id: 'dialects',
      title: 'لهجات وأمثال شعبية',
      description: 'إكمال الأمثال والحكم الشعبية ومصطلحات اللهجة الليبية',
      icon: <MessageSquareQuote className="w-6 h-6 text-[#0EA5E9]" />,
      color: 'border-[#0EA5E9]/40 hover:border-[#0EA5E9]',
      questions: dialectQuestions,
    },
    {
      id: 'sports',
      title: 'كورة ورياضة ليبية',
      description: 'الدوري الليبي، الديربيات، وأساطير فرسان المتوسط',
      icon: <Trophy className="w-6 h-6 text-[#10B981]" />,
      color: 'border-[#10B981]/40 hover:border-[#10B981]',
      questions: sportsQuestions,
    },
    {
      id: 'food_traditions',
      title: 'المطبخ والعادات التراثية',
      description: 'البازين، الرشتة، المقروض، الشاهي العالة، والأزياء',
      icon: <Utensils className="w-6 h-6 text-[#F59E0B]" />,
      color: 'border-[#F59E0B]/40 hover:border-[#F59E0B]',
      questions: foodTraditionsQuestions,
    },
    {
      id: 'general_arab',
      title: 'ثقافة عامة وإسلامية',
      description: 'جغرافيا، معالم إسلامية، علوم، وأدب عربي',
      icon: <Globe className="w-6 h-6 text-[#A855F7]" />,
      color: 'border-[#A855F7]/40 hover:border-[#A855F7]',
      questions: generalArabQuestions,
    },
];

export const CategoryHub: React.FC = () => {
  const { addDinars } = useGameStore();

  const [activeCategory, setActiveCategory] = useState<QuizCategory | null>(null);
  const [isPassAndPlayActive, setIsPassAndPlayActive] = useState<boolean>(false);
  const [roundQuestions, setRoundQuestions] = useState<TriviaQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [roundScore, setRoundScore] = useState<number>(0);
  const [isRoundFinished, setIsRoundFinished] = useState<boolean>(false);

  const handleStartCategory = (catId: QuizCategory) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat || cat.questions.length === 0) return;

    // Pick unique shuffled questions for this round
    const shuffled = [...cat.questions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, Math.min(QUESTIONS_PER_ROUND, shuffled.length));
    setActiveCategory(catId);
    setRoundQuestions(selected);
    setCurrentQuestionIdx(0);
    setRoundScore(0);
    setIsRoundFinished(false);
  };

  const handleQuestionResolved = ({ isCorrect }: { isCorrect: boolean }) => {
    if (isCorrect) setRoundScore((s) => s + 1);
  };

  const handleQuestionFinish = () => {
    if (currentQuestionIdx + 1 < roundQuestions.length) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Round completed!
      setIsRoundFinished(true);
      sfx.playVictory();
      addDinars(roundCompletionBonus(roundScore));

      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#E5A93B', '#FCD34D', '#10B981', '#38BDF8'],
      });
    }
  };

  const handleExitRound = () => {
    setActiveCategory(null);
    setRoundQuestions([]);
    setCurrentQuestionIdx(0);
    setIsRoundFinished(false);
  };

  if (activeCategory && roundQuestions.length > 0) {
    if (isRoundFinished) {
      const currentCatObj = categories.find((c) => c.id === activeCategory);
      return (
        <div className="flex flex-col items-center justify-center p-4 max-w-sm mx-auto text-center pt-8">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-gradient-to-b from-[#131C2E] to-[#0B0F19] border border-[#E5A93B]/50 rounded-3xl p-6 shadow-2xl"
          >
            <div className="w-16 h-16 rounded-full bg-[#E5A93B]/20 border-2 border-[#E5A93B] flex items-center justify-center mx-auto mb-3 text-[#FCD34D]">
              <Trophy className="w-8 h-8" />
            </div>

            <h3 className="text-xl font-black text-white">اكتملت الجولة الثقافية! 🎉</h3>
            <p className="text-xs text-[#94A3B8] mt-1">
              أجبت بشكل صحيح على {roundScore} من {roundQuestions.length} في مجال:{' '}
              {currentCatObj?.title}
            </p>

            <div className="flex items-center justify-center gap-1.5 my-4">
              {[1, 2, 3].map((s) => (
                <Star
                  key={s}
                  className={`w-6 h-6 ${
                    roundStars(roundScore, roundQuestions.length) >= s
                      ? 'text-[#E5A93B] fill-[#E5A93B]'
                      : 'text-white/20'
                  }`}
                />
              ))}
            </div>

            <div className="p-3 rounded-2xl bg-[#E5A93B]/10 border border-[#E5A93B]/20 text-[#FCD34D] font-extrabold text-sm mb-5">
              +{roundCompletionBonus(roundScore)} دينار ليبي مكافأة إتمام الجولة 💰
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleStartCategory(activeCategory)}
                className="w-full py-3 rounded-2xl bg-[#1E293B] border border-white/10 hover:border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>جولة جديدة في نفس المجال</span>
              </button>

              <button
                onClick={handleExitRound}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] font-black text-xs shadow-lg"
              >
                العودة لصالة التصنيفات
              </button>
            </div>
          </motion.div>
        </div>
      );
    }

    const currentQ = roundQuestions[currentQuestionIdx];
    return (
      <div className="flex flex-col gap-2">
        {/* Round Progress Tracker */}
        <div className="max-w-lg mx-auto w-full px-3 pt-1 flex items-center justify-between text-xs font-bold text-[#94A3B8]">
          <span>جولة اللعب السريع ({currentQuestionIdx + 1} من {roundQuestions.length})</span>
          <div className="w-32 bg-white/10 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[#E5A93B] h-full transition-all duration-300"
              style={{ width: `${((currentQuestionIdx + 1) / roundQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Keyed by question: without a fresh instance per question the answered
            state, timer and revealed options leak into the next question. */}
        <QuizScreen
          key={currentQ.id}
          stage={{
            id: `quick_stage_${currentQuestionIdx}`,
            stageNumber: currentQuestionIdx + 1,
            title: categories.find((c) => c.id === activeCategory)?.title || 'لعب حر',
            type: 'multiple_choice',
            starsEarned: 0,
            isUnlocked: true,
            rewardDinars: currentQ.rewardDinars,
          }}
          cityId="quickplay"
          question={currentQ}
          onFinish={handleQuestionFinish}
          onResolved={handleQuestionResolved}
        />
      </div>
    );
  }

  if (isPassAndPlayActive) {
    return <PassAndPlayScreen onBack={() => setIsPassAndPlayActive(false)} />;
  }

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-1 select-none">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E5A93B]" />
          أنماط اللعب والتصنيفات
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          اختر مجالك المفضل للعب الفردي أو نافس صديقك في التحدي الثنائي
        </p>
      </div>

      {/* 2-Player Pass & Play Featured Banner.
          A real <button>: as a clickable <div> it was unreachable by keyboard
          and wrapped another <button>, which is invalid nesting. */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          sfx.playTap();
          setIsPassAndPlayActive(true);
        }}
        className="w-full text-right glass-panel p-4 rounded-3xl cursor-pointer border-2 border-[#E5A93B]/60 bg-gradient-to-r from-[#E5A93B]/20 via-[#131C2E] to-[#0EA5E9]/20 shadow-[0_0_25px_rgba(229,169,59,0.25)] flex items-center justify-between gap-3 relative overflow-hidden"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E5A93B] to-[#F59E0B] text-[#0B0F19] flex items-center justify-center shrink-0 shadow-lg">
            <Swords className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white">التحدي الثنائي (Pass & Play)</h3>
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#10B981] text-[#0B0F19] font-black">
                جديد 🔥
              </span>
            </div>
            <p className="text-xs text-[#CBD5E1] mt-0.5">
              مبارزة 1 ضد 1 على نفس الجهاز بالتناوب وتتويج الفائز
            </p>
          </div>
        </div>

        <span className="px-3 py-1.5 rounded-xl bg-[#E5A93B] text-[#0B0F19] font-black text-xs shrink-0 shadow-md">
          تحدي ⚔️
        </span>
      </motion.button>

      {/* Categories List Header */}
      <h3 className="text-xs font-bold text-[#94A3B8] px-1">تصنيفات الأسئلة الفردية (5 أسئلة):</h3>

      <div className="space-y-2.5">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => handleStartCategory(cat.id)}
            className={`w-full text-right glass-card-interactive p-3.5 rounded-3xl cursor-pointer flex items-center justify-between gap-3 border ${cat.color}`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">{cat.title}</h3>
                <p className="text-[11px] text-[#94A3B8] line-clamp-1 mt-0.5">{cat.description}</p>
                <span className="text-[10px] font-semibold text-[#FCD34D] mt-0.5 inline-block">
                  {cat.questions.length} أسئلة موثقة • جولة 5 أسئلة
                </span>
              </div>
            </div>

            <span className="w-9 h-9 rounded-2xl bg-[#E5A93B] text-[#0B0F19] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(229,169,59,0.3)]">
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
