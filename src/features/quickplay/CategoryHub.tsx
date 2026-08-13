import React, { useState } from 'react';
import { historyQuestions } from '../../data/questions/history';
import { dialectQuestions } from '../../data/questions/dialects';
import { sportsQuestions } from '../../data/questions/sports';
import { foodTraditionsQuestions } from '../../data/questions/foodTraditions';
import { generalArabQuestions } from '../../data/questions/generalArab';
import type { QuizCategory, TriviaQuestion } from '../../types/quiz';
import { QuizScreen } from '../quiz/QuizScreen';
import { BookOpen, MessageSquareQuote, Trophy, Utensils, Globe, Sparkles, Play } from 'lucide-react';

export const CategoryHub: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<QuizCategory | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<TriviaQuestion | null>(null);

  const categories: {
    id: QuizCategory;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    questions: TriviaQuestion[];
  }[] = [
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

  const handleStartCategory = (catId: QuizCategory) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat || cat.questions.length === 0) return;
    const randomQ = cat.questions[Math.floor(Math.random() * cat.questions.length)];
    setActiveCategory(catId);
    setActiveQuestion(randomQ);
  };

  if (activeQuestion && activeCategory) {
    return (
      <QuizScreen
        stage={{
          id: 'quick_stage',
          stageNumber: 1,
          title: categories.find((c) => c.id === activeCategory)?.title || 'لعب حر',
          type: 'multiple_choice',
          starsEarned: 0,
          isUnlocked: true,
          rewardDinars: activeQuestion.rewardDinars,
        }}
        cityId="quickplay"
        question={activeQuestion}
        onFinish={() => {
          setActiveQuestion(null);
          setActiveCategory(null);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 pb-20 max-w-lg mx-auto w-full px-3 pt-1">
      <div>
        <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#E5A93B]" />
          لعب سريع حسب التصنيفات
        </h2>
        <p className="text-xs text-[#94A3B8] mt-0.5">
          اختر مجالك المفضل وابدأ جولة أسئلة مباشرة لاختبار معلوماتك
        </p>
      </div>

      <div className="space-y-3 mt-1">
        {categories.map((cat) => (
          <div
            key={cat.id}
            onClick={() => handleStartCategory(cat.id)}
            className={`glass-card-interactive p-4 rounded-3xl cursor-pointer flex items-center justify-between gap-3 border ${cat.color}`}
          >
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0">
                {cat.icon}
              </div>
              <div>
                <h3 className="text-base font-bold text-white">{cat.title}</h3>
                <p className="text-xs text-[#94A3B8] line-clamp-1 mt-0.5">{cat.description}</p>
                <span className="text-[10px] font-semibold text-[#FCD34D] mt-1 inline-block">
                  {cat.questions.length} أسئلة موثقة
                </span>
              </div>
            </div>

            <button className="w-10 h-10 rounded-2xl bg-[#E5A93B] text-[#0B0F19] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(229,169,59,0.3)]">
              <Play className="w-4 h-4 fill-current ml-0.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
