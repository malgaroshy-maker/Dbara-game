import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { allQuestions } from '../../data/questions';
import { useGameStore } from '../../store/useGameStore';
import { useMapStore } from '../../store/useMapStore';
import { sfx } from '../../audio/soundEffects';
import {
  BookOpen,
  Search,
  Share2,
  Check,
  Sparkles,
  Lock,
  Compass,
  Filter,
  Bookmark,
  Quote,
  MapPin,
  Flame,
} from 'lucide-react';
import type { QuizCategory } from '../../types/quiz';

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: string; accent: string }
> = {
  all: { label: 'الكل', icon: '✨', accent: 'border-gold-400/40 text-gold-300' },
  history: { label: 'تاريخ', icon: '🏛️', accent: 'border-amber-500/40 text-amber-300' },
  dialects: { label: 'لهجات', icon: '🗣️', accent: 'border-rose/40 text-rose' },
  food_traditions: { label: 'مأكولات وتقاليد', icon: '🍲', accent: 'border-flame/40 text-flame' },
  geography: { label: 'جغرافيا', icon: '🗺️', accent: 'border-sea-500/40 text-sea-300' },
  islamic: { label: 'إسلاميات', icon: '🌙', accent: 'border-emerald-500/40 text-emerald-300' },
  literature: { label: 'أدب ولغة', icon: '📜', accent: 'border-purple-500/40 text-purple-300' },
  sports: { label: 'رياضة', icon: '⚽', accent: 'border-sky-500/40 text-sky-300' },
  science: { label: 'علوم وطبيعة', icon: '🔬', accent: 'border-teal-500/40 text-teal-300' },
  general_arab: { label: 'ثقافة عامة', icon: '🌍', accent: 'border-indigo-500/40 text-indigo-300' },
};

export const KnowledgeNotebookTab: React.FC = () => {
  const { seenQuestionIds, setMode } = useGameStore();
  const { cities } = useMapStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const seenIdsSet = useMemo(() => new Set(seenQuestionIds), [seenQuestionIds]);

  // Map cityId -> cityName
  const cityNameMap = useMemo(() => {
    const map = new Map<string, string>();
    cities.forEach((c) => {
      map.set(c.id, c.arabicName);
    });
    return map;
  }, [cities]);

  // Questions with fun facts that the user has encountered
  const unlockedItems = useMemo(() => {
    return allQuestions
      .filter((q) => seenIdsSet.has(q.id) && q.funFact?.trim())
      .map((q) => ({
        id: q.id,
        category: q.category,
        cityId: q.cityId,
        cityName: q.cityId ? cityNameMap.get(q.cityId) : undefined,
        question: q.question,
        funFact: q.funFact,
        source: q.source,
        difficulty: q.difficulty,
      }));
  }, [seenIdsSet, cityNameMap]);

  const totalFactsCount = allQuestions.length;
  const unlockedCount = unlockedItems.length;
  const progressPercent = Math.round((unlockedCount / Math.max(1, totalFactsCount)) * 100);

  // Filtered by search and category
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return unlockedItems.filter((item) => {
      const matchesCategory =
        selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!query) return true;

      const inFact = item.funFact.toLowerCase().includes(query);
      const inQuestion = item.question.toLowerCase().includes(query);
      const inCity = item.cityName ? item.cityName.toLowerCase().includes(query) : false;
      const inSource = item.source ? item.source.toLowerCase().includes(query) : false;

      return inFact || inQuestion || inCity || inSource;
    });
  }, [unlockedItems, selectedCategory, searchQuery]);

  const handleShare = async (item: (typeof unlockedItems)[number]) => {
    sfx.playTap();
    const textToShare = `💡 معلومة ع الماشي من لعبة دبارة:\n\n"${item.funFact}"\n\n📌 عن سؤال: ${item.question}\n${
      item.source ? `📚 المصدر: ${item.source}\n` : ''
    }🇱🇾 اكتشف تراث ليبيا في دبارة!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'معلومة ع الماشي — دبارة',
          text: textToShare,
        });
        return;
      } catch {
        // Fallback to clipboard if share was cancelled or failed
      }
    }

    if (navigator.clipboard) {
      await navigator.clipboard.writeText(textToShare);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress & Header Banner */}
      <div className="glass-panel p-4 rounded-3xl relative overflow-hidden border border-gold-400/30">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gold-400 mb-1">
              <BookOpen className="w-4 h-4" />
              <span>دفتر المعارف والتراث الليبي</span>
            </div>
            <h3 className="text-base font-black text-white">
              «معلومة ع الماشي»
            </h3>
            <p className="text-xs text-ink-300 mt-1 leading-relaxed">
              كل معلومة تمر بك أثناء رحلتك تُحفظ هنا في سجلك الدائم للرجوع إليها ومشاركتها.
            </p>
          </div>

          <div className="text-center shrink-0 bg-night-800/80 p-2.5 rounded-2xl border border-white/10">
            <span className="block text-lg font-black gold-gradient-text">
              {unlockedCount}
            </span>
            <span className="text-[10px] text-ink-400 font-bold">
              من {totalFactsCount} معلومة
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-ink-400 font-bold">
            <span>نسبة الاستكشاف المعرفي</span>
            <span className="text-gold-300">{progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-night-950/80 rounded-full overflow-hidden border border-white/5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-gold-400 via-flame to-oasis-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="ابحث في المعلومات، الأسئلة، أو المدن والمصادر…"
          className="w-full bg-night-800/90 border border-white/10 focus:border-gold-400/50 rounded-2xl py-3 pr-10 pl-4 text-xs sm:text-sm text-white placeholder:text-ink-500 focus:outline-none transition-all"
        />
        <Search className="w-4 h-4 text-ink-400 absolute right-3.5 top-3.5 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute left-3 top-3 text-[11px] font-bold text-ink-400 hover:text-white bg-white/5 px-2 py-0.5 rounded-lg"
          >
            مسح
          </button>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none -mx-1 px-1">
        {Object.entries(CATEGORY_MAP).map(([catKey, { label, icon }]) => {
          const isSelected = selectedCategory === catKey;
          return (
            <button
              key={catKey}
              onClick={() => {
                sfx.playTap();
                setSelectedCategory(catKey);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                isSelected
                  ? 'bg-gold-400 text-night-900 border-gold-400 shadow-gold-glow-sm scale-105'
                  : 'bg-night-800/80 text-ink-300 border-white/10 hover:border-white/20'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Facts List */}
      {unlockedCount === 0 ? (
        /* Empty State: Hasn't seen any questions yet */
        <div className="glass-panel p-6 rounded-3xl text-center space-y-3 border border-white/5">
          <div className="w-14 h-14 rounded-full bg-gold-400/10 border border-gold-400/30 flex items-center justify-center mx-auto text-gold-300">
            <Compass className="w-7 h-7 animate-pulse" />
          </div>
          <h4 className="text-base font-black text-white">دفترك بانتظار أولى حكاياتك!</h4>
          <p className="text-xs text-ink-300 max-w-xs mx-auto leading-relaxed">
            لم تُسجّل أي معلومة بعد. ابدأ اللعب واستكشف مراحل الخريطة أو العب جولة سريعة لتجمع المعارف التراثية وتملأ دفترك.
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <button
              onClick={() => {
                sfx.playTap();
                setMode('map');
              }}
              className="px-4 py-2 rounded-2xl bg-gold-400 text-night-900 font-black text-xs shadow-gold-glow"
            >
              استكشف الخريطة 🗺️
            </button>
            <button
              onClick={() => {
                sfx.playTap();
                setMode('quickplay');
              }}
              className="px-4 py-2 rounded-2xl bg-night-700 text-ink-200 border border-white/10 font-bold text-xs hover:text-white"
            >
              لعب سريع ⚡
            </button>
          </div>
        </div>
      ) : filteredItems.length === 0 ? (
        /* No search results */
        <div className="glass-card p-6 rounded-2xl text-center space-y-2 text-ink-400 text-xs">
          <Filter className="w-6 h-6 mx-auto opacity-50" />
          <p>لا توجد معلومات مطابقة لبحثك في التصنيف المحدد.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-gold-300 font-bold underline text-xs"
          >
            إعادة ضبط التصفية
          </button>
        </div>
      ) : (
        /* Fact Cards */
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[11px] text-ink-400 font-bold px-1">
            <span>عرض {filteredItems.length} معلومة</span>
            {searchQuery && <span>نتائج البحث عن "{searchQuery}"</span>}
          </div>

          <AnimatePresence>
            {filteredItems.map((item, idx) => {
              const catMeta = CATEGORY_MAP[item.category] ?? CATEGORY_MAP.all;
              const isCopied = copiedId === item.id;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className="glass-card p-4 rounded-2xl space-y-2.5 border border-white/10 relative group hover:border-gold-400/30 transition-all shadow-md"
                >
                  {/* Card Header: Category & City Tag */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold border bg-night-900/60 ${catMeta.accent}`}
                      >
                        <span>{catMeta.icon}</span>
                        <span>{catMeta.label}</span>
                      </span>

                      {item.cityName && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-sea-500/10 text-sea-300 border border-sea-500/20">
                          <MapPin className="w-3 h-3" />
                          <span>{item.cityName}</span>
                        </span>
                      )}
                    </div>

                    {/* Share / Copy Button */}
                    <button
                      onClick={() => handleShare(item)}
                      title="مشاركة أو نسخ المعلومة"
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 border ${
                        isCopied
                          ? 'bg-oasis-500/20 text-oasis-300 border-oasis-500/40'
                          : 'bg-night-800 text-ink-300 hover:text-white border-white/10 hover:border-gold-400/40'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-oasis-400" />
                          <span>تم النسخ!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>مشاركة</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Fact Text */}
                  <div className="relative pr-3 border-r-2 border-gold-400/40">
                    <p className="text-xs sm:text-sm font-bold text-ink-100 leading-relaxed text-right">
                      {item.funFact}
                    </p>
                  </div>

                  {/* Question Context & Source Footer */}
                  <div className="pt-1.5 border-t border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px] text-ink-400">
                    <span className="truncate">
                      <strong className="text-ink-300">السؤال: </strong>
                      {item.question}
                    </span>

                    {item.source && (
                      <span className="shrink-0 text-[10px] text-gold-400/80 bg-night-950/60 px-2 py-0.5 rounded-md border border-white/5">
                        📚 {item.source}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
